import { getChunkData } from '../client/src/features/world/ChunkManager.js';
import { createNavigationRoute, getAutopilotInputForRoute } from '../client/src/features/navigation/navigationRoutes.js';
import { TRANSPORT_HIGHWAY, TRANSPORT_HUBS, WORLD_SETTINGS } from '../client/src/features/world/worldConfig.js';
import { METRO_LINE_DEFINITIONS, METRO_TRANSFER_POINTS } from '../client/src/features/world/metroLines.js';

const groundY = WORLD_SETTINGS.teleportAnchors.downtown.position[1];
const maxUnderpassDepth = 5.75;
const minUnderpassHighwayGap = 5.55;
const minElevatedHighwayGap = 5.8;
const minExpresswayHighwayGap = 7.5;
const minFastTunnelSeparation = 5.55;
const maxFastTunnelDepth = 12.5;
const underpassSurfaceSeparation = 0.45;
const minSurfaceTunnelEntryExitGap = 500;
const minSurfaceTunnelAccessConflictGap = 0.45;
const minTunnelOpeningConflictGap = 0.45;
const minTerminalTunnelPortalGateDistance = 145;
const minMetroPierRoadClearance = 15;

const chunks = [];
for (let chunkX = WORLD_SETTINGS.minChunkX; chunkX <= WORLD_SETTINGS.maxChunkX; chunkX += 1) {
  for (let chunkZ = WORLD_SETTINGS.minChunkZ; chunkZ <= WORLD_SETTINGS.maxChunkZ; chunkZ += 1) {
    const chunk = getChunkData(chunkX, chunkZ);
    if (chunk?.roads?.length) chunks.push(chunk);
  }
}

const roads = chunks.flatMap((chunk) => chunk.roads.map((road) => ({
  ...road,
  chunkBounds: chunk.bounds,
  chunkKey: chunk.key,
  chunkX: chunk.chunkX,
  chunkZ: chunk.chunkZ
})));
const roadsByChunk = new Map();
for (const road of roads) {
  const list = roadsByChunk.get(road.chunkKey) ?? [];
  list.push(road);
  roadsByChunk.set(road.chunkKey, list);
}
const roundabouts = chunks.flatMap((chunk) => (
  (chunk.roundabouts ?? []).map((roundabout) => ({ ...roundabout, chunkKey: chunk.key }))
));
const groundCutouts = chunks.flatMap((chunk) => (
  (chunk.groundCutouts ?? []).map((cutout) => ({ ...cutout, chunkKey: chunk.key }))
));
const colliders = chunks.flatMap((chunk) => (
  (chunk.colliders ?? []).map((collider) => ({ ...collider, chunkKey: chunk.key }))
));
const trafficObstacles = chunks.flatMap((chunk) => (
  (chunk.trafficObstacles ?? []).map((obstacle) => ({ ...obstacle, chunkKey: chunk.key }))
));
const trafficVehicles = chunks.flatMap((chunk) => chunk.trafficVehicles ?? []);
const landforms = chunks.flatMap((chunk) => (
  (chunk.landforms ?? []).map((landform) => ({ ...landform, chunkKey: chunk.key }))
));
const guardrails = chunks.flatMap((chunk) => (
  (chunk.guardrails ?? []).map((guardrail) => ({ ...guardrail, chunkKey: chunk.key }))
));
const uniqueMetroVehicles = [
  ...new Map(
    trafficVehicles
      .filter((vehicle) => vehicle.vehicleType === 'metroTrain')
      .map((vehicle) => [vehicle.id, vehicle])
  ).values()
];
const tunnelEntrances = chunks.flatMap((chunk) => (
  (chunk.tunnelEntrances ?? []).map((entrance) => ({ ...entrance, chunkKey: chunk.key }))
));
const underpassZones = chunks.flatMap((chunk) => (
  (chunk.tunnelZones ?? [])
    .filter((zone) => zone.kind === 'transport-underpass')
    .map((zone) => ({ ...zone, chunkKey: chunk.key }))
));
const fastTunnelZones = chunks.flatMap((chunk) => (
  (chunk.tunnelZones ?? [])
    .filter((zone) => zone.kind === 'transport-highway-tunnel' || zone.kind === 'expressway-tunnel')
    .map((zone) => ({ ...zone, chunkKey: chunk.key }))
));
const errors = [];

const customNavigationTarget = {
  id: 'off-road-navigation-test',
  label: 'Off road test',
  type: 'custom',
  position: { x: 123, z: 417 }
};
const customNavigationRoute = createNavigationRoute(
  { x: 72, z: 34 },
  customNavigationTarget,
  chunks
);
const customRouteLastPoint = customNavigationRoute?.points?.[customNavigationRoute.points.length - 1];
if (!customNavigationRoute?.segments?.length || !customRouteLastPoint) {
  errors.push({ type: 'navigation-route-missing' });
} else if (getDistanceSq(customRouteLastPoint, customNavigationTarget.position) < 1) {
  errors.push({ type: 'navigation-route-ends-off-road-target' });
}

const straightTestRoute = {
  distance: 160,
  segments: [{
    index: 0,
    start: { x: 0, z: 0 },
    end: { x: 0, z: 160 },
    length: 160,
    distanceFromStart: 0,
    bearing: 0
  }],
  target: { position: { x: 0, z: 160 }, label: 'Straight' }
};
for (const testInput of [
  getAutopilotInputForRoute({ x: 0, z: 0 }, 0, 48, straightTestRoute, { enabled: true }),
  getAutopilotInputForRoute({ x: 0, z: 146 }, 0, 18, straightTestRoute, { enabled: true })
]) {
  if (testInput.backward && !testInput.forward) {
    errors.push({ type: 'autopilot-reverse-only-braking' });
  }
}

for (const roundabout of roundabouts) {
  if ((roundabout.islandRadius ?? 0) < 8) {
    errors.push({
      type: 'roundabout-island-too-small',
      chunk: roundabout.chunkKey,
      roundabout: roundabout.id,
      islandRadius: round(roundabout.islandRadius ?? 0)
    });
  }
}

const surfaceTunnelRampCeilings = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassCeiling' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('ramp-ceiling')
));
if (surfaceTunnelRampCeilings.length === 0) {
  errors.push({ type: 'surface-tunnel-ramp-ceiling-missing' });
}

