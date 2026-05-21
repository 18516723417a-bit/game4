import {
  EXPRESSWAY_MAP,
  TRANSPORT_HIGHWAY,
  TRANSPORT_HUBS,
  WORLD_SETTINGS,
  getExpresswayRampPaths,
  getExpresswayRoutePoints
} from '../world/worldConfig.js';

const ROUTE_WIDTH = 72;
const WAYPOINT_REACHED_DISTANCE = 34;
const GRAPH_NODE_OFFSET = WORLD_SETTINGS.chunkSize / 2;
const MAX_CONNECT_DISTANCE = WORLD_SETTINGS.chunkSize * 1.75;
const ROAD_WEIGHTS = {
  local: 1.18,
  main: 1,
  highway: 0.58,
  expressway: 0.66,
  ramp: 0.86,
  access: 0.96
};
const HUB_ACCESS_RADIUS = 950;
const TRANSPORT_ROUTE_TYPES = new Set(['airport', 'station', 'toll']);
const HUB_ACCESS_NODES = [
  {
    id: 'airport-gate',
    type: 'airport',
    point: TRANSPORT_HUBS.airport.gate
  },
  {
    id: 'station-gate',
    type: 'station',
    point: TRANSPORT_HUBS.trainStation.gate
  }
];

let cachedBaseGraph = null;

export function createNavigationRoute(playerPosition, navigationTarget, loadedChunks = []) {
  if (!playerPosition || !navigationTarget?.position) return null;

  const start = toPoint(playerPosition);
  const target = toPoint(navigationTarget.position);
  const targetType = navigationTarget.type ?? 'custom';
  const graph = createWorkingGraph(getBaseRoadGraph());
  const startAnchor = snapToLoadedRoad(start, loadedChunks) ?? snapToCityGrid(start);
  const targetAnchor = snapToLoadedRoad(target, loadedChunks) ?? snapDestinationToAccess(target, targetType);
  const startId = addVirtualNode(graph, 'route-start', startAnchor);
  const targetId = addVirtualNode(graph, 'route-target', targetAnchor);

  connectVirtualNode(graph, startId, startAnchor, targetType);
  connectVirtualNode(graph, targetId, targetAnchor, targetType);
  connectDestinationAccess(graph, targetId, targetType, targetAnchor);

  const pathIds = findAStarPath(graph, startId, targetId);
  const pathPoints = pathIds.length > 0
    ? pathIds.map((id) => graph.nodes.get(id)).filter(Boolean).map((node) => node.point)
    : createFallbackRoute(startAnchor, targetAnchor, targetType);
  const finalPoints = simplifyRoutePoints(pathPoints);
  const segments = createRouteSegments(finalPoints);

  return {
    id: navigationTarget.id ?? 'navigation',
    target: navigationTarget,
    points: finalPoints,
    segments,
    distance: segments.reduce((total, segment) => total + segment.length, 0),
    routeType: pathIds.length > 0 ? 'astar' : 'fallback',
    tollCount: countPathTolls(pathIds)
  };
}

export function getNavigationRouteFeatures(route) {
  if (!route?.segments?.length) return [];

  return route.segments.map((segment, index) => ({
    id: `${route.id}-segment-${index}`,
    kind: 'navigation',
    type: 'navigation',
    centerX: (segment.start.x + segment.end.x) / 2,
    centerZ: (segment.start.z + segment.end.z) / 2,
    length: segment.length,
    rotation: Math.atan2(segment.end.z - segment.start.z, segment.end.x - segment.start.x),
    width: ROUTE_WIDTH
  }));
}

