import { getChunkData } from '../client/src/features/world/ChunkManager.js';
import { createChunkBatches } from '../client/src/features/world/batches/createChunkBatches.js';
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
const maxMetroPierSpan = 300;
const maxUnsupportedMetroRoadSpan = 360;
const metroTrainHalfLengthForPlatformStop = 57;
const minGroundRoadRenderY = 0.035;
const minMetroTerrainTunnelClearance = 36;
const minAirportMetroRoadClearance = 4.6;
const minAirportMetroLineVerticalGap = 4.8;
const metroTerrainTunnelTargets = [
  { landformId: 'scenic-drive-mountain', lineId: 'red' },
  { landformId: 'east-mountain-a', lineId: 'blue' }
];

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
const buildings = chunks.flatMap((chunk) => (
  (chunk.buildings ?? []).map((building) => ({ ...building, chunkKey: chunk.key }))
));
const trafficVehicles = chunks.flatMap((chunk) => chunk.trafficVehicles ?? []);
const laneMarks = chunks.flatMap((chunk) => (
  (chunk.laneMarks ?? []).map((mark) => ({ ...mark, chunkKey: chunk.key }))
));
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

const lowGroundRenderRoads = roads.filter((road) => (
  isGroundRenderedRoad(road) &&
  (road.position?.[1] ?? 0) < minGroundRoadRenderY
));
if (lowGroundRenderRoads.length > 0) {
  errors.push({
    type: 'ground-road-render-y-too-low',
    count: lowGroundRenderRoads.length,
    samples: lowGroundRenderRoads.slice(0, 8).map((road) => ({
      chunk: road.chunkKey,
      road: road.id,
      roadType: road.roadType,
      y: round(road.position?.[1] ?? 0)
    }))
  });
}

const currentRenderChunk = chunks.find((chunk) => chunk.key === '0:0') ?? chunks[0];
const remoteGroundMarkChunk = chunks.find((chunk) => (
  chunk.key !== currentRenderChunk?.key &&
  (chunk.laneMarks ?? []).some(isGroundSurfaceLaneMark)
));
if (!currentRenderChunk || !remoteGroundMarkChunk) {
  errors.push({ type: 'ground-road-lane-mark-render-test-missing-chunk' });
} else {
  const batches = createChunkBatches([currentRenderChunk, remoteGroundMarkChunk], currentRenderChunk.key);
  const renderedLaneMarkCount = batches.laneMarks.length + batches.laneMarksYellow.length;
  const expectedLaneMarkCount = (currentRenderChunk.laneMarks?.length ?? 0) + (remoteGroundMarkChunk.laneMarks?.length ?? 0);

  if (renderedLaneMarkCount < expectedLaneMarkCount) {
    errors.push({
      type: 'remote-ground-road-lane-marks-filtered',
      currentChunk: currentRenderChunk.key,
      remoteChunk: remoteGroundMarkChunk.key,
      renderedLaneMarkCount,
      expectedLaneMarkCount
    });
  }
}

const currentRoadDetailChunk = chunks.find((chunk) => hasRoadPaintDetails(chunk)) ?? currentRenderChunk;
const remoteRoadDetailChunk = chunks.find((chunk) => (
  chunk.key !== currentRoadDetailChunk?.key &&
  hasRoadPaintDetails(chunk)
));
if (!currentRoadDetailChunk || !remoteRoadDetailChunk) {
  errors.push({ type: 'remote-road-paint-render-test-missing-chunk' });
} else {
  const batches = createChunkBatches([currentRoadDetailChunk, remoteRoadDetailChunk], currentRoadDetailChunk.key);
  const expectedCrosswalks = (currentRoadDetailChunk.roadDetails?.crosswalks?.length ?? 0) +
    (remoteRoadDetailChunk.roadDetails?.crosswalks?.length ?? 0);
  const expectedStopBars = (currentRoadDetailChunk.roadDetails?.stopBars?.length ?? 0) +
    (remoteRoadDetailChunk.roadDetails?.stopBars?.length ?? 0);

  if (batches.crosswalkMarks.length < expectedCrosswalks || batches.stopBars.length < expectedStopBars) {
    errors.push({
      type: 'remote-road-paint-filtered',
      currentChunk: currentRoadDetailChunk.key,
      remoteChunk: remoteRoadDetailChunk.key,
      renderedCrosswalks: batches.crosswalkMarks.length,
      expectedCrosswalks,
      renderedStopBars: batches.stopBars.length,
      expectedStopBars
    });
  }
}

const cutoutSkirtChunk = chunks.find((chunk) => (chunk.groundCutouts?.length ?? 0) > 0);
if (!cutoutSkirtChunk) {
  errors.push({ type: 'ground-cutout-skirt-test-missing-chunk' });
} else {
  const batches = createChunkBatches([cutoutSkirtChunk], cutoutSkirtChunk.key);
  const skirtCount = batches.tunnelWallPanels.filter((panel) => panel.color === '#556268').length;
  const expectedSkirtCount = (cutoutSkirtChunk.groundCutouts ?? [])
    .filter((cutout) => cutout.skirtWalls !== false)
    .length * 4;

  if (skirtCount < expectedSkirtCount) {
    errors.push({
      type: 'ground-cutout-skirts-missing',
      chunk: cutoutSkirtChunk.key,
      skirtCount,
      expectedSkirtCount
    });
  }
}

const surfaceTunnelAccessChunks = chunks.filter((chunk) => (
  (chunk.roads ?? []).some((road) => road.kind === 'surface-avenue-tunnel-ramp')
));
for (const chunk of surfaceTunnelAccessChunks) {
  const batches = createChunkBatches([chunk], chunk.key);
  const skirtPanels = batches.tunnelWallPanels.filter((panel) => panel.color === '#556268');
  const accessRamps = (chunk.roads ?? []).filter((road) => road.kind === 'surface-avenue-tunnel-ramp');

  for (const panel of skirtPanels) {
    const panelBox = getInstanceBox(panel);
    const blockingRamp = accessRamps.find((road) => doesBoxOverlapRoadCorridor(panelBox, road, 0.5));
    if (!blockingRamp) continue;

    errors.push({
      type: 'surface-tunnel-access-skirt-wall-blocks-ramp',
      chunk: chunk.key,
      ramp: blockingRamp.id
    });
    break;
  }
}

const intersectionPatchBoundaryMarks = laneMarks.filter((mark) => (
  String(mark.id ?? '').startsWith('patch-boundary-') &&
  isGroundSurfaceLaneMark(mark)
));
if (intersectionPatchBoundaryMarks.length === 0) {
  errors.push({ type: 'intersection-patch-boundary-marks-missing' });
}

const surfaceAvenueSixLaneMarks = laneMarks.filter((mark) => (
  String(mark.id ?? '').includes('surface-avenue-lane') ||
  String(mark.id ?? '').includes('surface-avenue-edge')
));
if (surfaceAvenueSixLaneMarks.length === 0) {
  errors.push({ type: 'surface-avenue-six-lane-marks-missing' });
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

const surfaceTunnelRampRetainingWalls = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassWall' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('ramp-wall-retaining')
));
if (surfaceTunnelRampRetainingWalls.length === 0) {
  errors.push({ type: 'surface-tunnel-ramp-retaining-walls-missing' });
}

const surfaceTunnelCutoutFloors = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassTrenchFloor' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('cutout-liner')
));
if (surfaceTunnelCutoutFloors.length === 0) {
  errors.push({ type: 'surface-tunnel-cutout-floors-missing' });
}

const surfaceTunnelMergeGuideCurbs = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'surfaceTunnelGuideMark' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('cutout-liner-merge-guide-curb')
));
if (surfaceTunnelMergeGuideCurbs.length === 0) {
  errors.push({ type: 'surface-tunnel-merge-guide-curbs-missing' });
}

const surfaceTunnelMergeSideWalls = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassWall' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('cutout-liner-merge-wall-retaining')
));
if (surfaceTunnelMergeSideWalls.length === 0) {
  errors.push({ type: 'surface-tunnel-merge-side-walls-missing' });
}

const surfaceTunnelVoidShields = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassWall' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('void-shield')
));
if (surfaceTunnelVoidShields.length === 0) {
  errors.push({ type: 'surface-tunnel-void-shields-missing' });
}

const surfaceTunnelPocketWalls = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassWall' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(obstacle.id ?? '').includes('main-pocket')
));
if (surfaceTunnelPocketWalls.length > 0) {
  errors.push({
    type: 'surface-tunnel-main-pocket-wall-leftover',
    count: surfaceTunnelPocketWalls.length,
    samples: surfaceTunnelPocketWalls.slice(0, 8).map((obstacle) => obstacle.id)
  });
}

const surfaceTunnelPocketColliders = colliders.filter((collider) => (
  collider.type === 'tunnelWall' &&
  String(collider.id ?? '').includes('surface-avenue-tunnel-access') &&
  String(collider.id ?? '').includes('main-pocket')
));
if (surfaceTunnelPocketColliders.length > 0) {
  errors.push({
    type: 'surface-tunnel-main-pocket-collider-leftover',
    count: surfaceTunnelPocketColliders.length,
    samples: surfaceTunnelPocketColliders.slice(0, 8).map((collider) => collider.id)
  });
}