const surfaceTunnelPocketWalls = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassWall' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('main-pocket')
));
if (surfaceTunnelPocketWalls.length === 0) {
  errors.push({ type: 'surface-tunnel-main-pocket-walls-missing' });
}

const surfaceTunnelPocketColliders = colliders.filter((collider) => (
  collider.type === 'tunnelWall' &&
  String(collider.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(collider.id ?? '').includes('main-pocket')
));
if (surfaceTunnelPocketColliders.length === 0) {
  errors.push({ type: 'surface-tunnel-main-pocket-colliders-missing' });
}

const surfaceTunnelAccessRamps = roads.filter((road) => road.kind === 'surface-avenue-tunnel-ramp');
const surfaceAvenueBypassRoads = roads.filter((road) => road.kind === 'surface-avenue-bypass');
if (surfaceTunnelAccessRamps.length > 0 && surfaceAvenueBypassRoads.length === 0) {
  errors.push({ type: 'surface-avenue-tunnel-bypass-missing' });
}

const unexpectedVisualGapRoads = roads.filter((road) => (
  Array.isArray(road.visualGaps) &&
  road.visualGaps.length > 0 &&
  road.kind !== 'surface-avenue'
));
if (unexpectedVisualGapRoads.length > 0) {
  errors.push({
    type: 'unexpected-ground-road-visual-gaps',
    count: unexpectedVisualGapRoads.length,
    samples: unexpectedVisualGapRoads.slice(0, 8).map((road) => ({
      chunk: road.chunkKey,
      kind: road.kind,
      road: road.id
    }))
  });
}

for (const cutout of groundCutouts) {
  const id = String(cutout.id ?? '');
  if (!id.includes('ramp-cutout') && !id.includes('entry-ramp-cutout') && !id.includes('exit-ramp-cutout')) continue;

  const area = Math.max(0, (cutout.maxX ?? 0) - (cutout.minX ?? 0)) *
    Math.max(0, (cutout.maxZ ?? 0) - (cutout.minZ ?? 0));
  if (area > 18000) {
    errors.push({
      type: 'fast-road-ramp-cutout-too-large',
      area: round(area),
      chunk: cutout.chunkKey,
      cutout: id
    });
  }
}

const [transportHighwayStart, transportHighwayEnd] = TRANSPORT_HIGHWAY.points;
const transportHighwayLength = Math.hypot(
  transportHighwayEnd.x - transportHighwayStart.x,
  transportHighwayEnd.z - transportHighwayStart.z
);
const terminalTunnelPortalCandidates = roads
  .filter((road) => (
    road.kind === 'transport-highway-ramp' &&
    String(road.id ?? '').includes('transport-highway-underground')
  ))
  .flatMap((road) => getRoadEndpoints(road)
    .map((endpoint, index) => ({
      id: road.id,
      point: endpoint.point,
      road,
      width: getRoadWidth(road),
      y: getRoadYAt(road, index)
    }))
    .filter((endpoint) => Math.abs(endpoint.y - groundY) <= 0.55));

for (const terminal of [
  { label: 'airport', gate: TRANSPORT_HUBS.airport.gate },
  { label: 'train-station', gate: TRANSPORT_HUBS.trainStation.gate }
]) {
  const candidates = terminalTunnelPortalCandidates
    .map((candidate) => ({
      ...candidate,
      gateDistance: Math.sqrt(getDistanceSq(candidate.point, terminal.gate))
    }))
    .filter((candidate) => candidate.gateDistance < 340)
    .sort((left, right) => left.gateDistance - right.gateDistance);
  const portal = candidates[0];

  if (!portal) {
    errors.push({
      type: 'terminal-tunnel-side-portal-missing',
      terminal: terminal.label
    });
    continue;
  }

  const projection = projectPointToSegment(portal.point, transportHighwayStart, transportHighwayEnd);
  const surfaceAvenueSeparation = Math.sqrt(getDistanceSq(portal.point, projection.point));
  const requiredSurfaceAvenueSeparation = TRANSPORT_HIGHWAY.width / 2 + portal.width / 2 + 10;

  if (portal.gateDistance < minTerminalTunnelPortalGateDistance) {
    errors.push({
      type: 'terminal-tunnel-portal-too-close-to-hub-gate',
      terminal: terminal.label,
      portal: portal.id,
      distance: round(portal.gateDistance)
    });
  }

  if (surfaceAvenueSeparation < requiredSurfaceAvenueSeparation) {
    errors.push({
      type: 'terminal-tunnel-portal-overlaps-surface-avenue',
      terminal: terminal.label,
      portal: portal.id,
      separation: round(surfaceAvenueSeparation),
      required: round(requiredSurfaceAvenueSeparation)
    });
  }
}

const surfaceTunnelAccessGroups = new Map();
for (const road of roads.filter((item) => item.kind === 'surface-avenue-tunnel-ramp')) {
  const match = String(road.id ?? '').match(/surface-avenue-tunnel-access-(\d+)-(forward|reverse)-(entry|exit)-/);
  if (!match) continue;

  const line = getRoadLine(road);
  if (!line) continue;

  const center = {
    x: (line.start.x + line.end.x) / 2,
    z: (line.start.z + line.end.z) / 2
  };
  const projection = projectPointToSegment(center, transportHighwayStart, transportHighwayEnd);
  const key = `${match[1]}-${match[2]}`;
  const group = surfaceTunnelAccessGroups.get(key) ?? { entry: [], exit: [] };
  const centerDistance = Number.isFinite(road.accessCenterDistance)
    ? road.accessCenterDistance
    : projection.t * transportHighwayLength;

  group[match[3]].push(centerDistance);
  surfaceTunnelAccessGroups.set(key, group);
}

for (const [key, group] of surfaceTunnelAccessGroups) {
  if (group.entry.length === 0 || group.exit.length === 0) {
    errors.push({
      type: 'surface-tunnel-entry-exit-pair-missing',
      key,
      entryCount: group.entry.length,
      exitCount: group.exit.length
    });
    continue;
  }

  const entryCenter = average(group.entry);
  const exitCenter = average(group.exit);
  const gap = Math.abs(exitCenter - entryCenter);
  if (gap < minSurfaceTunnelEntryExitGap) {
    errors.push({
      type: 'surface-tunnel-entry-exit-too-close',
      key,
      gap: round(gap)
    });
  }
}

const surfaceTunnelAccessRoads = roads.filter(isSurfaceTunnelAccessRoad);
for (let leftIndex = 0; leftIndex < surfaceTunnelAccessRoads.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < surfaceTunnelAccessRoads.length; rightIndex += 1) {
    const left = surfaceTunnelAccessRoads[leftIndex];
    const right = surfaceTunnelAccessRoads[rightIndex];
    if (getSurfaceTunnelAccessKey(left) === getSurfaceTunnelAccessKey(right)) continue;

    const overlap = getRoadOverlap(left, right, 1.2);
    if (!overlap) continue;

    const gap = Math.abs(getRoadYAt(left, overlap.t) - getRoadYAt(right, overlap.u));
    if (gap >= minSurfaceTunnelAccessConflictGap) continue;

    errors.push({
      type: 'surface-tunnel-access-mutual-conflict',
      left: left.id,
      right: right.id,
      gap: round(gap),
      distance: round(overlap.distance)
    });
  }
}

