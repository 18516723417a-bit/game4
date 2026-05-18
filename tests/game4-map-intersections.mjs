import { getChunkData } from '../client/src/features/world/ChunkManager.js';
import { TRANSPORT_HIGHWAY, WORLD_SETTINGS } from '../client/src/features/world/worldConfig.js';

const groundY = WORLD_SETTINGS.teleportAnchors.downtown.position[1];
const maxUnderpassDepth = 5.75;
const minUnderpassHighwayGap = 5.55;
const minElevatedHighwayGap = 5.8;
const minExpresswayHighwayGap = 7.5;
const minFastTunnelSeparation = 5.55;
const maxFastTunnelDepth = 12.5;
const underpassSurfaceSeparation = 0.45;

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

function isAllowedTransportHighwayOverlap(road, gap) {
  const kind = String(road.kind);
  if (kind === 'transport-highway-ramp') return true;
  if (kind === 'expressway-tunnel' || kind === 'expressway-ramp') return gap >= minFastTunnelSeparation;
  if (gap >= minFastTunnelSeparation) return true;
  if (kind.startsWith('transport-underpass')) return gap >= minUnderpassHighwayGap;
  if (kind.startsWith('transport-overpass')) return gap >= minElevatedHighwayGap;
  if (kind.startsWith('terminal-elevated')) return gap >= minElevatedHighwayGap;
  if (kind === 'expressway-deck') return gap >= minExpresswayHighwayGap;
  return false;
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

function lerpPoint(start, end, t) {
  return {
    x: lerp(start.x, end.x, t),
    z: lerp(start.z, end.z, t)
  };
}

function getDistanceSq(left, right) {
  return (left.x - right.x) ** 2 + (left.z - right.z) ** 2;
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