const surfaceTunnelAccessRamps = roads.filter((road) => road.kind === 'surface-avenue-tunnel-ramp');
const surfaceAvenueBypassRoads = roads.filter((road) => road.kind === 'surface-avenue-bypass');
if (surfaceAvenueBypassRoads.length > 0) {
  errors.push({
    type: 'surface-avenue-bypass-leftover',
    count: surfaceAvenueBypassRoads.length,
    samples: surfaceAvenueBypassRoads.slice(0, 8).map((road) => road.id)
  });
}

const unsmoothedTunnelRampRoads = roads.filter((road) => (
  (road.kind === 'surface-avenue-tunnel-ramp' || road.kind === 'transport-highway-ramp') &&
  !String(road.id ?? '').includes('-smooth-')
));
if (unsmoothedTunnelRampRoads.length > 0) {
  errors.push({
    type: 'tunnel-ramp-not-smoothed',
    count: unsmoothedTunnelRampRoads.length,
    samples: unsmoothedTunnelRampRoads.slice(0, 8).map((road) => ({
      chunk: road.chunkKey,
      road: road.id
    }))
  });
}

const openCutDeckUndersides = trafficObstacles.filter((obstacle) => (
  String(obstacle.id ?? '').includes('overhead-deck-underside')
));
if (openCutDeckUndersides.length > 0) {
  errors.push({
    type: 'open-cut-black-deck-leftover',
    count: openCutDeckUndersides.length,
    samples: openCutDeckUndersides.slice(0, 8).map((obstacle) => ({
      chunk: obstacle.chunkKey,
      id: obstacle.id
    }))
  });
}

const fastTunnelRampFloorFills = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassTrenchFloor' &&
  String(obstacle.id ?? '').includes('-ramp-box-') &&
  String(obstacle.id ?? '').includes('-floor-fill')
));
if (fastTunnelRampFloorFills.length === 0) {
  errors.push({ type: 'fast-tunnel-ramp-floor-fills-missing' });
}

const unexpectedVisualGapRoads = roads.filter((road) => (
  Array.isArray(road.visualGaps) &&
  road.visualGaps.length > 0 &&
  road.visualGapReason !== 'fast-road-tunnel-opening'
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

const fastRoadOpeningVisualGapRoads = roads.filter((road) => (
  road.visualGapReason === 'fast-road-tunnel-opening' &&
  Array.isArray(road.visualGaps) &&
  road.visualGaps.length > 0 &&
  Array.isArray(road.renderSlices)
));
if (fastRoadOpeningVisualGapRoads.length === 0) {
  errors.push({ type: 'fast-road-opening-visual-gaps-missing' });
}

const airportAirsideRoads = roads.filter((road) => (
  road.kind === 'airport-runway' ||
  road.kind === 'airport-taxiway' ||
  road.kind === 'airport-apron' ||
  road.kind === 'airport-parking'
));
if (airportAirsideRoads.length > 0) {
  errors.push({
    type: 'airport-airside-road-leftover',
    samples: airportAirsideRoads.slice(0, 6).map((road) => road.id)
  });
}
const airportTrafficEnabledRoads = roads.filter((road) => (
  String(road.kind ?? '').startsWith('airport') &&
  !road.trafficDisabled
));
if (airportTrafficEnabledRoads.length > 0) {
  errors.push({
    type: 'airport-road-traffic-enabled',
    samples: airportTrafficEnabledRoads.slice(0, 6).map((road) => road.id)
  });
}
const airportTrafficVehicles = trafficVehicles.filter((vehicle) => String(vehicle.roadKind ?? '').startsWith('airport'));
if (airportTrafficVehicles.length > 0) {
  errors.push({
    type: 'airport-traffic-vehicle-leftover',
    samples: airportTrafficVehicles.slice(0, 6).map((vehicle) => vehicle.id)
  });
}

const airportRunways = trafficObstacles.filter((obstacle) => obstacle.type === 'airportRunway');
const airportRunwayIds = new Set(airportRunways.map((obstacle) => obstacle.id));
if (airportRunwayIds.size !== 1 || !airportRunwayIds.has('airport-runway-13-31')) {
  errors.push({
    type: 'airport-single-runway-layout-missing',
    runwayIds: [...airportRunwayIds]
  });
}
if ([...airportRunwayIds].some((id) => /18[LR]|36[LR]|09-27/.test(String(id ?? '')))) {
  errors.push({
    type: 'legacy-airport-runway-label-leftover',
    runwayIds: [...airportRunwayIds]
  });
}
const airportRunwayLines = airportRunways.map((runway) => getObstacleLongLine(runway)).filter(Boolean);
if (!airportRunwayLines.some((line) => (
  Math.abs(line.end.x - line.start.x) > 120 &&
  Math.abs(line.end.z - line.start.z) > 120
))) {
  errors.push({
    type: 'airport-runway-not-diagonal',
    samples: airportRunways.slice(0, 4).map((runway) => runway.id)
  });
}

const airportTaxiways = trafficObstacles.filter((obstacle) => obstacle.type === 'airportTaxiway');
if (airportTaxiways.length < 8) {
  errors.push({
    type: 'airport-taxiway-pavements-missing',
    count: airportTaxiways.length
  });
}
const airportFencePosts = trafficObstacles.filter((obstacle) => obstacle.type === 'airportFencePost');
const airportFenceRails = trafficObstacles.filter((obstacle) => obstacle.type === 'airportFence');
if (
  airportFencePosts.length < 24 ||
  airportFenceRails.length < 12 ||
  airportFencePosts.some((post) => Math.abs((post.scale?.[1] ?? 0) - 3) > 0.35)
) {
  errors.push({
    type: 'airport-perimeter-fence-missing',
    posts: airportFencePosts.length,
    rails: airportFenceRails.length
  });
}

const airportTerminalConcourseVisuals = trafficObstacles.filter((obstacle) => obstacle.type === 'airportTerminalConcourse');
if (airportTerminalConcourseVisuals.length < 4) {
  errors.push({
    type: 'hongqiao-airport-terminal-concourses-missing',
    count: airportTerminalConcourseVisuals.length
  });
}
const airportTerminalFootprints = [
  ...buildings
    .filter((building) => building.kind === 'airportTerminal')
    .map((building) => ({ id: building.id, box: getBuildingBox(building, 1.8) })),
  ...airportTerminalConcourseVisuals
    .map((obstacle) => ({
      id: obstacle.id,
      halfWidth: (obstacle.scale?.[2] ?? 0) / 2 + 1.8,
      line: getObstacleLongLine(obstacle)
    }))
];

const airportJetbridges = trafficObstacles.filter((obstacle) => obstacle.type === 'airportJetbridge');
if (airportJetbridges.length < 8) {
  errors.push({
    type: 'airport-jetbridges-missing',
    count: airportJetbridges.length
  });
}

const airportAircraftFuselages = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'aircraft' &&
  String(obstacle.id ?? '').startsWith('airport-plane-') &&
  String(obstacle.id ?? '').endsWith('-fuselage')
));
if (airportAircraftFuselages.length < 6) {
  errors.push({
    type: 'airport-aircraft-missing',
    count: airportAircraftFuselages.length
  });
}

const greenLineDefinition = METRO_LINE_DEFINITIONS.find((line) => line.id === 'green');
const greenAirportStationDefinition = greenLineDefinition?.stations?.find((station) => station.id === 'green-airport-transfer');
if (
  !greenLineDefinition ||
  !greenAirportStationDefinition ||
  greenLineDefinition.stations?.[0]?.id !== 'green-airport-transfer' ||
  getDistanceSq(greenLineDefinition.controlPoints?.[1], greenAirportStationDefinition.point) > 1 ||
  Math.sqrt(getDistanceSq(greenLineDefinition.controlPoints?.[0], greenAirportStationDefinition.point)) > 240
) {
  errors.push({ type: 'green-airport-station-not-route-terminal' });
}
if (
  greenAirportStationDefinition?.point &&
  Math.sqrt(getDistanceSq(greenAirportStationDefinition.point, TRANSPORT_HUBS.airport.terminalGate)) > 150
) {
  errors.push({
    type: 'green-airport-station-not-docked-to-terminal',
    distance: round(Math.sqrt(getDistanceSq(greenAirportStationDefinition.point, TRANSPORT_HUBS.airport.terminalGate)))
  });
}
if (!trafficObstacles.some((obstacle) => obstacle.type === 'airportMetroConnector')) {
  errors.push({ type: 'green-airport-terminal-connector-missing' });
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
      endpointIndex: index,
      id: road.id,
      point: endpoint.point,
      road,
      width: getRoadWidth(road),
      y: getRoadYAt(road, index)
    }))
    .filter((endpoint) => (
      Math.abs(endpoint.y - groundY) <= 0.55 &&
      isTerminalTunnelPortalEndpoint(endpoint)
    )));

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
  !String(collider.id ?? '').includes('main-pocket') &&
  !String(collider.id ?? '').includes('ramp-wall-retaining')
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