const surfaceTunnelAccessBlockingColliders = colliders.filter((collider) => (
  collider.type === 'tunnelWall' &&
  String(collider.id ?? '').includes('surface-avenue-tunnel-access') &&
  !String(collider.id ?? '').includes('main-pocket')
));
for (const accessRoad of surfaceTunnelAccessRoads) {
  const roadLine = getRoadLine(accessRoad);
  if (!roadLine) continue;

  const minRoadY = Math.min(getRoadYAt(accessRoad, 0), getRoadYAt(accessRoad, 1));
  const maxRoadY = Math.max(getRoadYAt(accessRoad, 0), getRoadYAt(accessRoad, 1));

  for (const collider of surfaceTunnelAccessBlockingColliders) {
    if (!doesColliderOverlapYRange(collider, minRoadY, maxRoadY, 0.9)) continue;

    const colliderLine = getColliderLine(collider);
    if (!colliderLine) continue;

    const clearance = getRoadWidth(accessRoad) / 2 + (collider.width ?? 0) / 2 + 0.45;
    const distance = getSegmentDistance(roadLine.start, roadLine.end, colliderLine.start, colliderLine.end);
    if (distance.distanceSq > clearance * clearance) continue;

    errors.push({
      type: 'surface-tunnel-access-wall-blocker',
      road: accessRoad.id,
      collider: collider.id,
      distance: round(Math.sqrt(distance.distanceSq))
    });
  }
}

const tunnelOpeningRoads = roads.filter(isTunnelOpeningRoad);
for (let leftIndex = 0; leftIndex < tunnelOpeningRoads.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < tunnelOpeningRoads.length; rightIndex += 1) {
    const left = tunnelOpeningRoads[leftIndex];
    const right = tunnelOpeningRoads[rightIndex];
    if (getTunnelOpeningFamilyKey(left) === getTunnelOpeningFamilyKey(right)) continue;

    const overlap = getRoadOverlap(left, right, 1.2);
    if (!overlap) continue;

    const gap = Math.abs(getRoadYAt(left, overlap.t) - getRoadYAt(right, overlap.u));
    if (gap >= minTunnelOpeningConflictGap) continue;

    errors.push({
      type: 'tunnel-opening-mutual-conflict',
      left: left.id,
      right: right.id,
      gap: round(gap),
      distance: round(overlap.distance)
    });
  }
}

const transportTunnelMouthHeaders = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassCeiling' &&
  String(obstacle.id ?? '').includes('transport-highway-underground') &&
  String(obstacle.id ?? '').includes('-mouth-header')
));
const metroGuideways = trafficObstacles.filter((obstacle) => obstacle.type === 'metroGuideway');
for (const mouth of transportTunnelMouthHeaders) {
  const mouthPoint = getObstaclePoint(mouth);
  if (!mouthPoint) continue;

  for (const guideway of metroGuideways) {
    const guidewayLine = getObstacleLongLine(guideway);
    if (!guidewayLine) continue;

    const distance = Math.sqrt(getPointToSegmentDistanceSq(mouthPoint, guidewayLine.start, guidewayLine.end));
    if (distance > 82) continue;

    errors.push({
      type: 'metro-guideway-over-transport-tunnel-mouth',
      mouth: mouth.id,
      guideway: guideway.id,
      distance: round(distance)
    });
  }
}

const scenicMountainLandforms = landforms.filter((landform) => landform.id === 'scenic-drive-mountain');
if (scenicMountainLandforms.length === 0) {
  errors.push({ type: 'scenic-mountain-missing' });
}

const scenicMountainRoads = roads.filter((road) => road.kind === 'scenic-mountain-road');
if (scenicMountainRoads.length < 8) {
  errors.push({
    type: 'scenic-mountain-road-missing',
    roadCount: scenicMountainRoads.length
  });
}

const scenicMountainMaxY = scenicMountainRoads.reduce((maxY, road) => (
  Math.max(maxY, getRoadYAt(road, 0), getRoadYAt(road, 1))
), Number.NEGATIVE_INFINITY);
if (scenicMountainMaxY < 52) {
  errors.push({
    type: 'scenic-mountain-road-not-climbing',
    maxY: round(scenicMountainMaxY)
  });
}

const scenicMountainGuardrails = guardrails.filter((guardrail) => String(guardrail.id ?? '').includes('scenic-drive-mountain'));
if (scenicMountainGuardrails.length < scenicMountainRoads.length) {
  errors.push({
    type: 'scenic-mountain-guardrails-missing',
    guardrailCount: scenicMountainGuardrails.length,
    roadCount: scenicMountainRoads.length
  });
}

for (const guardrail of scenicMountainGuardrails) {
  const height = guardrail.scale?.[1] ?? 0;
  if (height > 1.25) {
    errors.push({
      type: 'scenic-mountain-guardrail-too-tall',
      guardrail: guardrail.id,
      height: round(height)
    });
  }
}

const scenicMountainGuardrailColliders = colliders.filter((collider) => collider.type === 'mountainGuardrail');
if (scenicMountainGuardrailColliders.length < scenicMountainGuardrails.length) {
  errors.push({
    type: 'scenic-mountain-guardrail-colliders-missing',
    colliderCount: scenicMountainGuardrailColliders.length,
    guardrailCount: scenicMountainGuardrails.length
  });
}

