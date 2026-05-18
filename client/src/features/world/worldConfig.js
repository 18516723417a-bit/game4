export const worldWidth = 16000;
export const worldHeight = 16000;
export const chunkSize = 500;

const halfWorldWidth = worldWidth / 2;
const halfWorldHeight = worldHeight / 2;

export const WORLD_SETTINGS = {
  worldWidth,
  worldHeight,
  chunkSize,
  worldMinX: -halfWorldWidth,
  worldMaxX: halfWorldWidth,
  worldMinZ: -halfWorldHeight,
  worldMaxZ: halfWorldHeight,
  minChunkX: Math.floor(-halfWorldWidth / chunkSize),
  maxChunkX: Math.ceil(halfWorldWidth / chunkSize) - 1,
  minChunkZ: Math.floor(-halfWorldHeight / chunkSize),
  maxChunkZ: Math.ceil(halfWorldHeight / chunkSize) - 1,
  roadSpacing: 100,
  roadWidth: 12,
  laneMarkLength: 14,
  laneMarkInterval: 80,
  loadRadius: 1,
  teleportAnchors: {
    downtown: {
      label: 'Parking Lot Spawn',
      position: [72, 0.48, 34],
      heading: Math.PI / 2
    }
  }
};

export const TRANSPORT_HUBS = {
  airport: {
    id: 'airport',
    label: 'Airport',
    type: 'airport',
    center: { x: -6400, z: 5600 },
    bounds: {
      minX: -7600,
      maxX: -5200,
      minZ: 4300,
      maxZ: 6900
    },
    gate: { x: -5520, z: 4740 },
    terminalGate: { x: -5780, z: 5120 },
    spawn: { x: -5680, z: 5080, heading: -Math.PI / 6 }
  },
  trainStation: {
    id: 'train-station',
    label: 'Train Station',
    type: 'station',
    center: { x: 6200, z: -5920 },
    bounds: {
      minX: 5200,
      maxX: 7200,
      minZ: -6900,
      maxZ: -5000
    },
    gate: { x: 5520, z: -5060 },
    terminalGate: { x: 6040, z: -5660 },
    spawn: { x: 5940, z: -5560, heading: Math.PI / 3 }
  }
};

export const TRANSPORT_HIGHWAY = {
  id: 'airport-station-highway',
  label: 'Airport Station Highway',
  width: 46,
  points: [
    TRANSPORT_HUBS.airport.gate,
    TRANSPORT_HUBS.trainStation.gate
  ],
  tolls: [
    {
      id: 'airport-toll',
      label: 'Airport Toll',
      point: { x: -5400, z: 4634 }
    },
    {
      id: 'station-toll',
      label: 'Station Toll',
      point: { x: 5400, z: -4954 }
    }
  ]
};

export const MAP_FEATURES = [
  {
    id: TRANSPORT_HUBS.airport.id,
    label: TRANSPORT_HUBS.airport.label,
    type: TRANSPORT_HUBS.airport.type,
    bounds: TRANSPORT_HUBS.airport.bounds
  },
  {
    id: TRANSPORT_HUBS.trainStation.id,
    label: TRANSPORT_HUBS.trainStation.label,
    type: TRANSPORT_HUBS.trainStation.type,
    bounds: TRANSPORT_HUBS.trainStation.bounds
  }
];