export function getNavigationInfoForRoute(position, heading, route) {
  if (!position || !route?.segments?.length) return null;

  const nearest = getNearestRouteProgress(position, route);
  const remainingDistance = Math.max(0, route.distance - nearest.distanceFromStart);
  const nextPoint = getNextRoutePoint(position, route, nearest);
  const dx = nextPoint.x - position.x;
  const dz = nextPoint.z - position.z;
  const bearing = Math.atan2(dx, dz);
  const relativeBearing = normalizeAngle(bearing - heading);
  const nextTurn = getNextTurn(route, nearest);

  return {
    targetLabel: route.target.shortLabel ?? route.target.label,
    distance: remainingDistance,
    distanceLabel: formatNavigationDistance(remainingDistance),
    directionLabel: getRouteDirectionLabel(relativeBearing, nextTurn, remainingDistance),
    maneuverType: getRouteManeuverType(nextTurn, remainingDistance),
    maneuverLabel: getRouteManeuverLabel(nextTurn, remainingDistance),
    nextTurnDistanceLabel: nextTurn ? formatNavigationDistance(nextTurn.distance) : null,
    nextTurnLabel: nextTurn?.label ?? 'Continue',
    relativeBearing,
    routeType: route.routeType,
    tollCount: route.tollCount ?? 0
  };
}

export function getAutopilotInputForRoute(position, heading, speed, route, options = {}) {
  if (!options.enabled || !position || !route?.segments?.length) return createNeutralAutopilotInput();

  const nearest = getNearestRouteProgress(position, route);
  const remainingDistance = Math.max(0, route.distance - nearest.distanceFromStart);

  if (remainingDistance < 20) {
    const needsStop = Math.abs(speed ?? 0) > 1.2;

    return {
      ...createNeutralAutopilotInput(),
      forward: needsStop,
      backward: needsStop
    };
  }

  const speedAbs = Math.abs(Number(speed) || 0);
  const offRoute = nearest.distance > 42;
  const lookaheadDistance = offRoute
    ? clamp(34 + speedAbs * 0.95, 30, 92)
    : clamp(50 + speedAbs * 1.35, 38, 150);
  const targetPoint = getRoutePointAtDistance(route, nearest.distanceFromStart + lookaheadDistance);
  const dx = targetPoint.x - position.x;
  const dz = targetPoint.z - position.z;
  const bearing = Math.atan2(dx, dz);
  const relativeBearing = normalizeAngle(bearing - heading);
  const absBearing = Math.abs(relativeBearing);
  const nextTurn = getNextTurn(route, nearest);
  const turnSoon = nextTurn && nextTurn.distance < 95 && nextTurn.type !== 'straight';
  const baseDesiredSpeed = getAutopilotDesiredSpeed(absBearing, remainingDistance, Boolean(turnSoon));
  const desiredSpeed = offRoute ? Math.min(baseDesiredSpeed, 13.5) : baseDesiredSpeed;
  const steerDeadzone = speedAbs < 4 ? 0.16 : 0.055;
  const shouldBrake =
    (remainingDistance < 40 && speedAbs > desiredSpeed + 0.8) ||
    speedAbs > desiredSpeed + (turnSoon ? 7.5 : 11) ||
    (absBearing > 2.72 && speedAbs > 8);
  const shouldCoast =
    !shouldBrake &&
    (speedAbs > desiredSpeed + 2.4 || (absBearing > 1.45 && speedAbs > 9.5));
  const wantsThrottle = !shouldCoast && (absBearing < 2.55 || speedAbs < 5.5);

  return {
    forward: shouldBrake || wantsThrottle,
    backward: shouldBrake,
    left: relativeBearing > steerDeadzone,
    right: relativeBearing < -steerDeadzone,
    reset: false,
    nitro: false,
    handbrake: false,
    targetPoint,
    desiredSpeed,
    relativeBearing
  };
}

export function formatNavigationDistance(distance) {
  if (!Number.isFinite(distance)) return '--';
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
  return `${Math.round(distance)} m`;
}

function getBaseRoadGraph() {
  if (cachedBaseGraph) return cachedBaseGraph;

  const graph = createGraph();

  addCityGridRoads(graph);
  addTransportHighway(graph);
  addTransportHubAccess(graph);
  addExpresswayRoads(graph);

  cachedBaseGraph = graph;
  return cachedBaseGraph;
}

function createGraph() {
  return {
    nodes: new Map(),
    edges: new Map()
  };
}

