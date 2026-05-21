import { useState } from 'react';
import { getNavigationRouteFeatures } from '../navigation/navigationRoutes.js';
import {
  getDestinationLabel,
  getDestinationShortLabel,
  getDistrictShortLabel,
  getMapLayerText,
  getText
} from '../ui/language.js';
import {
  EXPRESSWAY_MAP,
  TERRAIN_LANDFORMS,
  TRANSPORT_HIGHWAY,
  TRANSPORT_HUBS,
  getExpresswayRampPaths,
  getExpresswayRoutePoints,
  getChunkBounds,
  isChunkCoordInsideWorld,
  MAP_FEATURES,
  WORLD_SETTINGS,
  worldToChunkCoord
} from './worldConfig.js';
import { getChunkData } from './ChunkManager.js';
import { METRO_LINE_DEFINITIONS } from './metroLines.js';

const DEFAULT_MAP_LAYERS = {
  districts: true,
  roads: true,
  highway: true,
  expressway: true,
  structures: true,
  airport: true,
  station: true,
  metro: true,
  tolls: true,
  parking: true,
  terrain: true
};
const MAP_LAYER_OPTIONS = [
  { id: 'districts', label: 'Districts' },
  { id: 'roads', label: 'Roads' },
  { id: 'highway', label: 'Highway' },
  { id: 'expressway', label: 'Expressway' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'structures', label: 'Structures' },
  { id: 'airport', label: 'Airport' },
  { id: 'station', label: 'Station' },
  { id: 'metro', label: 'Metro' },
  { id: 'tolls', label: 'Tolls' },
  { id: 'parking', label: 'Parking' }
];
const DEFAULT_MAP_VIEWPORT = {
  zoom: 1,
  panX: 0,
  panY: 0
};
const MAP_ZOOM_STEP = 0.35;
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 4.5;
const EMPTY_TRANSPORT_STRUCTURE_MAP = {
  labels: [],
  portals: [],
  routes: []
};
const TRANSPORT_STRUCTURE_TARGETS = [
  { type: 'tunnel', u: 0.48 },
  { type: 'bridge', u: 0.62 }
];
const ROAD_SIDES = ['north', 'east', 'south', 'west'];
const SIDE_OFFSETS = {
  north: { chunkX: 0, chunkZ: -1 },
  east: { chunkX: 1, chunkZ: 0 },
  south: { chunkX: 0, chunkZ: 1 },
  west: { chunkX: -1, chunkZ: 0 }
};
const OPPOSITE_SIDE = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east'
};
const DISTRICT_LABELS = {
  commercial: { label: 'Commerce Row', shortLabel: 'COM' },
  downtown: { label: 'Downtown Core', shortLabel: 'DT' },
  harbor: { label: 'Harbor Fringe', shortLabel: 'HAR' },
  industrial: { label: 'Industrial Works', shortLabel: 'IND' },
  residential: { label: 'Garden Residential', shortLabel: 'RES' }
};
const DISTRICT_FEATURES = getDistrictFeatures();
const DISTRICT_LABEL_FEATURES = getDistrictLabelFeatures(DISTRICT_FEATURES);
const METRO_LINES = createMetroLines();