export const EXPRESSWAY_MAP = {
  deckWidth: 25,
  elevation: 8.4,
  rampLength: 360,
  rampWidth: 20,
  routes: [
    {
      id: 'northwest-bypass',
      label: 'NW Expressway',
      entranceALabel: 'NW A',
      entranceBLabel: 'NW B',
      axis: 'x',
      start: -6600,
      end: -960,
      fixed: -1250,
      rampSideOffsets: { 'entry-a': -135, 'entry-b': 135 },
      points: [
        { x: -6600, z: -1505 },
        { x: -5200, z: -1400 },
        { x: -3920, z: -1320 },
        { x: -3550, z: -1291 },
        { x: -3180, z: -1256 },
        { x: -2810, z: -1222 },
        { x: -2440, z: -1211 },
        { x: -2070, z: -1213 },
        { x: -1700, z: -1219 },
        { x: -1330, z: -1204 },
        { x: -960, z: -1165 }
      ]
    },
    {
      id: 'east-ridge',
      label: 'East Ridge',
      entranceALabel: 'ER A',
      entranceBLabel: 'ER B',
      axis: 'z',
      start: -6320,
      end: -980,
      fixed: 1760,
      rampSideOffsets: { 'entry-a': 135, 'entry-b': -135 },
      points: [
        { x: 1615, z: -6320 },
        { x: 1652, z: -4920 },
        { x: 1680, z: -3740 },
        { x: 1750, z: -3395 },
        { x: 1825, z: -3050 },
        { x: 1905, z: -2705 },
        { x: 1918, z: -2360 },
        { x: 1909, z: -2015 },
        { x: 1935, z: -1670 },
        { x: 1995, z: -1325 },
        { x: 2080, z: -980 }
      ]
    },
    {
      id: 'south-harbor',
      label: 'South Harbor',
      entranceALabel: 'SH A',
      entranceBLabel: 'SH B',
      axis: 'x',
      start: 760,
      end: 6900,
      fixed: 2260,
      rampSideOffsets: { 'entry-a': 135, 'entry-b': -135 },
      points: [
        { x: 760, z: 2185 },
        { x: 1212, z: 2229 },
        { x: 1665, z: 2279 },
        { x: 2118, z: 2323 },
        { x: 2570, z: 2352 },
        { x: 3022, z: 2362 },
        { x: 3475, z: 2381 },
        { x: 3928, z: 2421 },
        { x: 4380, z: 2460 },
        { x: 5720, z: 2482 },
        { x: 6900, z: 2494 }
      ]
    },
    {
      id: 'west-parkway',
      label: 'West Parkway',
      entranceALabel: 'WP A',
      entranceBLabel: 'WP B',
      axis: 'z',
      start: 840,
      end: 6720,
      fixed: -2620,
      rampSideOffsets: { 'entry-a': -135, 'entry-b': 135 },
      points: [
        { x: -2520, z: 840 },
        { x: -2595, z: 1240 },
        { x: -2675, z: 1640 },
        { x: -2735, z: 2040 },
        { x: -2755, z: 2440 },
        { x: -2770, z: 2840 },
        { x: -2805, z: 3240 },
        { x: -2872, z: 3640 },
        { x: -2920, z: 4040 },
        { x: -3010, z: 5520 },
        { x: -3075, z: 6720 }
      ]
    }
  ]
};

export function getExpresswayRoutePoints(route) {
  if (route.points?.length >= 2) {
    return route.points.map((point) => ({ x: point.x, z: point.z }));
  }

  if (route.axis === 'x') {
    return [
      { x: route.start, z: route.fixed },
      { x: route.end, z: route.fixed }
    ];
  }

  return [
    { x: route.fixed, z: route.start },
    { x: route.fixed, z: route.end }
  ];
}

export function getExpresswayRampPaths(route) {
  const points = getExpresswayRoutePoints(route);

  if (points.length < 2) return [];

  const startIndex = clampIndex(route.rampAnchorIndices?.[0] ?? 0, points.length);
  const endIndex = clampIndex(route.rampAnchorIndices?.[1] ?? points.length - 1, points.length);
  const startPoint = points[startIndex];
  const secondPoint = points[Math.min(startIndex + 1, points.length - 1)];
  const beforeEndPoint = points[Math.max(endIndex - 1, 0)];
  const endPoint = points[endIndex];
  const startTangent = normalizeVector2({
    x: secondPoint.x - startPoint.x,
    z: secondPoint.z - startPoint.z
  });
  const endTangent = normalizeVector2({
    x: endPoint.x - beforeEndPoint.x,
    z: endPoint.z - beforeEndPoint.z
  });

  return [
    createExpresswayRampPath(route, {
      id: 'entry-a',
      label: route.entranceALabel,
      deckPoint: startPoint,
      tangent: startTangent,
      outwardSign: -1,
      sideSign: -1,
      endpointRamp: true
    }),
    createExpresswayRampPath(route, {
      id: 'entry-b',
      label: route.entranceBLabel,
      deckPoint: endPoint,
      tangent: endTangent,
      outwardSign: 1,
      sideSign: 1,
      endpointRamp: true
    })
  ];
}

function clampIndex(index, length) {
  return Math.min(Math.max(Number.isFinite(index) ? index : 0, 0), Math.max(0, length - 1));
}