function createWorkingGraph(baseGraph) {
  return {
    nodes: new Map(baseGraph.nodes),
    edges: new Map([...baseGraph.edges.entries()].map(([id, edges]) => [id, edges.map((edge) => ({ ...edge }))]))
  };
}

function addCityGridRoads(graph) {
  const min = WORLD_SETTINGS.worldMinX + GRAPH_NODE_OFFSET;
  const max = WORLD_SETTINGS.worldMaxX - GRAPH_NODE_OFFSET;
  const spacing = WORLD_SETTINGS.chunkSize;

  for (let x = min; x <= max; x += spacing) {
    for (let z = min; z <= max; z += spacing) {
      addPointNode(graph, `grid:${x}:${z}`, { x, z }, 'grid');
    }
  }

  for (let x = min; x <= max; x += spacing) {
    for (let z = min; z <= max; z += spacing) {
      const id = `grid:${x}:${z}`;
      const rightX = x + spacing;
      const downZ = z + spacing;

      if (rightX <= max) {
        addUndirectedEdge(graph, id, `grid:${rightX}:${z}`, 'local');
      }

      if (downZ <= max) {
        addUndirectedEdge(graph, id, `grid:${x}:${downZ}`, 'local');
      }
    }
  }
}

function addTransportHighway(graph) {
  const points = [
    TRANSPORT_HIGHWAY.points[0],
    ...TRANSPORT_HIGHWAY.tolls.map((toll) => ({
      ...toll.point,
      id: `toll:${toll.id}`
    })),
    TRANSPORT_HIGHWAY.points[1]
  ];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const id = point.id ?? (index === 0 ? 'airport-gate' : 'station-gate');

    addPointNode(graph, id, point, 'highway');
    connectPointToGrid(graph, id, point, 'access', 4);
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index].id ?? (index === 0 ? 'airport-gate' : 'station-gate');
    const b = points[index + 1].id ?? (index + 1 === points.length - 1 ? 'station-gate' : 'airport-gate');

    addUndirectedEdge(graph, a, b, 'highway', 80);
  }
}

function addTransportHubAccess(graph) {
  addPointNode(graph, 'airport-terminal', TRANSPORT_HUBS.airport.terminalGate, 'access');
  addPointNode(graph, 'station-terminal', TRANSPORT_HUBS.trainStation.terminalGate, 'access');
  addUndirectedEdge(graph, 'airport-terminal', 'airport-gate', 'access');
  addUndirectedEdge(graph, 'station-terminal', 'station-gate', 'access');
  connectPointToGrid(graph, 'airport-terminal', TRANSPORT_HUBS.airport.terminalGate, 'access', 3);
  connectPointToGrid(graph, 'station-terminal', TRANSPORT_HUBS.trainStation.terminalGate, 'access', 3);
}

function addExpresswayRoads(graph) {
  for (const route of EXPRESSWAY_MAP.routes) {
    const points = getExpresswayRoutePoints(route);
    let previousDeckId = null;

    for (let index = 0; index < points.length; index += 1) {
      const deckId = `${route.id}:deck:${index}`;

      addPointNode(graph, deckId, points[index], 'expressway');

      if (previousDeckId) {
        addUndirectedEdge(graph, previousDeckId, deckId, 'expressway');
      }

      previousDeckId = deckId;
    }

    for (const ramp of getExpresswayRampPaths(route)) {
      let previousId = null;

      for (let index = 0; index < ramp.path.length; index += 1) {
        const point = ramp.path[index];
        const id = `${route.id}:${ramp.id}:ramp:${index}`;

        addPointNode(graph, id, point, 'ramp');

        if (previousId) {
          addUndirectedEdge(graph, previousId, id, 'ramp');
        }

        previousId = id;
      }

      if (previousId) {
        connectPointToGrid(graph, `${route.id}:${ramp.id}:ramp:0`, ramp.path[0], 'access', 3);
        const deckIndex = findMatchingDeckPointIndex(points, ramp.deck);

        if (deckIndex >= 0) {
          addUndirectedEdge(graph, previousId, `${route.id}:deck:${deckIndex}`, 'ramp');
        }
      }
    }
  }
}