const metroStationPlatforms = trafficObstacles.filter((obstacle) => obstacle.type === 'metroStationPlatform');
if (metroStationPlatforms.length === 0) {
  errors.push({ type: 'metro-station-platforms-missing' });
}
for (const platform of metroStationPlatforms) {
  const stationLength = platform.scale?.[2] ?? 0;
  if (stationLength < 130) {
    errors.push({
      type: 'metro-station-platform-too-short',
      chunk: platform.chunkKey,
      platform: platform.id,
      length: round(stationLength)
    });
  }
}

const metroAccentObstacleTypes = new Set([
  'metroStationLight'
]);
const nonBlackMetroObstacles = trafficObstacles.filter((obstacle) => (
  String(obstacle.type ?? '').startsWith('metro') &&
  !metroAccentObstacleTypes.has(obstacle.type) &&
  getHexColorLuminance(obstacle.color) > 42
));
if (nonBlackMetroObstacles.length > 0) {
  errors.push({
    type: 'metro-structure-not-black',
    count: nonBlackMetroObstacles.length,
    samples: nonBlackMetroObstacles.slice(0, 8).map((obstacle) => ({
      id: obstacle.id,
      type: obstacle.type,
      color: obstacle.color
    }))
  });
}

if (uniqueMetroVehicles.length === 0) {
  errors.push({ type: 'metro-trains-missing' });
}
for (const vehicle of uniqueMetroVehicles) {
  if (!vehicle.metroOneWay) {
    errors.push({
      type: 'metro-train-not-directional-track',
      train: vehicle.id
    });
  }

  if (!Number.isFinite(vehicle.metroTerminalMargin) || vehicle.metroTerminalMargin <= 0) {
    errors.push({
      type: 'metro-train-missing-terminal-margin',
      train: vehicle.id
    });
  }

  if (!vehicle.renderBounds) {
    errors.push({
      type: 'metro-train-missing-render-bounds',
      train: vehicle.id
    });
  }

  if (!/^#(?:edf2f4|f4f7f8|ffffff)$/i.test(vehicle.color ?? '')) {
    errors.push({
      type: 'metro-train-body-not-white',
      color: vehicle.color,
      train: vehicle.id
    });
  }
}

for (const stationGroup of [
  { maxDistance: 112, minDistance: 88, stations: ['red-central-transfer', 'blue-central-transfer', 'green-central-transfer'] },
  { minDistance: 52, stations: ['red-west-transfer', 'green-west-transfer'] },
  { minDistance: 52, stations: ['green-airport-transfer', 'purple-airport-terminal'] },
  { minDistance: 52, stations: ['green-station-transfer', 'purple-train-station'] }
]) {
  const platforms = stationGroup.stations
    .map((stationId) => metroStationPlatforms.find((platform) => platform.id === `${stationId}-metro-platform`))
    .filter(Boolean);

  for (let leftIndex = 0; leftIndex < platforms.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < platforms.length; rightIndex += 1) {
      const leftPoint = getObstaclePoint(platforms[leftIndex]);
      const rightPoint = getObstaclePoint(platforms[rightIndex]);
      if (!leftPoint || !rightPoint) continue;

      const distance = Math.sqrt(getDistanceSq(leftPoint, rightPoint));
      if (distance >= stationGroup.minDistance) continue;

      errors.push({
        type: 'metro-transfer-platforms-too-close',
        left: platforms[leftIndex].id,
        right: platforms[rightIndex].id,
        distance: round(distance),
        required: stationGroup.minDistance
      });
    }
  }

  if (Number.isFinite(stationGroup.maxDistance)) {
    for (let leftIndex = 0; leftIndex < platforms.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < platforms.length; rightIndex += 1) {
        const leftPoint = getObstaclePoint(platforms[leftIndex]);
        const rightPoint = getObstaclePoint(platforms[rightIndex]);
        if (!leftPoint || !rightPoint) continue;

        const distance = Math.sqrt(getDistanceSq(leftPoint, rightPoint));
        if (distance <= stationGroup.maxDistance) continue;

        errors.push({
          type: 'metro-transfer-platforms-too-far',
          left: platforms[leftIndex].id,
          right: platforms[rightIndex].id,
          distance: round(distance),
          required: stationGroup.maxDistance
        });
      }
    }
  }
}

const centralConnectorDeckIds = new Set(
  trafficObstacles
    .filter((obstacle) => obstacle.type === 'metroStationConnectorDeck')
    .map((obstacle) => obstacle.id)
);
for (const connectorId of [
  'red-central-transfer-metro-station-connector-deck',
  'green-central-transfer-metro-station-connector-deck'
]) {
  if (!centralConnectorDeckIds.has(connectorId)) {
    errors.push({
      type: 'metro-central-station-connector-missing',
      connector: connectorId
    });
  }
}

const metroStationSupportPiers = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'metroPier' &&
  String(obstacle.id ?? '').includes('metro-station')
));
if (metroStationSupportPiers.length < 40) {
  errors.push({
    type: 'metro-station-ground-supports-missing',
    count: metroStationSupportPiers.length
  });
}

const expectedMetroLineIds = new Set(METRO_LINE_DEFINITIONS.map((line) => line.id));
const observedMetroLineIds = new Set(
  uniqueMetroVehicles
    .map((vehicle) => String(vehicle.trainSetId ?? '').split('-')[0])
    .filter(Boolean)
);
for (const lineId of expectedMetroLineIds) {
  if (!observedMetroLineIds.has(lineId)) {
    errors.push({
      type: 'metro-line-trains-missing',
      line: lineId
    });
  }
}

const purpleMetroVehicles = uniqueMetroVehicles.filter((vehicle) => (
  String(vehicle.trainSetId ?? '').startsWith('purple-')
));
const nonPurpleMetroVehicles = uniqueMetroVehicles.filter((vehicle) => (
  !String(vehicle.trainSetId ?? '').startsWith('purple-')
));
const minPurpleCycle = Math.min(...purpleMetroVehicles.map((vehicle) => vehicle.metroCycleSeconds ?? Infinity));
const minNonPurpleCycle = Math.min(...nonPurpleMetroVehicles.map((vehicle) => vehicle.metroCycleSeconds ?? Infinity));
if (purpleMetroVehicles.length === 0 || !(minPurpleCycle < minNonPurpleCycle)) {
  errors.push({
    type: 'purple-metro-link-not-faster',
    purpleCycle: round(minPurpleCycle),
    regularCycle: round(minNonPurpleCycle)
  });
}
for (const vehicle of purpleMetroVehicles) {
  const stopCount = new Set((vehicle.metroStops ?? []).map((stop) => Number(stop).toFixed(5))).size;
  if (stopCount > 2) {
    errors.push({
      type: 'purple-metro-link-has-intermediate-stop',
      train: vehicle.id,
      stopCount
    });
  }
}