export function WorldMap({
  cooldownRemaining,
  isOpen,
  language = 'en',
  loadedChunks,
  mapClickMode = 'teleport',
  onClose,
  onClearNavigation,
  onCustomNavigate,
  onMapClickModeChange,
  onNavigate,
  onTeleport,
  onToggle,
  navigationDestinations = getDefaultNavigationDestinations(),
  navigationInfo = null,
  navigationRoute = null,
  navigationTarget = null,
  playerHeading = 0,
  playerPosition,
  status
}) {
  const [mapLayers, setMapLayers] = useState(DEFAULT_MAP_LAYERS);
  const [miniMapFollow, setMiniMapFollow] = useState(true);
  const [mapViewport, setMapViewport] = useState(DEFAULT_MAP_VIEWPORT);
  const playerMarkerStyle = getPlayerMarkerStyle(playerPosition, playerHeading);
  const miniMapPlayerMarkerStyle = getMiniMapPlayerMarkerStyle(playerPosition, playerHeading, miniMapFollow);
  const miniMapContentStyle = getMiniMapContentStyle(playerPosition, playerHeading, miniMapFollow);
  const worldMapContentStyle = getWorldMapContentStyle(mapViewport);
  const navigationRouteFeatures = getNavigationRouteFeatures(navigationRoute);
  const currentChunk = worldToChunkCoord(playerPosition);
  const loadedRoadFeatures = loadedChunks.flatMap(getLoadedRoadFeatures);
  const visibleLoadedRoadFeatures = loadedRoadFeatures.filter((feature) => (
    feature.type === 'parking' ? mapLayers.parking : mapLayers.roads
  ));
  const expresswayFeatures = getExpresswayFeatures();
  const expresswayLabels = getExpresswayLabels();
  const expresswayEntrances = getExpresswayEntrances();
  const transportHighwayFeatures = getTransportHighwayFeatures();
  const metroMapFeatures = mapLayers.metro ? getMetroMapFeatures() : { routes: [], stations: [] };
  const transportTolls = getTransportTollMarkers();
  const transportStructures = isOpen && mapLayers.structures
    ? getTransportStructureMapFeatures()
    : EMPTY_TRANSPORT_STRUCTURE_MAP;
  const districtFeatures = mapLayers.districts ? DISTRICT_FEATURES : [];
  const districtLabelFeatures = mapLayers.districts ? DISTRICT_LABEL_FEATURES : [];
  const terrainFeatures = mapLayers.terrain ? TERRAIN_LANDFORMS : [];
  const displayedDestinations = navigationDestinations.filter((entry) => shouldShowDestination(entry, mapLayers));
  const t = (key) => getText(language, key);

  const toggleLayer = (layerId) => {
    setMapLayers((previous) => ({
      ...previous,
      [layerId]: !previous[layerId]
    }));
  };

  const handleMapClick = (event) => {
    const position = getWorldPositionFromClick(event, mapViewport);

    if (mapClickMode === 'navigate') {
      onCustomNavigate?.(position);
      return;
    }

    onTeleport(position);
  };
  const handleMapWheel = (event) => {
    event.preventDefault();

    const direction = event.deltaY > 0 ? -1 : 1;
    zoomMap(direction * MAP_ZOOM_STEP);
  };
  const zoomMap = (delta) => {
    setMapViewport((previous) => clampMapViewport({
      ...previous,
      zoom: clamp(previous.zoom + delta, MAP_MIN_ZOOM, MAP_MAX_ZOOM)
    }));
  };
  const resetMapViewport = () => {
    setMapViewport(DEFAULT_MAP_VIEWPORT);
  };

  return (
    <>
      <button className="mini-map" type="button" onClick={onToggle} aria-label={t('openWorldMap')}>
        <div className="mini-map__surface">
          <span className="mini-map__content" style={miniMapContentStyle}>
            {districtFeatures.map((feature) => (
              <span
                key={`mini-district-${feature.id}`}
                className={`mini-map__district mini-map__district--${feature.type}`}
                style={getChunkStyle(feature.bounds)}
              />
            ))}
            {terrainFeatures.map((feature) => (
              <span
                key={`mini-landform-${feature.id}`}
                className={`mini-map__landform mini-map__landform--${feature.type}`}
                style={getLandformStyle(feature)}
              />
            ))}
            {navigationRouteFeatures.map((feature) => (
              <span
                key={`mini-nav-${feature.id}`}
                className="mini-map__navigation-route"
                style={getRoadFeatureStyle(feature)}
              />
            ))}
            {mapLayers.highway ? transportHighwayFeatures.map((feature) => (
              <span
                key={`mini-${feature.id}`}
                className="mini-map__transport-highway"
                style={getRoadFeatureStyle(feature)}
              />
            )) : null}
            {metroMapFeatures.routes.map((feature) => (
              <span
                key={`mini-${feature.id}`}
                className="mini-map__metro"
                style={getRoadFeatureStyle(feature)}
              />
            ))}
            {metroMapFeatures.stations.map((entry) => (
              <span
                key={`mini-metro-station-${entry.id}`}
                className="mini-map__metro-station"
                style={{ ...getMarkerStyle(entry.position), '--metro-color': entry.color }}
              />
            ))}
            {mapLayers.expressway ? expresswayFeatures.map((feature) => (
              <span
                key={`mini-${feature.id}`}
                className={`mini-map__expressway mini-map__expressway--${feature.kind}`}
                style={getRoadFeatureStyle(feature)}
              />
            )) : null}
            {mapLayers.tolls ? transportTolls.map((entry) => (
              <span
                key={`mini-toll-${entry.id}`}
                className="mini-map__toll"
                style={getMarkerStyle(entry.position)}
              />
            )) : null}
            {mapLayers.expressway ? expresswayEntrances.map((entry) => (
              <span
                key={`mini-entry-${entry.id}`}
                className="mini-map__entry"
                style={getMarkerStyle(entry.position)}
              />
            )) : null}
            {displayedDestinations.map((entry) => (
              <span
                key={`mini-destination-${entry.id}`}
                className={`mini-map__destination mini-map__destination--${entry.type}`}
                style={getMarkerStyle(entry.position)}
              />
            ))}
            {navigationTarget ? (
              <span
                className="mini-map__navigation-target"
                style={getMarkerStyle(navigationTarget.position)}
              />
            ) : null}
          </span>
          <span className="mini-map__dot" style={miniMapPlayerMarkerStyle}>
            <span className="map-player-heading" />
          </span>
        </div>
        <span className="mini-map__status">
          <span className="mini-map__mode">{miniMapFollow ? t('follow') : t('map')}</span>
          {navigationInfo ? (
            <span className={`mini-map__maneuver mini-map__maneuver--${navigationInfo.maneuverType ?? 'straight'}`}>
              <span className="mini-map__maneuver-icon" aria-hidden="true" />
              <span className="mini-map__maneuver-text">
                {navigationInfo.nextTurnDistanceLabel ?? navigationInfo.distanceLabel}
              </span>
            </span>
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <section className="world-map-overlay" aria-label={t('worldMap')}>
          <div className="world-map-panel">
            <header className="world-map-header">
              <div>
                <h2>{t('worldMap')}</h2>
                <p>
                  {currentChunk
                    ? `${t('chunk')} ${currentChunk.chunkX}:${currentChunk.chunkZ}`
                    : t('outsideWorld')}
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label={t('close')}>
                {t('close')}
              </button>
            </header>

            <div className="world-map-body">
              <div className="world-map-canvas">
                <div
                  className="world-map-surface"
                  role="button"
                  tabIndex={0}
                  onClick={handleMapClick}
                  onWheel={handleMapWheel}
                  aria-label={mapClickMode === 'navigate' ? t('setNav') : t('teleport')}
                >
                  <span className="world-map-content" style={worldMapContentStyle}>
                    {MAP_FEATURES.filter((feature) => shouldShowMapFeature(feature, mapLayers)).map((feature) => (
                      <span
                        key={feature.id}
                        className={`world-map-feature world-map-feature--${feature.type}`}
                        style={getFeatureStyle(feature)}
                      >
                        <span>{feature.label}</span>
                      </span>
                    ))}
                    {districtFeatures.map((feature) => (
                      <span
                        key={feature.id}
                        className={`world-map-district world-map-district--${feature.type}`}
                        style={getChunkStyle(feature.bounds)}
                      />
                    ))}
                    {terrainFeatures.map((feature) => (
                      <span
                        key={feature.id}
                        className={`world-map-landform world-map-landform--${feature.type}`}
                        style={getLandformStyle(feature)}
                      >
                        <span>{feature.label}</span>
                      </span>
                    ))}
                    {loadedChunks.map((chunk) => (
                      <span
                        key={chunk.key}
                        className="world-map-loaded-chunk"
                        style={getChunkStyle(chunk.bounds)}
                      />
                    ))}
                    {visibleLoadedRoadFeatures.map((feature) => (
                      <span
                        key={feature.id}
                        className={`world-map-road world-map-road--${feature.type}`}
                        style={getRoadFeatureStyle(feature)}
                      />
                    ))}
                    {districtLabelFeatures.map((feature) => (
                      <span
                        key={`${feature.id}-label`}
                        className={`world-map-district-label world-map-district-label--${feature.type}`}
                        style={getDistrictLabelStyle(feature)}
                      >
                        {getDistrictShortLabel(language, feature.type, feature.shortLabel)}
                      </span>
                    ))}
                    {mapLayers.highway ? transportHighwayFeatures.map((feature) => (
                      <span
                        key={feature.id}
                        className="world-map-transport-highway"
                        style={getRoadFeatureStyle(feature)}
                      />
                    )) : null}
                    {mapLayers.expressway ? expresswayFeatures.map((feature) => (
                      <span
                        key={feature.id}
                        className={`world-map-expressway world-map-expressway--${feature.kind}`}
                        style={getRoadFeatureStyle(feature)}
                      />
                    )) : null}
                    {metroMapFeatures.routes.map((feature) => (
                      <span
                        key={feature.id}
                        className="world-map-metro"
                        style={getRoadFeatureStyle(feature)}
                      />
                    ))}
                    {metroMapFeatures.stations.map((entry) => (
                      <span
                        key={entry.id}
                        className="world-map-metro-station"
                        style={{ ...getMarkerStyle(entry.position), '--metro-color': entry.color }}
                      >
                        {entry.label}
                      </span>
                    ))}
                    {transportStructures.routes.map((feature) => (
                      <span
                        key={feature.id}
                        className={`world-map-structure world-map-structure--${feature.structure} world-map-structure--${feature.part}`}
                        style={getRoadFeatureStyle(feature)}
                      />
                    ))}
                    {transportStructures.portals.map((entry) => (
                      <span
                        key={entry.id}
                        className="world-map-structure-portal"
                        style={getMarkerStyle(entry.position)}
                      />
                    ))}
                    {navigationRouteFeatures.map((feature) => (
                      <span
                        key={`world-nav-${feature.id}`}
                        className="world-map-navigation-route"
                        style={getRoadFeatureStyle(feature)}
                      />
                    ))}
                    {mapLayers.expressway ? expresswayLabels.map((label) => (
                      <span
                        key={label.id}
                        className="world-map-expressway-label"
                        style={getMarkerStyle(label.position)}
                      >
                        {label.label}
                      </span>
                    )) : null}
                    {transportStructures.labels.map((label) => (
                      <span
                        key={label.id}
                        className={`world-map-structure-label world-map-structure-label--${label.type}`}
                        style={getMarkerStyle(label.position)}
                      >
                        {getStructureLabel(language, label.type)}
                      </span>
                    ))}
                    {mapLayers.expressway ? expresswayEntrances.map((entry) => (
                      <span
                        key={entry.id}
                        className="world-map-expressway-entry"
                        style={getMarkerStyle(entry.position)}
                      >
                        {entry.label}
                      </span>
                    )) : null}
                    {mapLayers.tolls ? transportTolls.map((entry) => (
                      <span
                        key={entry.id}
                        className="world-map-transport-toll"
                        style={getMarkerStyle(entry.position)}
                      >
                        {entry.label}
                      </span>
                    )) : null}
                    {displayedDestinations.map((entry) => (
                      <span
                        key={`world-destination-${entry.id}`}
                        className={`world-map-destination world-map-destination--${entry.type} ${
                          navigationTarget?.id === entry.id ? 'world-map-destination--active' : ''
                        }`}
                        style={getMarkerStyle(entry.position)}
                      >
                        {getDestinationShortLabel(language, entry)}
                      </span>
                    ))}
                    {navigationTarget ? (
                      <span
                        className="world-map-navigation-target"
                        style={getMarkerStyle(navigationTarget.position)}
                      />
                    ) : null}
                    <span className="world-map-player" style={playerMarkerStyle}>
                      <span className="map-player-heading" />
                      <span className="world-map-player__label">{t('you')}</span>
                    </span>
                  </span>
                </div>
                <div className="world-map-zoom-controls" aria-label={t('mapZoomControls')}>
                  <button type="button" onClick={() => zoomMap(MAP_ZOOM_STEP)}>+</button>
                  <button type="button" onClick={() => zoomMap(-MAP_ZOOM_STEP)}>-</button>
                  <button type="button" onClick={resetMapViewport}>{Math.round(mapViewport.zoom * 100)}%</button>
                </div>
                {mapLayers.districts ? (
                  <div className="world-map-district-legend" aria-label={t('districts')}>
                    <span><i className="world-map-district-key world-map-district-key--residential" /> {t('districtResidential')}</span>
                    <span><i className="world-map-district-key world-map-district-key--industrial" /> {t('districtIndustrial')}</span>
                  </div>
                ) : null}
              </div>

              <aside className="world-map-navigation" aria-label={t('navigationDestinations')}>
                <h3>{t('navigation')}</h3>
                <div className="world-map-click-mode" role="group" aria-label={t('mapClickAction')}>
                  <button
                    type="button"
                    className={mapClickMode === 'navigate' ? 'is-active' : undefined}
                    onClick={() => onMapClickModeChange?.('navigate')}
                  >
                    {t('setNav')}
                  </button>
                  <button
                    type="button"
                    className={mapClickMode === 'teleport' ? 'is-active' : undefined}
                    onClick={() => onMapClickModeChange?.('teleport')}
                  >
                    {t('teleport')}
                  </button>
                </div>
                <div className="world-map-navigation__list">
                  {navigationDestinations.map((destination) => (
                    <button
                      key={destination.id}
                      type="button"
                      className={navigationTarget?.id === destination.id ? 'is-active' : undefined}
                      onClick={() => onNavigate?.(destination)}
                    >
                      <span>{getDestinationLabel(language, destination)}</span>
                      <strong>{formatDistance(getPlanarDistance(playerPosition, destination.position))}</strong>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="world-map-navigation__clear"
                  onClick={onClearNavigation}
                  disabled={!navigationTarget}
                >
                  {t('clearRoute')}
                </button>
                <button
                  type="button"
                  className="world-map-navigation__clear"
                  onClick={() => setMiniMapFollow((value) => !value)}
                >
                  {t('mini')}: {miniMapFollow ? t('follow') : t('north')}
                </button>
                <div className="world-map-layers" aria-label={t('mapLayers')}>
                  <h3>{t('mapLayers')}</h3>
                  <div className="world-map-layers__list">
                    {MAP_LAYER_OPTIONS.map((layer) => (
                      <label key={layer.id}>
                        <input
                          type="checkbox"
                          checked={mapLayers[layer.id]}
                          onChange={() => toggleLayer(layer.id)}
                        />
                        <span>{getMapLayerText(language, layer.id)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <footer className="world-map-footer">
              <div>
                <span>X</span>
                <strong>{formatCoord(playerPosition.x)}</strong>
              </div>
              <div>
                <span>Z</span>
                <strong>{formatCoord(playerPosition.z)}</strong>
              </div>
              <div>
                <span>{t('cooldown')}</span>
                <strong>{cooldownRemaining > 0 ? `${cooldownRemaining.toFixed(1)}s` : t('ready')}</strong>
              </div>
              <div className="world-map-status">
                <span>{t('status')}</span>
                <strong>{status}</strong>
              </div>
            </footer>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function getDefaultNavigationDestinations() {
  return [
    {
      id: 'downtown',
      label: WORLD_SETTINGS.teleportAnchors.downtown.label,
      shortLabel: 'Start',
      type: 'spawn',
      position: {
        x: WORLD_SETTINGS.teleportAnchors.downtown.position[0],
        y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
        z: WORLD_SETTINGS.teleportAnchors.downtown.position[2]
      }
    },
    {
      id: 'airport-terminal',
      label: 'Airport Terminal',
      shortLabel: 'Airport',
      type: 'airport',
      position: {
        x: TRANSPORT_HUBS.airport.spawn.x,
        y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
        z: TRANSPORT_HUBS.airport.spawn.z
      }
    },
    {
      id: 'train-station',
      label: 'Train Station',
      shortLabel: 'Station',
      type: 'station',
      position: {
        x: TRANSPORT_HUBS.trainStation.spawn.x,
        y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
        z: TRANSPORT_HUBS.trainStation.spawn.z
      }
    },
    ...TRANSPORT_HIGHWAY.tolls.map((toll) => ({
      id: toll.id,
      label: toll.label,
      shortLabel: 'Toll',
      type: 'toll',
      position: {
        x: toll.point.x,
        y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
        z: toll.point.z
      }
    })),
    ...getMetroNavigationDestinations(),
    ...getDefaultTransportStructureDestinations()
  ];
}

function getMetroNavigationDestinations() {
  return getMetroStations().map((station) => ({
    id: `metro-${station.id}`,
    label: 'Metro Station',
    shortLabel: 'Metro',
    type: 'metro',
    position: {
      x: station.position.x,
      y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
      z: station.position.z
    }
  }));
}

function getMetroMapFeatures() {
  return {
    routes: METRO_LINES.flatMap((line) => (
      line.points.slice(0, -1).map((point, index) => ({
        ...createRouteFeature(
          `metro-${line.id}-route-${index}`,
          point,
          line.points[index + 1],
          32,
          'metro'
        ),
        color: line.color
      }))
    )),
    stations: getMetroStations()
  };
}

function getMetroStations() {
  return METRO_LINES.flatMap((line) => (
    line.stations.map((station) => ({
      ...station,
      color: line.color,
      position: getMetroStationMapPosition(line, station)
    }))
  ));
}

function getMetroStationMapPosition(line, station) {
  const basePoint = station.point ?? getMetroLinePointAtT(line, station.t);
  const offset = station.mapOffset ?? { x: 0, z: 0 };

  return {
    x: basePoint.x + (offset.x ?? 0),
    z: basePoint.z + (offset.z ?? 0)
  };
}

function createMetroLines() {
  return METRO_LINE_DEFINITIONS.map((definition) => ({
    id: definition.id,
    color: definition.color,
    points: definition.smooth === false
      ? definition.controlPoints.map((point) => ({ ...point }))
      : createSmoothMetroLinePoints(definition.controlPoints, definition.samplesPerSegment ?? 3),
    stations: definition.stations.map((station) => ({
      ...station,
      label: station.label ?? 'Metro',
      point: station.point ? { ...station.point } : undefined,
      mapOffset: station.mapOffset ? { ...station.mapOffset } : undefined
    }))
  }));
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

function getMetroLinePointAtT(line, t) {
  const routeLength = getMetroLineLength(line);
  let remaining = routeLength * clamp(t, 0, 1);

  for (let index = 0; index < line.points.length - 1; index += 1) {
    const start = line.points[index];
    const end = line.points[index + 1];
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    if (length <= 0.001) continue;

    if (remaining <= length || index === line.points.length - 2) {
      const localT = clamp(remaining / length, 0, 1);

      return {
        x: start.x + (end.x - start.x) * localT,
        z: start.z + (end.z - start.z) * localT
      };
    }

    remaining -= length;
  }

  return line.points[0] ?? { x: 0, z: 0 };
}

function getMetroLineLength(line) {
  return line.points.slice(0, -1).reduce((length, point, index) => (
    length + Math.hypot(line.points[index + 1].x - point.x, line.points[index + 1].z - point.z)
  ), 0);
}

function getDefaultTransportStructureDestinations() {
  return getTransportStructureMapFeatures().labels.map((label) => ({
    id: label.id,
    label: label.type === 'bridge' ? 'Ground Road Highway Overpass' : 'Ground Road Underpass',
    shortLabel: label.type === 'bridge' ? 'Road Bridge' : 'Underpass',
    type: label.type,
    position: {
      x: label.position.x,
      y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
      z: label.position.z
    }
  }));
}

function getWorldPositionFromClick(event, viewport = DEFAULT_MAP_VIEWPORT) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;
  const localX = event.clientX - bounds.left;
  const localY = event.clientY - bounds.top;
  const contentX = ((localX - centerX - viewport.panX) / viewport.zoom) + centerX;
  const contentY = ((localY - centerY - viewport.panY) / viewport.zoom) + centerY;
  const xRatio = clamp(contentX / bounds.width, 0, 1);
  const zRatio = clamp(contentY / bounds.height, 0, 1);

  return {
    x: WORLD_SETTINGS.worldMinX + xRatio * WORLD_SETTINGS.worldWidth,
    y: WORLD_SETTINGS.teleportAnchors.downtown.position[1],
    z: WORLD_SETTINGS.worldMinZ + zRatio * WORLD_SETTINGS.worldHeight
  };
}

function getMarkerStyle(position) {
  return {
    left: `${getWorldXPercent(position.x)}%`,
    top: `${getWorldZPercent(position.z)}%`
  };
}

function getPlayerMarkerStyle(position, heading) {
  return {
    ...getMarkerStyle(position),
    '--player-heading': `${getMapHeading(heading)}rad`
  };
}

function getMiniMapPlayerMarkerStyle(position, heading, follow) {
  if (follow) {
    return {
      left: '50%',
      top: '50%',
      '--player-heading': '0rad'
    };
  }

  return getPlayerMarkerStyle(position, heading);
}

function getMiniMapContentStyle(position, heading, follow) {
  if (!follow) return {};

  return {
    transform: [
      'translate(50%, 50%)',
      `rotate(${-getMapHeading(heading)}rad)`,
      'scale(2.15)',
      `translate(${-getWorldXPercent(position.x)}%, ${-getWorldZPercent(position.z)}%)`
    ].join(' ')
  };
}

function getMapHeading(heading) {
  return Number.isFinite(heading) ? Math.PI - heading : 0;
}

function getWorldMapContentStyle(viewport) {
  return {
    transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`
  };
}

function clampMapViewport(viewport) {
  const zoom = clamp(viewport.zoom, MAP_MIN_ZOOM, MAP_MAX_ZOOM);
  const maxPan = 420 * zoom;

  return {
    zoom,
    panX: clamp(viewport.panX, -maxPan, maxPan),
    panY: clamp(viewport.panY, -maxPan, maxPan)
  };
}

function getChunkStyle(bounds) {
  return {
    left: `${getWorldXPercent(bounds.minX)}%`,
    top: `${getWorldZPercent(bounds.minZ)}%`,
    width: `${bounds.size / WORLD_SETTINGS.worldWidth * 100}%`,
    height: `${bounds.size / WORLD_SETTINGS.worldHeight * 100}%`
  };
}

function getFeatureStyle(feature) {
  if (feature.bounds) {
    return {
      left: `${getWorldXPercent(feature.bounds.minX)}%`,
      top: `${getWorldZPercent(feature.bounds.minZ)}%`,
      width: `${(feature.bounds.maxX - feature.bounds.minX) / WORLD_SETTINGS.worldWidth * 100}%`,
      height: `${(feature.bounds.maxZ - feature.bounds.minZ) / WORLD_SETTINGS.worldHeight * 100}%`
    };
  }

  const diameter = feature.radius * 2;

  return {
    left: `${getWorldXPercent(feature.center.x)}%`,
    top: `${getWorldZPercent(feature.center.z)}%`,
    width: `${diameter / WORLD_SETTINGS.worldWidth * 100}%`,
    height: `${diameter / WORLD_SETTINGS.worldHeight * 100}%`,
    transform: 'translate(-50%, -50%)'
  };
}

function getLandformStyle(feature) {
  return getFeatureStyle(feature);
}

function getDistrictLabelStyle(feature) {
  if (feature.position) return getMarkerStyle(feature.position);

  return getMarkerStyle({
    x: (feature.bounds.minX + feature.bounds.maxX) / 2,
    z: (feature.bounds.minZ + feature.bounds.maxZ) / 2
  });
}

function getDistrictLabelFeatures(features) {
  const groups = new Map();

  for (const feature of features) {
    if (!feature.showLabel) continue;

    const current = groups.get(feature.type) ?? {
      ...feature,
      id: `district-label-${feature.type}`,
      centerXTotal: 0,
      centerZTotal: 0,
      count: 0
    };

    current.centerXTotal += (feature.bounds.minX + feature.bounds.maxX) / 2;
    current.centerZTotal += (feature.bounds.minZ + feature.bounds.maxZ) / 2;
    current.count += 1;
    groups.set(feature.type, current);
  }

  return [...groups.values()].map((feature) => ({
    ...feature,
    position: {
      x: feature.centerXTotal / feature.count,
      z: feature.centerZTotal / feature.count
    }
  }));
}

function getDistrictFeatures() {
  const features = [];

  for (let chunkZ = WORLD_SETTINGS.minChunkZ; chunkZ <= WORLD_SETTINGS.maxChunkZ; chunkZ += 1) {
    for (let chunkX = WORLD_SETTINGS.minChunkX; chunkX <= WORLD_SETTINGS.maxChunkX; chunkX += 1) {
      const type = getMapDistrictType(chunkX, chunkZ);

      if (!type) continue;

      const labels = DISTRICT_LABELS[type] ?? DISTRICT_LABELS.commercial;

      features.push({
        id: `district-${chunkX}:${chunkZ}`,
        type,
        label: labels.label,
        shortLabel: labels.shortLabel,
        showLabel: type === 'residential' || type === 'industrial',
        chunkX,
        chunkZ,
        bounds: getChunkBounds(chunkX, chunkZ)
      });
    }
  }

  return features;
}

function getMapDistrictType(chunkX, chunkZ) {
  if (!canChunkHaveDistrict(chunkX, chunkZ)) return null;
  if (isHarborFringeChunk(chunkX, chunkZ)) return 'harbor';

  const centerDistance = Math.hypot(chunkX, chunkZ);
  if (centerDistance <= 1.45) return 'downtown';

  const roll = hashNumber(chunkX, chunkZ, 934);
  const connections = getAlignedConnections(chunkX, chunkZ);
  const connectedRoadCount = countConnections(connections);
  const roadType = getRoadType(connections);

  if ((chunkX <= -2 && chunkZ >= 0) || (centerDistance > 3.2 && roll < 0.2)) {
    return 'industrial';
  }

  if (connectedRoadCount >= 3 || roadType === 'cross' || roadType === 't') {
    return roll > 0.26 ? 'commercial' : 'residential';
  }

  if (roll > 0.54) return 'residential';
  if (roll < 0.28 && centerDistance > 2.4) return 'industrial';
  return 'commercial';
}

function getAlignedConnections(chunkX, chunkZ) {
  const own = getDesiredConnections(chunkX, chunkZ);
  const connections = makeConnections([]);

  for (const side of ROAD_SIDES) {
    const neighbor = getNeighborChunkCoord(chunkX, chunkZ, side);

    if (!neighbor || !canChunkHaveDistrict(neighbor.chunkX, neighbor.chunkZ)) {
      connections[side] = false;
      continue;
    }

    const neighborDesired = getDesiredConnections(neighbor.chunkX, neighbor.chunkZ);
    connections[side] = own[side] || neighborDesired[OPPOSITE_SIDE[side]];
  }

  return enforceMinimumConnections(connections, chunkX, chunkZ);
}

function getDesiredConnections(chunkX, chunkZ) {
  return normalizeDesiredConnections(makeConnections(ROAD_SIDES), chunkX, chunkZ, getChunkSeed(chunkX, chunkZ));
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

function enforceMinimumConnections(connections, chunkX, chunkZ) {
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

function getNeighborChunkCoord(chunkX, chunkZ, side) {
  const offset = SIDE_OFFSETS[side];
  const neighbor = {
    chunkX: chunkX + offset.chunkX,
    chunkZ: chunkZ + offset.chunkZ
  };

  return isMapChunkInsideWorld(neighbor.chunkX, neighbor.chunkZ) ? neighbor : null;
}

function hasNeighborForSide(chunkX, chunkZ, side) {
  const neighbor = getNeighborChunkCoord(chunkX, chunkZ, side);

  return Boolean(neighbor && canChunkHaveDistrict(neighbor.chunkX, neighbor.chunkZ));
}

function canChunkHaveDistrict(chunkX, chunkZ) {
  return !isOceanCrossingChunk(chunkX, chunkZ) &&
    !isHarborIslandChunk(chunkX, chunkZ) &&
    !isTransportHubChunk(chunkX, chunkZ);
}

function isMapChunkInsideWorld(chunkX, chunkZ) {
  return chunkX >= WORLD_SETTINGS.minChunkX &&
    chunkX <= WORLD_SETTINGS.maxChunkX &&
    chunkZ >= WORLD_SETTINGS.minChunkZ &&
    chunkZ <= WORLD_SETTINGS.maxChunkZ;
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

function isOceanCrossingChunk(chunkX, chunkZ) {
  return chunkZ === 1 && chunkX >= 2 && chunkX <= 5;
}

function isHarborIslandChunk(chunkX, chunkZ) {
  return chunkX === 5 && chunkZ === 1;
}

function isHarborFringeChunk(chunkX, chunkZ) {
  return chunkX >= 2 && chunkX <= 5 && (chunkZ === 0 || chunkZ === 2);
}

function isTransportHubChunk(chunkX, chunkZ) {
  const bounds = getChunkBounds(chunkX, chunkZ);

  return Object.values(TRANSPORT_HUBS).some((hub) => doBoundsOverlap(bounds, hub.bounds));
}

function doBoundsOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function getChunkSeed(chunkX, chunkZ) {
  return Math.floor(hashNumber(chunkX, chunkZ, 911) * 1000000000);
}

function hashNumber(x, z, salt) {
  const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function getLoadedRoadFeatures(chunk) {
  const features = [];

  for (const road of chunk.roads ?? []) {
    if (road.axis === 'segment') {
      features.push(createRouteFeature(
        `${chunk.key}:road:${road.id}`,
        { x: road.startX, z: road.startZ },
        { x: road.endX, z: road.endZ },
        road.surface?.width ?? road.visualScale?.[1] ?? road.width,
        normalizeRoadType(road.roadType)
      ));
      continue;
    }

    features.push({
      id: `${chunk.key}:road:${road.id}`,
      type: normalizeRoadType(road.roadType),
      minX: road.minX,
      maxX: road.maxX,
      minZ: road.minZ,
      maxZ: road.maxZ
    });
  }

  return features.filter(Boolean);
}

function getExpresswayFeatures() {
  const features = [];

  for (const route of EXPRESSWAY_MAP.routes) {
    const points = getExpresswayRoutePoints(route);

    for (let index = 0; index < points.length - 1; index += 1) {
      features.push(createRouteFeature(
        `${route.id}-deck-${index}`,
        points[index],
        points[index + 1],
        EXPRESSWAY_MAP.deckWidth,
        'deck'
      ));
    }

    for (const ramp of getExpresswayRampPaths(route)) {
      for (let index = 0; index < ramp.path.length - 1; index += 1) {
        features.push(createRouteFeature(
          `${route.id}-${ramp.id}-ramp-${index}`,
          ramp.path[index],
          ramp.path[index + 1],
          EXPRESSWAY_MAP.rampWidth,
          'ramp'
        ));
      }
    }
  }

  return features;
}

function getExpresswayLabels() {
  return EXPRESSWAY_MAP.routes
    .filter((route) => route.showLabel !== false)
    .map((route) => ({
      id: `${route.id}-label`,
      label: route.label,
      position: getRouteMidpoint(route)
    }));
}

function getExpresswayEntrances() {
  return EXPRESSWAY_MAP.routes.flatMap((route) => {
    return getExpresswayRampPaths(route).map((ramp) => ({
      id: `${route.id}-${ramp.id}`,
      label: ramp.label,
      position: ramp.ground
    }));
  });
}

function getTransportHighwayFeatures() {
  const features = [];

  for (let index = 0; index < TRANSPORT_HIGHWAY.points.length - 1; index += 1) {
    features.push(createRouteFeature(
      `${TRANSPORT_HIGHWAY.id}-${index}`,
      TRANSPORT_HIGHWAY.points[index],
      TRANSPORT_HIGHWAY.points[index + 1],
      TRANSPORT_HIGHWAY.width,
      'highway'
    ));
  }

  return features;
}

function getTransportTollMarkers() {
  return TRANSPORT_HIGHWAY.tolls.map((toll) => ({
    id: toll.id,
    label: toll.label,
    position: toll.point
  }));
}

let cachedTransportStructureMapFeatures = null;

function getTransportStructureMapFeatures() {
  if (cachedTransportStructureMapFeatures) return cachedTransportStructureMapFeatures;

  const routes = [];
  const labels = new Map();
  const portals = [];
  const seenPortals = new Set();
  const seenRoads = new Set();

  for (const { chunkX, chunkZ } of getTransportStructureSampleChunks()) {
    const chunk = getChunkData(chunkX, chunkZ);
    if (!chunk) continue;

    for (const road of chunk.roads ?? []) {
      const structure = getTransportRoadStructure(road);
      if (!structure || seenRoads.has(road.id)) continue;
      seenRoads.add(road.id);

      if (road.axis !== 'segment' || !hasRoadSegmentEndpoints(road)) continue;

      const part = getTransportStructurePart(road.kind, structure);
      const feature = createRouteFeature(
        `structure:${road.id}`,
        { x: road.startX, z: road.startZ },
        { x: road.endX, z: road.endZ },
        road.surface?.width ?? road.visualScale?.[1] ?? road.width,
        structure
      );

      routes.push({
        ...feature,
        part,
        structure
      });

      if (part === 'deck' || part === 'tunnel') {
        const baseId = getTransportStructureBaseId(road.id);

        labels.set(baseId, {
          id: `structure-label:${baseId}`,
          type: structure,
          position: { x: road.centerX, z: road.centerZ }
        });
      }
    }

    for (const zone of chunk.tunnelZones ?? []) {
      if (zone.kind !== 'transport-underpass') continue;

      for (const [portalId, point] of [['entry', zone.tunnelStart], ['exit', zone.tunnelEnd]]) {
        if (!point) continue;

        const id = `${zone.id}:${portalId}`;
        if (seenPortals.has(id)) continue;

        seenPortals.add(id);
        portals.push({
          id,
          position: point
        });
      }
    }
  }

  cachedTransportStructureMapFeatures = {
    labels: [...labels.values()],
    portals,
    routes
  };

  return cachedTransportStructureMapFeatures;
}

function getTransportStructureSampleChunks() {
  const chunks = new Map();

  for (const target of TRANSPORT_STRUCTURE_TARGETS) {
    const position = getTransportHighwayPointAt(target.u);
    const coord = worldToChunkCoord(position);
    if (!coord) continue;

    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const chunkX = coord.chunkX + dx;
        const chunkZ = coord.chunkZ + dz;
        if (!isChunkCoordInsideWorld(chunkX, chunkZ)) continue;

        chunks.set(`${chunkX}:${chunkZ}`, { chunkX, chunkZ });
      }
    }
  }

  return [...chunks.values()];
}

function getTransportHighwayPointAt(u) {
  const points = TRANSPORT_HIGHWAY.points;
  const start = points[0];
  const end = points[points.length - 1];
  const t = clamp(u, 0, 1);

  return {
    x: start.x + (end.x - start.x) * t,
    z: start.z + (end.z - start.z) * t
  };
}

function getTransportRoadStructure(road) {
  if (typeof road?.kind !== 'string') return null;
  if (road.kind.startsWith('transport-overpass')) return 'bridge';
  if (road.kind.startsWith('transport-underpass')) return 'tunnel';
  return null;
}

function getTransportStructurePart(kind, structure) {
  if (kind.endsWith('-deck')) return 'deck';
  if (kind.endsWith('-tunnel')) return 'tunnel';
  if (kind.endsWith('-ramp')) return 'ramp';
  if (kind.endsWith('-approach')) return 'approach';
  return structure;
}

function getTransportStructureBaseId(id) {
  return String(id).replace(/-(approach-start|approach-end|up|down|deck|tunnel)$/, '');
}

function hasRoadSegmentEndpoints(road) {
  return Number.isFinite(road.startX) &&
    Number.isFinite(road.startZ) &&
    Number.isFinite(road.endX) &&
    Number.isFinite(road.endZ);
}

function getStructureLabel(language, type) {
  if (language === 'zh') {
    return type === 'bridge' ? '跨高速桥' : '下穿隧道';
  }

  return type === 'bridge' ? 'OVERPASS' : 'UNDERPASS';
}

function createRouteFeature(id, start, end, width, kind) {
  return {
    id,
    kind,
    type: kind,
    centerX: (start.x + end.x) / 2,
    centerZ: (start.z + end.z) / 2,
    length: Math.hypot(end.x - start.x, end.z - start.z),
    rotation: Math.atan2(end.z - start.z, end.x - start.x),
    width
  };
}

function getRouteMidpoint(route) {
  const points = getExpresswayRoutePoints(route);
  const middleIndex = Math.floor((points.length - 1) / 2);

  return {
    x: (points[middleIndex].x + points[middleIndex + 1].x) / 2,
    z: (points[middleIndex].z + points[middleIndex + 1].z) / 2
  };
}

function getRoadFeatureStyle(feature) {
  if (Number.isFinite(feature.centerX) && Number.isFinite(feature.centerZ)) {
    return {
      '--metro-color': feature.color,
      left: `${getWorldXPercent(feature.centerX)}%`,
      top: `${getWorldZPercent(feature.centerZ)}%`,
      width: `${feature.length / WORLD_SETTINGS.worldWidth * 100}%`,
      height: `${feature.width / WORLD_SETTINGS.worldHeight * 100}%`,
      transform: `translate(-50%, -50%) rotate(${feature.rotation}rad)`,
      transformOrigin: '50% 50%'
    };
  }

  return {
    left: `${getWorldXPercent(feature.minX)}%`,
    top: `${getWorldZPercent(feature.minZ)}%`,
    width: `${(feature.maxX - feature.minX) / WORLD_SETTINGS.worldWidth * 100}%`,
    height: `${(feature.maxZ - feature.minZ) / WORLD_SETTINGS.worldHeight * 100}%`
  };
}

function normalizeRoadType(roadType) {
  if (roadType === 'highway' || roadType === 'elevatedHighway' || roadType === 'ramp') return 'highway';
  if (roadType === 'mainRoad' || roadType === 'main') return 'main';
  if (roadType === 'parking') return 'parking';
  return 'local';
}

function getTrafficVehicleMarkers(chunk) {
  return (chunk.trafficVehicles ?? []).map((vehicle) => ({
    id: `${chunk.key}:${vehicle.id}`,
    parked: vehicle.speed === 0,
    position: getTrafficVehicleMarkerPosition(vehicle)
  }));
}

function getTrafficVehicleMarkerPosition(vehicle) {
  const points = Array.isArray(vehicle.path?.points) && vehicle.path.points.length >= 2
    ? vehicle.path.points
    : [
        { x: vehicle.path?.startX ?? 0, z: vehicle.path?.startZ ?? 0 },
        { x: vehicle.path?.endX ?? 0, z: vehicle.path?.endZ ?? 0 }
      ];
  const midpoint = points[Math.floor(points.length / 2)];

  return {
    x: midpoint.x,
    z: midpoint.z
  };
}

function shouldShowDestination(entry, mapLayers) {
  if (entry.type === 'airport') return mapLayers.airport;
  if (entry.type === 'station') return mapLayers.station;
  if (entry.type === 'metro') return mapLayers.metro;
  if (entry.type === 'toll') return mapLayers.tolls;
  if (entry.type === 'bridge' || entry.type === 'tunnel') return mapLayers.structures;
  return true;
}

function shouldShowMapFeature(feature, mapLayers) {
  if (feature.type === 'airport') return mapLayers.airport;
  if (feature.type === 'station') return mapLayers.station;
  return true;
}

function getWorldXPercent(x) {
  return clamp((x - WORLD_SETTINGS.worldMinX) / WORLD_SETTINGS.worldWidth, 0, 1) * 100;
}

function getWorldZPercent(z) {
  return clamp((z - WORLD_SETTINGS.worldMinZ) / WORLD_SETTINGS.worldHeight, 0, 1) * 100;
}

function formatCoord(value) {
  return Number.isFinite(value) ? value.toFixed(0) : '--';
}

function formatDistance(distance) {
  if (!Number.isFinite(distance)) return '--';
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
  return `${Math.round(distance)} m`;
}

function getPlanarDistance(a, b) {
  if (!a || !b) return Number.NaN;

  return Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.z ?? 0) - (a.z ?? 0));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