function addPointNode(graph, id, point, kind = 'road') {
  const safePoint = toPoint(point);

  graph.nodes.set(id, {
    id,
    kind,
    point: safePoint
  });

  if (!graph.edges.has(id)) {
    graph.edges.set(id, []);
  }

  return id;
}

function addVirtualNode(graph, id, anchor) {
  addPointNode(graph, id, anchor, 'virtual');

  return id;
}

function addUndirectedEdge(graph, fromId, toId, roadType = 'local', penalty = 0) {
  if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return;

  const from = graph.nodes.get(fromId).point;
  const to = graph.nodes.get(toId).point;
  const distance = getPlanarDistance(from, to);
  const weight = distance * (ROAD_WEIGHTS[roadType] ?? 1) + penalty;

  addDirectedEdge(graph, fromId, toId, weight, roadType);
  addDirectedEdge(graph, toId, fromId, weight, roadType);
}

function addDirectedEdge(graph, fromId, toId, weight, roadType) {
  const edges = graph.edges.get(fromId) ?? [];

  edges.push({
    to: toId,
    weight,
    roadType
  });
  graph.edges.set(fromId, edges);
}

function connectVirtualNode(graph, id, point, targetType) {
  const nearest = getNearestNodes(graph, point, 8, id);

  for (const node of nearest) {
    if (node.distance > MAX_CONNECT_DISTANCE) continue;

    addUndirectedEdge(graph, id, node.id, node.node.kind === 'highway' ? 'access' : 'main');
  }

  if (shouldConnectToTransportAccess(point, targetType)) {
    for (const access of HUB_ACCESS_NODES) {
      if (getPlanarDistance(point, access.point) <= HUB_ACCESS_RADIUS) {
        addUndirectedEdge(graph, id, access.id, 'access');
      }
    }
  }
}

