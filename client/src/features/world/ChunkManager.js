import {
  EXPRESSWAY_MAP,
  SCENIC_MOUNTAIN,
  TERRAIN_LANDFORMS,
  TRANSPORT_HIGHWAY,
  TRANSPORT_HUBS,
  getExpresswayRampPaths,
  getExpresswayRoutePoints,
  getChunkBounds,
  getChunkKey,
  isChunkCoordInsideWorld,
  WORLD_SETTINGS,
  worldToChunkCoord
} from './worldConfig.js';
import { METRO_LINE_DEFINITIONS } from './metroLines.js';
import { localOffsetToWorld } from './utils/math.js';

const BUILDING_PALETTE = ['#c28f69', '#7898a8', '#a3aa78', '#d1bb78', '#9b89b0'];
const BILLBOARD_PALETTE = ['#f2d486', '#75b7d8', '#e36d5c', '#9fd08c', '#d9d3ff'];
const DISTRICT_PROFILES = {
  economic: {
    id: 'economic',
    name: 'Economic Core',
    buildingGrid: 26,
    billboardChance: 0.96,
    billboardMax: 9,
    centerPatchExtra: 24,
    edgePadding: 14,
    highRiseBias: 0.48,
    highRiseHeight: [118, 252],
    highRiseSize: [16, 31],
    highRiseSurpriseChance: 0.08,
    lowRiseHeight: [32, 86],
    lowRiseSize: [15, 34],
    localStreetCenterClearance: 56,
    localStreetSpacing: 118,
    localStreetWidth: 10.5,
    openTreeClusterThreshold: 0.88,
    openTreeSkip: 0.98,
    openTreeSpacing: 168,
    palette: ['#5f7580', '#7898a8', '#9b89b0', '#cfd4ca', '#d1bb78', '#6f8490'],
    maxMovingVehicles: 12,
    maxStreetLights: 32,
    maxTrees: 14,
    propCount: 3,
    roadClearance: 14,
    roadTreeSkip: 0.72,
    roadWidthMultiplier: {
      groundRoad: 1.12,
      local: 1.12,
      main: 1.18,
      mainRoad: 1.18
    },
    streetLightBothSides: true,
    streetLightSpacing: 76,
    trafficDensity: 0.94,
    treeSpacing: 180,
    vacancy: 0.004
  },
  commercial: {
    id: 'commercial',
    name: 'Commerce Row',
    buildingGrid: 30,
    billboardChance: 0.88,
    billboardMax: 6,
    edgePadding: 18,
    highRiseBias: 0.26,
    highRiseHeight: [58, 148],
    lowRiseHeight: [16, 48],
    lowRiseSize: [15, 31],
    openTreeSkip: 0.88,
    palette: ['#7898a8', '#aeb8b8', '#d1bb78', '#9b89b0', '#5f7580'],
    maxMovingVehicles: 9,
    maxStreetLights: 28,
    maxTrees: 14,
    roadTreeSkip: 0.68,
    streetLightSpacing: 92,
    treeSpacing: 180,
    vacancy: 0.012
  },
  oldTown: {
    id: 'oldTown',
    name: 'Old Quarter',
    buildingGrid: 26,
    billboardChance: 0.38,
    billboardMax: 3,
    edgePadding: 16,
    highRiseBias: 0.035,
    highRiseHeight: [34, 62],
    highRiseSize: [12, 21],
    highRiseSurpriseChance: 0.015,
    lowRiseHeight: [8, 24],
    lowRiseSize: [10, 22],
    localStreetCenterClearance: 30,
    localStreetEdgeInset: 24,
    localStreetSpacing: 68,
    localStreetWidth: 6.6,
    maxMovingVehicles: 8,
    maxStreetLights: 30,
    maxTrees: 16,
    openTreeClusterThreshold: 0.68,
    openTreeSkip: 0.9,
    openTreeSpacing: 138,
    palette: ['#c28f69', '#d1bb78', '#cfd4ca', '#a3aa78', '#9b89b0'],
    propCount: 5,
    roadClearance: 10,
    roadTreeSkip: 0.45,
    streetLightSpacing: 94,
    trafficDensity: 0.68,
    treeSpacing: 150,
    vacancy: 0.018
  },
  downtown: {
    id: 'downtown',
    name: 'Downtown Core',
    buildingGrid: 28,
    billboardChance: 0.94,
    billboardMax: 8,
    edgePadding: 16,
    highRiseBias: 0.38,
    highRiseHeight: [88, 196],
    lowRiseHeight: [24, 64],
    lowRiseSize: [14, 29],
    openTreeSkip: 0.94,
    palette: ['#7898a8', '#6f8490', '#9b89b0', '#aeb8b8', '#cfd4ca'],
    maxMovingVehicles: 11,
    maxStreetLights: 34,
    maxTrees: 12,
    roadTreeSkip: 0.74,
    streetLightSpacing: 84,
    treeSpacing: 190,
    vacancy: 0.008
  },
  harbor: {
    id: 'harbor',
    name: 'Harbor Fringe',
    buildingGrid: 34,
    billboardChance: 0.62,
    billboardMax: 4,
    edgePadding: 24,
    highRiseBias: 0.14,
    highRiseHeight: [48, 92],
    lowRiseHeight: [10, 30],
    lowRiseSize: [20, 44],
    openTreeSkip: 0.84,
    palette: ['#7898a8', '#c28f69', '#a3aa78', '#5f7580'],
    maxMovingVehicles: 7,
    maxStreetLights: 22,
    maxTrees: 10,
    roadTreeSkip: 0.72,
    propCount: 4,
    streetLightSpacing: 116,
    treeSpacing: 200,
    vacancy: 0.025
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial Works',
    buildingGrid: 46,
    billboardChance: 0.56,
    billboardMax: 4,
    edgePadding: 30,
    highRiseBias: 0.03,
    highRiseHeight: [36, 72],
    highRiseSize: [26, 50],
    highRiseSurpriseChance: 0.02,
    lowRiseHeight: [12, 32],
    lowRiseSize: [30, 70],
    localStreetCenterClearance: 64,
    localStreetEdgeInset: 42,
    localStreetSpacing: 152,
    localStreetWidth: 11.2,
    maxMovingVehicles: 8,
    maxStreetLights: 20,
    maxTrees: 8,
    openTreeClusterThreshold: 0.94,
    openTreeSkip: 0.98,
    openTreeSpacing: 196,
    palette: ['#c28f69', '#7898a8', '#a3aa78', '#6f8490', '#d1bb78'],
    propCount: 8,
    roadClearance: 18,
    roadTreeSkip: 0.74,
    streetLightSpacing: 132,
    trafficDensity: 0.72,
    truckChance: 0.38,
    treeSpacing: 220,
    vacancy: 0.045
  },
  residential: {
    id: 'residential',
    name: 'Garden Residential',
    buildingGrid: 38,
    billboardChance: 0.32,
    billboardMax: 2,
    edgePadding: 22,
    highRiseBias: 0.1,
    highRiseHeight: [36, 72],
    highRiseSize: [18, 28],
    highRiseSurpriseChance: 0.035,
    lowRiseHeight: [10, 30],
    lowRiseSize: [15, 31],
    localStreetCenterClearance: 48,
    localStreetEdgeInset: 36,
    localStreetSpacing: 106,
    localStreetWidth: 8.2,
    maxMovingVehicles: 7,
    maxStreetLights: 26,
    maxTrees: 18,
    openTreeClusterThreshold: 0.58,
    openTreeSkip: 0.88,
    openTreeSpacing: 136,
    palette: ['#d1bb78', '#a3aa78', '#c28f69', '#7898a8', '#cfd4ca', '#9fd08c'],
    propCount: 4,
    roadClearance: 12,
    roadTreeSkip: 0.56,
    streetLightSpacing: 108,
    trafficDensity: 0.72,
    treeSpacing: 150,
    vacancy: 0.025
  }
};
export const ROAD_TYPES = {
  groundRoad: 'groundRoad',
  mainRoad: 'mainRoad',
  highway: 'highway',
  elevatedHighway: 'elevatedHighway',
  ramp: 'ramp',
  roundabout: 'roundabout',
  tunnelEntrance: 'tunnelEntrance',
  parking: 'parking'
};
const ROAD_PROFILES = {
  groundRoad: { width: 8.5, markInterval: 180, markLength: 12 },
  mainRoad: { width: 16, markInterval: 140, markLength: 20 },
  highway: { width: 28, markInterval: 132, markLength: 26 },
  elevatedHighway: { width: 25, markInterval: 132, markLength: 26 },
  ramp: { width: 20, markInterval: 118, markLength: 22 },
  main: { width: 16, markInterval: 140, markLength: 20 },
  local: { width: 8.5, markInterval: 180, markLength: 10 },
  parking: { width: 72, markInterval: 12, markLength: 7 }
};
const ROAD_RENDER_Y = {
  groundRoad: 0.044,
  local: 0.044,
  main: 0.046,
  mainRoad: 0.046,
  highway: 0.05,
  parking: 0.04
};
const ROAD_SIDES = ['north', 'east', 'south', 'west'];
const OPPOSITE_SIDE = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east'
};
const SIDE_OFFSETS = {
  north: { chunkX: 0, chunkZ: -1 },
  east: { chunkX: 1, chunkZ: 0 },
  south: { chunkX: 0, chunkZ: 1 },
  west: { chunkX: -1, chunkZ: 0 }
};
const TWO_WAY_SHAPES = [
  ['north', 'south'],
  ['east', 'west'],
  ['north', 'east'],
  ['east', 'south'],
  ['south', 'west'],
  ['west', 'north']
];
const THREE_WAY_SHAPES = [
  ['north', 'east', 'south'],
  ['east', 'south', 'west'],
  ['south', 'west', 'north'],
  ['west', 'north', 'east']
];
const SAFE_POINT_CLEARANCE = 3.2;
const SAFE_POINT_MIN_COUNT = 6;
const SAFE_POINT_MAX_COUNT = 24;
const SAFE_POINT_Y = WORLD_SETTINGS.teleportAnchors.downtown.position[1];
const CHUNK_DATA_CACHE_LIMIT = 48;
const SPAWN_CLEAR_RADIUS = 82;
const SPAWN_VIEW_CLEAR_DISTANCE = 285;
const SPAWN_VIEW_REAR_CLEAR_DISTANCE = 68;
const SPAWN_VIEW_CLEAR_HALF_WIDTH = 230;
const GROUND_DRIVE_Y = SAFE_POINT_Y;
const SHOWCASE_DISTRICT_NAME = 'Showcase District';
const SHOWCASE_CHUNK_KEY = '0:0';
const HARBOR_ISLAND_Z = 750;
const SHOWCASE_MAIN_DEPTH = 34;
const EXPRESSWAY_Y = EXPRESSWAY_MAP.elevation;
const EXPRESSWAY_WIDTH = EXPRESSWAY_MAP.deckWidth;
const EXPRESSWAY_RAMP_WIDTH = EXPRESSWAY_MAP.rampWidth;
const BRIDGE_VERTICAL_CLEARANCE = 3.8;
const BRIDGE_STACK_GAP = 7.2;
const EXPRESSWAY_SUPPORT_SPACING = 50;
const EXPRESSWAY_GUARDRAIL_HEIGHT = 3.2;
const EXPRESSWAY_GUARDRAIL_THICKNESS = 0.92;
const EXPRESSWAY_SUPPORT_ROAD_CLEARANCE = 24;
const EXPRESSWAY_ROUTES = EXPRESSWAY_MAP.routes;
const FAST_ROAD_OBSTACLE_CLEARANCE = 86;
const TRANSPORT_HUB_LIST = Object.values(TRANSPORT_HUBS);
const TRANSPORT_OVERPASS_Y = 5.4;
const HIGHEST_TRANSPORT_OVERPASS_Y = TRANSPORT_OVERPASS_Y;
const MIN_EXPRESSWAY_ROUTE_Y = HIGHEST_TRANSPORT_OVERPASS_Y + EXPRESSWAY_GUARDRAIL_HEIGHT + BRIDGE_VERTICAL_CLEARANCE;
const TRANSPORT_OVERPASS_RAMP_LENGTH = 160;
const TRANSPORT_OVERPASS_DECK_HALF_LENGTH = 48;
const TRANSPORT_OVERPASS_SUPPORT_SPACING = 50;
const TRANSPORT_OVERPASS_HORIZONTAL_CLEARANCE = 18;
const TRANSPORT_OVERPASS_DETOUR_OFFSETS = [84, 124, 168, 220, 280, 360];
const TRANSPORT_TUNNEL_TARGET_U = 0.48;
const TRANSPORT_BRIDGE_TARGET_U = 0.62;
const TRANSPORT_MAX_SELECTED_BRIDGES = 0;
const TRANSPORT_STRUCTURE_CONNECTOR_LENGTH = 300;
const TRANSPORT_STRUCTURE_GAP_FILL_MAX_LENGTH = 560;
const TRANSPORT_STRUCTURE_GAP_FILL_MIN_LENGTH = 14;
const ROAD_ENDPOINT_GAP_FILL_MAX_LENGTH = 760;
const ROAD_ENDPOINT_GAP_FILL_MIN_LENGTH = 10;
const ROAD_EDGE_SEAM_CAP_DEPTH = 20;
const ROAD_EDGE_SEAM_CAP_EXTRA = 7;
const FAST_ROADS_UNDERGROUND = true;
const FAST_ROAD_TUNNEL_Y = GROUND_DRIVE_Y - 5.65;
const TRANSPORT_HIGHWAY_TUNNEL_Y = FAST_ROAD_TUNNEL_Y - 6.1;
const FAST_ROAD_TUNNEL_RAMP_LENGTH = 420;
const FAST_ROAD_RAMP_CUTOUT_EXTRA_WIDTH = 5.2;
const FAST_ROAD_TUNNEL_BOX_CLEARANCE = 5.35;
const FAST_ROAD_TUNNEL_BOX_WALL_THICKNESS = 0.82;
const FAST_ROAD_TUNNEL_ENVELOPE_PORTAL_INSET = 72;
const TRANSPORT_HIGHWAY_TERMINAL_PORTAL_BACKOFF = 150;
const TRANSPORT_HIGHWAY_TERMINAL_PORTAL_SIDE_OFFSET = TRANSPORT_HIGHWAY.width + 50;
const TRANSPORT_HIGHWAY_TERMINAL_RAMP_WIDTH = 32;
const TRANSPORT_HIGHWAY_TERMINAL_MERGE_WIDTH = 38;
const TRANSPORT_HIGHWAY_TERMINAL_CONNECTOR_WIDTH = 22;
const TRANSPORT_SURFACE_AVENUE_WIDTH = TRANSPORT_HIGHWAY.width;
const TRANSPORT_SURFACE_AVENUE_TREE_SPACING = 92;
const TRANSPORT_SURFACE_AVENUE_INTERSECTION_MIN_SPACING = 72;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_COUNT = 5;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH = 13.6;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_RAMP_LENGTH = 236;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_PORTAL_OPENING_LENGTH = 72;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_PAIR_OFFSET = 420;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_EXIT_SPACING = 520;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_OUTER_OFFSET = TRANSPORT_SURFACE_AVENUE_WIDTH / 2 + 12;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_MERGE_OFFSET = TRANSPORT_SURFACE_AVENUE_WIDTH / 6 * 2.5;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_SIDE_ENTRY_OFFSET = TRANSPORT_SURFACE_AVENUE_WIDTH / 2 + TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH * 0.72;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_MEDIAN_GAP = 158;
const TRANSPORT_SURFACE_TUNNEL_ACCESS_SMOOTH_SEGMENTS = 8;
const SCENIC_MOUNTAIN_ROAD_WIDTH = 11.5;
const SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT = 1.1;
const SCENIC_MOUNTAIN_GUARDRAIL_THICKNESS = 0.62;
const TERRAIN_LANDFORM_BUILDING_CLEARANCE = 8;
const SCENIC_MOUNTAIN_SUMMIT_PAD_SIZE = 34;
const CITY_BUS_TERMINAL = { x: -620, z: -620 };
const CITY_BUS_ROUTES = [
  {
    id: 'B1',
    color: '#d1bb78',
    name: 'Airport Express',
    points: [
      CITY_BUS_TERMINAL,
      { x: -1480, z: -620 },
      { x: -3060, z: 1040 },
      { x: -5520, z: 4740 }
    ],
    stops: [
      { x: -620, z: -620, name: 'Central Terminal' },
      { x: -1480, z: -620, name: 'West Offices' },
      { x: -3060, z: 1040, name: 'Logistics Park' },
      { x: -5520, z: 4740, name: 'Airport' }
    ]
  },
  {
    id: 'B2',
    color: '#75b7d8',
    name: 'Station Line',
    points: [
      CITY_BUS_TERMINAL,
      { x: 980, z: -680 },
      { x: 3140, z: -2480 },
      { x: 5520, z: -5060 }
    ],
    stops: [
      { x: -620, z: -620, name: 'Central Terminal' },
      { x: 980, z: -680, name: 'Central Offices' },
      { x: 3140, z: -2480, name: 'East District' },
      { x: 5520, z: -5060, name: 'Train Station' }
    ]
  },
  {
    id: 'B3',
    color: '#9fd08c',
    name: 'Garden Loop',
    points: [
      CITY_BUS_TERMINAL,
      { x: -760, z: 1180 },
      { x: 960, z: 2440 },
      { x: 2860, z: 2240 }
    ],
    stops: [
      { x: -620, z: -620, name: 'Central Terminal' },
      { x: -760, z: 1180, name: 'Old Quarter' },
      { x: 960, z: 2440, name: 'Garden Blocks' },
      { x: 2860, z: 2240, name: 'North Homes' }
    ]
  },
  {
    id: 'B4',
    color: '#c28f69',
    name: 'Industrial Line',
    points: [
      CITY_BUS_TERMINAL,
      { x: -2380, z: -1760 },
      { x: -4540, z: -3540 },
      { x: -6820, z: -4200 }
    ],
    stops: [
      { x: -620, z: -620, name: 'Central Terminal' },
      { x: -2380, z: -1760, name: 'Wholesale Market' },
      { x: -4540, z: -3540, name: 'Factory Gate' },
      { x: -6820, z: -4200, name: 'Freight Yard' }
    ]
  },
  {
    id: 'B5',
    color: '#d9d3ff',
    name: 'Crosstown',
    points: [
      CITY_BUS_TERMINAL,
      { x: 820, z: 700 },
      { x: 3180, z: 1120 },
      { x: 6040, z: 1600 }
    ],
    stops: [
      { x: -620, z: -620, name: 'Central Terminal' },
      { x: 820, z: 700, name: 'Hotel Row' },
      { x: 3180, z: 1120, name: 'Civic Center' },
      { x: 6040, z: 1600, name: 'East Park' }
    ]
  }
];
const CITY_TAXI_STANDS = [
  { id: 'central', x: -540, z: -710, label: 'Taxi' },
  { id: 'hotel-row', x: 820, z: 760, label: 'Taxi' },
  { id: 'airport', x: -5440, z: 4660, label: 'Taxi' },
  { id: 'station', x: 5480, z: -4985, label: 'Taxi' },
  { id: 'east-park', x: 6040, z: 1670, label: 'Taxi' }
];
const METRO_ELEVATED_Y = GROUND_DRIVE_Y + 10.4;
const METRO_HIGH_ELEVATED_Y = GROUND_DRIVE_Y + 16.2;
const METRO_GREEN_ELEVATED_Y = GROUND_DRIVE_Y + 22.0;
const METRO_EXPRESS_ELEVATED_Y = GROUND_DRIVE_Y + 27.6;
const METRO_AIRPORT_GREEN_TERMINAL_ELEVATED_Y = GROUND_DRIVE_Y + 5.6;
const METRO_AIRPORT_PURPLE_TERMINAL_ELEVATED_Y = GROUND_DRIVE_Y + 12.0;
const METRO_AIRPORT_LOW_ZONE_LENGTH = 1500;
const METRO_AIRPORT_RAMP_LENGTH = 1180;
const METRO_TRACK_CENTER_OFFSET = 4.8;
const METRO_RAIL_HALF_GAUGE = 0.72;
const METRO_TRACK_GUIDEWAY_WIDTH = 4.25;
const METRO_GUIDEWAY_WIDTH = 14.4;
const METRO_BUILDING_CLEARANCE_WIDTH = 78;
const METRO_PIER_ROAD_CLEARANCE = 15;
const METRO_PIER_CHUNK_EDGE_CLEARANCE = 38;
const METRO_PIER_SPACING = 38;
const METRO_STATION_SUPPORT_SPACING = 50;
const METRO_SERVICE_HEADWAY_SECONDS = 180;
const METRO_SERVICE_OFFSETS = [0, 0.25, 0.5, 0.75];
const METRO_STATION_DWELL_SECONDS = 25;
const METRO_TERMINAL_DWELL_SECONDS = 30;
const METRO_TRAIN_CAR_COUNT = 6;
const METRO_TRAIN_CAR_LENGTH = 17.8;
const METRO_TRAIN_CAR_GAP = 1.05;
const METRO_TRAIN_BODY_COLOR = '#f4f7f8';
const METRO_TRAIN_END_COLOR = '#edf2f4';
const METRO_STATION_LENGTH = 142;
const METRO_STATION_PLATFORM_WIDTH = 21.2;
const METRO_STATION_STRAIGHT_SEARCH_RADIUS = 520;
const METRO_STATION_STRAIGHT_SEARCH_STEP = 18;
const METRO_TERMINAL_TURNBACK_DISTANCE = 96;
const METRO_TERMINAL_STOP_FRONT_CLEARANCE = 3.4;
const METRO_GANTRY_LATERAL_OFFSET = METRO_GUIDEWAY_WIDTH / 2 + 1.7;
const METRO_GANTRY_POST_BASE_OFFSET = 0.94;
const METRO_GANTRY_POST_HEIGHT = 4.78;
const METRO_GANTRY_BAR_BASE_OFFSET = 5.18;
const METRO_TERRAIN_TUNNEL_WIDTH = 34;
const METRO_TERRAIN_TUNNEL_CLEARANCE = 62;
const METRO_TERRAIN_TUNNEL_ROOF_HEIGHT = 0.72;
const METRO_TERRAIN_TUNNEL_WALL_HEIGHT = 4.35;
const METRO_TERRAIN_TUNNEL_TARGETS = [
  {
    landformId: SCENIC_MOUNTAIN.id,
    lineId: 'red',
    lobeRadiusScale: 0.54,
    lobeHeightScale: 0.92,
    clearance: 72
  },
  {
    landformId: 'east-mountain-a',
    lineId: 'blue',
    lobeRadiusScale: 0.5,
    lobeHeightScale: 0.9,
    clearance: 58
  }
];
const METRO_STRUCTURAL_WHITE = '#07090d';
const METRO_SOFT_WHITE = '#101419';
const METRO_STATION_PLATFORM_COLOR = '#c8d3d6';
const METRO_STATION_CANOPY_COLOR = '#dce5e7';
const METRO_STATION_COLUMN_COLOR = '#eef4f5';
const METRO_STATION_GLASS_COLOR = '#24343d';
const METRO_STATION_ACCESS_COLOR = '#8fa0a6';
const METRO_STATION_DECK_COLOR = '#b9c7ca';
const METRO_GUIDEWAY_COLOR = '#05070a';
const METRO_BLACK = '#05070a';
const METRO_DARK = '#0b0f14';
const METRO_DARK_TRIM = '#161b20';
const METRO_RAIL_COLOR = '#0c1014';
const METRO_WARM_LIGHT = '#fff3d0';
const METRO_LINES = createMetroLines();
const TRANSPORT_UNDERPASS_Y = GROUND_DRIVE_Y - 5.65;
const TRANSPORT_UNDERPASS_LEVEL_GAP = 0;
const TRANSPORT_UNDERPASS_LEVEL_COUNT = 1;
const TRANSPORT_UNDERPASS_RAMP_LENGTH = 160;
const TRANSPORT_UNDERPASS_MAX_RAMP_LENGTH = 420;
const TRANSPORT_UNDERPASS_TARGET_RAMP_GRADE = 0.044;
const TRANSPORT_UNDERPASS_TUNNEL_HALF_LENGTH = 74;
const TRANSPORT_UNDERPASS_LIGHT_SPACING = 44;
const TRANSPORT_UNDERPASS_EXCAVATION_LIP_HEIGHT = 0.26;
const TRANSPORT_UNDERPASS_EXCAVATION_LIP_THICKNESS = 0.72;
const LOCAL_STREET_SPACING = 96;
const LOCAL_STREET_WIDTH = 7.8;
const LOCAL_STREET_EDGE_INSET = 32;
const LOCAL_STREET_CENTER_CLEARANCE = 46;
const LOCAL_STREET_MIN_LENGTH = 42;
const TUNNEL_CLEARANCE_HEIGHT = 4.55;
const TUNNEL_INTERIOR_WALL_THICKNESS = 0.72;
const DEBUG_TUNNEL_CHUNK_HINTS = [
  [-12, 9],
  [-11, 8],
  [-9, 7],
  [-8, 6],
  [-7, 5],
  [-6, 4],
  [-5, 3],
  [-4, 2],
  [-3, 1],
  [-1, 0],
  [0, -1],
  [1, -2],
  [2, -3],
  [3, -4],
  [4, -5],
  [5, -6],
  [6, -7],
  [8, -8],
  [9, -9],
  [10, -10]
];
const EXPRESSWAY_FEEDER_WIDTH = 10;
const EXPRESSWAY_RAMP_LANDING_CLEARANCE = 18;
const HIGHWAY_SIDE_GUARDRAIL_HEIGHT = 3.2;
const HIGHWAY_SIDE_GUARDRAIL_THICKNESS = 0.92;
const HIGHWAY_MEDIAN_GUARDRAIL_HEIGHT = 2.35;
const HIGHWAY_MEDIAN_GUARDRAIL_THICKNESS = 0.96;
const TRAFFIC_DRIVE_SIDE = 'right';
const TRAFFIC_LEFT_LANE_OFFSET = 3.8;
const BUS_STOP_BAY_OFFSET = 6.9;
const BUS_STOP_ROADSIDE_OFFSET = 14.6;
const BUS_STOP_SIGN_OFFSET = 17.2;
const GROUND_TRAFFIC_SPEED_LIMIT_KMH = 80;
const TERMINAL_ELEVATED_ACCESS_Y = GROUND_DRIVE_Y + 6.2;
const chunkDataCache = new Map();

export class ChunkManager {
  constructor({ loadRadius = WORLD_SETTINGS.loadRadius } = {}) {
    this.loadRadius = loadRadius;
    this.loadedChunks = new Map();
  }

  setLoadRadius(loadRadius = WORLD_SETTINGS.loadRadius) {
    const nextRadius = Number.isFinite(loadRadius)
      ? Math.max(1, Math.round(loadRadius))
      : WORLD_SETTINGS.loadRadius;

    this.loadRadius = nextRadius;
  }

  updateForPlayerPosition(position) {
    const currentChunk = worldToChunkCoord(position);

    if (!currentChunk) {
      const removedKeys = this.unloadAll();
      return this.createSnapshot(null, [], removedKeys);
    }

    const requiredCoords = getRequiredChunkCoords(currentChunk, this.loadRadius);
    const requiredKeys = new Set(
      requiredCoords.map(({ chunkX, chunkZ }) => getChunkKey(chunkX, chunkZ))
    );
    const addedKeys = [];
    const removedKeys = [];

    for (const coord of requiredCoords) {
      const key = getChunkKey(coord.chunkX, coord.chunkZ);

      if (!this.loadedChunks.has(key)) {
        this.loadedChunks.set(key, getChunkData(coord.chunkX, coord.chunkZ));
        addedKeys.push(key);
      }
    }

    for (const key of this.loadedChunks.keys()) {
      if (!requiredKeys.has(key)) {
        this.loadedChunks.delete(key);
        releaseChunkData(key);
        removedKeys.push(key);
      }
    }

    return this.createSnapshot(currentChunk, addedKeys, removedKeys);
  }

  async updateForPlayerPositionAsync(position, { onProgress, shouldContinue = () => true } = {}) {
    const currentChunk = worldToChunkCoord(position);

    if (!shouldContinue()) return null;

    if (!currentChunk) {
      const removedKeys = this.unloadAll();
      return this.createSnapshot(null, [], removedKeys);
    }

    const requiredCoords = getRequiredChunkCoords(currentChunk, this.loadRadius);
    const requiredKeys = new Set(
      requiredCoords.map(({ chunkX, chunkZ }) => getChunkKey(chunkX, chunkZ))
    );
    const addedKeys = [];
    const removedKeys = [];
    const coordsToLoad = [];

    for (const key of this.loadedChunks.keys()) {
      if (!requiredKeys.has(key)) {
        this.loadedChunks.delete(key);
        releaseChunkData(key);
        removedKeys.push(key);
      }
    }

    for (const coord of requiredCoords) {
      const key = getChunkKey(coord.chunkX, coord.chunkZ);

      if (!this.loadedChunks.has(key)) {
        coordsToLoad.push({ ...coord, key });
      }
    }

    onProgress?.({
      loaded: 0,
      total: coordsToLoad.length,
      currentChunk,
      addedKeys,
      removedKeys
    });

    for (let index = 0; index < coordsToLoad.length; index += 1) {
      if (!shouldContinue()) return null;

      const coord = coordsToLoad[index];

      this.loadedChunks.set(coord.key, getChunkData(coord.chunkX, coord.chunkZ));
      addedKeys.push(coord.key);

      onProgress?.({
        loaded: index + 1,
        total: coordsToLoad.length,
        currentChunk,
        addedKeys,
        removedKeys
      });

      await yieldToBrowser();
    }

    if (!shouldContinue()) return null;

    return this.createSnapshot(currentChunk, addedKeys, removedKeys);
  }

  unloadAll() {
    const removedKeys = [...this.loadedChunks.keys()];

    for (const key of removedKeys) {
      releaseChunkData(key);
    }

    this.loadedChunks.clear();

    return removedKeys;
  }

  createSnapshot(currentChunk, addedKeys, removedKeys) {
    const loadedChunks = sortChunks([...this.loadedChunks.values()].filter(Boolean));
    const loadedChunkKeys = loadedChunks.map((chunk) => chunk.key);
    const colliders = loadedChunks.flatMap((chunk) => chunk.colliders);
    const roadColliders = loadedChunks.flatMap((chunk) => chunk.roadColliders);
    const driveSurfaces = loadedChunks.flatMap((chunk) => chunk.driveSurfaces);
    const currentKey = currentChunk ? getChunkKey(currentChunk.chunkX, currentChunk.chunkZ) : null;
    const currentChunkData = currentKey ? this.loadedChunks.get(currentKey) : null;

    return {
      currentChunk,
      currentAreaName: currentChunkData?.districtName ?? 'Procedural City',
      loadedChunks,
      loadedChunkKeys,
      addedKeys,
      removedKeys,
      colliders,
      driveSurfaces,
      roadColliders
    };
  }
}

export function getRequiredChunkCoords(currentChunk, radius = WORLD_SETTINGS.loadRadius) {
  const coords = [];

  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const chunkX = currentChunk.chunkX + dx;
      const chunkZ = currentChunk.chunkZ + dz;

      if (isChunkCoordInsideWorld(chunkX, chunkZ)) {
        coords.push({ chunkX, chunkZ });
      }
    }
  }

  return coords;
}

export function generateChunk(chunkX, chunkZ) {
  const key = getChunkKey(chunkX, chunkZ);
  const bounds = getChunkBounds(chunkX, chunkZ);
  const terrain = getChunkTerrain(chunkX, chunkZ, bounds);
  const proceduralEnabled = terrain.procedural !== false;
  const roadInfoBase = proceduralEnabled
    ? generateRoadInfo(chunkX, chunkZ, bounds)
    : createEmptyRoadInfo(chunkX, chunkZ);
  const districtProfile = proceduralEnabled
    ? getDistrictProfile(chunkX, chunkZ, terrain, roadInfoBase)
    : null;
  const {
    parkingMarks,
    roadColliders,
    roads,
    roundabouts,
    roundaboutColliders
  } = proceduralEnabled
    ? generateRoads(bounds, roadInfoBase, chunkX, chunkZ, districtProfile)
    : {
        parkingMarks: [],
        roadColliders: [],
        roads: [],
        roundabouts: [],
        roundaboutColliders: []
      };
  const showcase = generateShowcaseDistrict(bounds, chunkX, chunkZ);

  roads.push(...showcase.roads);
  roadColliders.push(...showcase.roadColliders);
  roundabouts.push(...showcase.roundabouts);
  roundaboutColliders.push(...showcase.roundaboutColliders);
  parkingMarks.push(...showcase.parkingMarks);
  const transportCrossingRoads = FAST_ROADS_UNDERGROUND
    ? roads
    : extractTransportHighwayCrossingRoads(roads, roadColliders, bounds);
  const expressways = generateExpressways(
    bounds,
    chunkX,
    chunkZ,
    roads,
    FAST_ROADS_UNDERGROUND ? [] : getTransportHighwayClearanceRoads(bounds)
  );
  roads.push(...expressways.roads);
  roadColliders.push(...expressways.roadColliders);
  const transport = generateTransportFeatures(bounds, chunkX, chunkZ, transportCrossingRoads, expressways.roads);
  roads.push(...transport.roads);
  roadColliders.push(...transport.roadColliders);
  parkingMarks.push(...transport.parkingMarks);
  const scenicMountain = generateScenicMountainFeature(bounds, chunkX, chunkZ);
  roads.push(...scenicMountain.roads);
  roadColliders.push(...scenicMountain.roadColliders);
  removeGroundRoadsInsideScenicMountain(roads, roadColliders, parkingMarks, roundabouts, roundaboutColliders);
  if (!FAST_ROADS_UNDERGROUND) {
    removeResidualTransportHighwayGroundConflicts(roads, roadColliders, parkingMarks, roundabouts, roundaboutColliders);
  }
  removeGroundRoadsConflictingWithTransportStructures(roads, roadColliders, parkingMarks, roundabouts, roundaboutColliders);
  removeParkingNearFastRoads(roads, roadColliders, parkingMarks);
  removeParkingOverlappingRoads(roads, roadColliders, parkingMarks);
  removeParkingLotsWithoutAccess(roads, roadColliders, parkingMarks);
  addTransportStructureRoadGapFillers(roads, roadColliders, bounds, chunkX, chunkZ);
  addRoadEndpointGapFillers(roads, roadColliders, bounds, chunkX, chunkZ);
  addRoadEdgeSeams(roads, roadColliders, bounds, chunkX, chunkZ);
  removeParkingOverlappingRoads(roads, roadColliders, parkingMarks);
  removeUnusedRoadFragments(roads, roadColliders, parkingMarks, bounds);
  removeParkingLotsWithoutAccess(roads, roadColliders, parkingMarks);
  applyFastRoadTunnelOpeningVisualGaps(roads);
  // Keep the six-lane surface avenue continuous; tunnel accesses branch from side roads.
  removeMetroSupportsOverRoads(transport.trafficObstacles, roads);
  const structureClearanceColliders = createStructureClearanceColliders([
    ...transport.trafficObstacles,
    ...(expressways.trafficObstacles ?? []),
    ...(expressways.roadSupports ?? [])
  ]);
  const roadClearanceColliders = createRoadClearanceColliders(roads, roundabouts);
  const generationBlockers = [
    ...roadColliders,
    ...structureClearanceColliders,
    ...scenicMountain.blockers
  ];

  const roadInfo = {
    ...roadInfoBase,
    collisionAreas: roadColliders
  };
  const laneMarks = generateLaneMarks(roads);
  const roadDetails = generateRoadDetails(roads);
  const medianColliders = generateRoadMedianColliders(roads);
  const roadDetailColliders = generateRoadDetailColliders(roadDetails);
  const { buildings, colliders: buildingColliders } = proceduralEnabled
    ? generateBuildings(
        bounds,
        generationBlockers,
        chunkX,
        chunkZ,
        roadInfo,
        districtProfile,
        roads
      )
    : { buildings: [], colliders: [] };
  removeRoadIntrudingBuildings(buildings, buildingColliders, generationBlockers, roads);
  const buildingsWithShowcase = [
    ...buildings,
    ...showcase.buildings,
    ...transport.buildings
  ];
  const buildingCollidersWithShowcase = [
    ...buildingColliders,
    ...showcase.buildingColliders,
    ...transport.buildingColliders
  ];
  const terrainBuildingClearanceLandforms = generateTerrainLandformsForBuildingClearance(bounds);
  removeRoadIntrudingBuildings(buildingsWithShowcase, buildingCollidersWithShowcase, generationBlockers, roads);
  removeBuildingsNearMetroClearance(buildingsWithShowcase, buildingCollidersWithShowcase, roadColliders);
  removeBuildingsNearStructureClearance(buildingsWithShowcase, buildingCollidersWithShowcase, structureClearanceColliders);
  removeBuildingsInsideTerrainLandforms(
    buildingsWithShowcase,
    buildingCollidersWithShowcase,
    terrainBuildingClearanceLandforms
  );
  const decorationBlockers = [
    ...roadClearanceColliders,
    ...generationBlockers,
    ...buildingCollidersWithShowcase
  ];
  const treeBlockers = [
    ...roadColliders,
    ...buildingCollidersWithShowcase
  ];
  const treeGeneration = proceduralEnabled
    ? generateTrees(bounds, roads, treeBlockers, chunkX, chunkZ, districtProfile)
    : { trees: [], colliders: [] };
  const trees = treeGeneration.trees;
  const treeColliders = treeGeneration.colliders;
  trees.push(...showcase.trees);
  trees.push(...transport.trees);
  treeColliders.push(...showcase.treeColliders);
  treeColliders.push(...transport.treeColliders);
  removeRoadIntrudingTrees(trees, treeColliders, roadColliders);
  const streetLightBlockers = [
    ...roadColliders,
    ...buildingCollidersWithShowcase,
    ...treeColliders
  ];
  const { streetLights, colliders: streetLightColliders } = proceduralEnabled
    ? generateStreetLights(
        bounds,
        roads,
        streetLightBlockers,
        chunkX,
        chunkZ,
        districtProfile
      )
    : { streetLights: [], colliders: [] };
  streetLights.push(...showcase.streetLights);
  streetLights.push(...transport.streetLights);
  streetLightColliders.push(...showcase.streetLightColliders);
  streetLightColliders.push(...transport.streetLightColliders);
  removeRoadIntrudingStreetLights(streetLights, streetLightColliders, roadColliders);
  const billboardBlockers = [
    ...streetLightBlockers,
    ...streetLightColliders
  ];
  const { billboards, colliders: billboardColliders } = proceduralEnabled
    ? generateBillboards(
        bounds,
        roads,
        billboardBlockers,
        chunkX,
        chunkZ,
        districtProfile
      )
    : { billboards: [], colliders: [] };
  const districtProps = proceduralEnabled
    ? generateDistrictProps(
        bounds,
        roads,
        [
          ...billboardBlockers,
          ...billboardColliders
        ],
        chunkX,
        chunkZ,
        districtProfile
      )
    : { trafficObstacles: [], colliders: [] };
  const directionalRoadSigns = proceduralEnabled
    ? generateDirectionalRoadSigns(
        bounds,
        roads,
        [
          ...buildingCollidersWithShowcase,
          ...treeColliders,
          ...streetLightColliders,
          ...billboardColliders,
          ...districtProps.colliders
        ],
        chunkX,
        chunkZ,
        districtProfile
      )
    : [];
  const { guardrails, colliders: guardrailColliders } = generateGuardrails();
  const highwaySafety = generateHighwaySafetyBarriers(roads);
  const generatedTunnels = generateTunnelEntrances(
    bounds,
    roads,
    roadInfo,
    chunkX,
    chunkZ
  );
  const tunnelEntrances = [
    ...generatedTunnels.tunnelEntrances,
    ...showcase.tunnelEntrances,
    ...transport.tunnelEntrances,
    ...(expressways.tunnelEntrances ?? [])
  ];
  const tunnelZones = [
    ...(generatedTunnels.tunnelZones ?? []),
    ...(showcase.tunnelZones ?? []),
    ...(transport.tunnelZones ?? []),
    ...(expressways.tunnelZones ?? [])
  ];
  const tunnelColliders = [
    ...generatedTunnels.colliders,
    ...showcase.tunnelColliders,
    ...transport.tunnelColliders,
    ...(expressways.tunnelColliders ?? [])
  ];
  const colliders = filterRoadAirWallColliders([
    ...buildingCollidersWithShowcase,
    ...treeColliders,
    ...streetLightColliders,
    ...billboardColliders,
    ...districtProps.colliders,
    ...guardrailColliders,
    ...expressways.guardrailColliders,
    ...transport.guardrailColliders,
    ...scenicMountain.guardrailColliders,
    ...highwaySafety.colliders,
    ...medianColliders,
    ...roadDetailColliders,
    ...tunnelColliders,
    ...roundaboutColliders
  ], roads);
  const driveSurfaces = createDriveSurfaces(roads, roundabouts);
  const trafficVehicles = [
    ...showcase.trafficVehicles,
    ...transport.trafficVehicles,
    ...generateTrafficVehicles(bounds, roads, chunkX, chunkZ, districtProfile)
  ].filter(isTrafficVehicleClearOfTransportHighwayConflict);
  const terrainLandforms = filterTerrainLandformsForBuiltStructures(
    generateTerrainLandforms(bounds, chunkX, chunkZ),
    roads,
    [
      ...transport.trafficObstacles,
      ...(expressways.trafficObstacles ?? []),
      ...(expressways.roadSupports ?? [])
    ]
  );
  const safeSpawnPoints = (
    proceduralEnabled || roads.length > 0
      ? generateSafeSpawnPoints(
          bounds,
          roads,
          roadColliders,
          colliders,
          chunkX,
          chunkZ,
          { includeOpenAreas: proceduralEnabled }
        )
      : []
  );
  safeSpawnPoints.push(...showcase.safeSpawnPoints);
  safeSpawnPoints.push(...transport.safeSpawnPoints);
  safeSpawnPoints.push(...scenicMountain.safeSpawnPoints);

  return {
    key,
    chunkX,
    chunkZ,
    bounds,
    terrainType: terrain.type,
    landforms: terrainLandforms,
    waterAreas: terrain.waterAreas,
    islands: terrain.islands,
    groundCutouts: [
      ...(transport.groundCutouts ?? []),
      ...(expressways.groundCutouts ?? [])
    ],
    roadInfo,
    districtName: transport.name ?? (key === SHOWCASE_CHUNK_KEY ? showcase.name : null) ?? districtProfile?.name ?? 'Procedural City',
    roads,
    roadColliders,
    roundabouts,
    parkingMarks,
    driveSurfaces,
    tunnelZones,
    safeSpawnPoints,
    laneMarks,
    roadDetails,
    roadSigns: [
      ...showcase.roadSigns,
      ...transport.roadSigns,
      ...expressways.roadSigns,
      ...directionalRoadSigns
    ],
    buildings: buildingsWithShowcase,
    trees,
    streetLights,
    billboards,
    guardrails: [
      ...guardrails,
      ...expressways.guardrails,
      ...transport.guardrails,
      ...scenicMountain.guardrails,
      ...highwaySafety.guardrails
    ],
    tunnelEntrances,
    trafficObstacles: [
      ...showcase.trafficObstacles,
      ...transport.trafficObstacles,
      ...(expressways.trafficObstacles ?? []),
      ...expressways.roadSupports,
      ...districtProps.trafficObstacles
    ],
    trafficVehicles,
    colliders
  };
}

export function getChunkData(chunkX, chunkZ) {
  if (!isChunkCoordInsideWorld(chunkX, chunkZ)) return null;

  const key = getChunkKey(chunkX, chunkZ);

  if (!chunkDataCache.has(key)) {
    chunkDataCache.set(key, generateChunk(chunkX, chunkZ));
    trimChunkDataCache();
  } else {
    const chunk = chunkDataCache.get(key);
    chunkDataCache.delete(key);
    chunkDataCache.set(key, chunk);
  }

  return chunkDataCache.get(key);
}

export function getDebugTunnelSample(index = 0, section = 'inside') {
  const zones = [];

  for (const [chunkX, chunkZ] of DEBUG_TUNNEL_CHUNK_HINTS) {
    const chunk = getChunkData(chunkX, chunkZ);
    if (!chunk?.tunnelZones?.length) continue;

    zones.push(...chunk.tunnelZones);
  }

  if (zones.length === 0) return null;

  const debugZones = section === 'approaching'
    ? zones.filter(isDebugTunnelApproachZone)
    : zones;
  const selectableZones = debugZones.length > 0 ? debugZones : zones;

  selectableZones.sort((left, right) => getTunnelZoneApproachLength(right) - getTunnelZoneApproachLength(left));
  const zone = selectableZones[((Math.trunc(index) % selectableZones.length) + selectableZones.length) % selectableZones.length];
  return getTunnelZoneDebugPoint(zone, section);
}

function isDebugTunnelApproachZone(zone) {
  return String(zone?.id ?? '').includes('entry-zone') ||
    getTunnelZoneApproachLength(zone) > 40;
}

function getTunnelZoneApproachLength(zone) {
  if (!zone?.rampStart || !zone?.tunnelStart || !zone?.tunnelEnd || !zone?.rampEnd) return 0;

  return Math.max(
    Math.hypot(zone.tunnelStart.x - zone.rampStart.x, zone.tunnelStart.z - zone.rampStart.z),
    Math.hypot(zone.rampEnd.x - zone.tunnelEnd.x, zone.rampEnd.z - zone.tunnelEnd.z)
  );
}

function getTunnelZoneDebugPoint(zone, section) {
  const tangent = normalizeVector({
    x: zone.rampEnd.x - zone.rampStart.x,
    z: zone.rampEnd.z - zone.rampStart.z
  });
  const heading = Math.atan2(tangent.x, tangent.z);
  const tunnelY = zone.y ?? GROUND_DRIVE_Y;
  let point;
  let y = tunnelY;

  if (section === 'approaching') {
    point = {
      x: zone.rampStart.x - tangent.x * 42,
      z: zone.rampStart.z - tangent.z * 42
    };
    y = GROUND_DRIVE_Y;
  } else if (section === 'entering') {
    point = lerpPoint(zone.rampStart, zone.tunnelStart, 0.72);
    y = lerp(GROUND_DRIVE_Y, tunnelY, 0.72);
  } else if (section === 'exiting') {
    point = lerpPoint(zone.tunnelEnd, zone.rampEnd, 0.34);
    y = lerp(tunnelY, GROUND_DRIVE_Y, 0.34);
  } else if (section === 'outside') {
    point = {
      x: zone.rampEnd.x + tangent.x * 42,
      z: zone.rampEnd.z + tangent.z * 42
    };
    y = GROUND_DRIVE_Y;
  } else {
    point = lerpPoint(zone.tunnelStart, zone.tunnelEnd, 0.48);
  }

  return {
    ...point,
    y,
    heading,
    section,
    zoneId: zone.id
  };
}

function releaseChunkData(key) {
  chunkDataCache.delete(key);
}

function trimChunkDataCache() {
  while (chunkDataCache.size > CHUNK_DATA_CACHE_LIMIT) {
    const oldestKey = chunkDataCache.keys().next().value;
    chunkDataCache.delete(oldestKey);
  }
}

function yieldToBrowser() {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(finish, { timeout: 24 });
      window.setTimeout(finish, 48);
      return;
    }

    window.requestAnimationFrame(finish);
    window.setTimeout(finish, 48);
  });
}

export function findNearestSafePoint(position) {
  const target = normalizeTargetPosition(position);
  const currentChunk = worldToChunkCoord(target) ?? { chunkX: 0, chunkZ: 0 };
  const maxRadius = Math.max(
    WORLD_SETTINGS.maxChunkX - WORLD_SETTINGS.minChunkX,
    WORLD_SETTINGS.maxChunkZ - WORLD_SETTINGS.minChunkZ
  );
  let nearest = null;
  let nearestDistanceSq = Infinity;

  for (let radius = 0; radius <= maxRadius; radius += 1) {
    for (const coord of getChunkCoordsInRadius(currentChunk, radius)) {
      const chunk = getChunkData(coord.chunkX, coord.chunkZ);

      if (!chunk) continue;

      for (const point of chunk.safeSpawnPoints) {
        const dx = point.position.x - target.x;
        const dz = point.position.z - target.z;
        const distanceSq = dx * dx + dz * dz;

        if (distanceSq < nearestDistanceSq) {
          nearest = point;
          nearestDistanceSq = distanceSq;
        }
      }
    }

    if (nearest && nearestDistanceSq <= WORLD_SETTINGS.chunkSize * WORLD_SETTINGS.chunkSize * radius * radius) {
      break;
    }
  }

  return nearest ? cloneSafePoint(nearest) : getRandomSafePointInChunk(0, 0);
}

export function getRandomSafePointInChunk(chunkX, chunkZ) {
  const chunk = getChunkData(chunkX, chunkZ);

  if (!chunk || chunk.safeSpawnPoints.length === 0) return null;

  const index = Math.floor(hashNumber(chunkX, chunkZ, 407) * chunk.safeSpawnPoints.length);
  return cloneSafePoint(chunk.safeSpawnPoints[index]);
}

export function getSafeTeleportPosition(targetPosition) {
  const target = normalizeTargetPosition(targetPosition);
  const targetChunk = worldToChunkCoord(target);
  const chunk = targetChunk ? getChunkData(targetChunk.chunkX, targetChunk.chunkZ) : null;

  if (chunk && isTeleportPositionSafeInChunk(target, chunk)) {
    const driveSurface = getDriveSurfaceAtPosition(target, chunk.driveSurfaces);

    return {
      x: target.x,
      y: driveSurface?.y ?? SAFE_POINT_Y,
      z: target.z,
      heading: getHeadingAtPosition(target, chunk, target.heading),
      chunkX: chunk.chunkX,
      chunkZ: chunk.chunkZ,
      safePointId: null
    };
  }

  const safePoint = findNearestSafePoint(target);

  return {
    x: safePoint.position.x,
    y: safePoint.position.y,
    z: safePoint.position.z,
    heading: safePoint.heading,
    chunkX: safePoint.chunkX,
    chunkZ: safePoint.chunkZ,
    safePointId: safePoint.id
  };
}

function getChunkTerrain(chunkX, chunkZ, bounds) {
  if (isHarborIslandChunk(chunkX, chunkZ)) {
    return {
      type: 'island',
      procedural: false,
      waterAreas: [createWaterArea(`water-${chunkX}:${chunkZ}`, bounds)],
      islands: [{
        id: 'harbor-island-ground',
        position: [2760, 0.02, HARBOR_ISLAND_Z],
        radius: 168,
        height: 0.22
      }]
    };
  }

  if (isOceanCrossingChunk(chunkX, chunkZ)) {
    return {
      type: 'ocean',
      procedural: false,
      waterAreas: [createWaterArea(`water-${chunkX}:${chunkZ}`, bounds)],
      islands: []
    };
  }

  if (isTransportHubChunk(chunkX, chunkZ)) {
    return {
      type: 'transport',
      procedural: false,
      waterAreas: [],
      islands: []
    };
  }

  return {
    type: 'land',
    procedural: true,
    waterAreas: [],
    islands: []
  };
}

function getDistrictProfile(chunkX, chunkZ, terrain, roadInfo) {
  if (terrain?.procedural === false) return null;
  if (isFormerLakeFillChunk(chunkX, chunkZ)) return DISTRICT_PROFILES.commercial;
  if (isHarborFringeChunk(chunkX, chunkZ)) return DISTRICT_PROFILES.harbor;

  const centerDistance = Math.hypot(chunkX, chunkZ);
  if (centerDistance <= 1.45) return DISTRICT_PROFILES.economic;

  const roll = hashNumber(chunkX, chunkZ, 934);
  const connectedRoadCount = countConnections(roadInfo.connections ?? makeConnections([]));

  if (isOldTownChunk(chunkX, chunkZ, centerDistance)) {
    return DISTRICT_PROFILES.oldTown;
  }

  if ((chunkX <= -2 && chunkZ >= 0) || (centerDistance > 3.2 && roll < 0.2)) {
    return DISTRICT_PROFILES.industrial;
  }

  if (connectedRoadCount >= 3 || roadInfo.type === 'cross' || roadInfo.type === 't') {
    return roll > 0.26 ? DISTRICT_PROFILES.commercial : DISTRICT_PROFILES.residential;
  }

  if (roll > 0.54) return DISTRICT_PROFILES.residential;
  if (roll < 0.28 && centerDistance > 2.4) return DISTRICT_PROFILES.industrial;
  return DISTRICT_PROFILES.commercial;
}

function isOldTownChunk(chunkX, chunkZ, centerDistance) {
  if (centerDistance <= 1.45 || centerDistance > 4.3) return false;
  if (chunkX >= -3 && chunkX <= 1 && chunkZ >= -1 && chunkZ <= 3) return true;
  return centerDistance <= 3.4 && hashNumber(chunkX, chunkZ, 936) < 0.16;
}

function isHarborFringeChunk(chunkX, chunkZ) {
  return false;
}

function isFormerLakeFillChunk(chunkX, chunkZ) {
  return chunkX >= 2 && chunkX <= 5 && chunkZ >= 0 && chunkZ <= 2;
}

function createWaterArea(id, bounds) {
  return {
    id,
    position: [bounds.centerX, -0.035, bounds.centerZ],
    scale: [bounds.size, bounds.size]
  };
}

function generateTerrainLandforms(bounds, chunkX, chunkZ) {
  return TERRAIN_LANDFORMS
    .filter((landform) => {
      const owner = worldToChunkCoord({ x: landform.center.x, z: landform.center.z });
      return owner?.chunkX === chunkX && owner?.chunkZ === chunkZ;
    })
    .flatMap((landform) => createTerrainLandformInstances(landform, bounds));
}

function generateTerrainLandformsForBuildingClearance(bounds) {
  return TERRAIN_LANDFORMS
    .filter(isRaisedTerrainLandform)
    .flatMap((landform) => [
      createTerrainLandformInstance(landform, bounds),
      ...createTerrainLandformInstances(landform, bounds)
    ])
    .filter((landform) => doesLandformFootprintOverlapChunk(
      landform,
      bounds,
      TERRAIN_LANDFORM_BUILDING_CLEARANCE
    ));
}

function createTerrainLandformInstances(landform, bounds) {
  const tunnelTarget = getMetroTerrainTunnelTargetForLandform(landform);
  if (!tunnelTarget) return [createTerrainLandformInstance(landform, bounds)];

  const tunnelPose = getMetroTerrainTunnelPoseForLandform(landform, tunnelTarget);
  if (!tunnelPose) return [createTerrainLandformInstance(landform, bounds)];

  const center = landform.center;
  const lobeRadius = Math.max(72, landform.radius * tunnelTarget.lobeRadiusScale);
  const lobeHeight = Math.max(landform.height * 0.58, landform.height * tunnelTarget.lobeHeightScale);
  const sideOffset = lobeRadius + (tunnelTarget.clearance ?? METRO_TERRAIN_TUNNEL_CLEARANCE);
  const sideLobes = [-1, 1].map((side) => {
    const lobeCenter = {
      x: tunnelPose.point.x + tunnelPose.normal.x * sideOffset * side,
      z: tunnelPose.point.z + tunnelPose.normal.z * sideOffset * side
    };
    const distanceToOriginalCenter = Math.hypot(lobeCenter.x - center.x, lobeCenter.z - center.z);

    return {
      distanceToOriginalCenter,
      landform: {
        ...landform,
        center: lobeCenter,
        height: lobeHeight,
        id: `${landform.id}-metro-tunnel-side-${side > 0 ? 'right' : 'left'}`,
        label: `${landform.label} Tunnel Shoulder`,
        radius: lobeRadius
      }
    };
  });

  sideLobes.sort((left, right) => left.distanceToOriginalCenter - right.distanceToOriginalCenter);
  sideLobes[0].landform.id = landform.id;
  sideLobes[0].landform.label = landform.label;

  return sideLobes.map((item) => createTerrainLandformInstance(item.landform, bounds));
}

function createTerrainLandformInstance(landform, bounds) {
  return {
    id: landform.id,
    label: landform.label,
    type: landform.type,
    position: [
      landform.center.x,
      landform.type === 'basin' ? 0.018 : landform.height / 2,
      landform.center.z
    ],
    radius: landform.radius,
    height: landform.height,
    bounds
  };
}

function filterTerrainLandformsForBuiltStructures(landforms, roads = [], structureObstacles = []) {
  return landforms.filter((landform) => !shouldRemoveTerrainLandform(landform, roads, structureObstacles));
}

function shouldRemoveTerrainLandform(landform, roads, structureObstacles) {
  if (landform?.type !== 'hill') return false;

  const footprint = getTerrainLandformFootprint(landform);
  if (!footprint) return false;

  const overlapsRoad = roads.some((road) => (
    doesCircleOverlapRoadSurface(footprint.x, footprint.z, footprint.radius, road, 10)
  ));
  if (overlapsRoad) return true;

  const overlapsStructure = structureObstacles.some((obstacle) => (
    isStructureClearanceObstacle(obstacle) &&
    doesLandformOverlapTrafficObstacle(footprint.x, footprint.z, footprint.radius, obstacle, 16)
  ));

  return overlapsStructure;
}

function isRaisedTerrainLandform(landform) {
  return landform?.type === 'hill' || landform?.type === 'mountain';
}

function getTerrainLandformFootprint(landform) {
  const [positionX, , positionZ] = landform?.position ?? [];
  const x = Number.isFinite(positionX) ? positionX : landform?.center?.x;
  const z = Number.isFinite(positionZ) ? positionZ : landform?.center?.z;
  const radius = landform?.radius ?? 0;

  if (!Number.isFinite(x) || !Number.isFinite(z) || radius <= 0) return null;

  return { x, z, radius };
}

function doesLandformFootprintOverlapChunk(landform, bounds, margin = 0) {
  const footprint = getTerrainLandformFootprint(landform);
  if (!footprint) return false;

  const radius = footprint.radius + margin;
  const closestX = clamp(footprint.x, bounds.minX, bounds.maxX);
  const closestZ = clamp(footprint.z, bounds.minZ, bounds.maxZ);
  const dx = footprint.x - closestX;
  const dz = footprint.z - closestZ;

  return dx * dx + dz * dz <= radius * radius;
}

function doesCircleOverlapRoadSurface(x, z, radius, road, margin = 0) {
  if (!road) return false;

  const surface = road.surface;
  const testRadius = radius + margin;

  if (surface?.shape === 'circle') {
    const dx = x - surface.centerX;
    const dz = z - surface.centerZ;
    const limit = testRadius + surface.radius;
    return dx * dx + dz * dz <= limit * limit;
  }

  if (surface?.shape === 'segment' || surface?.shape === 'ramp') {
    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      testRadius,
      surface.startX,
      surface.startZ,
      surface.endX,
      surface.endZ,
      (surface.width ?? getRoadCrossWidth(road)) / 2
    ));
  }

  if (road.axis === 'segment' && Number.isFinite(road.startX) && Number.isFinite(road.endX)) {
    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      testRadius,
      road.startX,
      road.startZ,
      road.endX,
      road.endZ,
      getRoadCrossWidth(road) / 2
    ));
  }

  return doesCircleOverlapCollider(x, z, testRadius, createRoadCollider(road));
}

function doesLandformOverlapTrafficObstacle(x, z, radius, obstacle, margin = 0) {
  const collider = createTrafficObstacleFootprintCollider(obstacle, margin);
  return collider ? doesCircleOverlapCollider(x, z, radius, collider) : false;
}

function createStructureClearanceColliders(obstacles = []) {
  return obstacles
    .filter(isStructureClearanceObstacle)
    .map((obstacle) => createTrafficObstacleFootprintCollider(obstacle, 7))
    .filter(Boolean);
}

function isStructureClearanceObstacle(obstacle) {
  const type = String(obstacle?.type ?? '');
  return type === 'roadSupport' ||
    type === 'transportOverpassSupport' ||
    type === 'metroPier' ||
    type === 'metroPierCap';
}

function createTrafficObstacleFootprintCollider(obstacle, padding = 0) {
  const [x = 0, , z = 0] = obstacle?.position ?? [];
  const [width = 0, , depth = 0] = obstacle?.scale ?? [];
  if (!Number.isFinite(x) || !Number.isFinite(z) || width <= 0 || depth <= 0) return null;

  const yaw = obstacle.rotation?.[1] ?? 0;
  const cos = Math.abs(Math.cos(yaw));
  const sin = Math.abs(Math.sin(yaw));
  const footprintWidth = width * cos + depth * sin + padding * 2;
  const footprintDepth = width * sin + depth * cos + padding * 2;

  return createBoxCollider(
    `${obstacle.id ?? 'structure'}-clearance`,
    'transportStructureClearance',
    x,
    z,
    footprintWidth,
    footprintDepth
  );
}

function generateScenicMountainFeature(bounds, chunkX, chunkZ) {
  const data = {
    guardrailColliders: [],
    guardrails: [],
    blockers: [],
    roadColliders: [],
    roads: [],
    safeSpawnPoints: []
  };

  if (isBoxOverlappingChunk(
    SCENIC_MOUNTAIN.center.x,
    SCENIC_MOUNTAIN.center.z,
    SCENIC_MOUNTAIN.radius * 2.14,
    SCENIC_MOUNTAIN.radius * 2.14,
    bounds,
    80
  )) {
    data.blockers.push(createBoxCollider(
      `scenic-mountain-clearance-${chunkX}-${chunkZ}`,
      'landformClearance',
      SCENIC_MOUNTAIN.center.x,
      SCENIC_MOUNTAIN.center.z,
      SCENIC_MOUNTAIN.radius * 2.02,
      SCENIC_MOUNTAIN.radius * 2.02
    ));
  }

  return data;
}

function addScenicMountainRoad(data, bounds, chunkX, chunkZ) {
  const points = getScenicMountainRoadPoints();
  const baseId = `${SCENIC_MOUNTAIN.id}-road-${chunkX}-${chunkZ}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const road = addTransportSlopedRoad(
      data,
      `${baseId}-${index}`,
      'scenic-mountain-road',
      ROAD_TYPES.ramp,
      start,
      end,
      SCENIC_MOUNTAIN_ROAD_WIDTH,
      start.y,
      end.y,
      {
        marked: true,
        side: 'scenic-mountain-road',
        trafficDisabled: true,
        visualStartY: start.y + 0.04,
        visualEndY: end.y + 0.04
      },
      bounds
    );

    if (road) {
      addScenicMountainRoadGuardrails(data, road);
    }
  }

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const size = index === points.length - 1 ? SCENIC_MOUNTAIN_SUMMIT_PAD_SIZE : 18;
    if (!isBoxOverlappingChunk(point.x, point.z, size, size, bounds, 2)) continue;

    addTransportRoad(data, createTransportJointRoad(
      `${baseId}-joint-${index}`,
      'scenic-mountain-road-joint',
      ROAD_TYPES.ramp,
      point,
      size,
      point.y
    ));
  }

  const summit = points[points.length - 1];
  const summitApproach = points[points.length - 2];
  addScenicMountainSummitGuardrail(data, bounds, `${baseId}-summit`, summit, summitApproach);

  if (isBoxOverlappingChunk(summit.x, summit.z, SCENIC_MOUNTAIN_SUMMIT_PAD_SIZE, SCENIC_MOUNTAIN_SUMMIT_PAD_SIZE, bounds, 0)) {
    data.safeSpawnPoints.push({
      id: `${baseId}-summit-spawn`,
      label: SCENIC_MOUNTAIN.label,
      position: { x: summit.x, y: summit.y, z: summit.z },
      heading: Math.atan2(summit.x - summitApproach.x, summit.z - summitApproach.z),
      chunkX,
      chunkZ
    });
  }
}

function getScenicMountainRoadPoints() {
  const spiral = [
    { angle: -2.55, radius: 690 },
    { angle: -2.18, radius: 630 },
    { angle: -1.62, radius: 575 },
    { angle: -1.02, radius: 515 },
    { angle: -0.42, radius: 460 },
    { angle: 0.18, radius: 400 },
    { angle: 0.78, radius: 340 },
    { angle: 1.38, radius: 285 },
    { angle: 1.98, radius: 230 },
    { angle: 2.58, radius: 180 },
    { angle: 3.18, radius: 135 },
    { angle: 3.78, radius: 102 },
    { angle: 4.38, radius: 78 }
  ];

  const basePoint = {
    x: 5500,
    z: 2750,
    y: GROUND_DRIVE_Y + 0.04
  };

  return [
    basePoint,
    ...spiral.map((point) => {
      const x = SCENIC_MOUNTAIN.center.x + Math.cos(point.angle) * point.radius;
      const z = SCENIC_MOUNTAIN.center.z + Math.sin(point.angle) * point.radius;

      return {
        x,
        z,
        y: getScenicMountainRoadY(point.radius)
      };
    })
  ];
}

function getScenicMountainRoadY(radius) {
  const surfaceHeight = Math.max(0, SCENIC_MOUNTAIN.height * (1 - radius / SCENIC_MOUNTAIN.radius));
  return GROUND_DRIVE_Y + surfaceHeight + (surfaceHeight > 0 ? 0.34 : 0.04);
}

function addScenicMountainRoadGuardrails(data, road) {
  const line = getRoadCenterline(road);
  if (!line) return;

  const length = getPlanarLineLength(line);
  if (length <= 1) return;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const halfWidth = (road.surface?.width ?? SCENIC_MOUNTAIN_ROAD_WIDTH) / 2;
  const rangeStartY = road.visualStartY ?? road.surface?.startY ?? GROUND_DRIVE_Y;
  const rangeEndY = road.visualEndY ?? road.surface?.endY ?? rangeStartY;
  const rotation = getRampBoxRotation({
    ...road.surface,
    startY: rangeStartY,
    endY: rangeEndY
  });

  for (const side of [-1, 1]) {
    const sideLabel = side > 0 ? 'right' : 'left';
    const offset = side * (halfWidth + SCENIC_MOUNTAIN_GUARDRAIL_THICKNESS / 2);
    const start = offsetPlanarPoint(line.start, tangent, normal, 3, offset);
    const end = offsetPlanarPoint(line.end, tangent, normal, -3, offset);
    const railLength = Math.max(1, length - 6);
    const center = midpoint(start, end);
    const id = `${road.id}-guardrail-${sideLabel}`;
    const minY = Math.min(rangeStartY, rangeEndY) + 0.02;
    const maxY = Math.max(rangeStartY, rangeEndY) + SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT + 0.92;

    data.guardrails.push({
      id,
      position: [
        center.x,
        (rangeStartY + rangeEndY) / 2 + SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT / 2 + 0.18,
        center.z
      ],
      rotation,
      scale: [railLength, SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT, SCENIC_MOUNTAIN_GUARDRAIL_THICKNESS]
    });
    data.guardrailColliders.push(createHeightLimitedSegmentCollider(
      id,
      'mountainGuardrail',
      start,
      end,
      SCENIC_MOUNTAIN_GUARDRAIL_THICKNESS + 0.22,
      minY,
      maxY
    ));
  }
}

function addScenicMountainSummitGuardrail(data, bounds, id, summit, approach) {
  const segmentCount = 12;
  const radius = SCENIC_MOUNTAIN_SUMMIT_PAD_SIZE / 2 + 1.4;
  const gapAngle = Math.atan2(approach.x - summit.x, approach.z - summit.z);

  for (let index = 0; index < segmentCount; index += 1) {
    const startAngle = (index / segmentCount) * Math.PI * 2;
    const endAngle = ((index + 1) / segmentCount) * Math.PI * 2;
    const midAngle = (startAngle + endAngle) / 2;
    if (Math.abs(normalizeAngle(midAngle - gapAngle)) < 0.44) continue;

    const start = {
      x: summit.x + Math.sin(startAngle) * radius,
      z: summit.z + Math.cos(startAngle) * radius
    };
    const end = {
      x: summit.x + Math.sin(endAngle) * radius,
      z: summit.z + Math.cos(endAngle) * radius
    };
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    if (!isBoxOverlappingChunk((start.x + end.x) / 2, (start.z + end.z) / 2, length + 4, length + 4, bounds, 2)) continue;

    const center = midpoint(start, end);
    const railId = `${id}-ring-${index}`;
    data.guardrails.push({
      id: railId,
      position: [
        center.x,
        summit.y + SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT / 2 + 0.18,
        center.z
      ],
      rotation: [0, getSegmentBoxYaw(start, end), 0],
      scale: [length, SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT, SCENIC_MOUNTAIN_GUARDRAIL_THICKNESS]
    });
    data.guardrailColliders.push(createHeightLimitedSegmentCollider(
      railId,
      'mountainGuardrail',
      start,
      end,
      SCENIC_MOUNTAIN_GUARDRAIL_THICKNESS + 0.22,
      summit.y - 0.04,
      summit.y + SCENIC_MOUNTAIN_GUARDRAIL_HEIGHT + 0.92
    ));
  }
}

function normalizeAngle(angle) {
  let result = angle;
  while (result > Math.PI) result -= Math.PI * 2;
  while (result < -Math.PI) result += Math.PI * 2;
  return result;
}

function removeGroundRoadsInsideScenicMountain(roads, roadColliders, parkingMarks, roundabouts, roundaboutColliders) {
  const removeIds = new Set();

  for (const road of roads) {
    if (!isRemovableScenicMountainGroundRoad(road)) continue;
    if (!doesRoadTouchScenicMountainFootprint(road)) continue;
    removeIds.add(road.id);
  }

  if (removeIds.size > 0) {
    removeRoadsById(roads, roadColliders, parkingMarks, removeIds);
  }

  for (let index = roundabouts.length - 1; index >= 0; index -= 1) {
    const roundabout = roundabouts[index];
    const [x, , z] = roundabout.position ?? [];
    const radius = roundabout.radius ?? 0;
    if (Math.hypot(x - SCENIC_MOUNTAIN.center.x, z - SCENIC_MOUNTAIN.center.z) > SCENIC_MOUNTAIN.radius + radius - 18) {
      continue;
    }

    const id = roundabout.id;
    roundabouts.splice(index, 1);
    for (let colliderIndex = roundaboutColliders.length - 1; colliderIndex >= 0; colliderIndex -= 1) {
      if (String(roundaboutColliders[colliderIndex]?.id ?? '').startsWith(id)) {
        roundaboutColliders.splice(colliderIndex, 1);
      }
    }
  }
}

function isRemovableScenicMountainGroundRoad(road) {
  if (!road?.id) return false;
  if (road.kind === 'scenic-mountain-road' || road.kind === 'scenic-mountain-road-joint') return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('expressway')) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('airport')) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('station')) return false;
  if (road.roadType === ROAD_TYPES.ramp || road.roadType === ROAD_TYPES.elevatedHighway) return false;
  if (road.roadType === ROAD_TYPES.highway || isExpresswayRoadType(road.roadType)) return false;

  return getRoadYRange(road).maxY <= GROUND_DRIVE_Y + 1;
}

function doesRoadTouchScenicMountainFootprint(road) {
  const center = SCENIC_MOUNTAIN.center;
  const line = getRoadCenterline(road);
  const clearance = SCENIC_MOUNTAIN.radius - 18;

  if (line) {
    const distanceSq = getPointToSegmentDistanceSq(center, line.start, line.end);
    const limit = clearance + getRoadCrossWidth(road) / 2;
    return distanceSq <= limit * limit;
  }

  return Math.hypot((road.centerX ?? 0) - center.x, (road.centerZ ?? 0) - center.z) <=
    clearance + Math.max(road.width ?? 0, road.depth ?? 0) / 2;
}

function createEmptyRoadInfo(chunkX, chunkZ) {
  return {
    seed: getChunkSeed(chunkX, chunkZ),
    type: 'empty',
    highwayAxes: [],
    hasHighway: false,
    hasRoundabout: false,
    hasParkingLot: false,
    connections: makeConnections([]),
    desiredConnections: makeConnections([]),
    entrances: [],
    exits: []
  };
}

function isOceanCrossingChunk(chunkX, chunkZ) {
  return false;
}

function isHarborIslandChunk(chunkX, chunkZ) {
  return false;
}

function isTransportHubChunk(chunkX, chunkZ) {
  const bounds = getChunkBounds(chunkX, chunkZ);

  return TRANSPORT_HUB_LIST.some((hub) => doBoundsOverlap(bounds, hub.bounds));
}

function generateRoadInfo(chunkX, chunkZ, bounds) {
  const desiredConnections = getDesiredConnections(chunkX, chunkZ);
  const connections = getAlignedConnections(chunkX, chunkZ);
  const highwayAxes = getHighwayAxes(chunkX, chunkZ);
  const hasHighway = highwayAxes.length > 0;
  const activeConnectionCount = countConnections(connections);
  const hasRoundabout = !hasHighway && activeConnectionCount >= 3 && hashNumber(chunkX, chunkZ, 421) > 0.58;
  const hasParkingLot = hashNumber(chunkX, chunkZ, 431) > 0.48;
  const connectionPoints = ROAD_SIDES
    .filter((side) => connections[side])
    .map((side) => {
      const neighbor = getNeighborChunkCoord(chunkX, chunkZ, side);
      const edge = getRoadEdgePoint(bounds, side);

      return {
        side,
        position: [edge.x, edge.z],
        neighborKey: neighbor ? getChunkKey(neighbor.chunkX, neighbor.chunkZ) : null
      };
    });

  return {
    seed: getChunkSeed(chunkX, chunkZ),
    type: getRoadType(connections),
    highwayAxes,
    hasHighway,
    hasRoundabout,
    hasParkingLot,
    connections,
    desiredConnections,
    entrances: connectionPoints,
    exits: connectionPoints
  };
}

function generateRoads(bounds, roadInfo, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial) {
  const roads = [];
  const roadColliders = [];
  const roundabouts = [];
  const roundaboutColliders = [];
  const parkingMarks = [];
  const centerRoadType = roadInfo.hasHighway ? 'highway' : 'main';
  const centerRoadWidth = roadInfo.hasHighway
    ? getRoadWidth(centerRoadType)
    : getDistrictRoadWidth(centerRoadType, districtProfile);
  const centerPatchSize = roadInfo.hasRoundabout
    ? 64
    : centerRoadWidth + (districtProfile?.centerPatchExtra ?? 12);

  if (roadInfo.hasRoundabout) {
    roundabouts.push({
      id: 'roundabout-center',
      position: [bounds.centerX, 0.024, bounds.centerZ],
      radius: 34,
      islandRadius: 13.5
    });
  } else {
    const centerPatch = createRoadSurface(
      'road-center',
      'intersection',
      bounds.centerX,
      bounds.centerZ,
      centerPatchSize,
      centerPatchSize,
      {
        axis: 'center',
        side: 'center',
        marked: false,
        roadType: centerRoadType
      }
    );

    addRoad(roads, roadColliders, centerPatch);
  }

  for (const axis of roadInfo.highwayAxes) {
    const highway = createHighwaySurface(bounds, axis);
    addRoad(roads, roadColliders, highway);
  }

  for (const side of ROAD_SIDES) {
    if (!roadInfo.connections[side]) continue;
    if (roadInfo.highwayAxes.includes(axisForSide(side))) continue;

    const roadType = isMainRoadSide(chunkX, chunkZ, side) ? 'main' : 'local';
    const segment = createRoadSegment(bounds, side, centerPatchSize, roadType, districtProfile);

    addRoad(roads, roadColliders, segment);
  }

  for (const localStreet of createLocalStreetSurfaces(bounds, roads, roadColliders, chunkX, chunkZ, districtProfile)) {
    addRoad(roads, roadColliders, localStreet);
  }

  if (roadInfo.hasParkingLot) {
    const parkingLot = createParkingLotSurface(bounds, roadColliders, chunkX, chunkZ);

    if (parkingLot) {
      const connector = createParkingConnectorRoad(parkingLot, [...roads, parkingLot], bounds, chunkX, chunkZ);

      if (connector) {
        addRoad(roads, roadColliders, parkingLot);
        addRoad(roads, roadColliders, connector);
        parkingMarks.push(...createParkingMarks(parkingLot));
      }
    }
  }

  addDistrictServiceAccesses(roads, roadColliders, parkingMarks, bounds, chunkX, chunkZ, districtProfile);

  return { parkingMarks, roadColliders, roads, roundabouts, roundaboutColliders };
}

function addRoad(roads, roadColliders, road) {
  if (!road) return;

  roads.push(road);
  roadColliders.push(createRoadCollider(road));
}

function addDistrictServiceAccesses(roads, roadColliders, parkingMarks, bounds, chunkX, chunkZ, districtProfile) {
  const spec = getDistrictServiceAccessSpec(districtProfile, chunkX, chunkZ);
  if (!spec) return;

  const site = findDistrictServiceAccessSite(bounds, roadColliders, chunkX, chunkZ, spec);
  if (!site) return;

  const parking = createRoadSurface(
    `${spec.idPrefix}-${chunkX}-${chunkZ}`,
    spec.kind,
    site.x,
    site.z,
    spec.width,
    spec.depth,
    {
      axis: 'parking',
      side: spec.kind,
      marked: false,
      roadType: ROAD_TYPES.parking
    }
  );
  if (!parking) return;

  const connector = createParkingConnectorRoad(parking, [...roads, parking], bounds, chunkX, chunkZ);
  if (!connector) return;

  connector.id = `${parking.id}-access`;
  connector.kind = 'parking-connector';
  connector.side = spec.kind;
  connector.marked = true;
  connector.visualScale = [connector.length, spec.connectorWidth ?? 9.5];
  connector.scale = [connector.length, spec.connectorWidth ?? 9.5];
  connector.surface.width = spec.connectorWidth ?? connector.surface.width;

  addRoad(roads, roadColliders, parking);
  addRoad(roads, roadColliders, connector);
  parkingMarks.push(...createParkingMarks(parking));

  for (const internalRoad of createDistrictInternalAccessRoads(parking, spec)) {
    addRoad(roads, roadColliders, internalRoad);
  }
}

function getDistrictServiceAccessSpec(profile = DISTRICT_PROFILES.commercial, chunkX = 0, chunkZ = 0) {
  const district = profile?.id ?? 'commercial';
  const roll = hashNumber(chunkX, chunkZ, 1431);

  if (district === 'residential' || district === 'oldTown') {
    return {
      idPrefix: 'residential-community-parking',
      kind: 'residential-parking',
      width: 78,
      depth: 66,
      connectorWidth: 8.6,
      internal: 'courtyard'
    };
  }

  if (district === 'industrial' || district === 'harbor') {
    return roll > 0.16
      ? {
          idPrefix: 'truck-yard-parking',
          kind: 'truck-yard-parking',
          width: 126,
          depth: 82,
          connectorWidth: 12.4,
          internal: 'truck-yard'
        }
      : null;
  }

  if (district === 'economic' || district === 'downtown' || district === 'commercial') {
    if (roll > 0.66) {
      return {
        idPrefix: 'hotel-shuttle-zone',
        kind: 'hotel-shuttle-parking',
        width: 94,
        depth: 48,
        connectorWidth: 9.8,
        internal: 'dropoff'
      };
    }

    return {
      idPrefix: 'office-garage-parking',
      kind: 'office-parking',
      width: 102,
      depth: 62,
      connectorWidth: 9.4,
      internal: 'office-loop'
    };
  }

  return null;
}

function findDistrictServiceAccessSite(bounds, roadColliders, chunkX, chunkZ, spec) {
  const inset = 34;
  const candidates = [
    { x: bounds.minX + spec.width / 2 + inset, z: bounds.minZ + spec.depth / 2 + inset },
    { x: bounds.maxX - spec.width / 2 - inset, z: bounds.minZ + spec.depth / 2 + inset },
    { x: bounds.minX + spec.width / 2 + inset, z: bounds.maxZ - spec.depth / 2 - inset },
    { x: bounds.maxX - spec.width / 2 - inset, z: bounds.maxZ - spec.depth / 2 - inset },
    { x: bounds.centerX, z: bounds.minZ + spec.depth / 2 + inset },
    { x: bounds.centerX, z: bounds.maxZ - spec.depth / 2 - inset }
  ];
  const start = Math.floor(hashNumber(chunkX, chunkZ, 1439) * candidates.length);

  for (let step = 0; step < candidates.length; step += 1) {
    const candidate = candidates[(start + step) % candidates.length];

    if (!isBoxInsideChunk(candidate.x, candidate.z, spec.width, spec.depth, bounds, 8)) continue;
    if (isBoxInsideSpawnClearZone(candidate.x, candidate.z, spec.width, spec.depth)) continue;
    if (!isBoxClearOfColliders(candidate.x, candidate.z, spec.width, spec.depth, roadColliders, 4)) continue;

    return candidate;
  }

  return null;
}

function createDistrictInternalAccessRoads(parking, spec) {
  const roads = [];
  const y = GROUND_DRIVE_Y;
  const width = spec.internal === 'truck-yard' ? 10.8 : 7.4;
  const horizontalLength = Math.max(18, parking.width * 0.72);
  const verticalLength = Math.max(18, parking.depth * 0.62);

  roads.push(createRoadSurface(
    `${parking.id}-internal-main`,
    `${spec.kind}-internal-road`,
    parking.centerX,
    parking.centerZ,
    horizontalLength,
    width,
    {
      axis: 'x',
      side: spec.kind,
      marked: true,
      roadType: ROAD_TYPES.groundRoad
    }
  ));

  if (spec.internal !== 'dropoff') {
    roads.push(createRoadSurface(
      `${parking.id}-internal-cross`,
      `${spec.kind}-internal-road`,
      parking.centerX,
      parking.centerZ,
      width,
      verticalLength,
      {
        axis: 'z',
        side: spec.kind,
        marked: true,
        roadType: ROAD_TYPES.groundRoad
      }
    ));
  }

  if (spec.internal === 'dropoff') {
    const start = { x: parking.centerX - parking.width * 0.34, z: parking.centerZ + parking.depth * 0.18 };
    const end = { x: parking.centerX + parking.width * 0.34, z: parking.centerZ + parking.depth * 0.18 };

    roads.push(createSegmentRoad(
      `${parking.id}-hotel-dropoff-lane`,
      'hotel-dropoff-lane',
      ROAD_TYPES.groundRoad,
      start,
      end,
      8.2,
      y,
      { side: spec.kind, marked: true }
    ));
  }

  return roads.filter(Boolean);
}

function addTransportStructureRoadGapFillers(roads, roadColliders, bounds, chunkX, chunkZ) {
  const approaches = roads.filter(isTransportStructureApproachRoad);
  const addedKeys = new Set();

  for (const approach of approaches) {
    const openEnd = getTransportStructureApproachOpenEnd(approach);
    if (!openEnd) continue;

    const target = findTransportStructureGapFillTarget(openEnd, approach, roads);
    if (!target) continue;

    const width = clamp(getRoadCrossWidth(approach), 8.5, 22);
    if (doesTransportGapFillCrossHighway(openEnd.point, target.point, width)) continue;

    const key = `${Math.round(openEnd.point.x * 10)}:${Math.round(openEnd.point.z * 10)}:${Math.round(target.point.x * 10)}:${Math.round(target.point.z * 10)}`;
    if (addedKeys.has(key)) continue;
    addedKeys.add(key);

    const connector = createSegmentRoad(
      `transport-structure-gap-fill-${chunkX}-${chunkZ}-${approach.id}-${addedKeys.size}`,
      'transport-structure-connector',
      normalizeOverpassRoadType(approach.roadType),
      openEnd.point,
      target.point,
      width,
      GROUND_DRIVE_Y,
      {
        side: 'transport-structure-connector',
        marked: true,
        trafficDisabled: true
      }
    );

    addRoad(roads, roadColliders, connector);
  }
}

function isTransportStructureApproachRoad(road) {
  return road?.kind === 'transport-overpass-approach' || road?.kind === 'transport-underpass-approach';
}

function getTransportStructureApproachOpenEnd(road) {
  const line = getRoadCenterline(road);
  if (!line) return null;

  const isStartApproach = String(road.id).includes('-approach-start');
  const isEndApproach = String(road.id).includes('-approach-end');
  if (!isStartApproach && !isEndApproach) return null;

  const point = isStartApproach ? line.start : line.end;
  const insidePoint = isStartApproach ? line.end : line.start;
  const outward = normalizeVector({
    x: point.x - insidePoint.x,
    z: point.z - insidePoint.z
  });

  return { outward, point };
}

function findTransportStructureGapFillTarget(openEnd, approach, roads) {
  let best = null;
  const sourceWidth = getRoadCrossWidth(approach);

  for (const road of roads) {
    if (road === approach || !isGroundRoadGapFillTarget(road)) continue;

    const candidate = getRoadRayConnectionCandidate(openEnd.point, openEnd.outward, sourceWidth, road);
    if (!candidate) continue;

    if (
      !best ||
      candidate.distance < best.distance ||
      candidate.distance === best.distance && String(road.id).localeCompare(String(best.road.id)) < 0
    ) {
      best = { ...candidate, road };
    }
  }

  return best;
}

function isGroundRoadGapFillTarget(road) {
  if (!road?.marked) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;
  if (isTransportHubLocalRoad(road)) return false;
  if (road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.highway) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || road.roadType === ROAD_TYPES.ramp) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (Math.abs(getRoadVisualY(road) - GROUND_DRIVE_Y) > 0.9) return false;
  return road.axis === 'x' || road.axis === 'z' || road.axis === 'segment';
}

function getRoadRayConnectionCandidate(origin, direction, sourceWidth, road) {
  const line = getRoadCenterline(road);
  if (!line) return null;

  const rayEnd = {
    x: origin.x + direction.x * TRANSPORT_STRUCTURE_GAP_FILL_MAX_LENGTH,
    z: origin.z + direction.z * TRANSPORT_STRUCTURE_GAP_FILL_MAX_LENGTH
  };
  const intersection = getLineSegmentIntersection(origin, rayEnd, line.start, line.end);

  if (intersection) {
    const distance = intersection.t * TRANSPORT_STRUCTURE_GAP_FILL_MAX_LENGTH;
    if (distance < TRANSPORT_STRUCTURE_GAP_FILL_MIN_LENGTH) return null;

    return {
      distance,
      point: { x: intersection.x, z: intersection.z }
    };
  }

  const roadTangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const parallelAmount = Math.abs(roadTangent.x * direction.x + roadTangent.z * direction.z);

  if (parallelAmount < 0.92) return null;

  const startProjection = projectPointOnRay(line.start, origin, direction);
  const endProjection = projectPointOnRay(line.end, origin, direction);
  const minProjection = Math.min(startProjection.forward, endProjection.forward);
  const maxProjection = Math.max(startProjection.forward, endProjection.forward);
  const lateralDistance = Math.min(startProjection.lateral, endProjection.lateral);
  const lateralLimit = sourceWidth / 2 + getRoadCrossWidth(road) / 2 + 4;

  if (lateralDistance > lateralLimit) return null;
  if (maxProjection < TRANSPORT_STRUCTURE_GAP_FILL_MIN_LENGTH) return null;
  if (minProjection < TRANSPORT_STRUCTURE_GAP_FILL_MIN_LENGTH && maxProjection > 0) return null;

  const distance = clamp(minProjection, TRANSPORT_STRUCTURE_GAP_FILL_MIN_LENGTH, TRANSPORT_STRUCTURE_GAP_FILL_MAX_LENGTH);
  if (distance >= TRANSPORT_STRUCTURE_GAP_FILL_MAX_LENGTH - 0.1) return null;

  return {
    distance,
    point: {
      x: origin.x + direction.x * distance,
      z: origin.z + direction.z * distance
    }
  };
}

function addRoadEndpointGapFillers(roads, roadColliders, bounds, chunkX, chunkZ) {
  const addedKeys = new Set();

  for (const road of [...roads]) {
    if (!isRoadEndpointGapSource(road)) continue;

    for (const endpoint of getRoadEndpointGapPoints(road)) {
      if (isRoadEndpointOnChunkEdge(endpoint.point, bounds)) continue;
      if (isRoadEndpointConnected(endpoint.point, road, roads)) continue;

      const target = findRoadEndpointGapTarget(endpoint, road, roads) ??
        getRoadEndpointChunkEdgeTarget(endpoint, bounds);
      if (!target) continue;

      const width = clamp(getRoadCrossWidth(road), 7.8, 18);
      const clip = clipLineToBounds(endpoint.point, target.point, bounds, width / 2);
      if (!clip) continue;

      const length = Math.hypot(clip.end.x - clip.start.x, clip.end.z - clip.start.z);
      if (length < ROAD_ENDPOINT_GAP_FILL_MIN_LENGTH) continue;

      const key = getRoadEndpointGapKey(endpoint.point, target.point);
      if (addedKeys.has(key)) continue;
      addedKeys.add(key);

      addRoad(roads, roadColliders, createSegmentRoad(
        `road-gap-fill-${chunkX}-${chunkZ}-${road.id}-${addedKeys.size}`,
        'road-gap-connector',
        normalizeRoadEndpointConnectorType(road.roadType),
        clip.start,
        clip.end,
        width,
        GROUND_DRIVE_Y,
        {
          side: 'road-gap-connector',
          marked: true
        }
      ));
    }
  }
}

function isRoadEndpointGapSource(road) {
  if (!road?.marked) return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || road.roadType === ROAD_TYPES.ramp) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (road.kind === 'showcase') return false;
  if (typeof road.kind === 'string' && (
    road.kind.startsWith('transport-highway') ||
    road.kind.startsWith('expressway') ||
    road.kind.startsWith('transport-underpass') ||
    road.kind.startsWith('transport-overpass')
  )) {
    return false;
  }
  if (Math.abs(getRoadVisualY(road) - GROUND_DRIVE_Y) > 0.9) return false;

  return Boolean(getRoadCenterline(road));
}

function getRoadEndpointGapPoints(road) {
  const line = getRoadCenterline(road);
  if (!line) return [];

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });

  return [
    {
      point: line.start,
      outward: { x: -tangent.x, z: -tangent.z }
    },
    {
      point: line.end,
      outward: tangent
    }
  ];
}

function isRoadEndpointOnChunkEdge(point, bounds) {
  if (!bounds) return false;
  const margin = 24;

  return Math.abs(point.x - bounds.minX) <= margin ||
    Math.abs(point.x - bounds.maxX) <= margin ||
    Math.abs(point.z - bounds.minZ) <= margin ||
    Math.abs(point.z - bounds.maxZ) <= margin;
}

function isRoadEndpointConnected(point, sourceRoad, roads) {
  const sourceWidth = getRoadCrossWidth(sourceRoad);

  return roads.some((road) => (
    road !== sourceRoad &&
    isRoadEndpointGapTargetRoad(road) &&
    isPointOnRoadSurface(point.x, point.z, road, sourceWidth / 2 + 3.5)
  ));
}

function findRoadEndpointGapTarget(endpoint, sourceRoad, roads) {
  let best = null;

  for (const road of roads) {
    if (road === sourceRoad || !isRoadEndpointGapTargetRoad(road)) continue;

    const anchor = getRoadAnchorPoint(endpoint.point, road);
    if (!anchor) continue;

    const dx = anchor.x - endpoint.point.x;
    const dz = anchor.z - endpoint.point.z;
    const distance = Math.hypot(dx, dz);
    if (distance < ROAD_ENDPOINT_GAP_FILL_MIN_LENGTH || distance > ROAD_ENDPOINT_GAP_FILL_MAX_LENGTH) continue;

    const alignment = (dx / distance) * endpoint.outward.x + (dz / distance) * endpoint.outward.z;
    if (alignment < -0.2) continue;

    const score = distance * (alignment > 0.1 ? 1 : 1.25);
    if (!best || score < best.score || (
      score === best.score &&
      String(road.id).localeCompare(String(best.road.id)) < 0
    )) {
      best = { point: anchor, road, score };
    }
  }

  return best;
}

function isRoadEndpointGapTargetRoad(road) {
  if (road?.kind === 'road-edge-seam') return true;
  if (road?.roadType === ROAD_TYPES.parking) return true;
  if (!road?.marked) return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || road.roadType === ROAD_TYPES.ramp) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (isFastRoadSurfaceConnectorRoad(road)) return true;
  if (typeof road.kind === 'string' && (
    road.kind.startsWith('transport-highway') ||
    road.kind.startsWith('expressway') ||
    road.kind.startsWith('transport-underpass') ||
    road.kind.startsWith('transport-overpass')
  )) {
    return false;
  }
  if (Math.abs(getRoadVisualY(road) - GROUND_DRIVE_Y) > 0.9) return false;

  return Boolean(getRoadCenterline(road));
}

function getRoadEndpointChunkEdgeTarget(endpoint, bounds) {
  if (!bounds) return null;

  const candidates = [];

  if (Math.abs(endpoint.outward.x) > 0.0001) {
    const x = endpoint.outward.x > 0 ? bounds.maxX : bounds.minX;
    const distance = (x - endpoint.point.x) / endpoint.outward.x;

    if (distance > ROAD_ENDPOINT_GAP_FILL_MIN_LENGTH) {
      candidates.push({
        distance,
        point: {
          x,
          z: endpoint.point.z + endpoint.outward.z * distance
        }
      });
    }
  }

  if (Math.abs(endpoint.outward.z) > 0.0001) {
    const z = endpoint.outward.z > 0 ? bounds.maxZ : bounds.minZ;
    const distance = (z - endpoint.point.z) / endpoint.outward.z;

    if (distance > ROAD_ENDPOINT_GAP_FILL_MIN_LENGTH) {
      candidates.push({
        distance,
        point: {
          x: endpoint.point.x + endpoint.outward.x * distance,
          z
        }
      });
    }
  }

  const valid = candidates
    .filter((candidate) => (
      candidate.distance <= ROAD_ENDPOINT_GAP_FILL_MAX_LENGTH &&
      candidate.point.x >= bounds.minX - 0.001 &&
      candidate.point.x <= bounds.maxX + 0.001 &&
      candidate.point.z >= bounds.minZ - 0.001 &&
      candidate.point.z <= bounds.maxZ + 0.001
    ))
    .sort((left, right) => left.distance - right.distance);

  return valid[0] ?? null;
}

function normalizeRoadEndpointConnectorType(roadType) {
  if (roadType === ROAD_TYPES.mainRoad || roadType === 'main') return ROAD_TYPES.mainRoad;
  return ROAD_TYPES.groundRoad;
}

function getRoadEndpointGapKey(a, b) {
  const left = `${Math.round(a.x * 10)}:${Math.round(a.z * 10)}`;
  const right = `${Math.round(b.x * 10)}:${Math.round(b.z * 10)}`;

  return left < right ? `${left}:${right}` : `${right}:${left}`;
}

function addRoadEdgeSeams(roads, roadColliders, bounds, chunkX, chunkZ) {
  if (!bounds || getChunkKey(chunkX, chunkZ) === SHOWCASE_CHUNK_KEY) return;

  const addedKeys = new Set();

  for (const road of [...roads]) {
    if (!isRoadEdgeSeamSource(road)) continue;

    for (const endpoint of getRoadEndpointGapPoints(road)) {
      const side = getRoadEndpointSeamSide(endpoint.point, bounds);
      if (!side || isRoadSeamOnWorldEdge(side, bounds)) continue;

      const key = `${side}:${Math.round(endpoint.point.x * 10)}:${Math.round(endpoint.point.z * 10)}`;
      if (addedKeys.has(key)) continue;
      addedKeys.add(key);

      const seam = createRoadEdgeSeamCap(side, endpoint.point, road, bounds, chunkX, chunkZ, addedKeys.size);
      if (seam) addRoad(roads, roadColliders, seam);
    }
  }
}

function isRoadSeamOnWorldEdge(side, bounds) {
  if (side === 'north') return Math.abs(bounds.minZ - WORLD_SETTINGS.worldMinZ) <= 0.001;
  if (side === 'east') return Math.abs(bounds.maxX - WORLD_SETTINGS.worldMaxX) <= 0.001;
  if (side === 'south') return Math.abs(bounds.maxZ - WORLD_SETTINGS.worldMaxZ) <= 0.001;
  if (side === 'west') return Math.abs(bounds.minX - WORLD_SETTINGS.worldMinX) <= 0.001;
  return false;
}

function isRoadEdgeSeamSource(road) {
  if (!road?.marked) return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || road.roadType === ROAD_TYPES.ramp) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (isFastRoadSurfaceConnectorRoad(road)) return true;
  if (typeof road.kind === 'string' && (
    road.kind.startsWith('transport-highway') ||
    road.kind.startsWith('expressway') ||
    road.kind.startsWith('transport-underpass') ||
    road.kind.startsWith('transport-overpass')
  )) {
    return false;
  }

  return Boolean(getRoadCenterline(road));
}

function getRoadEndpointSeamSide(point, bounds) {
  const margin = 24;

  if (Math.abs(point.z - bounds.minZ) <= margin) return 'north';
  if (Math.abs(point.x - bounds.maxX) <= margin) return 'east';
  if (Math.abs(point.z - bounds.maxZ) <= margin) return 'south';
  if (Math.abs(point.x - bounds.minX) <= margin) return 'west';
  return null;
}

function createRoadEdgeSeamCap(side, point, road, bounds, chunkX, chunkZ, index) {
  const alongEdgeLength = clamp(getRoadCrossWidth(road) + ROAD_EDGE_SEAM_CAP_EXTRA, 12, 24);
  const depth = ROAD_EDGE_SEAM_CAP_DEPTH;
  const halfDepth = depth / 2;
  const x = clamp(point.x, bounds.minX + halfDepth, bounds.maxX - halfDepth);
  const z = clamp(point.z, bounds.minZ + halfDepth, bounds.maxZ - halfDepth);

  if (side === 'north' || side === 'south') {
    return createRoadSurface(
      `road-edge-seam-${chunkX}-${chunkZ}-${side}-${index}`,
      'road-edge-seam',
      x,
      side === 'north' ? bounds.minZ + halfDepth : bounds.maxZ - halfDepth,
      alongEdgeLength,
      depth,
      {
        axis: 'center',
        side: 'road-edge-seam',
        marked: false,
        roadType: normalizeRoadEndpointConnectorType(road.roadType)
      }
    );
  }

  return createRoadSurface(
    `road-edge-seam-${chunkX}-${chunkZ}-${side}-${index}`,
    'road-edge-seam',
    side === 'west' ? bounds.minX + halfDepth : bounds.maxX - halfDepth,
    z,
    depth,
    alongEdgeLength,
    {
      axis: 'center',
      side: 'road-edge-seam',
      marked: false,
      roadType: normalizeRoadEndpointConnectorType(road.roadType)
    }
  );
}

function projectPointOnRay(point, origin, direction) {
  const dx = point.x - origin.x;
  const dz = point.z - origin.z;
  const forward = dx * direction.x + dz * direction.z;
  const lateral = Math.abs(dx * direction.z - dz * direction.x);

  return { forward, lateral };
}

function doesTransportGapFillCrossHighway(start, end, width) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const limit = TRANSPORT_HIGHWAY.width / 2 + width / 2 + 3;

  return getSegmentDistanceSq(start, end, highwayStart, highwayEnd) <= limit * limit;
}

function createRoadClearanceColliders(roads, roundabouts) {
  const colliders = [];

  for (const road of roads) {
    const clearance = getRoadsideClearance(road);

    if (road.axis === 'x') {
      colliders.push(createBoxCollider(
        `${road.id}-clearance`,
        'roadClearance',
        road.centerX,
        road.centerZ,
        (road.visualScale?.[0] ?? road.width) + 8,
        road.depth + clearance * 2
      ));
      continue;
    }

    if (road.axis === 'z') {
      colliders.push(createBoxCollider(
        `${road.id}-clearance`,
        'roadClearance',
        road.centerX,
        road.centerZ,
        road.width + clearance * 2,
        (road.visualScale?.[1] ?? road.depth) + 8
      ));
      continue;
    }

    if (road.axis === 'segment') {
      const width = road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);
      const bounds = getSegmentBounds(
        { x: road.startX, z: road.startZ },
        { x: road.endX, z: road.endZ },
        width + clearance * 2
      );

      colliders.push({
        id: `${road.id}-clearance`,
        type: 'roadClearance',
        shape: 'segment',
        startX: road.startX,
        startZ: road.startZ,
        endX: road.endX,
        endZ: road.endZ,
        width: width + clearance * 2,
        ...bounds
      });
      continue;
    }

    colliders.push(createBoxCollider(
      `${road.id}-clearance`,
      'roadClearance',
      road.centerX,
      road.centerZ,
      road.width + clearance * 2,
      road.depth + clearance * 2
    ));
  }

  for (const roundabout of roundabouts) {
    const clearance = 28;

    colliders.push(createBoxCollider(
      `${roundabout.id}-road-clearance`,
      'roundaboutRoad',
      roundabout.position[0],
      roundabout.position[2],
      roundabout.radius * 2 + clearance,
      roundabout.radius * 2 + clearance
    ));
  }

  return colliders;
}

function getRoadsideClearance(road) {
  if (isTransportHubLocalRoad(road)) return 4;
  if (!shouldAddGroundRoadDetail(road)) return 16;
  if (road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main') return 22;
  if (road.roadType === ROAD_TYPES.groundRoad || road.roadType === 'local') return 15;
  return 14;
}

function isTransportHubLocalRoad(road) {
  if (typeof road.kind !== 'string') return false;

  return road.kind.startsWith('airport-') || road.kind.startsWith('station-');
}

function generateShowcaseDistrict(bounds, chunkX, chunkZ) {
  const empty = {
    name: getChunkKey(chunkX, chunkZ) === SHOWCASE_CHUNK_KEY ? SHOWCASE_DISTRICT_NAME : 'Procedural City',
    buildings: [],
    buildingColliders: [],
    guardrailColliders: [],
    guardrails: [],
    groundCutouts: [],
    parkingMarks: [],
    roadColliders: [],
    roadSigns: [],
    roads: [],
    roundaboutColliders: [],
    roundabouts: [],
    safeSpawnPoints: [],
    streetLightColliders: [],
    streetLights: [],
    structureColliders: [],
    trafficObstacles: [],
    trafficVehicles: [],
    treeColliders: [],
    trees: [],
    tunnelColliders: [],
    tunnelEntrances: [],
    tunnelZones: []
  };

  if (getChunkKey(chunkX, chunkZ) !== SHOWCASE_CHUNK_KEY) {
    return empty;
  }

  const roads = [
    createRoadSurface('showcase-spawn-parking', 'showcase-parking', 108, 34, 80, 58, {
      axis: 'parking',
      side: 'parking',
      marked: false,
      roadType: ROAD_TYPES.parking
    }),
    createRoadSurface('showcase-parking-driveway', 'showcase', 45, 34, 46, 12, {
      axis: 'x',
      side: 'east',
      marked: true,
      roadType: ROAD_TYPES.groundRoad
    }),
    createRoadSurface('showcase-spawn-main', 'showcase', 24, 109, 18, 150, {
      axis: 'z',
      side: 'south',
      marked: true,
      roadType: ROAD_TYPES.mainRoad
    }),
    createRoadSurface('showcase-roundabout-west-link', 'showcase', 32, 92, 16, 14, {
      axis: 'x',
      side: 'east',
      marked: true,
      roadType: ROAD_TYPES.mainRoad
    }),
    createRoadSurface('showcase-roundabout-east-link', 'showcase', 78, 92, 108, 14, {
      axis: 'x',
      side: 'east',
      marked: true,
      roadType: ROAD_TYPES.mainRoad
    }),
    createSegmentRoad(
      'showcase-roundabout-east-connector',
      'showcase',
      ROAD_TYPES.mainRoad,
      { x: 132, z: 92 },
      { x: 200, z: 146 },
      14,
      GROUND_DRIVE_Y,
      { side: 'east', marked: true }
    ),
    createRoadSurface('showcase-tunnel-approach', 'showcase', 24, 238, 18, 114, {
      axis: 'z',
      side: 'south',
      marked: true,
      roadType: ROAD_TYPES.groundRoad
    }),
    createRoadSurface('showcase-tunnel-loop-east', 'showcase', 112, 294, 176, 12, {
      axis: 'x',
      side: 'east',
      marked: true,
      roadType: ROAD_TYPES.groundRoad
    }),
    createRoadSurface('showcase-tunnel-loop-return', 'showcase', 200, 220, 12, 148, {
      axis: 'z',
      side: 'north',
      marked: true,
      roadType: ROAD_TYPES.groundRoad
    }),
    createRoadSurface('showcase-main-east-west', 'showcase', 112, 146, 176, SHOWCASE_MAIN_DEPTH, {
      axis: 'x',
      side: 'east',
      marked: true,
      roadType: ROAD_TYPES.mainRoad
    })
  ].filter(Boolean);
  const roadColliders = roads.map(createRoadCollider);
  const roundabouts = [{
    id: 'showcase-roundabout',
    roadType: ROAD_TYPES.roundabout,
    position: [24, 0.028, 92],
    radius: 32,
    islandRadius: 12.5
  }];
  const roundaboutColliders = [];

  const roadSigns = [
    { id: 'showcase-main-road-guide', text: 'DOWNTOWN\nEXPRESSWAY', position: [112, 3.7, 122], scale: [8.8, 2.4, 0.3], rotation: [0, Math.PI / 2, 0], color: '#9fd08c' }
  ];
  const streetLights = [
    { id: 'showcase-light-spawn', position: [122, 0, 78], rotationY: Math.PI / 10 },
    { id: 'showcase-light-roundabout', position: [88, 0, 118], rotationY: -Math.PI / 5 },
    { id: 'showcase-light-tunnel', position: [66, 0, 276], rotationY: -Math.PI / 7 }
  ];
  const trees = [
    createShowcaseTree('showcase-tree-roadside-0', 96, 66, 3.4),
    createShowcaseTree('showcase-tree-roadside-1', 96, 224, 3.1),
    createShowcaseTree('showcase-tree-spawn-0', 8, 34, 3.2),
    createShowcaseTree('showcase-tree-spawn-1', 44, 148, 3.5),
    createShowcaseTree('showcase-tree-tunnel-0', 64, 224, 3.3),
    createShowcaseTree('showcase-tree-tunnel-1', -14, 204, 3.1)
  ];
  const trafficVehicles = [
    createTrafficVehicle('showcase-ai-car-main-east', 54, 150.2, 190, 150.2, GROUND_DRIVE_Y + 0.06, 2.3, 1.2, 4.6, '#d1bb78', 0.072, 0.28),
    createTrafficVehicle('showcase-ai-car-main-west', 190, 141.8, 54, 141.8, GROUND_DRIVE_Y + 0.06, 2.2, 1.15, 4.4, '#7898a8', 0.07, 0.78),
    createTrafficVehicle('showcase-ai-car-ground-east', 48, 95, 126, 95, GROUND_DRIVE_Y + 0.06, 2.2, 1.15, 4.4, '#7898a8', 0.082, 0.66),
    createTrafficVehicle('showcase-ai-car-ground-west', 126, 89, 48, 89, GROUND_DRIVE_Y + 0.06, 2.1, 1.12, 4.2, '#9fd08c', 0.078, 0.18),
    createTrafficVehicle('showcase-ai-car-parking-exit', 104, 31.5, 24, 31.5, GROUND_DRIVE_Y + 0.06, 2.1, 1.12, 4.2, '#e36d5c', 0.058, 0.12)
  ];
  const trafficObstacles = [];
  const buildings = [
    createShowcaseBuilding('showcase-landmark-gold-tower', 340, 105, 34, 146, 34, '#d1bb78'),
    createShowcaseBuilding('showcase-landmark-blue-tower', 390, 115, 26, 112, 30, '#7898a8'),
    createShowcaseBuilding('showcase-landmark-podium', 360, 150, 86, 24, 38, '#c28f69'),
    createShowcaseBuilding('showcase-tower-a', 134, 314, 26, 96, 28, '#7898a8'),
    createShowcaseBuilding('showcase-tower-b', 196, 326, 34, 62, 26, '#c28f69'),
    createShowcaseBuilding('showcase-tower-c', 296, 82, 24, 118, 32, '#9b89b0'),
    createShowcaseBuilding('showcase-midrise', 420, 82, 42, 36, 24, '#a3aa78')
  ];
  const safeSpawnPoints = [];

  return {
    ...empty,
    buildings,
    buildingColliders: buildings.map((building) => (
      createBoxCollider(`${building.id}-collider`, 'building', building.position[0], building.position[2], building.scale[0], building.scale[2])
    )),
    parkingMarks: createParkingMarks(roads[0]),
    roadColliders,
    roadSigns,
    roads,
    roundaboutColliders,
    roundabouts,
    safeSpawnPoints,
    streetLightColliders: streetLights.map((light) => (
      createBoxCollider(`${light.id}-collider`, 'streetLight', light.position[0], light.position[2], 1.1, 1.1)
    )),
    streetLights,
    trafficObstacles,
    trafficVehicles,
    treeColliders: trees.map((tree) => createBoxCollider(`${tree.id}-collider`, 'tree', tree.position[0], tree.position[2], 2.4, 2.4)),
    trees,
    tunnelColliders: [],
    tunnelEntrances: []
  };
}

function generateTransportFeatures(bounds, chunkX, chunkZ, groundRoads = [], bridgeAvoidanceRoads = []) {
  const data = createEmptyTransportData(getTransportChunkName(bounds), bridgeAvoidanceRoads);

  addTransportHighway(data, bounds, chunkX, chunkZ, groundRoads);
  addTransportSurfaceAvenue(data, bounds, chunkX, chunkZ, groundRoads);
  addAirportHub(data, bounds, chunkX, chunkZ);
  addTrainStationHub(data, bounds, chunkX, chunkZ);
  addCityTransitFeatures(data, bounds, chunkX, chunkZ, groundRoads);
  addMetroTransitFeatures(data, bounds, chunkX, chunkZ, groundRoads);

  return data;
}

function createEmptyTransportData(name = null, bridgeAvoidanceRoads = []) {
  return {
    name,
    bridgeAvoidanceRoads,
    buildings: [],
    buildingColliders: [],
    guardrailColliders: [],
    guardrails: [],
    groundCutouts: [],
    parkingMarks: [],
    roadColliders: [],
    roadSigns: [],
    roads: [],
    safeSpawnPoints: [],
    streetLightColliders: [],
    streetLights: [],
    trafficObstacles: [],
    trafficVehicles: [],
    treeColliders: [],
    trees: [],
    tunnelColliders: [],
    tunnelEntrances: [],
    tunnelZones: []
  };
}

function getTransportChunkName(bounds) {
  const hub = TRANSPORT_HUB_LIST.find((item) => doBoundsOverlap(bounds, item.bounds));
  return hub?.label ?? null;
}

function getTransportHighwayClearanceRoads(bounds) {
  const [start, end] = TRANSPORT_HIGHWAY.points;
  const clip = clipLineToBounds(start, end, bounds, TRANSPORT_HIGHWAY.width / 2);
  if (!clip) return [];

  return [
    createSegmentRoad(
      `transport-highway-clearance-${Math.round(bounds.centerX)}-${Math.round(bounds.centerZ)}`,
      'transport-highway-clearance',
      ROAD_TYPES.highway,
      clip.start,
      clip.end,
      TRANSPORT_HIGHWAY.width,
      GROUND_DRIVE_Y,
      {
        marked: false,
        side: 'transport-highway-clearance'
      }
    )
  ].filter(Boolean);
}

function addTransportSurfaceAvenue(data, bounds, chunkX, chunkZ, groundRoads = []) {
  if (!FAST_ROADS_UNDERGROUND) return;

  const [start, end] = TRANSPORT_HIGHWAY.points;
  const clip = clipLineToBounds(start, end, bounds, TRANSPORT_SURFACE_AVENUE_WIDTH / 2);
  if (!clip) return;

  const avenue = createSegmentRoad(
    `transport-surface-avenue-${chunkX}-${chunkZ}`,
    'surface-avenue',
    ROAD_TYPES.mainRoad,
    clip.start,
    clip.end,
    TRANSPORT_SURFACE_AVENUE_WIDTH,
    GROUND_DRIVE_Y,
    {
      side: 'surface-avenue',
      marked: true
    }
  );

  addTransportRoad(data, avenue);
  addTransportSurfaceAvenueIntersections(data, bounds, chunkX, chunkZ, avenue, groundRoads);
  addTransportSurfaceTunnelAccesses(data, bounds, chunkX, chunkZ);
  addTransportSurfaceAvenueTrees(data, bounds, chunkX, chunkZ, avenue);
}

function addTransportSurfaceAvenueIntersections(data, bounds, chunkX, chunkZ, avenue, groundRoads = []) {
  const avenueLine = getRoadCenterline(avenue);
  if (!avenueLine) return;

  const avenueWidth = getRoadCrossWidth(avenue);
  const created = [];

  for (const road of groundRoads) {
    if (!isSurfaceAvenueConnectionRoad(road)) continue;

    const roadLine = getRoadCenterline(road);
    if (!roadLine || areRoadLinesNearlyParallel(avenueLine, roadLine)) continue;

    const approach = getClosestSegmentApproach(avenueLine.start, avenueLine.end, roadLine.start, roadLine.end);
    const roadWidth = getRoadCrossWidth(road);
    const clearance = avenueWidth / 2 + roadWidth / 2 + 5.5;
    if (!approach || approach.distanceSq > clearance * clearance) continue;

    const point = {
      x: (approach.highwayPoint.x + approach.roadPoint.x) / 2,
      z: (approach.highwayPoint.z + approach.roadPoint.z) / 2
    };

    if (!isInsideChunk(point.x, point.z, bounds)) continue;
    if (created.some((existing) => Math.hypot(existing.x - point.x, existing.z - point.z) < TRANSPORT_SURFACE_AVENUE_INTERSECTION_MIN_SPACING)) {
      continue;
    }

    created.push(point);
    addTransportRoad(data, createTransportJointRoad(
      `transport-surface-avenue-intersection-${chunkX}-${chunkZ}-${created.length}`,
      'surface-avenue-intersection',
      ROAD_TYPES.mainRoad,
      point,
      Math.max(avenueWidth + 5, roadWidth + 12),
      GROUND_DRIVE_Y
    ));
  }
}

function isSurfaceAvenueConnectionRoad(road) {
  if (!road?.marked) return false;
  if (isSurfaceTransportAvenueRoad(road)) return false;
  if (road.axis === 'center' || road.axis === 'joint') return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway || isExpresswayRoadType(road.roadType)) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || road.roadType === ROAD_TYPES.ramp) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;

  return road.axis === 'x' || road.axis === 'z' || road.axis === 'segment';
}

function areRoadLinesNearlyParallel(left, right) {
  const leftTangent = normalizeVector({
    x: left.end.x - left.start.x,
    z: left.end.z - left.start.z
  });
  const rightTangent = normalizeVector({
    x: right.end.x - right.start.x,
    z: right.end.z - right.start.z
  });

  return Math.abs(leftTangent.x * rightTangent.x + leftTangent.z * rightTangent.z) > 0.88;
}

function addTransportSurfaceAvenueTrees(data, bounds, chunkX, chunkZ, avenue) {
  const line = getRoadCenterline(avenue);
  if (!line) return;

  const length = getPlanarLineLength(line);
  if (length <= 24) return;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const offset = getRoadCrossWidth(avenue) / 2 + 21;
  const first = Math.ceil(18 / TRANSPORT_SURFACE_AVENUE_TREE_SPACING);
  const last = Math.floor((length - 18) / TRANSPORT_SURFACE_AVENUE_TREE_SPACING);

  for (let index = first; index <= last; index += 1) {
    const distance = index * TRANSPORT_SURFACE_AVENUE_TREE_SPACING;

    for (const side of [-1, 1]) {
      const x = line.start.x + tangent.x * distance + normal.x * side * offset;
      const z = line.start.z + tangent.z * distance + normal.z * side * offset;

      addTree(
        data.trees,
        data.treeColliders,
        bounds,
        data.roadColliders,
        x,
        z,
        `transport-surface-avenue-tree-${chunkX}-${chunkZ}-${index}-${side}`
      );
    }
  }
}

function addTransportSurfaceTunnelAccesses(data, bounds, chunkX, chunkZ) {
  for (const access of getTransportSurfaceTunnelAccessLayouts()) {
    const baseId = `surface-avenue-tunnel-access-${access.index}-${access.directionLabel}-${access.flow}`;
    const chunkId = `${baseId}-${chunkX}-${chunkZ}`;
    const accessRoadOptions = {
      accessCenterDistance: access.centerDistance,
      accessFlow: access.flow,
      accessPairKey: `${access.index}-${access.directionLabel}`
    };
    const slip = addTransportSlopedRoad(
      data,
      `${chunkId}-surface-slip`,
      'surface-avenue-tunnel-slip',
      ROAD_TYPES.ramp,
      access.surfaceSplit,
      access.portal,
      TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH,
      GROUND_DRIVE_Y + 0.03,
      GROUND_DRIVE_Y + 0.02,
      {
        ...accessRoadOptions,
        marked: true,
        side: 'surface-avenue-tunnel-slip',
        trafficDisabled: true,
        visualStartY: GROUND_DRIVE_Y + 0.04,
        visualEndY: GROUND_DRIVE_Y + 0.03
      },
      bounds
    );
    const rampRoads = addTransportSmoothSlopedRoad(
      data,
      chunkId,
      'surface-avenue-tunnel-ramp',
      ROAD_TYPES.ramp,
      access.portal,
      access.rampEnd,
      TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH,
      GROUND_DRIVE_Y + 0.02,
      TRANSPORT_HIGHWAY_TUNNEL_Y,
      {
        ...accessRoadOptions,
        marked: true,
        side: 'surface-avenue-tunnel-access',
        trafficDisabled: true,
        visualStartY: GROUND_DRIVE_Y + 0.04,
        visualEndY: TRANSPORT_HIGHWAY_TUNNEL_Y
      },
      bounds,
      TRANSPORT_SURFACE_TUNNEL_ACCESS_SMOOTH_SEGMENTS
    );
    const mergeRoad = addTransportSlopedRoad(
      data,
      `${chunkId}-side-merge`,
      'surface-avenue-tunnel-merge',
      ROAD_TYPES.ramp,
      access.rampEnd,
      access.mergePoint,
      TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH * 0.92,
      TRANSPORT_HIGHWAY_TUNNEL_Y,
      TRANSPORT_HIGHWAY_TUNNEL_Y,
      {
        ...accessRoadOptions,
        marked: true,
        side: 'surface-avenue-tunnel-merge',
        trafficDisabled: true,
        visualStartY: TRANSPORT_HIGHWAY_TUNNEL_Y,
        visualEndY: TRANSPORT_HIGHWAY_TUNNEL_Y
      },
      bounds
    );

    if (rampRoads.length === 0 && !slip && !mergeRoad) continue;

    addSurfaceTunnelAccessPortalGroundCutouts(data, bounds, `${chunkId}-portal-cutout`, access);
    // Keep the upper mouth open, then close the lower ramp so the descent reads as a tunnel.
    addSurfaceTunnelAccessMergeCover(data, bounds, `${chunkId}-merge-cover`, access);
    addSurfaceTunnelAccessRampCeiling(data, bounds, `${chunkId}-ramp-ceiling`, access);
    addSurfaceTunnelAccessRetainingWalls(data, bounds, `${chunkId}-ramp-wall`, access.portal, access.rampEnd);
    addSurfaceTunnelAccessVoidSkirtWalls(data, bounds, `${chunkId}-void-skirt`, access.portal, access.rampEnd);
    addSurfaceTunnelAccessCutoutLiners(data, bounds, `${chunkId}-cutout-liner`, access);
    addSurfaceTunnelAccessMainTunnelVoidShield(data, bounds, `${chunkId}-void-shield`, access);
    addSurfaceTunnelAccessSeparationMarks(data, bounds, `${chunkId}-separation`, access);
    addSurfaceTunnelAccessConnectionPads(data, bounds, `${chunkId}-connection-pad`, access);
    addSurfaceTunnelAccessTunnelZone(data, bounds, `${chunkId}-zone`, access);
    addSurfaceTunnelAccessPortal(data, bounds, chunkId, access);
  }
}

function getTransportSurfaceTunnelAccessLayouts() {
  const [start, end] = TRANSPORT_HIGHWAY.points;
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const layouts = [];

  for (let index = 0; index < TRANSPORT_SURFACE_TUNNEL_ACCESS_COUNT; index += 1) {
    const t = (index + 1) / (TRANSPORT_SURFACE_TUNNEL_ACCESS_COUNT + 1);
    const center = lerpPoint(start, end, t);

    for (const config of [
      { direction: 1, directionLabel: 'forward' },
      { direction: -1, directionLabel: 'reverse' }
    ]) {
      const direction = {
        x: tangent.x * config.direction,
        z: tangent.z * config.direction
      };
      const surfaceSide = getSurfaceAvenueTrafficSide(config.direction);
      const tunnelSide = surfaceSide;
      const pairOffset = config.direction * TRANSPORT_SURFACE_TUNNEL_ACCESS_PAIR_OFFSET;
      const shiftedCenter = offsetPlanarPoint(center, tangent, normal, pairOffset, 0);
      const entryCenter = offsetPlanarPoint(
        shiftedCenter,
        direction,
        normal,
        -TRANSPORT_SURFACE_TUNNEL_ACCESS_EXIT_SPACING / 2,
        0
      );
      const exitCenter = offsetPlanarPoint(
        shiftedCenter,
        direction,
        normal,
        TRANSPORT_SURFACE_TUNNEL_ACCESS_EXIT_SPACING / 2,
        0
      );

      layouts.push(createTransportSurfaceTunnelAccessLayout({
        ...config,
        center: entryCenter,
        flow: 'entry',
        index: index + 1,
        normal,
        surfaceSide,
        tunnelSide
      }));
      layouts.push(createTransportSurfaceTunnelAccessLayout({
        ...config,
        center: exitCenter,
        flow: 'exit',
        index: index + 1,
        normal,
        surfaceSide,
        tunnelSide
      }));
    }
  }

  return layouts;
}

function createTransportSurfaceTunnelAccessLayout(config) {
  const direction = {
    x: config.direction >= 0 ? config.normal.z : -config.normal.z,
    z: config.direction >= 0 ? -config.normal.x : config.normal.x
  };
  const flowSign = config.flow === 'exit' ? -1 : 1;
  const surfaceSplit = offsetPlanarPoint(
    config.center,
    direction,
    config.normal,
    -flowSign * TRANSPORT_SURFACE_TUNNEL_ACCESS_RAMP_LENGTH * 0.64,
    config.surfaceSide * TRANSPORT_SURFACE_TUNNEL_ACCESS_MERGE_OFFSET
  );
  const portal = offsetPlanarPoint(
    config.center,
    direction,
    config.normal,
    -flowSign * TRANSPORT_SURFACE_TUNNEL_ACCESS_RAMP_LENGTH * 0.3,
    config.surfaceSide * TRANSPORT_SURFACE_TUNNEL_ACCESS_OUTER_OFFSET
  );
  const rampEnd = offsetPlanarPoint(
    config.center,
    direction,
    config.normal,
    flowSign * TRANSPORT_SURFACE_TUNNEL_ACCESS_RAMP_LENGTH * 0.36,
    config.tunnelSide * TRANSPORT_SURFACE_TUNNEL_ACCESS_SIDE_ENTRY_OFFSET
  );
  const mergePoint = offsetPlanarPoint(
    config.center,
    direction,
    config.normal,
    flowSign * TRANSPORT_SURFACE_TUNNEL_ACCESS_RAMP_LENGTH * 0.9,
    config.tunnelSide * TRANSPORT_SURFACE_TUNNEL_ACCESS_MERGE_OFFSET
  );
  const directionVector = normalizeVector({
    x: rampEnd.x - portal.x,
    z: rampEnd.z - portal.z
  });
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const projection = projectPointToSegment(
    config.center.x,
    config.center.z,
    highwayStart.x,
    highwayStart.z,
    highwayEnd.x,
    highwayEnd.z
  );
  const centerDistance = projection
    ? projection.t * Math.hypot(highwayEnd.x - highwayStart.x, highwayEnd.z - highwayStart.z)
    : 0;

  return {
    center: config.center,
    centerDistance,
    direction: config.direction,
    directionLabel: config.directionLabel,
    directionVector,
    flow: config.flow,
    index: config.index,
    mergePoint,
    portal,
    rampEnd,
    side: config.tunnelSide,
    surfaceSide: config.surfaceSide,
    surfaceSplit,
    tunnelSide: config.tunnelSide
  };
}

function getSurfaceAvenueTrafficSide(direction) {
  return TRAFFIC_DRIVE_SIDE === 'left'
    ? (direction >= 0 ? 1 : -1)
    : (direction >= 0 ? -1 : 1);
}

function isPointInsideSurfaceTunnelAccessClearance(x, z, margin = 0) {
  const point = { x, z };
  const halfWidth = TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH / 2 + margin;
  const pointRadius = halfWidth + 6;

  for (const access of getTransportSurfaceTunnelAccessLayouts()) {
    for (const [start, end] of [
      [access.surfaceSplit, access.portal],
      [access.portal, access.rampEnd],
      [access.rampEnd, access.mergePoint]
    ]) {
      if (getPointToSegmentDistanceSq(point, start, end) <= halfWidth * halfWidth) {
        return true;
      }
    }

    for (const portalPoint of [access.surfaceSplit, access.portal, access.rampEnd, access.mergePoint]) {
      const dx = x - portalPoint.x;
      const dz = z - portalPoint.z;
      if (dx * dx + dz * dz <= pointRadius * pointRadius) return true;
    }
  }

  return false;
}

function addSurfaceTunnelAccessPortalGroundCutouts(data, bounds, id, access) {
  const width = TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 5.2;
  const step = width * 0.52;
  const count = Math.ceil(TRANSPORT_SURFACE_TUNNEL_ACCESS_PORTAL_OPENING_LENGTH / step);

  for (let index = 0; index < count; index += 1) {
    const distance = Math.min(
      TRANSPORT_SURFACE_TUNNEL_ACCESS_PORTAL_OPENING_LENGTH,
      index * step + step * 0.5
    );
    const point = {
      x: access.portal.x + access.directionVector.x * distance,
      z: access.portal.z + access.directionVector.z * distance
    };

    addFastRoadPortalClearanceCutout(data, `${id}-${index}`, point, width, bounds, {
      skirtWalls: false
    });
  }
}

function addSurfaceTunnelAccessMergeCover(data, bounds, id, access) {
  const coverWidth = TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 12;
  const wallThickness = FAST_ROAD_TUNNEL_BOX_WALL_THICKNESS;
  const clip = clipLineToBounds(access.rampEnd, access.mergePoint, bounds, coverWidth / 2 + wallThickness + 2);
  if (!clip) return;

  const ceilingY = TRANSPORT_HIGHWAY_TUNNEL_Y + TUNNEL_CLEARANCE_HEIGHT;
  data.trafficObstacles.push(createSlopedTrafficObstacle(
    `${id}-ceiling`,
    clip.start,
    clip.end,
    ceilingY,
    ceilingY,
    coverWidth + wallThickness * 2,
    0.58,
    '#5f6a70',
    'transportUnderpassCeiling'
  ));
}

function addSurfaceTunnelAccessRampCeiling(data, bounds, id, access) {
  const ceilingStartT = 0.88;
  const ceilingWidth = TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 4.4;
  const ceilingClearance = TUNNEL_CLEARANCE_HEIGHT + 0.64;
  const ceilingStart = lerpPoint(access.portal, access.rampEnd, ceilingStartT);
  const ceilingEnd = access.rampEnd;
  const startRoadY = lerp(GROUND_DRIVE_Y, TRANSPORT_HIGHWAY_TUNNEL_Y, ceilingStartT);
  const endRoadY = TRANSPORT_HIGHWAY_TUNNEL_Y;
  const startCeilingY = startRoadY + ceilingClearance;
  const endCeilingY = endRoadY + ceilingClearance;
  const normal = { x: -access.directionVector.z, z: access.directionVector.x };
  const headerLeft = offsetPlanarPoint(ceilingStart, access.directionVector, normal, 0, -ceilingWidth / 2);
  const headerRight = offsetPlanarPoint(ceilingStart, access.directionVector, normal, 0, ceilingWidth / 2);

  addTransportSlopedObstacle(
    data,
    bounds,
    `${id}-slab`,
    ceilingStart,
    ceilingEnd,
    startCeilingY,
    endCeilingY,
    ceilingWidth,
    0.52,
    '#667178',
    'transportUnderpassCeiling'
  );
  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-front-header`,
    headerLeft,
    headerRight,
    1.2,
    0.82,
    '#6b767d',
    startCeilingY - 0.43,
    { type: 'transportUnderpassOverheadDeck' }
  );
}

function addSurfaceTunnelAccessMainTunnelPocketWalls(data, bounds, id, access) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const tunnelY = TRANSPORT_HIGHWAY_TUNNEL_Y;
  const tunnelWidth = TRANSPORT_HIGHWAY.width;
  const lineLength = Math.hypot(highwayEnd.x - highwayStart.x, highwayEnd.z - highwayStart.z);
  if (lineLength <= FAST_ROAD_TUNNEL_RAMP_LENGTH * 2 + 10) return;

  const tangent = normalizeVector({
    x: highwayEnd.x - highwayStart.x,
    z: highwayEnd.z - highwayStart.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const tunnelStart = {
    x: highwayStart.x + tangent.x * FAST_ROAD_TUNNEL_RAMP_LENGTH,
    z: highwayStart.z + tangent.z * FAST_ROAD_TUNNEL_RAMP_LENGTH
  };
  const tunnelEnd = {
    x: highwayEnd.x - tangent.x * FAST_ROAD_TUNNEL_RAMP_LENGTH,
    z: highwayEnd.z - tangent.z * FAST_ROAD_TUNNEL_RAMP_LENGTH
  };
  const openingPoint = getSurfaceTunnelAccessWallOpeningPoint(access, tunnelStart, tunnelEnd, tunnelWidth);
  const projection = projectPointToSegment(
    openingPoint.x,
    openingPoint.z,
    tunnelStart.x,
    tunnelStart.z,
    tunnelEnd.x,
    tunnelEnd.z
  );
  if (!projection) return;

  const side = getSurfaceTunnelAccessLateralSide(access, tunnelStart, tunnelEnd);
  const tunnelLength = Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z);
  const centerDistance = projection.t * tunnelLength;
  const halfOpeningLength = getSurfaceTunnelAccessWallHalfOpeningLength();
  const startDistance = clamp(centerDistance - halfOpeningLength, 0, tunnelLength);
  const endDistance = clamp(centerDistance + halfOpeningLength, 0, tunnelLength);
  if (endDistance - startDistance < 8) return;

  const wallThickness = 0.82;
  const wallHeight = TUNNEL_CLEARANCE_HEIGHT + 0.32;
  const wallBaseY = tunnelY - 0.1;
  const innerLateral = side * (tunnelWidth / 2 + TUNNEL_INTERIOR_WALL_THICKNESS / 2);
  const backLateral = side * (
    tunnelWidth / 2 +
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH +
    7.5
  );
  const startInner = getTunnelPocketPoint(tunnelStart, tangent, normal, startDistance, innerLateral);
  const startBack = getTunnelPocketPoint(tunnelStart, tangent, normal, startDistance, backLateral);
  const endInner = getTunnelPocketPoint(tunnelStart, tangent, normal, endDistance, innerLateral);
  const endBack = getTunnelPocketPoint(tunnelStart, tangent, normal, endDistance, backLateral);
  const backStart = getTunnelPocketPoint(tunnelStart, tangent, normal, startDistance, backLateral);
  const backEnd = getTunnelPocketPoint(tunnelStart, tangent, normal, endDistance, backLateral);

  for (const wall of [
    { label: 'start-return', start: startInner, end: startBack },
    { label: 'end-return', start: endInner, end: endBack },
    { label: 'back-wall', start: backStart, end: backEnd }
  ]) {
    const clip = clipLineToBounds(wall.start, wall.end, bounds, wallThickness / 2 + 1.5);
    if (!clip) continue;

    addTransportSegmentObstacle(
      data,
      bounds,
      `${id}-${wall.label}`,
      clip.start,
      clip.end,
      wallThickness,
      wallHeight,
      wall.label === 'back-wall' ? '#59646b' : '#647078',
      wallBaseY,
      { type: 'transportUnderpassWall' }
    );
    if (wall.label === 'back-wall') {
      data.tunnelColliders.push(createHeightLimitedSegmentCollider(
        `${id}-${wall.label}-collider`,
        'tunnelWall',
        clip.start,
        clip.end,
        wallThickness + 0.32,
        wallBaseY - 0.05,
        wallBaseY + wallHeight + 0.18
      ));
    }
  }
}

function getTunnelPocketPoint(origin, tangent, normal, distance, lateral) {
  return {
    x: origin.x + tangent.x * distance + normal.x * lateral,
    z: origin.z + tangent.z * distance + normal.z * lateral
  };
}

function addSurfaceTunnelAccessSeparationMarks(data, bounds, id, access) {
  const rampInnerEdgeOffset = -access.tunnelSide * access.direction * (TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH / 2 + 0.35);
  addTransportOffsetSegmentObstacle(
    data,
    bounds,
    `${id}-tunnel-inner-curb`,
    access.rampEnd,
    access.mergePoint,
    rampInnerEdgeOffset,
    0.36,
    0.16,
    '#f2d486',
    TRANSPORT_HIGHWAY_TUNNEL_Y + 0.04,
    { type: 'surfaceTunnelSeparationCurb' }
  );

  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-surface-split-mark`,
    access.surfaceSplit,
    access.portal,
    0.34,
    0.035,
    '#f2d486',
    GROUND_DRIVE_Y + 0.07,
    { type: 'surfaceTunnelGuideMark' }
  );
}

function addSurfaceTunnelAccessConnectionPads(data, bounds, id, access) {
  addTransportBridgeJointRoads(
    data,
    id,
    [
      { point: access.surfaceSplit, y: GROUND_DRIVE_Y + 0.04, size: TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 8 },
      { point: access.portal, y: GROUND_DRIVE_Y + 0.04, size: TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 8 },
      { point: access.rampEnd, y: TRANSPORT_HIGHWAY_TUNNEL_Y, size: TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 7 },
      { point: access.mergePoint, y: TRANSPORT_HIGHWAY_TUNNEL_Y, size: TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 9 }
    ],
    ROAD_TYPES.ramp,
    'surface-avenue-tunnel-joint'
  );
}

function getSurfaceTunnelAccessOuterWallSide(access, mergeNormal) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const highwayTangent = normalizeVector({
    x: highwayEnd.x - highwayStart.x,
    z: highwayEnd.z - highwayStart.z
  });
  const highwayNormal = { x: -highwayTangent.z, z: highwayTangent.x };
  const center = midpoint(access.rampEnd, access.mergePoint);
  const projection = projectPointToSegment(
    center.x,
    center.z,
    highwayStart.x,
    highwayStart.z,
    highwayEnd.x,
    highwayEnd.z
  ) ?? center;
  let selectedSide = 1;
  let selectedLateral = -Infinity;

  for (const side of [-1, 1]) {
    const point = {
      x: center.x + mergeNormal.x * side,
      z: center.z + mergeNormal.z * side
    };
    const lateral = ((point.x - projection.x) * highwayNormal.x + (point.z - projection.z) * highwayNormal.z) * access.side;

    if (lateral > selectedLateral) {
      selectedLateral = lateral;
      selectedSide = side;
    }
  }

  return selectedSide;
}

function addSurfaceTunnelAccessTunnelZone(data, bounds, id, access) {
  const zoneBounds = getSegmentBounds(
    access.portal,
    access.mergePoint,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 22
  );

  if (!isBoxOverlappingChunk(zoneBounds.centerX, zoneBounds.centerZ, zoneBounds.width, zoneBounds.depth, bounds, 8)) return;

  data.tunnelZones.push({
    id,
    kind: 'transport-highway-tunnel',
    width: TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 8,
    rampStart: { ...access.portal },
    tunnelStart: { ...access.portal },
    tunnelEnd: { ...access.mergePoint },
    rampEnd: { ...access.mergePoint },
    y: TRANSPORT_HIGHWAY_TUNNEL_Y
  });
}

function addSurfaceTunnelAccessCutoutLiners(data, bounds, id, access) {
  addTransportSlopedObstacle(
    data,
    bounds,
    `${id}-ramp-floor`,
    access.portal,
    access.rampEnd,
    GROUND_DRIVE_Y - 0.11,
    TRANSPORT_HIGHWAY_TUNNEL_Y - 0.11,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 18,
    0.09,
    '#3f494d',
    'transportUnderpassTrenchFloor'
  );
  addTransportSlopedObstacle(
    data,
    bounds,
    `${id}-merge-floor`,
    access.rampEnd,
    access.mergePoint,
    TRANSPORT_HIGHWAY_TUNNEL_Y - 0.13,
    TRANSPORT_HIGHWAY_TUNNEL_Y - 0.13,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 20,
    0.09,
    '#3f494d',
    'transportUnderpassTrenchFloor'
  );
  const mergeTangent = normalizeVector({
    x: access.mergePoint.x - access.rampEnd.x,
    z: access.mergePoint.z - access.rampEnd.z
  });
  const mergeNormal = { x: -mergeTangent.z, z: mergeTangent.x };
  const outerSide = getSurfaceTunnelAccessOuterWallSide(access, mergeNormal);

  addSurfaceTunnelAccessSideWalls(
    data,
    bounds,
    `${id}-merge-wall`,
    access.rampEnd,
    access.mergePoint,
    TRANSPORT_HIGHWAY_TUNNEL_Y,
    TRANSPORT_HIGHWAY_TUNNEL_Y,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH,
    {
      colliders: false,
      color: '#69747a',
      lateralExtra: 5.4,
      sides: [outerSide],
      wallHeight: TUNNEL_CLEARANCE_HEIGHT + 0.72
    }
  );

  const curbOffset = TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH / 2 + 0.38;
  for (const side of [-1, 1]) {
    addTransportOffsetSegmentObstacle(
      data,
      bounds,
      `${id}-merge-guide-curb-${side > 0 ? 'right' : 'left'}`,
      access.rampEnd,
      access.mergePoint,
      side * curbOffset,
      0.34,
      0.18,
      '#d7d0bb',
      TRANSPORT_HIGHWAY_TUNNEL_Y + 0.04,
      { type: 'surfaceTunnelGuideMark' }
    );
  }
}

function addSurfaceTunnelAccessMainTunnelVoidShield(data, bounds, id, access) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const tunnelWidth = TRANSPORT_HIGHWAY.width;
  const lineLength = Math.hypot(highwayEnd.x - highwayStart.x, highwayEnd.z - highwayStart.z);
  if (lineLength <= FAST_ROAD_TUNNEL_RAMP_LENGTH * 2 + 10) return;

  const tangent = normalizeVector({
    x: highwayEnd.x - highwayStart.x,
    z: highwayEnd.z - highwayStart.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const tunnelStart = {
    x: highwayStart.x + tangent.x * FAST_ROAD_TUNNEL_RAMP_LENGTH,
    z: highwayStart.z + tangent.z * FAST_ROAD_TUNNEL_RAMP_LENGTH
  };
  const tunnelEnd = {
    x: highwayEnd.x - tangent.x * FAST_ROAD_TUNNEL_RAMP_LENGTH,
    z: highwayEnd.z - tangent.z * FAST_ROAD_TUNNEL_RAMP_LENGTH
  };
  const openingPoint = getSurfaceTunnelAccessWallOpeningPoint(access, tunnelStart, tunnelEnd, tunnelWidth);
  const projection = projectPointToSegment(
    openingPoint.x,
    openingPoint.z,
    tunnelStart.x,
    tunnelStart.z,
    tunnelEnd.x,
    tunnelEnd.z
  );
  if (!projection) return;

  const tunnelLength = Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z);
  const centerDistance = projection.t * tunnelLength;
  const halfLength = getSurfaceTunnelAccessWallHalfOpeningLength() * 0.94;
  const startDistance = clamp(centerDistance - halfLength, 0, tunnelLength);
  const endDistance = clamp(centerDistance + halfLength, 0, tunnelLength);
  if (endDistance - startDistance < 8) return;

  const side = getSurfaceTunnelAccessLateralSide(access, tunnelStart, tunnelEnd);
  const lateral = side * (tunnelWidth / 2 + TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 20);
  const start = getTunnelPocketPoint(tunnelStart, tangent, normal, startDistance, lateral);
  const end = getTunnelPocketPoint(tunnelStart, tangent, normal, endDistance, lateral);

  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-back-wall`,
    start,
    end,
    0.92,
    TUNNEL_CLEARANCE_HEIGHT + 1.1,
    '#4f5b61',
    TRANSPORT_HIGHWAY_TUNNEL_Y - 0.16,
    { type: 'transportUnderpassWall' }
  );
}

function addSurfaceTunnelAccessRetainingWalls(data, bounds, id, start, end) {
  addSurfaceTunnelAccessSideWalls(
    data,
    bounds,
    id,
    start,
    end,
    GROUND_DRIVE_Y,
    TRANSPORT_HIGHWAY_TUNNEL_Y,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH,
    {
      colliders: true,
      color: '#606b72',
      lateralExtra: 0.45,
      wallHeight: TUNNEL_CLEARANCE_HEIGHT + 0.34
    }
  );
}

function addSurfaceTunnelAccessVoidSkirtWalls(data, bounds, id, start, end) {
  const segmentCount = TRANSPORT_SURFACE_TUNNEL_ACCESS_SMOOTH_SEGMENTS;
  const skirtRoadWidth = TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 7.2;

  for (let index = 0; index < segmentCount; index += 1) {
    const t0 = index / segmentCount;
    const t1 = (index + 1) / segmentCount;
    const segmentStart = lerpPoint(start, end, t0);
    const segmentEnd = lerpPoint(start, end, t1);
    const segmentStartY = lerp(GROUND_DRIVE_Y, TRANSPORT_HIGHWAY_TUNNEL_Y, t0);
    const segmentEndY = lerp(GROUND_DRIVE_Y, TRANSPORT_HIGHWAY_TUNNEL_Y, t1);
    const wallHeight = Math.max(
      TUNNEL_CLEARANCE_HEIGHT + 0.9,
      GROUND_DRIVE_Y - Math.min(segmentStartY, segmentEndY) + 1.15
    );

    addSurfaceTunnelAccessSideWalls(
      data,
      bounds,
      `${id}-${index}`,
      segmentStart,
      segmentEnd,
      segmentStartY,
      segmentEndY,
      skirtRoadWidth,
      {
        colliders: false,
        color: '#536068',
        lateralExtra: 0.2,
        wallHeight
      }
    );
  }
}

function addSurfaceTunnelAccessSideWalls(data, bounds, id, start, end, startY, endY, roadWidth, options = {}) {
  const clip = clipLineToBounds(start, end, bounds, roadWidth / 2 + 2.4);
  if (!clip) return;

  const tangent = normalizeVector({
    x: clip.end.x - clip.start.x,
    z: clip.end.z - clip.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const tSpan = Math.max(clip.t1 - clip.t0, 0.0001);
  const clippedStartY = lerp(startY, endY, clip.t0);
  const clippedEndY = lerp(startY, endY, clip.t1);
  const wallHeight = options.wallHeight ?? (TUNNEL_CLEARANCE_HEIGHT + 0.34);
  const wallThickness = 0.72;
  const lateralExtra = options.lateralExtra ?? 0.45;
  const color = options.color ?? '#606b72';
  const sides = options.sides ?? [-1, 1];

  for (const side of sides) {
    const sideLabel = side > 0 ? 'right' : 'left';
    const lateral = side * (roadWidth / 2 + wallThickness / 2 + lateralExtra);
    const wallStart = offsetPlanarPoint(clip.start, tangent, normal, 0, lateral);
    const wallEnd = offsetPlanarPoint(clip.end, tangent, normal, 0, lateral);

    data.trafficObstacles.push(createSlopedVerticalWallObstacle(
      `${id}-retaining-${sideLabel}`,
      wallStart,
      wallEnd,
      clippedStartY - 0.18,
      clippedEndY - 0.18,
      wallHeight,
      wallThickness,
      color,
      'transportUnderpassWall'
    ));
    if (options.colliders !== false) {
      data.tunnelColliders.push(createHeightLimitedSegmentCollider(
        `${id}-retaining-${sideLabel}-collider`,
        'tunnelWall',
        wallStart,
        wallEnd,
        wallThickness + 0.22,
        Math.min(clippedStartY, clippedEndY) - 0.22,
        Math.max(clippedStartY, clippedEndY) + wallHeight + 0.22 * tSpan
      ));
    }
  }
}

function addSurfaceTunnelAccessPortal(data, bounds, id, access) {
  if (!isInsideChunk(access.portal.x, access.portal.z, bounds)) return;

  addFastRoadRectTunnelMouth(
    data,
    bounds,
    `${id}-mouth`,
    access.portal,
    access.directionVector,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 2.8,
    GROUND_DRIVE_Y
  );
}

function addCityTransitFeatures(data, bounds, chunkX, chunkZ, groundRoads = []) {
  addBusTerminal(data, bounds, chunkX, chunkZ);

  for (const route of CITY_BUS_ROUTES) {
    addBusRouteStops(data, bounds, route, [...groundRoads, ...data.roads]);
    addBusRouteVehicles(data, bounds, route, chunkX, chunkZ);
  }

  for (const stand of CITY_TAXI_STANDS) {
    addTaxiStand(data, bounds, stand, chunkX, chunkZ);
  }
}

function createSmoothMetroLinePoints(controlPoints, samplesPerSegment = 5) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 2) return [];

  const points = [];

  for (let index = 0; index < controlPoints.length - 1; index += 1) {
    const p0 = controlPoints[Math.max(0, index - 1)];
    const p1 = controlPoints[index];
    const p2 = controlPoints[index + 1];
    const p3 = controlPoints[Math.min(controlPoints.length - 1, index + 2)];
    const sampleCount = samplesPerSegment + 1;

    for (let sample = 0; sample < sampleCount; sample += 1) {
      if (index > 0 && sample === 0) continue;

      points.push(catmullRomPoint(p0, p1, p2, p3, sample / samplesPerSegment));
    }
  }

  return points;
}

function createMetroLines() {
  return METRO_LINE_DEFINITIONS.map((definition) => {
    const elevatedY = getMetroLineElevatedY(definition.elevation);
    const points = definition.smooth === false
      ? definition.controlPoints.map((point) => ({ ...point }))
      : createSmoothMetroLinePoints(definition.controlPoints, definition.samplesPerSegment ?? 3);

    return {
      id: definition.id,
      color: definition.color,
      elevatedY,
      name: definition.name,
      points: applyMetroVerticalProfile(definition, points, elevatedY),
      serviceOffsets: definition.serviceOffsets ?? METRO_SERVICE_OFFSETS,
      speedMultiplier: definition.speedMultiplier ?? 1,
      stations: definition.stations.map((station) => ({
        ...station,
        point: station.point ? { ...station.point } : undefined
      }))
    };
  });
}

function getMetroLineElevatedY(elevation) {
  if (elevation === 'high') return METRO_HIGH_ELEVATED_Y;
  if (elevation === 'green') return METRO_GREEN_ELEVATED_Y;
  if (elevation === 'express') return METRO_EXPRESS_ELEVATED_Y;
  return METRO_ELEVATED_Y;
}

function applyMetroVerticalProfile(definition, points, elevatedY) {
  if (!Array.isArray(points) || points.length === 0) return [];

  if (definition.id !== 'green' && definition.id !== 'purple') {
    return points.map((point) => ({ ...point, y: elevatedY }));
  }

  let walked = 0;

  return points.map((point, index) => {
    if (index > 0) {
      walked += Math.hypot(point.x - points[index - 1].x, point.z - points[index - 1].z);
    }

    return {
      ...point,
      y: getMetroAirportApproachY(definition.id, walked, elevatedY)
    };
  });
}

function getMetroAirportApproachY(lineId, distanceFromAirportTerminal, elevatedY) {
  const airportY = getMetroAirportTerminalY(lineId, elevatedY);
  const rampStart = METRO_AIRPORT_LOW_ZONE_LENGTH;
  const rampEnd = rampStart + METRO_AIRPORT_RAMP_LENGTH;

  if (distanceFromAirportTerminal <= rampStart) return airportY;
  if (distanceFromAirportTerminal >= rampEnd) return elevatedY;

  return lerp(
    airportY,
    elevatedY,
    (distanceFromAirportTerminal - rampStart) / METRO_AIRPORT_RAMP_LENGTH
  );
}

function getMetroAirportTerminalY(lineId, fallbackY) {
  if (lineId === 'green') return METRO_AIRPORT_GREEN_TERMINAL_ELEVATED_Y;
  if (lineId === 'purple') return METRO_AIRPORT_PURPLE_TERMINAL_ELEVATED_Y;
  return fallbackY;
}

function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: 0.5 * (
      2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    z: 0.5 * (
      2 * p1.z +
      (-p0.z + p2.z) * t +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
    )
  };
}

function getMetroLineLength(line) {
  if (Number.isFinite(line.cachedLength)) return line.cachedLength;

  let length = 0;

  for (let index = 0; index < line.points.length - 1; index += 1) {
    length += Math.hypot(
      line.points[index + 1].x - line.points[index].x,
      line.points[index + 1].z - line.points[index].z
    );
  }

  line.cachedLength = length;
  return length;
}

function getMetroLinePoseAtDistance(line, distance) {
  const routeLength = getMetroLineLength(line);
  if (routeLength <= 0 || !Array.isArray(line.points) || line.points.length < 2) return null;

  let remaining = clamp(distance, 0, routeLength);

  for (let index = 0; index < line.points.length - 1; index += 1) {
    const start = line.points[index];
    const end = line.points[index + 1];
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z);
    if (segmentLength <= 0.001) continue;

    if (remaining <= segmentLength || index === line.points.length - 2) {
      const t = clamp(remaining / segmentLength, 0, 1);
      const tangent = normalizeVector({ x: end.x - start.x, z: end.z - start.z });

      return {
        point: lerpMetroPoint(start, end, t),
        tangent
      };
    }

    remaining -= segmentLength;
  }

  return null;
}

function lerpMetroPoint(start, end, t) {
  const point = lerpPoint(start, end, t);
  if (Number.isFinite(start?.y) || Number.isFinite(end?.y)) {
    point.y = lerp(
      Number.isFinite(start?.y) ? start.y : end.y,
      Number.isFinite(end?.y) ? end.y : start.y,
      t
    );
  }

  return point;
}

function getMetroLinePoseAtT(line, t) {
  return getMetroLinePoseAtDistance(line, getMetroLineLength(line) * clamp(t, 0, 1));
}

function getMetroLinePoseNearPoint(line, point) {
  const projection = getMetroLineProjectionNearPoint(line, point);
  return projection ? getMetroLinePoseAtDistance(line, projection.distance) : null;
}

function getMetroTerrainTunnelTargetForLandform(landform) {
  return METRO_TERRAIN_TUNNEL_TARGETS.find((target) => target.landformId === landform?.id) ?? null;
}

function getMetroTerrainTunnelTargetForLine(line) {
  return METRO_TERRAIN_TUNNEL_TARGETS.find((target) => target.lineId === line?.id) ?? null;
}

function getMetroTerrainTunnelLandform(target) {
  return TERRAIN_LANDFORMS.find((landform) => landform.id === target?.landformId) ?? null;
}

function getMetroTerrainTunnelPoseForLandform(landform, target) {
  const line = METRO_LINES.find((item) => item.id === target?.lineId);
  if (!line || !landform?.center) return null;

  const projection = getMetroLineProjectionNearPoint(line, landform.center);
  if (!projection) return null;

  const pose = getMetroLinePoseAtDistance(line, projection.distance);
  if (!pose) return null;

  return {
    ...pose,
    normal: { x: -pose.tangent.z, z: pose.tangent.x }
  };
}

function getMetroLineProjectionNearPoint(line, point) {
  if (!point || !Array.isArray(line.points) || line.points.length < 2) return null;

  let best = null;
  let walked = 0;

  for (let index = 0; index < line.points.length - 1; index += 1) {
    const start = line.points[index];
    const end = line.points[index + 1];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const lengthSq = dx * dx + dz * dz;
    const segmentLength = Math.sqrt(lengthSq);

    if (lengthSq <= 0.000001) continue;

    const t = clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq, 0, 1);
    const projected = {
      x: start.x + dx * t,
      z: start.z + dz * t
    };
    const distanceSq = (point.x - projected.x) ** 2 + (point.z - projected.z) ** 2;

    if (!best || distanceSq < best.distanceSq) {
      best = {
        distance: walked + segmentLength * t,
        distanceSq
      };
    }

    walked += segmentLength;
  }

  return best;
}

function getMetroStationStraightPose(line, station) {
  const nominal = station.point
    ? getMetroLineProjectionNearPoint(line, station.point)
    : { distance: getMetroLineLength(line) * clamp(station.t ?? 0.5, 0, 1), distanceSq: 0 };
  if (!nominal) return null;

  const routeLength = getMetroLineLength(line);
  const halfLength = METRO_STATION_LENGTH / 2 + 8;
  const minDistance = clamp(nominal.distance - METRO_STATION_STRAIGHT_SEARCH_RADIUS, halfLength, routeLength - halfLength);
  const maxDistance = clamp(nominal.distance + METRO_STATION_STRAIGHT_SEARCH_RADIUS, halfLength, routeLength - halfLength);
  let best = null;

  for (let distance = minDistance; distance <= maxDistance + 0.001; distance += METRO_STATION_STRAIGHT_SEARCH_STEP) {
    const straightness = getMetroLineStraightnessAtDistance(line, distance, halfLength);
    if (!straightness) continue;

    const centerShift = Math.abs(distance - nominal.distance);
    const score = straightness.maxLateralDeviation * 16 +
      straightness.maxAngleDeviation * 220 +
      centerShift * 0.018;

    if (!best || score < best.score) {
      best = {
        ...straightness,
        centerShift,
        distance,
        score
      };
    }
  }

  if (!best) return getMetroLinePoseAtDistance(line, nominal.distance);

  return {
    point: best.center.point,
    tangent: best.tangent
  };
}

function getMetroLineStraightnessAtDistance(line, distance, halfLength) {
  const center = getMetroLinePoseAtDistance(line, distance);
  const start = getMetroLinePoseAtDistance(line, distance - halfLength);
  const end = getMetroLinePoseAtDistance(line, distance + halfLength);
  if (!center || !start || !end) return null;

  const tangent = normalizeVector({
    x: end.point.x - start.point.x,
    z: end.point.z - start.point.z
  });
  const yaw = Math.atan2(tangent.x, tangent.z);
  const normal = { x: -tangent.z, z: tangent.x };
  const sampleOffsets = [-halfLength, -halfLength * 0.5, 0, halfLength * 0.5, halfLength];
  let maxLateralDeviation = 0;
  let maxAngleDeviation = 0;

  for (const offset of sampleOffsets) {
    const sample = getMetroLinePoseAtDistance(line, distance + offset);
    if (!sample) continue;

    const dx = sample.point.x - center.point.x;
    const dz = sample.point.z - center.point.z;
    const lateralDeviation = Math.abs(dx * normal.x + dz * normal.z);
    const sampleYaw = Math.atan2(sample.tangent.x, sample.tangent.z);

    maxLateralDeviation = Math.max(maxLateralDeviation, lateralDeviation);
    maxAngleDeviation = Math.max(maxAngleDeviation, Math.abs(normalizeAngle(sampleYaw - yaw)));
  }

  return {
    center,
    maxAngleDeviation,
    maxLateralDeviation,
    tangent
  };
}

function wrapMetroDistance(distance, routeLength) {
  if (routeLength <= 0) return 0;
  return positiveModulo(distance / routeLength, 1) * routeLength;
}

function createMetroTrafficPath(line, physicalTrackSide, travelDirection, baseY) {
  const trackLateral = physicalTrackSide * METRO_TRACK_CENTER_OFFSET;
  const offsetPoints = createMetroOffsetPathPoints(line, trackLateral, baseY);
  const sourcePoints = travelDirection >= 0 ? offsetPoints : [...offsetPoints].reverse();

  return {
    customTrafficPath: true,
    pathType: 'metro-line',
    physicalTrackSide,
    points: sourcePoints,
    startX: sourcePoints[0].x,
    startZ: sourcePoints[0].z,
    endX: sourcePoints[sourcePoints.length - 1].x,
    endZ: sourcePoints[sourcePoints.length - 1].z
  };
}

function createMetroLoopTrafficPath(line, baseY) {
  const outboundPoints = createMetroOffsetPathPoints(line, -METRO_TRACK_CENTER_OFFSET, baseY);
  const inboundRoutePoints = createMetroOffsetPathPoints(line, METRO_TRACK_CENTER_OFFSET, baseY);
  const outboundStart = outboundPoints[0];
  const outboundEnd = outboundPoints[outboundPoints.length - 1];
  const inboundEnd = inboundRoutePoints[inboundRoutePoints.length - 1];
  const inboundRoutePointsFromEnd = inboundRoutePoints.slice(0, -1).reverse();
  const points = [
    ...outboundPoints,
    inboundEnd,
    ...inboundRoutePointsFromEnd,
    outboundStart
  ];
  const totalLength = getPlanarPathLength(points);
  const endCrossoverEndIndex = outboundPoints.length;
  const inboundRouteStartSegmentIndex = endCrossoverEndIndex;
  const inboundRouteEndSegmentIndex = Math.max(
    inboundRouteStartSegmentIndex,
    inboundRouteStartSegmentIndex + inboundRoutePointsFromEnd.length - 2
  );
  const endCrossoverEndDistance = getPlanarPathDistanceAtIndex(points, endCrossoverEndIndex);

  return {
    customTrafficPath: true,
    metroLoop: true,
    metroLoopInboundEndSegmentIndex: inboundRouteEndSegmentIndex,
    metroLoopInboundStartSegmentIndex: inboundRouteStartSegmentIndex,
    metroLoopOutboundEndSegmentIndex: Math.max(0, outboundPoints.length - 2),
    metroLoopSplitIndex: endCrossoverEndIndex,
    metroLoopTurnbackProgress: totalLength > 0 ? endCrossoverEndDistance / totalLength : 0.5,
    metroTerminalCrossoverEndDistances: {
      end: endCrossoverEndDistance,
      start: totalLength
    },
    metroTerminalTurnbackDistance: METRO_TERMINAL_TURNBACK_DISTANCE,
    pathType: 'metro-line',
    physicalTrackSide: 0,
    points,
    startX: points[0].x,
    startZ: points[0].z,
    endX: points[points.length - 1].x,
    endZ: points[points.length - 1].z
  };
}

function getMetroLineEndpointTangent(line, pointIndex) {
  const points = line.points ?? [];
  const index = Math.round(clamp(pointIndex, 0, Math.max(0, points.length - 1)));
  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];

  return normalizeVector({
    x: next.x - previous.x,
    z: next.z - previous.z
  });
}

function createMetroTerminalTurnbackMarkerPoint(trackPoint, tangent, direction, y = undefined) {
  const unit = normalizeVector(tangent);
  const markerY = Number.isFinite(y) ? y : trackPoint.y;
  const distances = [
    METRO_TERMINAL_TURNBACK_DISTANCE,
    METRO_TERMINAL_TURNBACK_DISTANCE * 0.78,
    METRO_TERMINAL_TURNBACK_DISTANCE * 0.58,
    METRO_TERMINAL_TURNBACK_DISTANCE * 0.38
  ];

  for (const distance of distances) {
    const point = {
      x: trackPoint.x + unit.x * direction * distance,
      y: markerY,
      z: trackPoint.z + unit.z * direction * distance
    };
    if (isPointInsideWorldBounds(point, 12)) return point;
  }

  return {
    x: clamp(trackPoint.x + unit.x * direction * METRO_TERMINAL_TURNBACK_DISTANCE * 0.38, WORLD_SETTINGS.worldMinX + 12, WORLD_SETTINGS.worldMaxX - 12),
    y: markerY,
    z: clamp(trackPoint.z + unit.z * direction * METRO_TERMINAL_TURNBACK_DISTANCE * 0.38, WORLD_SETTINGS.worldMinZ + 12, WORLD_SETTINGS.worldMaxZ - 12)
  };
}

function isPointInsideWorldBounds(point, margin = 0) {
  return point.x >= WORLD_SETTINGS.worldMinX + margin &&
    point.x <= WORLD_SETTINGS.worldMaxX - margin &&
    point.z >= WORLD_SETTINGS.worldMinZ + margin &&
    point.z <= WORLD_SETTINGS.worldMaxZ - margin;
}

function createMetroOffsetPathPoints(line, trackLateral, baseY) {
  const lineBaseY = line.elevatedY ?? METRO_ELEVATED_Y;
  const verticalOffset = baseY - lineBaseY;

  return line.points.map((point, index) => {
    const previous = line.points[Math.max(0, index - 1)];
    const next = line.points[Math.min(line.points.length - 1, index + 1)];
    const tangent = normalizeVector({
      x: next.x - previous.x,
      z: next.z - previous.z
    });
    const normal = { x: -tangent.z, z: tangent.x };

    return {
      x: point.x + normal.x * trackLateral,
      y: getMetroPointY(point, lineBaseY) + verticalOffset,
      z: point.z + normal.z * trackLateral
    };
  });
}

function getMetroPointY(point, fallbackY) {
  return Number.isFinite(point?.y) ? point.y : fallbackY;
}

function getPlanarPathLength(points = []) {
  return points.slice(0, -1).reduce((length, point, index) => (
    length + Math.hypot(points[index + 1].x - point.x, points[index + 1].z - point.z)
  ), 0);
}

function getPlanarPathDistanceAtIndex(points = [], targetIndex = 0) {
  const clampedIndex = Math.round(clamp(targetIndex, 0, Math.max(0, points.length - 1)));
  let distance = 0;

  for (let index = 0; index < clampedIndex; index += 1) {
    distance += Math.hypot(points[index + 1].x - points[index].x, points[index + 1].z - points[index].z);
  }

  return distance;
}

function sampleMetroTrafficPathAtProgress(path, progress) {
  const points = path?.points ?? [];
  if (points.length === 0) return null;

  const totalLength = points.slice(0, -1).reduce((length, point, index) => (
    length + Math.hypot(points[index + 1].x - point.x, points[index + 1].z - point.z)
  ), 0);
  let remaining = totalLength * positiveModulo(progress, 1);

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    if (length <= 0.001) continue;

    if (remaining <= length || index === points.length - 2) {
      const t = clamp(remaining / length, 0, 1);
      return lerpPoint(start, end, t);
    }

    remaining -= length;
  }

  return points[0];
}

function getMetroStopProgressesForPath(line, path, terminalStops = []) {
  if (path?.metroLoop) return getMetroLoopStopProgressesForPath(line, path, terminalStops);

  const stops = [0, 1];

  for (const station of line.stations ?? []) {
    const point = station.point ?? getMetroLinePoseAtT(line, station.t ?? 0.5)?.point;
    const progress = getMetroPathProgressNearPoint(path, point);

    if (Number.isFinite(progress)) stops.push(progress);
  }

  return [...new Set(stops.map((stop) => Number(clamp(stop, 0, 1).toFixed(5))))]
    .sort((a, b) => a - b);
}

function getMetroLoopStopProgressesForPath(line, path, terminalStops = []) {
  const stops = [...terminalStops];
  const outboundEndSegmentIndex = path.metroLoopOutboundEndSegmentIndex ??
    Math.max(0, (path.metroLoopSplitIndex ?? Math.floor((path.points?.length ?? 2) / 2)) - 1);
  const inboundStartSegmentIndex = path.metroLoopInboundStartSegmentIndex ??
    (path.metroLoopSplitIndex ?? Math.floor((path.points?.length ?? 2) / 2));
  const inboundEndSegmentIndex = path.metroLoopInboundEndSegmentIndex ?? (path.points?.length ?? 1) - 2;

  for (const station of line.stations ?? []) {
    const point = getMetroStationPlacement(line, station)?.point ??
      station.point ??
      getMetroLinePoseAtT(line, station.t ?? 0.5)?.point;
    const outboundProgress = getMetroPathProgressNearPoint(path, point, 0, outboundEndSegmentIndex);
    const inboundProgress = getMetroPathProgressNearPoint(path, point, inboundStartSegmentIndex, inboundEndSegmentIndex);

    if (Number.isFinite(outboundProgress)) stops.push(outboundProgress);
    if (Number.isFinite(inboundProgress)) stops.push(inboundProgress);
  }

  return [...new Set(stops.map((stop) => Number(positiveModulo(stop, 1).toFixed(5))))]
    .sort((a, b) => a - b);
}

function getMetroPathProgressNearPoint(path, point, startSegmentIndex = 0, endSegmentIndex = null) {
  const points = path?.points ?? [];
  if (!point || points.length < 2) return Number.NaN;

  const totalLength = getPlanarPathLength(points);
  if (totalLength <= 0.001) return Number.NaN;

  let best = null;
  let walked = 0;
  const lastSegmentIndex = Math.min(
    points.length - 2,
    Number.isFinite(endSegmentIndex) ? endSegmentIndex : points.length - 2
  );
  const firstSegmentIndex = Math.max(0, startSegmentIndex);

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const lengthSq = dx * dx + dz * dz;
    const segmentLength = Math.sqrt(lengthSq);

    if (lengthSq <= 0.000001) continue;

    if (index >= firstSegmentIndex && index <= lastSegmentIndex) {
      const t = clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq, 0, 1);
      const x = start.x + dx * t;
      const z = start.z + dz * t;
      const distanceSq = (point.x - x) ** 2 + (point.z - z) ** 2;

      if (!best || distanceSq < best.distanceSq) {
        best = {
          distanceSq,
          progress: (walked + segmentLength * t) / totalLength
        };
      }
    }

    walked += segmentLength;
  }

  return best?.progress ?? Number.NaN;
}

function doesMetroPathTouchChunk(path, bounds, padding = 72) {
  const points = path?.points ?? [];
  if (points.length < 2) return false;

  for (let index = 0; index < points.length - 1; index += 1) {
    if (clipLineToBounds(points[index], points[index + 1], bounds, padding)) return true;
  }

  return false;
}

function createTrafficPathRenderBounds(path, padding = 0) {
  const points = path?.points ?? [];
  if (points.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) continue;

    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minZ) || !Number.isFinite(maxZ)) {
    return null;
  }

  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minZ: minZ - padding,
    maxZ: maxZ + padding
  };
}

function addMetroTransitFeatures(data, bounds, chunkX, chunkZ, groundRoads = []) {
  const pierClearanceRoads = [
    ...data.roads,
    ...groundRoads,
    ...(data.bridgeAvoidanceRoads ?? [])
  ];

  for (const line of METRO_LINES) {
    for (let index = 0; index < line.points.length - 1; index += 1) {
      addMetroTrackSegment(
        data,
        bounds,
        line,
        line.points[index],
        line.points[index + 1],
        index,
        pierClearanceRoads
      );
    }

    addMetroTerminalTurnbacks(data, bounds, line);
  }

  for (const line of METRO_LINES) {
    for (const station of line.stations) {
      addMetroStation(data, bounds, line, station, pierClearanceRoads);
    }
  }

  addMetroLineTrains(data, bounds);
}

function addMetroTrackSegment(data, bounds, line, start, end, segmentIndex, pierClearanceRoads = []) {
  if (!clipLineToBounds(start, end, bounds, METRO_BUILDING_CLEARANCE_WIDTH / 2 + 160)) return;

  const id = `metro-${line.id}-line-${segmentIndex}`;
  const elevatedY = line.elevatedY ?? METRO_ELEVATED_Y;
  const startY = getMetroPointY(start, elevatedY);
  const endY = getMetroPointY(end, elevatedY);
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const yaw = Math.atan2(tangent.x, tangent.z);
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  addMetroClearanceCollider(data, bounds, id, start, end);

  for (const trackSide of [-1, 1]) {
    const trackCenter = trackSide * METRO_TRACK_CENTER_OFFSET;
    const trackLabel = trackSide > 0 ? 'outbound' : 'inbound';

    addTransportSlopedOffsetSegmentObstacle(
      data,
      bounds,
      `${id}-track-${trackLabel}-guideway`,
      start,
      end,
      trackCenter,
      METRO_TRACK_GUIDEWAY_WIDTH,
      0.58,
      METRO_GUIDEWAY_COLOR,
      startY,
      endY,
      { type: 'metroGuideway' }
    );

    for (const edgeSide of [-1, 1]) {
      addTransportSlopedOffsetSegmentObstacle(
        data,
        bounds,
        `${id}-track-${trackLabel}-parapet-${edgeSide > 0 ? 'right' : 'left'}`,
        start,
        end,
        trackCenter + edgeSide * (METRO_TRACK_GUIDEWAY_WIDTH / 2 - 0.26),
        0.24,
        0.52,
        METRO_STRUCTURAL_WHITE,
        startY + 0.34,
        endY + 0.34,
        { type: 'metroParapet' }
      );
    }

    for (const railSide of [-1, 1]) {
      addTransportSlopedOffsetSegmentObstacle(
        data,
        bounds,
        `${id}-track-${trackLabel}-rail-${railSide > 0 ? 'right' : 'left'}`,
        start,
        end,
        trackCenter + railSide * METRO_RAIL_HALF_GAUGE,
        0.22,
        0.2,
        METRO_RAIL_COLOR,
        startY + 0.62,
        endY + 0.62,
        { type: 'metroRail' }
      );
    }

    addTransportSlopedOffsetSegmentObstacle(
      data,
      bounds,
      `${id}-track-${trackLabel}-power-rail`,
      start,
      end,
      trackCenter,
      0.14,
      0.14,
      METRO_SOFT_WHITE,
      startY + 0.68,
      endY + 0.68,
      { type: 'metroPowerRail' }
    );
  }

  const sleeperCount = Math.max(3, Math.floor(length / 26));
  for (let sleeperIndex = 0; sleeperIndex <= sleeperCount; sleeperIndex += 1) {
    const distance = clamp(sleeperIndex * (length / sleeperCount), 8, length - 8);
    const x = start.x + tangent.x * distance;
    const z = start.z + tangent.z * distance;
    const sampleY = lerp(startY, endY, distance / length);

    for (const trackSide of [-1, 1]) {
      addMetroObstacle(
        data,
        bounds,
        `${id}-sleeper-${sleeperIndex}-${trackSide > 0 ? 'outbound' : 'inbound'}`,
        x + normal.x * trackSide * METRO_TRACK_CENTER_OFFSET,
        z + normal.z * trackSide * METRO_TRACK_CENTER_OFFSET,
        sampleY + 0.54,
        METRO_RAIL_HALF_GAUGE * 2 + 0.9,
        0.14,
        0.36,
        METRO_DARK_TRIM,
        yaw,
        'metroSleeper'
      );
    }
  }

  addMetroTerrainTunnelSegment(data, bounds, line, start, end, segmentIndex, elevatedY);

  const pierDistances = getRegularInteriorDistances(length, METRO_PIER_SPACING, 18);
  for (const [pierIndex, distance] of pierDistances.entries()) {
    const x = start.x + tangent.x * distance;
    const z = start.z + tangent.z * distance;
    const sampleY = lerp(startY, endY, distance / length);
    const pierPlacement = getMetroPierPlacementAtPoint(x, z, tangent, normal, bounds, pierClearanceRoads);
    if (!pierPlacement) continue;

    addMetroObstacle(
      data,
      bounds,
      `${id}-pier-${pierIndex}`,
      pierPlacement.x,
      pierPlacement.z,
      GROUND_DRIVE_Y,
      pierPlacement.width,
      sampleY - GROUND_DRIVE_Y,
      pierPlacement.depth,
      METRO_STRUCTURAL_WHITE,
      yaw,
      'metroPier'
    );
    addMetroObstacle(
      data,
      bounds,
      `${id}-pier-cap-${pierIndex}`,
      pierPlacement.x,
      pierPlacement.z,
      sampleY - 0.16,
      pierPlacement.offset === 0 ? METRO_GUIDEWAY_WIDTH + 1.6 : 2.8,
      0.42,
      2.4,
      METRO_SOFT_WHITE,
      yaw,
      'metroPierCap'
    );
  }

  const gantryCount = Math.max(2, Math.floor(length / 170));
  for (let gantryIndex = 0; gantryIndex <= gantryCount; gantryIndex += 1) {
    const distance = clamp(gantryIndex * (length / gantryCount), 24, length - 24);
    const center = {
      x: start.x + tangent.x * distance,
      z: start.z + tangent.z * distance
    };
    const sampleY = lerp(startY, endY, distance / length);

    for (const side of [-1, 1]) {
      addMetroObstacle(
        data,
        bounds,
        `${id}-gantry-post-${gantryIndex}-${side}`,
        center.x + normal.x * side * METRO_GANTRY_LATERAL_OFFSET,
        center.z + normal.z * side * METRO_GANTRY_LATERAL_OFFSET,
        sampleY + METRO_GANTRY_POST_BASE_OFFSET,
        0.18,
        METRO_GANTRY_POST_HEIGHT,
        0.18,
        METRO_STRUCTURAL_WHITE,
        yaw,
        'metroGantryPost'
      );
    }

    addMetroObstacle(
      data,
      bounds,
      `${id}-gantry-bar-${gantryIndex}`,
      center.x,
      center.z,
      sampleY + METRO_GANTRY_BAR_BASE_OFFSET,
      METRO_GUIDEWAY_WIDTH + 4.2,
      0.24,
      0.22,
      METRO_STRUCTURAL_WHITE,
      yaw,
      'metroGantryBar'
    );
  }
}

function addMetroTerminalTurnbacks(data, bounds, line) {
  if (!Array.isArray(line.points) || line.points.length < 2) return;

  const elevatedY = line.elevatedY ?? METRO_ELEVATED_Y;
  const outboundPoints = createMetroOffsetPathPoints(line, -METRO_TRACK_CENTER_OFFSET, elevatedY);
  const inboundPoints = createMetroOffsetPathPoints(line, METRO_TRACK_CENTER_OFFSET, elevatedY);
  const startTangent = getMetroLineEndpointTangent(line, 0);
  const endTangent = getMetroLineEndpointTangent(line, line.points.length - 1);
  const outboundStart = outboundPoints[0];
  const outboundEnd = outboundPoints[outboundPoints.length - 1];
  const inboundStart = inboundPoints[0];
  const inboundEnd = inboundPoints[inboundPoints.length - 1];
  const endMarker = createMetroTerminalTurnbackMarkerPoint(inboundEnd, endTangent, 1, inboundEnd.y);
  const startMarker = createMetroTerminalTurnbackMarkerPoint(outboundStart, startTangent, -1, outboundStart.y);

  addMetroTerminalTurnbackTrack(
    data,
    bounds,
    `metro-${line.id}-terminal-end-turnback`,
    outboundEnd,
    inboundEnd,
    endMarker,
    endTangent,
    elevatedY,
    line.color
  );
  addMetroTerminalTurnbackTrack(
    data,
    bounds,
    `metro-${line.id}-terminal-start-turnback`,
    inboundStart,
    outboundStart,
    startMarker,
    { x: -startTangent.x, z: -startTangent.z },
    elevatedY,
    line.color
  );
}

function addMetroTerminalTurnbackTrack(data, bounds, id, approachPoint, departurePoint, markerPoint, markerTangent, elevatedY, lineColor) {
  addMetroSingleTrackSegment(data, bounds, `${id}-crossover`, approachPoint, departurePoint, elevatedY);
  addMetroSingleTrackSegment(data, bounds, `${id}-pocket`, departurePoint, markerPoint, elevatedY);

  const tangent = normalizeVector(markerTangent);
  const normal = { x: -tangent.z, z: tangent.x };
  const markerYaw = Math.atan2(tangent.x, tangent.z);
  const markerY = getMetroPointY(markerPoint, elevatedY);

  addMetroObstacle(
    data,
    bounds,
    `${id}-marker-post`,
    markerPoint.x + normal.x * (METRO_TRACK_GUIDEWAY_WIDTH / 2 + 1.7),
    markerPoint.z + normal.z * (METRO_TRACK_GUIDEWAY_WIDTH / 2 + 1.7),
    markerY + 0.78,
    0.34,
    3.8,
    0.34,
    METRO_STRUCTURAL_WHITE,
    markerYaw,
    'metroTerminalTurnbackMarker'
  );
  addMetroObstacle(
    data,
    bounds,
    `${id}-marker-board`,
    markerPoint.x + normal.x * (METRO_TRACK_GUIDEWAY_WIDTH / 2 + 1.7) + tangent.x * 0.08,
    markerPoint.z + normal.z * (METRO_TRACK_GUIDEWAY_WIDTH / 2 + 1.7) + tangent.z * 0.08,
    markerY + 4.34,
    2.2,
    1.35,
    0.26,
    lineColor ?? METRO_WARM_LIGHT,
    markerYaw,
    'metroTerminalTurnbackMarker'
  );
}

function addMetroSingleTrackSegment(data, bounds, id, start, end, elevatedY) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  if (length <= 0.5) return;
  const startY = getMetroPointY(start, elevatedY);
  const endY = getMetroPointY(end, elevatedY);

  addTransportSlopedOffsetSegmentObstacle(
    data,
    bounds,
    `${id}-guideway`,
    start,
    end,
    0,
    METRO_TRACK_GUIDEWAY_WIDTH,
    0.58,
    METRO_GUIDEWAY_COLOR,
    startY,
    endY,
    { type: 'metroGuideway' }
  );

  for (const edgeSide of [-1, 1]) {
    addTransportSlopedOffsetSegmentObstacle(
      data,
      bounds,
      `${id}-parapet-${edgeSide > 0 ? 'right' : 'left'}`,
      start,
      end,
      edgeSide * (METRO_TRACK_GUIDEWAY_WIDTH / 2 - 0.26),
      0.24,
      0.52,
      METRO_STRUCTURAL_WHITE,
      startY + 0.34,
      endY + 0.34,
      { type: 'metroParapet' }
    );
  }

  for (const railSide of [-1, 1]) {
    addTransportSlopedOffsetSegmentObstacle(
      data,
      bounds,
      `${id}-rail-${railSide > 0 ? 'right' : 'left'}`,
      start,
      end,
      railSide * METRO_RAIL_HALF_GAUGE,
      0.22,
      0.2,
      METRO_RAIL_COLOR,
      startY + 0.62,
      endY + 0.62,
      { type: 'metroRail' }
    );
  }

  addTransportSlopedOffsetSegmentObstacle(
    data,
    bounds,
    `${id}-power-rail`,
    start,
    end,
    0,
    0.14,
    0.14,
    METRO_SOFT_WHITE,
    startY + 0.68,
    endY + 0.68,
    { type: 'metroPowerRail' }
  );
}

function addMetroTerrainTunnelSegment(data, bounds, line, start, end, segmentIndex, elevatedY) {
  const tunnelTarget = getMetroTerrainTunnelTargetForLine(line);
  const landform = getMetroTerrainTunnelLandform(tunnelTarget);
  if (!tunnelTarget || !landform) return;

  const tunnelClip = clipLineSegmentToCircle(
    start,
    end,
    landform.center,
    Math.max(24, landform.radius - 20)
  );
  if (!tunnelClip || tunnelClip.t1 - tunnelClip.t0 <= 0.001) return;

  const clippedStart = lerpPoint(start, end, tunnelClip.t0);
  const clippedEnd = lerpPoint(start, end, tunnelClip.t1);
  const length = Math.hypot(clippedEnd.x - clippedStart.x, clippedEnd.z - clippedStart.z);
  if (length <= 1.5) return;

  const id = `metro-${line.id}-terrain-tunnel-${segmentIndex}`;
  const tangent = normalizeVector({
    x: clippedEnd.x - clippedStart.x,
    z: clippedEnd.z - clippedStart.z
  });
  const normal = { x: -tangent.z, z: tangent.x };

  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-roof`,
    clippedStart,
    clippedEnd,
    METRO_TERRAIN_TUNNEL_WIDTH + 2.4,
    METRO_TERRAIN_TUNNEL_ROOF_HEIGHT,
    '#59666c',
    elevatedY + METRO_TERRAIN_TUNNEL_WALL_HEIGHT + 0.34,
    { type: 'metroTerrainTunnelRoof' }
  );

  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-trackbed-shadow`,
    clippedStart,
    clippedEnd,
    METRO_TERRAIN_TUNNEL_WIDTH - 4,
    0.1,
    '#151b20',
    elevatedY + 0.02,
    { type: 'metroTerrainTunnelFloor' }
  );

  for (const side of [-1, 1]) {
    addTransportOffsetSegmentObstacle(
      data,
      bounds,
      `${id}-side-wall-${side > 0 ? 'right' : 'left'}`,
      clippedStart,
      clippedEnd,
      side * (METRO_TERRAIN_TUNNEL_WIDTH / 2 + 0.45),
      0.84,
      METRO_TERRAIN_TUNNEL_WALL_HEIGHT,
      '#3f4a50',
      elevatedY + 0.14,
      { type: 'metroTerrainTunnelWall' }
    );
  }

  if (tunnelClip.t0 > 0.001) {
    addMetroTerrainTunnelPortal(
      data,
      bounds,
      `${id}-entry-portal`,
      clippedStart,
      tangent,
      normal,
      elevatedY
    );
  }

  if (tunnelClip.t1 < 0.999) {
    addMetroTerrainTunnelPortal(
      data,
      bounds,
      `${id}-exit-portal`,
      clippedEnd,
      tangent,
      normal,
      elevatedY
    );
  }
}

function addMetroTerrainTunnelPortal(data, bounds, id, point, tangent, normal, elevatedY) {
  const halfWidth = METRO_TERRAIN_TUNNEL_WIDTH / 2 + 2.8;
  const left = offsetPlanarPoint(point, tangent, normal, 0, -halfWidth);
  const right = offsetPlanarPoint(point, tangent, normal, 0, halfWidth);

  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-header`,
    left,
    right,
    1.55,
    0.82,
    '#6a767d',
    elevatedY + METRO_TERRAIN_TUNNEL_WALL_HEIGHT + 0.18,
    { type: 'metroTerrainTunnelPortal' }
  );

  addTransportSegmentObstacle(
    data,
    bounds,
    `${id}-warning-band`,
    offsetPlanarPoint(point, tangent, normal, -0.84, -halfWidth + 2.2),
    offsetPlanarPoint(point, tangent, normal, -0.84, halfWidth - 2.2),
    0.28,
    0.24,
    '#f2d486',
    elevatedY + METRO_TERRAIN_TUNNEL_WALL_HEIGHT + 0.98,
    { type: 'metroTerrainTunnelPortal' }
  );

  for (const side of [-1, 1]) {
    const lateral = side * halfWidth;

    addTransportSegmentObstacle(
      data,
      bounds,
      `${id}-jamb-${side > 0 ? 'right' : 'left'}`,
      offsetPlanarPoint(point, tangent, normal, -0.88, lateral),
      offsetPlanarPoint(point, tangent, normal, 0.88, lateral),
      1.16,
      METRO_TERRAIN_TUNNEL_WALL_HEIGHT,
      '#57646b',
      elevatedY + 0.14,
      { type: 'metroTerrainTunnelPortal' }
    );
  }
}

function clipLineSegmentToCircle(start, end, center, radius) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq <= 0.000001 || radius <= 0) return null;

  const sx = start.x - center.x;
  const sz = start.z - center.z;
  const a = lengthSq;
  const b = 2 * (sx * dx + sz * dz);
  const c = sx * sx + sz * sz - radius * radius;
  const startInside = c <= 0;
  const endInside = (end.x - center.x) ** 2 + (end.z - center.z) ** 2 <= radius * radius;

  if (startInside && endInside) {
    return { t0: 0, t1: 1 };
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const tA = (-b - sqrtDiscriminant) / (2 * a);
  const tB = (-b + sqrtDiscriminant) / (2 * a);
  const enter = Math.min(tA, tB);
  const exit = Math.max(tA, tB);
  const t0 = clamp(startInside ? 0 : enter, 0, 1);
  const t1 = clamp(endInside ? 1 : exit, 0, 1);

  if (t1 <= 0 || t0 >= 1 || t1 <= t0) return null;

  return { t0, t1 };
}

function getMetroPierPlacementAtPoint(x, z, tangent, normal, bounds, pierClearanceRoads = []) {
  const sideOffset = Math.min(METRO_TRACK_CENTER_OFFSET, METRO_GUIDEWAY_WIDTH / 2 - 2.2);
  const edgeOffset = METRO_GUIDEWAY_WIDTH / 2 - 2.2;
  const forwardOffsets = [0, 10, -10, 20, -20, 32, -32, 44, -44];
  const lateralCandidates = [
    { offset: 0, width: 1.4, depth: 1.4 },
    { offset: -sideOffset, width: 1.12, depth: 1.12 },
    { offset: sideOffset, width: 1.12, depth: 1.12 },
    { offset: -edgeOffset, width: 1.12, depth: 1.12 },
    { offset: edgeOffset, width: 1.12, depth: 1.12 }
  ];

  for (const forwardOffset of forwardOffsets) {
    for (const candidate of lateralCandidates) {
      const candidateX = x + tangent.x * forwardOffset + normal.x * candidate.offset;
      const candidateZ = z + tangent.z * forwardOffset + normal.z * candidate.offset;
      if (shouldSkipMetroPierAtPoint(candidateX, candidateZ, bounds, pierClearanceRoads)) continue;

      return {
        ...candidate,
        forwardOffset,
        x: candidateX,
        z: candidateZ
      };
    }
  }

  return null;
}

function removeMetroSupportsOverRoads(obstacles, roads) {
  const blockedSupportKeys = new Set();

  for (const obstacle of obstacles) {
    if (obstacle?.type !== 'metroPier') continue;
    const [x, , z] = obstacle.position ?? [];
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    if (!isPointOnAnyRoadSurface(x, z, roads, METRO_PIER_ROAD_CLEARANCE)) continue;

    const supportKey = getMetroSupportKey(obstacle.id);
    if (supportKey) blockedSupportKeys.add(supportKey);
  }

  if (blockedSupportKeys.size === 0) return;

  for (let index = obstacles.length - 1; index >= 0; index -= 1) {
    const supportKey = getMetroSupportKey(obstacles[index]?.id);
    if (!supportKey || !blockedSupportKeys.has(supportKey)) continue;

    obstacles.splice(index, 1);
  }
}

function getMetroSupportKey(id) {
  const value = String(id ?? '');
  const stationMatch = value.match(/^(.*-metro-station(?:-connector)?-pier-\d+-\d+)(?:-cap)?$/);
  if (stationMatch) return stationMatch[1];

  const linePierMatch = value.match(/^(metro-[^-]+-line-\d+)-pier-(\d+)$/);
  if (linePierMatch) return `${linePierMatch[1]}-${linePierMatch[2]}`;

  const lineCapMatch = value.match(/^(metro-[^-]+-line-\d+)-pier-cap-(\d+)$/);
  if (lineCapMatch) return `${lineCapMatch[1]}-${lineCapMatch[2]}`;

  return null;
}

function shouldSkipMetroPierAtPoint(x, z, bounds, pierClearanceRoads = []) {
  if (isPointOnAnyRoadSurface(x, z, pierClearanceRoads, METRO_PIER_ROAD_CLEARANCE)) return true;
  if (isPointInsideSurfaceTunnelAccessClearance(x, z, METRO_PIER_ROAD_CLEARANCE + 8)) return true;
  if (isPointNearTransportSurfaceAvenueCorridor(x, z, METRO_PIER_ROAD_CLEARANCE)) return true;
  if (isPointNearChunkEdge(x, z, bounds, METRO_PIER_CHUNK_EDGE_CLEARANCE)) return true;
  if (!isBoxOverlappingChunk(x, z, 4, 4, bounds, 1)) return true;

  return false;
}

function isPointNearTransportSurfaceAvenueCorridor(x, z, margin = 0) {
  if (!FAST_ROADS_UNDERGROUND) return false;

  const [start, end] = TRANSPORT_HIGHWAY.points;
  const projection = projectPointToSegment(x, z, start.x, start.z, end.x, end.z);
  if (!projection) return false;

  const dx = x - projection.x;
  const dz = z - projection.z;
  const distance = Math.hypot(dx, dz);
  const corridorHalfWidth = TRANSPORT_SURFACE_AVENUE_WIDTH / 2 +
    TRANSPORT_SURFACE_TUNNEL_ACCESS_OUTER_OFFSET +
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH +
    margin;

  return projection.t >= -0.02 && projection.t <= 1.02 && distance <= corridorHalfWidth;
}

function isPointNearChunkEdge(x, z, bounds, margin = 0) {
  if (!bounds) return false;

  return Math.abs(x - bounds.minX) <= margin ||
    Math.abs(x - bounds.maxX) <= margin ||
    Math.abs(z - bounds.minZ) <= margin ||
    Math.abs(z - bounds.maxZ) <= margin;
}

function isPointNearChunkRoadAxis(x, z, bounds, margin = 0) {
  if (!bounds) return false;

  return Math.abs(x - bounds.centerX) <= margin ||
    Math.abs(z - bounds.centerZ) <= margin;
}

function isPointNearProceduralRoadGridAxis(x, z, margin = 0) {
  return getDistanceToNearestGridAxis(x, WORLD_SETTINGS.roadSpacing) <= margin ||
    getDistanceToNearestGridAxis(z, WORLD_SETTINGS.roadSpacing) <= margin ||
    getDistanceToNearestGridAxis(x, LOCAL_STREET_SPACING) <= margin ||
    getDistanceToNearestGridAxis(z, LOCAL_STREET_SPACING) <= margin;
}

function getDistanceToNearestGridAxis(value, spacing) {
  if (!Number.isFinite(value) || !Number.isFinite(spacing) || spacing <= 0) return Infinity;

  return Math.abs(value - Math.round(value / spacing) * spacing);
}

function addMetroClearanceCollider(data, bounds, id, start, end) {
  const clip = clipLineToBounds(start, end, bounds, METRO_BUILDING_CLEARANCE_WIDTH / 2);
  if (!clip) return;

  data.roadColliders.push(createSegmentCollider(
    `${id}-building-clearance`,
    'metroClearance',
    clip.start,
    clip.end,
    METRO_BUILDING_CLEARANCE_WIDTH
  ));
}

function addMetroStationClearanceCollider(data, bounds, line, station, point, tangent, normal, stationLength, platformWidth) {
  const clearanceWidth = platformWidth + 30;
  const clearanceLength = stationLength + 74;
  const corners = [
    offsetPlanarPoint(point, tangent, normal, -clearanceLength / 2, -clearanceWidth / 2),
    offsetPlanarPoint(point, tangent, normal, -clearanceLength / 2, clearanceWidth / 2),
    offsetPlanarPoint(point, tangent, normal, clearanceLength / 2, -clearanceWidth / 2),
    offsetPlanarPoint(point, tangent, normal, clearanceLength / 2, clearanceWidth / 2)
  ];
  const minX = Math.min(...corners.map((corner) => corner.x));
  const maxX = Math.max(...corners.map((corner) => corner.x));
  const minZ = Math.min(...corners.map((corner) => corner.z));
  const maxZ = Math.max(...corners.map((corner) => corner.z));

  if (!isBoxOverlappingChunk((minX + maxX) / 2, (minZ + maxZ) / 2, maxX - minX, maxZ - minZ, bounds, 8)) return;

  data.roadColliders.push(createBoxCollider(
    `${line.id}-${station.id}-station-clearance`,
    'metroStationClearance',
    (minX + maxX) / 2,
    (minZ + maxZ) / 2,
    maxX - minX,
    maxZ - minZ
  ));
}

function addMetroStation(data, bounds, line, station, pierClearanceRoads = []) {
  const placement = getMetroStationPlacement(line, station);
  if (!placement) return;

  const { elevatedY, point, tangent, normal, yaw } = placement;
  const stationLength = METRO_STATION_LENGTH;
  const platformWidth = METRO_STATION_PLATFORM_WIDTH;
  addMetroStationClearanceCollider(data, bounds, line, station, point, tangent, normal, stationLength, platformWidth);
  addMetroStationConnectorDeck(data, bounds, line, station, placement, stationLength, platformWidth);
  addMetroStationSupportPiers(data, bounds, line, station, placement, stationLength, platformWidth, pierClearanceRoads);
  addMetroStationVisibilityMarkers(data, bounds, line, station, placement, stationLength, platformWidth);

  addMetroLocalObstacle(
    data,
    bounds,
    `${station.id}-metro-platform`,
    point,
    tangent,
    normal,
    0,
    0,
    elevatedY + 0.54,
    platformWidth,
    0.52,
    stationLength,
    METRO_STATION_PLATFORM_COLOR,
    yaw,
    'metroStationPlatform'
  );
  addMetroLocalObstacle(
    data,
    bounds,
    `${station.id}-metro-canopy`,
    point,
    tangent,
    normal,
    0,
    0,
    elevatedY + 4.4,
    platformWidth + 3.2,
    0.52,
    stationLength + 12,
    METRO_STATION_CANOPY_COLOR,
    yaw,
    'metroStationCanopy'
  );
  addMetroLocalObstacle(
    data,
    bounds,
    `${station.id}-metro-center-glass`,
    point,
    tangent,
    normal,
    0,
    0,
    elevatedY + 1.42,
    0.24,
    1.82,
    stationLength - 22,
    METRO_STATION_GLASS_COLOR,
    yaw,
    'metroStationGlass'
  );

  for (const side of [-1, 1]) {
    addMetroLocalObstacle(
      data,
      bounds,
      `${station.id}-metro-platform-edge-${side}`,
      point,
      tangent,
      normal,
      0,
      side * (platformWidth / 2 - 1.2),
      elevatedY + 1.08,
      0.24,
      0.26,
      stationLength - 8,
      line.color ?? METRO_STATION_COLUMN_COLOR,
      yaw,
      'metroStationPlatformEdge'
    );

    for (let index = -3; index <= 3; index += 1) {
      const columnForward = index * 20;

      addMetroLocalObstacle(
        data,
        bounds,
        `${station.id}-metro-column-${side}-${index}`,
        point,
        tangent,
        normal,
        columnForward,
        side * 7.6,
        elevatedY + 0.62,
        0.52,
        3.75,
        0.52,
        METRO_STATION_COLUMN_COLOR,
        yaw,
        'metroStationColumn'
      );
      addMetroLocalObstacle(
        data,
        bounds,
        `${station.id}-metro-light-${side}-${index}`,
        point,
        tangent,
        normal,
        columnForward,
        side * 6.2,
        elevatedY + 3.98,
        1.8,
        0.12,
        0.28,
        METRO_WARM_LIGHT,
        yaw,
        'metroStationLight'
      );
    }
  }

  addMetroStationGroundAccess(data, bounds, line, station, placement, stationLength);

  addTransportRoadSign(data, bounds, {
    id: `${station.id}-metro-sign`,
    text: station.name,
    position: [point.x + normal.x * 11.8, elevatedY + 5.45, point.z + normal.z * 11.8],
    rotation: [0, yaw, 0],
    scale: [8.6, 2.55, 0.28],
    color: line.color
  });
}

function addMetroStationVisibilityMarkers(data, bounds, line, station, placement, stationLength, platformWidth) {
  const { elevatedY, point, tangent, normal, yaw } = placement;
  const color = line.color ?? METRO_WARM_LIGHT;

  addMetroLocalObstacle(
    data,
    bounds,
    `${station.id}-metro-roof-line-band`,
    point,
    tangent,
    normal,
    0,
    0,
    elevatedY + 4.95,
    platformWidth + 4.2,
    0.16,
    stationLength + 16,
    color,
    yaw,
    'metroStationLineBand'
  );

  for (const side of [-1, 1]) {
    addMetroLocalObstacle(
      data,
      bounds,
      `${station.id}-metro-platform-line-band-${side}`,
      point,
      tangent,
      normal,
      0,
      side * (platformWidth / 2 - 0.42),
      elevatedY + 1.14,
      0.62,
      0.34,
      stationLength + 6,
      color,
      yaw,
      'metroStationLineBand'
    );
  }

  for (const forward of [-stationLength / 2 + 16, stationLength / 2 - 16]) {
    addMetroLocalObstacle(
      data,
      bounds,
      `${station.id}-metro-beacon-${forward < 0 ? 'a' : 'b'}`,
      point,
      tangent,
      normal,
      forward,
      platformWidth / 2 + 2.6,
      elevatedY + 4.85,
      1.55,
      6.4,
      1.55,
      color,
      yaw,
      'metroStationBeacon'
    );
  }
}

function addMetroStationConnectorDeck(data, bounds, line, station, placement, stationLength, platformWidth) {
  const { elevatedY, point, structureForwardOffset, tangent, trackPoint, normal } = placement;
  const offset = structureForwardOffset ?? 0;
  const sign = Math.sign(offset);
  if (!sign || Math.abs(offset) <= stationLength / 2 - 10) return;

  const connectorStart = {
    x: point.x - tangent.x * sign * (stationLength / 2 - 6),
    z: point.z - tangent.z * sign * (stationLength / 2 - 6)
  };
  const connectorEnd = {
    x: trackPoint.x + tangent.x * sign * 4,
    z: trackPoint.z + tangent.z * sign * 4
  };
  const connectorLength = Math.hypot(connectorEnd.x - connectorStart.x, connectorEnd.z - connectorStart.z);
  if (connectorLength < 8) return;

  addTransportSegmentObstacle(
    data,
    bounds,
    `${station.id}-metro-station-connector-deck`,
    connectorStart,
    connectorEnd,
    platformWidth + 3.2,
    0.46,
    METRO_STATION_DECK_COLOR,
    elevatedY + 0.34,
    { type: 'metroStationConnectorDeck' }
  );

  for (const side of [-1, 1]) {
    addTransportOffsetSegmentObstacle(
      data,
      bounds,
      `${station.id}-metro-station-connector-parapet-${side}`,
      connectorStart,
      connectorEnd,
      side * (platformWidth / 2 + 1.2),
      0.38,
      0.62,
      METRO_STATION_COLUMN_COLOR,
      elevatedY + 0.76,
      { type: 'metroStationConnectorParapet' }
    );
  }

  for (const trackSide of [-1, 1]) {
    addTransportOffsetSegmentObstacle(
      data,
      bounds,
      `${station.id}-metro-station-connector-track-${trackSide}`,
      connectorStart,
      connectorEnd,
      trackSide * METRO_TRACK_CENTER_OFFSET,
      METRO_TRACK_GUIDEWAY_WIDTH,
      0.28,
      METRO_BLACK,
      elevatedY + 0.68,
      { type: 'metroStationConnectorTrack' }
    );
  }
}

function addMetroStationSupportPiers(data, bounds, line, station, placement, stationLength, platformWidth, pierClearanceRoads = []) {
  const { elevatedY, point, structureForwardOffset, tangent, trackPoint, normal, yaw } = placement;
  const supportRows = getRegularInteriorDistances(stationLength, METRO_STATION_SUPPORT_SPACING, 22)
    .map((distance) => distance - stationLength / 2);
  const lateralRows = [
    -(platformWidth / 2 - 4.6),
    platformWidth / 2 - 4.6
  ];
  const maxLateral = platformWidth / 2 - 2.2;

  for (const [forwardIndex, forward] of supportRows.entries()) {
    for (const [sideIndex, lateral] of lateralRows.entries()) {
      addMetroStationSupportPier(
        data,
        bounds,
        `${station.id}-metro-station-pier-${forwardIndex}-${sideIndex}`,
        point,
        tangent,
        normal,
        forward,
        lateral,
        elevatedY,
        yaw,
        pierClearanceRoads,
        maxLateral
      );
    }
  }

  const offset = structureForwardOffset ?? 0;
  const sign = Math.sign(offset);
  if (!sign || Math.abs(offset) <= stationLength / 2 - 10) return;

  const innerEdge = {
    x: point.x - tangent.x * sign * (stationLength / 2 - 6),
    z: point.z - tangent.z * sign * (stationLength / 2 - 6)
  };
  const connectorCenter = midpoint(innerEdge, trackPoint);

  for (const [sideIndex, lateral] of lateralRows.entries()) {
    addMetroStationSupportPier(
      data,
      bounds,
      `${station.id}-metro-station-connector-pier-0-${sideIndex}`,
      connectorCenter,
      tangent,
      normal,
      0,
      lateral,
      elevatedY,
      yaw,
      pierClearanceRoads,
      maxLateral
    );
  }
}

function addMetroStationSupportPier(data, bounds, id, origin, tangent, normal, forward, lateral, elevatedY, yaw, pierClearanceRoads, maxLateral = null) {
  const placement = getMetroStationSupportPierPlacement(origin, tangent, normal, forward, lateral, bounds, pierClearanceRoads, maxLateral);
  if (!placement) return;

  addMetroObstacle(
    data,
    bounds,
    id,
    placement.x,
    placement.z,
    GROUND_DRIVE_Y,
    1.36,
    elevatedY - GROUND_DRIVE_Y + 0.2,
    1.36,
    METRO_STATION_COLUMN_COLOR,
    yaw,
    'metroPier'
  );
  addMetroObstacle(
    data,
    bounds,
    `${id}-cap`,
    placement.x,
    placement.z,
    elevatedY + 0.18,
    4.8,
    0.44,
    4.8,
    METRO_STATION_DECK_COLOR,
    yaw,
    'metroPierCap'
  );
}

function getMetroStationSupportPierPlacement(origin, tangent, normal, forward, lateral, bounds, pierClearanceRoads = [], maxLateral = null) {
  const side = Math.sign(lateral) || 1;
  const forwardOffsets = [0, 8, -8, 16, -16];
  const lateralLimit = Number.isFinite(maxLateral) ? Math.abs(maxLateral) : Infinity;
  const lateralOffsets = [
    lateral,
    lateral - side * 2.8,
    side * Math.min(2.6, lateralLimit),
    0,
    lateral + side * 2.4
  ].filter((offset, index, offsets) => (
    Math.abs(offset) <= lateralLimit &&
    offsets.findIndex((item) => Math.abs(item - offset) < 0.05) === index
  ));

  for (const forwardOffset of forwardOffsets) {
    for (const lateralOffset of lateralOffsets) {
      const x = origin.x + tangent.x * (forward + forwardOffset) + normal.x * lateralOffset;
      const z = origin.z + tangent.z * (forward + forwardOffset) + normal.z * lateralOffset;
      if (!isBoxOverlappingChunk(x, z, 4, 4, bounds, 1)) continue;
      if (isPointOnAnyRoadSurface(x, z, pierClearanceRoads, METRO_PIER_ROAD_CLEARANCE)) continue;
      if (isPointInsideSurfaceTunnelAccessClearance(x, z, METRO_PIER_ROAD_CLEARANCE + 8)) continue;
      if (isPointNearTransportSurfaceAvenueCorridor(x, z, METRO_PIER_ROAD_CLEARANCE)) continue;

      return { x, z };
    }
  }

  return null;
}

function addMetroLineTrains(data, bounds) {
  for (const line of METRO_LINES) {
    const serviceOffsets = line.serviceOffsets ?? METRO_SERVICE_OFFSETS;

    for (let index = 0; index < serviceOffsets.length; index += 1) {
      addMetroTrainSet(
        data,
        bounds,
        `${line.id}-forward-${index}`,
        line,
        serviceOffsets[index]
      );
      addMetroTrainSet(
        data,
        bounds,
        `${line.id}-reverse-${index}`,
        line,
        positiveModulo(serviceOffsets[index] + 0.5, 1)
      );
    }
  }
}

function getMetroTerminalStopProgressesForPath(path, trainHalfLength = 0) {
  return getMetroTerminalServiceStopsForPath(path, trainHalfLength).stops;
}

function getMetroTerminalServiceStopsForPath(path, trainHalfLength = 0) {
  const points = path?.points ?? [];
  const routeLength = getPlanarPathLength(points);
  if (routeLength <= 0.001) return { reverseServiceRanges: [], stops: [] };

  const crossoverDistances = path?.metroTerminalCrossoverEndDistances;
  if (
    Number.isFinite(crossoverDistances?.end) &&
    Number.isFinite(crossoverDistances?.start)
  ) {
    const centerClearance = Math.max(0, trainHalfLength + METRO_TERMINAL_STOP_FRONT_CLEARANCE);
    const endStop = Number(positiveModulo((crossoverDistances.end + centerClearance) / routeLength, 1).toFixed(5));
    const startStop = Number(positiveModulo((crossoverDistances.start + centerClearance) / routeLength, 1).toFixed(5));
    const stops = [...new Set([startStop, endStop])].sort((a, b) => a - b);

    return {
      reverseServiceRanges: Number.isFinite(endStop) && Number.isFinite(startStop)
        ? [{ start: endStop, end: startStop }]
        : [],
      stops
    };
  }

  const markerDistances = path?.metroTerminalMarkerDistances ?? [];
  if (markerDistances.length === 0) return { reverseServiceRanges: [], stops: [] };

  const centerBackoff = Math.max(0, trainHalfLength - METRO_TERMINAL_STOP_FRONT_CLEARANCE);
  const stops = markerDistances
    .filter(Number.isFinite)
    .map((distance) => Number(positiveModulo((distance - centerBackoff) / routeLength, 1).toFixed(5)));

  return { reverseServiceRanges: [], stops };
}

function addMetroTrainSet(data, bounds, trainId, line, centerT) {
  const carLength = METRO_TRAIN_CAR_LENGTH;
  const carGap = METRO_TRAIN_CAR_GAP;
  const carWidth = 3.25;
  const elevatedY = line.elevatedY ?? METRO_ELEVATED_Y;
  const trainBaseY = elevatedY + 0.86;
  const path = createMetroLoopTrafficPath(line, trainBaseY);
  const routeLength = getPlanarPathLength(path.points);
  if (routeLength <= 1) return;

  if (!doesMetroPathTouchChunk(path, bounds)) return;

  const trainCenterProgress = positiveModulo(centerT, 1);
  const carProgressGap = (carLength + carGap) / routeLength;
  const trainHalfLength = ((METRO_TRAIN_CAR_COUNT - 1) * (carLength + carGap) + carLength) / 2;
  const renderBounds = createTrafficPathRenderBounds(path, trainHalfLength + 120);
  const terminalMargin = 0;
  const metroTerminalServiceStops = getMetroTerminalServiceStopsForPath(path, trainHalfLength);
  const metroTerminalStops = metroTerminalServiceStops.stops;
  const metroStops = getMetroStopProgressesForPath(line, path, metroTerminalStops);
  const serviceOffsetCount = Math.max(1, (line.serviceOffsets ?? METRO_SERVICE_OFFSETS).length);
  const cycleSeconds = METRO_SERVICE_HEADWAY_SECONDS * serviceOffsetCount * 2 / Math.max(0.1, line.speedMultiplier ?? 1);
  const speed = 1 / cycleSeconds;

  for (let carIndex = 0; carIndex < METRO_TRAIN_CAR_COUNT; carIndex += 1) {
    const carId = `metro-train-${trainId}-car-${carIndex}`;
    const trainCarOffset = (carIndex - (METRO_TRAIN_CAR_COUNT - 1) / 2) * carProgressGap;
    const offset = positiveModulo(trainCenterProgress + trainCarOffset, 1);

    const startPoint = path.points[0];
    const endPoint = path.points[path.points.length - 1];

    data.trafficVehicles.push(createTrafficVehicle(
      carId,
      startPoint.x,
      startPoint.z,
      endPoint.x,
      endPoint.z,
      trainBaseY,
      carWidth,
      2.85,
      carLength,
      carIndex === 0 || carIndex === METRO_TRAIN_CAR_COUNT - 1 ? METRO_TRAIN_END_COLOR : METRO_TRAIN_BODY_COLOR,
      speed,
      offset,
      {
        behavior: 'metro-train',
        lineColor: line.color,
        loopMode: 'loop',
        metroCycleSeconds: cycleSeconds,
        metroDwellSeconds: METRO_STATION_DWELL_SECONDS,
        metroLoop: true,
        metroOneWay: true,
        metroReversibleEnds: true,
        metroReverseServiceRanges: metroTerminalServiceStops.reverseServiceRanges,
        metroTerminalDwellSeconds: METRO_TERMINAL_DWELL_SECONDS,
        metroTerminalMargin: terminalMargin,
        metroTerminalStops,
        metroStops,
        path,
        pathKey: `${line.id}-metro-loop`,
        preservePathYaw: true,
        renderBounds,
        roadKind: 'metro-line',
        roadType: 'metro',
        trainCarOffset,
        trainEnd: carIndex === METRO_TRAIN_CAR_COUNT - 1 ? 'front' : carIndex === 0 ? 'rear' : 'middle',
        trainOffset: trainCenterProgress,
        trainSetId: trainId,
        vehicleType: 'metroTrain'
      }
    ));
  }
}

function addMetroStationGroundAccess(data, bounds, line, station, placement, stationLength) {
  const { elevatedY, point, tangent, normal, yaw } = placement;
  const groundForward = -stationLength / 2 - 34;
  const platformForward = -stationLength / 2 + 6;
  const accessLateral = -12.8;
  const groundPoint = {
    x: point.x + tangent.x * groundForward + normal.x * accessLateral,
    z: point.z + tangent.z * groundForward + normal.z * accessLateral
  };
  const platformPoint = {
    x: point.x + tangent.x * platformForward + normal.x * accessLateral,
    z: point.z + tangent.z * platformForward + normal.z * accessLateral
  };

  addMetroObstacle(
    data,
    bounds,
    `${station.id}-metro-ground-plaza`,
    groundPoint.x,
    groundPoint.z,
    GROUND_DRIVE_Y + 0.03,
    28,
    0.06,
    22,
    METRO_STATION_DECK_COLOR,
    yaw,
    'metroStationGroundPlaza'
  );
  addMetroObstacle(
    data,
    bounds,
    `${station.id}-metro-entry-canopy`,
    groundPoint.x,
    groundPoint.z,
    GROUND_DRIVE_Y + 2.45,
    13,
    0.34,
    8,
    line.color ?? METRO_STATION_CANOPY_COLOR,
    yaw,
    'metroStationGroundCanopy'
  );
  addMetroObstacle(
    data,
    bounds,
    `${station.id}-metro-elevator-core`,
    groundPoint.x + normal.x * 5.8,
    groundPoint.z + normal.z * 5.8,
    GROUND_DRIVE_Y,
    3.4,
    elevatedY - GROUND_DRIVE_Y + 4.1,
    3.4,
    METRO_STATION_ACCESS_COLOR,
    yaw,
    'metroStationElevatorCore'
  );
  addMetroSlopedObstacle(
    data,
    bounds,
    `${station.id}-metro-stair-ramp`,
    groundPoint,
    platformPoint,
    GROUND_DRIVE_Y + 0.18,
    elevatedY + 0.92,
    5.4,
    0.26,
    METRO_STATION_ACCESS_COLOR,
    'metroStationStairRamp'
  );

  const stepCount = 14;
  for (let index = 0; index < stepCount; index += 1) {
    const t = (index + 0.5) / stepCount;
    const stepPoint = lerpPoint(groundPoint, platformPoint, t);
    const stepY = lerp(GROUND_DRIVE_Y + 0.22, elevatedY + 0.74, t);

    addMetroObstacle(
      data,
      bounds,
      `${station.id}-metro-stair-step-${index}`,
      stepPoint.x,
      stepPoint.z,
      stepY,
      5.7,
      0.18,
      1.7,
      METRO_STATION_DECK_COLOR,
      yaw,
      'metroStationStairStep'
    );
  }

  for (const side of [-1, 1]) {
    const railStart = {
      x: groundPoint.x + normal.x * side * 3.3,
      z: groundPoint.z + normal.z * side * 3.3
    };
    const railEnd = {
      x: platformPoint.x + normal.x * side * 3.3,
      z: platformPoint.z + normal.z * side * 3.3
    };

    addMetroSlopedObstacle(
      data,
      bounds,
      `${station.id}-metro-stair-handrail-${side}`,
      railStart,
      railEnd,
      GROUND_DRIVE_Y + 1.05,
      elevatedY + 1.55,
      0.18,
      0.18,
      METRO_STATION_COLUMN_COLOR,
      'metroStationHandrail'
    );
  }
}

function addMetroSlopedObstacle(data, bounds, id, start, end, startY, endY, width, thickness, color, type) {
  const clip = clipLineToBounds(start, end, bounds, width / 2 + 1.5);
  if (!clip) return;

  data.trafficObstacles.push(createSlopedTrafficObstacle(
    id,
    clip.start,
    clip.end,
    lerp(startY, endY, clip.t0),
    lerp(startY, endY, clip.t1),
    width,
    thickness,
    color,
    type
  ));
}

function getMetroStationPlacementById(lineId, stationId) {
  const line = METRO_LINES.find((item) => item.id === lineId);
  const station = line?.stations?.find((item) => item.id === stationId);
  if (!line || !station) return null;

  return getMetroStationPlacement(line, station);
}

function getMetroStationPlacement(line, station) {
  const pose = getMetroStationStraightPose(line, station);
  if (!pose) return null;

  const normal = { x: -pose.tangent.z, z: pose.tangent.x };
  const forwardOffset = station.structureForwardOffset ?? 0;
  const lateralOffset = station.structureLateralOffset ?? 0;
  const point = {
    x: pose.point.x + pose.tangent.x * forwardOffset + normal.x * lateralOffset,
    z: pose.point.z + pose.tangent.z * forwardOffset + normal.z * lateralOffset
  };

  return {
    elevatedY: getMetroPointY(pose.point, line.elevatedY ?? METRO_ELEVATED_Y),
    point,
    structureForwardOffset: forwardOffset,
    tangent: pose.tangent,
    trackPoint: pose.point,
    normal,
    yaw: Math.atan2(pose.tangent.x, pose.tangent.z)
  };
}

function addMetroLocalObstacle(
  data,
  bounds,
  id,
  origin,
  tangent,
  normal,
  forward,
  lateral,
  baseY,
  width,
  height,
  depth,
  color,
  yaw,
  type
) {
  const x = origin.x + tangent.x * forward + normal.x * lateral;
  const z = origin.z + tangent.z * forward + normal.z * lateral;

  addMetroObstacle(data, bounds, id, x, z, baseY, width, height, depth, color, yaw, type);
}

function addMetroObstacle(data, bounds, id, x, z, baseY, width, height, depth, color, yaw, type) {
  addTransportTrafficObstacle(
    data,
    bounds,
    createTrafficObstacle(id, x, z, baseY, width, height, depth, color, yaw, { type })
  );
}

function addBusTerminal(data, bounds, chunkX, chunkZ) {
  const terminal = addTransportRectRoad(
    data,
    'city-bus-terminal',
    'bus-terminal-parking',
    ROAD_TYPES.parking,
    CITY_BUS_TERMINAL.x,
    CITY_BUS_TERMINAL.z,
    172,
    96,
    {
      axis: 'parking',
      side: 'bus-terminal',
      marked: false
    },
    bounds,
    chunkX,
    chunkZ
  );

  if (terminal) {
    data.parkingMarks.push(...createParkingMarks(terminal));
  }

  addTransportRectRoad(
    data,
    'city-bus-terminal-access',
    'parking-connector',
    ROAD_TYPES.groundRoad,
    CITY_BUS_TERMINAL.x + 112,
    CITY_BUS_TERMINAL.z,
    86,
    12,
    {
      axis: 'x',
      side: 'bus-terminal',
      marked: true
    },
    bounds,
    chunkX,
    chunkZ
  );

  for (let index = -2; index <= 2; index += 1) {
    const bayZ = CITY_BUS_TERMINAL.z + index * 16;

    addTransportFlatRect(
      data,
      bounds,
      `city-bus-terminal-bay-${index}`,
      CITY_BUS_TERMINAL.x - 18,
      bayZ,
      72,
      3.2,
      '#f2d486',
      0
    );

    if (isInsideChunk(CITY_BUS_TERMINAL.x - 46, bayZ, bounds)) {
      data.trafficVehicles.push(createTrafficVehicle(
        `city-bus-terminal-parked-${index}-${chunkX}-${chunkZ}`,
        CITY_BUS_TERMINAL.x - 50,
        bayZ,
        CITY_BUS_TERMINAL.x - 18,
        bayZ,
        GROUND_DRIVE_Y + 0.08,
        2.7,
        2.15,
        10.8,
        CITY_BUS_ROUTES[index + 2]?.color ?? '#d1bb78',
        0,
        0.22,
        {
          vehicleType: 'bus',
          routeId: CITY_BUS_ROUTES[index + 2]?.id ?? 'B',
          roadKind: 'bus-terminal-parking',
          roadType: ROAD_TYPES.parking
        }
      ));
    }
  }

  addTransportRoadSign(data, bounds, {
    id: `city-bus-terminal-sign-${chunkX}-${chunkZ}`,
    text: 'BUS\nTERMINAL',
    position: [CITY_BUS_TERMINAL.x + 22, GROUND_DRIVE_Y + 3.8, CITY_BUS_TERMINAL.z - 62],
    rotation: [0, 0, 0],
    scale: [8.8, 2.5, 0.28],
    color: '#75b7d8'
  });
}

function addBusRouteStops(data, bounds, route, clearanceRoads = []) {
  route.stops.forEach((stop, index) => {
    const tangent = getTransitStopTangent(route, index);
    const normal = { x: -tangent.z, z: tangent.x };
    const yaw = Math.atan2(tangent.x, tangent.z);
    const preferredSide = TRAFFIC_DRIVE_SIDE === 'left' ? 1 : -1;
    const placement = getBusStopRoadsidePlacement(stop, normal, preferredSide, clearanceRoads);
    const stopSide = placement.side;
    const bayX = stop.x + normal.x * stopSide * BUS_STOP_BAY_OFFSET;
    const bayZ = stop.z + normal.z * stopSide * BUS_STOP_BAY_OFFSET;
    const shelterX = placement.x;
    const shelterZ = placement.z;
    const signX = stop.x + normal.x * stopSide * Math.max(BUS_STOP_SIGN_OFFSET, placement.offset + 2.2);
    const signZ = stop.z + normal.z * stopSide * Math.max(BUS_STOP_SIGN_OFFSET, placement.offset + 2.2);

    if (!isInsideChunk(stop.x, stop.z, bounds) && !isInsideChunk(shelterX, shelterZ, bounds)) return;

    addTransportFlatRect(data, bounds, `bus-stop-mark-${route.id}-${index}`, bayX, bayZ, 18, 2.9, route.color, yaw);
    addTransportTrafficObstacle(data, bounds, createTrafficObstacle(
      `bus-stop-shelter-roof-${route.id}-${index}`,
      shelterX,
      shelterZ,
      GROUND_DRIVE_Y + 2.3,
      5.8,
      0.28,
      2.6,
      '#5f7580',
      yaw,
      { type: 'busStopShelter' }
    ));
    addTransportTrafficObstacle(data, bounds, createTrafficObstacle(
      `bus-stop-bench-${route.id}-${index}`,
      shelterX - normal.x * stopSide * 0.55,
      shelterZ - normal.z * stopSide * 0.55,
      GROUND_DRIVE_Y + 0.18,
      3.4,
      0.36,
      0.52,
      '#c28f69',
      yaw,
      { type: 'busStopBench' }
    ));
    addTransportTrafficObstacle(data, bounds, createTrafficObstacle(
      `bus-stop-pole-${route.id}-${index}`,
      signX,
      signZ,
      GROUND_DRIVE_Y,
      0.18,
      2.8,
      0.18,
      '#ddd6c8',
      yaw,
      { type: 'busStopPole' }
    ));
    addTransportRoadSign(data, bounds, {
      id: `bus-stop-sign-${route.id}-${index}`,
      text: `${route.id}\nBUS`,
      position: [signX, GROUND_DRIVE_Y + 3.1, signZ],
      rotation: [0, yaw, 0],
      scale: [4.4, 1.7, 0.24],
      color: route.color
    });
  });
}

function getBusStopRoadsidePlacement(stop, normal, preferredSide, clearanceRoads = []) {
  const offsets = [BUS_STOP_ROADSIDE_OFFSET, 19.2, 24.8, 31.5, 38];
  const sides = [preferredSide, -preferredSide];

  for (const side of sides) {
    for (const offset of offsets) {
      const x = stop.x + normal.x * side * offset;
      const z = stop.z + normal.z * side * offset;
      if (isPointOnAnyRoadSurface(x, z, clearanceRoads, 1.4)) continue;

      return { offset, side, x, z };
    }
  }

  const fallbackOffset = offsets[offsets.length - 1];
  return {
    offset: fallbackOffset,
    side: preferredSide,
    x: stop.x + normal.x * preferredSide * fallbackOffset,
    z: stop.z + normal.z * preferredSide * fallbackOffset
  };
}

function addBusRouteVehicles(data, bounds, route, chunkX, chunkZ) {
  const path = createTransitRoutePath(route);
  const routeStopsInChunk = route.stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => isInsideChunk(stop.x, stop.z, bounds));

  for (const { stop, index } of routeStopsInChunk) {
    const offset = positiveModulo(
      getTransitStopProgress(route, index) - 0.018 + hashNumber(chunkX, chunkZ, 1700 + index) * 0.026,
      1
    );

    data.trafficVehicles.push(createTrafficVehicle(
      `bus-route-${route.id}-${chunkX}-${chunkZ}-${index}`,
      route.points[0].x,
      route.points[0].z,
      route.points[route.points.length - 1].x,
      route.points[route.points.length - 1].z,
      GROUND_DRIVE_Y + 0.08,
      2.75,
      2.18,
      11.2,
      route.color,
      0.022 + hashNumber(chunkX, chunkZ, 1710 + index) * 0.004,
      offset,
      {
        behavior: 'bus-route',
        driveSide: TRAFFIC_DRIVE_SIDE,
        loopMode: 'loop',
        path,
        pathKey: `bus-${route.id}`,
        roadKind: 'bus-route',
        roadType: ROAD_TYPES.mainRoad,
        routeId: route.id,
        slowZones: getTransitRouteSlowZones(route),
        vehicleType: 'bus'
      }
    ));
  }
}

function createTransitRoutePath(route) {
  const laneOffset = TRAFFIC_DRIVE_SIDE === 'left'
    ? TRAFFIC_LEFT_LANE_OFFSET
    : -TRAFFIC_LEFT_LANE_OFFSET;
  const points = offsetTrafficPathPoints(
    route.points.map((point) => ({ x: point.x, y: GROUND_DRIVE_Y + 0.08, z: point.z })),
    laneOffset
  );

  return {
    pathType: 'bus-route',
    routeId: route.id,
    startX: points[0].x,
    startZ: points[0].z,
    endX: points[points.length - 1].x,
    endZ: points[points.length - 1].z,
    points
  };
}

function getTransitRouteSlowZones(route) {
  return route.stops.map((stop, index) => ({
    kind: 'transitStop',
    t: getTransitStopProgress(route, index),
    radius: 0.036,
    intensity: 1,
    dwellSeconds: 3.15,
    cycleSeconds: 9.25,
    phaseOffset: index * 1.7
  }));
}

function getTransitStopProgress(route, stopIndex) {
  if (stopIndex <= 0) return 0.02;
  return getTrafficPathProgressBeforePoint(route.points, stopIndex, 0);
}

function getTransitStopTangent(route, stopIndex) {
  const current = route.points[stopIndex] ?? route.points[0];
  const next = route.points[Math.min(route.points.length - 1, stopIndex + 1)];
  const previous = route.points[Math.max(0, stopIndex - 1)];
  const target = next && next !== current ? next : previous;

  return normalizeVector({
    x: (target?.x ?? current.x + 1) - current.x,
    z: (target?.z ?? current.z) - current.z
  });
}

function addTaxiStand(data, bounds, stand, chunkX, chunkZ) {
  if (!isInsideChunk(stand.x, stand.z, bounds)) return;

  const yaw = hashNumber(chunkX, chunkZ, 1727) > 0.5 ? 0 : Math.PI / 2;

  addTransportFlatRect(data, bounds, `taxi-stand-mark-${stand.id}`, stand.x, stand.z, 20, 4.6, '#f2d486', yaw);
  addTransportRoadSign(data, bounds, {
    id: `taxi-stand-sign-${stand.id}`,
    text: 'TAXI\nPICKUP',
    position: [stand.x + Math.sin(yaw) * 8, GROUND_DRIVE_Y + 3.3, stand.z + Math.cos(yaw) * 8],
    rotation: [0, yaw, 0],
    scale: [5.6, 1.9, 0.24],
    color: '#f2d486'
  });
  addTransportTrafficObstacle(data, bounds, createTrafficObstacle(
    `taxi-stand-passenger-${stand.id}`,
    stand.x - Math.sin(yaw) * 6.4,
    stand.z - Math.cos(yaw) * 6.4,
    GROUND_DRIVE_Y,
    0.52,
    1.55,
    0.52,
    '#d9d3ff',
    yaw,
    { type: 'taxiPassengerMarker' }
  ));

  data.trafficVehicles.push(createTrafficVehicle(
    `taxi-stand-waiting-${stand.id}-${chunkX}-${chunkZ}`,
    stand.x - Math.sin(yaw) * 7,
    stand.z - Math.cos(yaw) * 7,
    stand.x + Math.sin(yaw) * 4,
    stand.z + Math.cos(yaw) * 4,
    GROUND_DRIVE_Y + 0.06,
    2.25,
    1.12,
    4.35,
    '#f2d486',
    0,
    0.22,
    {
      behavior: 'taxi-waiting',
      roadKind: 'taxi-stand',
      roadType: ROAD_TYPES.groundRoad,
      vehicleType: 'taxi'
    }
  ));
}

function extractTransportHighwayCrossingRoads(roads, roadColliders, bounds = null) {
  const crossingRoads = [];
  const removeIds = new Set();
  const candidates = [];

  for (const road of roads) {
    if (!shouldRemoveForTransportHighwayConflict(road)) continue;

    const crossing = getTransportHighwayCrossing(road);

    if (!crossing || !shouldCreateTransportOverpassForRoad(road)) continue;
    if (bounds && !isOwnedTransportOverpassCrossing(crossing.crossing, bounds)) continue;

    candidates.push({ road, crossing });
    removeIds.add(road.id);
  }

  const selectedAvoidances = selectTransportAvoidanceCrossings(candidates);

  for (const { avoidanceType, road, crossing } of selectedAvoidances) {
    crossingRoads.push({
      ...road,
      transportAvoidanceType: avoidanceType,
      transportCrossing: crossing
    });
  }

  if (removeIds.size === 0) return crossingRoads;

  const avoidanceCorridors = selectedAvoidances
    .map(createTransportAvoidanceTrimCorridor)
    .filter(Boolean);
  const nextRoads = [];

  for (const road of roads) {
    if (removeIds.has(road.id)) continue;
    nextRoads.push(...splitRoadAroundTransportAvoidanceCorridors(road, avoidanceCorridors));
  }

  roads.splice(0, roads.length, ...nextRoads);
  roadColliders.splice(0, roadColliders.length, ...roads.map(createRoadCollider));

  return crossingRoads;
}

function createTransportAvoidanceTrimCorridor(selection) {
  const crossingData = selection?.crossing;
  const line = crossingData?.line;
  const crossing = crossingData?.crossing;
  const road = selection?.road;
  if (!line || !crossing || !road) return null;

  const sourceLength = getPlanarLineLength(line);
  if (sourceLength <= 0.001) return null;

  const crossingDistance = getTransportSourceCrossingDistance(line, crossing, sourceLength);
  const roadWidth = getRoadCrossWidth(road);
  const halfLength = selection.avoidanceType === 'bridge'
    ? Math.max(TRANSPORT_OVERPASS_DECK_HALF_LENGTH, TRANSPORT_HIGHWAY.width * 0.72) + TRANSPORT_OVERPASS_RAMP_LENGTH + TRANSPORT_STRUCTURE_CONNECTOR_LENGTH
    : Math.max(TRANSPORT_UNDERPASS_TUNNEL_HALF_LENGTH, TRANSPORT_HIGHWAY.width * 0.74) + TRANSPORT_UNDERPASS_RAMP_LENGTH + TRANSPORT_STRUCTURE_CONNECTOR_LENGTH;
  const replacementLine = extendLine(
    line,
    Math.max(0, halfLength - crossingDistance),
    Math.max(0, halfLength - (sourceLength - crossingDistance))
  );
  const axis = Math.abs(replacementLine.end.x - replacementLine.start.x) >= Math.abs(replacementLine.end.z - replacementLine.start.z)
    ? 'x'
    : 'z';

  return {
    axis,
    max: axis === 'x'
      ? Math.max(replacementLine.start.x, replacementLine.end.x)
      : Math.max(replacementLine.start.z, replacementLine.end.z),
    min: axis === 'x'
      ? Math.min(replacementLine.start.x, replacementLine.end.x)
      : Math.min(replacementLine.start.z, replacementLine.end.z),
    cross: axis === 'x'
      ? (replacementLine.start.z + replacementLine.end.z) / 2
      : (replacementLine.start.x + replacementLine.end.x) / 2,
    width: roadWidth + 5.5
  };
}

function splitRoadAroundTransportAvoidanceCorridors(road, corridors) {
  if (!shouldTrimRoadForTransportAvoidance(road)) return [road];

  let pieces = [road];

  for (const corridor of corridors) {
    pieces = pieces.flatMap((piece) => splitAxisRoadAroundTransportAvoidanceCorridor(piece, corridor));
  }

  return pieces;
}

function shouldTrimRoadForTransportAvoidance(road) {
  if (!road || road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.highway) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;

  return road.axis === 'x' || road.axis === 'z';
}

function splitAxisRoadAroundTransportAvoidanceCorridor(road, corridor) {
  if (!corridor || road.axis !== corridor.axis) return [road];

  if (road.axis === 'x') {
    const roadHalfWidth = (road.depth ?? getRoadCrossWidth(road)) / 2;
    if (Math.abs((road.centerZ ?? 0) - corridor.cross) > roadHalfWidth + corridor.width / 2) return [road];
    return createTrimmedAxisRoadPieces(road, corridor.min, corridor.max, 'x');
  }

  const roadHalfWidth = (road.width ?? getRoadCrossWidth(road)) / 2;
  if (Math.abs((road.centerX ?? 0) - corridor.cross) > roadHalfWidth + corridor.width / 2) return [road];
  return createTrimmedAxisRoadPieces(road, corridor.min, corridor.max, 'z');
}

function createTrimmedAxisRoadPieces(road, cutMin, cutMax, axis) {
  const min = axis === 'x' ? road.minX : road.minZ;
  const max = axis === 'x' ? road.maxX : road.maxZ;
  const overlapMin = clamp(cutMin, min, max);
  const overlapMax = clamp(cutMax, min, max);

  if (overlapMax - overlapMin <= 0.5) return [road];

  const pieces = [];
  addTrimmedAxisRoadPiece(pieces, road, min, overlapMin, axis, 'before');
  addTrimmedAxisRoadPiece(pieces, road, overlapMax, max, axis, 'after');

  return pieces.length > 0 ? pieces : [];
}

function addTrimmedAxisRoadPiece(pieces, road, min, max, axis, suffix) {
  const length = max - min;
  if (length <= 8) return;

  const center = (min + max) / 2;
  const piece = axis === 'x'
    ? createRoadSurface(
        `${road.id}-trim-${suffix}`,
        road.kind,
        center,
        road.centerZ,
        length,
        road.depth,
        { axis: 'x', side: road.side, marked: road.marked, roadType: road.roadType }
      )
    : createRoadSurface(
        `${road.id}-trim-${suffix}`,
        road.kind,
        road.centerX,
        center,
        road.width,
        length,
        { axis: 'z', side: road.side, marked: road.marked, roadType: road.roadType }
      );

  if (piece) pieces.push(piece);
}

function selectTransportAvoidanceCrossings(candidates) {
  const uniqueCandidates = [];
  const usedRoadIds = new Set();

  for (const candidate of candidates) {
    const roadId = candidate?.road?.id;
    const crossingPoint = getTransportCrossingPoint(candidate);

    if (!roadId || usedRoadIds.has(roadId) || !Number.isFinite(crossingPoint?.u)) continue;

    usedRoadIds.add(roadId);
    uniqueCandidates.push(candidate);
  }

  const sortedCandidates = uniqueCandidates.sort((a, b) => (
    (getTransportCrossingPoint(a)?.u ?? 0) - (getTransportCrossingPoint(b)?.u ?? 0) ||
    getTransportOverpassCandidatePriority(b.road) - getTransportOverpassCandidatePriority(a.road) ||
    String(a.road.id).localeCompare(String(b.road.id))
  ));
  const targetTunnel = pickTransportTargetCandidate(sortedCandidates, TRANSPORT_TUNNEL_TARGET_U);
  const targetBridge = TRANSPORT_MAX_SELECTED_BRIDGES > 0
    ? pickTransportTargetCandidate(sortedCandidates, TRANSPORT_BRIDGE_TARGET_U, {
        bridgeOnly: true,
        excludedRoadId: targetTunnel?.road?.id
      })
    : null;

  return sortedCandidates.map((candidate, index) => ({
    ...candidate,
    avoidanceType: getTransportAvoidanceTypeForCandidate(candidate, index, targetBridge, targetTunnel)
  }));
}

function pickTransportTargetCandidate(candidates, targetU, options = {}) {
  return candidates
    .filter((candidate) => {
      const crossingPoint = getTransportCrossingPoint(candidate);
      if (!crossingPoint || !Number.isFinite(crossingPoint.u)) return false;
      if (options.excludedRoadId && candidate.road.id === options.excludedRoadId) return false;

      return !options.bridgeOnly ||
        !crossingPoint.overlap &&
        getTransportOverpassCandidatePriority(candidate.road) >= 3;
    })
    .sort((a, b) => (
      getTransportAvoidanceCandidateScore(a, targetU) -
      getTransportAvoidanceCandidateScore(b, targetU) ||
      String(a.road.id).localeCompare(String(b.road.id))
    ))[0] ?? null;
}

function getTransportAvoidanceTypeForCandidate(candidate, index, targetBridge, targetTunnel) {
  if (TRANSPORT_MAX_SELECTED_BRIDGES <= 0) return 'tunnel';
  if (targetBridge && candidate.road.id === targetBridge.road.id) return 'bridge';
  if (targetTunnel && candidate.road.id === targetTunnel.road.id) return 'tunnel';

  const crossingPoint = getTransportCrossingPoint(candidate);
  const priority = getTransportOverpassCandidatePriority(candidate.road);
  const bridgeEligible = crossingPoint &&
    !crossingPoint.overlap &&
    priority >= 3;
  const bridgeCadence = priority >= 4 ? index % 3 === 0 : index % 5 === 0;

  return bridgeEligible && bridgeCadence ? 'bridge' : 'tunnel';
}

function getTransportAvoidanceCandidateScore(candidate, targetU) {
  const priority = getTransportOverpassCandidatePriority(candidate.road);
  const width = getRoadCrossWidth(candidate.road);
  const crossing = getTransportCrossingPoint(candidate);
  const uDistance = Math.abs((crossing?.u ?? 0.5) - targetU);

  return uDistance * 100 - priority * 1.6 - Math.min(width, 18) * 0.08;
}

function getTransportCrossingPoint(candidate) {
  return candidate?.crossing?.crossing ?? candidate?.crossing ?? null;
}

function shouldRemoveForTransportHighwayConflict(road) {
  if (!road || road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.highway) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;

  return Boolean(getTransportHighwayCrossing(road));
}

function getTransportHighwayCrossing(road) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const line = getRoadCenterline(road);
  if (!line) return null;

  const crossing = getLineSegmentIntersection(line.start, line.end, highwayStart, highwayEnd);
  if (crossing) return { line, crossing };

  const extendedCrossing = getTransportHighwayExtendedCrossing(road, line, highwayStart, highwayEnd);
  if (extendedCrossing) return { line, crossing: extendedCrossing };

  return null;
}

function getTransportHighwayExtendedCrossing(road, line, highwayStart, highwayEnd) {
  if (road?.kind === 'local-grid') return null;

  const roadVector = {
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  };
  const highwayVector = {
    x: highwayEnd.x - highwayStart.x,
    z: highwayEnd.z - highwayStart.z
  };
  const roadLength = Math.hypot(roadVector.x, roadVector.z);
  const highwayLength = Math.hypot(highwayVector.x, highwayVector.z);
  if (roadLength <= 0.001 || highwayLength <= 0.001) return null;

  const roadTangent = { x: roadVector.x / roadLength, z: roadVector.z / roadLength };
  const highwayTangent = { x: highwayVector.x / highwayLength, z: highwayVector.z / highwayLength };
  const parallelAmount = Math.abs(roadTangent.x * highwayTangent.x + roadTangent.z * highwayTangent.z);
  if (parallelAmount > 0.9) return null;

  const denominator = roadVector.x * highwayVector.z - roadVector.z * highwayVector.x;
  if (Math.abs(denominator) <= 0.000001) return null;

  const cx = highwayStart.x - line.start.x;
  const cz = highwayStart.z - line.start.z;
  const t = (cx * highwayVector.z - cz * highwayVector.x) / denominator;
  const u = (cx * roadVector.z - cz * roadVector.x) / denominator;
  if (u < 0 || u > 1 || (t >= 0 && t <= 1)) return null;

  const extensionDistance = (t < 0 ? -t : t - 1) * roadLength;
  const roadHalfWidth = getRoadCrossWidth(road) / 2;
  const extensionLimit = Math.max(
    TRANSPORT_HIGHWAY.width * 3.2,
    TRANSPORT_HIGHWAY.width / 2 + roadHalfWidth + 118
  );
  if (extensionDistance > extensionLimit) return null;

  const closest = getClosestSegmentApproach(line.start, line.end, highwayStart, highwayEnd);
  const clearance = TRANSPORT_HIGHWAY.width / 2 + roadHalfWidth + 5;
  if (!closest || closest.distanceSq > Math.max(clearance * clearance, extensionLimit * extensionLimit)) return null;

  return {
    x: line.start.x + roadVector.x * t,
    z: line.start.z + roadVector.z * t,
    overlap: true,
    t,
    u,
    virtualT: t
  };
}

function getTransportSourceCrossingDistance(line, crossing, sourceLength = null) {
  const length = sourceLength ?? getPlanarLineLength(line);
  const rawT = Number.isFinite(crossing?.virtualT)
    ? crossing.virtualT
    : crossing?.t;

  if (!Number.isFinite(rawT) || length <= 0.001) {
    return length * 0.5;
  }

  if (crossing?.overlap && Number.isFinite(crossing.virtualT)) {
    return rawT * length;
  }

  return clamp(rawT * length, 0, length);
}

function doesRoadOverlapTransportHighwayCorridor(road) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const line = getRoadCenterline(road);
  const roadHalfWidth = getRoadCrossWidth(road) / 2;
  const clearance = TRANSPORT_HIGHWAY.width / 2 + roadHalfWidth + 3;

  if (line) {
    return getSegmentDistanceSq(line.start, line.end, highwayStart, highwayEnd) <= clearance * clearance;
  }

  const points = getRoadBoxSamplePoints(road);

  return points.some((point) => (
    getPointToSegmentDistanceSq(point, highwayStart, highwayEnd) <= clearance * clearance
  ));
}

function getRoadBoxSamplePoints(road) {
  const minX = road.minX ?? road.centerX - road.width / 2;
  const maxX = road.maxX ?? road.centerX + road.width / 2;
  const minZ = road.minZ ?? road.centerZ - road.depth / 2;
  const maxZ = road.maxZ ?? road.centerZ + road.depth / 2;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return [
    { x: centerX, z: centerZ },
    { x: minX, z: minZ },
    { x: minX, z: maxZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: centerX, z: minZ },
    { x: centerX, z: maxZ },
    { x: minX, z: centerZ },
    { x: maxX, z: centerZ }
  ];
}

function removeParkingNearFastRoads(roads, roadColliders, parkingMarks) {
  const fastRoads = roads.filter((road) => isFastRoadObstacleClearanceRoad(road));
  if (fastRoads.length === 0) return;

  const removeIds = new Set();

  for (const road of roads) {
    if (!isParkingObstacleRoad(road)) continue;
    if (isProtectedParkingRoad(road)) continue;

    if (fastRoads.some((fastRoad) => isRoadTooCloseToFastRoad(road, fastRoad))) {
      removeIds.add(road.id);
    }
  }

  if (removeIds.size === 0) return;

  for (let index = roads.length - 1; index >= 0; index -= 1) {
    if (removeIds.has(roads[index].id)) {
      roads.splice(index, 1);
    }
  }

  for (let index = roadColliders.length - 1; index >= 0; index -= 1) {
    if (removeIds.has(roadColliders[index].id)) {
      roadColliders.splice(index, 1);
    }
  }

  for (let index = parkingMarks.length - 1; index >= 0; index -= 1) {
    const markId = parkingMarks[index]?.id ?? '';

    if ([...removeIds].some((id) => markId.startsWith(`${id}-`))) {
      parkingMarks.splice(index, 1);
    }
  }
}

function removeParkingOverlappingRoads(roads, roadColliders, parkingMarks) {
  const removeIds = new Set();

  for (const road of roads) {
    if (road?.roadType !== ROAD_TYPES.parking) continue;
    if (isProtectedParkingRoad(road)) continue;

    const box = createLooseBox(road.centerX, road.centerZ, road.width, road.depth, 3);
    const overlapsRoad = roads.some((otherRoad) => (
      otherRoad !== road &&
      otherRoad?.roadType !== ROAD_TYPES.parking &&
      !isExpresswayRoadType(otherRoad?.roadType) &&
      !isParkingOverlapAllowed(road, otherRoad) &&
      doesBoxOverlapRoadSurface(box, otherRoad)
    ));

    if (overlapsRoad) {
      removeIds.add(road.id);
    }
  }

  if (removeIds.size === 0) return;

  for (let index = roads.length - 1; index >= 0; index -= 1) {
    const road = roads[index];
    if (removeIds.has(road.id)) {
      roads.splice(index, 1);
    }
  }

  for (let index = roadColliders.length - 1; index >= 0; index -= 1) {
    const collider = roadColliders[index];
    if (removeIds.has(collider.id)) {
      roadColliders.splice(index, 1);
    }
  }

  removeParkingConnectorsWithoutLots(roads, roadColliders);

  for (let index = parkingMarks.length - 1; index >= 0; index -= 1) {
    const markId = parkingMarks[index]?.id ?? '';
    if ([...removeIds].some((id) => markId.startsWith(`${id}-`))) {
      parkingMarks.splice(index, 1);
    }
  }
}

function isProtectedParkingRoad(road) {
  return road?.id === 'showcase-spawn-parking' ||
    road?.kind === 'office-parking' ||
    road?.kind === 'residential-parking' ||
    road?.kind === 'hotel-shuttle-parking' ||
    road?.kind === 'truck-yard-parking' ||
    road?.kind === 'bus-terminal-parking';
}

function removeParkingConnectorsWithoutLots(roads, roadColliders) {
  const parkingRoads = roads.filter((road) => road?.roadType === ROAD_TYPES.parking);
  const removeIds = new Set();

  for (const road of roads) {
    if (road?.kind !== 'parking-connector') continue;

    const touchesParking = parkingRoads.some((parkingRoad) => doRoadsHorizontallyOverlap(road, parkingRoad, 4));
    if (!touchesParking) removeIds.add(road.id);
  }

  if (removeIds.size === 0) return;

  for (let index = roads.length - 1; index >= 0; index -= 1) {
    if (removeIds.has(roads[index].id)) roads.splice(index, 1);
  }

  for (let index = roadColliders.length - 1; index >= 0; index -= 1) {
    if (removeIds.has(roadColliders[index].id)) roadColliders.splice(index, 1);
  }
}

function removeParkingLotsWithoutAccess(roads, roadColliders, parkingMarks) {
  const removeIds = new Set();

  for (const road of roads) {
    if (road?.roadType !== ROAD_TYPES.parking) continue;
    if (isParkingLotAccessible(road, roads)) continue;

    removeIds.add(road.id);
    for (const otherRoad of roads) {
      if (otherRoad === road) continue;
      if (String(otherRoad.id ?? '').startsWith(`${road.id}-internal`)) removeIds.add(otherRoad.id);
      if (String(otherRoad.id ?? '').startsWith(`${road.id}-hotel-dropoff`)) removeIds.add(otherRoad.id);
    }
  }

  if (removeIds.size === 0) return;

  removeRoadsById(roads, roadColliders, parkingMarks, removeIds);
}

function isParkingLotAccessible(parkingRoad, roads) {
  return roads.some((road) => {
    if (road === parkingRoad) return false;
    if (road.roadType === ROAD_TYPES.parking) return false;
    if (String(road.kind ?? '').includes('internal-road')) return false;
    if (road.kind === 'hotel-dropoff-lane') return false;
    if (road.kind !== 'parking-connector' && road.id !== 'showcase-parking-driveway') return false;

    return doRoadsHorizontallyOverlap(parkingRoad, road, 4);
  });
}

function isParkingOverlapAllowed(parkingRoad, otherRoad) {
  if (!isProtectedParkingRoad(parkingRoad)) return false;
  if (otherRoad?.id === 'showcase-parking-driveway') return true;
  if (otherRoad?.kind === 'parking-connector') return true;
  if (typeof otherRoad?.kind === 'string' && otherRoad.kind.includes('internal-road')) return true;
  if (otherRoad?.kind === 'hotel-dropoff-lane') return true;
  return false;
}

function removeUnusedRoadFragments(roads, roadColliders, parkingMarks, bounds) {
  const removeIds = new Set();

  for (const road of roads) {
    if (!isPrunableRoadFragment(road)) continue;

    const length = getRoadFragmentLength(road);
    if (length < 20) {
      removeIds.add(road.id);
      continue;
    }

    if (isIsolatedInteriorRoadFragment(road, roads, bounds)) {
      removeIds.add(road.id);
    }
  }

  if (removeIds.size > 0) {
    removeRoadsById(roads, roadColliders, parkingMarks, removeIds);
  }
}

function isPrunableRoadFragment(road) {
  if (!road?.id || !road.marked) return false;
  if (road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.highway) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (isTransportHubLocalRoad(road)) return false;
  if (isFastRoadSurfaceConnectorRoad(road)) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;
  if (isFastRoadSurfaceConnectorRoad(road) || road.kind === 'showcase') return false;

  return road.kind === 'local-grid' ||
    road.kind === 'parking-connector' ||
    String(road.id).includes('-trim-');
}

function getRoadFragmentLength(road) {
  const line = getRoadCenterline(road);
  if (line) return getPlanarLineLength(line);
  return Math.max(road.width ?? 0, road.depth ?? 0);
}

function isIsolatedInteriorRoadFragment(road, roads, bounds) {
  const line = getRoadCenterline(road);
  if (!line) return false;
  if (doesRoadFragmentTouchChunkEdge(line, bounds)) return false;

  return !roads.some((otherRoad) => (
    otherRoad !== road &&
    isRoadFragmentConnectionTarget(otherRoad, road) &&
    doRoadsHorizontallyOverlap(road, otherRoad, 3)
  ));
}

function doesRoadFragmentTouchChunkEdge(line, bounds) {
  if (!bounds) return false;
  const edgeMargin = 6;

  return [line.start, line.end].some((point) => (
    Math.abs(point.x - bounds.minX) <= edgeMargin ||
    Math.abs(point.x - bounds.maxX) <= edgeMargin ||
    Math.abs(point.z - bounds.minZ) <= edgeMargin ||
    Math.abs(point.z - bounds.maxZ) <= edgeMargin
  ));
}

function isRoadFragmentConnectionTarget(road, sourceRoad = null) {
  if (road?.roadType === ROAD_TYPES.parking) {
    return sourceRoad?.kind === 'parking-connector';
  }

  if (!road?.marked) return false;
  return true;
}

function removeResidualTransportHighwayGroundConflicts(
  roads,
  roadColliders,
  parkingMarks,
  roundabouts = [],
  roundaboutColliders = []
) {
  const removeIds = new Set();

  for (const road of roads) {
    if (isResidualTransportHighwayGroundConflict(road)) {
      removeIds.add(road.id);
    }
  }

  if (removeIds.size > 0) {
    removeRoadsById(roads, roadColliders, parkingMarks, removeIds);
  }

  for (let index = roundabouts.length - 1; index >= 0; index -= 1) {
    const roundabout = roundabouts[index];

    if (doesRoundaboutOverlapTransportHighwayCorridor(roundabout)) {
      const id = roundabout.id;

      roundabouts.splice(index, 1);

      for (let colliderIndex = roundaboutColliders.length - 1; colliderIndex >= 0; colliderIndex -= 1) {
        if (roundaboutColliders[colliderIndex]?.id === id) {
          roundaboutColliders.splice(colliderIndex, 1);
        }
      }
    }
  }
}

function isResidualTransportHighwayGroundConflict(road) {
  if (!road || !road.id) return false;
  if (road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.highway) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (isTransportHubLocalRoad(road)) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;

  const crossing = getTransportHighwayCrossing(road);
  if (!crossing) return false;
  if (!crossing.crossing?.overlap) return true;

  return doesRoadOverlapTransportHighwayCorridor(road);
}

function doesRoundaboutOverlapTransportHighwayCorridor(roundabout) {
  if (!roundabout?.position) return false;

  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const point = {
    x: roundabout.position[0],
    z: roundabout.position[2]
  };
  const radius = roundabout.radius ?? 0;
  const clearance = TRANSPORT_HIGHWAY.width / 2 + radius + 3;

  return getPointToSegmentDistanceSq(point, highwayStart, highwayEnd) <= clearance * clearance;
}

function removeGroundRoadsConflictingWithTransportStructures(
  roads,
  roadColliders,
  parkingMarks,
  roundabouts = [],
  roundaboutColliders = []
) {
  const structureRoads = roads.filter(isGroundClearingTransportStructureRoad);
  if (structureRoads.length === 0) return;

  const removeIds = new Set();

  for (const road of roads) {
    if (!isRemovableGroundRoadForTransportStructureConflict(road)) continue;

    const conflictsWithStructure = structureRoads.some((structureRoad) => (
      structureRoad !== road &&
      doRoadsHorizontallyOverlap(structureRoad, road, getTransportStructureClearanceMargin(structureRoad))
    ));

    if (conflictsWithStructure) {
      removeIds.add(road.id);
    }
  }

  if (removeIds.size > 0) {
    removeRoadsById(roads, roadColliders, parkingMarks, removeIds);
  }

  for (let index = roundabouts.length - 1; index >= 0; index -= 1) {
    const roundabout = roundabouts[index];

    if (!doesRoundaboutConflictWithTransportStructures(roundabout, structureRoads)) continue;

    const id = roundabout.id;
    roundabouts.splice(index, 1);

    for (let colliderIndex = roundaboutColliders.length - 1; colliderIndex >= 0; colliderIndex -= 1) {
      if (roundaboutColliders[colliderIndex]?.id === id) {
        roundaboutColliders.splice(colliderIndex, 1);
      }
    }
  }
}

function isGroundClearingTransportStructureRoad(road) {
  if (typeof road?.kind !== 'string') return false;
  return road.kind.startsWith('transport-overpass') ||
    road.kind.startsWith('transport-underpass') ||
    road.kind === 'transport-highway-ramp' ||
    road.kind === 'expressway-ramp';
}

function isRemovableGroundRoadForTransportStructureConflict(road) {
  if (!road || !road.id) return false;
  if (isGroundClearingTransportStructureRoad(road)) return false;
  if (isSurfaceTransportAvenueRoad(road)) return false;
  if (isFastRoadSurfaceConnectorRoad(road)) return false;
  if (road.kind === 'transport-highway') return false;
  if (road.kind === 'transport-highway-clearance') return false;
  if (isTransportHubLocalRoad(road)) return false;
  if (road.roadType === ROAD_TYPES.parking) return true;
  if (road.roadType === ROAD_TYPES.highway || isExpresswayRoadType(road.roadType)) return false;

  return true;
}

function getTransportStructureClearanceMargin(structureRoad) {
  if (structureRoad.kind === 'transport-underpass-tunnel' || structureRoad.kind === 'transport-overpass-deck') {
    return 14;
  }

  if (structureRoad.roadType === ROAD_TYPES.ramp) {
    return 12;
  }

  return 8;
}

function isFastRoadSurfaceConnectorRoad(road) {
  return road?.kind === 'expressway-feeder' ||
    road?.kind === 'expressway-surface-connector' ||
    road?.kind === 'transport-highway-surface-connector' ||
    road?.kind === 'airport-highway-connector' ||
    road?.kind === 'station-highway-connector';
}

function applyFastRoadTunnelOpeningVisualGaps(roads) {
  const openingRoads = roads.filter(isFastRoadTunnelOpeningRoad);
  if (openingRoads.length === 0) return;

  for (const road of roads) {
    if (!shouldApplyFastRoadTunnelOpeningVisualGap(road)) continue;

    const layout = getRoadVisualGapLayout(road);
    if (!layout) continue;

    const gaps = [];

    for (const openingRoad of openingRoads) {
      const gap = getFastRoadTunnelOpeningGap(layout, openingRoad, road);
      if (gap) gaps.push(gap);
    }

    if (gaps.length === 0) continue;

    const existingGaps = Array.isArray(road.visualGaps) ? road.visualGaps : [];
    const merged = mergeBlockedRanges([...existingGaps, ...gaps], layout.length);
    if (merged.length === 0) continue;

    road.visualGaps = merged;
    road.visualGapReason = road.visualGapReason ?? 'fast-road-tunnel-opening';
    road.renderSlices = createRoadRenderSlicesAroundGaps(road, layout, merged);
    road.laneMarkSlices = createRoadLogicalSlicesAroundGaps(road, layout, merged, 'lane-slice');
    road.detailSlices = road.laneMarkSlices;
    road.driveSurfaceSlices = road.laneMarkSlices
      .map((slice) => slice.surface)
      .filter(Boolean);
  }
}

function isFastRoadTunnelOpeningRoad(road) {
  if (!road || (road.kind !== 'transport-highway-ramp' && road.kind !== 'expressway-ramp')) return false;

  const range = getRoadYRange(road);
  const coveredTunnelY = GROUND_DRIVE_Y - FAST_ROAD_TUNNEL_BOX_CLEARANCE - 0.64;
  if (range.maxY < coveredTunnelY) return false;
  if (range.minY > GROUND_DRIVE_Y + 0.8) return false;

  return Boolean(getRoadCenterline(road));
}

function shouldApplyFastRoadTunnelOpeningVisualGap(road) {
  if (!road || isFastRoadTunnelOpeningRoad(road) || isSurfaceTunnelAccessRoad(road)) return false;
  if (!road.marked && road.kind !== 'road-edge-seam') return false;
  if (road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.ramp) return false;

  const range = getRoadYRange(road);
  if (range.minY < GROUND_DRIVE_Y - 0.6 || range.maxY > GROUND_DRIVE_Y + 0.9) return false;

  if (typeof road.kind === 'string' && (
    road.kind === 'expressway-tunnel' ||
    road.kind === 'transport-highway' ||
    road.kind.startsWith('transport-underpass') ||
    road.kind.startsWith('transport-overpass') ||
    road.kind.startsWith('surface-avenue-tunnel')
  )) {
    return false;
  }

  return Boolean(getRoadCenterline(road));
}

function applySurfaceTunnelAccessVisualGaps(roads, roadColliders = []) {
  const accessRoads = roads.filter(isSurfaceTunnelAccessRoad);
  if (accessRoads.length === 0) return;

  const originalRoads = [...roads];
  const bypassRoads = [];

  for (const road of originalRoads) {
    if (!shouldApplySurfaceTunnelAccessVisualGap(road)) continue;

    const layout = getRoadVisualGapLayout(road);
    if (!layout) continue;

    const gaps = [];

    for (const accessRoad of accessRoads) {
      const gap = getSurfaceTunnelAccessRoadGap(layout, accessRoad);
      if (gap) gaps.push(gap);
    }

    if (gaps.length === 0) continue;

    const merged = mergeBlockedRanges(gaps, layout.length);

    if (isSurfaceTransportAvenueRoad(road)) {
      road.visualGaps = merged;
      road.renderSlices = createRoadRenderSlicesAroundGaps(road, layout, merged);
      bypassRoads.push(...createSurfaceAvenueTunnelBypassRoads(road, layout, merged));
      continue;
    }

    road.visualGaps = merged;
    road.renderSlices = createRoadRenderSlicesAroundGaps(road, layout, merged);
  }

  if (bypassRoads.length === 0) return;

  for (const road of bypassRoads) {
    if (!road) continue;

    roads.push(road);
    roadColliders.push(createRoadCollider(road));
  }
}

function createSurfaceAvenueTunnelBypassRoads(road, layout, gaps) {
  const roads = [];
  const width = getRoadCrossWidth(road);
  const y = road.position?.[1] ?? GROUND_DRIVE_Y;
  const normal = { x: -layout.tangent.z, z: layout.tangent.x };
  const bypassSide = -1;
  const bypassOffset = bypassSide * (width / 2 + TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 12);
  const mergeLength = Math.max(58, width * 1.35);
  const clearRanges = getClearRangesAroundGaps(layout.length, gaps, 3.2);

  for (let index = 0; index < clearRanges.length; index += 1) {
    const range = clearRanges[index];
    const fragment = createSurfaceAvenueSegmentRoad(
      `${road.id}-clear-${index}`,
      road,
      layout,
      range.start,
      range.end,
      0,
      width,
      y
    );

    if (fragment) roads.push(fragment);
  }

  for (let index = 0; index < gaps.length; index += 1) {
    const gap = gaps[index];
    const gapStart = clamp(gap.start, 0, layout.length);
    const gapEnd = clamp(gap.end, 0, layout.length);
    if (gapEnd - gapStart < 8) continue;

    const approachStart = clamp(gapStart - mergeLength, 0, layout.length);
    const approachEnd = clamp(gapEnd + mergeLength, 0, layout.length);
    const bypassStart = clamp(gapStart + Math.min(12, (gapEnd - gapStart) * 0.22), 0, layout.length);
    const bypassEnd = clamp(gapEnd - Math.min(12, (gapEnd - gapStart) * 0.22), 0, layout.length);
    const points = [
      getSurfaceAvenueBypassPoint(layout, normal, approachStart, 0),
      getSurfaceAvenueBypassPoint(layout, normal, bypassStart, bypassOffset),
      getSurfaceAvenueBypassPoint(layout, normal, bypassEnd, bypassOffset),
      getSurfaceAvenueBypassPoint(layout, normal, approachEnd, 0)
    ];

    for (const [jointIndex, point] of points.entries()) {
      const joint = createTransportJointRoad(
        `${road.id}-right-bypass-${index}-joint-${jointIndex}`,
        'surface-avenue-bypass-joint',
        ROAD_TYPES.mainRoad,
        point,
        Math.max(13, width * 0.78),
        y + 0.02
      );

      if (joint) roads.push(joint);
    }

    for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex += 1) {
      const segment = createSegmentRoad(
        `${road.id}-right-bypass-${index}-${segmentIndex}`,
        'surface-avenue-bypass',
        ROAD_TYPES.mainRoad,
        points[segmentIndex],
        points[segmentIndex + 1],
        Math.max(12, width * 0.64),
        y + 0.025,
        {
          marked: true,
          side: 'surface-avenue-bypass'
        }
      );

      if (segment) roads.push(segment);
    }
  }

  return roads;
}

function createSurfaceAvenueSegmentRoad(id, sourceRoad, layout, startDistance, endDistance, lateral, width, y) {
  if (endDistance - startDistance < 3.2) return null;

  return createSegmentRoad(
    id,
    sourceRoad.kind,
    sourceRoad.roadType,
    getSurfaceAvenueBypassPoint(layout, { x: -layout.tangent.z, z: layout.tangent.x }, startDistance, lateral),
    getSurfaceAvenueBypassPoint(layout, { x: -layout.tangent.z, z: layout.tangent.x }, endDistance, lateral),
    width,
    y,
    {
      marked: sourceRoad.marked,
      side: sourceRoad.side
    }
  );
}

function getSurfaceAvenueBypassPoint(layout, normal, distance, lateral) {
  return {
    x: layout.line.start.x + layout.tangent.x * distance + normal.x * lateral,
    z: layout.line.start.z + layout.tangent.z * distance + normal.z * lateral
  };
}

function isSurfaceTunnelAccessRoad(road) {
  return road?.kind === 'surface-avenue-tunnel-ramp' ||
    road?.kind === 'surface-avenue-tunnel-slip' ||
    road?.kind === 'surface-avenue-tunnel-merge';
}

function getSurfaceTunnelAccessOpeningLine(accessRoad) {
  const line = getRoadCenterline(accessRoad);
  if (!line) return null;

  const length = getPlanarLineLength(line);
  if (length <= 0.5) return null;

  const width = getRoadCrossWidth(accessRoad);
  if (accessRoad.kind !== 'surface-avenue-tunnel-ramp') {
    return { line, length, width };
  }

  const visibleLength = Math.min(length, TRANSPORT_SURFACE_TUNNEL_ACCESS_PORTAL_OPENING_LENGTH);
  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const openingLine = {
    start: line.start,
    end: {
      x: line.start.x + tangent.x * visibleLength,
      z: line.start.z + tangent.z * visibleLength
    }
  };

  return {
    line: openingLine,
    length: visibleLength,
    width: width + 4
  };
}

function shouldApplySurfaceTunnelAccessVisualGap(road) {
  if (!road || isSurfaceTunnelAccessRoad(road)) return false;
  if (!isSurfaceTransportAvenueRoad(road)) return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway || isExpresswayRoadType(road.roadType)) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-highway')) return false;
  if (getRoadYRange(road).maxY > GROUND_DRIVE_Y + 0.8) return false;

  return Boolean(getRoadCenterline(road));
}

function getRoadVisualGapLayout(road) {
  const line = getRoadCenterline(road);
  if (!line) return null;

  const length = getPlanarLineLength(line);
  if (length <= 0.5) return null;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });

  return {
    crossWidth: getRoadCrossWidth(road),
    length,
    line,
    tangent
  };
}

function getSurfaceTunnelAccessRoadGap(layout, accessRoad) {
  const opening = getSurfaceTunnelAccessOpeningLine(accessRoad);
  if (!opening) return null;

  const approach = getClosestSegmentApproach(
    layout.line.start,
    layout.line.end,
    opening.line.start,
    opening.line.end
  );
  const accessWidth = opening.width;
  const clearance = layout.crossWidth / 2 + accessWidth / 2 + (accessRoad.kind === 'surface-avenue-tunnel-slip' ? 12 : 18);
  if (!approach || approach.distanceSq > clearance * clearance) return null;

  const centerDistance = clamp(approach.t, 0, 1) * layout.length;
  const gapHalfLength = Math.max(28, accessWidth + layout.crossWidth * 0.75 + (accessRoad.kind === 'surface-avenue-tunnel-slip' ? 18 : 26));

  return {
    start: centerDistance - gapHalfLength,
    end: centerDistance + gapHalfLength
  };
}

function getFastRoadTunnelOpeningGap(layout, openingRoad, surfaceRoad) {
  const opening = getFastRoadTunnelOpeningLine(openingRoad);
  if (!opening) return null;

  const approach = getClosestSegmentApproach(
    layout.line.start,
    layout.line.end,
    opening.line.start,
    opening.line.end
  );
  const openingWidth = opening.width;
  const clearance = layout.crossWidth / 2 + openingWidth / 2 + 24;
  if (!approach || approach.distanceSq > clearance * clearance) return null;
  if (isAlignedFastRoadSurfaceConnector(surfaceRoad, layout, opening, approach)) return null;

  const alignment = Math.abs(layout.tangent.x * opening.tangent.x + layout.tangent.z * opening.tangent.z);
  if (alignment > 0.82) {
    const projectedStart = getProjectedDistanceOnRoadLayout(opening.line.start, layout);
    const projectedEnd = getProjectedDistanceOnRoadLayout(opening.line.end, layout);
    const lateralLimit = clearance + Math.max(10, openingWidth * 0.35);

    if (
      projectedStart.lateralSq <= lateralLimit * lateralLimit ||
      projectedEnd.lateralSq <= lateralLimit * lateralLimit ||
      approach.distanceSq <= lateralLimit * lateralLimit
    ) {
      const startDistance = clamp(Math.min(projectedStart.distance, projectedEnd.distance), 0, layout.length);
      const endDistance = clamp(Math.max(projectedStart.distance, projectedEnd.distance), 0, layout.length);
      const margin = Math.max(48, layout.crossWidth * 0.78 + openingWidth * 0.72 + 18);

      return {
        start: startDistance - margin,
        end: endDistance + margin
      };
    }
  }

  const centerDistance = clamp(approach.t, 0, 1) * layout.length;
  const gapHalfLength = Math.max(64, openingWidth + layout.crossWidth * 1.05 + 42);

  return {
    start: centerDistance - gapHalfLength,
    end: centerDistance + gapHalfLength
  };
}

function getFastRoadTunnelOpeningLine(openingRoad) {
  const line = getRoadCenterline(openingRoad);
  if (!line) return null;

  const length = getPlanarLineLength(line);
  if (length <= 0.5) return null;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });

  return {
    line,
    length,
    tangent,
    width: getRoadCrossWidth(openingRoad) + FAST_ROAD_RAMP_CUTOUT_EXTRA_WIDTH + 5.5
  };
}

function getProjectedDistanceOnRoadLayout(point, layout) {
  const dx = point.x - layout.line.start.x;
  const dz = point.z - layout.line.start.z;
  const distance = dx * layout.tangent.x + dz * layout.tangent.z;
  const distanceSq = dx * dx + dz * dz;
  const lateralSq = Math.max(0, distanceSq - distance * distance);

  return { distance, lateralSq };
}

function isAlignedFastRoadSurfaceConnector(road, layout, opening, approach) {
  if (!isFastRoadSurfaceConnectorRoad(road)) return false;

  const alignment = Math.abs(layout.tangent.x * opening.tangent.x + layout.tangent.z * opening.tangent.z);
  if (alignment < 0.72) return false;

  const connectorEndpoint = approach.t <= 0.14 || approach.t >= 0.86;
  const openingEndpoint = approach.u <= 0.14 || approach.u >= 0.86;

  return connectorEndpoint && openingEndpoint;
}

function createRoadRenderSlicesAroundGaps(road, layout, gaps) {
  const clearRanges = getClearRangesAroundGaps(layout.length, gaps, 3.2);

  return clearRanges.map((range, index) => createRoadRenderSlice(road, layout, range, index)).filter(Boolean);
}

function createRoadLogicalSlicesAroundGaps(road, layout, gaps, suffix) {
  const width = getRoadCrossWidth(road);
  const y = road.position?.[1] ?? GROUND_DRIVE_Y;
  const clearRanges = getClearRangesAroundGaps(layout.length, gaps, 6);

  return clearRanges
    .map((range, index) => {
      const start = getPointAlongRoadLayout(layout, range.start);
      const end = getPointAlongRoadLayout(layout, range.end);

      return createSegmentRoad(
        `${road.id}-${suffix}-${index}`,
        road.kind,
        road.roadType,
        start,
        end,
        width,
        y,
        {
          marked: road.marked,
          side: road.side,
          trafficDisabled: road.trafficDisabled
        }
      );
    })
    .filter(Boolean);
}

function getPointAlongRoadLayout(layout, distance) {
  const clampedDistance = clamp(distance, 0, layout.length);

  return {
    x: layout.line.start.x + layout.tangent.x * clampedDistance,
    z: layout.line.start.z + layout.tangent.z * clampedDistance
  };
}

function getClearRangesAroundGaps(length, gaps, minLength = 3.2) {
  const clearRanges = [];
  let cursor = 0;

  for (const gap of gaps) {
    if (gap.start - cursor >= minLength) {
      clearRanges.push({ start: cursor, end: gap.start });
    }

    cursor = Math.max(cursor, gap.end);
  }

  if (length - cursor >= minLength) {
    clearRanges.push({ start: cursor, end: length });
  }

  return clearRanges;
}

function createRoadRenderSlice(road, layout, range, index) {
  const sliceLength = Math.max(0, range.end - range.start);
  if (sliceLength <= 0.5) return null;

  const centerDistance = (range.start + range.end) / 2;
  const center = {
    x: layout.line.start.x + layout.tangent.x * centerDistance,
    z: layout.line.start.z + layout.tangent.z * centerDistance
  };
  const y = road.position?.[1] ?? GROUND_DRIVE_Y;

  if (road.axis === 'x') {
    return {
      id: `${road.id}-render-${index}`,
      position: [center.x, y, center.z],
      rotation: road.rotation ?? [-Math.PI / 2, 0, 0],
      scale: [sliceLength, getRoadCrossWidth(road)]
    };
  }

  if (road.axis === 'z') {
    return {
      id: `${road.id}-render-${index}`,
      position: [center.x, y, center.z],
      rotation: road.rotation ?? [-Math.PI / 2, 0, 0],
      scale: [getRoadCrossWidth(road), sliceLength]
    };
  }

  return {
    id: `${road.id}-render-${index}`,
    position: [center.x, y, center.z],
    rotation: road.rotation ?? [-Math.PI / 2, 0, getSegmentYaw(layout.line.start, layout.line.end)],
    scale: [sliceLength, getRoadCrossWidth(road)]
  };
}

function doesRoundaboutConflictWithTransportStructures(roundabout, structureRoads) {
  if (!roundabout?.position) return false;

  const point = {
    x: roundabout.position[0],
    z: roundabout.position[2]
  };
  const radius = roundabout.radius ?? 0;

  return structureRoads.some((road) => {
    const line = getRoadCenterline(road);
    if (!line) return false;

    const clearance = radius + getRoadCrossWidth(road) / 2 + getTransportStructureClearanceMargin(road);
    return getPointToSegmentDistanceSq(point, line.start, line.end) <= clearance * clearance;
  });
}

function removeGroundRoadsBelowElevatedRoads(roads, roadColliders, parkingMarks) {
  const elevatedRoads = roads.filter(isElevatedRoadShadowCaster);
  if (elevatedRoads.length === 0) return;

  const removeIds = new Set();

  for (const road of roads) {
    if (!isRemovableGroundRoadBelowElevated(road)) continue;

    const underElevatedRoad = elevatedRoads.some((elevatedRoad) => (
      elevatedRoad !== road &&
      doRoadsHorizontallyOverlap(elevatedRoad, road, getElevatedRoadShadowMargin(elevatedRoad))
    ));

    if (underElevatedRoad) {
      removeIds.add(road.id);
    }
  }

  if (removeIds.size === 0) return;

  removeRoadsById(roads, roadColliders, parkingMarks, removeIds);
}

function removeRoadsById(roads, roadColliders, parkingMarks, removeIds) {
  for (let index = roads.length - 1; index >= 0; index -= 1) {
    if (removeIds.has(roads[index].id)) {
      roads.splice(index, 1);
    }
  }

  for (let index = roadColliders.length - 1; index >= 0; index -= 1) {
    if (removeIds.has(roadColliders[index].id)) {
      roadColliders.splice(index, 1);
    }
  }

  for (let index = parkingMarks.length - 1; index >= 0; index -= 1) {
    const markId = parkingMarks[index]?.id ?? '';

    if ([...removeIds].some((id) => markId.startsWith(`${id}-`))) {
      parkingMarks.splice(index, 1);
    }
  }
}

function isElevatedRoadShadowCaster(road) {
  if (!road) return false;
  if (road.kind === 'expressway-feeder') return false;
  if (!isElevatedBridgeRoad(road)) return false;

  return getRoadYRange(road).maxY > GROUND_DRIVE_Y + 1.25;
}

function isRemovableGroundRoadBelowElevated(road) {
  if (!road || !road.id) return false;
  if (isElevatedBridgeRoad(road)) return false;
  if (road.kind === 'transport-highway') return false;
  if (road.kind === 'transport-highway-clearance') return false;
  if (road.kind === 'expressway-feeder') return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-overpass')) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('airport')) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('station')) return false;
  if (road.roadType === ROAD_TYPES.highway) return false;

  return getRoadYRange(road).maxY <= GROUND_DRIVE_Y + 1.1;
}

function getElevatedRoadShadowMargin(road) {
  if (road.roadType === ROAD_TYPES.ramp) return 2.4;
  if (road.kind === 'transport-overpass-deck') return 3.2;
  return 5.2;
}

function doRoadsHorizontallyOverlap(a, b, margin = 0) {
  const aLine = getRoadCenterline(a);
  const bLine = getRoadCenterline(b);
  const aHalfWidth = getRoadCrossWidth(a) / 2;
  const bHalfWidth = getRoadCrossWidth(b) / 2;
  const limit = aHalfWidth + bHalfWidth + margin;

  if (aLine && bLine) {
    return getSegmentDistanceSq(aLine.start, aLine.end, bLine.start, bLine.end) <= limit * limit;
  }

  if (aLine) {
    return getBoxSegmentDistanceSq(b, aLine.start, aLine.end) <= limit * limit;
  }

  if (bLine) {
    return getBoxSegmentDistanceSq(a, bLine.start, bLine.end) <= limit * limit;
  }

  return doBoxesOverlap(
    createLooseBox(a.centerX, a.centerZ, a.width, a.depth, margin),
    createLooseBox(b.centerX, b.centerZ, b.width, b.depth, margin)
  );
}

function isFastRoadObstacleClearanceRoad(road) {
  if (!road) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-underpass')) return false;
  return road.roadType === ROAD_TYPES.highway ||
    road.roadType === ROAD_TYPES.elevatedHighway ||
    road.roadType === ROAD_TYPES.ramp ||
    road.kind === 'transport-highway';
}

function isParkingObstacleRoad(road) {
  return road?.roadType === ROAD_TYPES.parking || road?.kind === 'parking-connector';
}

function isRoadTooCloseToFastRoad(road, fastRoad) {
  const fastLine = getRoadCenterline(fastRoad);
  if (!fastLine) return false;

  const fastHalfWidth = getRoadCrossWidth(fastRoad) / 2;
  const clearance = fastHalfWidth + FAST_ROAD_OBSTACLE_CLEARANCE;
  const roadLine = getRoadCenterline(road);

  if (roadLine) {
    const distanceSq = getSegmentDistanceSq(
      roadLine.start,
      roadLine.end,
      fastLine.start,
      fastLine.end
    );
    const roadHalfWidth = getRoadCrossWidth(road) / 2;
    const limit = clearance + roadHalfWidth;

    return distanceSq <= limit * limit;
  }

  return getBoxSegmentDistanceSq(road, fastLine.start, fastLine.end) <= clearance * clearance;
}

function getBoxSegmentDistanceSq(boxRoad, start, end) {
  const minX = boxRoad.minX ?? boxRoad.centerX - boxRoad.width / 2;
  const maxX = boxRoad.maxX ?? boxRoad.centerX + boxRoad.width / 2;
  const minZ = boxRoad.minZ ?? boxRoad.centerZ - boxRoad.depth / 2;
  const maxZ = boxRoad.maxZ ?? boxRoad.centerZ + boxRoad.depth / 2;
  const box = { minX, maxX, minZ, maxZ };

  if (isPointInsideBox(start, box) || isPointInsideBox(end, box)) return 0;

  const corners = [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ }
  ];
  const edges = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]]
  ];

  let best = Number.POSITIVE_INFINITY;

  for (const [edgeStart, edgeEnd] of edges) {
    best = Math.min(best, getSegmentDistanceSq(start, end, edgeStart, edgeEnd));
  }

  return best;
}

function isPointInsideBox(point, box) {
  return point.x >= box.minX &&
    point.x <= box.maxX &&
    point.z >= box.minZ &&
    point.z <= box.maxZ;
}

function addTransportHighway(data, bounds, chunkX, chunkZ, groundRoads = []) {
  if (FAST_ROADS_UNDERGROUND) {
    addUndergroundTransportHighway(data, bounds, chunkX, chunkZ, groundRoads);
    return;
  }

  const points = TRANSPORT_HIGHWAY.points;

  for (let index = 0; index < points.length - 1; index += 1) {
    const highwayRoad = addTransportSegmentRoad(
      data,
      `${TRANSPORT_HIGHWAY.id}-${index}`,
      'transport-highway',
      ROAD_TYPES.highway,
      points[index],
      points[index + 1],
      TRANSPORT_HIGHWAY.width,
      GROUND_DRIVE_Y,
      { side: 'transport-highway', marked: true },
      bounds,
      chunkX,
      chunkZ
    );
    addTransportHighwayRoadDetails(data, bounds, highwayRoad);
  }

  addTransportOverpasses(data, bounds, chunkX, chunkZ, groundRoads);

  for (const toll of TRANSPORT_HIGHWAY.tolls) {
    addTransportTollStation(data, toll, bounds);
  }
}

function getTransportHighwayTerminalPortalLayout(start, end, tangent, normal) {
  const sideOffset = TRANSPORT_HIGHWAY_TERMINAL_PORTAL_SIDE_OFFSET;
  const backoff = TRANSPORT_HIGHWAY_TERMINAL_PORTAL_BACKOFF;

  return {
    entry: {
      hubPoint: start,
      portal: offsetPlanarPoint(start, tangent, normal, -backoff, -sideOffset),
      rampEnd: offsetPlanarPoint(start, tangent, normal, FAST_ROAD_TUNNEL_RAMP_LENGTH, -sideOffset),
      mergePoint: offsetPlanarPoint(start, tangent, normal, FAST_ROAD_TUNNEL_RAMP_LENGTH, 0)
    },
    exit: {
      hubPoint: end,
      portal: offsetPlanarPoint(end, tangent, normal, backoff, sideOffset),
      rampStart: offsetPlanarPoint(end, tangent, normal, -FAST_ROAD_TUNNEL_RAMP_LENGTH, sideOffset),
      mergePoint: offsetPlanarPoint(end, tangent, normal, -FAST_ROAD_TUNNEL_RAMP_LENGTH, 0)
    }
  };
}

function addUndergroundTransportHighway(data, bounds, chunkX, chunkZ, groundRoads = []) {
  const [start, end] = TRANSPORT_HIGHWAY.points;
  const tunnelY = TRANSPORT_HIGHWAY_TUNNEL_Y;
  const tunnelWidth = TRANSPORT_HIGHWAY.width;
  const lineLength = Math.hypot(end.x - start.x, end.z - start.z);
  if (lineLength <= FAST_ROAD_TUNNEL_RAMP_LENGTH * 2 + 10) return;

  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const terminalLayout = getTransportHighwayTerminalPortalLayout(start, end, tangent, normal);
  const { entry, exit } = terminalLayout;
  const tunnelStart = entry.mergePoint;
  const tunnelEnd = exit.mergePoint;
  const rampWidth = TRANSPORT_HIGHWAY_TERMINAL_RAMP_WIDTH;
  const mergeWidth = TRANSPORT_HIGHWAY_TERMINAL_MERGE_WIDTH;
  const baseId = `transport-highway-underground-${chunkX}-${chunkZ}`;
  const entryRampDirection = normalizeVector({
    x: entry.rampEnd.x - entry.portal.x,
    z: entry.rampEnd.z - entry.portal.z
  });
  const exitRampDirection = normalizeVector({
    x: exit.rampStart.x - exit.portal.x,
    z: exit.rampStart.z - exit.portal.z
  });

  addTransportSlopedRoad(
    data,
    `${baseId}-entry-ground-connector`,
    'transport-highway-surface-connector',
    ROAD_TYPES.mainRoad,
    entry.hubPoint,
    entry.portal,
    TRANSPORT_HIGHWAY_TERMINAL_CONNECTOR_WIDTH,
    GROUND_DRIVE_Y,
    GROUND_DRIVE_Y,
    {
      side: 'transport-highway-surface-connector',
      marked: true,
      visualStartY: GROUND_DRIVE_Y + 0.035,
      visualEndY: GROUND_DRIVE_Y + 0.035
    },
    bounds
  );

  addTransportSmoothSlopedRoad(
    data,
    `${baseId}-entry-ramp`,
    'transport-highway-ramp',
    ROAD_TYPES.ramp,
    entry.portal,
    entry.rampEnd,
    rampWidth,
    GROUND_DRIVE_Y,
    tunnelY,
    {
      side: 'transport-highway-ramp',
      marked: true,
      visualStartY: GROUND_DRIVE_Y,
      visualEndY: tunnelY
    },
    bounds,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_SMOOTH_SEGMENTS
  );
  const entryMergeRoad = addTransportSegmentRoad(
    data,
    `${baseId}-entry-merge`,
    'transport-highway',
    ROAD_TYPES.highway,
    entry.rampEnd,
    tunnelStart,
    mergeWidth,
    tunnelY,
    {
      marked: true,
      side: 'transport-highway-tunnel-merge'
    },
    bounds,
    chunkX,
    chunkZ
  );
  const tunnelRoad = addTransportSegmentRoad(
    data,
    `${baseId}-tunnel`,
    'transport-highway',
    ROAD_TYPES.highway,
    tunnelStart,
    tunnelEnd,
    tunnelWidth,
    tunnelY,
    {
      marked: true,
      side: 'transport-highway-tunnel'
    },
    bounds,
    chunkX,
    chunkZ
  );
  const exitMergeRoad = addTransportSegmentRoad(
    data,
    `${baseId}-exit-merge`,
    'transport-highway',
    ROAD_TYPES.highway,
    tunnelEnd,
    exit.rampStart,
    mergeWidth,
    tunnelY,
    {
      marked: true,
      side: 'transport-highway-tunnel-merge'
    },
    bounds,
    chunkX,
    chunkZ
  );
  addTransportSmoothSlopedRoad(
    data,
    `${baseId}-exit-ramp`,
    'transport-highway-ramp',
    ROAD_TYPES.ramp,
    exit.rampStart,
    exit.portal,
    rampWidth,
    tunnelY,
    GROUND_DRIVE_Y,
    {
      side: 'transport-highway-ramp',
      marked: true,
      visualStartY: tunnelY,
      visualEndY: GROUND_DRIVE_Y
    },
    bounds,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_SMOOTH_SEGMENTS
  );
  addTransportSlopedRoad(
    data,
    `${baseId}-exit-ground-connector`,
    'transport-highway-surface-connector',
    ROAD_TYPES.mainRoad,
    exit.portal,
    exit.hubPoint,
    TRANSPORT_HIGHWAY_TERMINAL_CONNECTOR_WIDTH,
    GROUND_DRIVE_Y,
    GROUND_DRIVE_Y,
    {
      side: 'transport-highway-surface-connector',
      marked: true,
      visualStartY: GROUND_DRIVE_Y + 0.035,
      visualEndY: GROUND_DRIVE_Y + 0.035
    },
    bounds
  );

  addTransportBridgeJointRoads(
    data,
    `${baseId}-terminal-surface`,
    [
      { point: entry.hubPoint, y: GROUND_DRIVE_Y, size: TRANSPORT_HIGHWAY_TERMINAL_CONNECTOR_WIDTH + 10 },
      { point: entry.portal, y: GROUND_DRIVE_Y, size: rampWidth + 8 },
      { point: exit.portal, y: GROUND_DRIVE_Y, size: rampWidth + 8 },
      { point: exit.hubPoint, y: GROUND_DRIVE_Y, size: TRANSPORT_HIGHWAY_TERMINAL_CONNECTOR_WIDTH + 10 }
    ],
    ROAD_TYPES.mainRoad,
    'transport-highway-surface-connector'
  );
  addTransportBridgeJointRoads(
    data,
    `${baseId}-terminal-tunnel`,
    [
      { point: entry.rampEnd, y: tunnelY, size: mergeWidth + 9 },
      { point: tunnelStart, y: tunnelY, size: tunnelWidth + 8 },
      { point: tunnelEnd, y: tunnelY, size: tunnelWidth + 8 },
      { point: exit.rampStart, y: tunnelY, size: mergeWidth + 9 }
    ],
    ROAD_TYPES.highway,
    'transport-highway-tunnel-joint'
  );

  for (const { road, width } of [
    { road: entryMergeRoad, width: mergeWidth },
    { road: tunnelRoad, width: tunnelWidth },
    { road: exitMergeRoad, width: mergeWidth }
  ]) {
    if (!road) continue;

    const roadStart = { x: road.startX, z: road.startZ };
    const roadEnd = { x: road.endX, z: road.endZ };
    addFastRoadTunnelSegmentDetails(
      data,
      `${baseId}-${road.id}`,
      roadStart,
      roadEnd,
      width,
      tunnelY,
      {
        includeCutout: false,
        zoneKind: 'transport-highway-tunnel'
      }
    );
  }

  addFastRoadTunnelCutout(
    data,
    `${baseId}-entry-ramp-cutout`,
    entry.portal,
    entry.rampEnd,
    rampWidth + FAST_ROAD_RAMP_CUTOUT_EXTRA_WIDTH,
    bounds
  );
  addFastRoadTunnelCutout(
    data,
    `${baseId}-exit-ramp-cutout`,
    exit.rampStart,
    exit.portal,
    rampWidth + FAST_ROAD_RAMP_CUTOUT_EXTRA_WIDTH,
    bounds
  );

  addFastRoadRectTunnelEnvelope(data, bounds, `${baseId}-entry-box`, entry.portal, entry.rampEnd, rampWidth, GROUND_DRIVE_Y, tunnelY);
  addFastRoadRectTunnelEnvelope(data, bounds, `${baseId}-exit-box`, exit.rampStart, exit.portal, rampWidth, tunnelY, GROUND_DRIVE_Y);
  addFastRoadRectTunnelMouth(data, bounds, `${baseId}-entry-mouth`, entry.portal, entryRampDirection, rampWidth, GROUND_DRIVE_Y);
  addFastRoadRectTunnelMouth(data, bounds, `${baseId}-exit-mouth`, exit.portal, exitRampDirection, rampWidth, GROUND_DRIVE_Y);

  if (isBoxOverlappingChunk(entry.portal.x, entry.portal.z, rampWidth + 32, rampWidth + 32, bounds, 18)) {
    addFastRoadRampTunnelZone(data, `${baseId}-entry-zone`, 'transport-highway-tunnel', rampWidth, entry.portal, entry.rampEnd, tunnelStart, tunnelStart, tunnelY);
  }

  if (isBoxOverlappingChunk(exit.portal.x, exit.portal.z, rampWidth + 32, rampWidth + 32, bounds, 18)) {
    addFastRoadRampTunnelZone(data, `${baseId}-exit-zone`, 'transport-highway-tunnel', rampWidth, exit.portal, exit.rampStart, tunnelEnd, tunnelEnd, tunnelY);
  }
}

function addTransportHighwayRoadDetails(data, bounds, road) {
  if (!road) return;
}

function addTransportOverpasses(data, bounds, chunkX, chunkZ, groundRoads) {
  const created = new Set();
  const pending = [];

  for (const road of groundRoads) {
    if (!shouldCreateTransportOverpassForRoad(road)) continue;

    const { line, crossing } = road.transportCrossing ?? getTransportHighwayCrossing(road) ?? {};
    if (!line || !crossing) continue;
    if (!isOwnedTransportOverpassCrossing(crossing, bounds)) continue;

    const key = `${road.id}-${Math.round(crossing.x)}-${Math.round(crossing.z)}`;
    if (created.has(key)) continue;
    created.add(key);

    pending.push({
      avoidanceType: road.transportAvoidanceType ?? 'tunnel',
      crossing,
      line,
      needsUnderpass: doesTransportCrossingNeedUnderpass(data, road, line, crossing),
      road
    });
  }

  pending
    .sort((a, b) => (
      Number(a.needsUnderpass) - Number(b.needsUnderpass) ||
      getTransportOverpassCandidatePriority(b.road) - getTransportOverpassCandidatePriority(a.road) ||
      getRoadCrossWidth(b.road) - getRoadCrossWidth(a.road) ||
      (a.crossing.u ?? 0) - (b.crossing.u ?? 0)
    ))
    .forEach(({ avoidanceType, road, line, crossing }) => {
      if (avoidanceType === 'bridge') {
        addTransportOverpassForRoad(data, bounds, chunkX, chunkZ, road, line, crossing);
        return;
      }

      addTransportUnderpassForRoad(data, bounds, chunkX, chunkZ, road, line, crossing);
    });
}

function doesTransportCrossingNeedUnderpass(data, road, line, crossing) {
  const roadWidth = getRoadCrossWidth(road);
  const bridgeWidth = clamp(roadWidth, 9, 22);
  const deckHalfLength = Math.max(
    TRANSPORT_OVERPASS_DECK_HALF_LENGTH,
    TRANSPORT_HIGHWAY.width * 0.72
  );
  const sourceLength = Math.max(Math.hypot(
    line.end.x - line.start.x,
    line.end.z - line.start.z
  ), 0.0001);
  const sourceCrossingDistance = getTransportSourceCrossingDistance(line, crossing, sourceLength);
  const requiredHalfLength = deckHalfLength + TRANSPORT_OVERPASS_RAMP_LENGTH + TRANSPORT_STRUCTURE_CONNECTOR_LENGTH;
  const startExtension = Math.max(0, requiredHalfLength - sourceCrossingDistance);
  const endExtension = Math.max(0, requiredHalfLength - (sourceLength - sourceCrossingDistance));
  const overpassLine = extendLine(line, startExtension, endExtension);

  return doesTransportOverpassNeedHorizontalDetour(data, overpassLine, bridgeWidth);
}

function shouldCreateTransportOverpassForRoad(road) {
  if (!road?.marked) return false;
  if (road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.highway) return false;
  if (road.kind === 'parking-connector') return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (road.kind === 'intersection' || road.axis === 'center' || road.axis === 'joint') return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-')) return false;

  return road.axis === 'x' || road.axis === 'z' || road.axis === 'segment';
}

function getTransportOverpassCandidatePriority(road) {
  if (road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main') return 4;
  if (road.roadType === ROAD_TYPES.groundRoad || road.roadType === 'local') return 3;
  if (road.axis === 'segment') return 2;
  return 1;
}

function addTransportOverpassForRoad(data, bounds, chunkX, chunkZ, road, line, crossing, options = {}) {
  const roadWidth = getRoadCrossWidth(road);
  const bridgeWidth = clamp(roadWidth, 9, 22);
  const deckHalfLength = Math.max(
    TRANSPORT_OVERPASS_DECK_HALF_LENGTH,
    TRANSPORT_HIGHWAY.width * 0.72
  );
  const sourceLength = Math.max(Math.hypot(
    line.end.x - line.start.x,
    line.end.z - line.start.z
  ), 0.0001);
  const sourceCrossingDistance = getTransportSourceCrossingDistance(line, crossing, sourceLength);
  const requiredHalfLength = deckHalfLength + TRANSPORT_OVERPASS_RAMP_LENGTH + TRANSPORT_STRUCTURE_CONNECTOR_LENGTH;
  let startExtension = Math.max(0, requiredHalfLength - sourceCrossingDistance);
  let endExtension = Math.max(0, requiredHalfLength - (sourceLength - sourceCrossingDistance));
  let overpassLine = extendLine(line, startExtension, endExtension);
  let roadLength = sourceLength + startExtension + endExtension;
  let crossingDistance = sourceCrossingDistance + startExtension;

  if (!options.forceBridge && doesTransportOverpassNeedHorizontalDetour(data, overpassLine, bridgeWidth)) {
    addTransportUnderpassForRoad(data, bounds, chunkX, chunkZ, road, line, crossing);
    return;
  }

  const groundVisualY = getRoadVisualY(road);
  const baseId = `transport-overpass-${chunkX}-${chunkZ}-${road.id}`;
  const layout = resolveTransportOverpassLayout(
    data,
    overpassLine,
    bridgeWidth,
    roadLength,
    crossingDistance,
    deckHalfLength,
    `${chunkX}:${chunkZ}:${road.id}`
  );

  if (!layout) return;

  const upStart = getPointAlongLine(overpassLine, layout.rampStartDistance);
  const deckStart = addPointOffset(getPointAlongLine(overpassLine, layout.deckStartDistance), layout.deckOffset);
  const deckEnd = addPointOffset(getPointAlongLine(overpassLine, layout.deckEndDistance), layout.deckOffset);
  const downEnd = getPointAlongLine(overpassLine, layout.rampEndDistance);
  const trafficStart = getPointAlongLine(overpassLine, 0);
  const trafficEnd = getPointAlongLine(overpassLine, roadLength);
  const deckY = layout.deckY;
  const trafficPathPoints = [
    { ...trafficStart, y: GROUND_DRIVE_Y + 0.06 },
    { ...upStart, y: GROUND_DRIVE_Y + 0.06 },
    { ...deckStart, y: deckY + 0.06 },
    { ...deckEnd, y: deckY + 0.06 },
    { ...downEnd, y: GROUND_DRIVE_Y + 0.06 },
    { ...trafficEnd, y: GROUND_DRIVE_Y + 0.06 }
  ];

  const upRamp = addTransportFullSlopedRoad(
    data,
    `${baseId}-up`,
    'transport-overpass-ramp',
    ROAD_TYPES.ramp,
    upStart,
    deckStart,
    bridgeWidth,
    GROUND_DRIVE_Y,
    deckY,
    {
      side: 'transport-overpass-up',
      marked: true,
      trafficDisabled: true,
      visualStartY: groundVisualY,
      visualEndY: deckY
    }
  );
  const deck = addTransportFullSegmentRoad(
    data,
    `${baseId}-deck`,
    'transport-overpass-deck',
    normalizeOverpassRoadType(road.roadType),
    deckStart,
    deckEnd,
    bridgeWidth,
    deckY,
    {
      side: 'transport-overpass',
      marked: true,
      trafficPathPoints
    }
  );
  const downRamp = addTransportFullSlopedRoad(
    data,
    `${baseId}-down`,
    'transport-overpass-ramp',
    ROAD_TYPES.ramp,
    deckEnd,
    downEnd,
    bridgeWidth,
    deckY,
    GROUND_DRIVE_Y,
    {
      side: 'transport-overpass-down',
      marked: true,
      trafficDisabled: true,
      visualStartY: deckY,
      visualEndY: groundVisualY
    }
  );
  const approachStart = Math.hypot(upStart.x - trafficStart.x, upStart.z - trafficStart.z) > 2
    ? addTransportFullSegmentRoad(
        data,
        `${baseId}-approach-start`,
        'transport-overpass-approach',
        normalizeOverpassRoadType(road.roadType),
        trafficStart,
        upStart,
        bridgeWidth,
        GROUND_DRIVE_Y,
        {
          side: 'transport-overpass-approach',
          marked: true,
          trafficDisabled: true
        }
      )
    : null;
  const approachEnd = Math.hypot(downEnd.x - trafficEnd.x, downEnd.z - trafficEnd.z) > 2
    ? addTransportFullSegmentRoad(
        data,
        `${baseId}-approach-end`,
        'transport-overpass-approach',
        normalizeOverpassRoadType(road.roadType),
        downEnd,
        trafficEnd,
        bridgeWidth,
        GROUND_DRIVE_Y,
        {
          side: 'transport-overpass-approach',
          marked: true,
          trafficDisabled: true
        }
      )
    : null;

  if (deck) {
    addTransportOverpassSupports(
      data,
      deck,
      bounds,
      data.roads.filter((item) => item !== deck && !String(item?.kind ?? '').startsWith('transport-overpass'))
    );
  }

  addTransportBridgeJointRoads(
    data,
    baseId,
    [
      { point: trafficStart, y: GROUND_DRIVE_Y, size: bridgeWidth * 1.05 },
      { point: upStart, y: GROUND_DRIVE_Y, size: bridgeWidth * 1.18 },
      { point: deckStart, y: deckY, size: bridgeWidth * 1.24 },
      { point: deckEnd, y: deckY, size: bridgeWidth * 1.24 },
      { point: downEnd, y: GROUND_DRIVE_Y, size: bridgeWidth * 1.18 },
      { point: trafficEnd, y: GROUND_DRIVE_Y, size: bridgeWidth * 1.05 }
    ],
    ROAD_TYPES.ramp,
    'transport-overpass-joint'
  );

  for (const overpassRoad of [approachStart, upRamp, deck, downRamp, approachEnd]) {
    if (!overpassRoad) continue;

    addExpresswayGuardrails(
      data,
      overpassRoad,
      Math.min(overpassRoad.surface?.startY ?? overpassRoad.position[1], overpassRoad.surface?.endY ?? overpassRoad.position[1]) + 0.08,
      Math.max(overpassRoad.surface?.startY ?? overpassRoad.position[1], overpassRoad.surface?.endY ?? overpassRoad.position[1]) + EXPRESSWAY_GUARDRAIL_HEIGHT + 0.35,
      {
        clearanceRoads: [road, ...data.roads.filter((item) => item !== overpassRoad && !isElevatedBridgeRoad(item))],
        colliderType: 'solidBridgeGuardrail',
        forceColliders: true,
        forceContinuous: true
      }
    );
  }
}

function addTransportOverpassSupports(data, road, bounds, clearanceRoads = []) {
  const line = getRoadCenterline(road);
  if (!line) return;

  const length = getPlanarLineLength(line);
  if (length <= 12) return;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const supportDistances = getRegularInteriorDistances(length, TRANSPORT_OVERPASS_SUPPORT_SPACING, 22);
  const bridgeWidth = road.surface?.width ?? road.visualScale?.[1] ?? getRoadCrossWidth(road);
  const lateralOffset = Math.max(0, Math.min(bridgeWidth * 0.28, bridgeWidth / 2 - 2.2));
  const lateralRows = lateralOffset > 1.2 ? [-lateralOffset, lateralOffset] : [0];
  const height = Math.max(2.4, getRoadVisualY(road) - 0.12);

  for (const [index, distance] of supportDistances.entries()) {
    for (const lateral of lateralRows) {
      const x = line.start.x + tangent.x * distance + normal.x * lateral;
      const z = line.start.z + tangent.z * distance + normal.z * lateral;

      if (!isInsideChunk(x, z, bounds)) continue;
      if (isBoxInsideSpawnClearZone(x, z, 3, 3)) continue;
      if (isPointOnAnyRoadSurface(x, z, clearanceRoads, 3.2)) continue;

      data.trafficObstacles.push(createTrafficObstacle(
        `${road.id}-bridge-support-${index}-${Math.round(lateral * 10)}`,
        x,
        z,
        0,
        2.6,
        height,
        2.6,
        '#5f6970',
        0,
        { type: 'transportOverpassSupport' }
      ));
    }
  }
}

function addTransportUnderpassForRoad(data, bounds, chunkX, chunkZ, road, line, crossing) {
  const roadWidth = getRoadCrossWidth(road);
  const tunnelWidth = clamp(roadWidth, 9, 22);
  const tunnelHalfLength = Math.max(
    TRANSPORT_UNDERPASS_TUNNEL_HALF_LENGTH,
    TRANSPORT_HIGHWAY.width * 0.74
  );
  const sourceLength = Math.max(Math.hypot(
    line.end.x - line.start.x,
    line.end.z - line.start.z
  ), 0.0001);
  const sourceCrossingDistance = getTransportSourceCrossingDistance(line, crossing, sourceLength);
  const requiredHalfLength = tunnelHalfLength + TRANSPORT_UNDERPASS_MAX_RAMP_LENGTH + TRANSPORT_STRUCTURE_CONNECTOR_LENGTH;
  const startExtension = Math.max(0, requiredHalfLength - sourceCrossingDistance);
  const endExtension = Math.max(0, requiredHalfLength - (sourceLength - sourceCrossingDistance));
  const underpassLine = extendLine(line, startExtension, endExtension);
  const roadLength = sourceLength + startExtension + endExtension;
  const crossingDistance = sourceCrossingDistance + startExtension;
  const baseId = `transport-underpass-${chunkX}-${chunkZ}-${road.id}`;
  const depthPlan = getTransportUnderpassDepthPlan(
    data,
    underpassLine,
    crossingDistance,
    tunnelHalfLength,
    roadLength,
    tunnelWidth
  );

  if (!depthPlan) return;

  const { layout, tunnelY } = depthPlan;
  const rampStart = getPointAlongLine(underpassLine, layout.rampStartDistance);
  const tunnelStart = getPointAlongLine(underpassLine, layout.deckStartDistance);
  const tunnelEnd = getPointAlongLine(underpassLine, layout.deckEndDistance);
  const rampEnd = getPointAlongLine(underpassLine, layout.rampEndDistance);
  const trafficStart = getPointAlongLine(underpassLine, 0);
  const trafficEnd = getPointAlongLine(underpassLine, roadLength);
  const isStackedUnderpass = tunnelY < TRANSPORT_UNDERPASS_Y - TRANSPORT_UNDERPASS_LEVEL_GAP * 0.45;
  const tangent = normalizeVector({
    x: underpassLine.end.x - underpassLine.start.x,
    z: underpassLine.end.z - underpassLine.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const rotationY = Math.atan2(tangent.x, tangent.z);
  const trafficPathPoints = [
    { ...trafficStart, y: GROUND_DRIVE_Y + 0.06 },
    { ...rampStart, y: GROUND_DRIVE_Y + 0.06 },
    { ...tunnelStart, y: tunnelY + 0.06 },
    { ...tunnelEnd, y: tunnelY + 0.06 },
    { ...rampEnd, y: GROUND_DRIVE_Y + 0.06 },
    { ...trafficEnd, y: GROUND_DRIVE_Y + 0.06 }
  ];

  const approachStart = Math.hypot(rampStart.x - trafficStart.x, rampStart.z - trafficStart.z) > 2
    ? addTransportFullSegmentRoad(
        data,
        `${baseId}-approach-start`,
        'transport-underpass-approach',
        normalizeOverpassRoadType(road.roadType),
        trafficStart,
        rampStart,
        tunnelWidth,
        GROUND_DRIVE_Y,
        {
          side: 'transport-underpass-approach',
          marked: true,
          trafficDisabled: true
        }
      )
    : null;
  const downRamp = addTransportFullSlopedRoad(
    data,
    `${baseId}-down`,
    'transport-underpass-ramp',
    ROAD_TYPES.ramp,
    rampStart,
    tunnelStart,
    tunnelWidth,
    GROUND_DRIVE_Y,
    tunnelY,
    {
      side: 'transport-underpass-down',
      marked: true,
      trafficDisabled: true,
      visualStartY: GROUND_DRIVE_Y,
      visualEndY: tunnelY
    }
  );
  const tunnelRoad = addTransportFullSegmentRoad(
    data,
    `${baseId}-tunnel`,
    'transport-underpass-tunnel',
    normalizeOverpassRoadType(road.roadType),
    tunnelStart,
    tunnelEnd,
    tunnelWidth,
    tunnelY,
    {
      side: 'transport-underpass',
      marked: true,
      trafficPathPoints
    }
  );
  const upRamp = addTransportFullSlopedRoad(
    data,
    `${baseId}-up`,
    'transport-underpass-ramp',
    ROAD_TYPES.ramp,
    tunnelEnd,
    rampEnd,
    tunnelWidth,
    tunnelY,
    GROUND_DRIVE_Y,
    {
      side: 'transport-underpass-up',
      marked: true,
      trafficDisabled: true,
      visualStartY: tunnelY,
      visualEndY: GROUND_DRIVE_Y
    }
  );
  const approachEnd = Math.hypot(rampEnd.x - trafficEnd.x, rampEnd.z - trafficEnd.z) > 2
    ? addTransportFullSegmentRoad(
        data,
        `${baseId}-approach-end`,
        'transport-underpass-approach',
        normalizeOverpassRoadType(road.roadType),
        rampEnd,
        trafficEnd,
        tunnelWidth,
        GROUND_DRIVE_Y,
        {
          side: 'transport-underpass-approach',
          marked: true,
          trafficDisabled: true
        }
      )
    : null;

  addTransportUnderpassDetails(data, baseId, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, tunnelY);
  addTransportUnderpassGroundCutout(data, baseId, rampStart, rampEnd, tunnelWidth);
  addTransportUnderpassOpenCutFloors(
    data,
    baseId,
    rampStart,
    tunnelStart,
    tunnelEnd,
    rampEnd,
    tunnelWidth,
    tunnelY,
    rotationY
  );
  addTransportUnderpassJointRoads(data, baseId, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, tunnelY);
  addTransportUnderpassExcavation(
    data,
    bounds,
    baseId,
    rampStart,
    tunnelStart,
    tunnelEnd,
    rampEnd,
    tunnelWidth,
    tunnelWidth + 2.8,
    tangent,
    normal,
    rotationY
  );
  addTransportUnderpassRampWalls(data, bounds, `${baseId}-down`, rampStart, tunnelStart, GROUND_DRIVE_Y, tunnelY, tunnelWidth, normal, { stacked: isStackedUnderpass });
  addTransportUnderpassRampWalls(data, bounds, `${baseId}-up`, tunnelEnd, rampEnd, tunnelY, GROUND_DRIVE_Y, tunnelWidth, normal, { stacked: isStackedUnderpass });
  addTransportUnderpassInterior(data, baseId, tunnelStart, tunnelEnd, tunnelWidth, tunnelY, tangent, normal, rotationY);
  addTransportUnderpassLights(data, baseId, tunnelStart, tunnelEnd, tunnelWidth, tunnelY, tangent, normal, rotationY);
  addTransportUnderpassRibs(data, baseId, tunnelStart, tunnelEnd, tunnelWidth, tunnelY, tangent, normal, rotationY);
  return [approachStart, downRamp, tunnelRoad, upRamp, approachEnd].filter(Boolean);
}

function getTransportUnderpassDepthPlan(data, underpassLine, crossingDistance, tunnelHalfLength, roadLength, tunnelWidth) {
  for (let level = 0; level < TRANSPORT_UNDERPASS_LEVEL_COUNT; level += 1) {
    const candidateY = TRANSPORT_UNDERPASS_Y - level * TRANSPORT_UNDERPASS_LEVEL_GAP;
    const rampLength = getTransportUnderpassRampLength(candidateY);
    const layout = createTransportUnderpassLayout(crossingDistance, tunnelHalfLength, roadLength, rampLength);
    if (!layout) continue;

    const rampStart = getPointAlongLine(underpassLine, layout.rampStartDistance);
    const tunnelStart = getPointAlongLine(underpassLine, layout.deckStartDistance);
    const tunnelEnd = getPointAlongLine(underpassLine, layout.deckEndDistance);
    const rampEnd = getPointAlongLine(underpassLine, layout.rampEndDistance);
    const score = scoreTransportUnderpassDepthConflict(data, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, candidateY);
    const plan = {
      layout,
      rampLength,
      tunnelY: candidateY
    };

    if (score <= 0.001) return plan;
  }

  return null;
}

function getTransportUnderpassRampLength(tunnelY) {
  const drop = Math.max(0, GROUND_DRIVE_Y - tunnelY);
  return clamp(
    Math.max(TRANSPORT_UNDERPASS_RAMP_LENGTH, drop / TRANSPORT_UNDERPASS_TARGET_RAMP_GRADE),
    TRANSPORT_UNDERPASS_RAMP_LENGTH,
    TRANSPORT_UNDERPASS_MAX_RAMP_LENGTH
  );
}

function scoreTransportUnderpassDepthConflict(data, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, candidateY) {
  let score = 0;
  const candidateSegments = getTransportUnderpassDepthCandidateSegments(
    rampStart,
    tunnelStart,
    tunnelEnd,
    rampEnd,
    tunnelWidth,
    candidateY
  );

  for (const road of data.roads) {
    if (!isTransportUnderpassDepthConflictRoad(road)) continue;

    const roadLine = getRoadCenterline(road);
    if (!roadLine) continue;

    for (const segment of candidateSegments) {
      const approach = getClosestSegmentApproach(segment.start, segment.end, roadLine.start, roadLine.end);
      const clearance = segment.width / 2 + getRoadCrossWidth(road) / 2 + 5.2;

      if (!approach || approach.distanceSq > clearance * clearance) continue;

      const candidateRoadY = lerp(segment.startY, segment.endY, approach.t);
      const roadY = getRoadSurfaceYAtT(road, approach.u);
      if (!Number.isFinite(roadY)) continue;

      const verticalGap = Math.abs(candidateRoadY - roadY);
      const verticalClearance = TUNNEL_CLEARANCE_HEIGHT + 1.1;
      if (verticalGap >= verticalClearance) continue;

      const horizontalOverlap = Math.max(0, clearance - Math.sqrt(approach.distanceSq));
      score += horizontalOverlap * (verticalClearance - verticalGap);
    }
  }

  return score;
}

function getTransportUnderpassDepthCandidateSegments(rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, tunnelY) {
  return [
    {
      start: rampStart,
      end: tunnelStart,
      startY: GROUND_DRIVE_Y,
      endY: tunnelY,
      width: tunnelWidth
    },
    {
      start: tunnelStart,
      end: tunnelEnd,
      startY: tunnelY,
      endY: tunnelY,
      width: tunnelWidth
    },
    {
      start: tunnelEnd,
      end: rampEnd,
      startY: tunnelY,
      endY: GROUND_DRIVE_Y,
      width: tunnelWidth
    }
  ];
}

function isTransportUnderpassDepthConflictRoad(road) {
  return road?.kind === 'transport-underpass-tunnel' || road?.kind === 'transport-underpass-ramp';
}

function getRoadSurfaceYAtT(road, t) {
  const surface = road?.surface;

  if (surface?.shape === 'ramp') {
    return lerp(surface.startY, surface.endY, clamp(t, 0, 1));
  }

  return surface?.y ?? road?.position?.[1] ?? Number.NaN;
}

function createTransportUnderpassLayout(crossingDistance, tunnelHalfLength, roadLength, rampLength = TRANSPORT_UNDERPASS_RAMP_LENGTH) {
  const rampStartDistance = crossingDistance - tunnelHalfLength - rampLength;
  const deckStartDistance = crossingDistance - tunnelHalfLength;
  const deckEndDistance = crossingDistance + tunnelHalfLength;
  const rampEndDistance = crossingDistance + tunnelHalfLength + rampLength;

  if (rampStartDistance < -0.01 || rampEndDistance > roadLength + 0.01) return null;

  return {
    crossingDistance,
    deckEndDistance,
    deckStartDistance,
    rampEndDistance,
    rampStartDistance
  };
}

function addTransportUnderpassDetails(data, baseId, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, tunnelY) {
  data.tunnelZones.push({
    id: `${baseId}-zone`,
    kind: 'transport-underpass',
    width: tunnelWidth,
    rampStart: { ...rampStart },
    tunnelStart: { ...tunnelStart },
    tunnelEnd: { ...tunnelEnd },
    rampEnd: { ...rampEnd },
    y: tunnelY
  });
}

function addTransportUnderpassGroundCutout(data, baseId, rampStart, rampEnd, tunnelWidth) {
  const cutoutWidth = tunnelWidth + 13.5;
  const bounds = getSegmentBounds(rampStart, rampEnd, cutoutWidth);
  const length = Math.hypot(rampEnd.x - rampStart.x, rampEnd.z - rampStart.z);
  const tangent = normalizeVector({
    x: rampEnd.x - rampStart.x,
    z: rampEnd.z - rampStart.z
  });
  const expandedStart = {
    x: rampStart.x - tangent.x * 12,
    z: rampStart.z - tangent.z * 12
  };
  const expandedEnd = {
    x: rampEnd.x + tangent.x * 12,
    z: rampEnd.z + tangent.z * 12
  };
  const expandedBounds = getSegmentBounds(expandedStart, expandedEnd, cutoutWidth);

  if (length <= 0.1) return;

  data.groundCutouts.push({
    id: `${baseId}-open-cut`,
    minX: expandedBounds.minX,
    maxX: expandedBounds.maxX,
    minZ: expandedBounds.minZ,
    maxZ: expandedBounds.maxZ
  });

  data.groundCutouts.push({
    id: `${baseId}-portal-mouth`,
    minX: bounds.minX - 4,
    maxX: bounds.maxX + 4,
    minZ: bounds.minZ - 4,
    maxZ: bounds.maxZ + 4
  });
}

function addTransportUnderpassOpenCutFloors(data, baseId, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, tunnelY, rotationY, options = {}) {
  const cutoutWidth = tunnelWidth + 12.2;
  const obstacles = [
    createSlopedTrafficObstacle(
      `${baseId}-open-cut-floor-down`,
      rampStart,
      tunnelStart,
      GROUND_DRIVE_Y - 0.08,
      tunnelY - 0.08,
      cutoutWidth,
      0.07,
      '#3f494d',
      'transportUnderpassTrenchFloor'
    ),
    createTrafficObstacle(
      `${baseId}-open-cut-floor-tunnel`,
      (tunnelStart.x + tunnelEnd.x) / 2,
      (tunnelStart.z + tunnelEnd.z) / 2,
      tunnelY - 0.12,
      Math.max(1, Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z)),
      0.08,
      cutoutWidth,
      '#3f494d',
      rotationY,
      { type: 'transportUnderpassTrenchFloor' }
    )
  ];

  if (options.includeGroundDeck === true) {
    obstacles.push(createTrafficObstacle(
      `${baseId}-overhead-deck-underside`,
      (tunnelStart.x + tunnelEnd.x) / 2,
      (tunnelStart.z + tunnelEnd.z) / 2,
      GROUND_DRIVE_Y - 0.28,
      cutoutWidth + 5.6,
      0.44,
      Math.max(1, Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z) + 28),
      '#59636a',
      rotationY,
      { type: 'transportUnderpassOverheadDeck' }
    ));
  }

  obstacles.push(createSlopedTrafficObstacle(
      `${baseId}-open-cut-floor-up`,
      tunnelEnd,
      rampEnd,
      tunnelY - 0.08,
      GROUND_DRIVE_Y - 0.08,
      cutoutWidth,
      0.07,
      '#3f494d',
      'transportUnderpassTrenchFloor'
    ));

  data.trafficObstacles.push(...obstacles);
}

function createSlopedTrafficObstacle(id, start, end, startY, endY, width, thickness, color, type) {
  const length = Math.max(Math.hypot(end.x - start.x, end.z - start.z), 0.0001);
  const heightDelta = endY - startY;
  const slopeLength = Math.hypot(length, heightDelta);
  const center = midpoint(start, end);

  return {
    id,
    basis: getRampSurfaceBasis(start, end, heightDelta),
    color,
    collidable: false,
    position: [center.x, (startY + endY) / 2, center.z],
    rotation: [0, 0, 0],
    scale: [slopeLength, width, thickness],
    type
  };
}

function addTransportUnderpassJointRoads(data, baseId, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelWidth, tunnelY) {
  addTransportBridgeJointRoads(
    data,
    `${baseId}-underpass`,
    [
      { point: rampStart, y: GROUND_DRIVE_Y, size: tunnelWidth * 1.18 },
      { point: tunnelStart, y: tunnelY, size: tunnelWidth * 1.22 },
      { point: tunnelEnd, y: tunnelY, size: tunnelWidth * 1.22 },
      { point: rampEnd, y: GROUND_DRIVE_Y, size: tunnelWidth * 1.18 }
    ],
    ROAD_TYPES.ramp,
    'transport-underpass-joint'
  );
}

function addTransportUnderpassInterior(data, baseId, tunnelStart, tunnelEnd, tunnelWidth, tunnelY, tangent, normal, rotationY) {
  const tunnelLength = Math.max(Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z), 0.0001);
  const center = midpoint(tunnelStart, tunnelEnd);
  const wallBaseY = tunnelY - 0.08;
  const wallHeight = TUNNEL_CLEARANCE_HEIGHT + 0.24;
  const wallTopY = wallBaseY + wallHeight;
  const ceilingBaseY = tunnelY + TUNNEL_CLEARANCE_HEIGHT;
  const ceilingThickness = 0.48;
  const wallGapRanges = String(baseId).startsWith('transport-highway-underground')
    ? getTransportHighwayAccessWallGaps(tunnelStart, tunnelEnd, tunnelWidth)
    : null;

  data.trafficObstacles.push(createTrafficObstacle(
    `${baseId}-ceiling-slab`,
    center.x,
    center.z,
    ceilingBaseY,
    tunnelWidth + 4.8,
    ceilingThickness,
    tunnelLength,
    '#5e686e',
    rotationY,
    { type: 'transportUnderpassCeiling' }
  ));

  for (const side of [-1, 1]) {
    const sideLabel = side > 0 ? 'right' : 'left';
    const sideGaps = wallGapRanges?.[side] ?? [];
    const reflectorInset = tunnelWidth / 2 - 0.18;

    getTunnelWallVisibleRanges(tunnelLength, sideGaps).forEach((range, rangeIndex) => {
      const segmentLength = range.end - range.start;
      const segmentStart = {
        x: tunnelStart.x + tangent.x * range.start,
        z: tunnelStart.z + tangent.z * range.start
      };
      const segmentEnd = {
        x: tunnelStart.x + tangent.x * range.end,
        z: tunnelStart.z + tangent.z * range.end
      };
      const segmentCenter = midpoint(segmentStart, segmentEnd);
      const wallStart = {
        x: segmentStart.x + normal.x * side * (tunnelWidth / 2 + TUNNEL_INTERIOR_WALL_THICKNESS / 2),
        z: segmentStart.z + normal.z * side * (tunnelWidth / 2 + TUNNEL_INTERIOR_WALL_THICKNESS / 2)
      };
      const wallEnd = {
        x: segmentEnd.x + normal.x * side * (tunnelWidth / 2 + TUNNEL_INTERIOR_WALL_THICKNESS / 2),
        z: segmentEnd.z + normal.z * side * (tunnelWidth / 2 + TUNNEL_INTERIOR_WALL_THICKNESS / 2)
      };
      const tilePoint = {
        x: segmentCenter.x + normal.x * side * (tunnelWidth / 2 - 0.08),
        z: segmentCenter.z + normal.z * side * (tunnelWidth / 2 - 0.08)
      };
      const rangeSuffix = sideGaps.length > 0 ? `-${rangeIndex}` : '';

      addTransportSegmentObstacle(
        data,
        {
          minX: Math.min(segmentStart.x, segmentEnd.x) - tunnelWidth,
          maxX: Math.max(segmentStart.x, segmentEnd.x) + tunnelWidth,
          minZ: Math.min(segmentStart.z, segmentEnd.z) - tunnelWidth,
          maxZ: Math.max(segmentStart.z, segmentEnd.z) + tunnelWidth
        },
        `${baseId}-interior-wall-${sideLabel}${rangeSuffix}`,
        wallStart,
        wallEnd,
        TUNNEL_INTERIOR_WALL_THICKNESS,
        wallHeight,
        '#636e74',
        wallBaseY,
        { type: 'transportUnderpassWall' }
      );

      if (segmentLength > 8) {
        data.trafficObstacles.push(createTrafficObstacle(
          `${baseId}-tile-band-${sideLabel}${rangeSuffix}`,
          tilePoint.x,
          tilePoint.z,
          tunnelY + 1.18,
          0.08,
          0.62,
          segmentLength - 4,
          '#d2d8d6',
          rotationY,
          { type: 'transportUnderpassWallTile' }
        ));
      }

      data.tunnelColliders.push(createHeightLimitedSegmentCollider(
        `${baseId}-interior-wall-${sideLabel}${rangeSuffix}-collider`,
        'tunnelWall',
        wallStart,
        wallEnd,
        TUNNEL_INTERIOR_WALL_THICKNESS + 0.28,
        wallBaseY,
        wallTopY
      ));
    });

    const markerCount = Math.max(2, Math.floor(tunnelLength / 54));

    for (let index = 0; index <= markerCount; index += 1) {
      const distance = clamp(8 + index * ((tunnelLength - 16) / Math.max(1, markerCount)), 4, tunnelLength - 4);
      if (isDistanceInsideRanges(distance, sideGaps)) continue;

      const marker = {
        x: tunnelStart.x + tangent.x * distance + normal.x * side * reflectorInset,
        z: tunnelStart.z + tangent.z * distance + normal.z * side * reflectorInset
      };

      data.trafficObstacles.push(createTrafficObstacle(
        `${baseId}-wall-reflector-${index}-${sideLabel}`,
        marker.x,
        marker.z,
        tunnelY + 1.05,
        0.16,
        0.24,
        1.05,
        index % 2 === 0 ? '#f7f0c9' : '#e36d5c',
        rotationY,
        { type: 'transportUnderpassReflector' }
      ));
    }
  }
}

function getTransportHighwayAccessWallGaps(tunnelStart, tunnelEnd, tunnelWidth) {
  const tunnelLength = Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z);
  if (tunnelLength <= 1) return null;

  const rangesBySide = {
    [-1]: [],
    [1]: []
  };
  const tangent = normalizeVector({
    x: tunnelEnd.x - tunnelStart.x,
    z: tunnelEnd.z - tunnelStart.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const lateralLimit = tunnelWidth / 2 + TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH + 72;
  const halfOpeningLength = getSurfaceTunnelAccessWallHalfOpeningLength();

  for (const access of getTransportSurfaceTunnelAccessLayouts()) {
    const openingPoint = getSurfaceTunnelAccessWallOpeningPoint(access, tunnelStart, tunnelEnd, tunnelWidth);
    const projection = projectPointToSegment(
      openingPoint.x,
      openingPoint.z,
      tunnelStart.x,
      tunnelStart.z,
      tunnelEnd.x,
      tunnelEnd.z
    );
    if (!projection) continue;

    const dx = openingPoint.x - projection.x;
    const dz = openingPoint.z - projection.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq > lateralLimit * lateralLimit) continue;

    const lateral = dx * normal.x + dz * normal.z;
    const side = Math.sign(lateral) || getSurfaceTunnelAccessLateralSide(access, tunnelStart, tunnelEnd);
    if (Math.abs(lateral) < tunnelWidth / 2 - TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH * 0.8) continue;

    const centerDistance = projection.t * tunnelLength;
    rangesBySide[side].push({
      start: centerDistance - halfOpeningLength,
      end: centerDistance + halfOpeningLength
    });
  }

  return {
    [-1]: mergeBlockedRanges(rangesBySide[-1], tunnelLength),
    [1]: mergeBlockedRanges(rangesBySide[1], tunnelLength)
  };
}

function getSurfaceTunnelAccessWallHalfOpeningLength() {
  return Math.max(
    TRANSPORT_SURFACE_TUNNEL_ACCESS_PORTAL_OPENING_LENGTH * 1.18,
    TRANSPORT_SURFACE_TUNNEL_ACCESS_WIDTH * 6.5
  );
}

function getSurfaceTunnelAccessLateralSide(access, tunnelStart, tunnelEnd) {
  const tunnelTangent = normalizeVector({
    x: tunnelEnd.x - tunnelStart.x,
    z: tunnelEnd.z - tunnelStart.z
  });
  const tunnelNormal = { x: -tunnelTangent.z, z: tunnelTangent.x };
  const center = midpoint(access.rampEnd, access.mergePoint);
  const projection = projectPointToSegment(
    center.x,
    center.z,
    tunnelStart.x,
    tunnelStart.z,
    tunnelEnd.x,
    tunnelEnd.z
  );

  if (projection) {
    const lateral = (center.x - projection.x) * tunnelNormal.x +
      (center.z - projection.z) * tunnelNormal.z;
    if (Math.abs(lateral) > 0.001) return lateral >= 0 ? 1 : -1;
  }

  return access.side >= 0 ? 1 : -1;
}

function getSurfaceTunnelAccessWallOpeningPoint(access, tunnelStart, tunnelEnd, tunnelWidth) {
  const tunnelTangent = normalizeVector({
    x: tunnelEnd.x - tunnelStart.x,
    z: tunnelEnd.z - tunnelStart.z
  });
  const tunnelNormal = { x: -tunnelTangent.z, z: tunnelTangent.x };
  const startProjection = projectPointToSegment(
    access.rampEnd.x,
    access.rampEnd.z,
    tunnelStart.x,
    tunnelStart.z,
    tunnelEnd.x,
    tunnelEnd.z
  );
  const endProjection = projectPointToSegment(
    access.mergePoint.x,
    access.mergePoint.z,
    tunnelStart.x,
    tunnelStart.z,
    tunnelEnd.x,
    tunnelEnd.z
  );
  if (!startProjection || !endProjection) return access.mergePoint;

  const startLateral = (access.rampEnd.x - startProjection.x) * tunnelNormal.x +
    (access.rampEnd.z - startProjection.z) * tunnelNormal.z;
  const endLateral = (access.mergePoint.x - endProjection.x) * tunnelNormal.x +
    (access.mergePoint.z - endProjection.z) * tunnelNormal.z;
  const side = getSurfaceTunnelAccessLateralSide(access, tunnelStart, tunnelEnd);
  const targetLateral = side * (tunnelWidth / 2 + TUNNEL_INTERIOR_WALL_THICKNESS * 0.5);
  const denominator = endLateral - startLateral;
  const t = Math.abs(denominator) > 0.0001
    ? clamp((targetLateral - startLateral) / denominator, 0, 1)
    : 1;

  return lerpPoint(access.rampEnd, access.mergePoint, t);
}

function getTunnelWallVisibleRanges(length, blockedRanges) {
  const visible = [];
  const gaps = mergeBlockedRanges(blockedRanges ?? [], length);
  let cursor = 0;

  for (const gap of gaps) {
    if (gap.start - cursor > 3) {
      visible.push({ start: cursor, end: gap.start });
    }

    cursor = Math.max(cursor, gap.end);
  }

  if (length - cursor > 3) {
    visible.push({ start: cursor, end: length });
  }

  return visible;
}

function isDistanceInsideRanges(distance, ranges) {
  return (ranges ?? []).some((range) => (
    distance >= range.start &&
    distance <= range.end
  ));
}

function addTransportUnderpassExcavation(
  data,
  bounds,
  baseId,
  rampStart,
  tunnelStart,
  tunnelEnd,
  rampEnd,
  tunnelWidth,
  portalWidth,
  tangent,
  normal,
  rotationY
) {
  addTransportUnderpassExcavationEdges(data, bounds, `${baseId}-down`, rampStart, tunnelStart, tunnelWidth, normal);
  addTransportUnderpassExcavationEdges(data, bounds, `${baseId}-up`, tunnelEnd, rampEnd, tunnelWidth, normal);

  const portalFaceWidth = portalWidth + 5.4;
  const faceDepth = 2.8;
  const faceHeight = 0.18;
  const faceY = Math.max(0.04, GROUND_DRIVE_Y - faceHeight - 0.05);
  for (const portal of [
    { id: 'entry', point: tunnelStart, direction: -1 },
    { id: 'exit', point: tunnelEnd, direction: 1 }
  ]) {
    const facePoint = {
      x: portal.point.x + tangent.x * portal.direction * 2.9,
      z: portal.point.z + tangent.z * portal.direction * 2.9
    };

    data.trafficObstacles.push(createTrafficObstacle(
      `${baseId}-excavation-${portal.id}-ground-face`,
      facePoint.x,
      facePoint.z,
      faceY,
      portalFaceWidth,
      faceHeight,
      faceDepth,
      '#68705f',
      rotationY,
      { type: 'transportUnderpassCut' }
    ));
  }
}

function addTransportUnderpassExcavationEdges(data, bounds, id, start, end, tunnelWidth, normal) {
  const edgeOffset = tunnelWidth / 2 + 3.4;
  const baseY = Math.max(0.025, GROUND_DRIVE_Y - TRANSPORT_UNDERPASS_EXCAVATION_LIP_HEIGHT - 0.12);

  for (const side of [-1, 1]) {
    addTransportSegmentObstacle(
      data,
      bounds,
      `${id}-excavation-lip-${side > 0 ? 'right' : 'left'}`,
      {
        x: start.x + normal.x * side * edgeOffset,
        z: start.z + normal.z * side * edgeOffset
      },
      {
        x: end.x + normal.x * side * edgeOffset,
        z: end.z + normal.z * side * edgeOffset
      },
      TRANSPORT_UNDERPASS_EXCAVATION_LIP_THICKNESS,
      TRANSPORT_UNDERPASS_EXCAVATION_LIP_HEIGHT,
      '#69715f',
      baseY,
      { type: 'transportUnderpassCut' }
    );
  }
}

function addTransportUnderpassRampWalls(data, bounds, id, start, end, startY, endY, tunnelWidth, normal, options = {}) {
  const segmentCount = 3;

  for (let index = 0; index < segmentCount; index += 1) {
    const t0 = index / segmentCount;
    const t1 = (index + 1) / segmentCount;
    const midT = (t0 + t1) / 2;
    const sectionStart = lerpPoint(start, end, t0);
    const sectionEnd = lerpPoint(start, end, t1);
    const roadY = lerp(startY, endY, midT);
    if (roadY > GROUND_DRIVE_Y - 2.35) continue;

    const baseY = roadY - 0.12;
    const wallTopY = options.stacked === true
      ? roadY + 2.35
      : GROUND_DRIVE_Y + 0.22;
    const height = Math.max(0.5, wallTopY - baseY);

    for (const side of [-1, 1]) {
      const offset = side * (tunnelWidth / 2 + 1.75);
      addTransportSegmentObstacle(
        data,
        bounds,
        `${id}-retaining-${index}-${side > 0 ? 'right' : 'left'}`,
        {
          x: sectionStart.x + normal.x * offset,
          z: sectionStart.z + normal.z * offset
        },
        {
          x: sectionEnd.x + normal.x * offset,
          z: sectionEnd.z + normal.z * offset
        },
        0.74,
        height,
        '#59636a',
        baseY,
        { type: 'transportUnderpassRetainingWall' }
      );
      data.tunnelColliders.push(createHeightLimitedSegmentCollider(
        `${id}-retaining-${index}-${side > 0 ? 'right' : 'left'}-collider`,
        'tunnelWall',
        {
          x: sectionStart.x + normal.x * offset,
          z: sectionStart.z + normal.z * offset
        },
        {
          x: sectionEnd.x + normal.x * offset,
          z: sectionEnd.z + normal.z * offset
        },
        0.84,
        baseY,
        baseY + height
      ));
    }
  }
}

function addTransportUnderpassLights(data, baseId, tunnelStart, tunnelEnd, tunnelWidth, tunnelY, tangent, normal, rotationY) {
  const tunnelLength = Math.max(Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z), 0.0001);
  const usableLength = Math.max(0, tunnelLength - 18);
  const lightCount = Math.max(3, Math.floor(usableLength / TRANSPORT_UNDERPASS_LIGHT_SPACING));
  const spacing = usableLength / Math.max(1, lightCount - 1);
  const lightY = tunnelY + TUNNEL_CLEARANCE_HEIGHT - 0.46;

  for (let index = 0; index < lightCount; index += 1) {
    const distance = 9 + spacing * index;
    const center = {
      x: tunnelStart.x + tangent.x * distance,
      z: tunnelStart.z + tangent.z * distance
    };

    data.trafficObstacles.push(createTrafficObstacle(
      `${baseId}-ceiling-light-${index}`,
      center.x,
      center.z,
      lightY,
      1.05,
      0.08,
      4.4,
      '#f2d486',
      rotationY,
      { type: 'transportUnderpassLight' }
    ));

    data.trafficObstacles.push(createTrafficObstacle(
      `${baseId}-ceiling-glow-${index}`,
      center.x,
      center.z,
      lightY - 0.34,
      tunnelWidth * 0.7,
      0.05,
      6.8,
      '#f4d98a',
      rotationY,
      { type: 'transportUnderpassLightGlow' }
    ));
  }
}

function addTransportUnderpassRibs(data, baseId, tunnelStart, tunnelEnd, tunnelWidth, tunnelY, tangent, normal, rotationY) {
  const tunnelLength = Math.max(Math.hypot(tunnelEnd.x - tunnelStart.x, tunnelEnd.z - tunnelStart.z), 0.0001);
  const ribCount = Math.max(2, Math.floor(tunnelLength / 46));
  const ribTopBaseY = tunnelY + TUNNEL_CLEARANCE_HEIGHT - 0.24;
  const postHeight = Math.max(TUNNEL_CLEARANCE_HEIGHT, ribTopBaseY - tunnelY);

  for (let index = 0; index <= ribCount; index += 1) {
    const distance = clamp((index / Math.max(1, ribCount)) * tunnelLength, 3, tunnelLength - 3);
    const center = {
      x: tunnelStart.x + tangent.x * distance,
      z: tunnelStart.z + tangent.z * distance
    };

    data.trafficObstacles.push(createTrafficObstacle(
      `${baseId}-rib-top-${index}`,
      center.x,
      center.z,
      ribTopBaseY,
      tunnelWidth + 4.2,
      0.34,
      0.62,
      '#707a7f',
      rotationY,
      { type: 'transportUnderpassRib' }
    ));

    for (const side of [-1, 1]) {
      const wallPoint = {
        x: center.x + normal.x * side * (tunnelWidth / 2 + 1.52),
        z: center.z + normal.z * side * (tunnelWidth / 2 + 1.52)
      };
      if (isPointInsideSurfaceTunnelAccessClearance(wallPoint.x, wallPoint.z, 10)) continue;

      data.trafficObstacles.push(createTrafficObstacle(
        `${baseId}-rib-side-${index}-${side > 0 ? 'right' : 'left'}`,
        wallPoint.x,
        wallPoint.z,
        tunnelY - 0.05,
        0.52,
        postHeight,
        0.62,
        '#68747a',
        rotationY,
        { type: 'transportUnderpassRib' }
      ));
    }
  }
}

function offsetPlanarPoint(point, tangent, normal, forward, lateral) {
  return {
    x: point.x + tangent.x * forward + normal.x * lateral,
    z: point.z + tangent.z * forward + normal.z * lateral
  };
}

function lerpPoint(start, end, t) {
  return {
    x: lerp(start.x, end.x, t),
    z: lerp(start.z, end.z, t)
  };
}

function isOwnedTransportOverpassCrossing(crossing, bounds) {
  const ownsX = crossing.x >= bounds.minX && (
    crossing.x < bounds.maxX || bounds.maxX >= WORLD_SETTINGS.worldMaxX
  );
  const ownsZ = crossing.z >= bounds.minZ && (
    crossing.z < bounds.maxZ || bounds.maxZ >= WORLD_SETTINGS.worldMaxZ
  );

  return ownsX && ownsZ;
}

function resolveTransportOverpassLayout(
  data,
  overpassLine,
  bridgeWidth,
  roadLength,
  crossingDistance,
  deckHalfLength,
  bridgeKey = ''
) {
  const deckY = getTransportOverpassBaseY(overpassLine, bridgeKey);
  const straightLayout = createTransportOverpassLayout(crossingDistance, deckHalfLength, roadLength, { x: 0, z: 0 }, deckY);

  if (!straightLayout) return null;
  if (!doesTransportOverpassNeedHorizontalDetour(data, overpassLine, bridgeWidth)) return straightLayout;

  const detourLayout = findTransportOverpassDetourLayout(
    data,
    overpassLine,
    bridgeWidth,
    roadLength,
    deckHalfLength,
    deckY,
    bridgeKey
  );

  return detourLayout ?? straightLayout;
}

function createTransportOverpassLayout(crossingDistance, deckHalfLength, roadLength, deckOffset, deckY) {
  const rampStartDistance = crossingDistance - deckHalfLength - TRANSPORT_OVERPASS_RAMP_LENGTH;
  const deckStartDistance = crossingDistance - deckHalfLength;
  const deckEndDistance = crossingDistance + deckHalfLength;
  const rampEndDistance = crossingDistance + deckHalfLength + TRANSPORT_OVERPASS_RAMP_LENGTH;

  if (rampStartDistance < -0.01 || rampEndDistance > roadLength + 0.01) return null;

  return {
    crossingDistance,
    deckEndDistance,
    deckOffset,
    deckStartDistance,
    deckY,
    rampEndDistance,
    rampStartDistance
  };
}

function doesTransportOverpassNeedHorizontalDetour(data, overpassLine, bridgeWidth) {
  return getBridgeAvoidanceRoads(data).some((road) => (
    shouldHorizontallyAvoidBridgeRoad(road) &&
    areBridgeRoadsHorizontallyConflicting(overpassLine, bridgeWidth, road, TRANSPORT_OVERPASS_HORIZONTAL_CLEARANCE)
  ));
}

function findTransportOverpassDetourLayout(data, overpassLine, bridgeWidth, roadLength, deckHalfLength, deckY, bridgeKey = '') {
  const tangent = normalizeVector({
    x: overpassLine.end.x - overpassLine.start.x,
    z: overpassLine.end.z - overpassLine.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const sideRoll = hashNumber(
    Math.round(overpassLine.start.x / 25),
    Math.round(overpassLine.start.z / 25),
    bridgeKey.length + 1931
  );
  const signs = sideRoll >= 0.5 ? [1, -1] : [-1, 1];
  const straightLayout = createTransportOverpassLayout(
    getShiftedTransportCrossingDistance(overpassLine, roadLength, { x: 0, z: 0 }),
    deckHalfLength,
    roadLength,
    { x: 0, z: 0 },
    deckY
  );
  const straightScore = straightLayout
    ? scoreTransportOverpassLayoutHorizontalConflict(data, overpassLine, bridgeWidth, straightLayout)
    : Number.POSITIVE_INFINITY;
  let bestLayout = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const offsetDistance of TRANSPORT_OVERPASS_DETOUR_OFFSETS) {
    for (const sign of signs) {
      const deckOffset = {
        x: normal.x * offsetDistance * sign,
        z: normal.z * offsetDistance * sign
      };
      const shiftedCrossingDistance = getShiftedTransportCrossingDistance(overpassLine, roadLength, deckOffset);
      if (!Number.isFinite(shiftedCrossingDistance)) continue;

      const layout = createTransportOverpassLayout(
        shiftedCrossingDistance,
        deckHalfLength,
        roadLength,
        deckOffset,
        deckY
      );

      if (!layout) continue;
      if (!isTransportOverpassLayoutInsideWorld(overpassLine, layout)) continue;
      const score = scoreTransportOverpassLayoutHorizontalConflict(data, overpassLine, bridgeWidth, layout);

      if (score <= 0.001) return layout;
      if (score < bestScore) {
        bestLayout = layout;
        bestScore = score;
      }
    }
  }

  return bestScore < straightScore ? bestLayout : null;
}

function getBridgeAvoidanceRoads(data) {
  return [
    ...data.roads,
    ...(data.bridgeAvoidanceRoads ?? [])
  ];
}

function doBridgeYRangesConflict(a, b) {
  return a.maxY >= b.minY - BRIDGE_VERTICAL_CLEARANCE &&
    a.minY <= b.maxY + BRIDGE_VERTICAL_CLEARANCE;
}

function getTransportOverpassBaseY(overpassLine, bridgeKey = '') {
  return TRANSPORT_OVERPASS_Y;
}

function getShiftedTransportCrossingDistance(overpassLine, roadLength, deckOffset) {
  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const shiftedStart = addPointOffset(overpassLine.start, deckOffset);
  const shiftedEnd = addPointOffset(overpassLine.end, deckOffset);
  const crossing = getLineSegmentIntersection(shiftedStart, shiftedEnd, highwayStart, highwayEnd);

  return crossing ? crossing.t * roadLength : Number.NaN;
}

function isTransportOverpassLayoutInsideWorld(overpassLine, layout) {
  const points = [
    addPointOffset(getPointAlongLine(overpassLine, layout.deckStartDistance), layout.deckOffset),
    addPointOffset(getPointAlongLine(overpassLine, layout.deckEndDistance), layout.deckOffset)
  ];

  return points.every((point) => (
    point.x >= WORLD_SETTINGS.worldMinX - 20 &&
    point.x <= WORLD_SETTINGS.worldMaxX + 20 &&
    point.z >= WORLD_SETTINGS.worldMinZ - 20 &&
    point.z <= WORLD_SETTINGS.worldMaxZ + 20
  ));
}

function doesTransportOverpassLayoutHorizontallyConflict(data, overpassLine, bridgeWidth, layout) {
  return scoreTransportOverpassLayoutHorizontalConflict(data, overpassLine, bridgeWidth, layout) > 0.001;
}

function scoreTransportOverpassLayoutHorizontalConflict(data, overpassLine, bridgeWidth, layout) {
  const segments = getTransportOverpassLayoutAvoidanceSegments(overpassLine, layout);
  let score = 0;

  for (const road of getBridgeAvoidanceRoads(data)) {
    if (!shouldHorizontallyAvoidBridgeRoad(road)) continue;

    for (const segment of segments) {
      const conflictAmount = getBridgeSegmentHorizontalConflictAmount(
        segment.start,
        segment.end,
        bridgeWidth,
        road,
        TRANSPORT_OVERPASS_HORIZONTAL_CLEARANCE
      );
      const bridgeMultiplier = typeof road.kind === 'string' && road.kind.startsWith('transport-overpass')
        ? 3
        : 1;
      const deckMultiplier = segment.role === 'deck' && road.kind === 'transport-overpass-deck'
        ? 5
        : 1;

      score += conflictAmount * bridgeMultiplier * deckMultiplier;
    }
  }

  return score;
}

function getTransportOverpassLayoutAvoidanceSegments(overpassLine, layout) {
  const upStart = getPointAlongLine(overpassLine, layout.rampStartDistance);
  const deckStart = addPointOffset(getPointAlongLine(overpassLine, layout.deckStartDistance), layout.deckOffset);
  const deckEnd = addPointOffset(getPointAlongLine(overpassLine, layout.deckEndDistance), layout.deckOffset);
  const downEnd = getPointAlongLine(overpassLine, layout.rampEndDistance);

  return [
    { role: 'up', start: upStart, end: deckStart },
    { role: 'deck', start: deckStart, end: deckEnd },
    { role: 'down', start: deckEnd, end: downEnd }
  ];
}

function shouldHorizontallyAvoidBridgeRoad(road) {
  if (!isElevatedBridgeRoad(road)) return false;
  if (road.kind === 'transport-overpass-approach') return false;

  return true;
}

function isElevatedBridgeRoad(road) {
  if (!road) return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-underpass')) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || road.roadType === ROAD_TYPES.ramp) return true;
  return typeof road.kind === 'string' && road.kind.includes('overpass');
}

function areBridgeRoadsHorizontallyConflicting(line, width, road, extraClearance = 16) {
  return areBridgeSegmentsHorizontallyConflicting(line.start, line.end, width, road, extraClearance);
}

function areBridgeSegmentsHorizontallyConflicting(start, end, width, road, extraClearance = 16) {
  return getBridgeSegmentHorizontalConflictAmount(start, end, width, road, extraClearance) > 0;
}

function getBridgeSegmentHorizontalConflictAmount(start, end, width, road, extraClearance = 16) {
  const roadLine = getRoadCenterline(road);
  if (!roadLine) return 0;

  const clearance = width / 2 + getRoadCrossWidth(road) / 2 + extraClearance;
  const distance = Math.sqrt(getSegmentDistanceSq(start, end, roadLine.start, roadLine.end));

  return Math.max(0, clearance - distance);
}

function addPointOffset(point, offset) {
  return {
    x: point.x + (offset?.x ?? 0),
    z: point.z + (offset?.z ?? 0)
  };
}

function normalizeOverpassRoadType(roadType) {
  return roadType === 'local' ? 'local' : roadType;
}

function addTransportSlopedRoad(data, id, kind, roadType, start, end, width, startY, endY, options, bounds) {
  const clip = clipLineToBounds(start, end, bounds, width / 2);
  if (!clip) return null;

  const tSpan = Math.max(clip.t1 - clip.t0, 0.0001);
  const clippedStartY = lerp(startY, endY, clip.t0);
  const clippedEndY = lerp(startY, endY, clip.t1);
  const visualStartY = lerp(options?.visualStartY ?? startY, options?.visualEndY ?? endY, clip.t0);
  const visualEndY = lerp(options?.visualStartY ?? startY, options?.visualEndY ?? endY, clip.t1);
  const road = createSlopedTransportRoad(
    id,
    kind,
    roadType,
    clip.start,
    clip.end,
    width,
    clippedStartY,
    clippedEndY,
    {
      ...options,
      visualEndY,
      visualLengthRatio: tSpan,
      visualStartY
    }
  );

  addTransportRoad(data, road);
  return road;
}

function addTransportSmoothSlopedRoad(data, id, kind, roadType, start, end, width, startY, endY, options, bounds, segmentCount = 6) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  const heightDelta = endY - startY;

  if (length <= 0.1 || Math.abs(heightDelta) <= 0.08 || segmentCount <= 1) {
    const road = addTransportSlopedRoad(data, id, kind, roadType, start, end, width, startY, endY, options, bounds);
    return road ? [road] : [];
  }

  const roads = [];
  const visualStartBase = options?.visualStartY ?? startY;
  const visualEndBase = options?.visualEndY ?? endY;

  for (let index = 0; index < segmentCount; index += 1) {
    const t0 = index / segmentCount;
    const t1 = (index + 1) / segmentCount;
    const easedT0 = smootherStep(t0);
    const easedT1 = smootherStep(t1);
    const road = addTransportSlopedRoad(
      data,
      `${id}-smooth-${index}`,
      kind,
      roadType,
      lerpPoint(start, end, t0),
      lerpPoint(start, end, t1),
      width,
      lerp(startY, endY, easedT0),
      lerp(startY, endY, easedT1),
      {
        ...options,
        visualStartY: lerp(visualStartBase, visualEndBase, easedT0),
        visualEndY: lerp(visualStartBase, visualEndBase, easedT1)
      },
      bounds
    );

    if (road) roads.push(road);
  }

  return roads;
}

function addTransportFullSegmentRoad(data, id, kind, roadType, start, end, width, y, options = {}) {
  const road = createSegmentRoad(
    id,
    kind,
    roadType,
    start,
    end,
    width,
    y,
    options
  );

  if (road?.surface && Number.isFinite(options?.surfaceY)) {
    road.surface.y = options.surfaceY;
  }

  addTransportRoad(data, road);
  return road;
}

function addTransportFullSlopedRoad(data, id, kind, roadType, start, end, width, startY, endY, options = {}) {
  const road = createSlopedTransportRoad(id, kind, roadType, start, end, width, startY, endY, options);

  addTransportRoad(data, road);
  return road;
}

function addTransportBridgeJointRoads(data, baseId, joints, roadType = ROAD_TYPES.ramp, kind = 'transport-joint') {
  const seen = new Set();

  for (let index = 0; index < joints.length; index += 1) {
    const joint = joints[index];
    const point = joint?.point;
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z)) continue;

    const key = `${Math.round(point.x * 10)}:${Math.round(point.z * 10)}:${Math.round((joint.y ?? GROUND_DRIVE_Y) * 10)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    addTransportRoad(data, createTransportJointRoad(
      `${baseId}-joint-${index}`,
      kind,
      roadType,
      point,
      Math.max(10, joint.size ?? 16),
      joint.y ?? GROUND_DRIVE_Y
    ));
  }
}

function createTransportJointRoad(id, kind, roadType, point, size, y) {
  return {
    id,
    kind,
    axis: 'joint',
    side: kind,
    marked: false,
    roadType,
    position: [point.x, y + 0.052, point.z],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [size, size],
    visualScale: [size, size],
    centerX: point.x,
    centerZ: point.z,
    width: size,
    depth: size,
    minX: point.x - size / 2,
    maxX: point.x + size / 2,
    minZ: point.z - size / 2,
    maxZ: point.z + size / 2,
    surface: {
      id,
      roadType,
      shape: 'circle',
      centerX: point.x,
      centerZ: point.z,
      radius: size / 2,
      y
    }
  };
}

function createSlopedTransportRoad(id, kind, roadType, start, end, width, startY, endY, options = {}) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  if (length <= 0.1 || width <= 0) return null;

  const visualStartY = options.visualStartY ?? startY;
  const visualEndY = options.visualEndY ?? endY;
  const visualHeightDelta = visualEndY - visualStartY;
  const slopeLength = Math.hypot(length, visualHeightDelta);
  const center = midpoint(start, end);
  const centerY = (visualStartY + visualEndY) / 2;
  const bounds = getSegmentBounds(start, end, width);

  return {
    id,
    kind,
    axis: 'segment',
    side: options.side ?? 'segment',
    marked: options.marked ?? true,
    roadType,
    accessCenterDistance: options.accessCenterDistance ?? null,
    accessFlow: options.accessFlow ?? null,
    accessPairKey: options.accessPairKey ?? null,
    trafficDisabled: options.trafficDisabled ?? false,
    trafficPathPoints: options.trafficPathPoints ?? null,
    position: [center.x, centerY, center.z],
    basis: getRampSurfaceBasis(start, end, visualHeightDelta),
    rotation: getRampSurfaceRotation(start, end, visualHeightDelta),
    scale: [length, width],
    visualScale: [slopeLength, width],
    visualEndY,
    visualStartY,
    centerX: center.x,
    centerZ: center.z,
    width: bounds.width,
    depth: bounds.depth,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    startX: start.x,
    startZ: start.z,
    endX: end.x,
    endZ: end.z,
    length,
    surface: {
      id,
      roadType,
      shape: 'ramp',
      axis: 'segment',
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ,
      centerX: center.x,
      centerZ: center.z,
      width,
      length,
      startX: start.x,
      startZ: start.z,
      endX: end.x,
      endZ: end.z,
      startY,
      endY,
      y: centerY
    }
  };
}

function addTransportTollStation(data, toll, bounds) {
  const tangent = getTransportHighwayTangent();
  const normal = { x: -tangent.z, z: tangent.x };
  const rotationY = Math.atan2(tangent.x, tangent.z);
  const laneCount = 6;
  const roadWidth = TRANSPORT_HIGHWAY.width;
  const roadHalfWidth = roadWidth / 2;
  const plazaWidth = roadWidth - 3.6;
  const plazaLength = 96;
  const canopyDepth = 22;
  const laneWidth = plazaWidth / laneCount;
  const laneIndexes = Array.from({ length: laneCount }, (_, index) => index).filter((laneIndex) => {
    const lateral = getTollLaneLateral(laneIndex, laneCount, laneWidth);
    return isTollElementInsideRoad(lateral, laneWidth * 0.5, roadHalfWidth);
  });

  addTransportTollObstacle(
    data,
    bounds,
    toll,
    tangent,
    normal,
    `${toll.id}-plaza-asphalt`,
    0,
    0,
    roadWidth,
    0.04,
    plazaLength,
    '#343a3f',
    rotationY,
    GROUND_DRIVE_Y + 0.012,
    'tollPlaza'
  );

  for (const laneIndex of laneIndexes) {
    const lateral = getTollLaneLateral(laneIndex, laneCount, laneWidth);
    const isEtcLane = laneIndex === 0 || laneIndex === 1 || laneIndex === laneCount - 2 || laneIndex === laneCount - 1;

    addTransportTollObstacle(
      data,
      bounds,
      toll,
      tangent,
      normal,
      `${toll.id}-lane-${laneIndex}-surface`,
      0,
      lateral,
      laneWidth * 0.82,
      0.035,
      plazaLength - 14,
      isEtcLane ? '#277a55' : '#4a5052',
      rotationY,
      GROUND_DRIVE_Y + 0.06,
      'tollLane'
    );

    addTransportTollObstacle(
      data,
      bounds,
      toll,
      tangent,
      normal,
      `${toll.id}-lane-${laneIndex}-approach-mark`,
      -34,
      lateral,
      laneWidth * 0.48,
      0.04,
      14,
      isEtcLane ? '#7fd08a' : '#f2d486',
      rotationY,
      GROUND_DRIVE_Y + 0.11,
      'tollLaneMark'
    );

    addTransportTollObstacle(
      data,
      bounds,
      toll,
      tangent,
      normal,
      `${toll.id}-booth-${laneIndex}`,
      2,
      lateral,
      laneWidth * 0.42,
      3.4,
      4.8,
      isEtcLane ? '#75b7d8' : '#d1bb78',
      rotationY,
      GROUND_DRIVE_Y + 0.08,
      'tollBooth'
    );
  }

  for (let dividerIndex = 1; dividerIndex < laneCount; dividerIndex += 1) {
    const lateral = (dividerIndex - laneCount / 2) * laneWidth;
    if (!isTollElementInsideRoad(lateral, 0.18, roadHalfWidth)) continue;

    addTransportTollObstacle(
      data,
      bounds,
      toll,
      tangent,
      normal,
      `${toll.id}-lane-divider-${dividerIndex}`,
      0,
      lateral,
      0.28,
      0.045,
      plazaLength - 10,
      '#e7dfc9',
      rotationY,
      GROUND_DRIVE_Y + 0.12,
      'tollLaneDivider'
    );
  }

  const pillarLaterals = [-roadHalfWidth + 3.2, -laneWidth * 1.5, laneWidth * 1.5, roadHalfWidth - 3.2]
    .filter((lateral) => isTollElementInsideRoad(lateral, 0.45, roadHalfWidth));

  for (const lateral of pillarLaterals) {
    for (const forward of [-canopyDepth / 2 + 2.8, canopyDepth / 2 - 2.8]) {
      addTransportTollObstacle(
        data,
        bounds,
        toll,
        tangent,
        normal,
        `${toll.id}-canopy-pillar-${Math.round(lateral)}-${Math.round(forward)}`,
        forward,
        lateral,
        0.6,
        6.2,
        0.6,
        '#dfe8e7',
        rotationY,
        GROUND_DRIVE_Y + 0.08,
        'tollCanopyPillar'
      );
    }
  }

  addTransportTollObstacle(
    data,
    bounds,
    toll,
    tangent,
    normal,
    `${toll.id}-canopy-roof`,
    0,
    0,
    plazaWidth + 2,
    0.82,
    canopyDepth,
    '#75a7c5',
    rotationY,
    GROUND_DRIVE_Y + 6.9,
    'tollCanopy'
  );

  addTransportTollObstacle(
    data,
    bounds,
    toll,
    tangent,
    normal,
    `${toll.id}-canopy-front-band`,
    -canopyDepth / 2 - 0.6,
    0,
    plazaWidth + 2,
    1.15,
    0.8,
    '#2f6e95',
    rotationY,
    GROUND_DRIVE_Y + 6.15,
    'tollCanopyFascia'
  );

  addTransportTollObstacle(
    data,
    bounds,
    toll,
    tangent,
    normal,
    `${toll.id}-canopy-back-band`,
    canopyDepth / 2 + 0.6,
    0,
    plazaWidth + 2,
    1.15,
    0.8,
    '#2f6e95',
    rotationY,
    GROUND_DRIVE_Y + 6.15,
    'tollCanopyFascia'
  );

  addTransportRoadSign(data, bounds, {
    id: `${toll.id}-sign`,
    text: `${toll.label.toUpperCase()}  ETC  CASH`,
    position: [toll.point.x, 6.95, toll.point.z],
    rotation: [0, rotationY, 0],
    scale: [14.8, 2.3, 0.24],
    color: '#2f6e95'
  });
}

function getTollLaneLateral(laneIndex, laneCount, laneWidth) {
  return (laneIndex - (laneCount - 1) / 2) * laneWidth;
}

function isTollElementInsideRoad(lateral, halfWidth, roadHalfWidth) {
  return Math.abs(lateral) + halfWidth <= roadHalfWidth - 0.7;
}

function addTransportTollObstacle(data, bounds, toll, tangent, normal, id, forward, lateral, width, height, depth, color, rotationY, baseY, type) {
  const x = toll.point.x + tangent.x * forward + normal.x * lateral;
  const z = toll.point.z + tangent.z * forward + normal.z * lateral;

  addTransportTrafficObstacle(
    data,
    bounds,
    createTrafficObstacle(
      id,
      x,
      z,
      baseY,
      width,
      height,
      depth,
      color,
      rotationY,
      { type }
    )
  );
}

const BAOTOU_AIRPORT_RUNWAY = {
  id: '13-31',
  start: { x: -7350, z: 4750 },
  end: { x: -5550, z: 6550 },
  width: 68
};
const BAOTOU_AIRPORT_CENTER = {
  x: (BAOTOU_AIRPORT_RUNWAY.start.x + BAOTOU_AIRPORT_RUNWAY.end.x) / 2,
  z: (BAOTOU_AIRPORT_RUNWAY.start.z + BAOTOU_AIRPORT_RUNWAY.end.z) / 2
};
const AIRPORT_TERMINAL_SIDE = -1;
const AIRPORT_FENCE_HEIGHT = 3.0;
const AIRPORT_PAVEMENT_BASE_Y = 0.044;
const AIRPORT_MARKING_BASE_Y = 0.108;
const AIRPORT_GATE_STANDS = [
  { id: 'a1', label: 'Gate A1', forward: -520, livery: '#d9d3ff' },
  { id: 'a2', label: 'Gate A2', forward: -240, livery: '#75b7d8' },
  { id: 'a3', label: 'Gate A3', forward: 80, livery: '#f2d486' },
  { id: 'a4', label: 'Gate A4', forward: 400, livery: '#e7edf1' }
];
const AIRPORT_TAXIWAY_CONNECTORS = [-930, -420, 140, 820];

function addAirportHub(data, bounds, chunkX, chunkZ) {
  const hub = TRANSPORT_HUBS.airport;
  if (!doBoundsOverlap(bounds, hub.bounds)) return;

  addBaotouAirportPavements(data, bounds);
  addBaotouAirportLandsideRoads(data, bounds, chunkX, chunkZ, hub);

  if (FAST_ROADS_UNDERGROUND) {
    addTransportSegmentRoad(data, 'airport-highway-ground-connector', 'airport-highway-connector', ROAD_TYPES.mainRoad, hub.gate, hub.terminalGate, 18, GROUND_DRIVE_Y, {
      side: 'airport-highway-connector',
      marked: true,
      trafficDisabled: true
    }, bounds, chunkX, chunkZ);
  }
  if (!FAST_ROADS_UNDERGROUND) {
    addTerminalElevatedAccess(data, bounds, chunkX, chunkZ, 'airport-terminal-viaduct', [
      { x: -5520, z: 4740, y: TERMINAL_ELEVATED_ACCESS_Y },
      { x: -5620, z: 4920, y: TERMINAL_ELEVATED_ACCESS_Y },
      { x: -5700, z: 5140, y: TERMINAL_ELEVATED_ACCESS_Y },
      { x: -5650, z: 5260, y: TERMINAL_ELEVATED_ACCESS_Y }
    ], 14);
  }

  addBaotouAirportBuildings(data, bounds);

  addAirportRunwayMarkings(data, bounds);
  addAirportTaxiwayMarkings(data, bounds);
  addAirportTerminalDetails(data, bounds);
  addAirportApronDetails(data, bounds);
  addAirportGroundServiceEquipment(data, bounds);
  addAirportAirfieldLights(data, bounds);
  addAirportTowerDetails(data, bounds);
  addAirportHangarDetails(data, bounds);
  addAirportEntranceDetails(data, bounds);
  addAirportPerimeterFence(data, bounds);

  addAirportWayfindingSigns(data, bounds);

  addBaotouAirportAircraft(data, bounds);
  addTransportSafeSpawn(data, bounds, chunkX, chunkZ, 'airport-spawn', hub.spawn, 'airport');
}

function addBaotouAirportPavements(data, bounds) {
  addAirportPlanSegment(data, bounds, 'airport-runway-safety-strip', -1348, 1348, 0, 126, '#29332b', 'airportRunwayShoulder', AIRPORT_PAVEMENT_BASE_Y - 0.012);
  addAirportPlanSegment(data, bounds, 'airport-runway-13-31', -1285, 1285, 0, BAOTOU_AIRPORT_RUNWAY.width, '#182024', 'airportRunway');
  addAirportPlanSegment(data, bounds, 'airport-runway-left-shoulder', -1305, 1305, -51, 22, '#273136', 'airportRunwayShoulder', AIRPORT_PAVEMENT_BASE_Y - 0.006);
  addAirportPlanSegment(data, bounds, 'airport-runway-right-shoulder', -1305, 1305, 51, 22, '#273136', 'airportRunwayShoulder', AIRPORT_PAVEMENT_BASE_Y - 0.006);
  addAirportPlanSegment(data, bounds, 'airport-runway-blast-pad-31', -1415, -1300, 0, 62, '#252b2e', 'airportRunwayShoulder', AIRPORT_PAVEMENT_BASE_Y - 0.004);
  addAirportPlanSegment(data, bounds, 'airport-runway-blast-pad-13', 1300, 1415, 0, 62, '#252b2e', 'airportRunwayShoulder', AIRPORT_PAVEMENT_BASE_Y - 0.004);
  addAirportPlanSegment(data, bounds, 'airport-parallel-taxiway-terminal', -1190, 1190, AIRPORT_TERMINAL_SIDE * 230, 34, '#3b4246', 'airportTaxiway');
  addAirportPlanSegment(data, bounds, 'airport-terminal-apron', -665, 725, AIRPORT_TERMINAL_SIDE * 395, 292, '#454b4f', 'airportApron');
  addAirportPlanSegment(data, bounds, 'airport-cargo-apron', 720, 1135, AIRPORT_TERMINAL_SIDE * 418, 210, '#41494e', 'airportApron');
  addAirportPlanSegment(data, bounds, 'airport-maintenance-apron', -1135, -720, AIRPORT_TERMINAL_SIDE * 392, 190, '#41494e', 'airportApron');

  for (const forward of AIRPORT_TAXIWAY_CONNECTORS) {
    addAirportPlanCrossSegment(
      data,
      bounds,
      `airport-cross-taxiway-${forward}`,
      forward,
      AIRPORT_TERMINAL_SIDE * 42,
      AIRPORT_TERMINAL_SIDE * 242,
      23,
      '#363e42',
      'airportTaxiway'
    );
  }

  addAirportCurvedTaxiway(data, bounds, 'airport-curved-taxiway-a', [
    [-1080, AIRPORT_TERMINAL_SIDE * 230],
    [-1015, AIRPORT_TERMINAL_SIDE * 286],
    [-905, AIRPORT_TERMINAL_SIDE * 315],
    [-790, AIRPORT_TERMINAL_SIDE * 345]
  ], 27, '#3b4246', 'airportTaxiway');
  addAirportCurvedTaxiway(data, bounds, 'airport-curved-taxiway-b', [
    [-520, AIRPORT_TERMINAL_SIDE * 230],
    [-455, AIRPORT_TERMINAL_SIDE * 292],
    [-340, AIRPORT_TERMINAL_SIDE * 330],
    [-210, AIRPORT_TERMINAL_SIDE * 350]
  ], 27, '#3b4246', 'airportTaxiway');
  addAirportCurvedTaxiway(data, bounds, 'airport-curved-taxiway-c', [
    [250, AIRPORT_TERMINAL_SIDE * 230],
    [325, AIRPORT_TERMINAL_SIDE * 294],
    [452, AIRPORT_TERMINAL_SIDE * 330],
    [610, AIRPORT_TERMINAL_SIDE * 352]
  ], 27, '#3b4246', 'airportTaxiway');
}

function addBaotouAirportLandsideRoads(data, bounds, chunkX, chunkZ, hub) {
  const roads = [
    ['airport-terminal-front-road', 'x', -5795, 5045, 610, 13],
    ['airport-terminal-departures-lane', 'x', -5795, 5012, 545, 9],
    ['airport-terminal-arrivals-lane', 'x', -5795, 4982, 510, 9],
    ['airport-terminal-north-service', 'z', -6100, 5355, 12, 330],
    ['airport-terminal-east-service', 'z', -5485, 5200, 11, 355],
    ['airport-parking-access-road', 'x', -6020, 4868, 420, 10]
  ];

  for (const [id, axis, x, z, width, depth] of roads) {
    addTransportRectRoad(data, id, 'airport-loop', ROAD_TYPES.groundRoad, x, z, width, depth, {
      axis,
      side: 'airport-loop',
      marked: true,
      trafficDisabled: true
    }, bounds, chunkX, chunkZ);
  }

  const accessSegments = [
    ['airport-access-terminal-gate-east', hub.terminalGate, { x: -5520, z: 5045 }, 12],
    ['airport-access-terminal-gate-west', hub.terminalGate, { x: -6080, z: 5045 }, 12],
    ['airport-access-from-highway', hub.gate, { x: -5520, z: 5045 }, 14]
  ];

  for (const [id, start, end, width] of accessSegments) {
    addTransportSegmentRoad(data, id, 'airport-loop', ROAD_TYPES.groundRoad, start, end, width, GROUND_DRIVE_Y, {
      side: 'airport-loop',
      marked: true,
      trafficDisabled: true
    }, bounds, chunkX, chunkZ);
  }

  const parkingLots = [
    ['airport-open-parking-west', -6080, 4898, 280, 126],
    ['airport-taxi-hold-lot', -5538, 4890, 118, 78],
    ['airport-car-meet-photo-bay', -6315, 5010, 118, 66]
  ];

  for (const [id, x, z, width, depth] of parkingLots) {
    const parking = addTransportRectRoad(data, id, 'airport-parking', ROAD_TYPES.parking, x, z, width, depth, {
      axis: 'parking',
      side: 'airport-parking',
      marked: false,
      trafficDisabled: true
    }, bounds, chunkX, chunkZ);

    if (parking) data.parkingMarks.push(...createParkingMarks(parking));
  }
}

function addBaotouAirportBuildings(data, bounds) {
  const buildings = [
    ['airport-main-terminal', -5865, 5215, 430, 30, 78, '#5f7580', 'airportTerminal'],
    ['airport-terminal-west-pier', -6135, 5315, 225, 18, 48, '#7898a8', 'airportTerminal'],
    ['airport-terminal-east-pier', -5595, 5128, 225, 18, 48, '#7898a8', 'airportTerminal'],
    ['airport-ground-transport-hall', -5750, 4990, 250, 21, 82, '#c28f69', 'airportTransitHub'],
    ['airport-terminal-parking-garage', -5515, 4930, 260, 18, 118, '#6f8490', 'airportParkingGarage'],
    ['airport-cargo-terminal', -5510, 5775, 220, 18, 88, '#c28f69', 'airportCargo'],
    ['airport-maintenance-hangar-west', -6750, 5155, 265, 31, 142, '#aeb8b8', 'airportHangar'],
    ['airport-maintenance-hangar-east', -5300, 5980, 245, 31, 138, '#aeb8b8', 'airportHangar'],
    ['airport-control-tower-shaft', -6080, 5090, 24, 82, 24, '#6f8490', 'controlTower']
  ];

  for (const [id, x, z, width, height, depth, color, kind] of buildings) {
    addTransportBuilding(data, bounds, createTransportBuilding(id, x, z, width, height, depth, color, kind));
  }
}

function getAirportPlanPose() {
  const tangent = normalizeVector({
    x: BAOTOU_AIRPORT_RUNWAY.end.x - BAOTOU_AIRPORT_RUNWAY.start.x,
    z: BAOTOU_AIRPORT_RUNWAY.end.z - BAOTOU_AIRPORT_RUNWAY.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };

  return {
    center: BAOTOU_AIRPORT_CENTER,
    length: Math.hypot(
      BAOTOU_AIRPORT_RUNWAY.end.x - BAOTOU_AIRPORT_RUNWAY.start.x,
      BAOTOU_AIRPORT_RUNWAY.end.z - BAOTOU_AIRPORT_RUNWAY.start.z
    ),
    normal,
    tangent,
    yaw: getSegmentBoxYaw(BAOTOU_AIRPORT_RUNWAY.start, BAOTOU_AIRPORT_RUNWAY.end)
  };
}

function getAirportPlanPoint(forward, lateral) {
  const pose = getAirportPlanPose();
  return offsetPlanarPoint(pose.center, pose.tangent, pose.normal, forward, lateral);
}

function addAirportPlanSegment(
  data,
  bounds,
  id,
  forwardStart,
  forwardEnd,
  lateral,
  width,
  color,
  type,
  baseY = AIRPORT_PAVEMENT_BASE_Y,
  height = 0.055
) {
  addTransportSegmentObstacle(
    data,
    bounds,
    id,
    getAirportPlanPoint(forwardStart, lateral),
    getAirportPlanPoint(forwardEnd, lateral),
    width,
    height,
    color,
    baseY,
    { type }
  );
}

function addAirportPlanCrossSegment(
  data,
  bounds,
  id,
  forward,
  lateralStart,
  lateralEnd,
  width,
  color,
  type,
  baseY = AIRPORT_PAVEMENT_BASE_Y,
  height = 0.055
) {
  addTransportSegmentObstacle(
    data,
    bounds,
    id,
    getAirportPlanPoint(forward, lateralStart),
    getAirportPlanPoint(forward, lateralEnd),
    width,
    height,
    color,
    baseY,
    { type }
  );
}

function addAirportCurvedTaxiway(data, bounds, id, controlPoints, width, color, type, baseY = AIRPORT_PAVEMENT_BASE_Y, height = 0.055) {
  for (let index = 0; index < controlPoints.length - 1; index += 1) {
    const [startForward, startLateral] = controlPoints[index];
    const [endForward, endLateral] = controlPoints[index + 1];
    addTransportSegmentObstacle(
      data,
      bounds,
      `${id}-${index}`,
      getAirportPlanPoint(startForward, startLateral),
      getAirportPlanPoint(endForward, endLateral),
      width,
      height,
      color,
      baseY,
      { type }
    );
  }
}

function addAirportPlanBox(
  data,
  bounds,
  id,
  forward,
  lateral,
  width,
  height,
  depth,
  color,
  baseY = AIRPORT_MARKING_BASE_Y,
  type = 'airportDetail',
  rotationOffset = 0
) {
  const point = getAirportPlanPoint(forward, lateral);
  addTransportRectObstacle(data, id, point.x, point.z, width, height, depth, color, bounds, {
    baseY,
    rotationY: getAirportPlanPose().yaw + rotationOffset,
    type
  });
}

function addAirportPlanBuildingSegment(data, bounds, id, forwardStart, forwardEnd, lateral, width, height, color, type) {
  addTransportSegmentObstacle(
    data,
    bounds,
    id,
    getAirportPlanPoint(forwardStart, lateral),
    getAirportPlanPoint(forwardEnd, lateral),
    width,
    height,
    color,
    0.08,
    { type }
  );
}

function addAirportRunwayMarkings(data, bounds) {
  const halfLength = getAirportPlanPose().length / 2;

  for (const lateral of [-BAOTOU_AIRPORT_RUNWAY.width / 2 + 2.8, BAOTOU_AIRPORT_RUNWAY.width / 2 - 2.8]) {
    addAirportPlanSegment(
      data,
      bounds,
      `airport-runway-${BAOTOU_AIRPORT_RUNWAY.id}-edge-${lateral}`,
      -halfLength + 42,
      halfLength - 42,
      lateral,
      0.82,
      '#f2f0dc',
      'airportRunwayMark',
      AIRPORT_MARKING_BASE_Y,
      0.034
    );
  }

  for (let forward = -halfLength + 170; forward <= halfLength - 170; forward += 126) {
    addAirportPlanSegment(
      data,
      bounds,
      `airport-runway-${BAOTOU_AIRPORT_RUNWAY.id}-center-${Math.round(forward)}`,
      forward - 21,
      forward + 21,
      0,
      0.92,
      '#e7edf1',
      'airportRunwayMark',
      AIRPORT_MARKING_BASE_Y,
      0.035
    );
  }

  for (const [label, forward, sign] of [
    ['31', -halfLength + 54, 1],
    ['13', halfLength - 54, -1]
  ]) {
    addAirportPlanCrossSegment(
      data,
      bounds,
      `airport-runway-${BAOTOU_AIRPORT_RUNWAY.id}-threshold-${label}-bar`,
      forward,
      -BAOTOU_AIRPORT_RUNWAY.width / 2 + 5,
      BAOTOU_AIRPORT_RUNWAY.width / 2 - 5,
      3.8,
      '#e7edf1',
      'airportRunwayMark',
      AIRPORT_MARKING_BASE_Y,
      0.035
    );

    for (const lateral of [-23, -14, -5, 5, 14, 23]) {
      addAirportPlanSegment(
        data,
        bounds,
        `airport-runway-${BAOTOU_AIRPORT_RUNWAY.id}-threshold-${label}-${lateral}`,
        forward + sign * 18,
        forward + sign * 46,
        lateral,
        2.2,
        '#e7edf1',
        'airportRunwayMark',
        AIRPORT_MARKING_BASE_Y,
        0.035
      );
    }

    addAirportRunwayNumber(data, bounds, label, forward + sign * 95, sign);
  }

  for (const forward of [-halfLength + 255, halfLength - 255]) {
    for (const lateral of [-10, 10]) {
      addAirportPlanSegment(
        data,
        bounds,
        `airport-runway-${BAOTOU_AIRPORT_RUNWAY.id}-aiming-${Math.round(forward)}-${lateral}`,
        forward - 32,
        forward + 32,
        lateral,
        5.2,
        '#f2f0dc',
        'airportRunwayMark',
        AIRPORT_MARKING_BASE_Y,
        0.035
      );
    }
  }

  for (const forward of [-halfLength + 360, -halfLength + 500, halfLength - 500, halfLength - 360]) {
    for (const lateral of [-15, 15]) {
      addAirportPlanSegment(
        data,
        bounds,
        `airport-runway-${BAOTOU_AIRPORT_RUNWAY.id}-touchdown-${Math.round(forward)}-${lateral}`,
        forward - 36,
        forward + 36,
        lateral,
        2.2,
        '#d7d0bb',
        'airportRunwayMark',
        AIRPORT_MARKING_BASE_Y,
        0.035
      );
    }
  }
}

function addAirportRunwayNumber(data, bounds, label, forward, directionSign) {
  const digits = String(label).padStart(2, '0').slice(0, 2).split('');
  const digitSpacing = 15;

  digits.forEach((digit, digitIndex) => {
    const lateralBase = (digitIndex - 0.5) * digitSpacing;
    addAirportSevenSegmentDigit(
      data,
      bounds,
      `airport-runway-number-${label}-${digitIndex}`,
      digit,
      forward,
      lateralBase,
      directionSign
    );
  });
}

function addAirportSevenSegmentDigit(data, bounds, id, digit, forward, lateral, directionSign) {
  const segmentMap = {
    0: ['top', 'upperLeft', 'upperRight', 'lowerLeft', 'lowerRight', 'bottom'],
    1: ['upperRight', 'lowerRight'],
    2: ['top', 'upperRight', 'middle', 'lowerLeft', 'bottom'],
    3: ['top', 'upperRight', 'middle', 'lowerRight', 'bottom'],
    4: ['upperLeft', 'upperRight', 'middle', 'lowerRight'],
    5: ['top', 'upperLeft', 'middle', 'lowerRight', 'bottom'],
    6: ['top', 'upperLeft', 'middle', 'lowerLeft', 'lowerRight', 'bottom'],
    7: ['top', 'upperRight', 'lowerRight'],
    8: ['top', 'upperLeft', 'upperRight', 'middle', 'lowerLeft', 'lowerRight', 'bottom'],
    9: ['top', 'upperLeft', 'upperRight', 'middle', 'lowerRight', 'bottom']
  };
  const activeSegments = segmentMap[digit] ?? segmentMap[0];
  const forwardFlip = directionSign < 0 ? -1 : 1;
  const specs = {
    top: { f: 11.2 * forwardFlip, l: 0, w: 2.2, d: 10.8 },
    middle: { f: 0, l: 0, w: 2.2, d: 10.2 },
    bottom: { f: -11.2 * forwardFlip, l: 0, w: 2.2, d: 10.8 },
    upperLeft: { f: 5.6 * forwardFlip, l: -5.6, w: 10.6, d: 2.2 },
    upperRight: { f: 5.6 * forwardFlip, l: 5.6, w: 10.6, d: 2.2 },
    lowerLeft: { f: -5.6 * forwardFlip, l: -5.6, w: 10.6, d: 2.2 },
    lowerRight: { f: -5.6 * forwardFlip, l: 5.6, w: 10.6, d: 2.2 }
  };

  for (const segmentName of activeSegments) {
    const spec = specs[segmentName];
    addAirportPlanBox(
      data,
      bounds,
      `${id}-${segmentName}`,
      forward + spec.f,
      lateral + spec.l,
      spec.w,
      0.036,
      spec.d,
      '#f2f0dc',
      AIRPORT_MARKING_BASE_Y + 0.006,
      'airportRunwayMark'
    );
  }
}

function addAirportTaxiwayMarkings(data, bounds) {
  const taxiYellow = '#f2d486';

  addAirportPlanSegment(
    data,
    bounds,
    'airport-taxi-line-parallel-terminal',
    -1150,
    1150,
    AIRPORT_TERMINAL_SIDE * 230,
    0.64,
    taxiYellow,
    'airportTaxiwayMark',
    AIRPORT_MARKING_BASE_Y,
    0.035
  );

  for (const forward of AIRPORT_TAXIWAY_CONNECTORS) {
    addAirportPlanCrossSegment(
      data,
      bounds,
      `airport-taxi-line-cross-${forward}`,
      forward,
      AIRPORT_TERMINAL_SIDE * 42,
      AIRPORT_TERMINAL_SIDE * 242,
      0.64,
      taxiYellow,
      'airportTaxiwayMark',
      AIRPORT_MARKING_BASE_Y,
      0.035
    );
  }

  for (const [id, controlPoints] of [
    ['airport-taxi-line-curve-a', [[-1080, AIRPORT_TERMINAL_SIDE * 230], [-1015, AIRPORT_TERMINAL_SIDE * 286], [-905, AIRPORT_TERMINAL_SIDE * 315], [-790, AIRPORT_TERMINAL_SIDE * 345]]],
    ['airport-taxi-line-curve-b', [[-520, AIRPORT_TERMINAL_SIDE * 230], [-455, AIRPORT_TERMINAL_SIDE * 292], [-340, AIRPORT_TERMINAL_SIDE * 330], [-210, AIRPORT_TERMINAL_SIDE * 350]]],
    ['airport-taxi-line-curve-c', [[250, AIRPORT_TERMINAL_SIDE * 230], [325, AIRPORT_TERMINAL_SIDE * 294], [452, AIRPORT_TERMINAL_SIDE * 330], [610, AIRPORT_TERMINAL_SIDE * 352]]]
  ]) {
    addAirportCurvedTaxiway(data, bounds, id, controlPoints, 0.64, taxiYellow, 'airportTaxiwayMark', AIRPORT_MARKING_BASE_Y, 0.035);
  }

  for (const { forward, id } of AIRPORT_GATE_STANDS) {
    addAirportPlanCrossSegment(
      data,
      bounds,
      `airport-stand-lead-${forward}`,
      forward,
      AIRPORT_TERMINAL_SIDE * 268,
      AIRPORT_TERMINAL_SIDE * 455,
      0.58,
      taxiYellow,
      'airportTaxiwayMark',
      AIRPORT_MARKING_BASE_Y,
      0.035
    );
    addAirportPlanSegment(
      data,
      bounds,
      `airport-stand-stop-${id}`,
      forward - 18,
      forward + 18,
      AIRPORT_TERMINAL_SIDE * 455,
      3.8,
      taxiYellow,
      'airportTaxiwayMark',
      AIRPORT_MARKING_BASE_Y,
      0.035
    );

    addAirportPlanBox(
      data,
      bounds,
      `airport-stand-safety-box-${id}-front`,
      forward + 42,
      AIRPORT_TERMINAL_SIDE * 470,
      0.58,
      0.034,
      72,
      '#f2d486',
      AIRPORT_MARKING_BASE_Y,
      'airportTaxiwayMark'
    );
    addAirportPlanBox(
      data,
      bounds,
      `airport-stand-safety-box-${id}-rear`,
      forward - 42,
      AIRPORT_TERMINAL_SIDE * 470,
      0.58,
      0.034,
      72,
      '#f2d486',
      AIRPORT_MARKING_BASE_Y,
      'airportTaxiwayMark'
    );
  }

  addAirportTaxiwaySigns(data, bounds);
}

function addAirportTerminalDetails(data, bounds) {
  const bridgeColor = '#b8c1c7';

  for (const [id, startForward, endForward, lateral, width, height, color] of [
    ['airport-terminal-concourse-center', -590, 705, AIRPORT_TERMINAL_SIDE * 520, 48, 18, '#7898a8'],
    ['airport-terminal-concourse-west', -660, -325, AIRPORT_TERMINAL_SIDE * 438, 42, 15, '#6f8fa0'],
    ['airport-terminal-concourse-mid', -120, 220, AIRPORT_TERMINAL_SIDE * 438, 42, 15, '#6f8fa0'],
    ['airport-terminal-concourse-east', 420, 735, AIRPORT_TERMINAL_SIDE * 438, 42, 15, '#6f8fa0']
  ]) {
    addAirportPlanBuildingSegment(data, bounds, id, startForward, endForward, lateral, width, height, color, 'airportTerminalConcourse');
  }

  for (const { id, label, forward } of AIRPORT_GATE_STANDS) {
    const bridgeId = `airport-jetbridge-${id}`;
    const start = getAirportPlanPoint(forward, AIRPORT_TERMINAL_SIDE * 500);
    const end = getAirportPlanPoint(forward, AIRPORT_TERMINAL_SIDE * 438);
    const center = midpoint(start, end);
    const yaw = getSegmentBoxYaw(start, end);
    addTransportSegmentObstacle(data, bounds, bridgeId, start, end, 5.4, 3.1, bridgeColor, 2.8, {
      type: 'airportJetbridge'
    });
    addTransportRectObstacle(data, `${bridgeId}-gate-head`, end.x, end.z, 10.5, 4.2, 7.4, '#d4dde2', bounds, {
      baseY: 1.7,
      rotationY: yaw,
      type: 'airportJetbridge'
    });
    addTransportRectObstacle(data, `${bridgeId}-support`, center.x, center.z, 1.5, 2.9, 1.5, '#87939a', bounds, {
      baseY: 0.08,
      type: 'airportJetbridgeSupport'
    });
    addTransportRectObstacle(data, `${bridgeId}-wheel-bogie`, center.x, center.z, 6.2, 0.55, 1.2, '#2d3438', bounds, {
      baseY: 0.18,
      rotationY: yaw,
      type: 'airportJetbridgeSupport'
    });
    addAirportPlanRoadSign(data, bounds, `airport-${id}-gate-sign`, label, forward, AIRPORT_TERMINAL_SIDE * 513, 5.9, [4.8, 1.3, 0.18], '#203b49', 0);
  }

  const greenStationPlacement = getMetroStationPlacementById('green', 'green-airport-transfer');
  if (greenStationPlacement) {
    const stationPoint = greenStationPlacement.point;
    const stationY = greenStationPlacement.elevatedY ?? METRO_AIRPORT_GREEN_TERMINAL_ELEVATED_Y;
    const terminalDoor = getAirportPlanPoint(150, AIRPORT_TERMINAL_SIDE * 700);
    addTransportSegmentObstacle(
      data,
      bounds,
      'airport-green-terminal-metro-walkway',
      stationPoint,
      terminalDoor,
      9.2,
      0.56,
      '#9fd08c',
      stationY + 0.72,
      { type: 'airportMetroConnector' }
    );
    addTransportSegmentObstacle(
      data,
      bounds,
      'airport-green-terminal-metro-walkway-roof',
      stationPoint,
      terminalDoor,
      10.4,
      0.44,
      '#5f7580',
      stationY + 4.95,
      { type: 'airportMetroConnectorRoof' }
    );
    addTransportRectObstacle(data, 'airport-green-terminal-elevator-core', terminalDoor.x, terminalDoor.z - 16, 14, 22.2, 14, '#6f8fa0', bounds, {
      baseY: 0.08,
      type: 'airportMetroConnector'
    });
    addTransportRectObstacle(data, 'airport-green-terminal-station-headhouse', stationPoint.x, stationPoint.z, 20, 7.6, 16, '#7898a8', bounds, {
      baseY: stationY + 0.84,
      rotationY: greenStationPlacement.yaw,
      type: 'airportMetroConnector'
    });
  }

  addTransportRectObstacle(data, 'airport-terminal-glass-front', -5865, 5176, 382, 7.2, 5.6, '#d9d3ff', bounds);
  addTransportRectObstacle(data, 'airport-terminal-glass-upper', -5865, 5256, 392, 5.8, 4.2, '#c4e4ea', bounds, {
    baseY: 16.4,
    type: 'airportTerminalGlass'
  });
  addTransportRectObstacle(data, 'airport-terminal-dropoff-canopy', -5795, 5065, 520, 4.2, 22, '#68737a', bounds);
  addTransportRectObstacle(data, 'airport-terminal-transport-roof', -5750, 4990, 235, 4.8, 88, '#58646a', bounds, {
    baseY: 7.0,
    type: 'airportTransitRoof'
  });
  addTransportRectObstacle(data, 'airport-terminal-metal-roof', -5865, 5215, 452, 2.2, 92, '#4f5c61', bounds, {
    baseY: 29.7,
    type: 'airportTerminalRoof'
  });

  for (const { id, forward } of AIRPORT_GATE_STANDS) {
    const point = getAirportPlanPoint(forward, AIRPORT_TERMINAL_SIDE * 505);
    addTransportRectObstacle(data, `airport-gate-window-${id}`, point.x, point.z, 4.2, 1.9, 34, '#c4e4ea', bounds, {
      baseY: 6.2,
      rotationY: getAirportPlanPose().yaw,
      type: 'airportGateWindow'
    });
  }

  for (const [endLabel, forward] of [['southwest', -1325], ['northeast', 1325]]) {
    for (const lateral of [-22, 22]) {
      const point = getAirportPlanPoint(forward, lateral);
      addTransportRectObstacle(data, `airport-approach-light-${endLabel}-${lateral}`, point.x, point.z, 1.4, 1.1, 10, '#f4d98a', bounds, {
        baseY: 0.15,
        rotationY: getAirportPlanPose().yaw,
        type: 'airportApproachLight'
      });
    }
  }
}

function addAirportPerimeterFence(data, bounds) {
  const fencePoints = [
    getAirportPlanPoint(-1370, 575),
    getAirportPlanPoint(1370, 575),
    getAirportPlanPoint(1390, AIRPORT_TERMINAL_SIDE * 760),
    getAirportPlanPoint(-1390, AIRPORT_TERMINAL_SIDE * 760)
  ];
  const edges = [
    [fencePoints[0], fencePoints[1], 'opposite-runway'],
    [fencePoints[1], fencePoints[2], 'northeast-end'],
    [fencePoints[3], fencePoints[0], 'southwest-end'],
    [getAirportPlanPoint(-1390, AIRPORT_TERMINAL_SIDE * 760), getAirportPlanPoint(-330, AIRPORT_TERMINAL_SIDE * 760), 'terminal-side-west'],
    [getAirportPlanPoint(180, AIRPORT_TERMINAL_SIDE * 760), getAirportPlanPoint(1390, AIRPORT_TERMINAL_SIDE * 760), 'terminal-side-east']
  ];

  for (const [start, end, label] of edges) {
    addAirportFenceSegment(data, bounds, `airport-perimeter-fence-${label}`, start, end);
  }
}

function addAirportFenceSegment(data, bounds, id, start, end) {
  const clip = clipLineToBounds(start, end, bounds, 2.4);
  if (!clip) return;

  for (const [railId, baseOffset] of [['lower', 1.05], ['upper', 2.45]]) {
    addTransportSegmentObstacle(
      data,
      bounds,
      `${id}-${railId}-rail`,
      start,
      end,
      0.34,
      0.22,
      '#8fa0a6',
      GROUND_DRIVE_Y + baseOffset,
      { type: 'airportFence' }
    );
  }

  data.tunnelColliders.push(createHeightLimitedSegmentCollider(
    `${id}-collider`,
    'airportFence',
    clip.start,
    clip.end,
    1.1,
    GROUND_DRIVE_Y,
    GROUND_DRIVE_Y + AIRPORT_FENCE_HEIGHT + 0.35
  ));

  const length = Math.hypot(clip.end.x - clip.start.x, clip.end.z - clip.start.z);
  const postCount = Math.max(2, Math.floor(length / 82));
  for (let index = 0; index <= postCount; index += 1) {
    const t = index / postCount;
    const post = {
      x: lerp(clip.start.x, clip.end.x, t),
      z: lerp(clip.start.z, clip.end.z, t)
    };
    addTransportRectObstacle(data, `${id}-post-${index}`, post.x, post.z, 0.78, AIRPORT_FENCE_HEIGHT, 0.78, '#c8d3d6', bounds, {
      baseY: GROUND_DRIVE_Y + 0.04,
      type: 'airportFencePost'
    });
  }
}

function addBaotouAirportAircraft(data, bounds) {
  const pose = getAirportPlanPose();
  const aircraft = [
    ...AIRPORT_GATE_STANDS.map((gate) => [
      `airport-plane-gate-${gate.id}`,
      gate.forward,
      AIRPORT_TERMINAL_SIDE * 470,
      pose.yaw - Math.PI / 2,
      gate.livery
    ]),
    ['airport-plane-cargo-stand', 895, AIRPORT_TERMINAL_SIDE * 445, pose.yaw - Math.PI / 2, '#cfe1e8'],
    ['airport-plane-maintenance-stand', -945, AIRPORT_TERMINAL_SIDE * 430, pose.yaw - Math.PI / 2, '#f7f3dc']
  ];

  for (const [id, forward, lateral, rotationY, color] of aircraft) {
    const point = getAirportPlanPoint(forward, lateral);
    addTransportAircraft(data, bounds, id, point.x, point.z, rotationY, color);
  }
}

function addAirportPlanRoadSign(data, bounds, id, text, forward, lateral, y, scale, color = '#1d2b24', rotationOffset = 0) {
  const point = getAirportPlanPoint(forward, lateral);
  addTransportRoadSign(data, bounds, {
    id,
    text,
    position: [point.x, y, point.z],
    rotation: [0, getAirportPlanPose().yaw + rotationOffset, 0],
    scale,
    color
  });
}

function addAirportWayfindingSigns(data, bounds) {
  addTransportRoadSign(data, bounds, {
    id: 'airport-main-terminal-sign',
    text: 'AIRPORT\nTERMINAL',
    position: [-5865, 6.6, 5160],
    rotation: [0, 0, 0],
    scale: [15.2, 3.0, 0.28],
    color: '#203b49'
  });
  addTransportRoadSign(data, bounds, {
    id: 'airport-departures-sign',
    text: 'DEPARTURES',
    position: [-5960, 4.25, 5030],
    rotation: [0, 0, 0],
    scale: [10.4, 2.0, 0.22],
    color: '#203b49'
  });
  addTransportRoadSign(data, bounds, {
    id: 'airport-arrivals-sign',
    text: 'ARRIVALS',
    position: [-5640, 4.25, 4990],
    rotation: [0, 0, 0],
    scale: [9.8, 2.0, 0.22],
    color: '#203b49'
  });
  addTransportRoadSign(data, bounds, {
    id: 'airport-parking-taxi-sign',
    text: 'PARKING\nTAXI',
    position: [-5528, 3.7, 4868],
    rotation: [0, Math.PI / 10, 0],
    scale: [8.6, 2.5, 0.24],
    color: '#1d2b24'
  });
  addAirportPlanRoadSign(data, bounds, 'airport-runway-id-sign', 'RWY 13 / 31', 1220, 72, 3.8, [8.8, 2.1, 0.28], '#f2d486', Math.PI / 2);
}

function addAirportTaxiwaySigns(data, bounds) {
  const signs = [
    ['airport-taxiway-sign-a', 'A', -940, AIRPORT_TERMINAL_SIDE * 270],
    ['airport-taxiway-sign-b', 'B', -420, AIRPORT_TERMINAL_SIDE * 270],
    ['airport-taxiway-sign-c', 'C', 140, AIRPORT_TERMINAL_SIDE * 270],
    ['airport-taxiway-sign-d', 'D', 820, AIRPORT_TERMINAL_SIDE * 270],
    ['airport-taxiway-sign-rwy', 'RWY\n13-31', 1045, AIRPORT_TERMINAL_SIDE * 205]
  ];

  for (const [id, text, forward, lateral] of signs) {
    addAirportPlanRoadSign(data, bounds, id, text, forward, lateral, 1.55, [4.8, 1.25, 0.18], '#f2d486', Math.PI / 2);
  }
}

function addAirportApronDetails(data, bounds) {
  for (const { id, label, forward } of AIRPORT_GATE_STANDS) {
    addAirportPlanBox(data, bounds, `airport-apron-stand-${id}-nose-stop`, forward, AIRPORT_TERMINAL_SIDE * 433, 22, 0.034, 0.48, '#f2d486', AIRPORT_MARKING_BASE_Y, 'airportTaxiwayMark');
    addAirportPlanBox(data, bounds, `airport-apron-stand-${id}-left-safe`, forward, AIRPORT_TERMINAL_SIDE * 506, 84, 0.034, 0.48, '#d7d0bb', AIRPORT_MARKING_BASE_Y, 'airportTaxiwayMark');
    addAirportPlanBox(data, bounds, `airport-apron-stand-${id}-right-safe`, forward, AIRPORT_TERMINAL_SIDE * 434, 84, 0.034, 0.48, '#d7d0bb', AIRPORT_MARKING_BASE_Y, 'airportTaxiwayMark');
    addAirportPlanRoadSign(data, bounds, `airport-apron-${id}-stand-label`, label, forward - 28, AIRPORT_TERMINAL_SIDE * 418, 0.86, [3.9, 1.0, 0.14], '#203b49', Math.PI / 2);
  }

  for (const forward of [-635, -380, -120, 180, 470, 695]) {
    addAirportPlanBox(data, bounds, `airport-apron-safety-hash-${forward}`, forward, AIRPORT_TERMINAL_SIDE * 326, 38, 0.03, 0.42, '#f2d486', AIRPORT_MARKING_BASE_Y, 'airportTaxiwayMark', 0.55);
  }

  addAirportPlanBox(data, bounds, 'airport-cargo-apron-loader-box', 920, AIRPORT_TERMINAL_SIDE * 520, 110, 0.032, 0.42, '#d7d0bb', AIRPORT_MARKING_BASE_Y, 'airportTaxiwayMark');
  addAirportPlanBox(data, bounds, 'airport-maintenance-apron-clearance-box', -935, AIRPORT_TERMINAL_SIDE * 500, 118, 0.032, 0.42, '#d7d0bb', AIRPORT_MARKING_BASE_Y, 'airportTaxiwayMark');
}

function addAirportGroundServiceEquipment(data, bounds) {
  addAirportServiceVehicle(data, bounds, 'airport-fuel-truck-a1', -555, AIRPORT_TERMINAL_SIDE * 512, -Math.PI / 2, '#f2d486', 16, 5.4);
  addAirportServiceVehicle(data, bounds, 'airport-catering-truck-a2', -270, AIRPORT_TERMINAL_SIDE * 515, -Math.PI / 2, '#cfd4ca', 14, 5.2);
  addAirportServiceVehicle(data, bounds, 'airport-belt-loader-a3', 48, AIRPORT_TERMINAL_SIDE * 516, -Math.PI / 2, '#7898a8', 11, 4.4);
  addAirportServiceVehicle(data, bounds, 'airport-service-van-a4', 438, AIRPORT_TERMINAL_SIDE * 515, -Math.PI / 2, '#9fd08c', 10, 4.2);
  addAirportServiceVehicle(data, bounds, 'airport-tow-tractor-cargo', 840, AIRPORT_TERMINAL_SIDE * 525, -Math.PI / 2, '#d1bb78', 8.6, 4.4);

  for (const [baseId, baseForward] of [['a1', -520], ['a2', -240], ['a3', 80], ['cargo', 895]]) {
    for (let index = 0; index < 3; index += 1) {
      addAirportPlanBox(
        data,
        bounds,
        `airport-baggage-cart-${baseId}-${index}`,
        baseForward - 34 - index * 7,
        AIRPORT_TERMINAL_SIDE * (530 + index * 6),
        5.2,
        1.1,
        3.2,
        index % 2 === 0 ? '#d1bb78' : '#c28f69',
        GROUND_DRIVE_Y + 0.08,
        'airportGroundService',
        -Math.PI / 2
      );
    }
  }

  for (const [id, forward, lateral] of [
    ['airport-boarding-stairs-a1', -488, AIRPORT_TERMINAL_SIDE * 438],
    ['airport-boarding-stairs-a4', 432, AIRPORT_TERMINAL_SIDE * 438],
    ['airport-cargo-pallet-a', 1000, AIRPORT_TERMINAL_SIDE * 530],
    ['airport-cargo-pallet-b', 1030, AIRPORT_TERMINAL_SIDE * 515]
  ]) {
    addAirportPlanBox(data, bounds, id, forward, lateral, 10.5, 1.35, 4.2, '#cfd4ca', GROUND_DRIVE_Y + 0.08, 'airportGroundService', -Math.PI / 2);
    addAirportPlanBox(data, bounds, `${id}-rail`, forward + 2.2, lateral, 8.4, 0.32, 4.8, '#68737a', GROUND_DRIVE_Y + 1.55, 'airportGroundService', -Math.PI / 2);
  }

  for (const forward of [-635, -574, -316, -178, 28, 180, 348, 496, 790, 1090]) {
    addAirportCone(data, bounds, `airport-apron-cone-${forward}`, forward, AIRPORT_TERMINAL_SIDE * 560);
  }
}

function addAirportServiceVehicle(data, bounds, id, forward, lateral, rotationOffset, color, length, depth) {
  addAirportPlanBox(data, bounds, `${id}-body`, forward, lateral, length, 1.75, depth, color, GROUND_DRIVE_Y + 0.12, 'airportGroundService', rotationOffset);
  addAirportPlanBox(data, bounds, `${id}-cab`, forward + length * 0.32, lateral, length * 0.28, 1.95, depth * 0.84, '#e7edf1', GROUND_DRIVE_Y + 0.28, 'airportGroundService', rotationOffset);
  addAirportPlanBox(data, bounds, `${id}-equipment`, forward - length * 0.18, lateral, length * 0.42, 0.8, depth * 0.68, '#4f5c61', GROUND_DRIVE_Y + 1.62, 'airportGroundService', rotationOffset);

  for (const side of [-1, 1]) {
    for (const axle of [-0.3, 0.34]) {
      addAirportPlanBox(
        data,
        bounds,
        `${id}-wheel-${side}-${axle}`,
        forward + length * axle,
        lateral + side * depth * 0.48,
        1.6,
        0.72,
        0.72,
        '#151a1c',
        GROUND_DRIVE_Y + 0.05,
        'airportGroundService',
        rotationOffset
      );
    }
  }
}

function addAirportCone(data, bounds, id, forward, lateral) {
  addAirportPlanBox(data, bounds, `${id}-base`, forward, lateral, 1.0, 0.18, 1.0, '#f2f0dc', GROUND_DRIVE_Y + 0.05, 'airportCone');
  addAirportPlanBox(data, bounds, `${id}-body`, forward, lateral, 0.62, 0.9, 0.62, '#e36d5c', GROUND_DRIVE_Y + 0.2, 'airportCone');
}

function addAirportAirfieldLights(data, bounds) {
  const runwayHalfLength = getAirportPlanPose().length / 2;

  for (let forward = -1220; forward <= 1220; forward += 130) {
    for (const lateral of [-44, 44]) {
      const isNearEnd = Math.abs(forward) > runwayHalfLength - 310;
      addAirportLightAtPlan(data, bounds, `airport-runway-edge-light-${forward}-${lateral}`, forward, lateral, isNearEnd ? '#f2d486' : '#f7f0c9', 'runway', 0.85, 0.42);
    }
  }

  for (const [label, forward, redSide] of [['31', -1285, -1], ['13', 1285, 1]]) {
    for (const lateral of [-27, -15, -3, 9, 21, 33]) {
      addAirportLightAtPlan(
        data,
        bounds,
        `airport-threshold-light-${label}-${lateral}`,
        forward,
        lateral,
        redSide < 0 ? '#e36d5c' : '#9fd08c',
        'threshold',
        0.9,
        0.5
      );
    }
  }

  for (let forward = -1130; forward <= 1130; forward += 150) {
    addAirportLightAtPlan(data, bounds, `airport-taxiway-blue-light-left-${forward}`, forward, AIRPORT_TERMINAL_SIDE * 251, '#75b7d8', 'taxiway', 0.72, 0.36);
    addAirportLightAtPlan(data, bounds, `airport-taxiway-blue-light-right-${forward}`, forward, AIRPORT_TERMINAL_SIDE * 209, '#75b7d8', 'taxiway', 0.72, 0.36);
  }

  for (const { id, forward } of AIRPORT_GATE_STANDS) {
    addAirportLightAtPlan(data, bounds, `airport-gate-stopbar-light-${id}-left`, forward - 17, AIRPORT_TERMINAL_SIDE * 455, '#e36d5c', 'stopbar', 0.72, 0.36);
    addAirportLightAtPlan(data, bounds, `airport-gate-stopbar-light-${id}-right`, forward + 17, AIRPORT_TERMINAL_SIDE * 455, '#e36d5c', 'stopbar', 0.72, 0.36);
  }

  for (const [id, x, z, rotationY] of [
    ['airport-apron-flood-west', -6225, 5350, Math.PI / 2],
    ['airport-apron-flood-center', -5860, 5485, Math.PI / 2],
    ['airport-apron-flood-east', -5485, 5290, Math.PI / 2],
    ['airport-parking-light-west', -6190, 4870, 0],
    ['airport-parking-light-east', -5550, 4870, 0],
    ['airport-entrance-light', -5520, 4745, -Math.PI / 3]
  ]) {
    addAirportStreetLight(data, bounds, id, x, z, rotationY);
  }
}

function addAirportLightAtPlan(data, bounds, id, forward, lateral, color, lightKind, size = 0.8, height = 0.38, blink = false, phase = 0) {
  const point = getAirportPlanPoint(forward, lateral);
  addAirportLightAtWorld(data, bounds, id, point.x, point.z, 0.12, color, lightKind, size, height, blink, phase);
}

function addAirportLightAtWorld(data, bounds, id, x, z, baseY, color, lightKind, size = 0.8, height = 0.38, blink = false, phase = 0) {
  if (!isInsideChunk(x, z, bounds)) return;

  data.trafficObstacles.push(createTrafficObstacle(
    id,
    x,
    z,
    baseY,
    size,
    height,
    size,
    color,
    0,
    {
      type: 'airportLight',
      lightKind,
      blink,
      phase
    }
  ));
}

function addAirportStreetLight(data, bounds, id, x, z, rotationY = 0) {
  if (!isInsideChunk(x, z, bounds)) return;

  data.streetLights.push({
    id,
    position: [x, 0, z],
    rotationY
  });
  data.streetLightColliders.push(createBoxCollider(`${id}-collider`, 'streetLight', x, z, 1.1, 1.1));
}

function addAirportTowerDetails(data, bounds) {
  addTransportRectObstacle(data, 'airport-control-tower-glass-cab', -6080, 5090, 42, 13.5, 42, '#c4e4ea', bounds, {
    baseY: 82,
    type: 'airportTowerGlassCab'
  });
  addTransportRectObstacle(data, 'airport-control-tower-roof', -6080, 5090, 48, 2.6, 48, '#4f5c61', bounds, {
    baseY: 95.5,
    type: 'airportTowerRoof'
  });
  addTransportRectObstacle(data, 'airport-control-tower-antenna-mast', -6080, 5090, 1.4, 13.5, 1.4, '#2d3438', bounds, {
    baseY: 98,
    type: 'airportAntenna'
  });
  addTransportRectObstacle(data, 'airport-control-tower-radar-boom', -6080, 5090, 28, 0.72, 1.0, '#d7e0e4', bounds, {
    baseY: 103.8,
    rotationY: Math.PI / 7,
    type: 'airportRadar'
  });
  addTransportRectObstacle(data, 'airport-control-tower-radar-dish', -6068, 5084, 7.2, 5.0, 0.8, '#d7e0e4', bounds, {
    baseY: 99.5,
    rotationY: Math.PI / 7,
    type: 'airportRadar'
  });
  addAirportLightAtWorld(data, bounds, 'airport-control-tower-red-beacon', -6080, 5090, 111.8, '#f0503f', 'beacon', 1.6, 1.2, true, 0.4);
  addTransportRoadSign(data, bounds, {
    id: 'airport-control-tower-security-sign',
    text: 'CONTROL\nTOWER',
    position: [-6118, 3.5, 5052],
    rotation: [0, Math.PI / 5, 0],
    scale: [6.6, 2.0, 0.22],
    color: '#203b49'
  });
}

function addAirportHangarDetails(data, bounds) {
  for (const [id, x, z, width, yaw] of [
    ['airport-maintenance-hangar-west', -6750, 5155, 250, 0],
    ['airport-maintenance-hangar-east', -5300, 5980, 230, 0]
  ]) {
    addTransportRectObstacle(data, `${id}-main-door`, x, z - 72, width * 0.68, 18, 3.2, '#2d3438', bounds, {
      baseY: 1.5,
      rotationY: yaw,
      type: 'airportHangarDoor'
    });
    addTransportRectObstacle(data, `${id}-door-stripes`, x, z - 74, width * 0.58, 1.0, 3.4, '#f2d486', bounds, {
      baseY: 14.2,
      rotationY: yaw,
      type: 'airportHangarDoor'
    });
    addTransportRectObstacle(data, `${id}-roof-arch-front`, x, z - 38, width * 0.92, 3.6, 7.2, '#cfd4ca', bounds, {
      baseY: 31.0,
      rotationY: yaw,
      type: 'airportHangarRoof'
    });
    addTransportRectObstacle(data, `${id}-roof-arch-rear`, x, z + 38, width * 0.92, 3.6, 7.2, '#cfd4ca', bounds, {
      baseY: 31.0,
      rotationY: yaw,
      type: 'airportHangarRoof'
    });
  }

  addAirportServiceVehicle(data, bounds, 'airport-maintenance-pickup', -1030, AIRPORT_TERMINAL_SIDE * 525, -Math.PI / 2, '#e36d5c', 9.5, 4.4);
  addAirportServiceVehicle(data, bounds, 'airport-cargo-loader', 1045, AIRPORT_TERMINAL_SIDE * 535, -Math.PI / 2, '#7898a8', 12, 5.2);
}

function addAirportEntranceDetails(data, bounds) {
  addTransportRectObstacle(data, 'airport-security-gatehouse', -5488, 4792, 18, 8.5, 16, '#cfd4ca', bounds, {
    baseY: GROUND_DRIVE_Y + 0.04,
    type: 'airportGatehouse'
  });
  addTransportRectObstacle(data, 'airport-security-canopy', -5520, 4798, 92, 2.8, 18, '#4f5c61', bounds, {
    baseY: 7.8,
    type: 'airportGatehouse'
  });
  addTransportRectObstacle(data, 'airport-security-boom-left', -5562, 4795, 34, 0.52, 0.42, '#e36d5c', bounds, {
    baseY: 1.8,
    rotationY: Math.PI / 18,
    type: 'airportBarrier'
  });
  addTransportRectObstacle(data, 'airport-security-boom-right', -5515, 4786, 31, 0.52, 0.42, '#e36d5c', bounds, {
    baseY: 1.8,
    rotationY: -Math.PI / 16,
    type: 'airportBarrier'
  });
  addTransportRoadSign(data, bounds, {
    id: 'airport-entry-direction-sign',
    text: 'AIRPORT\nENTRANCE',
    position: [-5520, 5.2, 4748],
    rotation: [0, -Math.PI / 6, 0],
    scale: [10.2, 2.8, 0.24],
    color: '#1d2b24'
  });
  addTransportRoadSign(data, bounds, {
    id: 'airport-restricted-area-sign',
    text: 'RESTRICTED\nAREA',
    position: [-5695, 3.2, 4888],
    rotation: [0, 0, 0],
    scale: [7.8, 2.3, 0.22],
    color: '#f2d486'
  });
  addTransportRoadSign(data, bounds, {
    id: 'airport-authorized-sign',
    text: 'AUTHORIZED\nVEHICLES',
    position: [-5485, 3.0, 5034],
    rotation: [0, Math.PI / 2, 0],
    scale: [7.8, 2.3, 0.22],
    color: '#f2d486'
  });

  for (const [id, forward, lateral] of [
    ['airport-windsock-pole', -1160, 185],
    ['airport-windsock-sock-red', -1156, 192],
    ['airport-windsock-sock-white', -1150, 196]
  ]) {
    const isPole = id.endsWith('pole');
    addAirportPlanBox(
      data,
      bounds,
      id,
      forward,
      lateral,
      isPole ? 0.8 : 8.8,
      isPole ? 9.2 : 1.3,
      isPole ? 0.8 : 2.0,
      isPole ? '#2d3438' : (id.endsWith('red') ? '#e36d5c' : '#f2f0dc'),
      isPole ? GROUND_DRIVE_Y + 0.08 : GROUND_DRIVE_Y + 7.7,
      'airportWindsock',
      -0.35
    );
  }
}

function addTrainStationHub(data, bounds, chunkX, chunkZ) {
  const hub = TRANSPORT_HUBS.trainStation;
  if (!doBoundsOverlap(bounds, hub.bounds)) return;
  const platformCenterX = (TRAIN_STATION_PLATFORM_START_X + TRAIN_STATION_PLATFORM_END_X) / 2;
  const platformLength = TRAIN_STATION_PLATFORM_END_X - TRAIN_STATION_PLATFORM_START_X;

  const parking = addTransportRectRoad(data, 'station-parking', 'station-parking', ROAD_TYPES.parking, 5800, -5485, 250, 138, {
    axis: 'parking',
    side: 'station-parking',
    marked: false
  }, bounds, chunkX, chunkZ);

  if (parking) data.parkingMarks.push(...createParkingMarks(parking));

  addTransportRectRoad(data, 'station-front-road', 'station-front-road', ROAD_TYPES.groundRoad, 6200, -5600, 560, 13, {
    axis: 'x',
    side: 'station-front',
    marked: true
  }, bounds, chunkX, chunkZ);
  addTransportSegmentRoad(data, 'station-front-connector', 'station-front-road', ROAD_TYPES.groundRoad, hub.terminalGate, { x: 6040, z: -5600 }, 12, GROUND_DRIVE_Y, {
    side: 'station-front',
    marked: true
  }, bounds, chunkX, chunkZ);
  if (FAST_ROADS_UNDERGROUND) {
    addTransportSegmentRoad(data, 'station-highway-ground-connector', 'station-highway-connector', ROAD_TYPES.mainRoad, hub.gate, hub.terminalGate, 18, GROUND_DRIVE_Y, {
      side: 'station-highway-connector',
      marked: true
    }, bounds, chunkX, chunkZ);
  }
  if (!FAST_ROADS_UNDERGROUND) {
    addTerminalElevatedAccess(data, bounds, chunkX, chunkZ, 'station-terminal-viaduct', [
      { x: 5520, z: -5060, y: TERMINAL_ELEVATED_ACCESS_Y },
      { x: 5755, z: -5305, y: TERMINAL_ELEVATED_ACCESS_Y },
      { x: 6040, z: -5585, y: TERMINAL_ELEVATED_ACCESS_Y },
      { x: 6260, z: -5660, y: TERMINAL_ELEVATED_ACCESS_Y }
    ], 14);
  }

  addTransportBuilding(data, bounds, createTransportBuilding('station-waiting-hall', 6200, -5790, 360, 34, 118, '#7898a8', 'trainStation', {
    preserveTransportHub: true
  }));
  addTransportBuilding(data, bounds, createTransportBuilding('station-ticket-hall', 5855, -5798, 118, 24, 76, '#c28f69', 'stationOffice'));
  addTransportRectObstacle(data, 'station-waiting-hall-glass-front', 6200, -5725, 320, 6.2, 4.2, '#d9d3ff', bounds, {
    baseY: 5.4,
    type: 'stationGlass'
  });
  addTransportRectObstacle(data, 'station-waiting-hall-canopy', 6200, -5894, 420, 2.6, 34, '#68737a', bounds, {
    baseY: 7.2,
    type: 'stationCanopy'
  });

  addTransportRectObstacle(data, 'station-back-platform', platformCenterX, -6088, platformLength, 1.2, 24, '#d1bb78', bounds);
  addTransportRectObstacle(data, 'station-island-platform', platformCenterX, -6201, platformLength, 1.2, 18, '#c9bd8a', bounds);
  addTransportRectObstacle(data, 'station-platform-roof', platformCenterX, -6138, platformLength * 0.92, 2.2, 96, '#7a8589', bounds, {
    baseY: 6.8,
    type: 'stationPlatformRoof'
  });
  addTrainStationTrackDetails(data, bounds);
  addTrainStationTrain(data, bounds);
  if (!FAST_ROADS_UNDERGROUND) {
    addTrainStationRailTunnel(data, bounds);
  }

  addTransportRoadSign(data, bounds, {
    id: 'station-main-sign',
    text: 'WAITING HALL\nTRAIN STATION',
    position: [6040, 5.2, -5560],
    rotation: [0, Math.PI / 3, 0],
    scale: [12.4, 2.9, 0.28],
    color: '#9fd08c'
  });
  addTransportSafeSpawn(data, bounds, chunkX, chunkZ, 'station-spawn', hub.spawn, 'train-station');
}

const TRAIN_STATION_PLATFORM_START_X = 5750;
const TRAIN_STATION_PLATFORM_END_X = 6500;
const TRAIN_STATION_TUNNEL_PORTAL_X = TRAIN_STATION_PLATFORM_END_X + 50;
const TRAIN_STATION_TUNNEL_RAMP_END_X = TRAIN_STATION_TUNNEL_PORTAL_X + 138;
const TRAIN_STATION_TUNNEL_END_X = TRAIN_STATION_TUNNEL_RAMP_END_X + 78;
const TRAIN_STATION_TRACK_END_X = TRAIN_STATION_TUNNEL_END_X;
const TRAIN_STATION_TRACK_START_X = 5700;
const TRAIN_STATION_TRACK_CENTERS = [-6148, -6254];
const TRAIN_STATION_TUNNEL_Y = GROUND_DRIVE_Y - 5.8;

function addTrainStationTrackDetails(data, bounds) {
  for (let x = TRAIN_STATION_TRACK_START_X; x <= TRAIN_STATION_TUNNEL_PORTAL_X - 8; x += 34) {
    for (let trackIndex = 0; trackIndex < TRAIN_STATION_TRACK_CENTERS.length; trackIndex += 1) {
      addTransportFlatRect(data, bounds, `station-sleeper-${trackIndex}-${x}`, x, TRAIN_STATION_TRACK_CENTERS[trackIndex], 3.2, 26, '#6f5842');
    }
  }

  for (let x = TRAIN_STATION_TUNNEL_PORTAL_X + 18; x <= TRAIN_STATION_TUNNEL_RAMP_END_X - 10; x += 32) {
    const t = (x - TRAIN_STATION_TUNNEL_PORTAL_X) / (TRAIN_STATION_TUNNEL_RAMP_END_X - TRAIN_STATION_TUNNEL_PORTAL_X);
    const y = lerp(GROUND_DRIVE_Y + 0.04, TRAIN_STATION_TUNNEL_Y + 0.04, t);

    for (let trackIndex = 0; trackIndex < TRAIN_STATION_TRACK_CENTERS.length; trackIndex += 1) {
      addTransportSlopedObstacle(
        data,
        bounds,
        `station-slope-sleeper-${trackIndex}-${x}`,
        { x: x - 1.6, z: TRAIN_STATION_TRACK_CENTERS[trackIndex] },
        { x: x + 1.6, z: TRAIN_STATION_TRACK_CENTERS[trackIndex] },
        y,
        y,
        26,
        0.055,
        '#6f5842',
        'stationRailSleeperSlope'
      );
    }
  }

  for (let trackIndex = 0; trackIndex < TRAIN_STATION_TRACK_CENTERS.length; trackIndex += 1) {
    const centerZ = TRAIN_STATION_TRACK_CENTERS[trackIndex];

    for (const railOffset of [-4.2, 4.2]) {
      addTransportRectObstacle(
        data,
        `station-rail-flat-${trackIndex}-${railOffset < 0 ? 'north' : 'south'}`,
        (TRAIN_STATION_TRACK_START_X + TRAIN_STATION_TUNNEL_PORTAL_X) / 2,
        centerZ + railOffset,
        TRAIN_STATION_TUNNEL_PORTAL_X - TRAIN_STATION_TRACK_START_X,
        0.34,
        1.35,
        '#7f898f',
        bounds
      );
      addTransportSlopedObstacle(
        data,
        bounds,
        `station-rail-down-${trackIndex}-${railOffset < 0 ? 'north' : 'south'}`,
        { x: TRAIN_STATION_TUNNEL_PORTAL_X, z: centerZ + railOffset },
        { x: TRAIN_STATION_TUNNEL_RAMP_END_X, z: centerZ + railOffset },
        GROUND_DRIVE_Y + 0.08,
        TRAIN_STATION_TUNNEL_Y + 0.08,
        1.35,
        0.34,
        '#9ba7ad',
        'stationRailDownSlope'
      );
      addTransportRectObstacle(
        data,
        `station-rail-underground-${trackIndex}-${railOffset < 0 ? 'north' : 'south'}`,
        (TRAIN_STATION_TUNNEL_RAMP_END_X + TRAIN_STATION_TRACK_END_X) / 2,
        centerZ + railOffset,
        TRAIN_STATION_TRACK_END_X - TRAIN_STATION_TUNNEL_RAMP_END_X,
        0.34,
        1.35,
        '#66727a',
        bounds,
        {
          baseY: TRAIN_STATION_TUNNEL_Y + 0.08,
          type: 'stationRailUnderground'
        }
      );
    }
  }

  addTransportFlatSegment(data, bounds, 'station-platform-edge-main', { x: TRAIN_STATION_PLATFORM_START_X, z: -6102 }, { x: TRAIN_STATION_PLATFORM_END_X, z: -6102 }, 0.72, '#e7edf1');
  addTransportFlatSegment(data, bounds, 'station-platform-edge-island-north', { x: TRAIN_STATION_PLATFORM_START_X, z: -6190 }, { x: TRAIN_STATION_PLATFORM_END_X, z: -6190 }, 0.72, '#e7edf1');
  addTransportFlatSegment(data, bounds, 'station-platform-edge-island-south', { x: TRAIN_STATION_PLATFORM_START_X, z: -6212 }, { x: TRAIN_STATION_PLATFORM_END_X, z: -6212 }, 0.72, '#e7edf1');
}

function addTrainStationTrain(data, bounds) {
  const trainZ = TRAIN_STATION_TRACK_CENTERS[0];
  const carXs = [5914, 6010, 6106, 6202];

  addTransportRectObstacle(data, 'station-train-locomotive', 5818, trainZ, 78, 5.1, 15.5, '#e36d5c', bounds);

  for (let index = 0; index < carXs.length; index += 1) {
    const x = carXs[index];
    const color = index % 2 === 0 ? '#7898a8' : '#75b7d8';

    addTransportRectObstacle(data, `station-train-car-${index}`, x, trainZ, 86, 4.7, 15.2, color, bounds);
    addTransportRectObstacle(data, `station-train-window-band-${index}`, x, trainZ - 7.9, 70, 1.2, 0.8, '#d9d3ff', bounds, {
      baseY: 3.0,
      type: 'trainWindow'
    });
  }

  addTransportRectObstacle(data, 'station-signal-east', TRAIN_STATION_TUNNEL_PORTAL_X - 36, -6116, 4, 6.4, 2.4, '#353d42', bounds);
  addTransportRectObstacle(data, 'station-signal-west', TRAIN_STATION_TRACK_START_X + 28, -6286, 4, 6.4, 2.4, '#353d42', bounds);
}

function addTrainStationRailTunnel(data, bounds) {
  const centerZ = (TRAIN_STATION_TRACK_CENTERS[0] + TRAIN_STATION_TRACK_CENTERS[1]) / 2;
  const tunnelDepth = 150;
  const rampLength = TRAIN_STATION_TUNNEL_RAMP_END_X - TRAIN_STATION_TUNNEL_PORTAL_X;
  const tunnelLength = TRAIN_STATION_TUNNEL_END_X - TRAIN_STATION_TUNNEL_RAMP_END_X;
  const rampCenterX = (TRAIN_STATION_TUNNEL_PORTAL_X + TRAIN_STATION_TUNNEL_RAMP_END_X) / 2;
  const tunnelCenterX = (TRAIN_STATION_TUNNEL_RAMP_END_X + TRAIN_STATION_TUNNEL_END_X) / 2;

  addTrainStationRailTunnelGroundCutout(data);
  addTransportSlopedObstacle(
    data,
    bounds,
    'station-rail-tunnel-down-floor',
    { x: TRAIN_STATION_TUNNEL_PORTAL_X, z: centerZ },
    { x: TRAIN_STATION_TUNNEL_RAMP_END_X, z: centerZ },
    GROUND_DRIVE_Y - 0.05,
    TRAIN_STATION_TUNNEL_Y - 0.08,
    tunnelDepth - 12,
    0.08,
    '#243039',
    'stationRailTunnelRampFloor'
  );
  addTransportRectObstacle(data, 'station-rail-tunnel-underground-trackbed', tunnelCenterX, centerZ, tunnelLength, 0.08, tunnelDepth - 12, '#182025', bounds, {
    baseY: TRAIN_STATION_TUNNEL_Y - 0.12,
    type: 'stationRailTunnelFloor'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-header', TRAIN_STATION_TUNNEL_PORTAL_X, centerZ, 16, 1.1, tunnelDepth + 10, '#59646a', bounds, {
    baseY: GROUND_DRIVE_Y + 5.05,
    type: 'stationRailTunnelPortal'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-ramp-north-wall', rampCenterX, centerZ + tunnelDepth / 2, rampLength, 6.4, 8.5, '#3f494d', bounds, {
    baseY: TRAIN_STATION_TUNNEL_Y + 0.35,
    type: 'stationRailTunnelWall'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-ramp-south-wall', rampCenterX, centerZ - tunnelDepth / 2, rampLength, 6.4, 8.5, '#3f494d', bounds, {
    baseY: TRAIN_STATION_TUNNEL_Y + 0.35,
    type: 'stationRailTunnelWall'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-lower-mouth-header', TRAIN_STATION_TUNNEL_RAMP_END_X, centerZ, 18, 1.05, tunnelDepth + 10, '#68737a', bounds, {
    baseY: TRAIN_STATION_TUNNEL_Y + 5.05,
    type: 'stationRailTunnelPortal'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-roof', tunnelCenterX + 6, centerZ, tunnelLength + 12, 0.62, tunnelDepth + 10, '#4f5c61', bounds, {
    baseY: GROUND_DRIVE_Y - 0.44,
    type: 'stationRailTunnelRoof'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-north-wall', tunnelCenterX, centerZ + tunnelDepth / 2, tunnelLength + 12, 7.2, 8.5, '#3f494d', bounds, {
    baseY: TRAIN_STATION_TUNNEL_Y,
    type: 'stationRailTunnelWall'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-south-wall', tunnelCenterX, centerZ - tunnelDepth / 2, tunnelLength + 12, 7.2, 8.5, '#3f494d', bounds, {
    baseY: TRAIN_STATION_TUNNEL_Y,
    type: 'stationRailTunnelWall'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-left-cheek', TRAIN_STATION_TUNNEL_PORTAL_X - 4, centerZ + tunnelDepth / 2, 22, 7.6, 9.8, '#4f5c61', bounds, {
    baseY: 0.1,
    type: 'stationRailTunnelPortal'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-right-cheek', TRAIN_STATION_TUNNEL_PORTAL_X - 4, centerZ - tunnelDepth / 2, 22, 7.6, 9.8, '#4f5c61', bounds, {
    baseY: 0.1,
    type: 'stationRailTunnelPortal'
  });
  addTransportRectObstacle(data, 'station-rail-tunnel-warning-bar', TRAIN_STATION_TUNNEL_PORTAL_X - 8, centerZ, 1.6, 0.35, tunnelDepth - 12, '#ffd21f', bounds, {
    baseY: GROUND_DRIVE_Y + 4.25,
    type: 'stationRailTunnelWarning'
  });

  addTransportAirWallBox(
    data,
    bounds,
    'station-rail-tunnel-mouth-air-wall',
    TRAIN_STATION_TUNNEL_PORTAL_X + 2,
    centerZ,
    28,
    tunnelDepth + 24,
    GROUND_DRIVE_Y - 0.2,
    GROUND_DRIVE_Y + 10.8
  );
  addTransportAirWallBox(
    data,
    bounds,
    'station-rail-tunnel-surface-air-wall',
    (TRAIN_STATION_TUNNEL_PORTAL_X + TRAIN_STATION_TUNNEL_END_X) / 2,
    centerZ,
    TRAIN_STATION_TUNNEL_END_X - TRAIN_STATION_TUNNEL_PORTAL_X + 42,
    tunnelDepth + 24,
    GROUND_DRIVE_Y - 0.2,
    GROUND_DRIVE_Y + 10.8
  );
}

function addTrainStationRailTunnelGroundCutout(data) {
  const centerZ = (TRAIN_STATION_TRACK_CENTERS[0] + TRAIN_STATION_TRACK_CENTERS[1]) / 2;
  const tunnelDepth = 166;

  data.groundCutouts.push({
    id: 'station-rail-tunnel-open-cut',
    minX: TRAIN_STATION_TUNNEL_PORTAL_X - 12,
    maxX: TRAIN_STATION_TUNNEL_RAMP_END_X + 16,
    minZ: centerZ - tunnelDepth / 2,
    maxZ: centerZ + tunnelDepth / 2
  });
}

function addTerminalElevatedAccess(data, bounds, chunkX, chunkZ, id, points, width) {
  if (!Array.isArray(points) || points.length < 2) return;

  const createdRoads = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const startY = start.y ?? GROUND_DRIVE_Y;
    const endY = end.y ?? startY;
    const roadId = `${id}-${index}-${chunkX}-${chunkZ}`;
    const roadType = Math.abs(endY - startY) > 0.1 ? ROAD_TYPES.ramp : ROAD_TYPES.elevatedHighway;
    const road = roadType === ROAD_TYPES.ramp
      ? addTransportSlopedRoad(
          data,
          roadId,
          'terminal-elevated-ramp',
          ROAD_TYPES.ramp,
          start,
          end,
          width,
          startY,
          endY,
          {
            side: 'terminal-elevated',
            marked: true,
            visualStartY: startY,
            visualEndY: endY
          },
          bounds
        )
      : addTransportSegmentRoad(
          data,
          roadId,
          'terminal-elevated-deck',
          ROAD_TYPES.elevatedHighway,
          start,
          end,
          width,
          startY,
          {
            side: 'terminal-elevated',
            marked: true
          },
          bounds,
          chunkX,
          chunkZ
        );

    if (road) createdRoads.push(road);
  }

  for (const road of createdRoads) {
    addExpresswayGuardrails(
      data,
      road,
      Math.min(road.surface?.startY ?? road.position[1], road.surface?.endY ?? road.position[1]) + 0.08,
      Math.max(road.surface?.startY ?? road.position[1], road.surface?.endY ?? road.position[1]) + EXPRESSWAY_GUARDRAIL_HEIGHT + 0.35,
      {
        clearanceRoads: data.roads.filter((item) => item !== road && !isElevatedBridgeRoad(item)),
        colliderType: 'solidBridgeGuardrail',
        forceColliders: true,
        forceContinuous: true
      }
    );
  }
}

function addTransportSegmentRoad(data, id, kind, roadType, start, end, width, y, options, bounds, chunkX, chunkZ) {
  const clip = clipLineToBounds(start, end, bounds, width / 2);
  if (!clip) return null;

  const road = createSegmentRoad(
    `${id}-${chunkX}-${chunkZ}`,
    kind,
    roadType,
    clip.start,
    clip.end,
    width,
    y,
    options
  );

  if (road?.surface && Number.isFinite(options?.surfaceY)) {
    road.surface.y = options.surfaceY;
  }

  addTransportRoad(data, road);
  return road;
}

function addTransportRectRoad(data, id, kind, roadType, centerX, centerZ, width, depth, options, bounds, chunkX, chunkZ) {
  const clipped = clipRectToBounds(centerX, centerZ, width, depth, bounds);
  if (!clipped) return null;

  const road = createRoadSurface(
    `${id}-${chunkX}-${chunkZ}`,
    kind,
    clipped.centerX,
    clipped.centerZ,
    clipped.width,
    clipped.depth,
    {
      ...options,
      roadType
    }
  );

  addTransportRoad(data, road);
  return road;
}

function addTransportRoad(data, road) {
  if (!road) return;

  data.roads.push(road);
  data.roadColliders.push(createRoadCollider(road));
}

function addTransportBuilding(data, bounds, building) {
  if (!building) return;
  if (!isInsideChunk(building.position[0], building.position[2], bounds)) return;

  data.buildings.push(building);
  data.buildingColliders.push(createBoxCollider(
    `${building.id}-collider`,
    'building',
    building.position[0],
    building.position[2],
    building.scale[0],
    building.scale[2]
  ));
}

function createTransportBuilding(id, x, z, width, height, depth, color, kind, options = {}) {
  return {
    id,
    kind,
    position: [x, height / 2, z],
    scale: [width, height, depth],
    color,
    ...options
  };
}

function addTransportRoadSign(data, bounds, sign) {
  const [x, , z] = sign.position;
  if (!isInsideChunk(x, z, bounds)) return;

  data.roadSigns.push(sign);
}

function addTransportTrafficObstacle(data, bounds, obstacle) {
  const [x, , z] = obstacle.position;
  if (!isInsideChunk(x, z, bounds)) return;

  data.trafficObstacles.push(obstacle);
}

function addTransportSafeSpawn(data, bounds, chunkX, chunkZ, id, spawn, source) {
  if (!isInsideChunk(spawn.x, spawn.z, bounds)) return;

  data.safeSpawnPoints.push({
    id,
    chunkX,
    chunkZ,
    source,
    position: { x: spawn.x, y: SAFE_POINT_Y, z: spawn.z },
    heading: spawn.heading
  });
}

function addTransportAircraft(data, bounds, id, x, z, rotationY, color) {
  if (!isInsideChunk(x, z, bounds)) return;

  const fuselageColor = '#f4f7f8';
  const undersideColor = '#d7e0e4';
  const trimColor = '#1e4764';
  const cockpitColor = '#172431';
  const liveryColor = color === '#e7edf1' ? '#2f72b8' : color;
  const addPart = (partId, forward, lateral, baseY, width, height, depth, partColor) => {
    const point = localOffsetToWorld([x, baseY + height / 2, z], rotationY, forward, 0, lateral);
    data.trafficObstacles.push(createTrafficObstacle(
      `${id}-${partId}`,
      point[0],
      point[2],
      baseY,
      width,
      height,
      depth,
      partColor,
      rotationY,
      { type: 'aircraft' }
    ));
  };

  addPart('fuselage', 0, 0, 0.58, 54, 5.4, 6.4, fuselageColor);
  addPart('nose', 29.4, 0, 0.82, 7.2, 4.6, 5.2, fuselageColor);
  addPart('tail-cone', -29.4, 0, 0.92, 6.8, 4.6, 4.8, fuselageColor);
  addPart('window-band-left', 3, -3.35, 4.08, 38, 0.48, 0.18, trimColor);
  addPart('window-band-right', 3, 3.35, 4.08, 38, 0.48, 0.18, trimColor);
  addPart('cockpit-window', 32.1, 0, 4.42, 2.2, 0.62, 4.1, cockpitColor);
  addPart('main-wing', -1.5, 0, 1.98, 14.2, 0.86, 45, fuselageColor);
  addPart('left-engine', -3.8, -12.6, 0.82, 5.4, 2.25, 3.4, undersideColor);
  addPart('right-engine', -3.8, 12.6, 0.82, 5.4, 2.25, 3.4, undersideColor);
  addPart('left-winglet', -2.7, -22.8, 2.08, 1.1, 2.6, 1.4, liveryColor);
  addPart('right-winglet', -2.7, 22.8, 2.08, 1.1, 2.6, 1.4, liveryColor);
  addPart('horizontal-tail', -25.6, 0, 4.28, 8.4, 0.56, 18, fuselageColor);
  addPart('vertical-tail', -28.2, 0, 4.52, 7.2, 8.4, 1.15, liveryColor);
  addPart('tail-logo-panel', -30.3, 0, 8.9, 3.6, 2.5, 1.24, '#ffffff');
}

function addTransportRectObstacle(data, id, centerX, centerZ, width, height, depth, color, bounds, options = {}) {
  const clipped = clipRectToBounds(centerX, centerZ, width, depth, bounds);
  if (!clipped) return;

  data.trafficObstacles.push(createTrafficObstacle(
    id,
    clipped.centerX,
    clipped.centerZ,
    options.baseY ?? 0.04,
    clipped.width,
    height,
    clipped.depth,
    color,
    options.rotationY ?? 0,
    { type: options.type ?? 'transportDetail' }
  ));
}

function addTransportAirWallBox(data, bounds, id, centerX, centerZ, width, depth, minY, maxY) {
  const clipped = clipRectToBounds(centerX, centerZ, width, depth, bounds);
  if (!clipped) return;

  data.tunnelColliders.push(createHeightLimitedBoxCollider(
    id,
    'stationTunnelAirWall',
    clipped.centerX,
    clipped.centerZ,
    clipped.width,
    clipped.depth,
    minY,
    maxY
  ));
}

function addTransportSlopedObstacle(data, bounds, id, start, end, startY, endY, width, thickness, color, type) {
  const clip = clipLineToBounds(start, end, bounds, width / 2);
  if (!clip) return;

  data.trafficObstacles.push(createSlopedTrafficObstacle(
    id,
    clip.start,
    clip.end,
    lerp(startY, endY, clip.t0),
    lerp(startY, endY, clip.t1),
    width,
    thickness,
    color,
    type
  ));
}

function addTransportSegmentObstacle(data, bounds, id, start, end, thickness, height, color, baseY = 0.04, options = {}) {
  const clip = clipLineToBounds(start, end, bounds, thickness / 2);
  if (!clip) return;

  const length = Math.hypot(clip.end.x - clip.start.x, clip.end.z - clip.start.z);
  if (length <= 0.1) return;

  const center = midpoint(clip.start, clip.end);

  data.trafficObstacles.push(createTrafficObstacle(
    id,
    center.x,
    center.z,
    baseY,
    length,
    height,
    thickness,
    color,
    getSegmentBoxYaw(clip.start, clip.end),
    { type: options.type ?? 'transportDetail' }
  ));
}

function addTransportOffsetSegmentObstacle(
  data,
  bounds,
  id,
  start,
  end,
  lateral,
  thickness,
  height,
  color,
  baseY = 0.04,
  options = {}
) {
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const shiftedStart = {
    x: start.x + normal.x * lateral,
    z: start.z + normal.z * lateral
  };
  const shiftedEnd = {
    x: end.x + normal.x * lateral,
    z: end.z + normal.z * lateral
  };

  addTransportSegmentObstacle(
    data,
    bounds,
    id,
    shiftedStart,
    shiftedEnd,
    thickness,
    height,
    color,
    baseY,
    options
  );
}

function addTransportSlopedOffsetSegmentObstacle(
  data,
  bounds,
  id,
  start,
  end,
  lateral,
  width,
  thickness,
  color,
  startY,
  endY,
  options = {}
) {
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const shiftedStart = {
    x: start.x + normal.x * lateral,
    z: start.z + normal.z * lateral
  };
  const shiftedEnd = {
    x: end.x + normal.x * lateral,
    z: end.z + normal.z * lateral
  };

  addTransportSlopedObstacle(
    data,
    bounds,
    id,
    shiftedStart,
    shiftedEnd,
    startY,
    endY,
    width,
    thickness,
    color,
    options.type ?? 'transportDetail'
  );
}

function addTransportFlatRect(data, bounds, id, centerX, centerZ, width, depth, color, rotationY = 0) {
  const clipped = clipRectToBounds(centerX, centerZ, width, depth, bounds);
  if (!clipped) return;

  data.trafficObstacles.push(createTrafficObstacle(
    id,
    clipped.centerX,
    clipped.centerZ,
    GROUND_DRIVE_Y + 0.04,
    clipped.width,
    0.035,
    clipped.depth,
    color,
    rotationY,
    { type: 'transportGroundMark' }
  ));
}

function addTransportFlatSegment(data, bounds, id, start, end, thickness, color) {
  addTransportSegmentObstacle(
    data,
    bounds,
    id,
    start,
    end,
    thickness,
    0.035,
    color,
    GROUND_DRIVE_Y + 0.04,
    { type: 'transportGroundMark' }
  );
}

function clipRectToBounds(centerX, centerZ, width, depth, bounds) {
  const minX = Math.max(centerX - width / 2, bounds.minX);
  const maxX = Math.min(centerX + width / 2, bounds.maxX);
  const minZ = Math.max(centerZ - depth / 2, bounds.minZ);
  const maxZ = Math.min(centerZ + depth / 2, bounds.maxZ);

  if (maxX - minX <= 0.1 || maxZ - minZ <= 0.1) return null;

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ
  };
}

function getTransportHighwayTangent() {
  const [start, end] = TRANSPORT_HIGHWAY.points;
  return normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
}

function getRoadCenterline(road) {
  if (road.axis === 'x') {
    return {
      start: { x: road.minX, z: road.centerZ },
      end: { x: road.maxX, z: road.centerZ }
    };
  }

  if (road.axis === 'z') {
    return {
      start: { x: road.centerX, z: road.minZ },
      end: { x: road.centerX, z: road.maxZ }
    };
  }

  if (road.axis === 'segment') {
    return {
      start: { x: road.startX, z: road.startZ },
      end: { x: road.endX, z: road.endZ }
    };
  }

  return null;
}

function getRoadCrossWidth(road) {
  if (road.axis === 'x') return road.depth;
  if (road.axis === 'z') return road.width;
  if (road.axis === 'segment') return road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);
  return Math.min(road.width ?? 12, road.depth ?? 12);
}

function getRoadVisualY(road) {
  return road.position?.[1] ?? getRoadY(road.roadType, road.kind);
}

function getPointAlongLine(line, distance) {
  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });

  return {
    x: line.start.x + tangent.x * distance,
    z: line.start.z + tangent.z * distance
  };
}

function getLineSegmentIntersection(aStart, aEnd, bStart, bEnd) {
  const ax = aEnd.x - aStart.x;
  const az = aEnd.z - aStart.z;
  const bx = bEnd.x - bStart.x;
  const bz = bEnd.z - bStart.z;
  const denominator = ax * bz - az * bx;

  if (Math.abs(denominator) <= 0.000001) return null;

  const cx = bStart.x - aStart.x;
  const cz = bStart.z - aStart.z;
  const t = (cx * bz - cz * bx) / denominator;
  const u = (cx * az - cz * ax) / denominator;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return {
    x: aStart.x + ax * t,
    z: aStart.z + az * t,
    t,
    u
  };
}

function getClosestSegmentApproach(aStart, aEnd, bStart, bEnd) {
  const intersection = getLineSegmentIntersection(aStart, aEnd, bStart, bEnd);

  if (intersection) {
    const point = { x: intersection.x, z: intersection.z };

    return {
      distanceSq: 0,
      highwayPoint: point,
      roadPoint: point,
      t: intersection.t,
      u: intersection.u
    };
  }

  const candidates = [
    getApproachFromRoadPoint(aStart, 0, bStart, bEnd),
    getApproachFromRoadPoint(aEnd, 1, bStart, bEnd),
    getApproachFromHighwayPoint(bStart, 0, aStart, aEnd),
    getApproachFromHighwayPoint(bEnd, 1, aStart, aEnd)
  ].filter(Boolean);

  return candidates.reduce((best, candidate) => (
    !best || candidate.distanceSq < best.distanceSq ? candidate : best
  ), null);
}

function getApproachFromRoadPoint(point, t, highwayStart, highwayEnd) {
  const projection = projectPointToSegment(
    point.x,
    point.z,
    highwayStart.x,
    highwayStart.z,
    highwayEnd.x,
    highwayEnd.z
  );

  if (!projection) return null;

  const dx = point.x - projection.x;
  const dz = point.z - projection.z;

  return {
    distanceSq: dx * dx + dz * dz,
    highwayPoint: { x: projection.x, z: projection.z },
    roadPoint: point,
    t,
    u: projection.t
  };
}

function getApproachFromHighwayPoint(point, u, roadStart, roadEnd) {
  const projection = projectPointToSegment(
    point.x,
    point.z,
    roadStart.x,
    roadStart.z,
    roadEnd.x,
    roadEnd.z
  );

  if (!projection) return null;

  const dx = point.x - projection.x;
  const dz = point.z - projection.z;

  return {
    distanceSq: dx * dx + dz * dz,
    highwayPoint: point,
    roadPoint: { x: projection.x, z: projection.z },
    t: projection.t,
    u
  };
}

function getSegmentDistanceSq(aStart, aEnd, bStart, bEnd) {
  if (getLineSegmentIntersection(aStart, aEnd, bStart, bEnd)) return 0;

  return Math.min(
    getPointToSegmentDistanceSq(aStart, bStart, bEnd),
    getPointToSegmentDistanceSq(aEnd, bStart, bEnd),
    getPointToSegmentDistanceSq(bStart, aStart, aEnd),
    getPointToSegmentDistanceSq(bEnd, aStart, aEnd)
  );
}

function getPointToSegmentDistanceSq(point, start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0.000001) {
    const px = point.x - start.x;
    const pz = point.z - start.z;
    return px * px + pz * pz;
  }

  const t = clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSq, 0, 1);
  const x = start.x + dx * t;
  const z = start.z + dz * t;
  const px = point.x - x;
  const pz = point.z - z;

  return px * px + pz * pz;
}

function extendLine(line, startExtension, endExtension) {
  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });

  return {
    start: {
      x: line.start.x - tangent.x * startExtension,
      z: line.start.z - tangent.z * startExtension
    },
    end: {
      x: line.end.x + tangent.x * endExtension,
      z: line.end.z + tangent.z * endExtension
    }
  };
}

function createTrafficObstacle(id, x, z, baseY, width, height, depth, color, rotationY = 0, options = {}) {
  return {
    id,
    color,
    collidable: false,
    position: [x, baseY + height / 2, z],
    rotation: [0, rotationY, 0],
    scale: [width, height, depth],
    colliderMinY: baseY,
    colliderMaxY: baseY + height,
    type: options.type ?? 'trafficObstacle',
    lightKind: options.lightKind ?? null,
    blink: Boolean(options.blink),
    phase: options.phase ?? 0
  };
}

function createTrafficVehicle(id, startX, startZ, endX, endZ, baseY, width, height, depth, color, speed = 0.04, offset = 0, options = {}) {
  const path = options.path ?? {
    startX,
    startZ,
    endX,
    endZ
  };

  return {
    id,
    behavior: options.behavior ?? 'lane-keep',
    color,
    driveSide: TRAFFIC_DRIVE_SIDE,
    laneOffset: options.laneOffset ?? 0,
    lineColor: options.lineColor ?? null,
    path,
    baseY,
    speed,
    loopMode: options.loopMode ?? 'loop',
    metroCycleSeconds: options.metroCycleSeconds ?? null,
    metroDwellSeconds: options.metroDwellSeconds ?? null,
    metroLoop: Boolean(options.metroLoop),
    metroOneWay: Boolean(options.metroOneWay),
    metroReversibleEnds: Boolean(options.metroReversibleEnds),
    metroReverseServiceRanges: options.metroReverseServiceRanges ?? null,
    metroStops: options.metroStops ?? null,
    metroTerminalDwellSeconds: options.metroTerminalDwellSeconds ?? null,
    metroTerminalMargin: options.metroTerminalMargin ?? 0,
    metroTerminalStops: options.metroTerminalStops ?? null,
    pathKey: options.pathKey ?? getTrafficPathKey(path),
    preservePathYaw: Boolean(options.preservePathYaw),
    renderBounds: options.renderBounds ?? null,
    roadKind: options.roadKind ?? null,
    roadType: options.roadType ?? null,
    routeId: options.routeId ?? null,
    slowZones: options.slowZones ?? [],
    offset,
    scale: [width, height, depth],
    trainCarOffset: options.trainCarOffset ?? 0,
    trainEnd: options.trainEnd ?? null,
    trainOffset: options.trainOffset ?? null,
    trainSetId: options.trainSetId ?? null,
    vehicleType: options.vehicleType ?? 'car'
  };
}

function getDistrictTrafficVehicleColors(profile = DISTRICT_PROFILES.commercial) {
  if (profile.id === 'industrial' || profile.id === 'harbor') {
    return ['#c28f69', '#7898a8', '#d1bb78', '#6f8490', '#e36d5c'];
  }

  if (profile.id === 'residential') {
    return ['#d1bb78', '#7898a8', '#9fd08c', '#cfd4ca', '#c28f69'];
  }

  if (profile.id === 'oldTown') {
    return ['#c28f69', '#d1bb78', '#a3aa78', '#7898a8'];
  }

  if (profile.id === 'economic') {
    return ['#7898a8', '#d9d3ff', '#75b7d8', '#cfd4ca', '#e36d5c'];
  }

  return ['#d1bb78', '#7898a8', '#e36d5c', '#9fd08c', '#d9d3ff', '#c28f69'];
}

function isTrafficVehicleClearOfTransportHighwayConflict(vehicle) {
  if (FAST_ROADS_UNDERGROUND) return true;
  if (vehicle.roadKind === 'transport-highway') return true;
  if ((vehicle.baseY ?? GROUND_DRIVE_Y) > GROUND_DRIVE_Y + 1.2) return true;

  const points = getTrafficPathPoints(vehicle.path);
  if (points.some((point) => Number.isFinite(point.y) && point.y > GROUND_DRIVE_Y + 1.2)) {
    return true;
  }

  const [highwayStart, highwayEnd] = TRANSPORT_HIGHWAY.points;
  const clearance = TRANSPORT_HIGHWAY.width / 2 + 10;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (getSegmentDistanceSq(start, end, highwayStart, highwayEnd) <= clearance * clearance) {
      return false;
    }
  }

  return true;
}

function generateTrafficVehicles(bounds, roads, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial) {
  const vehicles = generateParkedVehicles(roads, chunkX, chunkZ);
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const colors = getDistrictTrafficVehicleColors(profile);
  let vehicleIndex = 0;
  let movingVehicleCount = 0;
  const profileMovingVehicleCap = profile.maxMovingVehicles ?? (profile.id === 'economic'
    ? 16
    : profile.id === 'residential'
      ? 11
      : 14);
  const maxMovingVehicles = Math.max(6, Math.round(profileMovingVehicleCap * 0.72));

  for (const road of roads) {
    if (movingVehicleCount >= maxMovingVehicles) break;
    if (!road.marked || road.trafficDisabled || road.roadType === ROAD_TYPES.parking || road.roadType === ROAD_TYPES.ramp) continue;
    if (road.kind === 'expressway-feeder' && hashNumber(chunkX, chunkZ, 770 + vehicleIndex) < 0.5) continue;

    const basePath = getTrafficPathForRoad(road, 0, 1, { bounds, chunkX, chunkZ });
    if (!basePath || !isTrafficPathUsableForRoad(basePath, road)) continue;

    const length = getTrafficPathLength(basePath);
    if (length < 88) continue;

    const densityRoll = hashNumber(chunkX, chunkZ, 730 + vehicleIndex);
    const elevated = road.roadType === ROAD_TYPES.elevatedHighway;
    const highway = road.roadType === ROAD_TYPES.highway;
    const transportHighway = road.kind === 'transport-highway';
    const transportOverpass = road.kind === 'transport-overpass-deck';
    const main = road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main';
    const baseTargetCountPerDirection = transportHighway
      ? (length > 260 ? 3 : 2)
      : transportOverpass
      ? 1
      : highway || elevated
      ? (length > 260 ? 2 : 1)
      : main
        ? (densityRoll > 0.18 ? 1 : 0)
        : densityRoll > 0.48 ? 1 : 0;
    const targetCountPerDirection = Math.max(
      0,
      Math.min(
        transportHighway ? 3 : 2,
        Math.round(baseTargetCountPerDirection * (profile.trafficDensity ?? 1))
      )
    );

    for (let directionIndex = 0; directionIndex < 2; directionIndex += 1) {
      const direction = directionIndex === 0 ? 1 : -1;

      for (let index = 0; index < targetCountPerDirection && movingVehicleCount < maxMovingVehicles; index += 1) {
        const laneOffset = getTrafficLaneOffset(road, direction, index);
        const path = getTrafficPathForRoad(road, laneOffset, direction, { bounds, chunkX, chunkZ });
        if (!path || !isTrafficPathUsableForRoad(path, road)) continue;
        const finalPath = createSmartTrafficPath(path, road, roads, direction, index, chunkX, chunkZ, vehicleIndex);
        const loopMode = 'loop';

        const slowZones = getTrafficSlowZonesForPath(finalPath, road);

        const offset = positiveModulo(
          hashNumber(chunkX + index + directionIndex * 11, chunkZ, 740 + vehicleIndex) +
            index / Math.max(1, targetCountPerDirection),
          1
        );
        const cargoTruck = profile.id === 'industrial' &&
          !highway &&
          !elevated &&
          hashNumber(chunkX, chunkZ, 755 + vehicleIndex + index + directionIndex * 7) < (profile.truckChance ?? 0);
        const deliveryTruck = !cargoTruck &&
          !highway &&
          !elevated &&
          hashNumber(chunkX, chunkZ, 756 + vehicleIndex + index + directionIndex * 7) < (
            profile.id === 'commercial' || profile.id === 'economic' || profile.id === 'harbor' ? 0.12 : 0.045
          );
        const taxi = !cargoTruck &&
          !deliveryTruck &&
          !highway &&
          !elevated &&
          main &&
          hashNumber(chunkX, chunkZ, 757 + vehicleIndex + index + directionIndex * 7) < (
            profile.id === 'commercial' || profile.id === 'downtown' || profile.id === 'economic' ? 0.22 : 0.08
          );
        const vehicleType = cargoTruck || deliveryTruck ? 'truck' : taxi ? 'taxi' : 'car';
        const color = taxi
          ? '#f2d486'
          : cargoTruck || deliveryTruck
            ? ['#cfd4ca', '#7898a8', '#c28f69'][Math.floor(hashNumber(chunkX, chunkZ, 758 + vehicleIndex) * 3)]
            : colors[Math.floor(hashNumber(chunkX, chunkZ, 750 + vehicleIndex + index + directionIndex * 7) * colors.length)];
        const baseSpeed = highway || elevated
          ? 0.11 + hashNumber(chunkX, chunkZ, 760 + vehicleIndex) * 0.035
          : main
            ? 0.082 + hashNumber(chunkX, chunkZ, 761 + vehicleIndex) * 0.026
            : 0.068 + hashNumber(chunkX, chunkZ, 762 + vehicleIndex) * 0.02;
        const speed = getCappedTrafficVehicleSpeed(road, finalPath, cargoTruck || deliveryTruck ? baseSpeed * 0.72 : baseSpeed);
        const vehicleBaseY = (road.position?.[1] ?? (elevated ? EXPRESSWAY_Y : GROUND_DRIVE_Y)) + 0.06;
        const width = cargoTruck || deliveryTruck
          ? 2.65
          : 2.1 + hashNumber(chunkX, chunkZ, 765 + vehicleIndex) * 0.3;
        const height = cargoTruck || deliveryTruck ? 1.62 : 1.1;
        const depth = cargoTruck || deliveryTruck
          ? 6.9 + hashNumber(chunkX, chunkZ, 766 + vehicleIndex) * 1.5
          : 4.1 + hashNumber(chunkX, chunkZ, 766 + vehicleIndex) * 0.55;

        vehicles.push(createTrafficVehicle(
          `traffic-${chunkX}-${chunkZ}-${road.id}-${directionIndex}-${index}`,
          path.startX,
          path.startZ,
          path.endX,
          path.endZ,
          vehicleBaseY,
          width,
          height,
          depth,
          color,
          speed,
          offset,
          {
            behavior: 'lane-keep',
            driveSide: TRAFFIC_DRIVE_SIDE,
            laneOffset,
            loopMode,
            path: finalPath,
            pathKey: getTrafficPathKey(finalPath, road),
            roadKind: road.kind,
            roadType: road.roadType,
            slowZones,
            vehicleType
          }
        ));
        movingVehicleCount += 1;
      }
    }

    vehicleIndex += 1;
  }

  return vehicles;
}

function createSmartTrafficPath(path, road, roads, direction, laneIndex, chunkX, chunkZ, vehicleIndex) {
  if (path.customTrafficPath) return path;
  if (road.roadType === ROAD_TYPES.highway || road.roadType === ROAD_TYPES.elevatedHighway || road.kind === 'transport-highway') {
    return path;
  }

  if (path.junctionLink) {
    return createJunctionLinkTrafficPath(path, road, direction, laneIndex, chunkX, chunkZ, vehicleIndex) ?? path;
  }

  const intersectionPath = createIntersectionTrafficPath(path, road, roads, direction, laneIndex, chunkX, chunkZ, vehicleIndex);
  if (intersectionPath) return intersectionPath;

  const shouldTurn = hashNumber(chunkX + laneIndex, chunkZ, 782 + vehicleIndex) > 0.42;
  if (!shouldTurn) return path;

  const turnRoad = findTrafficTurnRoad(path, road, roads, direction, laneIndex);
  if (!turnRoad) return path;

  const turnDirection = getTurnRoadDirection(turnRoad, path.endX, path.endZ);
  const turnLaneOffset = getTrafficLaneOffset(turnRoad, turnDirection, laneIndex);
  const turnPath = getTrafficPathForRoad(turnRoad, turnLaneOffset, turnDirection);
  if (!turnPath || !isTrafficPathUsableForRoad(turnPath, turnRoad)) return path;

  return {
    startX: path.startX,
    startZ: path.startZ,
    endX: turnPath.endX,
    endZ: turnPath.endZ,
    pathType: 'smart-turn',
    points: [
      { x: path.startX, z: path.startZ },
      { x: path.endX, z: path.endZ },
      { x: turnPath.startX, z: turnPath.startZ },
      { x: turnPath.endX, z: turnPath.endZ }
    ]
  };
}

function createJunctionLinkTrafficPath(path, road, direction, laneIndex, chunkX, chunkZ, vehicleIndex) {
  if (!path.junctionLink || !isProceduralConnectorTrafficRoad(road)) return null;

  const context = getJunctionLinkRouteContext(road, direction, chunkX, chunkZ);
  if (!context) return null;

  const outSide = chooseJunctionRouteOutboundSide(
    context.endChunk,
    context.inboundSide,
    laneIndex,
    chunkX,
    chunkZ,
    vehicleIndex
  );
  if (!outSide) return null;

  const targetChunk = getNeighborChunkCoord(context.endChunk.chunkX, context.endChunk.chunkZ, outSide);
  if (!targetChunk) return null;

  const outLeg = createJunctionLinkLeg(context.endChunk, targetChunk, road.roadType, laneIndex);
  if (!outLeg) return null;

  const points = createJunctionRouteTurnPoints(path, outLeg.start, outLeg.end);
  const signalT = getTrafficPathProgressBeforePoint(points, 1, 16);
  const yieldT = getTrafficPathProgressBeforePoint(points, 1, 8);
  const turnSignalEndT = getTrafficPathProgressBeforePoint(points, points.length - 2, -22);
  const yieldPoint = getChunkCenterPoint(context.endChunk);

  return {
    startX: points[0].x,
    startZ: points[0].z,
    endX: points[points.length - 1].x,
    endZ: points[points.length - 1].z,
    pathType: 'junction-route',
    signalAxis: axisForSide(context.inboundSide),
    signalT,
    turnSignal: getTurnSignalSide(context.inboundSide, outSide),
    turnSignalEndT,
    turnSignalStartT: Math.max(0, yieldT - 0.12),
    yieldPoint,
    yieldT,
    points
  };
}

function getChunkCenterPoint(chunk) {
  const bounds = getChunkBounds(chunk.chunkX, chunk.chunkZ);

  return {
    x: bounds.centerX,
    z: bounds.centerZ
  };
}

function getJunctionLinkRouteContext(road, direction, chunkX, chunkZ) {
  const neighbor = getNeighborChunkCoord(chunkX, chunkZ, road.side);
  if (!neighbor) return null;

  if (direction > 0) {
    return {
      startChunk: { chunkX, chunkZ },
      endChunk: neighbor,
      inboundSide: OPPOSITE_SIDE[road.side]
    };
  }

  return {
    startChunk: neighbor,
    endChunk: { chunkX, chunkZ },
    inboundSide: road.side
  };
}

function chooseJunctionRouteOutboundSide(endChunk, inboundSide, laneIndex, chunkX, chunkZ, vehicleIndex) {
  const connections = getAlignedConnections(endChunk.chunkX, endChunk.chunkZ);
  const choices = getIntersectionTurnChoices(inboundSide);
  const roll = hashNumber(chunkX + endChunk.chunkX * 5 + laneIndex * 17, chunkZ + endChunk.chunkZ * 7, 789 + vehicleIndex);
  const preference = roll < 0.48
    ? ['straight', 'right', 'left']
    : roll < 0.76
      ? ['right', 'straight', 'left']
      : ['left', 'straight', 'right'];

  for (const turnType of preference) {
    const side = choices[turnType];

    if (connections[side]) return side;
  }

  return null;
}

function createJunctionLinkLeg(fromChunk, toChunk, roadType, laneIndex) {
  const fromBounds = getChunkBounds(fromChunk.chunkX, fromChunk.chunkZ);
  const toBounds = getChunkBounds(toChunk.chunkX, toChunk.chunkZ);
  const startCenter = { x: fromBounds.centerX, z: fromBounds.centerZ };
  const endCenter = { x: toBounds.centerX, z: toBounds.centerZ };
  const tangent = normalizeVector({
    x: endCenter.x - startCenter.x,
    z: endCenter.z - startCenter.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const axis = Math.abs(tangent.x) >= Math.abs(tangent.z) ? 'x' : 'z';
  const direction = axis === 'x' ? Math.sign(tangent.x) || 1 : Math.sign(tangent.z) || 1;
  const roadWidth = getRoadWidth(roadType);
  const laneOffset = getTrafficLaneOffset({
    axis,
    roadType,
    width: roadWidth,
    depth: roadWidth
  }, direction, laneIndex);

  return {
    start: {
      x: startCenter.x + normal.x * laneOffset,
      z: startCenter.z + normal.z * laneOffset
    },
    end: {
      x: endCenter.x + normal.x * laneOffset,
      z: endCenter.z + normal.z * laneOffset
    }
  };
}

function createJunctionRouteTurnPoints(path, outStart, outEnd) {
  const approach = { x: path.endX, z: path.endZ };
  const approachVector = normalizeVector({
    x: path.endX - path.startX,
    z: path.endZ - path.startZ
  });
  const exitVector = normalizeVector({
    x: outEnd.x - outStart.x,
    z: outEnd.z - outStart.z
  });
  const transitionDistance = Math.hypot(outStart.x - approach.x, outStart.z - approach.z);
  const turnRadius = clamp(transitionDistance * 0.7, 5, 22);
  const entryControl = {
    x: approach.x + approachVector.x * turnRadius,
    z: approach.z + approachVector.z * turnRadius
  };
  const exitControl = {
    x: outStart.x - exitVector.x * turnRadius,
    z: outStart.z - exitVector.z * turnRadius
  };
  const turnSamples = transitionDistance > 0.75
    ? sampleCubicTurnPoints(approach, entryControl, exitControl, outStart, 7)
    : [];

  return dedupeTrafficPathPoints([
    { x: path.startX, z: path.startZ },
    approach,
    ...turnSamples,
    outStart,
    outEnd
  ]);
}

function createIntersectionTrafficPath(path, road, roads, direction, laneIndex, chunkX, chunkZ, vehicleIndex) {
  if (!isProceduralIntersectionSegment(road)) return null;
  if (!isTrafficDirectionTowardIntersection(road, direction)) return null;

  const outRoad = chooseIntersectionOutboundRoad(road, roads, laneIndex, chunkX, chunkZ, vehicleIndex);
  if (!outRoad) return null;

  const outDirection = getDirectionAwayFromIntersection(outRoad);
  const outLaneOffset = getTrafficLaneOffset(outRoad, outDirection, laneIndex);
  const outPath = getTrafficPathForRoad(outRoad, outLaneOffset, outDirection);

  if (!outPath || !isTrafficPathUsableForRoad(outPath, outRoad)) return null;

  const turnPoints = createIntersectionTurnPoints(path, outPath, road, outRoad, roads);
  const signalT = getTrafficPathProgressBeforePoint(turnPoints, 1, 13);
  const yieldT = getTrafficPathProgressBeforePoint(turnPoints, 1, 7);
  const turnSignalEndT = getTrafficPathProgressBeforePoint(turnPoints, turnPoints.length - 2, -16);
  const yieldPoint = getIntersectionTrafficCenter(
    { x: path.endX, z: path.endZ },
    { x: outPath.startX, z: outPath.startZ },
    road,
    outRoad,
    roads
  );

  return {
    startX: turnPoints[0].x,
    startZ: turnPoints[0].z,
    endX: turnPoints[turnPoints.length - 1].x,
    endZ: turnPoints[turnPoints.length - 1].z,
    pathType: 'intersection-turn',
    signalAxis: getTrafficSignalAxis(road),
    signalT,
    turnSignal: getTurnSignalSide(road.side, outRoad.side),
    turnSignalEndT,
    turnSignalStartT: Math.max(0, yieldT - 0.12),
    yieldPoint,
    yieldT,
    points: turnPoints
  };
}

function isProceduralIntersectionSegment(road) {
  return road?.kind === 'segment' &&
    ROAD_SIDES.includes(road.side) &&
    (road.axis === 'x' || road.axis === 'z') &&
    (road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main' || road.roadType === 'local' || road.roadType === ROAD_TYPES.groundRoad);
}

function isTrafficDirectionTowardIntersection(road, direction) {
  return direction === -getDirectionAwayFromIntersection(road);
}

function getDirectionAwayFromIntersection(road) {
  if (road.side === 'north' || road.side === 'west') return -1;
  if (road.side === 'south' || road.side === 'east') return 1;
  return 1;
}

function chooseIntersectionOutboundRoad(road, roads, laneIndex, chunkX, chunkZ, vehicleIndex) {
  const candidates = roads.filter((candidate) => (
    candidate !== road &&
    isProceduralIntersectionSegment(candidate) &&
    isCompatibleTrafficRoadType(candidate, road) &&
    Math.abs(getRoadVisualY(candidate) - getRoadVisualY(road)) < 0.8
  ));

  if (candidates.length === 0) return null;

  const bySide = new Map(candidates.map((candidate) => [candidate.side, candidate]));
  const choices = getIntersectionTurnChoices(road.side);
  const roll = hashNumber(chunkX + laneIndex * 19, chunkZ + vehicleIndex * 23, 784);
  const preference = roll < 0.54
    ? ['straight', 'right', 'left']
    : roll < 0.78
      ? ['right', 'straight', 'left']
      : ['left', 'straight', 'right'];

  for (const turnType of preference) {
    const candidate = bySide.get(choices[turnType]);
    if (candidate) return candidate;
  }

  return candidates[Math.floor(roll * candidates.length) % candidates.length] ?? null;
}

function getIntersectionTurnChoices(side) {
  if (side === 'north') return { straight: 'south', right: 'west', left: 'east' };
  if (side === 'south') return { straight: 'north', right: 'east', left: 'west' };
  if (side === 'east') return { straight: 'west', right: 'south', left: 'north' };
  return { straight: 'east', right: 'north', left: 'south' };
}

function getTurnSignalSide(inboundSide, outboundSide) {
  const choices = getIntersectionTurnChoices(inboundSide);

  if (outboundSide === choices.left) return 'left';
  if (outboundSide === choices.right) return 'right';
  return null;
}

function isCompatibleTrafficRoadType(candidate, road) {
  return candidate.roadType === road.roadType ||
    candidate.roadType === ROAD_TYPES.mainRoad ||
    candidate.roadType === 'main' ||
    road.roadType === ROAD_TYPES.mainRoad ||
    road.roadType === 'main';
}

function createIntersectionTurnPoints(path, outPath, road, outRoad, roads) {
  const approach = { x: path.endX, z: path.endZ };
  const exit = { x: outPath.startX, z: outPath.startZ };
  const center = getIntersectionTrafficCenter(approach, exit, road, outRoad, roads);
  const approachVector = normalizeVector({
    x: path.endX - path.startX,
    z: path.endZ - path.startZ
  });
  const exitVector = normalizeVector({
    x: outPath.endX - outPath.startX,
    z: outPath.endZ - outPath.startZ
  });
  const approachDistance = Math.hypot(center.x - approach.x, center.z - approach.z);
  const exitDistance = Math.hypot(exit.x - center.x, exit.z - center.z);
  const turnRadius = clamp(Math.min(approachDistance, exitDistance) * 0.75, 4, 18);
  const entryControl = {
    x: approach.x + approachVector.x * turnRadius,
    z: approach.z + approachVector.z * turnRadius
  };
  const exitControl = {
    x: exit.x - exitVector.x * turnRadius,
    z: exit.z - exitVector.z * turnRadius
  };
  const turnSamples = sampleCubicTurnPoints(approach, entryControl, exitControl, exit, 7);

  return dedupeTrafficPathPoints([
    { x: path.startX, z: path.startZ },
    approach,
    ...turnSamples,
    exit,
    { x: outPath.endX, z: outPath.endZ }
  ]);
}

function getIntersectionTrafficCenter(approach, exit, road, outRoad, roads) {
  const intersection = roads.find((candidate) => (
    candidate?.kind === 'intersection' &&
    Math.abs(getRoadVisualY(candidate) - getRoadVisualY(road)) < 0.8 &&
    isPointOnRoadSurface(approach.x, approach.z, candidate, 42) &&
    isPointOnRoadSurface(exit.x, exit.z, candidate, 42)
  ));

  if (intersection) {
    return { x: intersection.centerX, z: intersection.centerZ };
  }

  return {
    x: (road.centerX + outRoad.centerX) / 2,
    z: (road.centerZ + outRoad.centerZ) / 2
  };
}

function sampleCubicTurn(start, controlA, controlB, end, t) {
  const inverse = 1 - t;
  const a = inverse * inverse * inverse;
  const b = 3 * inverse * inverse * t;
  const c = 3 * inverse * t * t;
  const d = t * t * t;

  return {
    x: start.x * a + controlA.x * b + controlB.x * c + end.x * d,
    z: start.z * a + controlA.z * b + controlB.z * c + end.z * d
  };
}

function sampleCubicTurnPoints(start, controlA, controlB, end, sampleCount) {
  const count = Math.max(1, Math.floor(sampleCount));
  const points = [];

  for (let index = 1; index <= count; index += 1) {
    points.push(sampleCubicTurn(start, controlA, controlB, end, index / (count + 1)));
  }

  return points;
}

function dedupeTrafficPathPoints(points) {
  const deduped = [];

  for (const point of points) {
    const previous = deduped[deduped.length - 1];

    if (!previous || Math.hypot(point.x - previous.x, point.z - previous.z) > 0.5) {
      deduped.push(point);
    }
  }

  return deduped;
}

function getTrafficPathProgressBeforePoint(points, pointIndex, beforeDistance) {
  if (!Array.isArray(points) || pointIndex <= 0 || pointIndex >= points.length) return 0;

  let totalLength = 0;
  let targetLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const segmentLength = Math.hypot(points[index + 1].x - points[index].x, points[index + 1].z - points[index].z);

    if (index < pointIndex) {
      targetLength += segmentLength;
    }

    totalLength += segmentLength;
  }

  if (totalLength <= 0.000001) return 0;

  return clamp((targetLength - beforeDistance) / totalLength, 0.02, 0.96);
}

function isFastTrafficRoad(road) {
  return road.roadType === ROAD_TYPES.highway ||
    road.roadType === ROAD_TYPES.elevatedHighway ||
    road.kind === 'transport-highway';
}

function getCappedTrafficVehicleSpeed(road, path, baseSpeed) {
  if (!shouldApplyGroundTrafficSpeedLimit(road)) return baseSpeed;

  const pathLength = Math.max(getTrafficPathLength(path), 1);
  const speedLimit = (GROUND_TRAFFIC_SPEED_LIMIT_KMH / 3.6) / pathLength;

  return Math.min(baseSpeed, speedLimit);
}

function shouldApplyGroundTrafficSpeedLimit(road) {
  if (isFastTrafficRoad(road)) return false;
  if (road.kind === 'transport-overpass-deck') return false;

  const roadY = road.position?.[1] ?? GROUND_DRIVE_Y;
  return roadY <= GROUND_DRIVE_Y + 1.2;
}

function findTrafficTurnRoad(path, road, roads, direction, laneIndex) {
  const candidates = roads.filter((candidate) => (
    candidate !== road &&
    isTrafficTurnCandidate(candidate, road) &&
    areRoadsConnectedNearPoint(candidate, path.endX, path.endZ)
  ));

  if (candidates.length === 0) return null;

  const index = Math.floor(
    hashNumber(
      Math.round(path.endX) + direction * 17,
      Math.round(path.endZ) + laneIndex * 13,
      785
    ) * candidates.length
  );

  return candidates[Math.min(index, candidates.length - 1)];
}

function isTrafficTurnCandidate(candidate, road) {
  if (!candidate?.marked || candidate.roadType === ROAD_TYPES.parking || candidate.roadType === ROAD_TYPES.ramp) return false;
  if (candidate.roadType === ROAD_TYPES.elevatedHighway || candidate.kind === 'transport-highway') return false;
  if (candidate.axis === road.axis) return false;
  if ((candidate.axis !== 'x' && candidate.axis !== 'z' && candidate.axis !== 'segment') || road.axis === 'segment') return false;

  return candidate.roadType === road.roadType || candidate.roadType === ROAD_TYPES.mainRoad || road.roadType === ROAD_TYPES.mainRoad;
}

function areRoadsConnectedNearPoint(road, x, z) {
  return isPointOnRoadSurface(x, z, road, 10);
}

function getTurnRoadDirection(road, x, z) {
  if (road.axis === 'x') {
    return x < road.centerX ? 1 : -1;
  }

  if (road.axis === 'z') {
    return z < road.centerZ ? 1 : -1;
  }

  const startDistance = Math.hypot(x - road.startX, z - road.startZ);
  const endDistance = Math.hypot(x - road.endX, z - road.endZ);

  return startDistance <= endDistance ? 1 : -1;
}

function getTrafficSlowZonesForPath(path, road) {
  const zones = [];

  if (road.kind === 'transport-highway') {
    for (const toll of TRANSPORT_HIGHWAY.tolls) {
      const projection = projectPointToSegment(
        toll.point.x,
        toll.point.z,
        path.startX,
        path.startZ,
        path.endX,
        path.endZ
      );

      if (!projection) continue;

      const distance = Math.hypot(toll.point.x - projection.x, toll.point.z - projection.z);

      if (distance > TRANSPORT_HIGHWAY.width * 0.72) continue;

      zones.push({
        t: projection.t,
        radius: 0.045,
        intensity: 0.68
      });
    }
  }

  if (
    road.roadType === ROAD_TYPES.mainRoad ||
    road.roadType === 'main' ||
    road.roadType === ROAD_TYPES.groundRoad ||
    road.roadType === 'local'
  ) {
    const signalAxis = getTrafficSignalAxis(road);

    if (signalAxis && isPathTrafficSignalAware(path)) {
      zones.push({ t: path.signalT, radius: 0.095, intensity: 1, kind: 'trafficSignal', axis: path.signalAxis ?? signalAxis });
    } else if (signalAxis) {
      zones.push(
        { t: 0.042, radius: 0.085, intensity: 1, kind: 'trafficSignal', axis: signalAxis },
        { t: 0.958, radius: 0.085, intensity: 1, kind: 'trafficSignal', axis: signalAxis }
      );
    }

    if (isPathTrafficSignalAware(path)) {
      zones.push({ t: Math.max(0.02, path.signalT - 0.012), radius: 0.034, intensity: 0.42 });
    } else {
      zones.push(
        { t: 0.035, radius: 0.034, intensity: 0.42 },
        { t: 0.965, radius: 0.034, intensity: 0.42 }
      );
    }
  }

  return zones;
}

function isPathTrafficSignalAware(path) {
  return (path.pathType === 'intersection-turn' || path.pathType === 'junction-route') &&
    Number.isFinite(path.signalT);
}

function getTrafficSignalAxis(road) {
  if (!road) return null;
  if (road.axis === 'x' || road.axis === 'z') return road.axis;

  if (road.axis === 'segment' && Number.isFinite(road.startX) && Number.isFinite(road.endX)) {
    return Math.abs(road.endX - road.startX) >= Math.abs(road.endZ - road.startZ) ? 'x' : 'z';
  }

  return null;
}

function getTrafficPathKey(path, road = null) {
  const roadId = road?.id ?? 'path';
  const points = getTrafficPathPoints(path);

  return [
    roadId,
    ...points.flatMap((point) => [Math.round(point.x), Math.round(point.z)])
  ].join(':');
}

function getTrafficPathLength(path) {
  const points = getTrafficPathPoints(path);
  let length = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    length += Math.hypot(points[index + 1].x - points[index].x, points[index + 1].z - points[index].z);
  }

  return length;
}

function getTrafficPathPoints(path) {
  if (Array.isArray(path?.points) && path.points.length >= 2) {
    return path.points;
  }

  return [
    { x: path?.startX ?? 0, z: path?.startZ ?? 0 },
    { x: path?.endX ?? 0, z: path?.endZ ?? 0 }
  ];
}

function generateParkedVehicles(roads, chunkX, chunkZ) {
  const vehicles = [];
  const colors = ['#d1bb78', '#7898a8', '#e36d5c', '#9fd08c', '#c28f69', '#e36d5c'];
  const parkingLots = roads.filter((road) => road.roadType === ROAD_TYPES.parking);

  for (const parkingLot of parkingLots) {
    const columns = clamp(Math.floor(parkingLot.width / 15), 3, 8);
    const rows = parkingLot.depth >= 58 ? [-1, 1] : [1];
    const xStart = parkingLot.centerX - parkingLot.width * 0.34;
    const xStep = columns > 1 ? parkingLot.width * 0.68 / (columns - 1) : 0;
    const parkingKind = parkingLot.kind ?? '';
    let spotIndex = 0;

    for (const rowSide of rows) {
      const z = parkingLot.centerZ + rowSide * parkingLot.depth * 0.24;

      for (let column = 0; column < columns; column += 1) {
        if (hashNumber(chunkX + column, chunkZ + rowSide, 860 + spotIndex) < 0.34) {
          spotIndex += 1;
          continue;
        }

        const x = xStart + column * xStep;
        const noseOffset = rowSide > 0 ? -1.2 : 1.2;
        const truckSpot = parkingKind === 'truck-yard-parking';
        const busSpot = parkingKind === 'bus-terminal-parking';
        const taxiSpot = parkingKind === 'hotel-shuttle-parking' && spotIndex % 3 === 0;
        const vehicleType = truckSpot ? 'truck' : busSpot ? 'bus' : taxiSpot ? 'taxi' : 'car';
        const color = truckSpot
          ? ['#cfd4ca', '#7898a8', '#c28f69'][Math.floor(hashNumber(chunkX, chunkZ, 871 + spotIndex) * 3)]
          : busSpot
            ? CITY_BUS_ROUTES[spotIndex % CITY_BUS_ROUTES.length].color
            : taxiSpot
              ? '#f2d486'
              : colors[Math.floor(hashNumber(chunkX, chunkZ, 870 + spotIndex) * colors.length)];
        const width = truckSpot ? 2.65 : busSpot ? 2.72 : 2.15;
        const height = truckSpot ? 1.6 : busSpot ? 2.16 : 1.1;
        const depth = truckSpot ? 7.6 : busSpot ? 10.7 : 4.2;

        vehicles.push(createTrafficVehicle(
          `parked-${chunkX}-${chunkZ}-${parkingLot.id}-${spotIndex}`,
          x,
          z + noseOffset,
          x,
          z - noseOffset,
          GROUND_DRIVE_Y + 0.06,
          width,
          height,
          depth,
          color,
          0,
          0.5,
          {
            roadKind: parkingKind,
            roadType: ROAD_TYPES.parking,
            routeId: busSpot ? CITY_BUS_ROUTES[spotIndex % CITY_BUS_ROUTES.length].id : null,
            vehicleType
          }
        ));
        spotIndex += 1;
      }
    }
  }

  return vehicles;
}

function isTrafficPathOnRoad(path, road) {
  for (const t of [0.12, 0.5, 0.88]) {
    const x = lerp(path.startX, path.endX, t);
    const z = lerp(path.startZ, path.endZ, t);

    if (!isPointOnRoadSurface(x, z, road, 0.1)) {
      return false;
    }
  }

  return true;
}

function getTrafficLaneOffset(road, direction, laneIndex = 0) {
  const roadWidth = road.axis === 'x'
    ? road.depth
    : road.axis === 'z'
      ? road.width
      : road.surface?.width ?? road.visualScale?.[1] ?? road.width ?? EXPRESSWAY_WIDTH;
  const laneSign = getTrafficLaneOffsetSign(road, direction);

  if (road.kind === 'transport-highway') {
    const laneWidth = roadWidth / 6;
    const laneSlot = clamp(laneIndex, 0, 2);
    const offset = laneWidth * (laneSlot + 0.5);

    return laneSign * offset;
  }

  const laneBase = road.roadType === ROAD_TYPES.elevatedHighway
    ? Math.min(7.2, roadWidth * 0.26)
    : Math.min(Math.max(2.2, roadWidth * 0.24), 4.2);
  const extraLane = laneIndex > 0 ? Math.min(2.6, roadWidth * 0.14) * laneIndex : 0;
  const offset = laneBase + extraLane;

  return laneSign * offset;
}

function getTrafficLaneOffsetSign(road, direction) {
  const leftSideSign = getLeftTrafficLaneOffsetSign(road, direction);

  return TRAFFIC_DRIVE_SIDE === 'left' ? leftSideSign : -leftSideSign;
}

function getLeftTrafficLaneOffsetSign(road, direction) {
  const forward = direction >= 0 ? 1 : -1;

  if (road.axis === 'z') {
    return -forward;
  }

  return forward;
}

function isTrafficPathUsableForRoad(path, road) {
  return path?.junctionLink || path?.customTrafficPath || isTrafficPathOnRoad(path, road);
}

function getTrafficPathForRoad(road, laneOffset = 0, direction = 1, context = {}) {
  if (Array.isArray(road.trafficPathPoints) && road.trafficPathPoints.length >= 2) {
    const points = offsetTrafficPathPoints(road.trafficPathPoints, laneOffset);
    const path = {
      startX: points[0].x,
      startZ: points[0].z,
      endX: points[points.length - 1].x,
      endZ: points[points.length - 1].z,
      customTrafficPath: true,
      points
    };

    return direction > 0 ? path : reverseTrafficPath(path);
  }

  if (isProceduralConnectorTrafficRoad(road)) {
    const connectionPath = getTrafficJunctionConnectionPath(road, laneOffset, context);

    if (!connectionPath) return null;

    return direction > 0 ? connectionPath : reverseTrafficPath(connectionPath);
  }

  const inset = road.roadType === ROAD_TYPES.elevatedHighway ? 8 : 5;
  let path = null;

  if (road.axis === 'x') {
    if (road.maxX - road.minX <= inset * 2) return null;

    path = {
      startX: road.minX + inset,
      startZ: road.centerZ + laneOffset,
      endX: road.maxX - inset,
      endZ: road.centerZ + laneOffset
    };
    return direction > 0 ? path : reverseTrafficPath(path);
  }

  if (road.axis === 'z') {
    if (road.maxZ - road.minZ <= inset * 2) return null;

    path = {
      startX: road.centerX + laneOffset,
      startZ: road.minZ + inset,
      endX: road.centerX + laneOffset,
      endZ: road.maxZ - inset
    };
    return direction > 0 ? path : reverseTrafficPath(path);
  }

  if (road.axis === 'segment') {
    const length = Math.max(road.length ?? 0, 0);
    if (length <= inset * 2) return null;

    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const normal = { x: -tangent.z, z: tangent.x };

    path = {
      startX: road.startX + tangent.x * inset + normal.x * laneOffset,
      startZ: road.startZ + tangent.z * inset + normal.z * laneOffset,
      endX: road.endX - tangent.x * inset + normal.x * laneOffset,
      endZ: road.endZ - tangent.z * inset + normal.z * laneOffset
    };
    return direction > 0 ? path : reverseTrafficPath(path);
  }

  return null;
}

function offsetTrafficPathPoints(points, laneOffset = 0) {
  if (!laneOffset) return points.map((point) => ({ ...point }));

  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangent = normalizeVector({
      x: next.x - previous.x,
      z: next.z - previous.z
    });
    const normal = { x: -tangent.z, z: tangent.x };

    return {
      ...point,
      x: point.x + normal.x * laneOffset,
      z: point.z + normal.z * laneOffset
    };
  });
}

function reverseTrafficPath(path) {
  const reversed = {
    ...path,
    startX: path.endX,
    startZ: path.endZ,
    endX: path.startX,
    endZ: path.startZ
  };

  if (Array.isArray(path.points)) {
    reversed.points = [...path.points].reverse();
  }

  return reversed;
}

function isProceduralConnectorTrafficRoad(road) {
  return road?.kind === 'segment' &&
    (road.side === 'east' || road.side === 'south' || road.side === 'west' || road.side === 'north') &&
    (road.axis === 'x' || road.axis === 'z') &&
    (road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main' || road.roadType === 'local' || road.roadType === ROAD_TYPES.groundRoad);
}

function getTrafficJunctionConnectionPath(road, laneOffset, context) {
  const { bounds, chunkX, chunkZ } = context;
  if (!bounds || !Number.isInteger(chunkX) || !Number.isInteger(chunkZ)) return null;

  if (road.side !== 'east' && road.side !== 'south') return null;

  const neighbor = getNeighborChunkCoord(chunkX, chunkZ, road.side);
  if (!neighbor) return null;

  const neighborBounds = getChunkBounds(neighbor.chunkX, neighbor.chunkZ);
  const start = { x: bounds.centerX, z: bounds.centerZ };
  const end = { x: neighborBounds.centerX, z: neighborBounds.centerZ };
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };

  return {
    startX: start.x + normal.x * laneOffset,
    startZ: start.z + normal.z * laneOffset,
    endX: end.x + normal.x * laneOffset,
    endZ: end.z + normal.z * laneOffset,
    junctionLink: true,
    pathType: 'junction-link'
  };
}

function createRectSurface(id, roadType, centerX, centerZ, width, depth, y, axis) {
  return {
    id,
    roadType,
    shape: 'rect',
    axis,
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - depth / 2,
    maxZ: centerZ + depth / 2,
    centerX,
    centerZ,
    width,
    depth,
    y
  };
}

function createCircleSurface(id, roadType, centerX, centerZ, radius, y) {
  return {
    id,
    roadType,
    shape: 'circle',
    centerX,
    centerZ,
    radius,
    y
  };
}

function createDriveSurfaces(roads, roundabouts) {
  const surfaces = [];

  for (const road of roads) {
    if (Array.isArray(road.driveSurfaceSlices)) {
      surfaces.push(...road.driveSurfaceSlices);
      continue;
    }

    if (road.surface) {
      surfaces.push(road.surface);
      continue;
    }

    surfaces.push(createRectSurface(
      road.id,
      road.roadType,
      road.centerX,
      road.centerZ,
      road.width,
      road.depth,
      GROUND_DRIVE_Y,
      road.axis
    ));
  }

  for (const roundabout of roundabouts) {
    surfaces.push(createCircleSurface(
      roundabout.id,
      ROAD_TYPES.roundabout,
      roundabout.position[0],
      roundabout.position[2],
      roundabout.radius,
      GROUND_DRIVE_Y
    ));
  }

  return surfaces;
}

function createEmptyExpresswayData() {
  return {
    groundCutouts: [],
    guardrailColliders: [],
    guardrails: [],
    roadColliders: [],
    roadSigns: [],
    roadSupports: [],
    roads: [],
    trafficObstacles: [],
    tunnelColliders: [],
    tunnelEntrances: [],
    tunnelZones: []
  };
}

function generateExpressways(bounds, chunkX, chunkZ, groundRoads, clearanceRoads = []) {
  const data = createEmptyExpresswayData();

  for (const route of EXPRESSWAY_ROUTES) {
    if (FAST_ROADS_UNDERGROUND) {
      addUndergroundExpresswayRoute(data, route, bounds, chunkX, chunkZ, groundRoads);
      continue;
    }

    addExpresswayDeck(data, route, bounds, chunkX, chunkZ);
    addExpresswayEntrances(data, route, bounds, chunkX, chunkZ, groundRoads);
  }

  const groundClearanceRoads = getGroundClearanceRoads([...groundRoads, ...clearanceRoads], data.roads);

  for (const road of data.roads) {
    if (road.kind === 'expressway-deck') {
      addExpresswaySupports(data, road, bounds, groundClearanceRoads);
    }
  }

  return data;
}

function addUndergroundExpresswayRoute(data, route, bounds, chunkX, chunkZ, groundRoads = []) {
  const tunnelY = FAST_ROAD_TUNNEL_Y;
  const baseId = `expressway-underground-${route.id}`;

  for (const segment of getRouteSegments(route)) {
    const clip = clipLineToBounds(segment.start, segment.end, bounds, EXPRESSWAY_WIDTH / 2);
    if (!clip) continue;

    const road = createSegmentRoad(
      `${route.id}-tunnel-${segment.index}-${chunkX}-${chunkZ}`,
      'expressway-tunnel',
      ROAD_TYPES.highway,
      clip.start,
      clip.end,
      EXPRESSWAY_WIDTH,
      tunnelY,
      {
        marked: true,
        side: 'expressway-tunnel'
      }
    );

    addExpresswayRoad(data, road);
    addFastRoadTunnelSegmentDetails(
      data,
      `${baseId}-${segment.index}-${chunkX}-${chunkZ}`,
      clip.start,
      clip.end,
      EXPRESSWAY_WIDTH,
      tunnelY,
      {
        includeCutout: false,
        zoneKind: 'expressway-tunnel'
      }
    );
  }

  for (const ramp of getExpresswayRampPaths(route)) {
    const adjustedRamp = adjustExpresswayRampLanding(ramp, groundRoads);
    const feederTarget = isInsideChunk(adjustedRamp.groundPoint.x, adjustedRamp.groundPoint.z, bounds)
      ? resolveRampFeederTarget(adjustedRamp, groundRoads)
      : null;

    addUndergroundExpresswayRamp(data, route, adjustedRamp, bounds, chunkX, chunkZ, tunnelY);

    if (feederTarget) {
      addExpresswayFeederRoad(data, route, adjustedRamp, bounds, feederTarget);
      addExpresswayEntranceSign(data, route, adjustedRamp, bounds, groundRoads);
    } else {
      addFastRoadSurfaceConnector(
        data,
        bounds,
        `${route.id}-${adjustedRamp.id}-surface-connector-${chunkX}-${chunkZ}`,
        'expressway-surface-connector',
        EXPRESSWAY_FEEDER_WIDTH,
        adjustedRamp.groundPoint,
        adjustedRamp.outward,
        groundRoads,
        addExpresswayRoad
      );
    }
  }
}

function addUndergroundExpresswayRamp(data, route, ramp, bounds, chunkX, chunkZ, tunnelY) {
  const segments = getRampPathSegments(ramp);
  if (segments.length === 0) return;

  const baseId = `expressway-underground-${route.id}-${ramp.id}-${chunkX}-${chunkZ}`;

  for (const segment of segments) {
    const clip = clipLineToBounds(segment.start, segment.end, bounds, EXPRESSWAY_RAMP_WIDTH / 2);
    if (!clip) continue;

    const startT = (segment.distanceStart + segment.length * clip.t0) / segment.totalLength;
    const endT = (segment.distanceStart + segment.length * clip.t1) / segment.totalLength;
    const startY = getUndergroundFastRoadRampElevation(tunnelY, startT);
    const endY = getUndergroundFastRoadRampElevation(tunnelY, endT);
    const road = createExpresswayRampRoad(
      route,
      ramp,
      segment.index,
      clip.start,
      clip.end,
      startY,
      endY,
      chunkX,
      chunkZ
    );

    addExpresswayRoad(data, road);
    addFastRoadTunnelCutout(
      data,
      `${baseId}-ramp-cutout-${segment.index}`,
      clip.start,
      clip.end,
      EXPRESSWAY_RAMP_WIDTH + FAST_ROAD_RAMP_CUTOUT_EXTRA_WIDTH,
      bounds
    );
    addFastRoadRectTunnelEnvelope(
      data,
      bounds,
      `${baseId}-ramp-box-${segment.index}`,
      clip.start,
      clip.end,
      EXPRESSWAY_RAMP_WIDTH,
      startY,
      endY
    );
  }

  const firstSegment = segments[0];
  const portalPoint = firstSegment.start;
  const portalTangent = normalizeVector({
    x: firstSegment.end.x - firstSegment.start.x,
    z: firstSegment.end.z - firstSegment.start.z
  });

  addFastRoadRectTunnelMouth(data, bounds, `${baseId}-mouth`, portalPoint, portalTangent, EXPRESSWAY_RAMP_WIDTH, GROUND_DRIVE_Y);

  if (isBoxOverlappingChunk(portalPoint.x, portalPoint.z, EXPRESSWAY_RAMP_WIDTH + 28, EXPRESSWAY_RAMP_WIDTH + 28, bounds, 18)) {
    const zoneEnd = {
      x: portalPoint.x + portalTangent.x * 120,
      z: portalPoint.z + portalTangent.z * 120
    };
    addFastRoadRampTunnelZone(data, `${baseId}-zone`, 'expressway-tunnel', EXPRESSWAY_RAMP_WIDTH, ramp.groundPoint, portalPoint, zoneEnd, zoneEnd, tunnelY);
  }
}

function getUndergroundFastRoadRampElevation(tunnelY, t) {
  return lerp(GROUND_DRIVE_Y, tunnelY, smootherStep(t));
}

function addFastRoadTunnelSegmentDetails(data, baseId, start, end, width, tunnelY, options = {}) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  if (length <= 1) return;

  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const rotationY = Math.atan2(tangent.x, tangent.z);

  if (options.includeCutout !== false) {
    addFastRoadTunnelCutout(data, `${baseId}-covered-cut`, start, end, width + 12);
  }

  data.tunnelZones.push({
    id: `${baseId}-zone`,
    kind: options.zoneKind ?? 'fast-road-tunnel',
    width,
    rampStart: { ...start },
    tunnelStart: { ...start },
    tunnelEnd: { ...end },
    rampEnd: { ...end },
    y: tunnelY
  });

  if (options.includeInterior === false) return;

  addTransportUnderpassInterior(data, baseId, start, end, width, tunnelY, tangent, normal, rotationY);
  addTransportUnderpassLights(data, baseId, start, end, width, tunnelY, tangent, normal, rotationY);
  addTransportUnderpassRibs(data, baseId, start, end, width, tunnelY, tangent, normal, rotationY);
}

function addFastRoadRampTunnelZone(data, id, kind, width, rampStart, tunnelStart, tunnelEnd, rampEnd, tunnelY) {
  data.tunnelZones.push({
    id,
    kind,
    width,
    rampStart: { ...rampStart },
    tunnelStart: { ...tunnelStart },
    tunnelEnd: { ...tunnelEnd },
    rampEnd: { ...rampEnd },
    y: tunnelY
  });
}

function addFastRoadTunnelCutout(data, id, start, end, width, chunkBounds = null) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  const isMostlyAxisAligned = Math.abs(end.x - start.x) < 0.01 || Math.abs(end.z - start.z) < 0.01;

  if (!isMostlyAxisAligned && length > width * 1.6) {
    addSegmentedFastRoadTunnelCutouts(data, id, start, end, width, chunkBounds);
    return;
  }

  const bounds = getSegmentBounds(start, end, width);

  if (
    chunkBounds &&
    !isBoxOverlappingChunk(bounds.centerX, bounds.centerZ, bounds.width, bounds.depth, chunkBounds)
  ) {
    return;
  }

  data.groundCutouts.push({
    id,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ
  });
}

function addSegmentedFastRoadTunnelCutouts(data, id, start, end, width, chunkBounds = null) {
  const length = Math.max(Math.hypot(end.x - start.x, end.z - start.z), 0.0001);
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const step = Math.max(18, width * 0.72);
  const size = width * 1.08;
  const count = Math.max(1, Math.ceil(length / step));

  for (let index = 0; index < count; index += 1) {
    const distance = Math.min(length, index * step + step / 2);
    const point = {
      x: start.x + tangent.x * distance,
      z: start.z + tangent.z * distance
    };

    if (chunkBounds && !isBoxOverlappingChunk(point.x, point.z, size, size, chunkBounds, 2)) continue;

    data.groundCutouts.push({
      id: `${id}-seg-${index}`,
      minX: point.x - size / 2,
      maxX: point.x + size / 2,
      minZ: point.z - size / 2,
      maxZ: point.z + size / 2
    });
  }
}

function addFastRoadRectTunnelEnvelope(data, bounds, id, start, end, width, startY, endY) {
  const wallThickness = FAST_ROAD_TUNNEL_BOX_WALL_THICKNESS;
  const length = Math.max(Math.hypot(end.x - start.x, end.z - start.z), 0.0001);
  const portalInsetRatio = clamp(FAST_ROAD_TUNNEL_ENVELOPE_PORTAL_INSET / length, 0.045, 0.24);
  const enteringFromGround = startY >= GROUND_DRIVE_Y - 0.7 && endY < startY - 1.5;
  const exitingToGround = endY >= GROUND_DRIVE_Y - 0.7 && startY < endY - 1.5;
  const ceilingThresholdY = GROUND_DRIVE_Y - FAST_ROAD_TUNNEL_BOX_CLEARANCE - 0.28;
  const ceilingStartT = enteringFromGround
    ? Math.max(portalInsetRatio, getFastRoadRampThresholdT(startY, endY, ceilingThresholdY))
    : 0;
  const ceilingEndT = exitingToGround
    ? Math.min(1 - portalInsetRatio, getFastRoadRampThresholdT(startY, endY, ceilingThresholdY))
    : 1;
  const floorClip = clipLineToBounds(start, end, bounds, width / 2 + wallThickness + 1.8);
  if (floorClip) {
    const floorStartY = lerp(startY, endY, floorClip.t0);
    const floorEndY = lerp(startY, endY, floorClip.t1);

    data.trafficObstacles.push(createSlopedTrafficObstacle(
      `${id}-floor-fill`,
      floorClip.start,
      floorClip.end,
      floorStartY - 0.11,
      floorEndY - 0.11,
      width + wallThickness * 2.4 + 2.8,
      0.09,
      '#3f494d',
      'transportUnderpassTrenchFloor'
    ));
  }

  if (enteringFromGround && ceilingStartT > 0.03) {
    addFastRoadOpenCutSkirtWalls(
      data,
      bounds,
      `${id}-open-cut-entry`,
      start,
      lerpPoint(start, end, ceilingStartT),
      startY,
      lerp(startY, endY, ceilingStartT),
      width
    );
  }

  if (exitingToGround && ceilingEndT < 0.97) {
    addFastRoadOpenCutSkirtWalls(
      data,
      bounds,
      `${id}-open-cut-exit`,
      lerpPoint(start, end, ceilingEndT),
      end,
      lerp(startY, endY, ceilingEndT),
      endY,
      width
    );
  }

  if (ceilingEndT - ceilingStartT <= 0.025) return;

  const envelopeStartT = ceilingStartT;
  const envelopeEndT = ceilingEndT;
  const envelopeStart = lerpPoint(start, end, envelopeStartT);
  const envelopeEnd = lerpPoint(start, end, envelopeEndT);
  const envelopeStartY = lerp(startY, endY, envelopeStartT);
  const envelopeEndY = lerp(startY, endY, envelopeEndT);
  const clip = clipLineToBounds(envelopeStart, envelopeEnd, bounds, width / 2 + wallThickness + 1.8);
  if (!clip) return;

  const clippedStartY = lerp(envelopeStartY, envelopeEndY, clip.t0);
  const clippedEndY = lerp(envelopeStartY, envelopeEndY, clip.t1);
  const tangent = normalizeVector({
    x: clip.end.x - clip.start.x,
    z: clip.end.z - clip.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const wallHeight = FAST_ROAD_TUNNEL_BOX_CLEARANCE + 0.65;
  const roofWidth = width + wallThickness * 2.4;
  const roofStartY = clippedStartY + FAST_ROAD_TUNNEL_BOX_CLEARANCE;
  const roofEndY = clippedEndY + FAST_ROAD_TUNNEL_BOX_CLEARANCE;

  data.trafficObstacles.push(createSlopedTrafficObstacle(
    `${id}-ceiling`,
    clip.start,
    clip.end,
    roofStartY,
    roofEndY,
    roofWidth,
    0.62,
    '#5f6a70',
    'transportUnderpassCeiling'
  ));

  for (const side of [-1, 1]) {
    const sideLabel = side > 0 ? 'right' : 'left';
    const lateralOffset = side * (width / 2 + wallThickness / 2);
    const wallStart = offsetPlanarPoint(clip.start, tangent, normal, 0, lateralOffset);
    const wallEnd = offsetPlanarPoint(clip.end, tangent, normal, 0, lateralOffset);
    const wallStartY = clippedStartY - 0.18;
    const wallEndY = clippedEndY - 0.18;

    data.trafficObstacles.push(createSlopedVerticalWallObstacle(
      `${id}-wall-${sideLabel}`,
      wallStart,
      wallEnd,
      wallStartY,
      wallEndY,
      wallHeight,
      wallThickness,
      '#636e74',
      'transportUnderpassWall'
    ));
    data.tunnelColliders.push(createHeightLimitedSegmentCollider(
      `${id}-wall-${sideLabel}-collider`,
      'tunnelWall',
      wallStart,
      wallEnd,
      wallThickness + 0.32,
      Math.min(wallStartY, wallEndY),
      Math.max(wallStartY, wallEndY) + wallHeight + 0.6
    ));
  }
}

function getFastRoadRampThresholdT(startY, endY, thresholdY) {
  const delta = endY - startY;
  if (Math.abs(delta) <= 0.0001) return startY <= thresholdY ? 0 : 1;
  return clamp((thresholdY - startY) / delta, 0, 1);
}

function addFastRoadOpenCutSkirtWalls(data, bounds, id, start, end, startY, endY, width) {
  const length = Math.max(Math.hypot(end.x - start.x, end.z - start.z), 0.0001);
  const segmentCount = Math.min(8, Math.max(1, Math.ceil(length / 58)));
  const tangent = normalizeVector({
    x: end.x - start.x,
    z: end.z - start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const lateralOffset = width / 2 + FAST_ROAD_RAMP_CUTOUT_EXTRA_WIDTH / 2 + 0.9;
  const wallThickness = 1.18;

  for (let index = 0; index < segmentCount; index += 1) {
    const t0 = index / segmentCount;
    const t1 = (index + 1) / segmentCount;
    const midT = (t0 + t1) / 2;
    const roadY = lerp(startY, endY, midT);
    if (roadY > GROUND_DRIVE_Y - 0.34) continue;

    const sectionStart = lerpPoint(start, end, t0);
    const sectionEnd = lerpPoint(start, end, t1);
    const baseY = roadY - 0.18;
    const topY = Math.min(GROUND_DRIVE_Y + 0.32, roadY + 3.1);
    const height = Math.max(0, topY - baseY);
    if (height < 0.55) continue;

    for (const side of [-1, 1]) {
      const offset = side * lateralOffset;
      addTransportSegmentObstacle(
        data,
        bounds,
        `${id}-skirt-${index}-${side > 0 ? 'right' : 'left'}`,
        {
          x: sectionStart.x + normal.x * offset,
          z: sectionStart.z + normal.z * offset
        },
        {
          x: sectionEnd.x + normal.x * offset,
          z: sectionEnd.z + normal.z * offset
        },
        wallThickness,
        height,
        '#536068',
        baseY,
        { type: 'transportUnderpassRetainingWall' }
      );
    }
  }
}

function addFastRoadRectTunnelMouth(data, bounds, id, point, tangent, width, roadY) {
  const direction = normalizeVector(tangent);
  const depth = 7.2;
  const wallThickness = FAST_ROAD_TUNNEL_BOX_WALL_THICKNESS;
  const clearance = FAST_ROAD_TUNNEL_BOX_CLEARANCE;
  const frameHeight = clearance + 0.9;
  const normal = { x: -direction.z, z: direction.x };
  const rotationY = Math.atan2(direction.x, direction.z);
  const postLateralOffset = width / 2 + wallThickness / 2 + 4.8;
  const headerWidth = Math.max(width + wallThickness * 4.8, postLateralOffset * 2 + wallThickness);
  const center = {
    x: point.x + direction.x * (depth / 2 + 0.8),
    z: point.z + direction.z * (depth / 2 + 0.8)
  };

  if (!isBoxOverlappingChunk(center.x, center.z, width + wallThickness * 8, depth + 10, bounds, 4)) return;

  data.trafficObstacles.push(createTrafficObstacle(
    `${id}-header`,
    center.x,
    center.z,
    roadY + clearance,
    headerWidth,
    0.82,
    depth,
    '#68737a',
    rotationY,
    { type: 'transportUnderpassCeiling' }
  ));

  if (width < 25) return;

  for (const side of [-1, 1]) {
    const sideLabel = side > 0 ? 'right' : 'left';
    const postPoint = {
      x: center.x + normal.x * side * postLateralOffset,
      z: center.z + normal.z * side * postLateralOffset
    };

    data.trafficObstacles.push(createTrafficObstacle(
      `${id}-post-${sideLabel}`,
      postPoint.x,
      postPoint.z,
      roadY - 0.12,
      wallThickness,
      frameHeight,
      depth,
      '#636e74',
      rotationY,
      { type: 'transportUnderpassWall' }
    ));
    data.tunnelColliders.push(createHeightLimitedSegmentCollider(
      `${id}-post-${sideLabel}-collider`,
      'tunnelWall',
      offsetPlanarPoint(point, direction, normal, 0.4, side * postLateralOffset),
      offsetPlanarPoint(point, direction, normal, depth + 1.2, side * postLateralOffset),
      wallThickness + 0.32,
      roadY - 0.12,
      roadY + frameHeight
    ));
  }
}

function createSlopedVerticalWallObstacle(id, start, end, startY, endY, height, thickness, color, type) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const flatLength = Math.max(Math.hypot(dx, dz), 0.0001);
  const heightDelta = endY - startY;
  const slopeLength = Math.max(Math.hypot(flatLength, heightDelta), 0.0001);
  const center = midpoint(start, end);

  return {
    id,
    basis: {
      x: [dx / slopeLength, heightDelta / slopeLength, dz / slopeLength],
      y: [0, 1, 0],
      z: [-dz / flatLength, 0, dx / flatLength]
    },
    color,
    collidable: false,
    position: [center.x, (startY + endY) / 2 + height / 2, center.z],
    rotation: [0, 0, 0],
    scale: [slopeLength, height, thickness],
    type
  };
}

function addFastRoadPortalClearanceCutout(data, id, point, size, bounds = null, options = {}) {
  if (bounds && !isBoxOverlappingChunk(point.x, point.z, size, size, bounds, 4)) return;

  data.groundCutouts.push({
    id: `${id}-${Math.round(point.x)}-${Math.round(point.z)}`,
    minX: point.x - size / 2,
    maxX: point.x + size / 2,
    minZ: point.z - size / 2,
    maxZ: point.z + size / 2,
    skirtWalls: options.skirtWalls ?? true
  });
}

function addFastRoadSurfaceConnector(data, bounds, id, kind, width, point, outward, groundRoads, addRoad) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.z)) return null;

  const direction = normalizeVector(outward);
  const target = findFastRoadSurfaceConnectorTarget(point, direction, groundRoads);
  const end = target
    ? getRampFeederMergePoint(point, target)
    : {
        x: point.x + direction.x * 260,
        z: point.z + direction.z * 260
      };

  if (Math.hypot(end.x - point.x, end.z - point.z) < 8) return null;

  const clip = clipLineToBounds(point, end, bounds, width / 2);
  if (!clip) return null;

  const road = createSegmentRoad(
    id,
    kind,
    ROAD_TYPES.mainRoad,
    clip.start,
    clip.end,
    width,
    GROUND_DRIVE_Y,
    {
      side: kind,
      marked: true
    }
  );

  addRoad(data, road);
  return road;
}

function findFastRoadSurfaceConnectorTarget(point, outward, roads = []) {
  const candidates = roads.filter(isFastRoadSurfaceConnectorTargetRoad);
  const target = findNearestRoadAnchor(point, candidates);

  if (!target || target.distanceSq > 900 * 900) return null;

  const dx = target.point.x - point.x;
  const dz = target.point.z - point.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= 0.001) return target;

  const alignment = (dx / distance) * outward.x + (dz / distance) * outward.z;
  return alignment > -0.35 ? target : null;
}

function isFastRoadSurfaceConnectorTargetRoad(road) {
  if (!road?.marked) return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (typeof road.kind === 'string' && (
    road.kind.startsWith('transport-highway') ||
    road.kind.startsWith('expressway')
  )) {
    return false;
  }

  return true;
}

function getExpresswayRouteY(route) {
  const routeIndex = Math.max(0, EXPRESSWAY_ROUTES.findIndex((item) => item.id === route.id));

  return Math.max(EXPRESSWAY_Y, MIN_EXPRESSWAY_ROUTE_Y) + routeIndex * BRIDGE_STACK_GAP;
}

function addGroundHighwayRoute(data, route, bounds, chunkX, chunkZ) {
  for (const segment of getRouteSegments(route)) {
    const clip = clipLineToBounds(segment.start, segment.end, bounds, EXPRESSWAY_WIDTH / 2);
    if (!clip) continue;

    addExpresswayRoad(data, createGroundHighwayRoad(route, segment, clip, chunkX, chunkZ));
  }
}

function createGroundHighwayRoad(route, segment, clip, chunkX, chunkZ) {
  return createSegmentRoad(
    `${route.id}-ground-${segment.index}-${chunkX}-${chunkZ}`,
    'ground-highway',
    ROAD_TYPES.highway,
    clip.start,
    clip.end,
    EXPRESSWAY_WIDTH,
    GROUND_DRIVE_Y,
    {
      marked: true,
      side: 'highway'
    }
  );
}

function addExpresswayDeck(data, route, bounds, chunkX, chunkZ) {
  const routeY = getExpresswayRouteY(route);

  for (const segment of getRouteSegments(route)) {
    const clip = clipLineToBounds(segment.start, segment.end, bounds, EXPRESSWAY_WIDTH / 2);
    if (!clip) continue;

    const road = createExpresswayDeckRoad(route, segment, clip, chunkX, chunkZ, routeY);

    addExpresswayRoad(data, road);
    addExpresswayGuardrails(data, road, routeY - 0.3, routeY + EXPRESSWAY_GUARDRAIL_HEIGHT + 0.35, {
      gaps: getExpresswayDeckGuardrailGaps(route, road)
    });
    addHighwayMedianBarrier(data, road);
  }

  addExpresswayDeckJoints(data, route, bounds, chunkX, chunkZ, routeY);
}

function addExpresswayEntrances(data, route, bounds, chunkX, chunkZ, groundRoads) {
  const routeY = getExpresswayRouteY(route);

  for (const ramp of getExpresswayRampPaths(route)) {
    const adjustedRamp = adjustExpresswayRampLanding(ramp, groundRoads);
    const feederTarget = isInsideChunk(adjustedRamp.groundPoint.x, adjustedRamp.groundPoint.z, bounds)
      ? resolveRampFeederTarget(adjustedRamp, groundRoads)
      : null;

    addExpresswayRamp(data, route, adjustedRamp, bounds, chunkX, chunkZ, routeY, groundRoads);

    if (feederTarget) {
      addExpresswayFeederRoad(data, route, adjustedRamp, bounds, feederTarget);
      addExpresswayEntranceSign(data, route, adjustedRamp, bounds, groundRoads);
    }
  }
}

function createExpresswayDeckRoad(route, segment, clip, chunkX, chunkZ, routeY) {
  return createSegmentRoad(
    `${route.id}-deck-${segment.index}-${chunkX}-${chunkZ}`,
    'expressway-deck',
    ROAD_TYPES.elevatedHighway,
    clip.start,
    clip.end,
    EXPRESSWAY_WIDTH,
    routeY,
    {
      marked: true,
      side: 'expressway'
    }
  );
}

function addExpresswayDeckJoints(data, route, bounds, chunkX, chunkZ, routeY) {
  const points = getExpresswayRoutePoints(route);

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const size = index === 0 || index === points.length - 1
      ? EXPRESSWAY_WIDTH * 1.38
      : EXPRESSWAY_WIDTH * 1.72;

    if (!isBoxOverlappingChunk(point.x, point.z, size, size, bounds, EXPRESSWAY_WIDTH)) continue;

    addExpresswayRoad(data, createExpresswayJointRoad(route, point, index, size, chunkX, chunkZ, routeY));
  }
}

function createExpresswayJointRoad(route, point, index, size, chunkX, chunkZ, routeY) {
  return {
    id: `${route.id}-joint-${index}-${chunkX}-${chunkZ}`,
    kind: 'expressway-joint',
    axis: 'joint',
    side: 'expressway',
    marked: false,
    roadType: ROAD_TYPES.elevatedHighway,
    position: [point.x, routeY - 0.006, point.z],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [size, size],
    visualScale: [size, size],
    centerX: point.x,
    centerZ: point.z,
    width: size,
    depth: size,
    minX: point.x - size / 2,
    maxX: point.x + size / 2,
    minZ: point.z - size / 2,
    maxZ: point.z + size / 2,
    surface: {
      id: `${route.id}-joint-${index}-${chunkX}-${chunkZ}`,
      roadType: ROAD_TYPES.elevatedHighway,
      shape: 'circle',
      centerX: point.x,
      centerZ: point.z,
      radius: size / 2,
      y: routeY
    }
  };
}

function adjustExpresswayRampLanding(ramp, groundRoads) {
  if (isExpresswayRampLandingClear(ramp.groundPoint, groundRoads)) return ramp;

  const baseGround = ramp.groundPoint;
  const candidates = [48, 84, 124, 172, 228].map((distance) => ({
    x: baseGround.x + ramp.outward.x * distance,
    z: baseGround.z + ramp.outward.z * distance
  }));

  for (const groundPoint of candidates) {
    if (!isExpresswayRampLandingClear(groundPoint, groundRoads)) continue;

    const path = sampleSmoothExpresswayRampPath(
      groundPoint,
      ramp.deck,
      ramp.outward,
      ramp.rampLength ?? EXPRESSWAY_MAP.rampLength
    );

    return {
      ...ramp,
      ground: groundPoint,
      groundPoint,
      outward: normalizeVector({
        x: path[0].x - path[1].x,
        z: path[0].z - path[1].z
      }),
      path
    };
  }

  return ramp;
}

function isExpresswayRampLandingClear(point, groundRoads) {
  return !isPointOnAnyRoadSurface(
    point.x,
    point.z,
    groundRoads,
    EXPRESSWAY_RAMP_WIDTH / 2 + EXPRESSWAY_RAMP_LANDING_CLEARANCE
  );
}

function sampleSmoothExpresswayRampPath(start, end, outward, rampLength) {
  const tangent = normalizeVector(outward);
  const tangentLength = Math.max(92, Math.min(rampLength * 0.42, 180));
  const controlA = {
    x: start.x - tangent.x * tangentLength,
    z: start.z - tangent.z * tangentLength
  };
  const controlB = {
    x: end.x + tangent.x * tangentLength,
    z: end.z + tangent.z * tangentLength
  };

  return sampleCubicRampPath(start, controlA, controlB, end, 24);
}

function sampleCubicRampPath(start, controlA, controlB, end, steps) {
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

function getExpresswayRampElevation(routeY, t) {
  return lerp(GROUND_DRIVE_Y, routeY, smootherStep(t));
}

function smootherStep(value) {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
}

function addExpresswayRamp(data, route, ramp, bounds, chunkX, chunkZ, routeY, groundRoads = []) {
  const segments = getRampPathSegments(ramp);
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  for (const segment of segments) {
    const clip = clipLineToBounds(segment.start, segment.end, bounds, EXPRESSWAY_RAMP_WIDTH / 2);
    if (!clip) continue;

    const startT = (segment.distanceStart + segment.length * clip.t0) / segment.totalLength;
    const endT = (segment.distanceStart + segment.length * clip.t1) / segment.totalLength;
    const startY = getExpresswayRampElevation(routeY, startT);
    const endY = getExpresswayRampElevation(routeY, endT);
    const road = createExpresswayRampRoad(
      route,
      ramp,
      segment.index,
      clip.start,
      clip.end,
      startY,
      endY,
      chunkX,
      chunkZ
    );

    addExpresswayRoad(data, road);
    addExpresswayGuardrails(
      data,
      road,
      Math.min(startY, endY) - 0.2,
      Math.max(startY, endY) + EXPRESSWAY_GUARDRAIL_HEIGHT + 0.8,
      {
        startInset: segment === firstSegment ? EXPRESSWAY_RAMP_WIDTH * 0.9 : 0,
        endInset: segment === lastSegment ? EXPRESSWAY_RAMP_WIDTH * 1.25 : 0,
        clearanceRoads: groundRoads,
        forceColliders: true,
        forceContinuous: true
      }
    );
  }

  addExpresswayRampJoints(data, route, ramp, segments, bounds, chunkX, chunkZ, routeY);
}

function getRampPathSegments(ramp) {
  const points = ramp.path?.length >= 2
    ? ramp.path
    : [ramp.ground ?? ramp.groundPoint, ramp.deck].filter(Boolean);
  const rawSegments = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.z - start.z);

    if (length <= 0.1) continue;

    rawSegments.push({ index, start, end, length, distanceStart: totalLength });
    totalLength += length;
  }

  return rawSegments.map((segment) => ({
    ...segment,
    totalLength: Math.max(totalLength, 0.0001)
  }));
}

function createExpresswayRampRoad(route, ramp, segmentIndex, start, end, startY, endY, chunkX, chunkZ) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  const slopeLength = Math.hypot(length, endY - startY);
  const center = midpoint(start, end);
  const centerY = (startY + endY) / 2;
  const id = `${route.id}-${ramp.id}-ramp-${segmentIndex}-${chunkX}-${chunkZ}`;
  const bounds = getSegmentBounds(start, end, EXPRESSWAY_RAMP_WIDTH);

  return {
    id,
    kind: 'expressway-ramp',
    axis: 'segment',
    side: `${ramp.id}-${segmentIndex}`,
    marked: true,
    roadType: ROAD_TYPES.ramp,
    position: [center.x, centerY, center.z],
    basis: getRampSurfaceBasis(start, end, endY - startY),
    rotation: getRampSurfaceRotation(start, end, endY - startY),
    scale: [length, EXPRESSWAY_RAMP_WIDTH],
    visualScale: [slopeLength, EXPRESSWAY_RAMP_WIDTH],
    centerX: center.x,
    centerZ: center.z,
    width: bounds.width,
    depth: bounds.depth,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    startX: start.x,
    startZ: start.z,
    endX: end.x,
    endZ: end.z,
    length,
    surface: {
      id,
      roadType: ROAD_TYPES.ramp,
      shape: 'ramp',
      axis: 'segment',
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ,
      centerX: center.x,
      centerZ: center.z,
      width: EXPRESSWAY_RAMP_WIDTH,
      length,
      startX: start.x,
      endX: end.x,
      startZ: start.z,
      endZ: end.z,
      startY,
      endY,
      y: centerY
    }
  };
}

function addExpresswayRampJoints(data, route, ramp, segments, bounds, chunkX, chunkZ, routeY) {
  const points = getRampJointPoints(segments);
  const jointSize = EXPRESSWAY_RAMP_WIDTH * 1.36;

  for (const point of points) {
    if (!isBoxOverlappingChunk(point.x, point.z, jointSize, jointSize, bounds, jointSize * 0.5)) continue;

    addExpresswayRoad(data, createExpresswayRampJointRoad(route, ramp, point, jointSize, chunkX, chunkZ, routeY));
  }
}

function getRampJointPoints(segments) {
  if (segments.length === 0) return [];

  const points = [{
    index: 0,
    x: segments[0].start.x,
    z: segments[0].start.z,
    t: 0
  }];

  for (const segment of segments) {
    points.push({
      index: segment.index + 1,
      x: segment.end.x,
      z: segment.end.z,
      t: (segment.distanceStart + segment.length) / segment.totalLength
    });
  }

  return points;
}

function createExpresswayRampJointRoad(route, ramp, point, size, chunkX, chunkZ, routeY) {
  const y = getExpresswayRampElevation(routeY, point.t);
  const id = `${route.id}-${ramp.id}-ramp-joint-${point.index}-${chunkX}-${chunkZ}`;

  return {
    id,
    kind: 'expressway-ramp-joint',
    axis: 'joint',
    side: ramp.id,
    marked: false,
    roadType: ROAD_TYPES.ramp,
    position: [point.x, y + 0.052, point.z],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [size, size],
    visualScale: [size, size],
    centerX: point.x,
    centerZ: point.z,
    width: size,
    depth: size,
    minX: point.x - size / 2,
    maxX: point.x + size / 2,
    minZ: point.z - size / 2,
    maxZ: point.z + size / 2,
    surface: {
      id,
      roadType: ROAD_TYPES.ramp,
      shape: 'circle',
      centerX: point.x,
      centerZ: point.z,
      radius: size / 2,
      y
    }
  };
}

function getRampSurfaceRotation(start, end, heightDelta) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  const slopeAngle = Math.atan2(heightDelta, Math.max(length, 0.0001));
  const heading = getSegmentYaw(start, end);

  return [-Math.PI / 2, -slopeAngle, heading];
}

function getRampSurfaceBasis(start, end, heightDelta) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const flatLength = Math.max(Math.hypot(dx, dz), 0.0001);
  const slopeLength = Math.max(Math.hypot(flatLength, heightDelta), 0.0001);
  const xAxis = {
    x: dx / slopeLength,
    y: heightDelta / slopeLength,
    z: dz / slopeLength
  };
  const yAxis = {
    x: dz / flatLength,
    y: 0,
    z: -dx / flatLength
  };
  const zAxis = normalizeVector3(crossVector3(xAxis, yAxis));

  return {
    x: [xAxis.x, xAxis.y, xAxis.z],
    y: [yAxis.x, yAxis.y, yAxis.z],
    z: [zAxis.x, zAxis.y, zAxis.z]
  };
}

function crossVector3(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function normalizeVector3(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);

  if (length <= 0.000001) {
    return { x: 0, y: 1, z: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
}

function getRampBoxRotation(surface) {
  const start = { x: surface.startX, z: surface.startZ };
  const end = { x: surface.endX, z: surface.endZ };
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  const slopeAngle = Math.atan2(surface.endY - surface.startY, Math.max(length, 0.0001));

  return [0, getSegmentBoxYaw(start, end), slopeAngle];
}

function resolveRampFeederTarget(ramp, groundRoads) {
  const target = findNearestRoadAnchor(ramp.groundPoint, groundRoads);

  return target?.distanceSq < 900 * 900 ? target : null;
}

function addExpresswayFeederRoad(data, route, ramp, bounds, target) {
  const end = getRampFeederMergePoint(ramp.groundPoint, target);
  if (Math.hypot(end.x - ramp.groundPoint.x, end.z - ramp.groundPoint.z) < 8) return;

  const clip = clipLineToBounds(ramp.groundPoint, end, bounds, EXPRESSWAY_FEEDER_WIDTH / 2);
  if (!clip) return;

  addExpresswayRoad(data, createSegmentRoad(
    `${route.id}-${ramp.id}-feeder`,
    'expressway-feeder',
    ROAD_TYPES.mainRoad,
    clip.start,
    clip.end,
    EXPRESSWAY_FEEDER_WIDTH,
    GROUND_DRIVE_Y,
    {
      side: ramp.id,
      marked: true
    }
  ));
}

function getRampFeederMergePoint(from, target) {
  const road = target.road;
  const anchor = target.point;

  if (!road) return anchor;

  const roadHalfWidth = getRoadCrossWidth(road) / 2;
  const mergeInset = Math.min(roadHalfWidth * 0.55, 3.2);

  if (road.axis === 'x') {
    const side = from.z >= road.centerZ ? 1 : -1;
    return {
      x: anchor.x,
      z: road.centerZ + side * Math.max(roadHalfWidth - mergeInset, 0)
    };
  }

  if (road.axis === 'z') {
    const side = from.x >= road.centerX ? 1 : -1;
    return {
      x: road.centerX + side * Math.max(roadHalfWidth - mergeInset, 0),
      z: anchor.z
    };
  }

  if (road.axis === 'segment') {
    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const normal = { x: -tangent.z, z: tangent.x };
    const side = ((from.x - anchor.x) * normal.x + (from.z - anchor.z) * normal.z) >= 0 ? 1 : -1;

    return {
      x: anchor.x + normal.x * side * Math.max(roadHalfWidth - mergeInset, 0),
      z: anchor.z + normal.z * side * Math.max(roadHalfWidth - mergeInset, 0)
    };
  }

  return anchor;
}

function addExpresswayEntranceSign(data, route, ramp, bounds, groundRoads) {
  const signOffset = EXPRESSWAY_RAMP_WIDTH / 2 + 30;
  const groundSegmentEnd = ramp.path?.[1] ?? ramp.deck ?? ramp.groundPoint;
  const tangent = normalizeVector({
    x: groundSegmentEnd.x - ramp.groundPoint.x,
    z: groundSegmentEnd.z - ramp.groundPoint.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const lateral = ramp.id === 'entry-a' ? -signOffset : signOffset;
  const x = ramp.groundPoint.x + ramp.outward.x * 46 + normal.x * lateral;
  const z = ramp.groundPoint.z + ramp.outward.z * 46 + normal.z * lateral;

  if (!isInsideChunk(x, z, bounds)) return;
  if (isPointOnAnyRoadSurface(x, z, getGroundClearanceRoads(groundRoads, data.roads), 12)) return;

  data.roadSigns.push({
    id: `${route.id}-${ramp.id}-sign`,
    text: `TO ${route.label.toUpperCase()}`,
    position: [x, 3.6, z],
    rotation: [0, Math.atan2(tangent.x, tangent.z), 0],
    scale: [7.6, 2.2, 0.3],
    color: '#f2d486'
  });
}

function getExpresswayDeckGuardrailGaps(route, road) {
  const start = { x: road.startX, z: road.startZ };
  const end = { x: road.endX, z: road.endZ };
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  if (length <= 0.0001) return [];

  const gapHalfLength = EXPRESSWAY_RAMP_WIDTH * 1.55;
  const gaps = [];

  for (const ramp of getExpresswayRampPaths(route)) {
    const deckPoint = ramp.deck;
    if (!deckPoint) continue;

    const projection = projectPointToSegment(
      deckPoint.x,
      deckPoint.z,
      start.x,
      start.z,
      end.x,
      end.z
    );

    if (!projection) continue;

    const lateralDistance = Math.hypot(deckPoint.x - projection.x, deckPoint.z - projection.z);
    if (lateralDistance > EXPRESSWAY_WIDTH) continue;

    const distance = projection.t * length;
    gaps.push({
      start: distance - gapHalfLength,
      end: distance + gapHalfLength
    });
  }

  return gaps;
}

function addExpresswayGuardrails(data, road, minY, maxY, options = {}) {
  const start = { x: road.startX ?? road.minX, z: road.startZ ?? road.centerZ };
  const end = { x: road.endX ?? road.maxX, z: road.endZ ?? road.centerZ };
  const tangent = normalizeVector({ x: end.x - start.x, z: end.z - start.z });
  const normal = { x: -tangent.z, z: tangent.x };
  const halfWidth = (road.surface?.width ?? (road.axis === 'x' ? road.depth : road.width)) / 2;
  const isRamp = road.surface?.shape === 'ramp';
  const flatLength = Math.max(Math.hypot(end.x - start.x, end.z - start.z), 0.0001);
  const railHeight = isRamp
    ? EXPRESSWAY_GUARDRAIL_HEIGHT
    : Math.max(EXPRESSWAY_GUARDRAIL_HEIGHT, maxY - minY);
  const solidRanges = getGuardrailSolidRanges(flatLength, options);
  if (solidRanges.length === 0) return;
  const forceColliders = Boolean(options.forceColliders);
  const colliderType = options.colliderType ?? 'elevatedGuardrail';

  const visualLength = road.visualScale?.[0] ?? flatLength;
  const visualLengthRatio = visualLength / flatLength;
  const rampStartY = road.visualStartY ?? road.surface?.startY ?? road.surface?.y ?? minY;
  const rampEndY = road.visualEndY ?? road.surface?.endY ?? road.surface?.y ?? maxY;
  const rotation = isRamp
    ? getRampBoxRotation({
        ...road.surface,
        startY: road.visualStartY ?? road.surface.startY,
        endY: road.visualEndY ?? road.surface.endY
      })
    : [0, getSegmentBoxYaw(start, end), 0];

  for (const side of [-1, 1]) {
    const offset = side * (halfWidth + EXPRESSWAY_GUARDRAIL_THICKNESS / 2);
    const sideLabel = side > 0 ? 'right' : 'left';

    for (let rangeIndex = 0; rangeIndex < solidRanges.length; rangeIndex += 1) {
      const range = solidRanges[rangeIndex];
      const railStart = getOffsetPointAlongSegment(start, tangent, normal, range.start, offset);
      const railEnd = getOffsetPointAlongSegment(start, tangent, normal, range.end, offset);
      const center = midpoint(railStart, railEnd);
      const rangeLength = Math.max(0.0001, range.end - range.start);
      const t0 = range.start / flatLength;
      const t1 = range.end / flatLength;
      const rangeStartY = isRamp ? lerp(rampStartY, rampEndY, t0) : minY;
      const rangeEndY = isRamp ? lerp(rampStartY, rampEndY, t1) : maxY;
      const railY = isRamp
        ? (rangeStartY + rangeEndY) / 2 + 0.22 + railHeight / 2
        : (minY + maxY) / 2;
      const rangeVisualLength = isRamp
        ? Math.hypot(rangeLength, rangeEndY - rangeStartY)
        : rangeLength * visualLengthRatio;
      const colliderMinY = isRamp ? Math.min(rangeStartY, rangeEndY) - 0.2 : minY;
      const colliderMaxY = isRamp
        ? Math.max(rangeStartY, rangeEndY) + EXPRESSWAY_GUARDRAIL_HEIGHT + 0.8
        : maxY;
      const id = `${road.id}-guardrail-${sideLabel}-${rangeIndex}`;
      const touchesClearanceRoad = (options.clearanceRoads?.length ?? 0) > 0 &&
        doesGuardrailRangeTouchRoad(railStart, railEnd, options.clearanceRoads, EXPRESSWAY_GUARDRAIL_THICKNESS + 2.4);

      data.guardrails.push({
        id,
        position: [center.x, railY, center.z],
        rotation,
        scale: [rangeVisualLength, railHeight, EXPRESSWAY_GUARDRAIL_THICKNESS]
      });

      if (!options.visualOnly && (forceColliders || (!isRamp && !touchesClearanceRoad))) {
        data.guardrailColliders.push(createHeightLimitedSegmentCollider(
          id,
          colliderType,
          railStart,
          railEnd,
          EXPRESSWAY_GUARDRAIL_THICKNESS,
          colliderMinY,
          colliderMaxY
        ));
      }
    }
  }
}

function doesGuardrailRangeTouchRoad(start, end, roads, margin = 0) {
  return roads.some((road) => doesSegmentTouchRoadSurface(start, end, road, margin));
}

function doesSegmentTouchRoadSurface(start, end, road, margin = 0) {
  const surface = road.surface;

  if (surface?.shape === 'circle') {
    const distanceSq = getPointToSegmentDistanceSq(
      { x: surface.centerX, z: surface.centerZ },
      start,
      end
    );
    const radius = surface.radius + margin;

    return distanceSq <= radius * radius;
  }

  const line = getRoadCenterline(road);

  if (line) {
    const halfWidth = getRoadCrossWidth(road) / 2 + margin;

    return getSegmentDistanceSq(start, end, line.start, line.end) <= halfWidth * halfWidth;
  }

  const box = {
    minX: road.minX - margin,
    maxX: road.maxX + margin,
    minZ: road.minZ - margin,
    maxZ: road.maxZ + margin
  };

  return getBoxSegmentDistanceSq(box, start, end) <= 0.0001;
}

function getGuardrailSolidRanges(length, options = {}) {
  const startInset = clamp(options.startInset ?? 0, 0, length);
  const endInset = clamp(options.endInset ?? 0, 0, length);
  const range = {
    start: startInset,
    end: Math.max(startInset, length - endInset)
  };

  return range.end - range.start > 2 ? [range] : [];
}

function getOffsetPointAlongSegment(start, tangent, normal, distance, offset) {
  return {
    x: start.x + tangent.x * distance + normal.x * offset,
    z: start.z + tangent.z * distance + normal.z * offset
  };
}

function getRegularInteriorDistances(length, spacing, inset) {
  if (!Number.isFinite(length) || length <= 0) return [];

  const safeInset = Math.min(Math.max(0, inset), length / 2);
  const span = Math.max(0, length - safeInset * 2);
  if (span <= 0.001) return [length / 2];

  const count = Math.max(2, Math.ceil(span / Math.max(1, spacing)) + 1);
  const distances = [];

  for (let index = 0; index < count; index += 1) {
    distances.push(lerp(safeInset, length - safeInset, index / Math.max(1, count - 1)));
  }

  return distances;
}

function addExpresswaySupports(data, road, bounds, groundClearanceRoads) {
  const start = { x: road.startX, z: road.startZ };
  const end = { x: road.endX, z: road.endZ };
  const length = Math.max(Math.hypot(end.x - start.x, end.z - start.z), 0.0001);
  const tangent = normalizeVector({ x: end.x - start.x, z: end.z - start.z });
  const normal = { x: -tangent.z, z: tangent.x };
  const supportDistances = getRegularInteriorDistances(length, EXPRESSWAY_SUPPORT_SPACING, 28);
  const lateralOffset = EXPRESSWAY_WIDTH / 2 - 4.2;
  const height = Math.max(1.2, getRoadVisualY(road) - 0.2);

  for (const [index, distance] of supportDistances.entries()) {
    const center = {
      x: start.x + tangent.x * distance,
      z: start.z + tangent.z * distance
    };

    for (const side of [-1, 1]) {
      const x = center.x + normal.x * side * lateralOffset;
      const z = center.z + normal.z * side * lateralOffset;

      if (!isInsideChunk(x, z, bounds)) continue;
      if (isBoxInsideSpawnClearZone(x, z, 3, 3)) continue;
      if (isPointOnAnyRoadSurface(x, z, groundClearanceRoads, EXPRESSWAY_SUPPORT_ROAD_CLEARANCE)) continue;

      data.roadSupports.push(createTrafficObstacle(
        `${road.id}-support-${index}-${side}`,
        x,
        z,
        0,
        2.4,
        height,
        2.4,
        '#5d6870',
        0,
        { type: 'roadSupport' }
      ));
    }
  }
}

function addExpresswayRoad(data, road) {
  if (!road) return;

  data.roads.push(road);
  data.roadColliders.push(createRoadCollider(road));
}

function getGroundClearanceRoads(baseRoads = [], generatedRoads = []) {
  return [...baseRoads, ...generatedRoads].filter((road) => (
    road &&
    road.roadType !== ROAD_TYPES.elevatedHighway
  ));
}

function isPointOnAnyRoadSurface(x, z, roads, margin = 0) {
  return roads.some((road) => isPointOnRoadSurface(x, z, road, margin));
}

function isPointOnRoadSurface(x, z, road, margin = 0) {
  const surface = road.surface;

  if (surface?.shape === 'circle') {
    const dx = x - surface.centerX;
    const dz = z - surface.centerZ;
    const radius = surface.radius + margin;

    return dx * dx + dz * dz <= radius * radius;
  }

  if (surface?.shape === 'segment' || surface?.shape === 'ramp') {
    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      0,
      surface.startX,
      surface.startZ,
      surface.endX,
      surface.endZ,
      surface.width / 2 + margin
    ));
  }

  if (road.axis === 'segment' && Number.isFinite(road.startX) && Number.isFinite(road.endX)) {
    const width = road.surface?.width ?? road.visualScale?.[1] ?? road.width;

    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      0,
      road.startX,
      road.startZ,
      road.endX,
      road.endZ,
      width / 2 + margin
    ));
  }

  return (
    x >= road.minX - margin &&
    x <= road.maxX + margin &&
    z >= road.minZ - margin &&
    z <= road.maxZ + margin
  );
}

function createSegmentRoad(id, kind, roadType, start, end, width, y, options = {}) {
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  if (length <= 0.1 || width <= 0) return null;

  const center = midpoint(start, end);
  const bounds = getSegmentBounds(start, end, width);

  return {
    id,
    kind,
    axis: 'segment',
    side: options.side ?? 'segment',
    marked: options.marked ?? true,
    roadType,
    trafficDisabled: options.trafficDisabled ?? false,
    trafficPathPoints: options.trafficPathPoints ?? null,
    position: [center.x, y, center.z],
    rotation: [-Math.PI / 2, 0, getSegmentYaw(start, end)],
    scale: [length, width],
    visualScale: [length, width],
    centerX: center.x,
    centerZ: center.z,
    width: bounds.width,
    depth: bounds.depth,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    startX: start.x,
    startZ: start.z,
    endX: end.x,
    endZ: end.z,
    length,
    surface: {
      id,
      roadType,
      shape: 'segment',
      axis: 'segment',
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ,
      centerX: center.x,
      centerZ: center.z,
      width,
      length,
      startX: start.x,
      startZ: start.z,
      endX: end.x,
      endZ: end.z,
      y
    }
  };
}

function getRouteSegments(route) {
  const points = getExpresswayRoutePoints(route);
  const segments = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.z - start.z);

    if (length <= 0.1) continue;

    segments.push({
      index,
      start,
      end,
      length
    });
  }

  return segments;
}

function findNearestRoadAnchor(point, roads) {
  let nearest = null;

  for (const road of roads) {
    if (!road || road.roadType === ROAD_TYPES.parking || isExpresswayRoadType(road.roadType)) continue;

    const anchor = getRoadAnchorPoint(point, road);
    if (!anchor) continue;

    const dx = anchor.x - point.x;
    const dz = anchor.z - point.z;
    const distanceSq = dx * dx + dz * dz;

    if (!nearest || distanceSq < nearest.distanceSq) {
      nearest = { point: anchor, distanceSq, road };
    }
  }

  return nearest;
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

  if (road.axis === 'segment') {
    const projection = projectPointToSegment(point.x, point.z, road.startX, road.startZ, road.endX, road.endZ);
    return projection ? { x: projection.x, z: projection.z } : null;
  }

  return null;
}

function clipLineToBounds(start, end, bounds, padding = 0) {
  const minX = bounds.minX - padding;
  const maxX = bounds.maxX + padding;
  const minZ = bounds.minZ - padding;
  const maxZ = bounds.maxZ + padding;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  let t0 = 0;
  let t1 = 1;

  const clip = (p, q) => {
    if (Math.abs(p) < 0.000001) return q >= 0;

    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
      return true;
    }

    if (r < t0) return false;
    if (r < t1) t1 = r;
    return true;
  };

  if (
    !clip(-dx, start.x - minX) ||
    !clip(dx, maxX - start.x) ||
    !clip(-dz, start.z - minZ) ||
    !clip(dz, maxZ - start.z) ||
    t1 - t0 <= 0.001
  ) {
    return null;
  }

  return {
    start: { x: start.x + dx * t0, z: start.z + dz * t0 },
    end: { x: start.x + dx * t1, z: start.z + dz * t1 },
    t0,
    t1
  };
}

function getSegmentBounds(start, end, width) {
  const halfWidth = width / 2;
  const minX = Math.min(start.x, end.x) - halfWidth;
  const maxX = Math.max(start.x, end.x) + halfWidth;
  const minZ = Math.min(start.z, end.z) - halfWidth;
  const maxZ = Math.max(start.z, end.z) + halfWidth;

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: maxX - minX,
    depth: maxZ - minZ
  };
}

function projectPointToSegment(x, z, startX, startZ, endX, endZ) {
  const dx = endX - startX;
  const dz = endZ - startZ;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0.000001) return null;

  const t = clamp(((x - startX) * dx + (z - startZ) * dz) / lengthSq, 0, 1);

  return {
    x: startX + dx * t,
    z: startZ + dz * t,
    t
  };
}

function getCircleSegmentOverlap(x, z, radius, startX, startZ, endX, endZ, halfWidth) {
  const projection = projectPointToSegment(x, z, startX, startZ, endX, endZ);
  if (!projection) return null;

  const dx = x - projection.x;
  const dz = z - projection.z;
  const maxDistance = radius + halfWidth;
  const distanceSq = dx * dx + dz * dz;

  return distanceSq < maxDistance * maxDistance
    ? { dx, dz, distanceSq, projection }
    : null;
}

function getSegmentYaw(start, end) {
  return Math.atan2(-(end.z - start.z), end.x - start.x);
}

function getSegmentBoxYaw(start, end) {
  return Math.atan2(-(end.z - start.z), end.x - start.x);
}

function midpoint(start, end) {
  return {
    x: (start.x + end.x) / 2,
    z: (start.z + end.z) / 2
  };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.z);

  if (length <= 0.000001) {
    return { x: 1, z: 0 };
  }

  return {
    x: vector.x / length,
    z: vector.z / length
  };
}

function createShowcaseBuilding(id, x, z, width, height, depth, color) {
  return {
    id,
    kind: 'showcaseTower',
    position: [x, height / 2, z],
    scale: [width, height, depth],
    color
  };
}

function createShowcaseTree(id, x, z, canopyRadius = 3.2) {
  return {
    id,
    position: [x, 0, z],
    trunkHeight: 3.2,
    canopyHeight: 5.4,
    canopyRadius
  };
}

function createHighwaySurface(bounds, axis) {
  if (axis === 'x') {
    return createRoadSurface(
      'highway-x',
      'highway',
      bounds.centerX,
      bounds.centerZ,
      bounds.size,
      getRoadWidth('highway'),
      { axis, side: 'highway', marked: true, roadType: 'highway' }
    );
  }

  return createRoadSurface(
    'highway-z',
    'highway',
    bounds.centerX,
    bounds.centerZ,
    getRoadWidth('highway'),
    bounds.size,
    { axis, side: 'highway', marked: true, roadType: 'highway' }
  );
}

function createRoadSegment(bounds, side, centerPatchSize, roadType, districtProfile = DISTRICT_PROFILES.commercial) {
  const halfPatch = centerPatchSize / 2;
  const roadWidth = getDistrictRoadWidth(roadType, districtProfile);

  if (side === 'north') {
    return createRoadSurface(
      'road-north',
      'segment',
      bounds.centerX,
      (bounds.minZ + bounds.centerZ - halfPatch) / 2,
      roadWidth,
      bounds.centerZ - halfPatch - bounds.minZ,
      { axis: 'z', side, marked: true, roadType }
    );
  }

  if (side === 'south') {
    return createRoadSurface(
      'road-south',
      'segment',
      bounds.centerX,
      (bounds.centerZ + halfPatch + bounds.maxZ) / 2,
      roadWidth,
      bounds.maxZ - bounds.centerZ - halfPatch,
      { axis: 'z', side, marked: true, roadType }
    );
  }

  if (side === 'west') {
    return createRoadSurface(
      'road-west',
      'segment',
      (bounds.minX + bounds.centerX - halfPatch) / 2,
      bounds.centerZ,
      bounds.centerX - halfPatch - bounds.minX,
      roadWidth,
      { axis: 'x', side, marked: true, roadType }
    );
  }

  if (side === 'east') {
    return createRoadSurface(
      'road-east',
      'segment',
      (bounds.centerX + halfPatch + bounds.maxX) / 2,
      bounds.centerZ,
      bounds.maxX - bounds.centerX - halfPatch,
      roadWidth,
      { axis: 'x', side, marked: true, roadType }
    );
  }

  return null;
}

function createRoadSurface(id, kind, centerX, centerZ, width, depth, options) {
  const safeWidth = Math.max(width, 0);
  const safeDepth = Math.max(depth, 0);

  if (safeWidth <= 0 || safeDepth <= 0) return null;

  return {
    id,
    kind,
    axis: options.axis,
    side: options.side,
    marked: options.marked,
    roadType: options.roadType,
    trafficDisabled: options.trafficDisabled ?? false,
    trafficPathPoints: options.trafficPathPoints ?? null,
    position: [centerX, getRoadY(options.roadType, kind), centerZ],
    scale: [safeWidth, safeDepth],
    centerX,
    centerZ,
    width: safeWidth,
    depth: safeDepth,
    minX: centerX - safeWidth / 2,
    maxX: centerX + safeWidth / 2,
    minZ: centerZ - safeDepth / 2,
    maxZ: centerZ + safeDepth / 2
  };
}

function createLocalStreetSurfaces(bounds, roads, roadColliders, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial) {
  const streets = [];
  const localProfile = getDistrictLocalStreetProfile(districtProfile);
  const zLines = getLocalStreetGridLines(bounds.minZ, bounds.maxZ, bounds.centerZ, localProfile);
  const xLines = getLocalStreetGridLines(bounds.minX, bounds.maxX, bounds.centerX, localProfile);

  for (let index = 0; index < zLines.length; index += 1) {
    const z = zLines[index];
    const xSpan = getLocalStreetSpan(xLines);

    if (!xSpan) continue;

    const road = createRoadSurface(
      `local-grid-east-west-${chunkX}-${chunkZ}-${index}`,
      'local-grid',
      (xSpan.min + xSpan.max) / 2,
      z,
      xSpan.max - xSpan.min,
      localProfile.width,
      {
        axis: 'x',
        side: 'local-grid',
        marked: true,
        roadType: ROAD_TYPES.groundRoad
      }
    );

    if (isLocalStreetCandidateClear(road, roads, roadColliders, localProfile.centerClearance)) {
      streets.push(road);
    }
  }

  for (let index = 0; index < xLines.length; index += 1) {
    const x = xLines[index];
    const zSpan = getLocalStreetSpan(zLines);

    if (!zSpan) continue;

    const road = createRoadSurface(
      `local-grid-north-south-${chunkX}-${chunkZ}-${index}`,
      'local-grid',
      x,
      (zSpan.min + zSpan.max) / 2,
      localProfile.width,
      zSpan.max - zSpan.min,
      {
        axis: 'z',
        side: 'local-grid',
        marked: true,
        roadType: ROAD_TYPES.groundRoad
      }
    );

    if (isLocalStreetCandidateClear(road, roads, roadColliders, localProfile.centerClearance)) {
      streets.push(road);
    }
  }

  return streets;
}

function getLocalStreetSpan(crossLines) {
  if (crossLines.length < 2) return null;

  const spanMin = crossLines[0];
  const spanMax = crossLines[crossLines.length - 1];

  if (spanMax - spanMin < LOCAL_STREET_MIN_LENGTH) return null;

  return { min: spanMin, max: spanMax };
}

function getDistrictLocalStreetProfile(districtProfile = DISTRICT_PROFILES.commercial) {
  return {
    centerClearance: districtProfile?.localStreetCenterClearance ?? LOCAL_STREET_CENTER_CLEARANCE,
    edgeInset: districtProfile?.localStreetEdgeInset ?? LOCAL_STREET_EDGE_INSET,
    spacing: districtProfile?.localStreetSpacing ?? LOCAL_STREET_SPACING,
    width: districtProfile?.localStreetWidth ?? LOCAL_STREET_WIDTH
  };
}

function getLocalStreetGridLines(min, max, center, localProfile = getDistrictLocalStreetProfile()) {
  const start = Math.ceil((min + localProfile.edgeInset) / localProfile.spacing);
  const end = Math.floor((max - localProfile.edgeInset) / localProfile.spacing);
  const lines = [];

  for (let grid = start; grid <= end; grid += 1) {
    const value = grid * localProfile.spacing;

    if (Math.abs(value - center) < localProfile.centerClearance) continue;
    lines.push(value);
  }

  return lines;
}

function isLocalStreetCandidateClear(road, roads, roadColliders, centerClearance = LOCAL_STREET_CENTER_CLEARANCE) {
  if (!road) return false;
  if (doesRoadOverlapTransportHighwayCorridor(road)) return false;

  const parallelTooClose = roads.some((otherRoad) => (
    otherRoad?.axis === road.axis &&
    otherRoad?.roadType !== ROAD_TYPES.parking &&
    areParallelRoadsTooClose(road, otherRoad, centerClearance * 0.62)
  ));

  if (parallelTooClose) return false;

  const box = createLooseBox(road.centerX, road.centerZ, road.width, road.depth, 0);
  const blockedByNonRoad = roadColliders.some((collider) => (
    collider.type !== ROAD_TYPES.groundRoad &&
    collider.type !== ROAD_TYPES.mainRoad &&
    collider.type !== 'main' &&
    collider.type !== 'local' &&
    collider.type !== ROAD_TYPES.highway &&
    doesBoxOverlapCollider(box, collider)
  ));

  return !blockedByNonRoad;
}

function areParallelRoadsTooClose(road, otherRoad, minDistance) {
  if (road.axis === 'x') return Math.abs((road.centerZ ?? 0) - (otherRoad.centerZ ?? 0)) < minDistance;
  if (road.axis === 'z') return Math.abs((road.centerX ?? 0) - (otherRoad.centerX ?? 0)) < minDistance;
  return false;
}

function createParkingLotSurface(bounds, roadColliders, chunkX, chunkZ) {
  const width = 86 + hashNumber(chunkX, chunkZ, 501) * 38;
  const depth = 58 + hashNumber(chunkX, chunkZ, 502) * 34;
  const candidates = [
    { x: bounds.minX + width / 2 + 42, z: bounds.minZ + depth / 2 + 46 },
    { x: bounds.maxX - width / 2 - 42, z: bounds.minZ + depth / 2 + 46 },
    { x: bounds.minX + width / 2 + 42, z: bounds.maxZ - depth / 2 - 46 },
    { x: bounds.maxX - width / 2 - 42, z: bounds.maxZ - depth / 2 - 46 }
  ];
  const start = Math.floor(hashNumber(chunkX, chunkZ, 503) * candidates.length);

  for (let step = 0; step < candidates.length; step += 1) {
    const candidate = candidates[(start + step) % candidates.length];

    if (!isBoxInsideChunk(candidate.x, candidate.z, width, depth, bounds, 16)) continue;
    if (!isBoxClearOfColliders(candidate.x, candidate.z, width, depth, roadColliders, 2)) continue;

    return createRoadSurface(
      'parking-lot',
      'parking',
      candidate.x,
      candidate.z,
      width,
      depth,
      {
        axis: 'parking',
        side: 'parking',
        marked: false,
        roadType: 'parking'
      }
    );
  }

  return null;
}

function createParkingConnectorRoad(parkingLot, roads, bounds, chunkX, chunkZ) {
  const target = findNearestRoadAnchor(
    { x: parkingLot.centerX, z: parkingLot.centerZ },
    roads.filter((road) => road.id !== parkingLot.id)
  );

  if (!target) return null;

  const dx = target.point.x - parkingLot.centerX;
  const dz = target.point.z - parkingLot.centerZ;
  const length = Math.hypot(dx, dz);

  if (length < 18) return null;

  const directionX = dx / length;
  const directionZ = dz / length;
  const edgeScale = Math.min(
    Math.abs(directionX) > 0.001 ? parkingLot.width / 2 / Math.abs(directionX) : Number.POSITIVE_INFINITY,
    Math.abs(directionZ) > 0.001 ? parkingLot.depth / 2 / Math.abs(directionZ) : Number.POSITIVE_INFINITY
  );
  const start = {
    x: parkingLot.centerX + directionX * Math.min(edgeScale, length * 0.45),
    z: parkingLot.centerZ + directionZ * Math.min(edgeScale, length * 0.45)
  };
  const clip = clipLineToBounds(start, target.point, bounds, 8);

  if (!clip) return null;

  return createSegmentRoad(
    `parking-connector-${chunkX}-${chunkZ}`,
    'parking-connector',
    ROAD_TYPES.groundRoad,
    clip.start,
    clip.end,
    9.5,
    GROUND_DRIVE_Y,
    {
      side: 'parking',
      marked: true
    }
  );
}

function createParkingMarks(parkingLot) {
  const marks = [];
  const columns = Math.max(3, Math.floor(parkingLot.width / 16));
  const rows = Math.max(2, Math.floor(parkingLot.depth / 18));
  const startX = parkingLot.centerX - parkingLot.width * 0.38;
  const startZ = parkingLot.centerZ - parkingLot.depth * 0.32;

  for (let col = 0; col < columns; col += 1) {
    const x = startX + col * (parkingLot.width * 0.76 / Math.max(1, columns - 1));

    marks.push({
      id: `${parkingLot.id}-line-x-${col}`,
      position: [x, 0.048, parkingLot.centerZ],
      scale: [0.16, 0.034, parkingLot.depth * 0.7]
    });
  }

  for (let row = 0; row < rows; row += 1) {
    const z = startZ + row * (parkingLot.depth * 0.64 / Math.max(1, rows - 1));

    marks.push({
      id: `${parkingLot.id}-line-z-${row}`,
      position: [parkingLot.centerX, 0.049, z],
      scale: [parkingLot.width * 0.78, 0.034, 0.16]
    });
  }

  return marks;
}

function generateLaneMarks(roads) {
  const laneMarks = [];
  const transportUnderpassRoads = roads.filter(isTransportUnderpassRoad);

  for (const sourceRoad of roads) {
    const markRoads = Array.isArray(sourceRoad.laneMarkSlices)
      ? sourceRoad.laneMarkSlices
      : [sourceRoad];

    for (const road of markRoads) {
    if (!road.marked && !shouldPaintUnmarkedRoadPatch(road) && !shouldPaintUnmarkedRoadStripe(road)) continue;
    if (road.roadType === 'parking') continue;

    if (shouldUseRoadPatchLaneMarks(road)) {
      addRoadPatchLaneMarks(laneMarks, road);
      continue;
    }

    if (isUpperTransportOverpassRoad(road)) {
      addTransportOverpassLaneMarks(laneMarks, road);
      continue;
    }

    if (isSurfaceTransportAvenueRoad(road)) {
      addSixLaneSurfaceAvenueMarks(laneMarks, road);
      continue;
    }

    if (road.kind === 'transport-highway') {
      addSixLaneTransportHighwayMarks(laneMarks, road, transportUnderpassRoads);
      continue;
    }

    if (shouldUseFastRoadLaneMarks(road)) {
      addFastRoadLaneMarks(laneMarks, road);
      continue;
    }

    const profile = ROAD_PROFILES[road.roadType] ?? ROAD_PROFILES.main;
    const laneMarkInterval = profile.markInterval;
    const laneMarkLength = profile.markLength;
    const centerMarkColor = getCenterLaneMarkColor(road);

    if (shouldUseContinuousCenterLaneMark(road)) {
      addContinuousCenterLaneMark(laneMarks, road, centerMarkColor);
      addRoadEdgeLaneMarks(laneMarks, road);
      continue;
    }

    if (road.axis === 'x') {
      const markPositions = getAxisLaneMarkPositions(road.minX, road.maxX, laneMarkLength, laneMarkInterval);

      for (let markIndex = 0; markIndex < markPositions.length; markIndex += 1) {
        const x = markPositions[markIndex];
        const y = getLaneMarkY(road, x, road.centerZ);

        laneMarks.push({
          id: `mark-x-${road.id}-${markIndex}`,
          position: [x, y, road.centerZ],
          color: centerMarkColor,
          roadType: road.roadType,
          rotation: getLaneMarkRotation(road),
          scale: [laneMarkLength, 0.035, isWideLaneMarkRoad(road.roadType) ? 0.24 : 0.18]
        });
      }

      addRoadEdgeLaneMarks(laneMarks, road);
    }

    if (road.axis === 'z') {
      const markPositions = getAxisLaneMarkPositions(road.minZ, road.maxZ, laneMarkLength, laneMarkInterval);

      for (let markIndex = 0; markIndex < markPositions.length; markIndex += 1) {
        const z = markPositions[markIndex];
        const y = getLaneMarkY(road, road.centerX, z);

        laneMarks.push({
          id: `mark-z-${road.id}-${markIndex}`,
          position: [road.centerX, y, z],
          color: centerMarkColor,
          roadType: road.roadType,
          rotation: getLaneMarkRotation(road),
          scale: [isWideLaneMarkRoad(road.roadType) ? 0.24 : 0.18, 0.035, laneMarkLength]
        });
      }

      addRoadEdgeLaneMarks(laneMarks, road);
    }

    if (road.axis === 'segment') {
      const length = Math.max(road.length ?? road.visualScale?.[0] ?? 0, 0);
      const markDistances = getSegmentLaneMarkDistances(length, laneMarkLength, laneMarkInterval);
      const tangent = normalizeVector({
        x: road.endX - road.startX,
        z: road.endZ - road.startZ
      });
      const rotation = getLaneMarkRotation(road);

      for (let markIndex = 0; markIndex < markDistances.length; markIndex += 1) {
        const distance = markDistances[markIndex];
        const x = road.startX + tangent.x * distance;
        const z = road.startZ + tangent.z * distance;
        const y = getLaneMarkY(road, x, z);

        laneMarks.push({
          id: `mark-segment-${road.id}-${markIndex}`,
          position: [x, y, z],
          color: centerMarkColor,
          roadType: road.roadType,
          rotation,
          scale: [laneMarkLength, 0.035, isWideLaneMarkRoad(road.roadType) ? 0.24 : 0.18]
        });
      }

      addRoadEdgeLaneMarks(laneMarks, road);
    }
    }
  }

  filterLaneMarksAroundSurfaceTunnelAccesses(laneMarks, roads);
  filterLaneMarksAroundFastRoadTunnelOpenings(laneMarks, roads);
  return laneMarks;
}

function filterLaneMarksAroundSurfaceTunnelAccesses(laneMarks, roads) {
  const accessRoads = roads.filter(isSurfaceTunnelAccessRoad);
  if (accessRoads.length === 0) return;

  for (let index = laneMarks.length - 1; index >= 0; index -= 1) {
    const mark = laneMarks[index];
    const markId = String(mark.id ?? '');
    if (
      markId.includes('surface-avenue-tunnel-access') ||
      markId.includes('surface-avenue-lane') ||
      markId.includes('surface-avenue-edge')
    ) {
      continue;
    }

    const [x, y = GROUND_DRIVE_Y, z] = mark.position ?? [];
    if (y > GROUND_DRIVE_Y + 0.72) continue;
    if (!isPointInSurfaceTunnelAccessOpening(x, z, accessRoads, 8.5)) continue;

    laneMarks.splice(index, 1);
  }
}

function filterLaneMarksAroundFastRoadTunnelOpenings(laneMarks, roads) {
  const openingRoads = roads.filter(isFastRoadTunnelOpeningRoad);
  if (openingRoads.length === 0) return;

  for (let index = laneMarks.length - 1; index >= 0; index -= 1) {
    const mark = laneMarks[index];
    const [x, y = GROUND_DRIVE_Y, z] = mark.position ?? [];
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    if (y < GROUND_DRIVE_Y - 0.55 || y > GROUND_DRIVE_Y + 0.82) continue;
    if (!isPointInFastRoadTunnelOpening(x, z, openingRoads, 13)) continue;

    laneMarks.splice(index, 1);
  }
}

function shouldPaintUnmarkedRoadPatch(road) {
  return road?.kind === 'intersection' ||
    road?.kind === 'expressway-joint' ||
    road?.kind === 'expressway-ramp-joint' ||
    road?.kind === 'transport-underpass-joint' ||
    road?.kind === 'transport-overpass-joint';
}

function shouldPaintUnmarkedRoadStripe(road) {
  return road?.kind === 'road-edge-seam';
}

function shouldUseRoadPatchLaneMarks(road) {
  return road?.axis === 'center' ||
    road?.axis === 'joint' ||
    shouldPaintUnmarkedRoadPatch(road) ||
    shouldPaintUnmarkedRoadStripe(road);
}

function addRoadPatchLaneMarks(laneMarks, road) {
  const width = road.width ?? road.scale?.[0] ?? 0;
  const depth = road.depth ?? road.scale?.[1] ?? 0;
  if (width <= 8 || depth <= 8) return;

  const y = (road.position?.[1] ?? road.surface?.y ?? GROUND_DRIVE_Y) + 0.058;
  const centerX = road.centerX ?? road.position?.[0] ?? 0;
  const centerZ = road.centerZ ?? road.position?.[2] ?? 0;
  const markColor = isExpresswayRoadType(road.roadType) || road.roadType === ROAD_TYPES.highway
    ? 'yellow'
    : undefined;
  const horizontalLength = Math.max(4, width - 8);
  const verticalLength = Math.max(4, depth - 8);
  const markWidth = isWideLaneMarkRoad(road.roadType) ? 0.22 : 0.16;

  laneMarks.push(
    {
      id: `patch-mark-x-${road.id}`,
      color: markColor,
      position: [centerX, y, centerZ],
      roadType: road.roadType,
      scale: [horizontalLength, 0.036, markWidth]
    },
    {
      id: `patch-mark-z-${road.id}`,
      color: markColor,
      position: [centerX, y + 0.002, centerZ],
      roadType: road.roadType,
      scale: [markWidth, 0.036, verticalLength]
    }
  );

  if (shouldAddRoadPatchBoundaryMarks(road)) {
    addRoadPatchBoundaryMarks(laneMarks, road, {
      centerX,
      centerZ,
      depth,
      horizontalLength,
      markColor,
      verticalLength,
      width,
      y: y + 0.004
    });
  }
}

function shouldAddRoadPatchBoundaryMarks(road) {
  if (road?.kind === 'road-edge-seam') return false;
  if (road?.roadType === ROAD_TYPES.ramp) return false;
  if (road?.roadType === ROAD_TYPES.parking) return false;
  return road?.kind === 'intersection' ||
    road?.axis === 'center' ||
    road?.axis === 'joint';
}

function addRoadPatchBoundaryMarks(laneMarks, road, layout) {
  const edgeInset = clamp(Math.min(layout.width, layout.depth) * 0.18, 2.4, 5.8);
  const lineWidth = isWideLaneMarkRoad(road.roadType) ? 0.18 : 0.14;
  const xOffset = Math.max(0, layout.width / 2 - edgeInset);
  const zOffset = Math.max(0, layout.depth / 2 - edgeInset);

  if (layout.horizontalLength > 4 && zOffset > 1) {
    laneMarks.push(
      {
        id: `patch-boundary-north-${road.id}`,
        color: layout.markColor,
        position: [layout.centerX, layout.y, layout.centerZ - zOffset],
        roadType: road.roadType,
        scale: [layout.horizontalLength, 0.036, lineWidth]
      },
      {
        id: `patch-boundary-south-${road.id}`,
        color: layout.markColor,
        position: [layout.centerX, layout.y + 0.001, layout.centerZ + zOffset],
        roadType: road.roadType,
        scale: [layout.horizontalLength, 0.036, lineWidth]
      }
    );
  }

  if (layout.verticalLength > 4 && xOffset > 1) {
    laneMarks.push(
      {
        id: `patch-boundary-west-${road.id}`,
        color: layout.markColor,
        position: [layout.centerX - xOffset, layout.y + 0.002, layout.centerZ],
        roadType: road.roadType,
        scale: [lineWidth, 0.036, layout.verticalLength]
      },
      {
        id: `patch-boundary-east-${road.id}`,
        color: layout.markColor,
        position: [layout.centerX + xOffset, layout.y + 0.003, layout.centerZ],
        roadType: road.roadType,
        scale: [lineWidth, 0.036, layout.verticalLength]
      }
    );
  }
}

function isUpperTransportOverpassRoad(road) {
  return typeof road?.kind === 'string' && road.kind.startsWith('transport-overpass');
}

function isTransportUnderpassRoad(road) {
  return typeof road?.kind === 'string' && road.kind.startsWith('transport-underpass');
}

function isSurfaceTransportAvenueRoad(road) {
  return road?.kind === 'surface-avenue';
}

function addTransportOverpassLaneMarks(laneMarks, road) {
  addContinuousCenterLaneMark(laneMarks, road, 'yellow');
  addRoadEdgeLaneMarks(laneMarks, road);
}

function shouldUseContinuousCenterLaneMark(road) {
  return getCenterLaneMarkColor(road) === 'yellow';
}

function addContinuousCenterLaneMark(laneMarks, road, color) {
  const y = getLaneMarkY(road, road.centerX ?? (road.startX + road.endX) / 2, road.centerZ ?? (road.startZ + road.endZ) / 2);
  const thickness = isWideLaneMarkRoad(road.roadType) ? 0.2 : 0.16;

  if (road.axis === 'x') {
    const length = Math.max(0, (road.visualScale?.[0] ?? road.width) - 10);
    if (length <= 4) return;

    laneMarks.push({
      id: `center-line-${road.id}`,
      position: [road.centerX, y, road.centerZ],
      color,
      roadType: road.roadType,
      rotation: getLaneMarkRotation(road),
      scale: [length, 0.036, thickness]
    });
    return;
  }

  if (road.axis === 'z') {
    const length = Math.max(0, (road.visualScale?.[1] ?? road.depth) - 10);
    if (length <= 4) return;

    laneMarks.push({
      id: `center-line-${road.id}`,
      position: [road.centerX, y, road.centerZ],
      color,
      roadType: road.roadType,
      rotation: getLaneMarkRotation(road),
      scale: [thickness, 0.036, length]
    });
    return;
  }

  if (road.axis === 'segment') {
    const length = Math.max(0, (road.visualScale?.[0] ?? road.length ?? 0) - 10);
    if (length <= 4) return;

    const centerX = road.centerX ?? (road.startX + road.endX) / 2;
    const centerZ = road.centerZ ?? (road.startZ + road.endZ) / 2;

    laneMarks.push({
      id: `center-line-${road.id}`,
      position: [centerX, y, centerZ],
      color,
      roadType: road.roadType,
      rotation: getLaneMarkRotation(road),
      scale: [length, 0.036, thickness]
    });
  }
}

function getAxisLaneMarkPositions(min, max, markLength, interval) {
  const positions = [];
  const start = Math.ceil((min + markLength / 2) / interval);
  const end = Math.floor((max - markLength / 2) / interval);

  for (let markIndex = start; markIndex <= end; markIndex += 1) {
    positions.push(markIndex * interval);
  }

  if (positions.length === 0 && max - min >= markLength + 8) {
    positions.push((min + max) / 2);
  }

  return positions;
}

function getSegmentLaneMarkDistances(length, markLength, interval) {
  const distances = [];
  const start = Math.ceil(markLength / 2 / interval);
  const end = Math.floor((length - markLength / 2) / interval);

  for (let markIndex = start; markIndex <= end; markIndex += 1) {
    distances.push(markIndex * interval);
  }

  if (distances.length === 0 && length >= markLength + 8) {
    distances.push(length / 2);
  }

  return distances;
}

function getCenterLaneMarkColor(road) {
  return isGroundSingleCarriagewayRoad(road) ? 'yellow' : undefined;
}

function isGroundSingleCarriagewayRoad(road) {
  if (!road || road.kind === 'transport-highway') return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.ramp) {
    return typeof road.kind === 'string' && road.kind.startsWith('transport-underpass');
  }
  if (road.roadType === ROAD_TYPES.highway || isExpresswayRoadType(road.roadType)) return false;

  return road.roadType === ROAD_TYPES.groundRoad ||
    road.roadType === ROAD_TYPES.mainRoad ||
    road.roadType === 'local' ||
    road.roadType === 'main';
}

function shouldUseFastRoadLaneMarks(road) {
  if (road.kind === 'airport-runway') return false;
  if (road.roadType === ROAD_TYPES.ramp) return false;

  return road.roadType === ROAD_TYPES.highway ||
    road.roadType === ROAD_TYPES.elevatedHighway;
}

function addFastRoadLaneMarks(laneMarks, road) {
  const line = getRoadCenterline(road);
  if (!line) return;

  const width = getRoadCrossWidth(road);
  const laneCount = 4;
  const laneWidth = width / laneCount;
  const length = Math.max(getPlanarLineLength(line), 0);
  if (length <= 20) return;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const rotation = [0, getSegmentBoxYaw(line.start, line.end), 0];
  const markLength = road.roadType === ROAD_TYPES.elevatedHighway ? 30 : 34;
  const markInterval = road.roadType === ROAD_TYPES.elevatedHighway ? 66 : 72;
  const start = Math.ceil(markLength / 2 / markInterval);
  const end = Math.floor((length - markLength / 2) / markInterval);
  const laneBoundaryOffsets = [-laneWidth, 0, laneWidth];

  for (const offset of laneBoundaryOffsets) {
    for (let markIndex = start; markIndex <= end; markIndex += 1) {
      addLinearRoadMark(
        laneMarks,
        road,
        line.start,
        tangent,
        normal,
        rotation,
        markIndex * markInterval,
        offset,
        markLength,
        offset === 0 ? 0.22 : 0.16,
        `fast-${offset}-${markIndex}`
      );
    }
  }

  const edgeLength = Math.max(0, length - 8);
  if (edgeLength <= 1) return;

  for (const side of [-1, 1]) {
    addLinearRoadMark(
      laneMarks,
      road,
      line.start,
      tangent,
      normal,
      rotation,
      length / 2,
      side * (width / 2 - 1.05),
      edgeLength,
      0.18,
      `fast-edge-${side}`
    );
  }
}

function getPlanarLineLength(line) {
  return Math.hypot(line.end.x - line.start.x, line.end.z - line.start.z);
}

function addSixLaneTransportHighwayMarks(laneMarks, road, underpassRoads = []) {
  if (road.axis !== 'segment') return;

  const width = road.surface?.width ?? road.visualScale?.[1] ?? TRANSPORT_HIGHWAY.width;
  const laneWidth = width / 6;
  const length = Math.max(road.length ?? road.visualScale?.[0] ?? 0, 0);
  if (length <= 20) return;

  const tangent = normalizeVector({
    x: road.endX - road.startX,
    z: road.endZ - road.startZ
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const rotation = getLaneMarkRotation(road);
  const markLength = 34;
  const markInterval = 62;
  const laneBoundaryOffsets = [-2 * laneWidth, -laneWidth, laneWidth, 2 * laneWidth];
  const start = Math.ceil(markLength / 2 / markInterval);
  const end = Math.floor((length - markLength / 2) / markInterval);

  for (const offset of laneBoundaryOffsets) {
    for (let markIndex = start; markIndex <= end; markIndex += 1) {
      const distance = markIndex * markInterval;
      if (isTransportHighwayMarkBlockedByUnderpass(road, distance, underpassRoads, offset)) continue;
      addSegmentLaneMark(laneMarks, road, tangent, normal, rotation, distance, offset, markLength, 0.16, `lane-${offset}-${markIndex}`);
    }
  }

  const edgeLength = Math.max(0, length - 8);
  if (edgeLength <= 1) return;
  if (underpassRoads.some((underpassRoad) => doRoadsHorizontallyOverlap(road, underpassRoad, 42))) return;

  for (const side of [-1, 1]) {
    addSegmentLaneMark(
      laneMarks,
      road,
      tangent,
      normal,
      rotation,
      length / 2,
      side * (width / 2 - 1.1),
      edgeLength,
      0.18,
      `edge-${side}`
    );
  }
}

function addSixLaneSurfaceAvenueMarks(laneMarks, road) {
  if (road.axis !== 'segment') return;

  const width = road.surface?.width ?? road.visualScale?.[1] ?? TRANSPORT_SURFACE_AVENUE_WIDTH;
  const laneWidth = width / 6;
  const length = Math.max(road.length ?? road.visualScale?.[0] ?? 0, 0);
  if (length <= 20) return;

  const tangent = normalizeVector({
    x: road.endX - road.startX,
    z: road.endZ - road.startZ
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const rotation = getLaneMarkRotation(road);
  const markLength = 28;
  const markInterval = 58;
  const laneBoundaryOffsets = [-2 * laneWidth, -laneWidth, 0, laneWidth, 2 * laneWidth];
  const start = Math.ceil(markLength / 2 / markInterval);
  const end = Math.floor((length - markLength / 2) / markInterval);

  for (const offset of laneBoundaryOffsets) {
    for (let markIndex = start; markIndex <= end; markIndex += 1) {
      addSegmentLaneMark(
        laneMarks,
        road,
        tangent,
        normal,
        rotation,
        markIndex * markInterval,
        offset,
        markLength,
        offset === 0 ? 0.22 : 0.15,
        `surface-avenue-lane-${offset}-${markIndex}`,
        offset === 0 ? 'yellow' : undefined
      );
    }
  }

  const edgeLength = Math.max(0, length - 8);
  if (edgeLength <= 1) return;

  for (const side of [-1, 1]) {
    addSegmentLaneMark(
      laneMarks,
      road,
      tangent,
      normal,
      rotation,
      length / 2,
      side * (width / 2 - 1.1),
      edgeLength,
      0.18,
      `surface-avenue-edge-${side}`
    );
  }
}

function isTransportHighwayMarkBlockedByUnderpass(road, distance, underpassRoads, lateralOffset = 0) {
  if (!underpassRoads.length) return false;

  const line = getRoadCenterline(road);
  if (!line) return false;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const point = {
    x: line.start.x + tangent.x * distance + normal.x * lateralOffset,
    z: line.start.z + tangent.z * distance + normal.z * lateralOffset
  };

  return underpassRoads.some((underpassRoad) => isPointOnRoadSurface(point.x, point.z, underpassRoad, 42));
}

function addLinearRoadMark(laneMarks, road, start, tangent, normal, rotation, distance, lateralOffset, markLength, markWidth, suffix) {
  const x = start.x + tangent.x * distance + normal.x * lateralOffset;
  const z = start.z + tangent.z * distance + normal.z * lateralOffset;
  const y = getLaneMarkY(road, x, z);

  laneMarks.push({
    id: `mark-${road.id}-${suffix}`,
    position: [x, y, z],
    roadType: road.roadType,
    rotation,
    scale: [markLength, 0.038, markWidth]
  });
}

function addSegmentLaneMark(laneMarks, road, tangent, normal, rotation, distance, lateralOffset, markLength, markWidth, suffix, color = undefined) {
  const x = road.startX + tangent.x * distance + normal.x * lateralOffset;
  const z = road.startZ + tangent.z * distance + normal.z * lateralOffset;
  const y = getLaneMarkY(road, x, z);

  laneMarks.push({
    id: `mark-transport-highway-${road.id}-${suffix}`,
    color,
    position: [x, y, z],
    roadType: road.roadType,
    rotation,
    scale: [markLength, 0.038, markWidth]
  });
}

function generateRoadDetails(roads) {
  const details = {
    curbs: [],
    crosswalks: [],
    medianBarriers: [],
    sidewalkRails: [],
    sidewalks: [],
    stopBars: [],
    trafficSignals: []
  };

  for (const sourceRoad of roads) {
    const detailRoads = Array.isArray(sourceRoad.detailSlices)
      ? sourceRoad.detailSlices
      : [sourceRoad];

    for (const road of detailRoads) {
    if (!shouldAddGroundRoadDetail(road)) continue;

    addSidewalkDetails(details, road);
    addCurbDetails(details, road);
    addMedianBarrierDetails(details, road);
    addIntersectionPaintDetails(details, road);
    addTrafficSignalDetails(details, road);
    }
  }

  addSurfaceAvenueTrafficSignalDetails(details, roads);
  addSurfaceAvenueMedianBarrierDetails(details, roads);
  filterRoadIntrudingBarrierDetails(details, roads);
  filterRoadIntrudingSidewalkDetails(details, roads);
  filterRoadDetailsAroundSurfaceTunnelAccesses(details, roads);
  filterRoadDetailsAroundFastRoadTunnelOpenings(details, roads);
  filterRoadIntrudingTrafficSignals(details, roads);

  return details;
}

function shouldAddGroundRoadDetail(road) {
  return (
    road.marked &&
    !isElevatedBridgeRoad(road) &&
    !(typeof road.kind === 'string' && road.kind.startsWith('transport-')) &&
    !(typeof road.kind === 'string' && road.kind.startsWith('terminal-elevated')) &&
    road.roadType !== ROAD_TYPES.parking &&
    road.roadType !== 'highway' &&
    !isExpresswayRoadType(road.roadType)
  );
}

function addSidewalkDetails(details, road) {
  const y = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.04;
  const sidewalkHeight = 0.075;
  const sidewalkWidth = road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main'
    ? 5.6
    : 4.2;
  const curbThickness = 0.34;

  if (road.axis === 'x') {
    const length = Math.max(0, road.visualScale?.[0] ?? road.width);
    if (length <= 6) return;

    for (const side of [-1, 1]) {
      details.sidewalks.push({
        id: `sidewalk-${road.id}-${side}`,
        roadId: road.id,
        position: [
          road.centerX,
          y,
          road.centerZ + side * (road.depth / 2 + curbThickness + sidewalkWidth / 2)
        ],
        scale: [length, sidewalkHeight, sidewalkWidth]
      });
    }
    return;
  }

  if (road.axis === 'z') {
    const length = Math.max(0, road.visualScale?.[1] ?? road.depth);
    if (length <= 6) return;

    for (const side of [-1, 1]) {
      details.sidewalks.push({
        id: `sidewalk-${road.id}-${side}`,
        roadId: road.id,
        position: [
          road.centerX + side * (road.width / 2 + curbThickness + sidewalkWidth / 2),
          y,
          road.centerZ
        ],
        scale: [sidewalkWidth, sidewalkHeight, length]
      });
    }
    return;
  }

  if (road.axis === 'segment') {
    const length = Math.max(0, road.visualScale?.[0] ?? road.length ?? 0);
    if (length <= 6) return;

    const width = road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);
    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const normal = { x: -tangent.z, z: tangent.x };
    const rotation = [0, getSegmentBoxYaw(
      { x: road.startX, z: road.startZ },
      { x: road.endX, z: road.endZ }
    ), 0];

    for (const side of [-1, 1]) {
      details.sidewalks.push({
        id: `sidewalk-${road.id}-${side}`,
        roadId: road.id,
        position: [
          road.centerX + normal.x * side * (width / 2 + curbThickness + sidewalkWidth / 2),
          y,
          road.centerZ + normal.z * side * (width / 2 + curbThickness + sidewalkWidth / 2)
        ],
        rotation,
        scale: [length, sidewalkHeight, sidewalkWidth]
      });
    }
  }
}

function addSidewalkRailDetails(details, road) {
  const sidewalkWidth = road.roadType === ROAD_TYPES.mainRoad || road.roadType === 'main'
    ? 5.6
    : 4.2;
  const curbThickness = 0.34;
  const railThickness = 0.24;
  const railHeight = 0.78;
  const railBaseY = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.08;
  const railY = railBaseY + railHeight / 2;

  if (road.axis === 'x') {
    const length = Math.max(0, road.visualScale?.[0] ?? road.width);
    if (length <= 20) return;

    for (const side of [-1, 1]) {
      const z = road.centerZ + side * (road.depth / 2 + curbThickness + sidewalkWidth + railThickness / 2);
      details.sidewalkRails.push({
        id: `sidewalk-rail-${road.id}-${side}`,
        position: [road.centerX, railY, z],
        scale: [length, railHeight, railThickness]
      });
    }
    return;
  }

  if (road.axis === 'z') {
    const length = Math.max(0, road.visualScale?.[1] ?? road.depth);
    if (length <= 20) return;

    for (const side of [-1, 1]) {
      const x = road.centerX + side * (road.width / 2 + curbThickness + sidewalkWidth + railThickness / 2);
      details.sidewalkRails.push({
        id: `sidewalk-rail-${road.id}-${side}`,
        position: [x, railY, road.centerZ],
        scale: [railThickness, railHeight, length]
      });
    }
    return;
  }

  if (road.axis === 'segment') {
    const length = Math.max(0, road.visualScale?.[0] ?? road.length ?? 0);
    if (length <= 20) return;

    const width = road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);
    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const normal = { x: -tangent.z, z: tangent.x };
    const rotation = [0, getSegmentBoxYaw(
      { x: road.startX, z: road.startZ },
      { x: road.endX, z: road.endZ }
    ), 0];

    for (const side of [-1, 1]) {
      const offset = side * (width / 2 + curbThickness + sidewalkWidth + railThickness / 2);
      details.sidewalkRails.push({
        id: `sidewalk-rail-${road.id}-${side}`,
        position: [
          road.centerX + normal.x * offset,
          railY,
          road.centerZ + normal.z * offset
        ],
        rotation,
        scale: [length, railHeight, railThickness]
      });
    }
  }
}

function filterRoadIntrudingSidewalkRails(details, roads) {
  for (let index = details.sidewalkRails.length - 1; index >= 0; index -= 1) {
    const rail = details.sidewalkRails[index];

    if (!doesRoadDetailTouchAnyRoad(rail, roads, 0.65)) continue;

    details.sidewalkRails.splice(index, 1);
  }
}

function filterRoadIntrudingTrafficSignals(details, roads) {
  for (let index = details.trafficSignals.length - 1; index >= 0; index -= 1) {
    const signal = details.trafficSignals[index];
    const [poleX, , poleZ] = signal.polePosition;
    const [headX, , headZ] = signal.headPosition;

    if (
      !isPointOnAnyRoadSurface(poleX, poleZ, roads, 1.4) &&
      !isPointOnAnyRoadSurface(headX, headZ, roads, 0.8)
    ) {
      continue;
    }

    details.trafficSignals.splice(index, 1);
  }
}

function filterRoadIntrudingBarrierDetails(details, roads) {
  filterRoadDetailListAgainstForeignRoads(details.curbs, roads, 1.25);
  filterRoadDetailListAgainstForeignRoads(details.medianBarriers, roads, 1.55);
}

function filterRoadIntrudingSidewalkDetails(details, roads) {
  const sidewalks = [];

  for (const sidewalk of details.sidewalks) {
    sidewalks.push(...splitLinearDetailAroundForeignRoads(sidewalk, roads, 2.6));
  }

  details.sidewalks = sidewalks;
}

function filterRoadDetailsAroundSurfaceTunnelAccesses(details, roads) {
  const accessRoads = roads.filter(isSurfaceTunnelAccessRoad);
  if (accessRoads.length === 0) return;

  details.curbs = splitRoadDetailListAroundSurfaceTunnelAccesses(details.curbs, accessRoads, 8.5);
  details.sidewalks = splitRoadDetailListAroundSurfaceTunnelAccesses(details.sidewalks, accessRoads, 18);
  details.medianBarriers = splitRoadDetailListAroundSurfaceTunnelAccesses(details.medianBarriers, accessRoads, 7.5);
  filterPointRoadDetailListAroundSurfaceTunnelAccesses(details.crosswalks, accessRoads, 7.5);
  filterPointRoadDetailListAroundSurfaceTunnelAccesses(details.stopBars, accessRoads, 7.5);
}

function filterRoadDetailsAroundFastRoadTunnelOpenings(details, roads) {
  const openingRoads = roads.filter(isFastRoadTunnelOpeningRoad);
  if (openingRoads.length === 0) return;

  details.curbs = splitRoadDetailListAroundFastRoadTunnelOpenings(details.curbs, openingRoads, 10);
  details.sidewalks = splitRoadDetailListAroundFastRoadTunnelOpenings(details.sidewalks, openingRoads, 20);
  details.sidewalkRails = splitRoadDetailListAroundFastRoadTunnelOpenings(details.sidewalkRails, openingRoads, 18);
  details.medianBarriers = splitRoadDetailListAroundFastRoadTunnelOpenings(details.medianBarriers, openingRoads, 11);
  filterPointRoadDetailListAroundFastRoadTunnelOpenings(details.crosswalks, openingRoads, 11);
  filterPointRoadDetailListAroundFastRoadTunnelOpenings(details.stopBars, openingRoads, 11);
  filterPointRoadDetailListAroundFastRoadTunnelOpenings(details.trafficSignals, openingRoads, 14);
}

function splitRoadDetailListAroundSurfaceTunnelAccesses(details, accessRoads, margin) {
  const next = [];

  for (const detail of details) {
    const layout = getLinearRoadDetailLayout(detail);
    if (!layout) {
      if (!doesRoadDetailTouchSurfaceTunnelAccess(detail, accessRoads, margin)) next.push(detail);
      continue;
    }

    const blockedRanges = [];

    for (const accessRoad of accessRoads) {
      const range = getSurfaceTunnelAccessBlockRangeOnLinearDetail(layout, accessRoad, margin);
      if (range) blockedRanges.push(range);
    }

    if (blockedRanges.length === 0) {
      next.push(detail);
      continue;
    }

    const merged = mergeBlockedRanges(blockedRanges, layout.length);
    let cursor = 0;
    let sliceIndex = 0;

    for (const range of merged) {
      if (range.start - cursor >= 8) {
        next.push(createLinearDetailSlice(detail, layout, { start: cursor, end: range.start }, sliceIndex));
        sliceIndex += 1;
      }

      cursor = Math.max(cursor, range.end);
    }

    if (layout.length - cursor >= 8) {
      next.push(createLinearDetailSlice(detail, layout, { start: cursor, end: layout.length }, sliceIndex));
    }
  }

  return next;
}

function splitRoadDetailListAroundFastRoadTunnelOpenings(details, openingRoads, margin) {
  const next = [];

  for (const detail of details) {
    const layout = getLinearRoadDetailLayout(detail);
    if (!layout) {
      if (!doesRoadDetailTouchFastRoadTunnelOpening(detail, openingRoads, margin)) next.push(detail);
      continue;
    }

    const blockedRanges = [];

    for (const openingRoad of openingRoads) {
      const range = getFastRoadTunnelOpeningBlockRangeOnLinearDetail(layout, openingRoad, margin);
      if (range) blockedRanges.push(range);
    }

    if (blockedRanges.length === 0) {
      next.push(detail);
      continue;
    }

    const merged = mergeBlockedRanges(blockedRanges, layout.length);
    let cursor = 0;
    let sliceIndex = 0;

    for (const range of merged) {
      if (range.start - cursor >= 8) {
        next.push(createLinearDetailSlice(detail, layout, { start: cursor, end: range.start }, sliceIndex));
        sliceIndex += 1;
      }

      cursor = Math.max(cursor, range.end);
    }

    if (layout.length - cursor >= 8) {
      next.push(createLinearDetailSlice(detail, layout, { start: cursor, end: layout.length }, sliceIndex));
    }
  }

  return next;
}

function filterPointRoadDetailListAroundSurfaceTunnelAccesses(details, accessRoads, margin) {
  for (let index = details.length - 1; index >= 0; index -= 1) {
    if (!doesRoadDetailTouchSurfaceTunnelAccess(details[index], accessRoads, margin)) continue;

    details.splice(index, 1);
  }
}

function filterPointRoadDetailListAroundFastRoadTunnelOpenings(details, openingRoads, margin) {
  for (let index = details.length - 1; index >= 0; index -= 1) {
    if (!doesRoadDetailTouchFastRoadTunnelOpening(details[index], openingRoads, margin)) continue;

    details.splice(index, 1);
  }
}

function doesRoadDetailTouchSurfaceTunnelAccess(detail, accessRoads, margin = 0) {
  return getRoadDetailSamplePoints(detail).some((point) => (
    isPointInSurfaceTunnelAccessOpening(point.x, point.z, accessRoads, margin)
  ));
}

function doesRoadDetailTouchFastRoadTunnelOpening(detail, openingRoads, margin = 0) {
  return getRoadDetailSamplePoints(detail).some((point) => (
    isPointInFastRoadTunnelOpening(point.x, point.z, openingRoads, margin)
  ));
}

function isPointInSurfaceTunnelAccessOpening(x, z, accessRoads, margin = 0) {
  return accessRoads.some((accessRoad) => {
    const opening = getSurfaceTunnelAccessOpeningLine(accessRoad);
    if (!opening) return false;

    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      0,
      opening.line.start.x,
      opening.line.start.z,
      opening.line.end.x,
      opening.line.end.z,
      opening.width / 2 + margin
    ));
  });
}

function isPointInFastRoadTunnelOpening(x, z, openingRoads, margin = 0) {
  return openingRoads.some((openingRoad) => {
    const opening = getFastRoadTunnelOpeningLine(openingRoad);
    if (!opening) return false;

    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      0,
      opening.line.start.x,
      opening.line.start.z,
      opening.line.end.x,
      opening.line.end.z,
      opening.width / 2 + margin
    ));
  });
}

function getSurfaceTunnelAccessBlockRangeOnLinearDetail(layout, accessRoad, margin = 0) {
  const opening = getSurfaceTunnelAccessOpeningLine(accessRoad);
  if (!opening) return null;

  const detailStart = {
    x: layout.center.x - layout.direction.x * layout.length / 2,
    z: layout.center.z - layout.direction.z * layout.length / 2
  };
  const detailEnd = {
    x: layout.center.x + layout.direction.x * layout.length / 2,
    z: layout.center.z + layout.direction.z * layout.length / 2
  };
  const closest = getClosestSegmentApproach(detailStart, detailEnd, opening.line.start, opening.line.end);
  const limit = opening.width / 2 + layout.width / 2 + margin;

  if (!closest || closest.distanceSq > limit * limit) return null;

  const centerDistance = clamp(closest.t, 0, 1) * layout.length;
  const blockHalfLength = opening.width / 2 + layout.width + margin + 3;

  return {
    start: clamp(centerDistance - blockHalfLength, 0, layout.length),
    end: clamp(centerDistance + blockHalfLength, 0, layout.length)
  };
}

function getFastRoadTunnelOpeningBlockRangeOnLinearDetail(layout, openingRoad, margin = 0) {
  const opening = getFastRoadTunnelOpeningLine(openingRoad);
  if (!opening) return null;

  const detailStart = {
    x: layout.center.x - layout.direction.x * layout.length / 2,
    z: layout.center.z - layout.direction.z * layout.length / 2
  };
  const detailEnd = {
    x: layout.center.x + layout.direction.x * layout.length / 2,
    z: layout.center.z + layout.direction.z * layout.length / 2
  };
  const closest = getClosestSegmentApproach(detailStart, detailEnd, opening.line.start, opening.line.end);
  const limit = opening.width / 2 + layout.width / 2 + margin;

  if (!closest || closest.distanceSq > limit * limit) return null;

  const alignment = Math.abs(layout.direction.x * opening.tangent.x + layout.direction.z * opening.tangent.z);
  if (alignment > 0.82) {
    const projectedStart = getProjectedDistanceOnLinearDetailLayout(opening.line.start, layout);
    const projectedEnd = getProjectedDistanceOnLinearDetailLayout(opening.line.end, layout);
    const lateralLimit = limit + Math.max(8, opening.width * 0.28);

    if (
      projectedStart.lateralSq <= lateralLimit * lateralLimit ||
      projectedEnd.lateralSq <= lateralLimit * lateralLimit ||
      closest.distanceSq <= lateralLimit * lateralLimit
    ) {
      const startDistance = clamp(Math.min(projectedStart.distance, projectedEnd.distance), 0, layout.length);
      const endDistance = clamp(Math.max(projectedStart.distance, projectedEnd.distance), 0, layout.length);
      const parallelMargin = Math.max(16, opening.width / 2 + layout.width + margin);

      return {
        start: clamp(startDistance - parallelMargin, 0, layout.length),
        end: clamp(endDistance + parallelMargin, 0, layout.length)
      };
    }
  }

  const centerDistance = clamp(closest.t, 0, 1) * layout.length;
  const blockHalfLength = opening.width / 2 + layout.width + margin + 8;

  return {
    start: clamp(centerDistance - blockHalfLength, 0, layout.length),
    end: clamp(centerDistance + blockHalfLength, 0, layout.length)
  };
}

function getProjectedDistanceOnLinearDetailLayout(point, layout) {
  const start = {
    x: layout.center.x - layout.direction.x * layout.length / 2,
    z: layout.center.z - layout.direction.z * layout.length / 2
  };
  const dx = point.x - start.x;
  const dz = point.z - start.z;
  const distance = dx * layout.direction.x + dz * layout.direction.z;
  const distanceSq = dx * dx + dz * dz;
  const lateralSq = Math.max(0, distanceSq - distance * distance);

  return { distance, lateralSq };
}

function splitLinearDetailAroundForeignRoads(detail, roads, margin = 0) {
  const layout = getLinearRoadDetailLayout(detail);
  if (!layout) return doesRoadDetailTouchForeignRoad(detail, roads, margin) ? [] : [detail];

  const blockedRanges = [];

  for (const road of roads) {
    if (!road || road.id === detail.roadId) continue;

    const range = getRoadBlockRangeOnLinearDetail(layout, road, margin);

    if (range) {
      blockedRanges.push(range);
    }
  }

  if (blockedRanges.length === 0) return [detail];

  const merged = mergeBlockedRanges(blockedRanges, layout.length);
  const clearRanges = [];
  let cursor = 0;

  for (const range of merged) {
    if (range.start - cursor >= 10) {
      clearRanges.push({ start: cursor, end: range.start });
    }

    cursor = Math.max(cursor, range.end);
  }

  if (layout.length - cursor >= 10) {
    clearRanges.push({ start: cursor, end: layout.length });
  }

  return clearRanges.map((range, index) => createLinearDetailSlice(detail, layout, range, index));
}

function getLinearRoadDetailLayout(detail) {
  const [x = 0, y = GROUND_DRIVE_Y, z = 0] = detail.position ?? [];
  const [scaleX = 0, scaleY = 0.08, scaleZ = 0] = detail.scale ?? [];
  const length = Math.max(scaleX, scaleZ);
  const width = Math.min(scaleX, scaleZ);

  if (length <= 0.001 || width <= 0.001) return null;

  const yaw = detail.rotation?.[1] ?? 0;
  const alongX = scaleX >= scaleZ;
  const direction = alongX
    ? { x: Math.cos(yaw), z: -Math.sin(yaw) }
    : { x: Math.sin(yaw), z: Math.cos(yaw) };

  return {
    alongX,
    center: { x, z },
    direction,
    length,
    scaleY,
    width,
    y
  };
}

function getRoadBlockRangeOnLinearDetail(layout, road, margin = 0) {
  const detailStart = {
    x: layout.center.x - layout.direction.x * layout.length / 2,
    z: layout.center.z - layout.direction.z * layout.length / 2
  };
  const detailEnd = {
    x: layout.center.x + layout.direction.x * layout.length / 2,
    z: layout.center.z + layout.direction.z * layout.length / 2
  };
  const roadLine = getRoadCenterline(road);
  let t = null;
  let blockHalfLength = Math.max(7, layout.width * 1.2 + margin);

  if (roadLine) {
    const closest = getClosestSegmentApproach(detailStart, detailEnd, roadLine.start, roadLine.end);
    const roadHalfWidth = getRoadCrossWidth(road) / 2;
    const limit = roadHalfWidth + layout.width / 2 + margin;

    if (!closest || closest.distanceSq > limit * limit) return null;

    t = closest.t;
    blockHalfLength = roadHalfWidth + layout.width + margin + 3;
  } else {
    const samplePoints = getRoadBoxSamplePoints(road);
    let best = null;

    for (const point of samplePoints) {
      const projection = projectPointToSegment(
        point.x,
        point.z,
        detailStart.x,
        detailStart.z,
        detailEnd.x,
        detailEnd.z
      );

      if (!projection) continue;

      const dx = point.x - projection.x;
      const dz = point.z - projection.z;
      const distanceSq = dx * dx + dz * dz;

      if (!best || distanceSq < best.distanceSq) {
        best = { distanceSq, t: projection.t };
      }
    }

    const roadHalfExtent = Math.max(road.width ?? 0, road.depth ?? 0) / 2;
    const limit = roadHalfExtent + layout.width / 2 + margin;

    if (!best || best.distanceSq > limit * limit) return null;

    t = best.t;
    blockHalfLength = roadHalfExtent + layout.width + margin;
  }

  const centerDistance = clamp(t, 0, 1) * layout.length;

  return {
    start: clamp(centerDistance - blockHalfLength, 0, layout.length),
    end: clamp(centerDistance + blockHalfLength, 0, layout.length)
  };
}

function mergeBlockedRanges(ranges, length) {
  const sorted = ranges
    .map((range) => ({
      start: clamp(range.start, 0, length),
      end: clamp(range.end, 0, length)
    }))
    .filter((range) => range.end - range.start > 0.5)
    .sort((a, b) => a.start - b.start);
  const merged = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];

    if (!previous || range.start > previous.end + 0.5) {
      merged.push({ ...range });
      continue;
    }

    previous.end = Math.max(previous.end, range.end);
  }

  return merged;
}

function createLinearDetailSlice(detail, layout, range, index) {
  const sliceLength = Math.max(0, range.end - range.start);
  const centerDistance = (range.start + range.end) / 2 - layout.length / 2;
  const position = [
    layout.center.x + layout.direction.x * centerDistance,
    layout.y,
    layout.center.z + layout.direction.z * centerDistance
  ];
  const scale = layout.alongX
    ? [sliceLength, layout.scaleY, layout.width]
    : [layout.width, layout.scaleY, sliceLength];

  return {
    ...detail,
    id: `${detail.id}-slice-${index}`,
    position,
    scale
  };
}

function filterRoadDetailListAgainstForeignRoads(detailList, roads, margin) {
  for (let index = detailList.length - 1; index >= 0; index -= 1) {
    const detail = detailList[index];

    if (!doesRoadDetailTouchForeignRoad(detail, roads, margin)) continue;

    detailList.splice(index, 1);
  }
}

function doesRoadDetailTouchForeignRoad(detail, roads, margin = 0) {
  const ownerRoadId = detail.roadId ?? '';

  return getRoadDetailSamplePoints(detail).some((point) => (
    roads.some((road) => (
      road.id !== ownerRoadId &&
      doesRoadDetailOverlapRoadHeight(detail, road) &&
      isPointOnRoadSurface(point.x, point.z, road, margin)
    ))
  ));
}

function doesRoadDetailTouchAnyRoad(detail, roads, margin = 0) {
  return getRoadDetailSamplePoints(detail).some((point) => (
    roads.some((road) => (
      doesRoadDetailOverlapRoadHeight(detail, road) &&
      isPointOnRoadSurface(point.x, point.z, road, margin)
    ))
  ));
}

function doesRoadDetailOverlapRoadHeight(detail, road) {
  const y = detail.position?.[1] ?? GROUND_DRIVE_Y;
  const height = detail.scale?.[1] ?? 0.16;
  const detailMinY = y - height / 2 - 0.24;
  const detailMaxY = y + height / 2 + 0.64;
  const roadRange = getRoadYRange(road);

  return detailMaxY >= roadRange.minY - 0.36 && detailMinY <= roadRange.maxY + 0.72;
}

function getRoadDetailSamplePoints(detail) {
  const [x, , z] = detail.position ?? [0, 0, 0];
  const [scaleX = 0, , scaleZ = 0] = detail.scale ?? [0, 0, 0];
  const length = Math.max(scaleX, scaleZ);

  if (length <= 1.5) {
    return [{ x, z }];
  }

  const yaw = detail.rotation?.[1] ?? 0;
  const alongX = scaleX >= scaleZ;
  const direction = alongX
    ? { x: Math.cos(yaw), z: -Math.sin(yaw) }
    : { x: Math.sin(yaw), z: Math.cos(yaw) };
  const sampleCount = Math.min(13, Math.max(3, Math.ceil(length / 20)));
  const points = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount - 0.5;

    points.push({
      x: x + direction.x * length * t,
      z: z + direction.z * length * t
    });
  }

  return points;
}

function addMedianBarrierDetails(details, road) {
  if (!shouldAddRoadMedian(road)) return;

  const y = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.24;
  const barrierHeight = 0.36;
  const barrierWidth = 0.92;
  const endInset = 12;

  if (road.axis === 'x') {
    const length = Math.max(0, (road.visualScale?.[0] ?? road.width) - endInset * 2);
    if (length <= 12) return;

    details.medianBarriers.push({
      id: `median-${road.id}`,
      roadId: road.id,
      position: [road.centerX, y, road.centerZ],
      scale: [length, barrierHeight, barrierWidth]
    });
    return;
  }

  if (road.axis === 'z') {
    const length = Math.max(0, (road.visualScale?.[1] ?? road.depth) - endInset * 2);
    if (length <= 12) return;

    details.medianBarriers.push({
      id: `median-${road.id}`,
      roadId: road.id,
      position: [road.centerX, y, road.centerZ],
      scale: [barrierWidth, barrierHeight, length]
    });
    return;
  }

  if (road.axis === 'segment') {
    const length = Math.max(0, (road.visualScale?.[0] ?? road.length ?? 0) - endInset * 2);
    if (length <= 12) return;

    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const rotation = [0, getSegmentBoxYaw(
      { x: road.startX, z: road.startZ },
      { x: road.endX, z: road.endZ }
    ), 0];

    details.medianBarriers.push({
      id: `median-${road.id}`,
      roadId: road.id,
      position: [
        road.centerX,
        y,
        road.centerZ
      ],
      rotation,
      scale: [length, barrierHeight, barrierWidth],
      start: {
        x: road.startX + tangent.x * endInset,
        z: road.startZ + tangent.z * endInset
      },
      end: {
        x: road.endX - tangent.x * endInset,
        z: road.endZ - tangent.z * endInset
      }
    });
  }
}

function addSurfaceAvenueMedianBarrierDetails(details, roads) {
  const avenues = roads.filter(isSurfaceTransportAvenueRoad);
  if (avenues.length === 0) return;

  const blockers = roads.filter((road) => (
    road?.kind === 'surface-avenue-intersection' ||
    road?.kind === 'surface-avenue-tunnel-ramp' ||
    road?.kind === 'surface-avenue-tunnel-slip'
  ));

  for (const avenue of avenues) {
    const line = getRoadCenterline(avenue);
    if (!line) continue;

    const length = getPlanarLineLength(line);
    if (length <= 48) continue;

    const tangent = normalizeVector({
      x: line.end.x - line.start.x,
      z: line.end.z - line.start.z
    });
    const rotation = [0, getSegmentBoxYaw(line.start, line.end), 0];
    const blockedRanges = [
      { start: 0, end: 16 },
      { start: length - 16, end: length }
    ];

    for (const blocker of blockers) {
      const range = getSurfaceAvenueMedianBlockRange(avenue, line, length, blocker);
      if (range) blockedRanges.push(range);
    }

    const merged = mergeBlockedRanges(blockedRanges, length);
    let cursor = 0;
    let sliceIndex = 0;

    for (const range of merged) {
      if (range.start - cursor >= 24) {
        addSurfaceAvenueMedianBarrierSlice(details, avenue, line, tangent, rotation, cursor, range.start, sliceIndex);
        sliceIndex += 1;
      }

      cursor = Math.max(cursor, range.end);
    }

    if (length - cursor >= 24) {
      addSurfaceAvenueMedianBarrierSlice(details, avenue, line, tangent, rotation, cursor, length, sliceIndex);
    }
  }
}

function getSurfaceAvenueMedianBlockRange(avenue, avenueLine, avenueLength, blocker) {
  if (!blocker || blocker.id === avenue.id) return null;

  if (blocker.kind === 'surface-avenue-intersection') {
    const projection = projectPointToSegment(
      blocker.centerX,
      blocker.centerZ,
      avenueLine.start.x,
      avenueLine.start.z,
      avenueLine.end.x,
      avenueLine.end.z
    );
    if (!projection) return null;

    return {
      start: projection.t * avenueLength - Math.max(36, blocker.width * 0.72),
      end: projection.t * avenueLength + Math.max(36, blocker.width * 0.72)
    };
  }

  if (blocker.kind !== 'surface-avenue-tunnel-ramp' && blocker.kind !== 'surface-avenue-tunnel-slip') return null;

  const opening = getSurfaceTunnelAccessOpeningLine(blocker);
  if (!opening) return null;

  const approach = getClosestSegmentApproach(
    avenueLine.start,
    avenueLine.end,
    opening.line.start,
    opening.line.end
  );
  const clearance = getRoadCrossWidth(avenue) / 2 + opening.width / 2 + 5;
  if (!approach || approach.distanceSq > clearance * clearance) return null;

  const centerDistance = clamp(approach.t, 0, 1) * avenueLength;

  return {
    start: centerDistance - TRANSPORT_SURFACE_TUNNEL_ACCESS_MEDIAN_GAP / 2,
    end: centerDistance + TRANSPORT_SURFACE_TUNNEL_ACCESS_MEDIAN_GAP / 2
  };
}

function addSurfaceAvenueMedianBarrierSlice(details, avenue, line, tangent, rotation, startDistance, endDistance, index) {
  const length = Math.max(0, endDistance - startDistance);
  if (length < 18) return;

  const centerDistance = (startDistance + endDistance) / 2;
  const y = (avenue.position?.[1] ?? GROUND_DRIVE_Y) + 0.3;
  const barrierHeight = 0.54;
  const barrierWidth = 0.86;
  const start = {
    x: line.start.x + tangent.x * startDistance,
    z: line.start.z + tangent.z * startDistance
  };
  const end = {
    x: line.start.x + tangent.x * endDistance,
    z: line.start.z + tangent.z * endDistance
  };

  details.medianBarriers.push({
    id: `median-${avenue.id}-surface-${index}`,
    roadId: avenue.id,
    position: [
      line.start.x + tangent.x * centerDistance,
      y,
      line.start.z + tangent.z * centerDistance
    ],
    rotation,
    scale: [length, barrierHeight, barrierWidth],
    start,
    end
  });
}

function shouldAddRoadMedian(road) {
  if (road.kind === 'intersection' || road.axis === 'center' || road.axis === 'joint') return false;
  if (road.kind === 'expressway-feeder') return false;
  if (isElevatedBridgeRoad(road)) return false;
  if (getCenterLaneMarkColor(road) === 'yellow') return false;
  if (doesRoadOverlapTransportHighwayCorridor(road)) return false;
  if (road.roadType !== ROAD_TYPES.mainRoad && road.roadType !== 'main') return false;

  const crossWidth = road.axis === 'x'
    ? road.depth
    : road.axis === 'z'
      ? road.width
      : road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);
  const length = road.axis === 'x'
    ? road.visualScale?.[0] ?? road.width
    : road.axis === 'z'
      ? road.visualScale?.[1] ?? road.depth
      : road.visualScale?.[0] ?? road.length ?? 0;

  return crossWidth >= 13.5 && length >= 48;
}

function generateRoadMedianColliders(roads) {
  const colliders = [];
  const barrierWidth = 0.92;
  const endInset = 12;

  for (const road of roads) {
    if (!shouldAddRoadMedian(road)) continue;

    const baseY = road.position?.[1] ?? GROUND_DRIVE_Y;
    const minY = baseY + 0.03;
    const maxY = baseY + 0.82;

    if (road.axis === 'x') {
      const length = Math.max(0, (road.visualScale?.[0] ?? road.width) - endInset * 2);
      if (length <= 12) continue;

      colliders.push(createHeightLimitedBoxCollider(
        `median-${road.id}-collider`,
        'roadMedian',
        road.centerX,
        road.centerZ,
        length,
        barrierWidth,
        minY,
        maxY
      ));
      continue;
    }

    if (road.axis === 'z') {
      const length = Math.max(0, (road.visualScale?.[1] ?? road.depth) - endInset * 2);
      if (length <= 12) continue;

      colliders.push(createHeightLimitedBoxCollider(
        `median-${road.id}-collider`,
        'roadMedian',
        road.centerX,
        road.centerZ,
        barrierWidth,
        length,
        minY,
        maxY
      ));
      continue;
    }

    if (road.axis === 'segment') {
      const length = Math.max(0, (road.visualScale?.[0] ?? road.length ?? 0) - endInset * 2);
      if (length <= 12) continue;

      const tangent = normalizeVector({
        x: road.endX - road.startX,
        z: road.endZ - road.startZ
      });

      colliders.push(createHeightLimitedSegmentCollider(
        `median-${road.id}-collider`,
        'roadMedian',
        {
          x: road.startX + tangent.x * endInset,
          z: road.startZ + tangent.z * endInset
        },
        {
          x: road.endX - tangent.x * endInset,
          z: road.endZ - tangent.z * endInset
        },
        barrierWidth,
        minY,
        maxY
      ));
    }
  }

  return colliders;
}

function generateRoadDetailColliders(roadDetails) {
  const colliders = [];

  for (const curb of roadDetails?.curbs ?? []) {
    const collider = createRoadDetailCollider(curb, 'roadCurb');

    if (collider) colliders.push(collider);
  }

  for (const barrier of roadDetails?.medianBarriers ?? []) {
    const collider = createRoadDetailCollider(barrier, 'roadDetailMedian');

    if (collider) colliders.push(collider);
  }

  return colliders;
}

function createRoadDetailCollider(detail, type) {
  const [x = 0, y = GROUND_DRIVE_Y, z = 0] = detail.position ?? [];
  const [scaleX = 0, scaleY = 0.2, scaleZ = 0] = detail.scale ?? [];
  const minY = y - scaleY / 2 - 0.03;
  const maxY = y + scaleY / 2 + 0.28;

  if (detail.start && detail.end) {
    return createHeightLimitedSegmentCollider(
      `${detail.id}-collider`,
      type,
      detail.start,
      detail.end,
      Math.max(0.12, Math.min(scaleX, scaleZ)),
      minY,
      maxY
    );
  }

  if (detail.rotation) {
    const yaw = detail.rotation[1] ?? 0;
    const length = Math.max(scaleX, scaleZ);
    const width = Math.max(0.12, Math.min(scaleX, scaleZ));
    const direction = {
      x: Math.cos(yaw),
      z: -Math.sin(yaw)
    };

    return createHeightLimitedSegmentCollider(
      `${detail.id}-collider`,
      type,
      {
        x: x - direction.x * length / 2,
        z: z - direction.z * length / 2
      },
      {
        x: x + direction.x * length / 2,
        z: z + direction.z * length / 2
      },
      width,
      minY,
      maxY
    );
  }

  return createHeightLimitedBoxCollider(
    `${detail.id}-collider`,
    type,
    x,
    z,
    scaleX,
    scaleZ,
    minY,
    maxY
  );
}

function filterRoadAirWallColliders(colliders, roads) {
  return colliders.filter((collider) => (
    !isRoadAirWallCollider(collider, roads) &&
    !isSurfaceTunnelMergeWallCollider(collider, roads)
  ));
}

function isRoadAirWallCollider(collider, roads) {
  if (!isPotentialRoadAirWallCollider(collider)) return false;

  return roads.some((road) => (
    isDriveRoadForAirWallClearance(road) &&
    !doesColliderBelongToRoad(collider, road) &&
    doesColliderOverlapRoadHeight(collider, road, 1.05) &&
    doesColliderTouchRoadSurface(collider, road, 2.2)
  ));
}

function isPotentialRoadAirWallCollider(collider) {
  return collider.type === 'elevatedGuardrail' ||
    collider.type === 'solidBridgeGuardrail' ||
    collider.type === 'roadMedian' ||
    collider.type === 'roadDetailMedian' ||
    collider.type === 'roadCurb' ||
    collider.type === 'highwaySideGuardrail' ||
    collider.type === 'highwayMedianGuardrail';
}

function isSurfaceTunnelMergeWallCollider(collider, roads) {
  if (collider.type !== 'tunnelWall') return false;
  if (String(collider.id ?? '').includes('ramp-wall-retaining')) return false;

  return roads.some((road) => (
    road?.kind === 'surface-avenue-tunnel-merge' &&
    !doesColliderBelongToRoad(collider, road) &&
    doesColliderOverlapRoadHeight(collider, road, 1.05) &&
    doesColliderTouchRoadSurface(collider, road, 3.2)
  ));
}

function isDriveRoadForAirWallClearance(road) {
  return road && road.roadType !== ROAD_TYPES.parking;
}

function doesColliderBelongToRoad(collider, road) {
  return (collider.id ?? '').includes(road.id ?? '');
}

function doesColliderOverlapRoadHeight(collider, road, margin = 1.7) {
  if (!Number.isFinite(collider.minY) || !Number.isFinite(collider.maxY)) return true;

  const { minY, maxY } = getRoadYRange(road);

  return collider.maxY >= minY - margin && collider.minY <= maxY + margin;
}

function getRoadYRange(road) {
  const surface = road.surface;

  if (surface?.shape === 'ramp') {
    return {
      minY: Math.min(surface.startY, surface.endY),
      maxY: Math.max(surface.startY, surface.endY)
    };
  }

  const y = surface?.y ?? road.position?.[1] ?? GROUND_DRIVE_Y;

  return { minY: y, maxY: y };
}

function doesColliderTouchRoadSurface(collider, road, margin = 0) {
  if (collider.shape === 'segment') {
    return doesSegmentTouchRoadSurface(
      { x: collider.startX, z: collider.startZ },
      { x: collider.endX, z: collider.endZ },
      road,
      (collider.width ?? 0) / 2 + margin
    );
  }

  const box = {
    minX: collider.minX - margin,
    maxX: collider.maxX + margin,
    minZ: collider.minZ - margin,
    maxZ: collider.maxZ + margin
  };

  const line = getRoadCenterline(road);
  if (line) {
    const halfWidth = Math.max(getRoadCrossWidth(road) / 2, 0);

    return getBoxSegmentDistanceSq(box, line.start, line.end) <= halfWidth * halfWidth;
  }

  return doBoxesOverlap(box, road);
}

function addCurbDetails(details, road) {
  const y = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.085;
  const curbHeight = 0.16;
  const curbThickness = 0.34;

  if (road.axis === 'x') {
    const length = Math.max(0, road.visualScale?.[0] ?? road.width);
    if (length <= 6) return;

    for (const side of [-1, 1]) {
      details.curbs.push({
        id: `curb-${road.id}-${side}`,
        roadId: road.id,
        position: [road.centerX, y, road.centerZ + side * (road.depth / 2 + curbThickness / 2)],
        scale: [length, curbHeight, curbThickness]
      });
    }
    return;
  }

  if (road.axis === 'z') {
    const length = Math.max(0, road.visualScale?.[1] ?? road.depth);
    if (length <= 6) return;

    for (const side of [-1, 1]) {
      details.curbs.push({
        id: `curb-${road.id}-${side}`,
        roadId: road.id,
        position: [road.centerX + side * (road.width / 2 + curbThickness / 2), y, road.centerZ],
        scale: [curbThickness, curbHeight, length]
      });
    }
    return;
  }

  if (road.axis === 'segment') {
    const length = Math.max(0, road.visualScale?.[0] ?? road.length ?? 0);
    if (length <= 6) return;

    const width = road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);
    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const normal = { x: -tangent.z, z: tangent.x };
    const rotation = [0, getSegmentBoxYaw(
      { x: road.startX, z: road.startZ },
      { x: road.endX, z: road.endZ }
    ), 0];

    for (const side of [-1, 1]) {
      details.curbs.push({
        id: `curb-${road.id}-${side}`,
        roadId: road.id,
        position: [
          road.centerX + normal.x * side * (width / 2 + curbThickness / 2),
          y,
          road.centerZ + normal.z * side * (width / 2 + curbThickness / 2)
        ],
        rotation,
        scale: [length, curbHeight, curbThickness]
      });
    }
  }
}

function addIntersectionPaintDetails(details, road) {
  if (road.kind !== 'segment' || !ROAD_SIDES.includes(road.side)) return;
  if (road.roadType !== ROAD_TYPES.mainRoad && road.roadType !== 'main' && road.roadType !== ROAD_TYPES.groundRoad) return;

  if (road.axis === 'x') {
    const x = road.side === 'west' ? road.maxX - 10 : road.minX + 10;
    addCrosswalkStripes(details, road, x, road.centerZ, 'x');
    addStopBar(details, road, road.side === 'west' ? x - 6 : x + 6, road.centerZ, 'x');
    return;
  }

  if (road.axis === 'z') {
    const z = road.side === 'north' ? road.maxZ - 10 : road.minZ + 10;
    addCrosswalkStripes(details, road, road.centerX, z, 'z');
    addStopBar(details, road, road.centerX, road.side === 'north' ? z - 6 : z + 6, 'z');
  }
}

function addCrosswalkStripes(details, road, x, z, axis) {
  const y = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.062;
  const stripeCount = 6;
  const spacing = 1.05;
  const start = -((stripeCount - 1) * spacing) / 2;
  const crossingWidth = axis === 'x' ? road.depth : road.width;
  const stripeLength = Math.max(5.8, crossingWidth - 1.4);

  for (let index = 0; index < stripeCount; index += 1) {
    const offset = start + index * spacing;

    details.crosswalks.push({
      id: `crosswalk-${road.id}-${index}`,
      position: axis === 'x'
        ? [x + offset, y, z]
        : [x, y, z + offset],
      scale: axis === 'x'
        ? [0.62, 0.034, stripeLength]
        : [stripeLength, 0.034, 0.62]
    });
  }
}

function addStopBar(details, road, x, z, axis) {
  const y = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.066;
  const crossingWidth = axis === 'x' ? road.depth : road.width;
  const barLength = Math.max(6.2, crossingWidth - 1.2);

  details.stopBars.push({
    id: `stop-bar-${road.id}`,
    position: [x, y, z],
    scale: axis === 'x'
      ? [0.2, 0.038, barLength]
      : [barLength, 0.038, 0.2]
  });
}

function addTrafficSignalDetails(details, road) {
  if (road.kind !== 'segment' || !ROAD_SIDES.includes(road.side)) return;
  if (road.roadType !== ROAD_TYPES.mainRoad && road.roadType !== 'main' && road.roadType !== ROAD_TYPES.groundRoad) return;
  if (road.axis !== 'x' && road.axis !== 'z') return;

  const signal = createTrafficSignalForRoad(road);

  if (signal) {
    details.trafficSignals.push(signal);
  }
}

function addSurfaceAvenueTrafficSignalDetails(details, roads) {
  const avenues = roads.filter(isSurfaceTransportAvenueRoad);
  if (avenues.length === 0) return;

  const created = [];

  for (const avenue of avenues) {
    const avenueLine = getRoadCenterline(avenue);
    if (!avenueLine) continue;

    for (const road of roads) {
      if (!isSurfaceAvenueConnectionRoad(road)) continue;

      const roadLine = getRoadCenterline(road);
      if (!roadLine || areRoadLinesNearlyParallel(avenueLine, roadLine)) continue;

      const approach = getClosestSegmentApproach(avenueLine.start, avenueLine.end, roadLine.start, roadLine.end);
      const clearance = getRoadCrossWidth(avenue) / 2 + getRoadCrossWidth(road) / 2 + 5.5;
      if (!approach || approach.distanceSq > clearance * clearance) continue;
      if (approach.t < 0.035 || approach.t > 0.965) continue;

      const point = {
        x: (approach.highwayPoint.x + approach.roadPoint.x) / 2,
        z: (approach.highwayPoint.z + approach.roadPoint.z) / 2
      };

      if (created.some((existing) => Math.hypot(existing.x - point.x, existing.z - point.z) < TRANSPORT_SURFACE_AVENUE_INTERSECTION_MIN_SPACING)) {
        continue;
      }

      created.push(point);
      addSurfaceAvenueSignalPair(details, avenue, point, created.length);
    }
  }
}

function addSurfaceAvenueSignalPair(details, avenue, point, index) {
  const line = getRoadCenterline(avenue);
  if (!line) return;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const width = getRoadCrossWidth(avenue);
  const axis = getTrafficSignalAxis(avenue);

  for (const direction of [-1, 1]) {
    const inbound = {
      x: tangent.x * direction,
      z: tangent.z * direction
    };
    const right = {
      x: inbound.z,
      z: -inbound.x
    };
    const stop = {
      x: point.x - inbound.x * 17,
      z: point.z - inbound.z * 17
    };
    const pole = {
      x: stop.x + right.x * (width / 2 + 8.2),
      z: stop.z + right.z * (width / 2 + 8.2)
    };
    const head = {
      x: stop.x + right.x * (width / 2 + 4.4),
      z: stop.z + right.z * (width / 2 + 4.4)
    };

    details.trafficSignals.push({
      id: `signal-${avenue.id}-${index}-${direction}`,
      axis,
      headPosition: [head.x, GROUND_DRIVE_Y + 4.25, head.z],
      polePosition: [pole.x, GROUND_DRIVE_Y + 2.35, pole.z],
      rotationY: Math.atan2(inbound.x, inbound.z),
      armRotationY: getSegmentBoxYaw(pole, head),
      armPosition: [(pole.x + head.x) / 2, GROUND_DRIVE_Y + 4.55, (pole.z + head.z) / 2],
      armLength: Math.max(1.8, Math.hypot(head.x - pole.x, head.z - pole.z))
    });
  }
}

function createTrafficSignalForRoad(road) {
  const inbound = getRoadInboundDirection(road);
  if (!inbound) return null;

  const right = {
    x: inbound.z,
    z: -inbound.x
  };
  const roadHalfWidth = road.axis === 'x' ? road.depth / 2 : road.width / 2;
  const shoulderOffset = roadHalfWidth + 5.4;
  const stopInset = 15;
  const stopPoint = getRoadStopPoint(road, stopInset);
  const pole = {
    x: stopPoint.x + right.x * shoulderOffset - inbound.x * 1.4,
    z: stopPoint.z + right.z * shoulderOffset - inbound.z * 1.4
  };
  const head = {
    x: pole.x - right.x * 2.8 + inbound.x * 0.9,
    z: pole.z - right.z * 2.8 + inbound.z * 0.9
  };

  return {
    id: `signal-${road.id}`,
    axis: getTrafficSignalAxis(road),
    headPosition: [head.x, GROUND_DRIVE_Y + 4.25, head.z],
    polePosition: [pole.x, GROUND_DRIVE_Y + 2.35, pole.z],
    rotationY: Math.atan2(inbound.x, inbound.z),
    armRotationY: getSegmentBoxYaw(pole, head),
    armPosition: [(pole.x + head.x) / 2, GROUND_DRIVE_Y + 4.55, (pole.z + head.z) / 2],
    armLength: Math.max(1.8, Math.hypot(head.x - pole.x, head.z - pole.z))
  };
}

function getRoadInboundDirection(road) {
  if (road.side === 'north') return { x: 0, z: 1 };
  if (road.side === 'south') return { x: 0, z: -1 };
  if (road.side === 'west') return { x: 1, z: 0 };
  if (road.side === 'east') return { x: -1, z: 0 };
  return null;
}

function getRoadStopPoint(road, inset) {
  if (road.axis === 'x') {
    return {
      x: road.side === 'west' ? road.maxX - inset : road.minX + inset,
      z: road.centerZ
    };
  }

  return {
    x: road.centerX,
    z: road.side === 'north' ? road.maxZ - inset : road.minZ + inset
  };
}

function addRoadEdgeLaneMarks(laneMarks, road) {
  const y = (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.055;
  const roadWidth = road.axis === 'x'
    ? road.depth
    : road.axis === 'z'
      ? road.width
      : getRoadCrossWidth(road);
  const edgeOffset = Math.max(3.2, roadWidth * 0.38);
  const rotation = getLaneMarkRotation(road);

  if (road.axis === 'x') {
    const length = Math.max(0, (road.visualScale?.[0] ?? road.width) - 8);
    if (length <= 1) return;

    laneMarks.push(
      {
        id: `edge-x-left-${road.id}`,
        position: [road.centerX, y, road.centerZ - edgeOffset],
        roadType: road.roadType,
        rotation,
        scale: [length, 0.038, 0.14]
      },
      {
        id: `edge-x-right-${road.id}`,
        position: [road.centerX, y, road.centerZ + edgeOffset],
        roadType: road.roadType,
        rotation,
        scale: [length, 0.038, 0.14]
      }
    );
    return;
  }

  if (road.axis === 'z') {
    const length = Math.max(0, (road.visualScale?.[1] ?? road.depth) - 8);
    if (length <= 1) return;

    laneMarks.push(
      {
        id: `edge-z-left-${road.id}`,
        position: [road.centerX - edgeOffset, y, road.centerZ],
        roadType: road.roadType,
        rotation,
        scale: [0.14, 0.038, length]
      },
      {
        id: `edge-z-right-${road.id}`,
        position: [road.centerX + edgeOffset, y, road.centerZ],
        roadType: road.roadType,
        rotation,
        scale: [0.14, 0.038, length]
      }
    );
  }

  if (road.axis === 'segment') {
    const length = Math.max(0, (road.visualScale?.[0] ?? road.length ?? 0) - 8);
    if (length <= 1) return;

    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const normal = { x: -tangent.z, z: tangent.x };
    const centerY = getLaneMarkY(road, road.centerX, road.centerZ);

    laneMarks.push(
      {
        id: `edge-segment-left-${road.id}`,
        position: [
          road.centerX - normal.x * edgeOffset,
          centerY,
          road.centerZ - normal.z * edgeOffset
        ],
        roadType: road.roadType,
        rotation,
        scale: [length, 0.038, 0.14]
      },
      {
        id: `edge-segment-right-${road.id}`,
        position: [
          road.centerX + normal.x * edgeOffset,
          centerY,
          road.centerZ + normal.z * edgeOffset
        ],
        roadType: road.roadType,
        rotation,
        scale: [length, 0.038, 0.14]
      }
    );
  }
}

function getLaneMarkY(road, x, z) {
  if (road.surface) {
    const y = getDriveSurfaceY(road.surface, x, z);
    if (Number.isFinite(y)) return y + 0.055;
  }

  return (road.position?.[1] ?? GROUND_DRIVE_Y) + 0.055;
}

function getLaneMarkRotation(road) {
  if (road.surface?.shape === 'ramp') {
    return getRampBoxRotation(road.surface);
  }

  if (road.axis === 'segment') {
    return [0, getSegmentBoxYaw(
      { x: road.startX, z: road.startZ },
      { x: road.endX, z: road.endZ }
    ), 0];
  }

  return undefined;
}

function isWideLaneMarkRoad(roadType) {
  return roadType === 'highway' || roadType === ROAD_TYPES.elevatedHighway;
}

function generateBuildings(bounds, roadColliders, chunkX, chunkZ, roadInfo, districtProfile = DISTRICT_PROFILES.commercial, roads = []) {
  const buildings = [];
  const colliders = [];
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const buildingGrid = profile.buildingGrid ?? 62;
  const edgePadding = profile.edgePadding ?? 34;
  const downtownBias = roadInfo.hasHighway ? profile.highRiseBias + 0.12 : profile.highRiseBias;
  const roadClearance = profile.roadClearance ?? 12;
  const jitter = profile.jitter ?? (profile.id === 'economic' ? 14 : 18);
  const highRiseSurpriseChance = profile.highRiseSurpriseChance ?? 0.08;
  const startX = Math.ceil((bounds.minX + edgePadding) / buildingGrid);
  const endX = Math.floor((bounds.maxX - edgePadding) / buildingGrid);
  const startZ = Math.ceil((bounds.minZ + edgePadding) / buildingGrid);
  const endZ = Math.floor((bounds.maxZ - edgePadding) / buildingGrid);

  for (let gx = startX; gx <= endX; gx += 1) {
    for (let gz = startZ; gz <= endZ; gz += 1) {
      if (hashNumber(gx, gz, 13) < (profile.vacancy ?? 0.26)) continue;

      const isHighRise = hashNumber(gx, gz, 17) < downtownBias ||
        hashNumber(gx, gz, 18) > 1 - highRiseSurpriseChance;
      const lowSize = profile.lowRiseSize ?? [12, 36];
      const highSize = profile.highRiseSize ?? [18, 36];
      const lowHeight = profile.lowRiseHeight ?? [5, 29];
      const highHeight = profile.highRiseHeight ?? [46, 116];
      const width = isHighRise
        ? randomRange(highSize, hashNumber(gx, gz, 20))
        : randomRange(lowSize, hashNumber(gx, gz, 20));
      const depth = isHighRise
        ? randomRange(highSize, hashNumber(gx, gz, 30))
        : randomRange(lowSize, hashNumber(gx, gz, 30));
      const height = isHighRise
        ? randomRange(highHeight, hashNumber(gx, gz, 40))
        : randomRange(lowHeight, hashNumber(gx, gz, 41));
      const baseX = gx * buildingGrid + (hashNumber(gx, gz, 50) - 0.5) * jitter;
      const baseZ = gz * buildingGrid + (hashNumber(gx, gz, 60) - 0.5) * jitter;
      const placement = resolveBuildingPlacement(
        baseX,
        baseZ,
        width,
        depth,
        bounds,
        roadColliders,
        colliders,
        Math.max(roadClearance, isHighRise ? 20 : 14),
        isHighRise,
        gx,
        gz
      );

      if (!placement) continue;

      const id = `building-${chunkX}-${chunkZ}-${gx}-${gz}`;
      const colorPalette = profile.palette ?? BUILDING_PALETTE;

      buildings.push({
        id,
        district: profile.id,
        kind: getDistrictBuildingKind(profile, isHighRise),
        position: [placement.x, height / 2, placement.z],
        scale: [width, height, depth],
        color: colorPalette[Math.floor(hashNumber(gx, gz, 70) * colorPalette.length)]
      });
      colliders.push(createBoxCollider(id, 'building', placement.x, placement.z, width, depth));
    }
  }

  addRoadsideInfillBuildings(buildings, colliders, bounds, roadColliders, roads, chunkX, chunkZ, profile);

  return { buildings, colliders };
}

function addRoadsideInfillBuildings(buildings, colliders, bounds, roadColliders, roads, chunkX, chunkZ, profile) {
  const targetExtra = profile.id === 'industrial'
    ? 18
    : profile.id === 'residential' || profile.id === 'oldTown'
      ? 16
      : 22;
  let added = 0;

  for (const road of roads) {
    if (added >= targetExtra) break;
    if (!isRoadsideInfillRoad(road)) continue;

    const line = getRoadCenterline(road);
    if (!line) continue;

    const length = getPlanarLineLength(line);
    if (length < 52) continue;

    const tangent = normalizeVector({
      x: line.end.x - line.start.x,
      z: line.end.z - line.start.z
    });
    const normal = { x: -tangent.z, z: tangent.x };
    const roadHalfWidth = getRoadCrossWidth(road) / 2;
    const spacing = profile.id === 'industrial' ? 92 : 78;
    const startIndex = Math.ceil(28 / spacing);
    const endIndex = Math.floor((length - 28) / spacing);

    for (let index = startIndex; index <= endIndex && added < targetExtra; index += 1) {
      const distance = index * spacing + (hashNumber(chunkX, chunkZ, index + road.id.length) - 0.5) * 18;
      if (distance <= 24 || distance >= length - 24) continue;

      const base = {
        x: line.start.x + tangent.x * distance,
        z: line.start.z + tangent.z * distance
      };

      for (const side of [-1, 1]) {
        if (added >= targetExtra) break;
        if (hashNumber(index, side, chunkX * 43 + chunkZ * 47 + road.id.length) < 0.38) continue;

        const width = profile.id === 'industrial'
          ? 24 + hashNumber(index, side, 1201) * 34
          : 18 + hashNumber(index, side, 1202) * 22;
        const depth = profile.id === 'industrial'
          ? 22 + hashNumber(index, side, 1203) * 36
          : 16 + hashNumber(index, side, 1204) * 18;
        const heightRange = profile.id === 'industrial'
          ? [14, 42]
          : profile.lowRiseHeight ?? [16, 48];
        const height = randomRange(heightRange, hashNumber(index, side, 1205));
        const setback = roadHalfWidth + depth / 2 + 12 + hashNumber(index, side, 1206) * 12;
        const x = base.x + normal.x * side * setback;
        const z = base.z + normal.z * side * setback;

        if (!isBoxInsideChunk(x, z, width, depth, bounds, 3)) continue;
        if (isBoxInsideSpawnClearZone(x, z, width, depth)) continue;
        if (!isBoxClearOfColliders(x, z, width, depth, roadColliders, 8)) continue;
        if (!isBoxClearOfColliders(x, z, width, depth, colliders, 7)) continue;

        const id = `building-infill-${chunkX}-${chunkZ}-${road.id}-${index}-${side}`;
        const colorPalette = profile.palette ?? BUILDING_PALETTE;

        buildings.push({
          id,
          district: profile.id,
          kind: getDistrictBuildingKind(profile, false),
          position: [x, height / 2, z],
          scale: [width, height, depth],
          color: colorPalette[Math.floor(hashNumber(index, side, 1207) * colorPalette.length)]
        });
        colliders.push(createBoxCollider(id, 'building', x, z, width, depth));
        added += 1;
      }
    }
  }
}

function isRoadsideInfillRoad(road) {
  if (!road?.marked) return false;
  if (road.roadType === ROAD_TYPES.parking) return false;
  if (road.roadType === ROAD_TYPES.highway) return false;
  if (isExpresswayRoadType(road.roadType)) return false;
  if (typeof road.kind === 'string' && (
    road.kind.startsWith('transport-highway') ||
    road.kind.startsWith('expressway')
  )) {
    return false;
  }

  return road.axis === 'x' || road.axis === 'z' || road.axis === 'segment';
}

function resolveBuildingPlacement(baseX, baseZ, width, depth, bounds, roadColliders, buildingColliders, clearance, isHighRise, gx, gz) {
  const candidates = [{ x: baseX, z: baseZ }];

  if (isHighRise) {
    const spreadRadius = 92 + hashNumber(gx, gz, 92) * 132;

    for (let index = 0; index < 8; index += 1) {
      const angle = hashNumber(gx, gz, 930 + index) * Math.PI * 2;
      const radius = spreadRadius * (0.55 + hashNumber(gx, gz, 950 + index) * 0.45);

      candidates.push({
        x: baseX + Math.cos(angle) * radius,
        z: baseZ + Math.sin(angle) * radius
      });
    }
  }

  for (const candidate of candidates) {
    if (!isBoxInsideChunk(candidate.x, candidate.z, width, depth, bounds, 3)) continue;
    if (isBoxInsideSpawnClearZone(candidate.x, candidate.z, width, depth)) continue;
    if (!isBoxClearOfColliders(candidate.x, candidate.z, width, depth, roadColliders, clearance)) continue;
    if (!isBoxClearOfColliders(candidate.x, candidate.z, width, depth, buildingColliders, isHighRise ? 26 : 8)) continue;

    return candidate;
  }

  return null;
}

function getDistrictBuildingKind(profile, isHighRise) {
  if (profile?.id === 'economic') return isHighRise ? 'economicTower' : 'commercialPodium';
  if (profile?.id === 'industrial' || profile?.id === 'harbor') return 'warehouse';
  if (profile?.id === 'residential') return isHighRise ? 'apartmentTower' : 'apartmentBlock';
  if (profile?.id === 'oldTown') return isHighRise ? 'oldMidRise' : 'oldBlock';
  return isHighRise ? 'highRise' : 'lowRise';
}

function randomRange([min, max], roll) {
  return min + (max - min) * roll;
}

function removeRoadIntrudingBuildings(buildings, colliders, roadColliders, roads = []) {
  for (let index = buildings.length - 1; index >= 0; index -= 1) {
    const building = buildings[index];
    const buildingX = building.position[0];
    const buildingZ = building.position[2];
    const buildingWidth = building.scale[0];
    const buildingDepth = building.scale[2];
    const roadClearance = getBuildingGroundRoadClearance(building);

    if (
      building.preserveTransportHub &&
      isBuildingClearOfRoadSurfaces(buildingX, buildingZ, buildingWidth, buildingDepth, roads, 4) &&
      isBuildingClearOfGroundRoadSurfaces(buildingX, buildingZ, buildingWidth, buildingDepth, roads, 4)
    ) {
      continue;
    }

    if (isBoxClearOfColliders(
      buildingX,
      buildingZ,
      buildingWidth,
      buildingDepth,
      roadColliders,
      Math.max(10, roadClearance * 0.55)
    ) &&
      isBuildingClearOfRoadSurfaces(buildingX, buildingZ, buildingWidth, buildingDepth, roads, 10) &&
      isBuildingClearOfGroundRoadSurfaces(buildingX, buildingZ, buildingWidth, buildingDepth, roads, roadClearance)
    ) {
      continue;
    }

    buildings.splice(index, 1);
    colliders.splice(index, 1);
  }
}

function removeBuildingsNearMetroClearance(buildings, colliders, roadColliders) {
  const metroClearanceColliders = roadColliders.filter((collider) => (
    collider?.type === 'metroClearance' ||
    collider?.type === 'metroStationClearance'
  ));

  if (metroClearanceColliders.length === 0) return;

  for (let index = buildings.length - 1; index >= 0; index -= 1) {
    const building = buildings[index];
    if (building?.preserveTransportHub) continue;

    const [x = 0, , z = 0] = building.position ?? [];
    const [width = 0, , depth = 0] = building.scale ?? [];
    const box = createLooseBox(x, z, width, depth, 16);
    const touchesMetro = metroClearanceColliders.some((collider) => doesBoxOverlapCollider(box, collider));

    if (!touchesMetro) continue;

    buildings.splice(index, 1);
    colliders.splice(index, 1);
  }
}

function removeBuildingsNearStructureClearance(buildings, colliders, structureClearanceColliders = []) {
  if (structureClearanceColliders.length === 0) return;

  for (let index = buildings.length - 1; index >= 0; index -= 1) {
    const building = buildings[index];
    if (building?.preserveTransportHub) continue;

    const [x = 0, , z = 0] = building.position ?? [];
    const [width = 0, , depth = 0] = building.scale ?? [];
    const box = createLooseBox(x, z, width, depth, 4);
    const touchesStructure = structureClearanceColliders.some((collider) => doesBoxOverlapCollider(box, collider));
    if (!touchesStructure) continue;

    buildings.splice(index, 1);
    colliders.splice(index, 1);
  }
}

function removeBuildingsInsideTerrainLandforms(buildings, colliders, terrainLandforms = []) {
  if (terrainLandforms.length === 0) return;

  for (let index = buildings.length - 1; index >= 0; index -= 1) {
    const building = buildings[index];
    const collider = colliders[index] ?? createBuildingCollider(building);
    if (!collider) continue;

    const overlapsLandform = terrainLandforms.some((landform) => (
      doesTerrainLandformOverlapCollider(
        landform,
        collider,
        TERRAIN_LANDFORM_BUILDING_CLEARANCE
      )
    ));
    if (!overlapsLandform) continue;

    buildings.splice(index, 1);
    colliders.splice(index, 1);
  }
}

function createBuildingCollider(building) {
  const [x = 0, , z = 0] = building?.position ?? [];
  const [width = 0, , depth = 0] = building?.scale ?? [];
  if (!Number.isFinite(x) || !Number.isFinite(z) || width <= 0 || depth <= 0) return null;

  return createBoxCollider(building.id ?? 'building', 'building', x, z, width, depth);
}

function doesTerrainLandformOverlapCollider(landform, collider, margin = 0) {
  const footprint = getTerrainLandformFootprint(landform);
  if (!footprint) return false;

  return doesCircleOverlapCollider(
    footprint.x,
    footprint.z,
    footprint.radius + margin,
    collider
  );
}

function isBuildingClearOfRoadSurfaces(x, z, width, depth, roads, margin = 0) {
  if (!Array.isArray(roads) || roads.length === 0) return true;

  const box = createLooseBox(x, z, width, depth, margin);

  return roads.every((road) => !doesBoxOverlapRoadSurface(box, road));
}

function isBuildingClearOfGroundRoadSurfaces(x, z, width, depth, roads, margin = 0) {
  if (!Array.isArray(roads) || roads.length === 0) return true;

  const box = createLooseBox(x, z, width, depth, margin);

  return roads.every((road) => (
    !isGroundRoadBuildingConflictRoad(road) ||
    !doesBoxOverlapRoadSurface(box, road)
  ));
}

function isGroundRoadBuildingConflictRoad(road) {
  if (!road) return false;
  if (road.kind === 'transport-underpass-tunnel') return false;
  if (typeof road.kind === 'string' && road.kind.startsWith('transport-overpass')) return false;
  if (road.roadType === ROAD_TYPES.elevatedHighway || isExpresswayRoadType(road.roadType)) return false;
  if (road.roadType === ROAD_TYPES.parking) return true;
  if (road.roadType === ROAD_TYPES.highway) return false;

  const { maxY } = getRoadYRange(road);
  return maxY <= GROUND_DRIVE_Y + 1.25 ||
    road.roadType === ROAD_TYPES.groundRoad ||
    road.roadType === ROAD_TYPES.mainRoad ||
    road.roadType === 'local' ||
    road.roadType === 'main';
}

function getBuildingGroundRoadClearance(building) {
  if (building?.district === 'economic') return 22;
  if (building?.district === 'industrial' || building?.district === 'harbor') return 24;
  if (building?.district === 'residential' || building?.district === 'oldTown') return 18;
  return 20;
}

function generateTrees(bounds, roads, roadColliders, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial) {
  const trees = [];
  const colliders = [];
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const spacing = profile.treeSpacing ?? 74;
  const maxTrees = profile.maxTrees ?? Infinity;
  const roadTreeSkip = profile.roadTreeSkip ?? (profile.id === 'industrial'
    ? 0.34
    : profile.id === 'downtown' || profile.id === 'economic'
      ? 0.18
      : profile.id === 'oldTown'
        ? 0.08
        : 0);

  for (const road of roads) {
    if (trees.length >= maxTrees) break;
    if (!road.marked) continue;
    if (road.roadType === 'parking' || road.roadType === 'highway' || isExpresswayRoadType(road.roadType)) continue;

    const roadSideOffset = road.width < road.depth
      ? road.width / 2 + 16
      : road.depth / 2 + 16;

    if (road.axis === 'x') {
      const start = Math.ceil(road.minX / spacing);
      const end = Math.floor(road.maxX / spacing);

      for (let index = start; index <= end; index += 1) {
        if (trees.length >= maxTrees) break;
        for (const side of [-1, 1]) {
          if (trees.length >= maxTrees) break;
          if (hashNumber(index, chunkZ, side + 931) < roadTreeSkip) continue;

          const x = index * spacing + (hashNumber(index, chunkZ, side) - 0.5) * 12;
          const z = road.centerZ + side * (roadSideOffset + 1.5 + hashNumber(index, chunkX, side + 9) * 9);
          addTree(trees, colliders, bounds, roadColliders, x, z, `tree-${chunkX}-${chunkZ}-${road.id}-${index}-${side}`);
        }
      }
    }

    if (road.axis === 'z') {
      const start = Math.ceil(road.minZ / spacing);
      const end = Math.floor(road.maxZ / spacing);

      for (let index = start; index <= end; index += 1) {
        if (trees.length >= maxTrees) break;
        for (const side of [-1, 1]) {
          if (trees.length >= maxTrees) break;
          if (hashNumber(chunkX, index, side + 937) < roadTreeSkip) continue;

          const x = road.centerX + side * (roadSideOffset + 1.5 + hashNumber(chunkZ, index, side + 17) * 9);
          const z = index * spacing + (hashNumber(chunkX, index, side + 23) - 0.5) * 12;
          addTree(trees, colliders, bounds, roadColliders, x, z, `tree-${chunkX}-${chunkZ}-${road.id}-${index}-${side}`);
        }
      }
    }
  }

  if (trees.length < maxTrees) {
    addOpenSpaceTrees(trees, colliders, bounds, roadColliders, chunkX, chunkZ, profile, maxTrees);
  }

  return { trees, colliders };
}

function addOpenSpaceTrees(trees, colliders, bounds, blockers, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial, maxTrees = Infinity) {
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const spacing = profile.openTreeSpacing ?? 132;
  const padding = 42;
  const startX = Math.ceil((bounds.minX + padding) / spacing);
  const endX = Math.floor((bounds.maxX - padding) / spacing);
  const startZ = Math.ceil((bounds.minZ + padding) / spacing);
  const endZ = Math.floor((bounds.maxZ - padding) / spacing);

  for (let gx = startX; gx <= endX; gx += 1) {
    for (let gz = startZ; gz <= endZ; gz += 1) {
      if (trees.length >= maxTrees) return;
      if (hashNumber(gx, gz, chunkX * 17 + chunkZ * 19 + 830) < (profile.openTreeSkip ?? 0.58)) continue;

      const baseX = gx * spacing + (hashNumber(gx, gz, 831) - 0.5) * 34;
      const baseZ = gz * spacing + (hashNumber(gx, gz, 832) - 0.5) * 34;
      const clusterThreshold = profile.openTreeClusterThreshold ?? (profile.id === 'residential' ? 0.42 : 0.72);
      const clusterCount = hashNumber(gx, gz, 833) > clusterThreshold ? 2 : 1;

      for (let index = 0; index < clusterCount; index += 1) {
        if (trees.length >= maxTrees) return;
        const angle = hashNumber(gx + index, gz, 834) * Math.PI * 2;
        const radius = index === 0 ? 0 : 10 + hashNumber(gx, gz + index, 835) * 11;
        const x = baseX + Math.cos(angle) * radius;
        const z = baseZ + Math.sin(angle) * radius;

        addTree(trees, colliders, bounds, blockers, x, z, `tree-open-${chunkX}-${chunkZ}-${gx}-${gz}-${index}`);
      }
    }
  }
}

function addTree(trees, colliders, bounds, roadColliders, x, z, id) {
  if (!isInsideChunk(x, z, bounds)) return;
  if (isBoxInsideSpawnClearZone(x, z, 4, 4)) return;
  if (!isBoxClearOfColliders(x, z, 3, 3, roadColliders, 12)) return;
  if (!isBoxClearOfColliders(x, z, 3, 3, colliders, 4)) return;

  const trunkHeight = 2.8 + hashNumber(x, z, 80) * 1.4;
  const canopyHeight = 4.5 + hashNumber(x, z, 81) * 2.2;

  trees.push({
    id,
    position: [x, 0, z],
    trunkHeight,
    canopyHeight,
    canopyRadius: 2.7 + hashNumber(x, z, 82) * 1.2
  });
  colliders.push(createBoxCollider(id, 'tree', x, z, 2.4, 2.4));
}

function removeRoadIntrudingTrees(trees, colliders, roadColliders) {
  for (let index = trees.length - 1; index >= 0; index -= 1) {
    const tree = trees[index];

    if (isBoxClearOfColliders(tree.position[0], tree.position[2], 3.2, 3.2, roadColliders, 10)) {
      continue;
    }

    trees.splice(index, 1);
    colliders.splice(index, 1);
  }
}

function generateStreetLights(bounds, roads, roadColliders, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial) {
  const streetLights = [];
  const colliders = [];
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const spacing = profile.streetLightSpacing ?? 108;
  const maxStreetLights = profile.maxStreetLights ?? Infinity;

  for (const road of roads) {
    if (streetLights.length >= maxStreetLights) break;
    if (!road.marked) continue;
    if (road.roadType === 'parking' || isExpresswayRoadType(road.roadType)) continue;

    const roadSideOffset = road.width < road.depth
      ? road.width / 2 + 8.5
      : road.depth / 2 + 8.5;

    if (road.axis === 'x') {
      const start = Math.ceil(road.minX / spacing);
      const end = Math.floor(road.maxX / spacing);

      for (let index = start; index <= end; index += 1) {
        if (streetLights.length >= maxStreetLights) break;
        const sides = shouldUseDoubleSidedStreetLights(road, profile) ? [-1, 1] : [index % 2 === 0 ? -1 : 1];

        for (const side of sides) {
          if (streetLights.length >= maxStreetLights) break;
          const x = index * spacing + 16;
          const z = road.centerZ + side * roadSideOffset;
          addStreetLight(
            streetLights,
            colliders,
            bounds,
            roadColliders,
            x,
            z,
            Math.PI / 2,
            `light-${chunkX}-${chunkZ}-${road.id}-${index}-${side}`
          );
        }
      }
    }

    if (road.axis === 'z') {
      const start = Math.ceil(road.minZ / spacing);
      const end = Math.floor(road.maxZ / spacing);

      for (let index = start; index <= end; index += 1) {
        if (streetLights.length >= maxStreetLights) break;
        const sides = shouldUseDoubleSidedStreetLights(road, profile) ? [-1, 1] : [index % 2 === 0 ? -1 : 1];

        for (const side of sides) {
          if (streetLights.length >= maxStreetLights) break;
          const x = road.centerX + side * roadSideOffset;
          const z = index * spacing + 16;
          addStreetLight(
            streetLights,
            colliders,
            bounds,
            roadColliders,
            x,
            z,
            0,
            `light-${chunkX}-${chunkZ}-${road.id}-${index}-${side}`
          );
        }
      }
    }
  }

  return { streetLights, colliders };
}

function shouldUseDoubleSidedStreetLights(road, profile) {
  if (!profile.streetLightBothSides) return false;

  return road.roadType === ROAD_TYPES.mainRoad ||
    road.roadType === 'main' ||
    road.kind === 'junction-link';
}

function addStreetLight(streetLights, colliders, bounds, roadColliders, x, z, rotationY, id) {
  if (!isInsideChunk(x, z, bounds)) return;
  if (isBoxInsideSpawnClearZone(x, z, 3, 3)) return;
  if (!isBoxClearOfColliders(x, z, 1.4, 1.4, roadColliders, 2.8)) return;

  streetLights.push({
    id,
    position: [x, 0, z],
    rotationY
  });
  colliders.push(createBoxCollider(id, 'streetLight', x, z, 1.1, 1.1));
}

function removeRoadIntrudingStreetLights(streetLights, colliders, roadColliders) {
  for (let index = streetLights.length - 1; index >= 0; index -= 1) {
    const light = streetLights[index];

    if (isBoxClearOfColliders(light.position[0], light.position[2], 1.4, 1.4, roadColliders, 2.8)) {
      continue;
    }

    streetLights.splice(index, 1);
    colliders.splice(index, 1);
  }
}

function generateBillboards(bounds, roads, roadColliders, chunkX, chunkZ, districtProfile = DISTRICT_PROFILES.commercial) {
  const billboards = [];
  const colliders = [];
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const billboardRoads = roads.filter((road) => (
    road.marked &&
    road.roadType !== 'parking' &&
    !isExpresswayRoadType(road.roadType)
  ));
  const maxCount = Math.min(profile.billboardMax ?? 3, billboardRoads.length);

  for (let index = 0; index < maxCount; index += 1) {
    const road = billboardRoads[index];
    if (hashNumber(chunkX, chunkZ, 520 + index) > (profile.billboardChance ?? 0.56)) continue;

    const side = hashNumber(chunkX, chunkZ, 530 + index) > 0.5 ? 1 : -1;
    const palette = profile.id === 'industrial'
      ? ['#f2d486', '#e36d5c', '#7898a8']
      : profile.id === 'residential'
        ? ['#9fd08c', '#d1bb78']
        : BILLBOARD_PALETTE;
    const color = palette[Math.floor(hashNumber(chunkX, chunkZ, 540 + index) * palette.length)];

    if (road.axis === 'x') {
      const x = clamp(
        road.centerX + (hashNumber(chunkX, chunkZ, 550 + index) - 0.5) * road.width * 0.78,
        road.minX + 22,
        road.maxX - 22
      );
      const z = road.centerZ + side * (road.depth / 2 + 42);
      addBillboard(billboards, colliders, bounds, roadColliders, x, z, Math.PI / 2, color, `billboard-${chunkX}-${chunkZ}-${index}`);
    }

    if (road.axis === 'z') {
      const x = road.centerX + side * (road.width / 2 + 42);
      const z = clamp(
        road.centerZ + (hashNumber(chunkX, chunkZ, 560 + index) - 0.5) * road.depth * 0.78,
        road.minZ + 22,
        road.maxZ - 22
      );
      addBillboard(billboards, colliders, bounds, roadColliders, x, z, 0, color, `billboard-${chunkX}-${chunkZ}-${index}`);
    }
  }

  return { billboards, colliders };
}

function addBillboard(billboards, colliders, bounds, roadColliders, x, z, rotationY, color, id) {
  if (!isInsideChunk(x, z, bounds)) return;
  if (isBoxInsideSpawnClearZone(x, z, 8, 3)) return;
  if (!isBoxClearOfColliders(x, z, 5.5, 2.2, roadColliders, 1.5)) return;

  billboards.push({
    id,
    color,
    position: [x, 0, z],
    rotationY,
    width: 7.4,
    height: 3.2
  });
  colliders.push(createBoxCollider(id, 'billboard', x, z, 5.5, 2.2));
}

function generateDirectionalRoadSigns(bounds, roads, blockers, chunkX, chunkZ, districtProfile = null) {
  const signs = [];
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;
  const signRoads = roads.filter((road) => (
    road.marked &&
    road.roadType !== ROAD_TYPES.parking &&
    road.roadType !== ROAD_TYPES.highway &&
    !isExpresswayRoadType(road.roadType) &&
    (road.axis === 'x' || road.axis === 'z')
  ));
  const maxSigns = profile.id === 'downtown' || profile.id === 'economic' || profile.id === 'commercial'
    ? 2
    : profile.id === 'residential'
      ? 1
      : 2;

  for (let index = 0; index < signRoads.length && signs.length < maxSigns; index += 1) {
    const road = signRoads[index];
    if (hashNumber(chunkX, chunkZ, 970 + index) < getDirectionalSignSkip(profile)) continue;

    const side = hashNumber(chunkX, chunkZ, 971 + index) > 0.5 ? 1 : -1;
    const position = getDirectionalSignPosition(road, side, chunkX, chunkZ, index);
    if (!position) continue;

    const destination = chooseDirectionalSignDestination(position, chunkX, chunkZ, index, profile);
    const width = destination.label.length > 7 ? 10.8 : 9.2;
    const rotationY = road.axis === 'x' ? 0 : Math.PI / 2;
    const y = 3.9;
    const sign = {
      id: `direction-sign-${chunkX}-${chunkZ}-${index}`,
      text: `${destination.label}\n${formatSignDistance(destination.distance)}`,
      position: [position.x, y, position.z],
      rotation: [0, rotationY, 0],
      scale: [width, 2.55, 0.28],
      color: destination.color
    };

    if (!isDirectionalSignClear(sign, bounds, roads, blockers)) continue;

    signs.push(sign);
  }

  return signs;
}

function getDirectionalSignSkip(profile) {
  if (profile.id === 'downtown' || profile.id === 'economic') return 0.2;
  if (profile.id === 'commercial') return 0.28;
  if (profile.id === 'oldTown') return 0.4;
  if (profile.id === 'industrial' || profile.id === 'harbor') return 0.36;
  return 0.52;
}

function getDirectionalSignPosition(road, side, chunkX, chunkZ, index) {
  if (road.axis === 'x') {
    return {
      x: clamp(
        road.centerX + (hashNumber(chunkX, chunkZ, 972 + index) - 0.5) * road.width * 0.74,
        road.minX + 34,
        road.maxX - 34
      ),
      z: road.centerZ + side * (road.depth / 2 + 26)
    };
  }

  if (road.axis === 'z') {
    return {
      x: road.centerX + side * (road.width / 2 + 26),
      z: clamp(
        road.centerZ + (hashNumber(chunkX, chunkZ, 973 + index) - 0.5) * road.depth * 0.74,
        road.minZ + 34,
        road.maxZ - 34
      )
    };
  }

  return null;
}

function chooseDirectionalSignDestination(position, chunkX, chunkZ, index, profile) {
  const destinations = getDirectionalSignDestinations();
  const sorted = destinations
    .map((destination) => ({
      ...destination,
      distance: Math.hypot(destination.position.x - position.x, destination.position.z - position.z)
    }))
    .sort((a, b) => a.distance - b.distance);

  if (profile.id === 'downtown' || profile.id === 'economic') {
    const roll = hashNumber(chunkX, chunkZ, 974 + index);
    return sorted[Math.floor(roll * Math.min(3, sorted.length))] ?? sorted[0];
  }

  if (profile.id === 'harbor' || profile.id === 'industrial') {
    return sorted.find((destination) => destination.id === 'airport' || destination.id === 'toll') ?? sorted[0];
  }

  const roll = hashNumber(chunkX, chunkZ, 975 + index);
  return sorted[Math.floor(roll * Math.min(4, sorted.length))] ?? sorted[0];
}

function getDirectionalSignDestinations() {
  const [downtownX, , downtownZ] = WORLD_SETTINGS.teleportAnchors.downtown.position;
  const toll = TRANSPORT_HIGHWAY.tolls[0];

  return [
    {
      id: 'airport',
      label: 'AIRPORT',
      color: '#2f6e95',
      position: TRANSPORT_HUBS.airport.gate
    },
    {
      id: 'station',
      label: 'STATION',
      color: '#2f6e95',
      position: TRANSPORT_HUBS.trainStation.gate
    },
    {
      id: 'toll',
      label: 'TOLL',
      color: '#6f8f4d',
      position: toll?.point ?? TRANSPORT_HIGHWAY.points[0]
    },
    {
      id: 'downtown',
      label: 'DOWNTOWN',
      color: '#2d7050',
      position: { x: downtownX, z: downtownZ }
    }
  ];
}

function formatSignDistance(distance) {
  if (!Number.isFinite(distance)) return 'AHEAD';
  if (distance < 900) return `${Math.max(1, Math.round(distance / 100) * 100)}M`;
  return `${(distance / 1000).toFixed(1)}KM`;
}

function isDirectionalSignClear(sign, bounds, roads, blockers) {
  const [x, , z] = sign.position;
  const [width = 9, , depth = 0.28] = sign.scale;
  const boxWidth = sign.rotation?.[1] === Math.PI / 2 ? depth + 1.4 : width;
  const boxDepth = sign.rotation?.[1] === Math.PI / 2 ? width : depth + 1.4;

  if (!isBoxInsideChunk(x, z, boxWidth, boxDepth, bounds, 5)) return false;
  if (isBoxInsideSpawnClearZone(x, z, boxWidth, boxDepth)) return false;
  if (isPointOnAnyRoadSurface(x, z, roads, 8)) return false;
  return isBoxClearOfColliders(x, z, boxWidth, boxDepth, blockers, 2);
}

function generateDistrictProps(bounds, roads, blockers, chunkX, chunkZ, districtProfile = null) {
  const trafficObstacles = [];
  const colliders = [];
  const profile = districtProfile ?? DISTRICT_PROFILES.commercial;

  if ((profile.propCount ?? 0) <= 0) {
    return { colliders, trafficObstacles };
  }

  const candidateRoads = roads.filter((road) => (
    road.marked &&
    road.roadType !== 'parking' &&
    !isElevatedBridgeRoad(road) &&
    !isExpresswayRoadType(road.roadType)
  ));
  const maxCount = Math.min(profile.propCount ?? 4, Math.max(2, candidateRoads.length * 2));

  for (let index = 0; index < maxCount; index += 1) {
    const road = candidateRoads[index % Math.max(1, candidateRoads.length)];
    const anchor = road
      ? getDistrictPropRoadAnchor(road, chunkX, chunkZ, index)
      : {
          x: bounds.centerX + (hashNumber(chunkX, chunkZ, 951 + index) - 0.5) * bounds.size * 0.66,
          z: bounds.centerZ + (hashNumber(chunkX, chunkZ, 952 + index) - 0.5) * bounds.size * 0.66,
          rotationY: hashNumber(chunkX, chunkZ, 953 + index) > 0.5 ? 0 : Math.PI / 2
        };

    const dimensions = getDistrictPropDimensions(profile, chunkX, chunkZ, index);
    const color = getDistrictPropColor(profile, chunkX, chunkZ, index);

    addDistrictBoxProp(
      trafficObstacles,
      colliders,
      bounds,
      blockers,
      anchor.x,
      anchor.z,
      dimensions.width,
      dimensions.height,
      dimensions.depth,
      color,
      anchor.rotationY,
      `district-prop-${chunkX}-${chunkZ}-${index}`
    );
  }

  return { colliders, trafficObstacles };
}

function getDistrictPropDimensions(profile, chunkX, chunkZ, index) {
  if (profile.id === 'industrial' || profile.id === 'harbor') {
    const isContainer = profile.id === 'harbor' || hashNumber(chunkX, chunkZ, 954 + index) > 0.38;

    return {
      width: isContainer ? 9 + hashNumber(chunkX, chunkZ, 955 + index) * 6 : 12 + hashNumber(chunkX, chunkZ, 956 + index) * 12,
      depth: isContainer ? 3.4 + hashNumber(chunkX, chunkZ, 957 + index) * 2.2 : 8 + hashNumber(chunkX, chunkZ, 958 + index) * 10,
      height: isContainer ? 2.8 + hashNumber(chunkX, chunkZ, 959 + index) * 2.8 : 5.5 + hashNumber(chunkX, chunkZ, 960 + index) * 8
    };
  }

  if (profile.id === 'economic') {
    return {
      width: 4.5 + hashNumber(chunkX, chunkZ, 955 + index) * 7,
      depth: 3.2 + hashNumber(chunkX, chunkZ, 957 + index) * 5,
      height: 1.2 + hashNumber(chunkX, chunkZ, 959 + index) * 4.8
    };
  }

  if (profile.id === 'residential') {
    return {
      width: 4 + hashNumber(chunkX, chunkZ, 955 + index) * 8,
      depth: 3 + hashNumber(chunkX, chunkZ, 957 + index) * 6,
      height: 0.7 + hashNumber(chunkX, chunkZ, 959 + index) * 1.8
    };
  }

  if (profile.id === 'oldTown') {
    return {
      width: 4.5 + hashNumber(chunkX, chunkZ, 955 + index) * 7,
      depth: 2.8 + hashNumber(chunkX, chunkZ, 957 + index) * 4.4,
      height: 1.8 + hashNumber(chunkX, chunkZ, 959 + index) * 2.8
    };
  }

  return {
    width: 5 + hashNumber(chunkX, chunkZ, 955 + index) * 8,
    depth: 3.5 + hashNumber(chunkX, chunkZ, 957 + index) * 5.5,
    height: 1.2 + hashNumber(chunkX, chunkZ, 959 + index) * 3.2
  };
}

function getDistrictPropRoadAnchor(road, chunkX, chunkZ, index) {
  const side = hashNumber(chunkX, chunkZ, 961 + index) > 0.5 ? 1 : -1;

  if (road.axis === 'x') {
    return {
      x: clamp(
        road.centerX + (hashNumber(chunkX, chunkZ, 962 + index) - 0.5) * road.width * 0.72,
        road.minX + 24,
        road.maxX - 24
      ),
      z: road.centerZ + side * (road.depth / 2 + 46 + hashNumber(chunkX, chunkZ, 963 + index) * 26),
      rotationY: Math.PI / 2
    };
  }

  if (road.axis === 'z') {
    return {
      x: road.centerX + side * (road.width / 2 + 46 + hashNumber(chunkX, chunkZ, 964 + index) * 26),
      z: clamp(
        road.centerZ + (hashNumber(chunkX, chunkZ, 965 + index) - 0.5) * road.depth * 0.72,
        road.minZ + 24,
        road.maxZ - 24
      ),
      rotationY: 0
    };
  }

  return {
    x: road.centerX,
    z: road.centerZ,
    rotationY: 0
  };
}

function getDistrictPropColor(profile, chunkX, chunkZ, index) {
  const palette = profile.id === 'harbor'
    ? ['#75b7d8', '#e36d5c', '#d1bb78', '#7898a8']
    : profile.id === 'industrial'
      ? ['#c28f69', '#7898a8', '#a3aa78', '#d1bb78', '#6f8490']
      : profile.id === 'economic'
        ? ['#75b7d8', '#d9d3ff', '#cfd4ca', '#9fd08c']
        : profile.id === 'residential'
          ? ['#9fd08c', '#a3aa78', '#d1bb78', '#cfd4ca']
          : profile.id === 'oldTown'
            ? ['#c28f69', '#d1bb78', '#a3aa78', '#cfd4ca']
            : ['#c28f69', '#7898a8', '#a3aa78', '#d1bb78'];

  return palette[Math.floor(hashNumber(chunkX, chunkZ, 966 + index) * palette.length)];
}

function addDistrictBoxProp(trafficObstacles, colliders, bounds, blockers, x, z, width, height, depth, color, rotationY, id) {
  if (!isBoxInsideChunk(x, z, width, depth, bounds, 8)) return;
  if (isBoxInsideSpawnClearZone(x, z, width, depth)) return;
  if (!isBoxClearOfColliders(x, z, width, depth, blockers, 3)) return;
  if (!isBoxClearOfColliders(x, z, width, depth, colliders, 8)) return;

  trafficObstacles.push(createTrafficObstacle(
    id,
    x,
    z,
    0,
    width,
    height,
    depth,
    color,
    rotationY,
    { type: 'districtDetail' }
  ));
  colliders.push(createBoxCollider(`${id}-collider`, 'districtDetail', x, z, width, depth));
}

function generateGuardrails() {
  return { guardrails: [], colliders: [] };
}

function generateHighwaySafetyBarriers(roads) {
  const data = { guardrails: [], colliders: [] };

  for (const road of roads) {
    if (!shouldAddHighwaySafetyBarriers(road)) continue;

    addHighwaySideBarriers(data, road);
    addHighwayMedianBarrier(data, road);
  }

  return data;
}

function shouldAddHighwaySafetyBarriers(road) {
  if (!road?.marked) return false;
  if (road.roadType !== ROAD_TYPES.highway) return false;
  if (road.kind === 'airport-runway') return false;

  const line = getRoadCenterline(road);
  if (!line) return false;

  return Math.hypot(line.end.x - line.start.x, line.end.z - line.start.z) > 28;
}

function addHighwaySideBarriers(data, road) {
  const width = getRoadCrossWidth(road);
  const sideGapRanges = getHighwaySideBarrierGapRanges(road);

  for (const side of [-1, 1]) {
    addHighwayBarrier(data, road, {
      gaps: sideGapRanges?.[side] ?? [],
      height: HIGHWAY_SIDE_GUARDRAIL_HEIGHT,
      idSuffix: side > 0 ? 'right-side' : 'left-side',
      offset: side * (width / 2 + HIGHWAY_SIDE_GUARDRAIL_THICKNESS / 2),
      thickness: HIGHWAY_SIDE_GUARDRAIL_THICKNESS,
      type: 'highwaySideGuardrail'
    });
  }
}

function getHighwaySideBarrierGapRanges(road) {
  if (!isTransportHighwayTunnelRoad(road)) return null;

  const line = getRoadCenterline(road);
  if (!line) return null;

  return getTransportHighwayAccessWallGaps(line.start, line.end, getRoadCrossWidth(road));
}

function isTransportHighwayTunnelRoad(road) {
  if (road?.kind !== 'transport-highway') return false;
  if (road.side !== 'transport-highway-tunnel') return false;

  const y = road.surface?.y ?? road.position?.[1] ?? GROUND_DRIVE_Y;
  return Math.abs(y - TRANSPORT_HIGHWAY_TUNNEL_Y) <= 0.5;
}

function addHighwayMedianBarrier(data, road) {
  addHighwayBarrier(data, road, {
    height: HIGHWAY_MEDIAN_GUARDRAIL_HEIGHT,
    idSuffix: 'median',
    offset: 0,
    thickness: HIGHWAY_MEDIAN_GUARDRAIL_THICKNESS,
    type: 'highwayMedianGuardrail'
  });
}

function addHighwayBarrier(data, road, options) {
  const line = getRoadCenterline(road);
  if (!line) return;

  const length = Math.hypot(line.end.x - line.start.x, line.end.z - line.start.z);
  if (length <= 0.1) return;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const yRange = getRoadYRange(road);
  const minY = yRange.maxY + 0.08;
  const maxY = minY + options.height;
  const visibleRanges = getTunnelWallVisibleRanges(length, options.gaps ?? []);
  if (visibleRanges.length === 0) return;

  for (let index = 0; index < visibleRanges.length; index += 1) {
    const range = visibleRanges[index];
    const segmentLength = range.end - range.start;
    if (segmentLength <= 0.1) continue;

    const centerStart = {
      x: line.start.x + tangent.x * range.start,
      z: line.start.z + tangent.z * range.start
    };
    const centerEnd = {
      x: line.start.x + tangent.x * range.end,
      z: line.start.z + tangent.z * range.end
    };
    const start = {
      x: centerStart.x + normal.x * options.offset,
      z: centerStart.z + normal.z * options.offset
    };
    const end = {
      x: centerEnd.x + normal.x * options.offset,
      z: centerEnd.z + normal.z * options.offset
    };
    const center = midpoint(start, end);
    const rangeSuffix = (options.gaps?.length ?? 0) > 0 ? `-${index}` : '';
    const id = `${road.id}-guardrail-${options.idSuffix}${rangeSuffix}`;

    data.guardrails.push({
      id,
      position: [center.x, minY + options.height / 2, center.z],
      rotation: [0, getSegmentBoxYaw(start, end), 0],
      scale: [segmentLength, options.height, options.thickness]
    });

    const colliders = data.guardrailColliders ?? data.colliders;
    colliders.push(createHeightLimitedSegmentCollider(
      id,
      options.type,
      start,
      end,
      options.thickness,
      minY,
      maxY
    ));
  }
}

function generateTunnelEntrances(bounds, roads, roadInfo, chunkX, chunkZ) {
  const tunnelEntrances = [];
  const colliders = [];

  if (FAST_ROADS_UNDERGROUND) {
    return { tunnelEntrances, colliders };
  }

  const highway = findTunnelEntranceHighway(roads, roadInfo);

  if (!highway || hashNumber(chunkX, chunkZ, 610) < 0.68) {
    return { tunnelEntrances, colliders };
  }

  const side = hashNumber(chunkX, chunkZ, 611) > 0.5 ? 1 : -1;
  const placement = getTunnelEntrancePlacement(highway, bounds, side);
  if (!placement) return { tunnelEntrances, colliders };

  if (isBoxInsideSpawnClearZone(placement.x, placement.z, placement.width, placement.depth)) {
    return { tunnelEntrances, colliders };
  }

  const id = `tunnel-${chunkX}-${chunkZ}-${highway.axis}-${side}`;
  const portalDepth = 17;
  const wallThickness = 5.2;

  tunnelEntrances.push({
    id,
    position: [placement.x, getRoadVisualY(highway), placement.z],
    rotationY: placement.rotationY,
    width: placement.width,
    height: 14.2,
    depth: portalDepth
  });

  const pillarOffset = getRoadCrossWidth(highway) / 2 + 7;

  for (const [label, lateral] of [['a', -pillarOffset], ['b', pillarOffset]]) {
    const pillarStart = offsetPlanarPoint(placement, { x: -placement.tangent.x, z: -placement.tangent.z }, placement.normal, portalDepth / 2, lateral);
    const pillarEnd = offsetPlanarPoint(placement, placement.tangent, placement.normal, portalDepth / 2, lateral);

    colliders.push(createHeightLimitedSegmentCollider(
      `${id}-${label}`,
      'tunnelEntrance',
      pillarStart,
      pillarEnd,
      wallThickness,
      getRoadVisualY(highway),
      getRoadVisualY(highway) + 14.2
    ));
  }

  return { tunnelEntrances, colliders };
}

function findTunnelEntranceHighway(roads, roadInfo) {
  const candidates = roads.filter(isTunnelEntranceHighwayCandidate);

  if (roadInfo.hasHighway) {
    return candidates.find((road) => road.axis === 'x' || road.axis === 'z') ?? candidates[0] ?? null;
  }

  return candidates.find((road) => road.kind === 'transport-highway') ?? null;
}

function isTunnelEntranceHighwayCandidate(road) {
  if (!road || road.roadType !== ROAD_TYPES.highway) return false;
  if (road.kind === 'airport-runway') return false;
  if (road.kind === 'transport-highway-clearance') return false;

  return road.axis === 'x' || road.axis === 'z' || road.axis === 'segment';
}

function getTunnelEntrancePlacement(highway, bounds, side) {
  const line = getRoadCenterline(highway);
  if (!line) return null;

  const clipped = clipLineToBounds(line.start, line.end, bounds, 0);
  if (!clipped) return null;

  const tangent = normalizeVector({
    x: line.end.x - line.start.x,
    z: line.end.z - line.start.z
  });
  const normal = { x: -tangent.z, z: tangent.x };
  const edgeOffset = 18;
  const edgePoint = side > 0 ? clipped.end : clipped.start;
  const inward = side > 0 ? -1 : 1;
  const x = edgePoint.x + tangent.x * edgeOffset * inward;
  const z = edgePoint.z + tangent.z * edgeOffset * inward;
  const roadWidth = getRoadCrossWidth(highway);

  return {
    x,
    z,
    depth: 17,
    normal,
    rotationY: Math.atan2(tangent.x, tangent.z),
    tangent,
    width: roadWidth + 18
  };
}

function generateSafeSpawnPoints(
  bounds,
  roads,
  roadColliders,
  colliders,
  chunkX,
  chunkZ,
  { includeOpenAreas = true } = {}
) {
  const points = [];
  const usedPositions = new Set();

  const addPoint = (x, z, source, heading) => {
    if (points.length >= SAFE_POINT_MAX_COUNT) return;
    if (!isSafePointInsideChunk(x, z, bounds)) return;
    if (!isPointClearOfColliders(x, z, SAFE_POINT_CLEARANCE, colliders)) return;

    const pointX = roundCoord(x);
    const pointZ = roundCoord(z);
    const positionKey = `${pointX}:${pointZ}`;

    if (usedPositions.has(positionKey)) return;

    usedPositions.add(positionKey);
    points.push({
      id: `safe-${chunkX}-${chunkZ}-${points.length}`,
      chunkX,
      chunkZ,
      source,
      position: { x: pointX, y: SAFE_POINT_Y, z: pointZ },
      heading
    });
  };

  for (const road of roads) {
    addRoadSafePoints(addPoint, road, sourceForRoad(road));
  }

  if (includeOpenAreas) {
    addOpenAreaSafePoints(addPoint, bounds, roadColliders, chunkX, chunkZ);
  }

  if (points.length < SAFE_POINT_MIN_COUNT) {
    for (const road of roads) {
      if (isExpresswayRoadType(road.roadType)) continue;

      addPoint(road.centerX, road.centerZ, 'road', getRoadHeading(road));

      if (points.length >= SAFE_POINT_MIN_COUNT) break;
    }
  }

  return points;
}

function addRoadSafePoints(addPoint, road, source) {
  if (isExpresswayRoadType(road.roadType)) return;

  addPoint(road.centerX, road.centerZ, source, getRoadHeading(road));

  const spacing = 90;

  if (road.axis === 'x') {
    const start = Math.ceil((road.minX + SAFE_POINT_CLEARANCE) / spacing);
    const end = Math.floor((road.maxX - SAFE_POINT_CLEARANCE) / spacing);

    for (let index = start; index <= end; index += 1) {
      addPoint(index * spacing, road.centerZ, source, getRoadHeading(road));
    }
  }

  if (road.axis === 'z') {
    const start = Math.ceil((road.minZ + SAFE_POINT_CLEARANCE) / spacing);
    const end = Math.floor((road.maxZ - SAFE_POINT_CLEARANCE) / spacing);

    for (let index = start; index <= end; index += 1) {
      addPoint(road.centerX, index * spacing, source, getRoadHeading(road));
    }
  }

  if (road.axis === 'segment') {
    const length = Math.max(road.length ?? 0, 0);
    const tangent = normalizeVector({
      x: road.endX - road.startX,
      z: road.endZ - road.startZ
    });
    const start = Math.ceil(SAFE_POINT_CLEARANCE / spacing);
    const end = Math.floor((length - SAFE_POINT_CLEARANCE) / spacing);

    for (let index = start; index <= end; index += 1) {
      const distance = index * spacing;
      addPoint(
        road.startX + tangent.x * distance,
        road.startZ + tangent.z * distance,
        source,
        getRoadHeading(road)
      );
    }
  }
}

function addOpenAreaSafePoints(addPoint, bounds, roadColliders, chunkX, chunkZ) {
  const spacing = 120;
  const padding = 58;
  const startX = Math.ceil((bounds.minX + padding) / spacing);
  const endX = Math.floor((bounds.maxX - padding) / spacing);
  const startZ = Math.ceil((bounds.minZ + padding) / spacing);
  const endZ = Math.floor((bounds.maxZ - padding) / spacing);

  for (let gx = startX; gx <= endX; gx += 1) {
    for (let gz = startZ; gz <= endZ; gz += 1) {
      const x = gx * spacing + (hashNumber(gx, gz, chunkX + 121) - 0.5) * 28;
      const z = gz * spacing + (hashNumber(gx, gz, chunkZ + 131) - 0.5) * 28;

      if (isPointOnAnyRoad(x, z, roadColliders, WORLD_SETTINGS.roadWidth)) continue;

      addPoint(x, z, 'open', hashNumber(gx, gz, 141) > 0.5 ? 0 : Math.PI);
    }
  }
}

function isTeleportPositionSafeInChunk(position, chunk) {
  if (!isSafePointInsideChunk(position.x, position.z, chunk.bounds)) return false;
  const driveSurface = getDriveSurfaceAtPosition(position, chunk.driveSurfaces);

  if (isExpresswayOnlyTeleportSurface(driveSurface)) {
    return false;
  }

  if (chunk.terrainType === 'ocean' && !getDriveSurfaceAtPosition(position, chunk.driveSurfaces)) {
    return false;
  }
  if (
    chunk.terrainType === 'island' &&
    !getDriveSurfaceAtPosition(position, chunk.driveSurfaces) &&
    !isPointInsideIsland(position.x, position.z, chunk.islands)
  ) {
    return false;
  }

  return isPointClearOfColliders(position.x, position.z, SAFE_POINT_CLEARANCE, chunk.colliders);
}

function isExpresswayOnlyTeleportSurface(surface) {
  if (!surface) return false;
  if (surface.roadType === ROAD_TYPES.elevatedHighway) return true;
  return surface.roadType === ROAD_TYPES.ramp && surface.y > SAFE_POINT_Y + 1.2;
}

function getHeadingAtPosition(position, chunk, requestedHeading) {
  if (Number.isFinite(requestedHeading)) return requestedHeading;

  const surface = getDriveSurfaceAtPosition(position, chunk.driveSurfaces);
  if (surface?.axis === 'x') return Math.PI / 2;
  if (surface?.axis === 'z') return 0;

  const road = chunk.roads.find((item) => isPointInsideCollider(position.x, position.z, item));
  return road ? getRoadHeading(road) : WORLD_SETTINGS.teleportAnchors.downtown.heading;
}

function getDriveSurfaceAtPosition(position, driveSurfaces) {
  let best = null;

  for (const surface of driveSurfaces) {
    const y = getDriveSurfaceY(surface, position.x, position.z);

    if (!Number.isFinite(y)) continue;
    if (!best || Math.abs(y - position.y) < Math.abs(best.y - position.y)) {
      best = { ...surface, y };
    }
  }

  return best;
}

function getDriveSurfaceY(surface, x, z) {
  if (surface.shape === 'circle') {
    const dx = x - surface.centerX;
    const dz = z - surface.centerZ;

    return dx * dx + dz * dz <= surface.radius * surface.radius
      ? surface.y
      : Number.NaN;
  }

  if (
    x < surface.minX ||
    x > surface.maxX ||
    z < surface.minZ ||
    z > surface.maxZ
  ) {
    return Number.NaN;
  }

  if (surface.shape === 'segment') {
    const projection = projectPointToSegment(x, z, surface.startX, surface.startZ, surface.endX, surface.endZ);
    if (!projection) return Number.NaN;

    const dx = surface.endX - surface.startX;
    const dz = surface.endZ - surface.startZ;
    const length = Math.max(Math.hypot(dx, dz), 0.0001);
    const lateral = Math.abs((x - surface.startX) * (-dz / length) + (z - surface.startZ) * (dx / length));

    return lateral <= surface.width / 2 ? surface.y : Number.NaN;
  }

  if (surface.shape !== 'ramp') {
    return surface.y;
  }

  const dx = surface.endX - surface.startX;
  const dz = surface.endZ - surface.startZ;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0) return Number.NaN;

  const t = ((x - surface.startX) * dx + (z - surface.startZ) * dz) / lengthSq;
  if (t < 0 || t > 1) return Number.NaN;

  const length = Math.sqrt(lengthSq);
  const lateral = Math.abs((x - surface.startX) * (-dz / length) + (z - surface.startZ) * (dx / length));

  if (lateral > surface.width / 2) return Number.NaN;

  return lerp(surface.startY, surface.endY, t);
}

function isPointInsideIsland(x, z, islands) {
  return islands.some((island) => {
    const dx = x - island.position[0];
    const dz = z - island.position[2];

    return dx * dx + dz * dz <= island.radius * island.radius;
  });
}

function getRoadHeading(road) {
  if (road.axis === 'x') {
    return road.side === 'west' ? -Math.PI / 2 : Math.PI / 2;
  }

  if (road.axis === 'z') {
    return road.side === 'north' ? Math.PI : 0;
  }

  if (road.axis === 'segment' && Number.isFinite(road.startX) && Number.isFinite(road.endX)) {
    return Math.atan2(road.endX - road.startX, road.endZ - road.startZ);
  }

  return WORLD_SETTINGS.teleportAnchors.downtown.heading;
}

function sourceForRoad(road) {
  if (road.roadType === 'parking') return 'parking';
  if (road.roadType === 'highway') return 'highway';
  if (isExpresswayRoadType(road.roadType)) return 'expressway';
  if (road.roadType === 'local') return 'local-road';
  return road.kind === 'intersection' ? 'road-intersection' : 'road';
}

function isExpresswayRoadType(roadType) {
  return roadType === ROAD_TYPES.elevatedHighway || roadType === ROAD_TYPES.ramp;
}

function normalizeTargetPosition(position) {
  const fallback = WORLD_SETTINGS.teleportAnchors.downtown.position;
  const x = readPositionValue(position, 'x', 0, fallback[0]);
  const y = readPositionValue(position, 'y', 1, fallback[1]);
  const z = readPositionValue(position, 'z', 2, fallback[2]);
  const heading = readPositionValue(position, 'heading', 3, Number.NaN);

  return {
    x: clamp(x, WORLD_SETTINGS.worldMinX, WORLD_SETTINGS.worldMaxX),
    y: Number.isFinite(y) ? y : SAFE_POINT_Y,
    z: clamp(z, WORLD_SETTINGS.worldMinZ, WORLD_SETTINGS.worldMaxZ),
    heading
  };
}

function readPositionValue(position, key, index, fallback) {
  if (Array.isArray(position)) {
    return Number.isFinite(position[index]) ? position[index] : fallback;
  }

  if (position && Number.isFinite(position[key])) {
    return position[key];
  }

  return fallback;
}

function getChunkCoordsInRadius(centerChunk, radius) {
  const coords = [];

  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;

      const chunkX = centerChunk.chunkX + dx;
      const chunkZ = centerChunk.chunkZ + dz;

      if (isChunkCoordInsideWorld(chunkX, chunkZ)) {
        coords.push({ chunkX, chunkZ });
      }
    }
  }

  return coords;
}

function cloneSafePoint(point) {
  return {
    ...point,
    position: { ...point.position }
  };
}

function isSafePointInsideChunk(x, z, bounds) {
  return (
    x >= bounds.minX + SAFE_POINT_CLEARANCE &&
    x <= bounds.maxX - SAFE_POINT_CLEARANCE &&
    z >= bounds.minZ + SAFE_POINT_CLEARANCE &&
    z <= bounds.maxZ - SAFE_POINT_CLEARANCE
  );
}

function isPointClearOfColliders(x, z, radius, colliders) {
  return colliders.every((collider) => !doesCircleOverlapCollider(x, z, radius, collider));
}

function doesCircleOverlapCollider(x, z, radius, collider) {
  if (collider.shape === 'segment') {
    const hit = getCircleSegmentOverlap(
      x,
      z,
      radius,
      collider.startX,
      collider.startZ,
      collider.endX,
      collider.endZ,
      collider.width / 2
    );

    return Boolean(hit);
  }

  const closestX = clamp(x, collider.minX, collider.maxX);
  const closestZ = clamp(z, collider.minZ, collider.maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;

  return dx * dx + dz * dz < radius * radius;
}

function isPointOnAnyRoad(x, z, roadColliders, margin = 0) {
  return roadColliders.some((collider) => isPointInsideCollider(x, z, collider, margin));
}

function isPointInsideCollider(x, z, collider, margin = 0) {
  if (collider.shape === 'segment') {
    return Boolean(getCircleSegmentOverlap(
      x,
      z,
      0,
      collider.startX,
      collider.startZ,
      collider.endX,
      collider.endZ,
      collider.width / 2 + margin
    ));
  }

  return (
    x >= collider.minX - margin &&
    x <= collider.maxX + margin &&
    z >= collider.minZ - margin &&
    z <= collider.maxZ + margin
  );
}

function isBoxInsideSpawnClearZone(x, z, width = 0, depth = 0) {
  const [spawnX, , spawnZ] = WORLD_SETTINGS.teleportAnchors.downtown.position;
  const heading = WORLD_SETTINGS.teleportAnchors.downtown.heading;
  const dx = x - spawnX;
  const dz = z - spawnZ;
  const expandedWidth = width / 2;
  const expandedDepth = depth / 2;
  const outsideX = Math.max(0, Math.abs(dx) - expandedWidth);
  const outsideZ = Math.max(0, Math.abs(dz) - expandedDepth);

  if (outsideX * outsideX + outsideZ * outsideZ <= SPAWN_CLEAR_RADIUS * SPAWN_CLEAR_RADIUS) {
    return true;
  }

  const forwardX = Math.sin(heading);
  const forwardZ = Math.cos(heading);
  const sideX = Math.cos(heading);
  const sideZ = -Math.sin(heading);
  const forwardDistance = dx * forwardX + dz * forwardZ;
  const sideDistance = Math.abs(dx * sideX + dz * sideZ);
  const objectRadius = Math.max(expandedWidth, expandedDepth);

  return (
    forwardDistance >= -SPAWN_VIEW_REAR_CLEAR_DISTANCE - objectRadius &&
    forwardDistance <= SPAWN_VIEW_CLEAR_DISTANCE + objectRadius &&
    sideDistance <= SPAWN_VIEW_CLEAR_HALF_WIDTH + objectRadius
  );
}

function roundCoord(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getDesiredConnections(chunkX, chunkZ) {
  const seed = getChunkSeed(chunkX, chunkZ);

  return normalizeDesiredConnections(makeConnections(ROAD_SIDES), chunkX, chunkZ, seed);
}

function normalizeDesiredConnections(connections, chunkX, chunkZ, seed) {
  const normalized = { ...connections };

  for (const side of ROAD_SIDES) {
    if (!hasNeighborForSide(chunkX, chunkZ, side)) {
      normalized[side] = false;
    }
  }

  if (countConnections(normalized) >= 2) {
    return normalized;
  }

  for (const side of getRotatedSides(seed)) {
    if (hasNeighborForSide(chunkX, chunkZ, side)) {
      normalized[side] = true;
    }

    if (countConnections(normalized) >= 2) break;
  }

  return normalized;
}

function getAlignedConnections(chunkX, chunkZ) {
  const own = getDesiredConnections(chunkX, chunkZ);
  const connections = makeConnections([]);

  for (const side of ROAD_SIDES) {
    const neighbor = getNeighborChunkCoord(chunkX, chunkZ, side);

    if (!neighbor || !canChunkHaveProceduralRoads(neighbor.chunkX, neighbor.chunkZ)) {
      connections[side] = false;
      continue;
    }

    const neighborDesired = getDesiredConnections(neighbor.chunkX, neighbor.chunkZ);
    connections[side] = own[side] || neighborDesired[OPPOSITE_SIDE[side]];
  }

  return enforceMinimumGroundConnections(connections, chunkX, chunkZ);
}

function enforceMinimumGroundConnections(connections, chunkX, chunkZ) {
  const normalized = { ...connections };

  if (countConnections(normalized) >= 2) {
    return normalized;
  }

  for (const side of getRotatedSides(getChunkSeed(chunkX, chunkZ) + 17)) {
    if (normalized[side] || !hasNeighborForSide(chunkX, chunkZ, side)) continue;

    normalized[side] = true;

    if (countConnections(normalized) >= 2) break;
  }

  return normalized;
}

function getRoadType(connections) {
  const activeSides = ROAD_SIDES.filter((side) => connections[side]);

  if (activeSides.length >= 4) return 'cross';
  if (activeSides.length === 3) return 't';

  if (activeSides.length === 2) {
    const [a, b] = activeSides;
    return OPPOSITE_SIDE[a] === b ? 'straight' : 'turn';
  }

  return activeSides.length === 1 ? 'straight' : 'empty';
}

function getHighwayAxes(chunkX, chunkZ) {
  return [];
}

function isMainRoadSide(chunkX, chunkZ, side) {
  if (chunkX === 0 && chunkZ === 0) return true;

  if (side === 'east' || side === 'west') {
    return Math.abs(chunkZ) % 3 === 0 || hashNumber(chunkX, chunkZ, 621) > 0.72;
  }

  return Math.abs(chunkX) % 3 === 0 || hashNumber(chunkX, chunkZ, 622) > 0.72;
}

function getRoadWidth(roadType) {
  return (ROAD_PROFILES[roadType] ?? ROAD_PROFILES.main).width;
}

function getDistrictRoadWidth(roadType, districtProfile = DISTRICT_PROFILES.commercial) {
  const baseWidth = getRoadWidth(roadType);
  const multiplier = districtProfile?.roadWidthMultiplier?.[roadType] ??
    districtProfile?.roadWidthMultiplier?.[ROAD_TYPES[roadType]] ??
    1;

  return baseWidth * multiplier;
}

function getRoadY(roadType, kind) {
  const baseY = ROAD_RENDER_Y[roadType] ?? 0.046;

  return kind === 'intersection' ? Math.max(baseY, 0.05) : baseY;
}

function axisForSide(side) {
  return side === 'east' || side === 'west' ? 'x' : 'z';
}

function getRoadEdgePoint(bounds, side) {
  if (side === 'north') return { x: bounds.centerX, z: bounds.minZ };
  if (side === 'east') return { x: bounds.maxX, z: bounds.centerZ };
  if (side === 'south') return { x: bounds.centerX, z: bounds.maxZ };
  return { x: bounds.minX, z: bounds.centerZ };
}

function getNeighborChunkCoord(chunkX, chunkZ, side) {
  const offset = SIDE_OFFSETS[side];
  const neighbor = {
    chunkX: chunkX + offset.chunkX,
    chunkZ: chunkZ + offset.chunkZ
  };

  return isChunkCoordInsideWorld(neighbor.chunkX, neighbor.chunkZ) ? neighbor : null;
}

function hasNeighborForSide(chunkX, chunkZ, side) {
  const neighbor = getNeighborChunkCoord(chunkX, chunkZ, side);

  return Boolean(neighbor && canChunkHaveProceduralRoads(neighbor.chunkX, neighbor.chunkZ));
}

function canChunkHaveProceduralRoads(chunkX, chunkZ) {
  return !isOceanCrossingChunk(chunkX, chunkZ) &&
    !isHarborIslandChunk(chunkX, chunkZ) &&
    !isTransportHubChunk(chunkX, chunkZ);
}

function makeConnections(sides) {
  return ROAD_SIDES.reduce((connections, side) => {
    connections[side] = sides.includes(side);
    return connections;
  }, {});
}

function countConnections(connections) {
  return ROAD_SIDES.reduce((count, side) => count + Number(Boolean(connections[side])), 0);
}

function getRotatedSides(seed) {
  const offset = seed % ROAD_SIDES.length;
  return [...ROAD_SIDES.slice(offset), ...ROAD_SIDES.slice(0, offset)];
}

function createBoxCollider(id, type, x, z, width, depth) {
  return {
    id,
    type,
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
    centerX: x,
    centerZ: z,
    width,
    depth
  };
}

function createRoadCollider(road) {
  if (
    road?.axis === 'segment' &&
    Number.isFinite(road.startX) &&
    Number.isFinite(road.startZ) &&
    Number.isFinite(road.endX) &&
    Number.isFinite(road.endZ)
  ) {
    const width = road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth);

    return createSegmentCollider(
      road.id,
      road.roadType,
      { x: road.startX, z: road.startZ },
      { x: road.endX, z: road.endZ },
      width
    );
  }

  return createBoxCollider(road.id, road.roadType, road.centerX, road.centerZ, road.width, road.depth);
}

function createSegmentCollider(id, type, start, end, width) {
  const bounds = getSegmentBounds(start, end, width);

  return {
    id,
    type,
    shape: 'segment',
    startX: start.x,
    startZ: start.z,
    endX: end.x,
    endZ: end.z,
    width,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ,
    centerX: bounds.centerX,
    centerZ: bounds.centerZ
  };
}

function createHeightLimitedBoxCollider(id, type, x, z, width, depth, minY, maxY) {
  return {
    ...createBoxCollider(id, type, x, z, width, depth),
    minY,
    maxY
  };
}

function createHeightLimitedSegmentCollider(id, type, start, end, width, minY, maxY) {
  return {
    ...createSegmentCollider(id, type, start, end, width),
    minY,
    maxY
  };
}

function isInsideChunk(x, z, bounds) {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

function isBoxInsideChunk(x, z, width, depth, bounds, padding = 0) {
  return (
    x - width / 2 >= bounds.minX + padding &&
    x + width / 2 <= bounds.maxX - padding &&
    z - depth / 2 >= bounds.minZ + padding &&
    z + depth / 2 <= bounds.maxZ - padding
  );
}

function isBoxOverlappingChunk(x, z, width, depth, bounds, padding = 0) {
  return (
    x + width / 2 >= bounds.minX - padding &&
    x - width / 2 <= bounds.maxX + padding &&
    z + depth / 2 >= bounds.minZ - padding &&
    z - depth / 2 <= bounds.maxZ + padding
  );
}

function isBoxClearOfColliders(x, z, width, depth, colliders, margin = 0) {
  const box = createLooseBox(x, z, width, depth, margin);

  return colliders.every((collider) => !doesBoxOverlapCollider(box, collider));
}

function createLooseBox(x, z, width, depth, margin = 0) {
  return {
    minX: x - width / 2 - margin,
    maxX: x + width / 2 + margin,
    minZ: z - depth / 2 - margin,
    maxZ: z + depth / 2 + margin
  };
}

function doBoxesOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function doesBoxOverlapCollider(box, collider) {
  if (collider.shape === 'segment') {
    const halfWidth = (collider.width ?? 0) / 2;

    return getBoxSegmentDistanceSq(box, {
      x: collider.startX,
      z: collider.startZ
    }, {
      x: collider.endX,
      z: collider.endZ
    }) <= halfWidth * halfWidth;
  }

  return doBoxesOverlap(box, collider);
}

function doesBoxOverlapRoadSurface(box, road) {
  const surface = road?.surface;

  if (surface?.shape === 'circle') {
    const closestX = clamp(surface.centerX, box.minX, box.maxX);
    const closestZ = clamp(surface.centerZ, box.minZ, box.maxZ);
    const dx = surface.centerX - closestX;
    const dz = surface.centerZ - closestZ;

    return dx * dx + dz * dz <= surface.radius * surface.radius;
  }

  if (surface?.shape === 'segment' || surface?.shape === 'ramp') {
    const halfWidth = (surface.width ?? road.visualScale?.[1] ?? road.width ?? 0) / 2;

    return getBoxSegmentDistanceSq(box, {
      x: surface.startX,
      z: surface.startZ
    }, {
      x: surface.endX,
      z: surface.endZ
    }) <= halfWidth * halfWidth;
  }

  if (road?.axis === 'segment' && Number.isFinite(road.startX) && Number.isFinite(road.endX)) {
    const halfWidth = (road.surface?.width ?? road.visualScale?.[1] ?? Math.min(road.width, road.depth)) / 2;

    return getBoxSegmentDistanceSq(box, {
      x: road.startX,
      z: road.startZ
    }, {
      x: road.endX,
      z: road.endZ
    }) <= halfWidth * halfWidth;
  }

  return doBoxesOverlap(box, road);
}

function doBoundsOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function sortChunks(chunks) {
  return chunks.sort((a, b) => a.chunkZ - b.chunkZ || a.chunkX - b.chunkX);
}

function getChunkSeed(chunkX, chunkZ) {
  return Math.floor(hashNumber(chunkX, chunkZ, 911) * 1000000000);
}

function hashNumber(x, z, salt) {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