function sampleCubicPath(start, controlA, controlB, end, steps) {
  const path = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const inv = 1 - t;
    const a = inv * inv * inv;
    const b = 3 * inv * inv * t;
    const c = 3 * inv * t * t;
    const d = t * t * t;

    path.push({
      x: start.x * a + controlA.x * b + controlB.x * c + end.x * d,
      z: start.z * a + controlA.z * b + controlB.z * c + end.z * d
    });
  }

  return path;
}

function createExpresswayRampPath(route, options) {
  const rampLength = route.rampLength ?? EXPRESSWAY_MAP.rampLength;
  const sideOffset = getRampSideOffset(route, options.id, options.sideSign);
  const normal = {
    x: -options.tangent.z,
    z: options.tangent.x
  };
  const outward = {
    x: options.tangent.x * options.outwardSign,
    z: options.tangent.z * options.outwardSign
  };
  const ground = {
    x: options.deckPoint.x + outward.x * rampLength + normal.x * sideOffset,
    z: options.deckPoint.z + outward.z * rampLength + normal.z * sideOffset
  };
  const path = createSmoothExpresswayRampPath(ground, options.deckPoint, outward, rampLength);

  return {
    id: options.id,
    label: options.label,
    deck: options.deckPoint,
    ground,
    groundPoint: ground,
    rampLength,
    outward: normalizeVector2({
      x: path[0].x - path[1].x,
      z: path[0].z - path[1].z
    }),
    path
  };
}

function createSmoothExpresswayRampPath(ground, deckPoint, outward, rampLength) {
  const tangentLength = Math.max(92, Math.min(rampLength * 0.42, 180));
  const controlA = {
    x: ground.x - outward.x * tangentLength,
    z: ground.z - outward.z * tangentLength
  };
  const controlB = {
    x: deckPoint.x + outward.x * tangentLength,
    z: deckPoint.z + outward.z * tangentLength
  };

  return sampleCubicPath(ground, controlA, controlB, deckPoint, 24);
}

function getRampSideOffset(route, rampId, sideSign) {
  const configured = route.rampSideOffsets?.[rampId];

  if (Number.isFinite(configured)) return configured;

  return sideSign * 86;
}

function normalizeVector2(vector) {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.000001) {
    return { x: 1, z: 0 };
  }

  return {
    x: vector.x / length,
    z: vector.z / length
  };
}

export function worldToChunkCoord(position) {
  if (!isPositionInsideWorld(position)) return null;

  return {
    chunkX: clamp(
      Math.floor(position.x / WORLD_SETTINGS.chunkSize),
      WORLD_SETTINGS.minChunkX,
      WORLD_SETTINGS.maxChunkX
    ),
    chunkZ: clamp(
      Math.floor(position.z / WORLD_SETTINGS.chunkSize),
      WORLD_SETTINGS.minChunkZ,
      WORLD_SETTINGS.maxChunkZ
    )
  };
}

export function chunkCoordToWorldPosition(chunkX, chunkZ) {
  return {
    x: chunkX * WORLD_SETTINGS.chunkSize,
    y: 0,
    z: chunkZ * WORLD_SETTINGS.chunkSize
  };
}

export function getChunkKey(chunkX, chunkZ) {
  return `${chunkX}:${chunkZ}`;
}

export function isChunkCoordInsideWorld(chunkX, chunkZ) {
  return (
    Number.isInteger(chunkX) &&
    Number.isInteger(chunkZ) &&
    chunkX >= WORLD_SETTINGS.minChunkX &&
    chunkX <= WORLD_SETTINGS.maxChunkX &&
    chunkZ >= WORLD_SETTINGS.minChunkZ &&
    chunkZ <= WORLD_SETTINGS.maxChunkZ
  );
}

export function isPositionInsideWorld(position) {
  if (!position) return false;

  return (
    Number.isFinite(position.x) &&
    Number.isFinite(position.z) &&
    position.x >= WORLD_SETTINGS.worldMinX &&
    position.x <= WORLD_SETTINGS.worldMaxX &&
    position.z >= WORLD_SETTINGS.worldMinZ &&
    position.z <= WORLD_SETTINGS.worldMaxZ
  );
}

export function getChunkBounds(chunkX, chunkZ) {
  const origin = chunkCoordToWorldPosition(chunkX, chunkZ);
  const size = WORLD_SETTINGS.chunkSize;

  return {
    minX: origin.x,
    maxX: origin.x + size,
    minZ: origin.z,
    maxZ: origin.z + size,
    centerX: origin.x + size / 2,
    centerZ: origin.z + size / 2,
    size
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