const surfaceTunnelAccessVisualWalls = trafficObstacles.filter((obstacle) => (
  obstacle.type === 'transportUnderpassWall' &&
  String(obstacle.id ?? '').includes('surface-avenue-tunnel-access') &&
  !String(obstacle.id ?? '').includes('main-pocket') &&
  !String(obstacle.id ?? '').includes('ramp-wall-retaining')
));
for (const accessRoad of surfaceTunnelAccessRoads) {
  const roadLine = getRoadLine(accessRoad);
  if (!roadLine) continue;

  const minRoadY = Math.min(getRoadYAt(accessRoad, 0), getRoadYAt(accessRoad, 1));
  const maxRoadY = Math.max(getRoadYAt(accessRoad, 0), getRoadYAt(accessRoad, 1));

  for (const wall of surfaceTunnelAccessVisualWalls) {
    if (!doesObstacleOverlapYRange(wall, minRoadY, maxRoadY, 1.15)) continue;

    const wallLine = getObstacleLongLine(wall);
    if (!wallLine) continue;

    const wallThickness = wall.scale?.[2] ?? 0.8;
    const clearance = getRoadWidth(accessRoad) / 2 + wallThickness / 2 + 0.35;
    const distance = getSegmentDistance(roadLine.start, roadLine.end, wallLine.start, wallLine.end);
    if (distance.distanceSq > clearance * clearance) continue;

    errors.push({
      type: 'surface-tunnel-access-visual-wall-blocker',
      road: accessRoad.id,
      wall: wall.id,
      distance: round(Math.sqrt(distance.distanceSq))
    });
    break;
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
for (const guideway of metroGuideways) {
  const guidewayId = String(guideway.id ?? '');
  if (!guidewayId.startsWith('metro-green-') && !guidewayId.startsWith('metro-purple-')) continue;

  const guidewayLine = getObstacleLongLine(guideway);
  if (!guidewayLine) continue;

  const terminalConflict = airportTerminalFootprints.find((terminal) => {
    if (terminal.box) {
      return getBoxSegmentDistanceSq(terminal.box, guidewayLine.start, guidewayLine.end) <= 3.2 * 3.2;
    }
    if (terminal.line) {
      const clearance = (terminal.halfWidth ?? 0) + 3.2;
      return getSegmentDistance(
        terminal.line.start,
        terminal.line.end,
        guidewayLine.start,
        guidewayLine.end
      ).distanceSq <= clearance * clearance;
    }

    return false;
  });
  if (!terminalConflict) continue;

  errors.push({
    type: 'airport-terminal-metro-guideway-internal',
    guideway: guideway.id,
    terminal: terminalConflict.id
  });
}
const airportMetroGuidewayMinYByLine = new Map();
for (const lineId of ['green', 'purple']) {
  const expectedAirportY = groundY + (lineId === 'green' ? 5.6 : 12);
  const lineGuideways = metroGuideways.filter((guideway) => String(guideway.id ?? '').startsWith(`metro-${lineId}-line-`));
  const airportGuideways = lineGuideways.filter((guideway) => {
    const point = getObstaclePoint(guideway);
    return point && Math.sqrt(getDistanceSq(point, METRO_TRANSFER_POINTS.airport)) <= 900;
  });
  const rampGuideways = lineGuideways.filter((guideway) => {
    const point = getObstaclePoint(guideway);
    return point &&
      Math.sqrt(getDistanceSq(point, METRO_TRANSFER_POINTS.airport)) <= 1800 &&
      Math.abs(guideway.basis?.x?.[1] ?? 0) >= 0.004;
  });
  const lineGuidewayYs = lineGuideways
    .map((guideway) => guideway.position?.[1])
    .filter(Number.isFinite);
  const airportGuidewayYs = airportGuideways
    .map((guideway) => guideway.position?.[1])
    .filter(Number.isFinite);
  const minAirportY = Math.min(...airportGuidewayYs);
  const maxLineY = Math.max(...lineGuidewayYs);
  airportMetroGuidewayMinYByLine.set(lineId, minAirportY);

  if (airportGuideways.length === 0 || !Number.isFinite(minAirportY) || Math.abs(minAirportY - expectedAirportY) > 0.9) {
    errors.push({
      type: 'airport-metro-guideway-not-lowered',
      expectedY: round(expectedAirportY),
      line: lineId,
      minAirportY: round(minAirportY)
    });
  }

  const lowGuideway = airportGuideways.find((guideway) => guideway.position?.[1] === minAirportY) ?? airportGuideways[0];
  const lowGuidewayBottomY = minAirportY - (lowGuideway?.scale?.[2] ?? 0.58) / 2;
  if (lowGuidewayBottomY - groundY < minAirportMetroRoadClearance) {
    errors.push({
      type: 'airport-metro-guideway-too-low-for-cars',
      clearance: round(lowGuidewayBottomY - groundY),
      guideway: lowGuideway?.id,
      line: lineId
    });
  }

  if (!Number.isFinite(maxLineY) || !Number.isFinite(minAirportY) || maxLineY - minAirportY < 8) {
    errors.push({
      type: 'airport-metro-guideway-height-profile-missing',
      line: lineId,
      maxLineY: round(maxLineY),
      minAirportY: round(minAirportY)
    });
  }

  if (rampGuideways.length === 0) {
    errors.push({
      type: 'airport-metro-guideway-ramp-missing',
      line: lineId
    });
  }
}
const airportGreenGuidewayY = airportMetroGuidewayMinYByLine.get('green');
const airportPurpleGuidewayY = airportMetroGuidewayMinYByLine.get('purple');
if (
  !Number.isFinite(airportGreenGuidewayY) ||
  !Number.isFinite(airportPurpleGuidewayY) ||
  airportPurpleGuidewayY - airportGreenGuidewayY < minAirportMetroLineVerticalGap
) {
  errors.push({
    type: 'airport-green-purple-guideways-not-separated',
    greenY: round(airportGreenGuidewayY),
    purpleY: round(airportPurpleGuidewayY)
  });
}
const airportGreenGuideways = metroGuideways
  .filter((guideway) => String(guideway.id ?? '').startsWith('metro-green-line-'))
  .map((guideway) => ({ guideway, line: getObstacleLongLine(guideway) }))
  .filter((item) => item.line);
const airportPurpleGuideways = metroGuideways
  .filter((guideway) => String(guideway.id ?? '').startsWith('metro-purple-line-'))
  .map((guideway) => ({ guideway, line: getObstacleLongLine(guideway) }))
  .filter((item) => item.line);
for (const greenGuideway of airportGreenGuideways) {
  for (const purpleGuideway of airportPurpleGuideways) {
    const crossing = getLineSegmentIntersectionWithT(
      greenGuideway.line.start,
      greenGuideway.line.end,
      purpleGuideway.line.start,
      purpleGuideway.line.end
    );
    if (!crossing) continue;
    if (Math.sqrt(getDistanceSq(crossing, METRO_TRANSFER_POINTS.airport)) > 1100) continue;

    const greenY = getObstacleYAtLongLineT(greenGuideway.guideway, crossing.t);
    const purpleY = getObstacleYAtLongLineT(purpleGuideway.guideway, crossing.u);
    if (purpleY - greenY >= minAirportMetroLineVerticalGap) continue;

    errors.push({
      type: 'airport-green-purple-guideway-crossing-too-close',
      greenGuideway: greenGuideway.guideway.id,
      greenY: round(greenY),
      purpleGuideway: purpleGuideway.guideway.id,
      purpleY: round(purpleY),
      x: round(crossing.x),
      z: round(crossing.z)
    });
  }
}
for (const greenGuideway of airportGreenGuideways) {
  for (const purpleGuideway of airportPurpleGuideways) {
    const midpoint = getLineMidpoint(greenGuideway.line);
    if (Math.sqrt(getDistanceSq(midpoint, METRO_TRANSFER_POINTS.airport)) > 1300) continue;

    const proximity = getSegmentDistance(
      greenGuideway.line.start,
      greenGuideway.line.end,
      purpleGuideway.line.start,
      purpleGuideway.line.end
    );
    const greenHalfWidth = (greenGuideway.guideway.scale?.[1] ?? 0) / 2;
    const purpleHalfWidth = (purpleGuideway.guideway.scale?.[1] ?? 0) / 2;
    const horizontalLimit = greenHalfWidth + purpleHalfWidth + 1.2;
    if (proximity.distanceSq > horizontalLimit * horizontalLimit) continue;

    const greenY = getObstacleYAtLongLineT(greenGuideway.guideway, proximity.t);
    const purpleY = getObstacleYAtLongLineT(purpleGuideway.guideway, proximity.u);
    if (purpleY - greenY >= minAirportMetroLineVerticalGap) continue;

    errors.push({
      type: 'airport-green-purple-guideways-physically-too-close',
      distance: round(Math.sqrt(proximity.distanceSq)),
      greenGuideway: greenGuideway.guideway.id,
      greenY: round(greenY),
      purpleGuideway: purpleGuideway.guideway.id,
      purpleY: round(purpleY)
    });
  }
}
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

const metroTerrainTunnelRoofs = trafficObstacles.filter((obstacle) => obstacle.type === 'metroTerrainTunnelRoof');
const metroTerrainTunnelPortals = trafficObstacles.filter((obstacle) => obstacle.type === 'metroTerrainTunnelPortal');
for (const target of metroTerrainTunnelTargets) {
  const targetGuideways = metroGuideways
    .filter((guideway) => String(guideway.id ?? '').startsWith(`metro-${target.lineId}-line-`))
    .map((guideway) => ({ guideway, line: getObstacleLongLine(guideway) }))
    .filter((item) => item.line);
  const targetLandforms = landforms.filter((landform) => {
    const id = String(landform.id ?? '');
    return id === target.landformId || id.startsWith(`${target.landformId}-metro-tunnel-side-`);
  });

  if (targetLandforms.length < 2) {
    errors.push({
      type: 'metro-terrain-tunnel-landform-not-carved',
      landform: target.landformId,
      line: target.lineId,
      landforms: targetLandforms.length
    });
  }

  if (!metroTerrainTunnelRoofs.some((roof) => String(roof.id ?? '').startsWith(`metro-${target.lineId}-terrain-tunnel-`))) {
    errors.push({
      type: 'metro-terrain-tunnel-roof-missing',
      landform: target.landformId,
      line: target.lineId
    });
  }

  if (metroTerrainTunnelPortals.filter((portal) => String(portal.id ?? '').startsWith(`metro-${target.lineId}-terrain-tunnel-`)).length < 2) {
    errors.push({
      type: 'metro-terrain-tunnel-portals-missing',
      landform: target.landformId,
      line: target.lineId
    });
  }

  for (const landform of targetLandforms) {
    const point = getLandformPoint(landform);
    if (!point) continue;

    for (const item of targetGuideways) {
      const distance = Math.sqrt(getPointToSegmentDistanceSq(point, item.line.start, item.line.end));
      const clearance = distance - (landform.radius ?? 0);
      if (clearance >= minMetroTerrainTunnelClearance) continue;

      errors.push({
        type: 'metro-terrain-tunnel-guideway-buried',
        clearance: round(clearance),
        guideway: item.guideway.id,
        landform: landform.id,
        line: target.lineId,
        required: minMetroTerrainTunnelClearance
      });
      break;
    }
  }
}

const scenicMountainLandforms = landforms.filter((landform) => landform.id === 'scenic-drive-mountain');
if (scenicMountainLandforms.length === 0) {
  errors.push({ type: 'scenic-mountain-missing' });
}

const scenicMountainRoads = roads.filter((road) => (
  road.kind === 'scenic-mountain-road' ||
  road.kind === 'scenic-mountain-road-joint'
));
if (scenicMountainRoads.length > 0) {
  errors.push({
    type: 'scenic-mountain-road-leftover',
    roadCount: scenicMountainRoads.length,
    samples: scenicMountainRoads.slice(0, 8).map((road) => road.id)
  });
}

const scenicMountainGuardrails = guardrails.filter((guardrail) => String(guardrail.id ?? '').includes('scenic-drive-mountain'));
if (scenicMountainGuardrails.length > 0) {
  errors.push({
    type: 'scenic-mountain-guardrails-leftover',
    guardrailCount: scenicMountainGuardrails.length,
    samples: scenicMountainGuardrails.slice(0, 8).map((guardrail) => guardrail.id)
  });
}

const scenicMountainGuardrailColliders = colliders.filter((collider) => collider.type === 'mountainGuardrail');
if (scenicMountainGuardrailColliders.length > 0) {
  errors.push({
    type: 'scenic-mountain-guardrail-colliders-leftover',
    colliderCount: scenicMountainGuardrailColliders.length,
    samples: scenicMountainGuardrailColliders.slice(0, 8).map((collider) => collider.id)
  });
}

const structureSupportObstacles = trafficObstacles.filter(isStructureSupportObstacle);
const structureSupportBoxes = structureSupportObstacles
  .map((obstacle) => ({ obstacle, box: getObstacleFootprintBox(obstacle) }))
  .filter((item) => item.box);
const hillLandforms = landforms.filter((landform) => landform.type === 'hill');
for (const hill of hillLandforms) {
  const point = getLandformPoint(hill);
  if (!point) continue;

  if (roads.some((road) => doesCircleOverlapRoadSurface(point, hill.radius ?? 0, road, 10))) {
    errors.push({
      type: 'terrain-hill-overlaps-road-or-elevated-structure',
      hill: hill.id,
      chunk: hill.chunkKey
    });
  }

  if (structureSupportBoxes.some((item) => doesCircleOverlapBox(point, (hill.radius ?? 0) + 8, item.box))) {
    errors.push({
      type: 'terrain-hill-overlaps-support',
      hill: hill.id,
      chunk: hill.chunkKey
    });
  }

  if (buildings.some((building) => doesCircleOverlapBox(point, (hill.radius ?? 0) + 8, getBuildingBox(building)))) {
    errors.push({
      type: 'terrain-hill-overlaps-building',
      hill: hill.id,
      chunk: hill.chunkKey
    });
  }
}

const metroStationPlatforms = trafficObstacles.filter((obstacle) => obstacle.type === 'metroStationPlatform');
if (metroStationPlatforms.length === 0) {
  errors.push({ type: 'metro-station-platforms-missing' });
}
const expectedMetroStationIds = METRO_LINE_DEFINITIONS.flatMap((line) => (
  (line.stations ?? []).map((station) => station.id)
));
const metroStationPlatformIds = new Set(
  metroStationPlatforms.map((platform) => String(platform.id ?? '').replace(/-metro-platform$/, ''))
);
const metroStationLineBandIds = new Set(
  trafficObstacles
    .filter((obstacle) => obstacle.type === 'metroStationLineBand')
    .map((obstacle) => String(obstacle.id ?? '').replace(/-metro-(?:roof|platform)-line-band(?:-[^-]+)?$/, ''))
);
for (const stationId of expectedMetroStationIds) {
  if (!metroStationPlatformIds.has(stationId)) {
    errors.push({
      type: 'metro-station-world-structure-missing',
      station: stationId
    });
  }

  if (!metroStationLineBandIds.has(stationId)) {
    errors.push({
      type: 'metro-station-visibility-marker-missing',
      station: stationId
    });
  }
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

  const point = getObstaclePoint(platform);
  const [spawnX, , spawnZ] = WORLD_SETTINGS.teleportAnchors.downtown.position;
  if (
    point &&
    !String(platform.id ?? '').includes('central-transfer') &&
    Math.hypot(point.x - spawnX, point.z - spawnZ) < 900
  ) {
    errors.push({
      type: 'metro-station-too-close-to-downtown-spawn',
      platform: platform.id,
      distance: round(Math.hypot(point.x - spawnX, point.z - spawnZ))
    });
  }
}

const metroDarkTrackObstacleTypes = new Set([
  'metroGantryBar',
  'metroGantryPost',
  'metroGuideway',
  'metroPowerRail',
  'metroRail',
  'metroSleeper',
  'metroStationConnectorTrack'
]);
const lightMetroTrackObstacles = trafficObstacles.filter((obstacle) => (
  metroDarkTrackObstacleTypes.has(obstacle.type) &&
  getHexColorLuminance(obstacle.color) > 42
));
if (lightMetroTrackObstacles.length > 0) {
  errors.push({
    type: 'metro-track-structure-too-light',
    count: lightMetroTrackObstacles.length,
    samples: lightMetroTrackObstacles.slice(0, 8).map((obstacle) => ({
      id: obstacle.id,
      type: obstacle.type,
      color: obstacle.color
    }))
  });
}
const metroTerminalTurnbackMarkers = trafficObstacles.filter((obstacle) => obstacle.type === 'metroTerminalTurnbackMarker');
if (metroTerminalTurnbackMarkers.length < METRO_LINE_DEFINITIONS.length * 4) {
  errors.push({
    type: 'metro-terminal-turnback-markers-missing',
    count: metroTerminalTurnbackMarkers.length,
    expected: METRO_LINE_DEFINITIONS.length * 4
  });
}
const metroGantryBars = trafficObstacles.filter((obstacle) => obstacle.type === 'metroGantryBar');
const metroGantryPosts = trafficObstacles.filter((obstacle) => obstacle.type === 'metroGantryPost');
for (const bar of metroGantryBars) {
  const bottomY = getObstacleMinY(bar);
  const matchingGuideways = getMetroGantryMatchingGuideways(bar, metroGuideways);
  const guidewayBottomY = Math.min(
    ...matchingGuideways.map((guideway) => guideway.colliderMinY ?? getObstacleMinY(guideway))
  );
  if (!Number.isFinite(bottomY) || !Number.isFinite(guidewayBottomY)) continue;
  if (bottomY - guidewayBottomY >= 4.55) continue;

  errors.push({
    type: 'metro-gantry-bar-too-low',
    bar: bar.id,
    clearance: round(bottomY - guidewayBottomY)
  });
  break;
}
for (const post of metroGantryPosts) {
  const point = getObstaclePoint(post);
  if (!point) continue;

  let nearestDistance = Infinity;
  for (const guideway of getMetroGantryMatchingGuideways(post, metroGuideways)) {
    const line = getObstacleLongLine(guideway);
    if (!line) continue;
    nearestDistance = Math.min(nearestDistance, Math.sqrt(getPointToSegmentDistanceSq(point, line.start, line.end)));
  }
  if (nearestDistance >= 3.2) continue;

  errors.push({
    type: 'metro-gantry-post-too-close-to-track',
    distance: round(nearestDistance),
    post: post.id
  });
  break;
}
const visibleMetroStationObstacleTypes = new Set([
  'metroStationCanopy',
  'metroStationColumn',
  'metroStationConnectorDeck',
  'metroStationConnectorParapet',
  'metroStationElevatorCore',
  'metroStationGroundCanopy',
  'metroStationGroundPlaza',
  'metroStationHandrail',
  'metroStationPlatform',
  'metroStationPlatformEdge',
  'metroStationStairRamp',
  'metroStationStairStep'
]);
const blackMetroStationObstacles = trafficObstacles.filter((obstacle) => (
  (
    visibleMetroStationObstacleTypes.has(obstacle.type) ||
    ((obstacle.type === 'metroPier' || obstacle.type === 'metroPierCap') && String(obstacle.id ?? '').includes('metro-station'))
  ) &&
  getHexColorLuminance(obstacle.color) < 55
));
if (blackMetroStationObstacles.length > 0) {
  errors.push({
    type: 'metro-station-body-too-dark',
    count: blackMetroStationObstacles.length,
    samples: blackMetroStationObstacles.slice(0, 8).map((obstacle) => ({
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
  if (!vehicle.metroLoop) {
    errors.push({
      type: 'metro-train-missing-dual-track-loop',
      train: vehicle.id
    });
  }

  if (vehicle.metroOneWay && !vehicle.metroLoop) {
    errors.push({
      type: 'metro-train-still-uses-one-way-reset',
      train: vehicle.id
    });
  }

  if (!vehicle.preservePathYaw) {
    errors.push({
      type: 'metro-train-missing-stable-yaw',
      train: vehicle.id
    });
  }

  if (!vehicle.metroReversibleEnds) {
    errors.push({
      type: 'metro-train-missing-reversible-end-cabs',
      train: vehicle.id
    });
  }

  if (!Number.isFinite(vehicle.metroTerminalMargin) || (!vehicle.metroLoop && vehicle.metroTerminalMargin <= 0)) {
    errors.push({
      type: 'metro-train-missing-terminal-margin',
      train: vehicle.id
    });
  }

  if (!Number.isFinite(vehicle.metroDwellSeconds) || vehicle.metroDwellSeconds < 24 || vehicle.metroDwellSeconds > 27) {
    errors.push({
      type: 'metro-train-station-dwell-not-25-seconds',
      dwellSeconds: vehicle.metroDwellSeconds,
      train: vehicle.id
    });
  }

  if (!Number.isFinite(vehicle.metroTerminalDwellSeconds) || vehicle.metroTerminalDwellSeconds < 29 || vehicle.metroTerminalDwellSeconds > 31) {
    errors.push({
      type: 'metro-train-terminal-dwell-not-30-seconds',
      dwellSeconds: vehicle.metroTerminalDwellSeconds,
      train: vehicle.id
    });
  }

  if (!vehicle.renderBounds) {
    errors.push({
      type: 'metro-train-missing-render-bounds',
      train: vehicle.id
    });
  }

  if (vehicle.renderBounds && Array.isArray(vehicle.path?.points)) {
    const outsidePoint = vehicle.path.points.find((point) => (
      point.x < vehicle.renderBounds.minX ||
      point.x > vehicle.renderBounds.maxX ||
      point.z < vehicle.renderBounds.minZ ||
      point.z > vehicle.renderBounds.maxZ
    ));

    if (outsidePoint) {
      errors.push({
        type: 'metro-train-render-bounds-not-route-wide',
        train: vehicle.id,
        x: round(outsidePoint.x),
        z: round(outsidePoint.z)
      });
    }
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
  { minDistance: 300, stations: ['red-central-transfer', 'blue-central-transfer', 'green-central-transfer'] },
  { minDistance: 102, stations: ['red-west-transfer', 'green-west-transfer'] },
  { minDistance: 102, stations: ['green-airport-transfer', 'purple-airport-terminal'] },
  { minDistance: 102, stations: ['green-station-transfer', 'purple-train-station'] }
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

const metroGuidewayLinesForStations = metroGuideways
  .map((guideway) => ({ guideway, line: getObstacleLongLine(guideway) }))
  .filter((item) => item.line);
for (const platform of metroStationPlatforms) {
  const point = getObstaclePoint(platform);
  if (!point) continue;

  let nearestDistanceSq = Infinity;
  for (const guideway of metroGuidewayLinesForStations) {
    nearestDistanceSq = Math.min(
      nearestDistanceSq,
      getPointToSegmentDistanceSq(point, guideway.line.start, guideway.line.end)
    );
  }

  const nearestDistance = Math.sqrt(nearestDistanceSq);
  if (nearestDistance >= 2.25 && nearestDistance <= 7.5) continue;

  errors.push({
    type: 'metro-station-platform-not-between-tracks',
    platform: platform.id,
    distance: round(nearestDistance)
  });
}
for (const platform of metroStationPlatforms) {
  const platformLine = getStationPlatformLongLine(platform);
  const platformPoint = getObstaclePoint(platform);
  if (!platformLine || !platformPoint) continue;

  const platformDirection = getLineUnit(platformLine);
  const platformNormal = { x: platformDirection.z, z: -platformDirection.x };
  const halfLength = (platform.scale?.[2] ?? 0) / 2;
  const halfWidth = (platform.scale?.[0] ?? 0) / 2;
  const nearbyGuideways = metroGuidewayLinesForStations.filter((item) => {
    const guidewayId = String(item.guideway.id ?? '');
    if (guidewayId.includes('terminal-') && guidewayId.includes('turnback')) return false;

    const midpoint = getLineMidpoint(item.line);
    const dx = midpoint.x - platformPoint.x;
    const dz = midpoint.z - platformPoint.z;
    const forward = dx * platformDirection.x + dz * platformDirection.z;
    const lateral = dx * platformNormal.x + dz * platformNormal.z;

    return Math.abs(forward) <= halfLength + 28 &&
      Math.abs(lateral) <= halfWidth + 7.5;
  });

  if (nearbyGuideways.length < 2) {
    errors.push({
      type: 'metro-station-tracks-missing-at-platform',
      platform: platform.id,
      guideways: nearbyGuideways.length
    });
    continue;
  }

  for (const item of nearbyGuideways) {
    const angleDegrees = getLineAngleDegrees(platformLine, item.line);
    if (angleDegrees <= 8) continue;

    errors.push({
      type: 'metro-station-track-not-straight-through-platform',
      platform: platform.id,
      guideway: item.guideway.id,
      angleDegrees: round(angleDegrees)
    });
    break;
  }
}

for (const station of METRO_LINE_DEFINITIONS.flatMap((line) => line.stations ?? [])) {
  if (station.structureForwardOffset || station.structureLateralOffset) {
    errors.push({
      type: 'metro-station-uses-track-offset',
      station: station.id
    });
  }
}

const trainStationMetroGuideways = metroGuidewayLinesForStations
  .map((item) => ({
    ...item,
    lineId: String(item.guideway.id ?? '').match(/^metro-([^-]+)-line-/)?.[1] ?? null,
    point: getObstaclePoint(item.guideway)
  }))
  .filter((item) => (
    (item.lineId === 'green' || item.lineId === 'purple') &&
    item.point &&
    Math.sqrt(getDistanceSq(item.point, METRO_TRANSFER_POINTS.trainStation)) <= 820
  ));
let minTrainStationMetroGuidewaySeparation = Infinity;
for (const greenGuideway of trainStationMetroGuideways.filter((item) => item.lineId === 'green')) {
  for (const purpleGuideway of trainStationMetroGuideways.filter((item) => item.lineId === 'purple')) {
    minTrainStationMetroGuidewaySeparation = Math.min(
      minTrainStationMetroGuidewaySeparation,
      Math.sqrt(getSegmentDistance(
        greenGuideway.line.start,
        greenGuideway.line.end,
        purpleGuideway.line.start,
        purpleGuideway.line.end
      ).distanceSq)
    );
  }
}
if (minTrainStationMetroGuidewaySeparation < 120) {
  errors.push({
    type: 'train-station-metro-guideways-too-close',
    separation: round(minTrainStationMetroGuidewaySeparation),
    required: 120
  });
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

const metroStationPlatformByStationId = new Map(metroStationPlatforms.map((platform) => [
  String(platform.id ?? '').replace(/-metro-platform$/, ''),
  platform
]));
for (const pier of metroStationSupportPiers) {
  const id = String(pier.id ?? '');
  if (id.includes('metro-station-connector')) continue;

  const stationId = id.match(/^(.*?)-metro-station-pier-/)?.[1];
  const platform = metroStationPlatformByStationId.get(stationId);
  const point = getObstaclePoint(pier);
  if (!platform || !point) continue;

  const local = getObstacleLocalOffset(point, platform);
  const maxLateral = (platform.scale?.[0] ?? 0) / 2 + 0.9;
  const maxForward = (platform.scale?.[2] ?? 0) / 2 + 1.4;
  if (Math.abs(local.x) <= maxLateral && Math.abs(local.z) <= maxForward) continue;

  errors.push({
    type: 'metro-station-pier-outside-platform',
    pier: pier.id,
    platform: platform.id,
    lateral: round(local.x),
    forward: round(local.z)
  });
}

const expectedMetroLineIds = new Set(METRO_LINE_DEFINITIONS.map((line) => line.id));
const expectedMetroStationCountByLine = new Map(
  METRO_LINE_DEFINITIONS.map((line) => [line.id, (line.stations ?? []).length])
);
const metroStationPlatformPointsByLine = new Map();
const metroStationPlatformsByLine = new Map();
for (const line of METRO_LINE_DEFINITIONS) {
  const platforms = (line.stations ?? [])
      .map((station) => metroStationPlatforms.find((platform) => platform.id === `${station.id}-metro-platform`))
      .filter(Boolean);

  metroStationPlatformsByLine.set(line.id, platforms);
  metroStationPlatformPointsByLine.set(
    line.id,
    platforms.map((platform) => getObstaclePoint(platform)).filter(Boolean)
  );
}
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
  if (stopCount > (vehicle.metroLoop ? 6 : 2)) {
    errors.push({
      type: 'purple-metro-link-has-intermediate-stop',
      train: vehicle.id,
      stopCount
    });
  }
}
for (const vehicle of uniqueMetroVehicles) {
  const [lineId] = String(vehicle.trainSetId ?? '').split('-');
  const expectedStationCount = expectedMetroStationCountByLine.get(lineId);
  const stationPoints = metroStationPlatformPointsByLine.get(lineId) ?? [];
  const stationPlatforms = metroStationPlatformsByLine.get(lineId) ?? [];
  const stops = [...new Set((vehicle.metroStops ?? []).map((stop) => Number(stop).toFixed(5)))].map(Number);
  const terminalStops = [...new Set((vehicle.metroTerminalStops ?? []).map((stop) => Number(stop).toFixed(5)))].map(Number);
  if (!lineId || !Array.isArray(vehicle.path?.points)) continue;

  if (vehicle.metroLoop && terminalStops.length !== 2) {
    errors.push({
      type: 'metro-train-terminal-turnback-stops-missing',
      line: lineId,
      terminalStops: terminalStops.length,
      train: vehicle.id
    });
  }

  if (vehicle.metroLoop && Number.isFinite(expectedStationCount) && stops.length !== expectedStationCount * 2 + 2) {
    errors.push({
      type: 'metro-train-stop-count-not-station-pairs',
      expected: expectedStationCount * 2 + 2,
      line: lineId,
      stops: stops.length,
      train: vehicle.id
    });
  }

  for (const stop of stops) {
    if (terminalStops.some((terminalStop) => Math.abs(getShortestCircularProgressDistance(stop, terminalStop)) <= 0.00004)) {
      continue;
    }

    const point = samplePathAtProgress(vehicle.path.points, stop);
    const nearestStationDistance = Math.min(...stationPoints.map((stationPoint) => Math.sqrt(getDistanceSq(point, stationPoint))));
    if (nearestStationDistance <= 18) continue;

    errors.push({
      type: 'metro-train-stop-not-at-station-platform',
      distance: round(nearestStationDistance),
      line: lineId,
      progress: round(stop),
      train: vehicle.id,
      x: round(point.x),
      z: round(point.z)
    });
    break;
  }

  for (const stop of stops) {
    if (terminalStops.some((terminalStop) => Math.abs(getShortestCircularProgressDistance(stop, terminalStop)) <= 0.00004)) {
      continue;
    }

    const point = samplePathAtProgress(vehicle.path.points, stop);
    const nearestPlatform = findNearestStationPlatform(point, stationPlatforms);
    if (!nearestPlatform) continue;

    const local = getObstacleLocalOffset(point, nearestPlatform);
    const platformHalfLength = (nearestPlatform.scale?.[2] ?? 0) / 2;
    if (Math.abs(local.z) + metroTrainHalfLengthForPlatformStop <= platformHalfLength + 1.5) continue;

    errors.push({
      type: 'metro-train-stop-not-fully-inside-platform',
      forwardOffset: round(local.z),
      line: lineId,
      platform: nearestPlatform.id,
      platformHalfLength: round(platformHalfLength),
      requiredHalfLength: metroTrainHalfLengthForPlatformStop,
      train: vehicle.id
    });
    break;
  }
}

for (const transfer of [
  { point: METRO_TRANSFER_POINTS.central, lines: ['red', 'blue', 'green'], maxDistance: 3350 },
  { point: METRO_TRANSFER_POINTS.airport, lines: ['green', 'purple'], maxDistance: 620 },
  { point: METRO_TRANSFER_POINTS.trainStation, lines: ['green', 'purple'], maxDistance: 1250 },
  { point: METRO_TRANSFER_POINTS.west, lines: ['red', 'green'], maxDistance: 2600 }
]) {
  for (const lineId of transfer.lines) {
    if (!doesLineHaveStationNearPoint(lineId, transfer.point, transfer.maxDistance)) {
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
const metroPierBraces = trafficObstacles.filter((obstacle) => obstacle.type === 'metroPierBrace');
if (metroPierBraces.length > 0) {
  errors.push({
    type: 'metro-pier-brace-still-rendered',
    count: metroPierBraces.length,
    samples: metroPierBraces.slice(0, 8).map((obstacle) => obstacle.id)
  });
}
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

const metroGuidewayLinesForSupportChecks = metroGuideways
  .map((guideway) => ({ guideway, line: getObstacleLongLine(guideway) }))
  .filter((item) => item.line);
for (const pier of metroPiers) {
  if (String(pier.id ?? '').includes('metro-station')) continue;

  const point = getObstaclePoint(pier);
  if (!point) continue;

  let nearestDistance = Infinity;
  let nearestGuideway = null;
  for (const item of metroGuidewayLinesForSupportChecks) {
    const distance = Math.sqrt(getPointToSegmentDistanceSq(point, item.line.start, item.line.end));
    if (distance >= nearestDistance) continue;

    nearestDistance = distance;
    nearestGuideway = item.guideway;
  }

  if (nearestDistance <= 8.5) continue;

  errors.push({
    type: 'metro-pier-not-under-guideway',
    pier: pier.id,
    guideway: nearestGuideway?.id ?? null,
    distance: round(nearestDistance),
    chunk: pier.chunkKey
  });
}

const metroPierProjectionsBySegment = new Map();
for (const pier of metroPiers) {
  if (String(pier.id ?? '').includes('metro-station')) continue;

  const segmentKey = getMetroLineSegmentSupportKey(pier.id);
  const point = getObstaclePoint(pier);
  if (!segmentKey || !point) continue;

  const list = metroPierProjectionsBySegment.get(segmentKey) ?? [];
  list.push(point);
  metroPierProjectionsBySegment.set(segmentKey, list);
}
for (const item of metroGuidewayLinesForSupportChecks) {
  const segmentKey = getMetroLineSegmentGuidewayKey(item.guideway.id);
  if (!segmentKey) continue;

  const length = Math.sqrt(getDistanceSq(item.line.start, item.line.end));
  if (length < 85) continue;

  const supportPoints = metroPierProjectionsBySegment.get(segmentKey) ?? [];
  if (supportPoints.length === 0) {
    if (length <= maxUnsupportedMetroRoadSpan) continue;

    errors.push({
      type: 'metro-pier-spacing-missing-segment-supports',
      guideway: item.guideway.id,
      length: round(length)
    });
    continue;
  }

  const projectedDistances = supportPoints
    .map((point) => projectPointToSegment(point, item.line.start, item.line.end).t * length)
    .sort((a, b) => a - b)
    .filter((distance, index, distances) => index === 0 || Math.abs(distance - distances[index - 1]) > 0.5);
  let maxGap = projectedDistances[0] ?? length;
  for (let index = 1; index < projectedDistances.length; index += 1) {
    maxGap = Math.max(maxGap, projectedDistances[index] - projectedDistances[index - 1]);
  }
  maxGap = Math.max(maxGap, length - projectedDistances[projectedDistances.length - 1]);

  if (maxGap <= maxMetroPierSpan) continue;

  errors.push({
    type: 'metro-pier-spacing-too-wide',
    guideway: item.guideway.id,
    maxGap: round(maxGap)
  });
}

for (const building of buildings) {
  const buildingBox = getBuildingBox(building);
  const conflict = structureSupportBoxes.find((item) => doBoxesOverlap(buildingBox, item.box));
  if (!conflict) continue;

  errors.push({
    type: 'building-overlaps-elevated-support',
    building: building.id,
    support: conflict.obstacle.id,
    supportType: conflict.obstacle.type,
    chunk: building.chunkKey
  });
  break;
}

const metroTrackPaths = new Map();
const metroLoopPaths = new Map();
for (const vehicle of uniqueMetroVehicles) {
  const [lineId, directionName] = String(vehicle.trainSetId ?? '').split('-');
  if (!lineId || !directionName || !Array.isArray(vehicle.path?.points)) continue;

  if (vehicle.path.metroLoop) {
    if (!metroLoopPaths.has(lineId)) metroLoopPaths.set(lineId, vehicle.path);
    if (!metroTrackPaths.has(`${lineId}-loop`)) metroTrackPaths.set(`${lineId}-loop`, vehicle.path.points);
  } else {
    const key = `${lineId}-${directionName}`;
    if (!metroTrackPaths.has(key)) metroTrackPaths.set(key, vehicle.path.points);
  }
}

for (const [pathKey, points] of metroTrackPaths) {
  if (pathKey.endsWith('-loop')) continue;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const leftX = current.x - previous.x;
    const leftZ = current.z - previous.z;
    const rightX = next.x - current.x;
    const rightZ = next.z - current.z;
    const leftLength = Math.hypot(leftX, leftZ);
    const rightLength = Math.hypot(rightX, rightZ);
    if (leftLength < 24 || rightLength < 24) continue;

    const cosine = clamp((leftX * rightX + leftZ * rightZ) / (leftLength * rightLength), -1, 1);
    const turnDegrees = Math.acos(cosine) * 180 / Math.PI;
    if (turnDegrees <= 68) continue;

    errors.push({
      type: 'metro-track-hard-corner',
      path: pathKey,
      turnDegrees: round(turnDegrees),
      x: round(current.x),
      z: round(current.z)
    });
    break;
  }
}

for (const lineId of expectedMetroLineIds) {
  const loopPath = metroLoopPaths.get(lineId);
  if (loopPath) {
    const outboundEndSegmentIndex = loopPath.metroLoopOutboundEndSegmentIndex;
    const inboundStartSegmentIndex = loopPath.metroLoopInboundStartSegmentIndex;
    const inboundEndSegmentIndex = loopPath.metroLoopInboundEndSegmentIndex;
    if (
      !Number.isFinite(outboundEndSegmentIndex) ||
      !Number.isFinite(inboundStartSegmentIndex) ||
      !Number.isFinite(inboundEndSegmentIndex)
    ) {
      errors.push({
        type: 'metro-terminal-turnback-path-metadata-missing',
        line: lineId
      });
      continue;
    }

    const outboundPoints = loopPath.points.slice(0, outboundEndSegmentIndex + 2);
    const inboundPoints = loopPath.points.slice(inboundStartSegmentIndex, inboundEndSegmentIndex + 2);
    const sampleCount = Math.min(outboundPoints.length, inboundPoints.length);
    const step = Math.max(1, Math.floor(sampleCount / 16));
    let minSeparation = Infinity;

    for (let index = step; index < sampleCount - step; index += step) {
      const outboundPoint = outboundPoints[index];
      const inboundPoint = inboundPoints[sampleCount - 1 - index];
      minSeparation = Math.min(
        minSeparation,
        Math.hypot(outboundPoint.x - inboundPoint.x, outboundPoint.z - inboundPoint.z)
      );
    }

    if (minSeparation < 8.4) {
      errors.push({
        type: 'metro-directional-tracks-overlap',
        line: lineId,
        separation: round(minSeparation)
      });
    }
    continue;
  }

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

  if (minSeparation < 8.4) {
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
const surfaceTunnelMergeBlockerTypes = new Set([
  'highwaySideGuardrail',
  'highwayMedianGuardrail',
  'roadMedian',
  'roadDetailMedian',
  'tunnelWall'
]);
for (const mergeRoad of surfaceTunnelMergeRoads) {
  const mergeLine = getRoadLine(mergeRoad);
  if (!mergeLine) continue;

  const minRoadY = Math.min(getRoadYAt(mergeRoad, 0), getRoadYAt(mergeRoad, 1));
  const maxRoadY = Math.max(getRoadYAt(mergeRoad, 0), getRoadYAt(mergeRoad, 1));

  for (const collider of colliders) {
    if (!surfaceTunnelMergeBlockerTypes.has(collider.type)) continue;
    if (String(collider.id ?? '').includes('ramp-wall-retaining')) continue;
    if (!doesColliderOverlapYRange(collider, minRoadY, maxRoadY, 1.8)) continue;

    const colliderLine = getColliderLine(collider);
    if (!colliderLine) continue;

    const clearance = getRoadWidth(mergeRoad) / 2 + (collider.width ?? 0) / 2 + 0.8;
    const distance = getSegmentDistance(mergeLine.start, mergeLine.end, colliderLine.start, colliderLine.end);
    if (distance.distanceSq > clearance * clearance) continue;

    errors.push({
      type: 'surface-tunnel-merge-blocker',
      chunk: mergeRoad.chunkKey,
      road: mergeRoad.id,
      collider: collider.id,
      colliderType: collider.type,
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

function doesLineHaveStationNearPoint(lineId, point, maxDistance = 0.001) {
  const line = METRO_LINE_DEFINITIONS.find((item) => item.id === lineId);
  if (!line) return false;

  return (line.stations ?? []).some((station) => (
    station.point &&
    Math.hypot(station.point.x - point.x, station.point.z - point.z) <= maxDistance
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

function getObstacleMinY(obstacle) {
  if (!obstacle) return Number.NaN;

  const [, y = 0] = obstacle.position ?? [];
  const height = obstacle.scale?.[1] ?? 0;
  return obstacle.colliderMinY ?? y - height / 2;
}

function getMetroGantryMatchingGuideways(gantry, guideways) {
  const segmentKey = String(gantry?.id ?? '').match(/^(metro-[^-]+-line-\d+)-gantry-/)?.[1];
  if (!segmentKey) return [];

  return guideways.filter((guideway) => String(guideway.id ?? '').startsWith(`${segmentKey}-track-`));
}

function getLandformPoint(landform) {
  const [x, , z] = landform?.position ?? [];
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;

  return { x, z };
}

function getObstacleLongLine(obstacle) {
  const point = getObstaclePoint(obstacle);
  const length = obstacle?.scale?.[0] ?? 0;
  if (!point || length <= 0) return null;

  const basisX = obstacle?.basis?.x;
  if (Array.isArray(basisX) && Number.isFinite(basisX[0]) && Number.isFinite(basisX[2])) {
    const dx = basisX[0] * length / 2;
    const dz = basisX[2] * length / 2;

    return {
      start: { x: point.x - dx, z: point.z - dz },
      end: { x: point.x + dx, z: point.z + dz }
    };
  }

  const yaw = obstacle.rotation?.[1] ?? 0;
  const dx = Math.cos(yaw) * length / 2;
  const dz = -Math.sin(yaw) * length / 2;

  return {
    start: { x: point.x - dx, z: point.z - dz },
    end: { x: point.x + dx, z: point.z + dz }
  };
}

function getLineSegmentIntersectionWithT(aStart, aEnd, bStart, bEnd) {
  const ax = aEnd.x - aStart.x;
  const az = aEnd.z - aStart.z;
  const bx = bEnd.x - bStart.x;
  const bz = bEnd.z - bStart.z;
  const denominator = ax * bz - az * bx;
  if (Math.abs(denominator) < 0.000001) return null;

  const cx = bStart.x - aStart.x;
  const cz = bStart.z - aStart.z;
  const t = (cx * bz - cz * bx) / denominator;
  const u = (cx * az - cz * ax) / denominator;
  const epsilon = 0.000001;
  if (t < -epsilon || t > 1 + epsilon || u < -epsilon || u > 1 + epsilon) return null;

  return {
    x: lerp(aStart.x, aEnd.x, clamp(t, 0, 1)),
    z: lerp(aStart.z, aEnd.z, clamp(t, 0, 1)),
    t,
    u
  };
}

function getObstacleYAtLongLineT(obstacle, t) {
  const [, y = 0] = obstacle?.position ?? [];
  const length = obstacle?.scale?.[0] ?? 0;
  const vertical = obstacle?.basis?.x?.[1] ?? 0;

  return y + (clamp(t, 0, 1) - 0.5) * vertical * length;
}

function getStationPlatformLongLine(obstacle) {
  const point = getObstaclePoint(obstacle);
  const length = obstacle?.scale?.[2] ?? 0;
  if (!point || length <= 0) return null;

  const yaw = obstacle.rotation?.[1] ?? 0;
  const dx = Math.sin(yaw) * length / 2;
  const dz = Math.cos(yaw) * length / 2;

  return {
    start: { x: point.x - dx, z: point.z - dz },
    end: { x: point.x + dx, z: point.z + dz }
  };
}

function findNearestStationPlatform(point, platforms) {
  if (!point || platforms.length === 0) return null;

  let nearest = null;
  let nearestDistanceSq = Infinity;
  for (const platform of platforms) {
    const platformPoint = getObstaclePoint(platform);
    if (!platformPoint) continue;

    const distanceSq = getDistanceSq(point, platformPoint);
    if (distanceSq >= nearestDistanceSq) continue;

    nearest = platform;
    nearestDistanceSq = distanceSq;
  }

  return nearest;
}

function getLineUnit(line) {
  const dx = line.end.x - line.start.x;
  const dz = line.end.z - line.start.z;
  const length = Math.hypot(dx, dz);
  if (length <= 0.000001) return { x: 1, z: 0 };

  return { x: dx / length, z: dz / length };
}

function getLineMidpoint(line) {
  return {
    x: (line.start.x + line.end.x) / 2,
    z: (line.start.z + line.end.z) / 2
  };
}

function getLineAngleDegrees(left, right) {
  const leftUnit = getLineUnit(left);
  const rightUnit = getLineUnit(right);
  const cosine = clamp(Math.abs(leftUnit.x * rightUnit.x + leftUnit.z * rightUnit.z), -1, 1);
  return Math.acos(cosine) * 180 / Math.PI;
}

function samplePathAtProgress(points, progress) {
  const totalLength = getPathLength(points);
  if (!Array.isArray(points) || points.length === 0 || totalLength <= 0.000001) {
    const fallback = points?.[0] ?? { x: 0, z: 0 };
    return { x: fallback.x, z: fallback.z };
  }

  return samplePathAtDistance(points, totalLength * positiveModulo(progress, 1));
}

function samplePathAtDistance(points, distance) {
  const totalLength = getPathLength(points);
  const targetDistance = clamp(distance, 0, totalLength);
  let walked = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z);
    if (segmentLength <= 0.000001) continue;

    if (walked + segmentLength >= targetDistance || index === points.length - 2) {
      const t = clamp((targetDistance - walked) / segmentLength, 0, 1);
      return {
        x: lerp(start.x, end.x, t),
        z: lerp(start.z, end.z, t)
      };
    }

    walked += segmentLength;
  }

  const fallback = points[points.length - 1];
  return { x: fallback.x, z: fallback.z };
}

function getPathLength(points = []) {
  return points.slice(0, -1).reduce((length, point, index) => (
    length + Math.hypot(points[index + 1].x - point.x, points[index + 1].z - point.z)
  ), 0);
}

function getObstacleLocalOffset(point, obstacle) {
  const origin = getObstaclePoint(obstacle);
  if (!origin || !point) return { x: Infinity, z: Infinity };

  const yaw = obstacle.rotation?.[1] ?? 0;
  const dx = point.x - origin.x;
  const dz = point.z - origin.z;

  return {
    x: dx * Math.cos(yaw) + dz * -Math.sin(yaw),
    z: dx * Math.sin(yaw) + dz * Math.cos(yaw)
  };
}

function doesObstacleOverlapYRange(obstacle, minY, maxY, margin = 0) {
  const [, y = 0] = obstacle?.position ?? [];
  const height = obstacle?.scale?.[1] ?? 0;
  const obstacleMinY = obstacle.colliderMinY ?? y - height / 2;
  const obstacleMaxY = obstacle.colliderMaxY ?? y + height / 2;
  return obstacleMaxY >= minY - margin && obstacleMinY <= maxY + margin;
}

function isStructureSupportObstacle(obstacle) {
  const type = String(obstacle?.type ?? '');
  return type === 'roadSupport' ||
    type === 'transportOverpassSupport' ||
    type === 'metroPier' ||
    type === 'metroPierCap';
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

function getMetroLineSegmentSupportKey(id) {
  const match = String(id ?? '').match(/^(metro-[^-]+-line-\d+)-pier-\d+$/);
  return match?.[1] ?? null;
}

function getMetroLineSegmentGuidewayKey(id) {
  const match = String(id ?? '').match(/^(metro-[^-]+-line-\d+)-track-.*-guideway$/);
  return match?.[1] ?? null;
}

function getBuildingBox(building, margin = 0) {
  const [x = 0, , z = 0] = building?.position ?? [];
  const [width = 0, , depth = 0] = building?.scale ?? [];

  return {
    minX: x - width / 2 - margin,
    maxX: x + width / 2 + margin,
    minZ: z - depth / 2 - margin,
    maxZ: z + depth / 2 + margin
  };
}

function getInstanceBox(instance, margin = 0) {
  const [x = 0, , z = 0] = instance?.position ?? [];
  const [width = 0, , depth = 0] = instance?.scale ?? [];

  return {
    minX: x - width / 2 - margin,
    maxX: x + width / 2 + margin,
    minZ: z - depth / 2 - margin,
    maxZ: z + depth / 2 + margin
  };
}

function getObstacleFootprintBox(obstacle, margin = 0) {
  const [x = 0, , z = 0] = obstacle?.position ?? [];
  const [width = 0, , depth = 0] = obstacle?.scale ?? [];
  if (!Number.isFinite(x) || !Number.isFinite(z) || width <= 0 || depth <= 0) return null;

  const yaw = obstacle.rotation?.[1] ?? 0;
  const cos = Math.abs(Math.cos(yaw));
  const sin = Math.abs(Math.sin(yaw));
  const aabbWidth = width * cos + depth * sin + margin * 2;
  const aabbDepth = width * sin + depth * cos + margin * 2;

  return {
    minX: x - aabbWidth / 2,
    maxX: x + aabbWidth / 2,
    minZ: z - aabbDepth / 2,
    maxZ: z + aabbDepth / 2
  };
}

function doesBoxOverlapRoadCorridor(box, road, margin = 0) {
  const line = getRoadLine(road);
  if (!line) return doBoxesOverlap(box, {
    minX: (road?.minX ?? 0) - margin,
    maxX: (road?.maxX ?? 0) + margin,
    minZ: (road?.minZ ?? 0) - margin,
    maxZ: (road?.maxZ ?? 0) + margin
  });

  const halfWidth = getRoadWidth(road) / 2 + margin;
  return getBoxSegmentDistanceSq(box, line.start, line.end) <= halfWidth * halfWidth;
}

function getBoxSegmentDistanceSq(box, start, end) {
  if (isPointInsideBox(start, box) || isPointInsideBox(end, box)) return 0;

  const corners = [
    { x: box.minX, z: box.minZ },
    { x: box.minX, z: box.maxZ },
    { x: box.maxX, z: box.minZ },
    { x: box.maxX, z: box.maxZ }
  ];
  const edges = [
    [corners[0], corners[1]],
    [corners[1], corners[3]],
    [corners[3], corners[2]],
    [corners[2], corners[0]]
  ];

  if (edges.some(([edgeStart, edgeEnd]) => doSegmentsIntersect(start, end, edgeStart, edgeEnd))) return 0;

  const cornerDistances = corners.map((corner) => getPointToSegmentDistanceSq(corner, start, end));
  const endpointDistances = [
    getPointToBoxDistanceSq(start, box),
    getPointToBoxDistanceSq(end, box)
  ];

  return Math.min(...cornerDistances, ...endpointDistances);
}

function isPointInsideBox(point, box) {
  return point.x >= box.minX && point.x <= box.maxX && point.z >= box.minZ && point.z <= box.maxZ;
}

function getPointToBoxDistanceSq(point, box) {
  const closestX = clamp(point.x, box.minX, box.maxX);
  const closestZ = clamp(point.z, box.minZ, box.maxZ);
  return getDistanceSq(point, { x: closestX, z: closestZ });
}

function doesCircleOverlapRoadSurface(point, radius, road, margin = 0) {
  const line = getRoadLine(road);
  if (line) {
    const limit = radius + getRoadWidth(road) / 2 + margin;
    return getPointToSegmentDistanceSq(point, line.start, line.end) <= limit * limit;
  }

  const surface = road?.surface;
  if (surface?.shape === 'circle') {
    const limit = radius + (surface.radius ?? 0) + margin;
    return getDistanceSq(point, { x: surface.centerX, z: surface.centerZ }) <= limit * limit;
  }

  return doesCircleOverlapBox(point, radius + margin, {
    minX: road?.minX ?? 0,
    maxX: road?.maxX ?? 0,
    minZ: road?.minZ ?? 0,
    maxZ: road?.maxZ ?? 0
  });
}

function doesCircleOverlapBox(point, radius, box) {
  const closestX = clamp(point.x, box.minX, box.maxX);
  const closestZ = clamp(point.z, box.minZ, box.maxZ);
  return getDistanceSq(point, { x: closestX, z: closestZ }) <= radius * radius;
}

function doBoxesOverlap(left, right) {
  return left.minX < right.maxX &&
    left.maxX > right.minX &&
    left.minZ < right.maxZ &&
    left.maxZ > right.minZ;
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

function isGroundRenderedRoad(road) {
  return road?.roadType === 'groundRoad' ||
    road?.roadType === 'local' ||
    road?.roadType === 'main' ||
    road?.roadType === 'mainRoad' ||
    road?.roadType === 'parking';
}

function isGroundSurfaceLaneMark(mark) {
  return mark?.roadType === 'groundRoad' ||
    mark?.roadType === 'local' ||
    mark?.roadType === 'main' ||
    mark?.roadType === 'mainRoad';
}

function hasRoadPaintDetails(chunk) {
  return (chunk?.roadDetails?.crosswalks?.length ?? 0) > 0 ||
    (chunk?.roadDetails?.stopBars?.length ?? 0) > 0;
}

function isTerminalTunnelPortalEndpoint(endpoint) {
  const id = String(endpoint?.id ?? '');
  if (!id.includes('-smooth-')) return true;

  const match = id.match(/-(entry|exit)-ramp-smooth-(\d+)/);
  if (!match) return true;

  return (match[1] === 'entry' && match[2] === '0' && endpoint.endpointIndex === 0) ||
    (match[1] === 'exit' && match[2] === '7' && endpoint.endpointIndex === 1);
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

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getShortestCircularProgressDistance(left, right) {
  const delta = Math.abs(positiveModulo(left, 1) - positiveModulo(right, 1));
  return Math.min(delta, 1 - delta);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