function connectDestinationAccess(graph, targetId, targetType, targetAnchor) {
  if (targetType === 'airport') {
    addUndirectedEdge(graph, targetId, 'airport-terminal', 'access');
    addUndirectedEdge(graph, targetId, 'airport-gate', 'access');
    return;
  }

  if (targetType === 'station') {
    addUndirectedEdge(graph, targetId, 'station-terminal', 'access');
    addUndirectedEdge(graph, targetId, 'station-gate', 'access');
    return;
  }

  if (targetType === 'toll') {
    const nearestToll = TRANSPORT_HIGHWAY.tolls
      .map((toll) => ({
        id: `toll:${toll.id}`,
        distance: getPlanarDistance(targetAnchor, toll.point)
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearestToll) {
      addUndirectedEdge(graph, targetId, nearestToll.id, 'access');
    }
  }
}

function connectPointToGrid(graph, nodeId, point, roadType = 'access', count = 3) {
  for (const node of getNearestGridNodes(graph, point, count)) {
    addUndirectedEdge(graph, nodeId, node.id, roadType);
  }
}

function getNearestNodes(graph, point, count, excludeId = null) {
  return [...graph.nodes.values()]
    .filter((node) => node.id !== excludeId && !node.id.endsWith(':raw'))
    .map((node) => ({
      id: node.id,
      node,
      distance: getPlanarDistance(point, node.point)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

function getNearestGridNodes(graph, point, count) {
  return [...graph.nodes.values()]
    .filter((node) => node.kind === 'grid')
    .map((node) => ({
      id: node.id,
      distance: getPlanarDistance(point, node.point)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

function findAStarPath(graph, startId, targetId) {
  const open = new Set([startId]);
  const cameFrom = new Map();
  const gScore = new Map([[startId, 0]]);
  const fScore = new Map([[startId, heuristic(graph, startId, targetId)]]);

  while (open.size > 0) {
    const current = getLowestScoreId(open, fScore);

    if (current === targetId) {
      return reconstructPath(cameFrom, current);
    }

    open.delete(current);

    for (const edge of graph.edges.get(current) ?? []) {
      const tentative = (gScore.get(current) ?? Infinity) + edge.weight;

      if (tentative >= (gScore.get(edge.to) ?? Infinity)) continue;

      cameFrom.set(edge.to, current);
      gScore.set(edge.to, tentative);
      fScore.set(edge.to, tentative + heuristic(graph, edge.to, targetId));
      open.add(edge.to);
    }
  }

  return [];
}

function getLowestScoreId(open, fScore) {
  let bestId = null;
  let bestScore = Infinity;

  for (const id of open) {
    const score = fScore.get(id) ?? Infinity;

    if (score < bestScore) {
      bestId = id;
      bestScore = score;
    }
  }

  return bestId;
}

function heuristic(graph, fromId, toId) {
  const from = graph.nodes.get(fromId)?.point;
  const to = graph.nodes.get(toId)?.point;

  if (!from || !to) return 0;

  return getPlanarDistance(from, to) * ROAD_WEIGHTS.highway;
}

function reconstructPath(cameFrom, current) {
  const path = [current];
  let node = current;

  while (cameFrom.has(node)) {
    node = cameFrom.get(node);
    path.push(node);
  }

  return path.reverse();
}

function countPathTolls(pathIds) {
  return pathIds.filter((id) => id.startsWith('toll:')).length;
}

function createFallbackRoute(start, target, targetType) {
  if (TRANSPORT_ROUTE_TYPES.has(targetType)) {
    const startAccess = getNearestTransportAccess(start);
    const targetAccess = getTargetTransportAccess(target, targetType);

    if (startAccess && targetAccess) {
      return simplifyRoutePoints([
        ...createStreetRoute(start, startAccess.point),
        startAccess.point,
        targetAccess.point,
        ...createStreetRoute(targetAccess.point, target)
      ]);
    }
  }

  return createStreetRoute(start, target);
}

function shouldConnectToTransportAccess(point, targetType) {
  if (TRANSPORT_ROUTE_TYPES.has(targetType)) return true;

  return HUB_ACCESS_NODES.some((access) => getPlanarDistance(point, access.point) <= HUB_ACCESS_RADIUS);
}

function getNearestTransportAccess(point) {
  return HUB_ACCESS_NODES
    .map((access) => ({
      ...access,
      distance: getPlanarDistance(point, access.point)
    }))
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function getTargetTransportAccess(target, targetType) {
  if (targetType === 'airport') return HUB_ACCESS_NODES[0];
  if (targetType === 'station') return HUB_ACCESS_NODES[1];
  if (targetType === 'toll') return getNearestTransportAccess(target);

  return getNearestTransportAccess(target);
}

function snapDestinationToAccess(target, targetType) {
  if (targetType === 'airport') return TRANSPORT_HUBS.airport.terminalGate ?? TRANSPORT_HUBS.airport.gate;
  if (targetType === 'station') return TRANSPORT_HUBS.trainStation.terminalGate ?? TRANSPORT_HUBS.trainStation.gate;
  if (targetType === 'toll') return target;

  return snapToCityGrid(target);
}

function createStreetRoute(start, target) {
  const xFirst = Math.abs(target.x - start.x) >= Math.abs(target.z - start.z);
  const turnPoint = xFirst
    ? { x: target.x, z: start.z }
    : { x: start.x, z: target.z };

  return simplifyRoutePoints([start, turnPoint, target]);
}

function snapToLoadedRoad(point, loadedChunks) {
  let nearest = null;

  for (const chunk of loadedChunks ?? []) {
    for (const road of chunk.roads ?? []) {
      const anchor = getRoadAnchorPoint(point, road);
      if (!anchor) continue;

      const distance = getPlanarDistance(point, anchor);
      const maxSnapDistance = road.roadType === 'parking' ? 160 : 360;

      if (distance > maxSnapDistance) continue;

      if (!nearest || distance < nearest.distance) {
        nearest = { point: anchor, distance };
      }
    }
  }

  return nearest?.point ?? null;
}

function snapToCityGrid(point) {
  const gridX = snapToChunkCenterLine(point.x);
  const gridZ = snapToChunkCenterLine(point.z);
  const xDistance = Math.abs(gridX - point.x);
  const zDistance = Math.abs(gridZ - point.z);

  return xDistance < zDistance
    ? { x: gridX, z: point.z }
    : { x: point.x, z: gridZ };
}

function snapToChunkCenterLine(value) {
  const spacing = WORLD_SETTINGS.chunkSize;
  const centerOffset = spacing / 2;

  return clamp(
    Math.round((value - centerOffset) / spacing) * spacing + centerOffset,
    WORLD_SETTINGS.worldMinX + centerOffset,
    WORLD_SETTINGS.worldMaxX - centerOffset
  );
}

function getRoadAnchorPoint(point, road) {
  if (road.axis === 'x') {
    return {
      x: clamp(point.x, road.minX, road.maxX),
      z: road.centerZ
    };
  }

  if (road.axis === 'z') {
    return {
      x: road.centerX,
      z: clamp(point.z, road.minZ, road.maxZ)
    };
  }

  if (road.axis === 'parking') {
    return {
      x: clamp(point.x, road.minX, road.maxX),
      z: clamp(point.z, road.minZ, road.maxZ)
    };
  }

  if (road.axis === 'segment') {
    return projectPointToSegment(point, {
      x: road.startX,
      z: road.startZ
    }, {
      x: road.endX,
      z: road.endZ
    });
  }

  return null;
}

function createRouteSegments(points) {
  const segments = [];
  let distanceFromStart = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = getPlanarDistance(start, end);

    if (length < 1) continue;

    segments.push({
      index,
      start,
      end,
      length,
      distanceFromStart,
      bearing: Math.atan2(end.x - start.x, end.z - start.z)
    });
    distanceFromStart += length;
  }

  return segments;
}

function getNearestRouteProgress(position, route) {
  let nearest = null;

  for (let index = 0; index < route.segments.length; index += 1) {
    const segment = route.segments[index];
    const projection = projectPointToSegment(position, segment.start, segment.end);
    const distance = getPlanarDistance(position, projection);
    const alongSegment = getPlanarDistance(segment.start, projection);
    const progress = segment.distanceFromStart + alongSegment;

    if (!nearest || distance < nearest.distance) {
      nearest = {
        distance,
        distanceFromStart: progress,
        segmentIndex: index,
        segment,
        t: segment.length > 0 ? alongSegment / segment.length : 0
      };
    }
  }

  return nearest ?? {
    distance: 0,
    distanceFromStart: 0,
    segmentIndex: 0,
    segment: route.segments[0],
    t: 0
  };
}

function getNextRoutePoint(position, route, progress) {
  const segment = route.segments[progress.segmentIndex] ?? route.segments[0];

  if (!segment) return toPoint(route.target.position);

  if (progress.t > 0.86 && route.segments[progress.segmentIndex + 1]) {
    return route.segments[progress.segmentIndex + 1].end;
  }

  if (getPlanarDistance(position, segment.end) <= WAYPOINT_REACHED_DISTANCE && route.segments[progress.segmentIndex + 1]) {
    return route.segments[progress.segmentIndex + 1].end;
  }

  return segment.end;
}

function getRoutePointAtDistance(route, targetDistance) {
  const clampedDistance = clamp(targetDistance, 0, route.distance);

  for (const segment of route.segments) {
    const segmentStart = segment.distanceFromStart;
    const segmentEnd = segmentStart + segment.length;

    if (clampedDistance > segmentEnd && segment !== route.segments[route.segments.length - 1]) continue;

    const t = segment.length > 0
      ? clamp((clampedDistance - segmentStart) / segment.length, 0, 1)
      : 1;

    return {
      x: lerp(segment.start.x, segment.end.x, t),
      z: lerp(segment.start.z, segment.end.z, t)
    };
  }

  const last = route.segments[route.segments.length - 1];
  return last?.end ?? toPoint(route.target.position);
}

function getAutopilotDesiredSpeed(absBearing, remainingDistance, turnSoon) {
  if (remainingDistance < 44) return 4.5;
  if (turnSoon) return 11.5;
  if (absBearing > 1.05) return 7.5;
  if (absBearing > 0.58) return 12.5;
  if (absBearing > 0.24) return 18;
  return 28;
}

function createNeutralAutopilotInput() {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    reset: false,
    nitro: false,
    handbrake: false
  };
}

function getNextTurn(route, progress) {
  const current = route.segments[progress.segmentIndex];
  const next = route.segments[progress.segmentIndex + 1];

  if (!current || !next) return null;

  const delta = normalizeAngle(next.bearing - current.bearing);
  const abs = Math.abs(delta);
  const distance = Math.max(0, current.distanceFromStart + current.length - progress.distanceFromStart);

  if (abs < Math.PI / 8) {
    return {
      type: 'straight',
      label: 'Continue',
      shortLabel: 'Straight',
      distance
    };
  }

  if (abs > Math.PI * 0.78) {
    return {
      type: 'uturn',
      label: 'Turn back',
      shortLabel: 'U-turn',
      distance
    };
  }

  return {
    type: delta > 0 ? 'right' : 'left',
    label: delta > 0 ? 'Turn right' : 'Turn left',
    shortLabel: delta > 0 ? 'Right' : 'Left',
    distance
  };
}

function getRouteDirectionLabel(relativeBearing, nextTurn, remainingDistance) {
  if (remainingDistance < 75) return 'Arrive';
  if (nextTurn?.type && nextTurn.distance < 900) {
    return `${nextTurn.label} in ${formatNavigationDistance(nextTurn.distance)}`;
  }

  const abs = Math.abs(relativeBearing);

  if (abs < Math.PI / 8) return 'Ahead';
  if (abs > Math.PI * 0.82) return 'Turn back';
  if (abs < Math.PI * 0.38) return relativeBearing > 0 ? 'Right' : 'Left';
  return relativeBearing > 0 ? 'Hard right' : 'Hard left';
}

function getRouteManeuverLabel(nextTurn, remainingDistance) {
  if (remainingDistance < 75) return 'Destination';
  if (!nextTurn) return `Continue ${formatNavigationDistance(remainingDistance)}`;

  const distance = formatNavigationDistance(nextTurn.distance);

  if (nextTurn.type === 'straight') {
    return nextTurn.distance < 320
      ? `Keep straight ${distance}`
      : `Continue ${distance}`;
  }

  return `${nextTurn.shortLabel ?? nextTurn.label} ${distance}`;
}

function getRouteManeuverType(nextTurn, remainingDistance) {
  if (remainingDistance < 75) return 'arrive';
  return nextTurn?.type ?? 'straight';
}

function projectPointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0.000001) return { ...start };

  const t = clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq, 0, 1);

  return {
    x: start.x + dx * t,
    z: start.z + dz * t
  };
}

function simplifyRoutePoints(points) {
  const deduped = [];

  for (const point of points) {
    const next = toPoint(point);
    const previous = deduped[deduped.length - 1];

    if (!previous || getPlanarDistance(previous, next) > 1) {
      deduped.push(next);
    }
  }

  const simplified = [];

  for (const point of deduped) {
    simplified.push(point);

    while (simplified.length >= 3) {
      const a = simplified[simplified.length - 3];
      const b = simplified[simplified.length - 2];
      const c = simplified[simplified.length - 1];

      if (!areCollinear(a, b, c)) break;

      simplified.splice(simplified.length - 2, 1);
    }
  }

  return simplified;
}

function findMatchingDeckPointIndex(points, deckPoint) {
  return points.findIndex((point) => getPlanarDistance(point, deckPoint) < 1);
}

function areCollinear(a, b, c) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const bcx = c.x - b.x;
  const bcz = c.z - b.z;
  const cross = abx * bcz - abz * bcx;

  return Math.abs(cross) < 2;
}

function toPoint(point) {
  return {
    x: Number(point?.x) || 0,
    z: Number(point?.z) || 0
  };
}

function getPlanarDistance(a, b) {
  return Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.z ?? 0) - (a.z ?? 0));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function normalizeAngle(angle) {
  let value = angle;

  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;

  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