for (const transfer of [
  { point: METRO_TRANSFER_POINTS.central, lines: ['red', 'blue', 'green'] },
  { point: METRO_TRANSFER_POINTS.airport, lines: ['green', 'purple'] },
  { point: METRO_TRANSFER_POINTS.trainStation, lines: ['green', 'purple'] },
  { point: METRO_TRANSFER_POINTS.west, lines: ['red', 'green'] }
]) {
  for (const lineId of transfer.lines) {
    if (!doesLineHaveStationAtPoint(lineId, transfer.point)) {
      errors.push({
        type: 'metro-transfer-station-missing',
        line: lineId,
        x: round(transfer.point.x),
        z: round(transfer.point.z)
      });
    }
  }
}

const metroPiers = trafficObstacles.filter((obstacle) => obstacle.type === 'metroPier');
for (const pier of metroPiers) {
  const point = getObstaclePoint(pier);
  if (!point) continue;

  for (const road of getNearbyRoadsForObstacle(pier, roadsByChunk, minMetroPierRoadClearance)) {
    if (!isPointOnRoadSurface(point.x, point.z, road, minMetroPierRoadClearance)) continue;

    errors.push({
      type: 'metro-pier-on-road',
      pier: pier.id,
      road: road.id,
      chunk: pier.chunkKey
    });
    break;
  }
}

const metroTrackPaths = new Map();
for (const vehicle of uniqueMetroVehicles) {
  const [lineId, directionName] = String(vehicle.trainSetId ?? '').split('-');
  if (!lineId || !directionName || !Array.isArray(vehicle.path?.points)) continue;

  const key = `${lineId}-${directionName}`;
  if (!metroTrackPaths.has(key)) metroTrackPaths.set(key, vehicle.path.points);
}

for (const lineId of expectedMetroLineIds) {
  const forwardPath = metroTrackPaths.get(`${lineId}-forward`);
  const reversePath = metroTrackPaths.get(`${lineId}-reverse`);
  if (!forwardPath || !reversePath) continue;

  const sampleCount = Math.min(forwardPath.length, reversePath.length);
  const step = Math.max(1, Math.floor(sampleCount / 12));
  let minSeparation = Infinity;

  for (let index = 0; index < sampleCount; index += step) {
    const forwardPoint = forwardPath[index];
    const reversePoint = reversePath[sampleCount - 1 - index];
    minSeparation = Math.min(
      minSeparation,
      Math.hypot(forwardPoint.x - reversePoint.x, forwardPoint.z - reversePoint.z)
    );
  }

  if (minSeparation < 5.8) {
    errors.push({
      type: 'metro-directional-tracks-overlap',
      line: lineId,
      separation: round(minSeparation)
    });
  }
}

const metroGuidewayLines = metroGuideways
  .map((guideway) => ({ guideway, line: getObstacleLongLine(guideway) }))
  .filter((item) => item.line);
for (const [pathKey, points] of metroTrackPaths) {
  const step = Math.max(1, Math.floor(points.length / 18));

  for (let index = 0; index < points.length; index += step) {
    const point = points[index];
    let nearestDistanceSq = Infinity;

    for (const guideway of metroGuidewayLines) {
      nearestDistanceSq = Math.min(
        nearestDistanceSq,
        getPointToSegmentDistanceSq(point, guideway.line.start, guideway.line.end)
      );
    }

    const nearestDistance = Math.sqrt(nearestDistanceSq);
    if (nearestDistance <= 4.5) continue;

    errors.push({
      type: 'metro-train-path-off-guideway',
      distance: round(nearestDistance),
      path: pathKey,
      x: round(point.x),
      z: round(point.z)
    });
    break;
  }
}

const uniqueBusRouteVehicles = [
  ...new Map(
    trafficVehicles
      .filter((vehicle) => vehicle.vehicleType === 'bus' && vehicle.behavior === 'bus-route')
      .map((vehicle) => [vehicle.id, vehicle])
  ).values()
];
if (uniqueBusRouteVehicles.length < 12) {
  errors.push({
    type: 'bus-route-vehicles-missing',
    count: uniqueBusRouteVehicles.length
  });
}
for (const vehicle of uniqueBusRouteVehicles) {
  const transitStops = (vehicle.slowZones ?? []).filter((zone) => zone.kind === 'transitStop');
  if (transitStops.length === 0 || transitStops.some((zone) => (zone.dwellSeconds ?? 0) < 2.8)) {
    errors.push({
      type: 'bus-route-stop-dwell-missing',
      bus: vehicle.id,
      stops: transitStops.length
    });
  }
}

const busStopShelters = trafficObstacles.filter((obstacle) => obstacle.type === 'busStopShelter');
const busStopPoles = trafficObstacles.filter((obstacle) => obstacle.type === 'busStopPole');
if (busStopShelters.length < 12 || busStopPoles.length < 12) {
  errors.push({
    type: 'bus-stops-missing',
    poles: busStopPoles.length,
    shelters: busStopShelters.length
  });
}
for (const shelter of busStopShelters) {
  const point = getObstaclePoint(shelter);
  if (!point) continue;

  for (const road of getNearbyRoadsForObstacle(shelter, roadsByChunk, 18)) {
    if (road.roadType === 'parking') continue;
    if (!isPointOnRoadSurface(point.x, point.z, road, 0.5)) continue;

    errors.push({
      type: 'bus-stop-on-road-surface',
      shelter: shelter.id,
      road: road.id
    });
    break;
  }
}

for (const zone of underpassZones) {
  const depth = groundY - zone.y;
  if (depth > maxUnderpassDepth) {
    errors.push({
      type: 'underpass-too-deep',
      chunk: zone.chunkKey,
      depth: round(depth),
      y: round(zone.y)
    });
  }
}

for (const zone of fastTunnelZones) {
  const depth = groundY - zone.y;
  if (depth > maxFastTunnelDepth) {
    errors.push({
      type: 'fast-tunnel-too-deep',
      chunk: zone.chunkKey,
      depth: round(depth),
      id: zone.id,
      y: round(zone.y)
    });
  }
}

for (const road of roads) {
  if (road.kind === 'expressway-deck') {
    errors.push({
      type: 'surface-expressway-leftover',
      chunk: road.chunkKey,
      road: road.id
    });
  }
}

for (const entrance of tunnelEntrances) {
  errors.push({
    type: 'standalone-tunnel-entrance-leftover',
    chunk: entrance.chunkKey,
    entrance: entrance.id
  });
}

const endpointRoads = roads.filter(isEndpointConnectivityRoad);
const endpointTargetRoads = roads.filter(isEndpointConnectivityTargetRoad);
const endpointTargetRoadsByChunk = new Map();
for (const road of endpointTargetRoads) {
  const list = endpointTargetRoadsByChunk.get(road.chunkKey) ?? [];
  list.push(road);
  endpointTargetRoadsByChunk.set(road.chunkKey, list);
}
for (const road of endpointRoads) {
  for (const endpoint of getRoadEndpoints(road)) {
    if (isEndpointOnWorldEdge(endpoint.point)) continue;
    if (isRoadEndpointConnected(endpoint.point, road, getNearbyEndpointTargetRoads(road))) continue;

    errors.push({
      type: 'road-endpoint-gap',
      chunk: road.chunkKey,
      road: road.id,
      x: round(endpoint.point.x),
      z: round(endpoint.point.z)
    });
  }
}

const transportHighways = roads.filter((road) => road.kind === 'transport-highway');
for (const highway of transportHighways) {
  for (const road of roads) {
    if (road === highway || road.kind === 'transport-highway') continue;

    const overlap = getRoadOverlap(highway, road, 0.1);
    if (!overlap) continue;

    const gap = Math.abs(getRoadYAt(highway, overlap.t) - getRoadYAt(road, overlap.u));
    if (isAllowedTransportHighwayOverlap(road, gap)) continue;

    errors.push({
      type: 'transport-highway-conflict',
      chunk: highway.chunkKey,
      highway: highway.id,
      road: road.id,
      kind: road.kind,
      gap: round(gap)
    });
  }
}

const underpassRoads = roads.filter((road) => (
  road.kind === 'transport-underpass-ramp' ||
  road.kind === 'transport-underpass-tunnel'
));
for (let leftIndex = 0; leftIndex < underpassRoads.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < underpassRoads.length; rightIndex += 1) {
    const left = underpassRoads[leftIndex];
    const right = underpassRoads[rightIndex];
    if (getUnderpassBaseId(left.id) === getUnderpassBaseId(right.id)) continue;

    const overlap = getRoadOverlap(left, right, 1.2);
    if (!overlap) continue;

    const gap = Math.abs(getRoadYAt(left, overlap.t) - getRoadYAt(right, overlap.u));
    if (gap >= underpassSurfaceSeparation) continue;

    errors.push({
      type: 'underpass-mutual-conflict',
      left: left.id,
      right: right.id,
      gap: round(gap),
      distance: round(overlap.distance)
    });
  }
}

const fastTunnelRoads = roads.filter((road) => (
  road.kind === 'transport-highway' ||
  road.kind === 'expressway-tunnel'
));
for (let leftIndex = 0; leftIndex < fastTunnelRoads.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < fastTunnelRoads.length; rightIndex += 1) {
    const left = fastTunnelRoads[leftIndex];
    const right = fastTunnelRoads[rightIndex];
    if (getFastTunnelBaseId(left.id, left.kind) === getFastTunnelBaseId(right.id, right.kind)) continue;

    const overlap = getRoadOverlap(left, right, 1.2);
    if (!overlap) continue;

    const gap = Math.abs(getRoadYAt(left, overlap.t) - getRoadYAt(right, overlap.u));
    if (gap >= minFastTunnelSeparation) continue;

    errors.push({
      type: 'fast-tunnel-mutual-conflict',
      left: left.id,
      right: right.id,
      gap: round(gap),
      distance: round(overlap.distance)
    });
  }
}

const surfaceTunnelMergeRoads = roads.filter((road) => road.kind === 'surface-avenue-tunnel-merge');
for (const mergeRoad of surfaceTunnelMergeRoads) {
  const mergeLine = getRoadLine(mergeRoad);
  if (!mergeLine) continue;

  const minRoadY = Math.min(getRoadYAt(mergeRoad, 0), getRoadYAt(mergeRoad, 1));
  const maxRoadY = Math.max(getRoadYAt(mergeRoad, 0), getRoadYAt(mergeRoad, 1));

  for (const collider of colliders) {
    if (collider.type !== 'highwaySideGuardrail') continue;
    if (!doesColliderOverlapYRange(collider, minRoadY, maxRoadY, 1.8)) continue;

    const colliderLine = getColliderLine(collider);
    if (!colliderLine) continue;

    const clearance = getRoadWidth(mergeRoad) / 2 + (collider.width ?? 0) / 2 + 0.8;
    const distance = getSegmentDistance(mergeLine.start, mergeLine.end, colliderLine.start, colliderLine.end);
    if (distance.distanceSq > clearance * clearance) continue;

    errors.push({
      type: 'surface-tunnel-merge-guardrail-blocker',
      chunk: mergeRoad.chunkKey,
      road: mergeRoad.id,
      collider: collider.id,
      colliderChunk: collider.chunkKey,
      distance: round(Math.sqrt(distance.distanceSq))
    });
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({
    errors: errors.slice(0, 30),
    status: 'failed',
    totalErrors: errors.length
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  chunks: chunks.length,
  roads: roads.length,
  status: 'passed',
  transportHighways: transportHighways.length,
  tunnelEntrances: tunnelEntrances.length,
  fastTunnelZones: fastTunnelZones.length,
  fastTunnelY: [...new Set(fastTunnelZones.map((zone) => round(zone.y)))],
  underpassZones: underpassZones.length,
  underpassY: [...new Set(underpassZones.map((zone) => round(zone.y)))]
}, null, 2));

function isEndpointConnectivityRoad(road) {
  const kind = String(road.kind ?? '');
  if (!road?.marked) return false;
  if (!getRoadLine(road)) return false;
  if (road.roadType === 'parking') return false;
  if (road.roadType === 'highway') return false;
  if (road.roadType === 'elevatedHighway' || road.roadType === 'ramp') return false;
  if (kind.startsWith('transport-highway')) return false;
  if (kind.startsWith('transport-underpass') || kind.startsWith('transport-overpass')) return false;
  if (kind.startsWith('expressway')) return false;
  return Math.abs(getRoadYAt(road) - groundY) <= 0.9;
}

function isEndpointConnectivityTargetRoad(road) {
  if (road.roadType === 'parking') return true;
  if (isEndpointConnectivityRoad(road)) return true;

  const kind = String(road.kind ?? '');
  if (kind === 'road-edge-seam') return true;
  if (kind === 'expressway-feeder') return true;
  if (kind === 'expressway-surface-connector') return true;
  if (kind === 'transport-highway-surface-connector') return true;

  return false;
}

function getRoadEndpoints(road) {
  const line = getRoadLine(road);
  if (!line) return [];

  return [
    { point: line.start },
    { point: line.end }
  ];
}

function isEndpointOnChunkEdge(point, bounds) {
  if (!bounds) return false;
  const margin = 24;

  return Math.abs(point.x - bounds.minX) <= margin ||
    Math.abs(point.x - bounds.maxX) <= margin ||
    Math.abs(point.z - bounds.minZ) <= margin ||
    Math.abs(point.z - bounds.maxZ) <= margin;
}

function isEndpointOnWorldEdge(point) {
  const margin = 24;

  return Math.abs(point.x - WORLD_SETTINGS.worldMinX) <= margin ||
    Math.abs(point.x - WORLD_SETTINGS.worldMaxX) <= margin ||
    Math.abs(point.z - WORLD_SETTINGS.worldMinZ) <= margin ||
    Math.abs(point.z - WORLD_SETTINGS.worldMaxZ) <= margin;
}

function getNearbyEndpointTargetRoads(road) {
  const nearby = [];

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      const key = `${road.chunkX + dx}:${road.chunkZ + dz}`;
      nearby.push(...(endpointTargetRoadsByChunk.get(key) ?? []));
    }
  }

  return nearby;
}

function isRoadEndpointConnected(point, sourceRoad, roads) {
  const width = getRoadWidth(sourceRoad);

  return roads.some((road) => (
    road !== sourceRoad &&
    isPointOnRoadSurface(point.x, point.z, road, width / 2 + 3.5)
  ));
}

function isPointOnRoadSurface(x, z, road, margin = 0) {
  const line = getRoadLine(road);
  if (line) {
    const projection = projectPointToSegment({ x, z }, line.start, line.end);
    const distanceSq = getDistanceSq({ x, z }, projection.point);
    const limit = getRoadWidth(road) / 2 + margin;
    return distanceSq <= limit * limit;
  }

  return Number.isFinite(road?.minX) &&
    Number.isFinite(road?.maxX) &&
    Number.isFinite(road?.minZ) &&
    Number.isFinite(road?.maxZ) &&
    x >= road.minX - margin &&
    x <= road.maxX + margin &&
    z >= road.minZ - margin &&
    z <= road.maxZ + margin;
}

function getNearbyRoadsForObstacle(obstacle, roadsByChunk, margin = 0) {
  const point = getObstaclePoint(obstacle);
  if (!point) return [];
  const [chunkX, chunkZ] = String(obstacle.chunkKey ?? '').split(':').map((value) => Number.parseInt(value, 10));
  const candidates = [];

  if (Number.isFinite(chunkX) && Number.isFinite(chunkZ)) {
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        candidates.push(...(roadsByChunk.get(`${chunkX + dx}:${chunkZ + dz}`) ?? []));
      }
    }
  } else {
    for (const list of roadsByChunk.values()) candidates.push(...list);
  }

  return candidates.filter((road) => (
    Number.isFinite(road?.minX) &&
    Number.isFinite(road?.maxX) &&
    Number.isFinite(road?.minZ) &&
    Number.isFinite(road?.maxZ) &&
    point.x >= road.minX - margin &&
    point.x <= road.maxX + margin &&
    point.z >= road.minZ - margin &&
    point.z <= road.maxZ + margin
  ));
}

function doesLineHaveStationAtPoint(lineId, point) {
  const line = METRO_LINE_DEFINITIONS.find((item) => item.id === lineId);
  if (!line) return false;

  return (line.stations ?? []).some((station) => (
    station.point &&
    Math.hypot(station.point.x - point.x, station.point.z - point.z) < 0.001
  ));
}

function isAllowedTransportHighwayOverlap(road, gap) {
  const kind = String(road.kind);
  if (kind === 'transport-highway-ramp') return true;
  if (kind === 'surface-avenue-tunnel-ramp') return true;
  if (kind === 'surface-avenue-tunnel-merge') return true;
  if (kind === 'expressway-tunnel' || kind === 'expressway-ramp') return gap >= minFastTunnelSeparation;
  if (gap >= minFastTunnelSeparation) return true;
  if (kind.startsWith('transport-underpass')) return gap >= minUnderpassHighwayGap;
  if (kind.startsWith('transport-overpass')) return gap >= minElevatedHighwayGap;
  if (kind.startsWith('terminal-elevated')) return gap >= minElevatedHighwayGap;
  if (kind === 'expressway-deck') return gap >= minExpresswayHighwayGap;
  return false;
}

function isSurfaceTunnelAccessRoad(road) {
  return road?.kind === 'surface-avenue-tunnel-ramp' ||
    road?.kind === 'surface-avenue-tunnel-slip' ||
    road?.kind === 'surface-avenue-tunnel-merge';
}

function getSurfaceTunnelAccessKey(road) {
  if (road?.accessPairKey && road?.accessFlow) {
    return `${road.accessPairKey}-${road.accessFlow}`;
  }

  const match = String(road?.id ?? '').match(/surface-avenue-tunnel-access-(\d+)-(forward|reverse)-(entry|exit)-/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : String(road?.id ?? '');
}

function isTunnelOpeningRoad(road) {
  return road?.kind === 'transport-highway-ramp' ||
    road?.kind === 'expressway-ramp' ||
    road?.kind === 'surface-avenue-tunnel-ramp' ||
    road?.kind === 'surface-avenue-tunnel-slip' ||
    road?.kind === 'surface-avenue-tunnel-merge' ||
    road?.kind === 'transport-underpass-ramp' ||
    road?.kind === 'transport-underpass-tunnel';
}

function getTunnelOpeningFamilyKey(road) {
  const id = String(road?.id ?? '');

  if (isSurfaceTunnelAccessRoad(road)) {
    return `surface-${getSurfaceTunnelAccessKey(road)}`;
  }

  if (road?.kind === 'transport-highway-ramp') {
    return 'transport-highway-underground';
  }

  if (road?.kind === 'expressway-ramp') {
    return `expressway-${id.split('-entry-')[0].split('-exit-')[0].split('-ramp-')[0]}`;
  }

  if (road?.kind === 'transport-underpass-ramp' || road?.kind === 'transport-underpass-tunnel') {
    return getUnderpassBaseId(id);
  }

  return id;
}

function getUnderpassBaseId(id) {
  return String(id).replace(/-(approach-start|approach-end|down|up|tunnel|underpass-joint-\d+|joint-\d+)$/, '');
}

function getFastTunnelBaseId(id, kind) {
  if (kind === 'transport-highway') return 'transport-highway';
  return String(id).replace(/-tunnel-\d+-.+$/, '');
}

function getRoadOverlap(left, right, margin = 0) {
  const leftLine = getRoadLine(left);
  const rightLine = getRoadLine(right);
  if (!leftLine || !rightLine) return null;

  const limit = getRoadWidth(left) / 2 + getRoadWidth(right) / 2 + margin;
  const closest = getSegmentDistance(leftLine.start, leftLine.end, rightLine.start, rightLine.end);
  if (closest.distanceSq > limit * limit) return null;

  return {
    ...closest,
    distance: Math.sqrt(closest.distanceSq),
    limit
  };
}

function getRoadLine(road) {
  if (road?.axis === 'segment' || road?.surface?.shape === 'segment' || road?.surface?.shape === 'ramp') {
    return {
      start: { x: road.startX ?? road.surface.startX, z: road.startZ ?? road.surface.startZ },
      end: { x: road.endX ?? road.surface.endX, z: road.endZ ?? road.surface.endZ }
    };
  }

  if (road?.axis === 'x') {
    return {
      start: { x: road.minX, z: road.centerZ },
      end: { x: road.maxX, z: road.centerZ }
    };
  }

  if (road?.axis === 'z') {
    return {
      start: { x: road.centerX, z: road.minZ },
      end: { x: road.centerX, z: road.maxZ }
    };
  }

  return null;
}

function getRoadWidth(road) {
  return road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width ?? 0, road.depth ?? 0);
}

function getRoadYAt(road, t = 0.5) {
  const surface = road.surface;
  if (surface?.shape === 'ramp') {
    return lerp(surface.startY, surface.endY, clamp(t, 0, 1));
  }

  return surface?.y ?? road.position?.[1] ?? groundY;
}

function getColliderLine(collider) {
  if (collider?.shape !== 'segment') return null;

  return {
    start: { x: collider.startX, z: collider.startZ },
    end: { x: collider.endX, z: collider.endZ }
  };
}

function getObstaclePoint(obstacle) {
  const [x, , z] = obstacle?.position ?? [];
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;

  return { x, z };
}

function getObstacleLongLine(obstacle) {
  const point = getObstaclePoint(obstacle);
  const length = obstacle?.scale?.[0] ?? 0;
  if (!point || length <= 0) return null;

  const yaw = obstacle.rotation?.[1] ?? 0;
  const dx = Math.cos(yaw) * length / 2;
  const dz = -Math.sin(yaw) * length / 2;

  return {
    start: { x: point.x - dx, z: point.z - dz },
    end: { x: point.x + dx, z: point.z + dz }
  };
}

function doesColliderOverlapYRange(collider, minY, maxY, margin = 0) {
  if (!Number.isFinite(collider?.minY) || !Number.isFinite(collider?.maxY)) return true;

  return collider.maxY >= minY - margin && collider.minY <= maxY + margin;
}

function getSegmentDistance(a, b, c, d) {
  if (doSegmentsIntersect(a, b, c, d)) return { distanceSq: 0, t: 0.5, u: 0.5 };

  let best = { distanceSq: Number.POSITIVE_INFINITY, t: 0, u: 0 };
  for (let index = 0; index <= 30; index += 1) {
    const t = index / 30;
    const point = lerpPoint(a, b, t);
    const projection = projectPointToSegment(point, c, d);
    best = minDistance(best, {
      distanceSq: getDistanceSq(point, projection.point),
      t,
      u: projection.t
    });
  }

  for (let index = 0; index <= 30; index += 1) {
    const u = index / 30;
    const point = lerpPoint(c, d, u);
    const projection = projectPointToSegment(point, a, b);
    best = minDistance(best, {
      distanceSq: getDistanceSq(point, projection.point),
      t: projection.t,
      u
    });
  }

  return best;
}

function minDistance(left, right) {
  return right.distanceSq < left.distanceSq ? right : left;
}

function doSegmentsIntersect(a, b, c, d) {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  return o1 * o2 <= 0.0000001 &&
    o3 * o4 <= 0.0000001 &&
    Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) + 0.0000001 &&
    Math.max(Math.min(a.z, b.z), Math.min(c.z, d.z)) <= Math.min(Math.max(a.z, b.z), Math.max(c.z, d.z)) + 0.0000001;
}

function orient(a, b, c) {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}

function projectPointToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;
  const t = lengthSq <= 0.0000001
    ? 0
    : clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq, 0, 1);

  return {
    point: lerpPoint(start, end, t),
    t
  };
}

function getPointToSegmentDistanceSq(point, start, end) {
  const projection = projectPointToSegment(point, start, end);
  return getDistanceSq(point, projection.point);
}

function lerpPoint(start, end, t) {
  return {
    x: lerp(start.x, end.x, t),
    z: lerp(start.z, end.z, t)
  };
}

function getDistanceSq(left, right) {
  return (left.x - right.x) ** 2 + (left.z - right.z) ** 2;
}

function getHexColorLuminance(color) {
  const match = String(color ?? '').trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return 0;

  const value = Number.parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / Math.max(1, values.length);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}
