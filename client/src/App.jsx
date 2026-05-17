import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CAR_CONFIG } from './features/vehicle/carConfig.js';
import { useMultiplayerClient } from './features/network/useMultiplayerClient.js';
import { createNavigationRoute, getNavigationInfoForRoute } from './features/navigation/navigationRoutes.js';
import { ChunkManager, getDebugTunnelSample, getSafeTeleportPosition } from './features/world/ChunkManager.js';
import { WorldMap, getDefaultNavigationDestinations } from './features/world/WorldMap.jsx';
import { getTunnelStatus } from './features/world/tunnelState.js';
import { TRANSPORT_HIGHWAY, TRANSPORT_HUBS, worldToChunkCoord } from './features/world/worldConfig.js';
import { WEATHER_SEQUENCE, getWeatherPreset } from './features/weather/weatherPresets.js';
import { COLLISION_LIMIT, COUNTDOWN_LABELS, GAME_TIME_LIMIT_MS, RACE_CHECKPOINTS } from './features/race/raceConfig.js';
import { calculateRaceScore, createInitialGameState, formatRaceTime, getPlanarDistance, isCheckpointReached, readBestTime, writeBestTime } from './features/race/raceState.js';
import { GameOverlay } from './features/ui/GameOverlay.jsx';
import { VirtualControls } from './features/ui/VirtualControls.jsx';
import {
  getCheckpointText,
  getDestinationShortLabel,
  getFailReasonText,
  getGamePhaseText,
  getLanguageName,
  getNextLanguage,
  getQualityText,
  getSurfaceTypeText,
  getText,
  getTransportPhaseText,
  getTransportRouteText,
  getWeatherText,
  readLanguagePreference,
  writeLanguagePreference
} from './features/ui/language.js';

const GameScene = lazy(() => import('./features/scene/GameScene.jsx'));

const TELEPORT_COOLDOWN_MS = 3000;
const CURRENT_ROOM_ID = 'default';
const RACE_MODE_STORAGE_KEY = 'game4:raceModeEnabled';
const CAMERA_MODE_STORAGE_KEY = 'game4:cameraMode';
const NIGHT_MODE_STORAGE_KEY = 'game4:nightMode';
const WEATHER_MODE_STORAGE_KEY = 'game4:weatherMode';
const MAP_CLICK_MODE_STORAGE_KEY = 'game4:mapClickMode';
const GROUND_NAVIGATION_GUIDE_STORAGE_KEY = 'game4:groundNavigationGuide';
const QUALITY_MODE_STORAGE_KEY = 'game4:qualityMode';
const CARGO_BEST_STORAGE_KEY = 'game4:cargoBestMs';
const neutralTouchInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  reset: false,
  nitro: false,
  handbrake: false
};
const safeSpawn = getSafeTeleportPosition(CAR_CONFIG.spawn.position);
const spawnPosition = { x: safeSpawn.x, y: safeSpawn.y, z: safeSpawn.z };
const playerVehicleConfig = {
  ...CAR_CONFIG,
  spawn: {
    position: spawnPosition,
    heading: safeSpawn.heading ?? CAR_CONFIG.spawn.heading
  }
};
const initialChunkManager = new ChunkManager();
const initialChunkSnapshot = initialChunkManager.updateForPlayerPosition(spawnPosition);
const initialChunkLoading = {
  active: false,
  label: '',
  loaded: 0,
  total: 0
};
const initialPerfStats = {
  drawCalls: 0,
  fps: 0,
  meshCount: 0
};
const NAVIGATION_DESTINATIONS = getDefaultNavigationDestinations();
const TRANSPORT_MISSION_ROUTES = [
  {
    id: 'airport-to-station',
    label: 'Airport to Station',
    limitMs: 240000,
    reward: 1600,
    pickup: createCargoWaypoint('airport-cargo-pickup', 'Airport Cargo Pickup', 'Pickup', 'airport', TRANSPORT_HUBS.airport.spawn, 90),
    dropoff: createCargoWaypoint('station-cargo-dropoff', 'Train Station Dropoff', 'Dropoff', 'station', TRANSPORT_HUBS.trainStation.spawn, 95)
  },
  {
    id: 'station-to-airport',
    label: 'Station to Airport',
    limitMs: 240000,
    reward: 1600,
    pickup: createCargoWaypoint('station-mail-pickup', 'Station Mail Pickup', 'Pickup', 'station', TRANSPORT_HUBS.trainStation.spawn, 95),
    dropoff: createCargoWaypoint('airport-mail-dropoff', 'Airport Terminal Dropoff', 'Dropoff', 'airport', TRANSPORT_HUBS.airport.spawn, 90)
  },
  {
    id: 'toll-inspection-run',
    label: 'Toll Inspection',
    limitMs: 180000,
    reward: 1100,
    pickup: createCargoWaypoint('airport-toll-inspection', 'Airport Toll Inspection', 'Pickup', 'toll', TRANSPORT_HIGHWAY.tolls[0].point, 75),
    dropoff: createCargoWaypoint('station-toll-inspection', 'Station Toll Inspection', 'Dropoff', 'toll', TRANSPORT_HIGHWAY.tolls[1].point, 75)
  }
];
const initialTransportMission = {
  phase: 'idle',
  route: null,
  startedAt: 0,
  elapsedMs: 0,
  resultMs: null,
  reward: 0,
  bestMs: readCargoBestTime(),
  failReason: ''
};

const initialTelemetry = {
  speedKmh: 0,
  steering: 0,
  rotation: { x: 0, y: playerVehicleConfig.spawn.heading, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  position: { ...spawnPosition },
  insideWorld: true,
  onElevated: false,
  surfaceType: 'groundRoad',
  surfaceGrip: 1,
  grip: 1,
  weatherGrip: 1,
  nitroRatio: 1,
  nitroActive: false,
  collisionCount: 0,
  collisionPulse: 0,
  stuckTimer: 0
};

export default function App() {
  const mainRef = useRef(null);
  const carRef = useRef(null);
  const chunkManagerRef = useRef(initialChunkManager);
  const chunkLoadTokenRef = useRef(0);
  const chunkLoadingRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const gameAudioRef = useRef(null);
  const previousCollisionCountRef = useRef(initialTelemetry.collisionCount);
  const teleportResumeTimerRef = useRef(null);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [chunkSnapshot, setChunkSnapshot] = useState(initialChunkSnapshot);
  const [chunkLoading, setChunkLoading] = useState(initialChunkLoading);
  const [perfStats, setPerfStats] = useState(initialPerfStats);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapClickMode, setMapClickMode] = useState(readMapClickModePreference);
  const [teleporting, setTeleporting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [teleportStatus, setTeleportStatus] = useState('ready');
  const [touchInput, setTouchInput] = useState(neutralTouchInput);
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [groundNavigationGuideEnabled, setGroundNavigationGuideEnabled] = useState(readGroundNavigationGuidePreference);
  const initialRaceModeRef = useRef(readRaceModePreference());
  const [cameraMode, setCameraMode] = useState(readCameraModePreference);
  const [nightMode, setNightMode] = useState(readNightModePreference);
  const [weatherMode, setWeatherMode] = useState(readWeatherModePreference);
  const [qualityMode, setQualityMode] = useState(readQualityModePreference);
  const [language, setLanguage] = useState(readLanguagePreference);
  const [raceModeEnabled, setRaceModeEnabled] = useState(initialRaceModeRef.current);
  const [gameState, setGameState] = useState(() => createInitialGameState(initialRaceModeRef.current));
  const [freeDrivePaused, setFreeDrivePaused] = useState(false);
  const [transportMission, setTransportMission] = useState(initialTransportMission);
  const [cargoRouteIndex, setCargoRouteIndex] = useState(0);
  const [launchOverlayOpen, setLaunchOverlayOpen] = useState(!initialRaceModeRef.current);
  const renderQuality = useMemo(() => getRenderQualitySettings(qualityMode), [qualityMode]);
  const weatherPreset = getWeatherPreset(weatherMode);
  const sceneWeather = useMemo(
    () => createSceneWeatherSettings(weatherPreset, nightMode, renderQuality),
    [nightMode, renderQuality, weatherPreset]
  );
  const multiplayer = useMultiplayerClient(telemetry);
  const isGamePaused = gameState.phase === 'paused' || (!raceModeEnabled && freeDrivePaused);
  const gameControlsEnabled = !isGamePaused && (!raceModeEnabled || gameState.phase === 'running') && !launchOverlayOpen && !mapOpen && !teleporting;
  const nextCheckpoint = raceModeEnabled ? RACE_CHECKPOINTS[gameState.checkpointIndex] ?? null : null;
  const timeLeftMs = Math.max(0, GAME_TIME_LIMIT_MS - gameState.elapsedMs);
  const distanceToGoal = raceModeEnabled && nextCheckpoint
    ? getPlanarDistance(telemetry.position, nextCheckpoint.position)
    : null;
  const navigationRoute = useMemo(
    () => createNavigationRoute(telemetry.position, navigationTarget, chunkSnapshot.loadedChunks),
    [navigationTarget, telemetry.position, chunkSnapshot.loadedChunks]
  );
  const navigationInfo = useMemo(
    () => getNavigationInfoForRoute(telemetry.position, telemetry.rotation?.y ?? 0, navigationRoute),
    [navigationRoute, telemetry.position, telemetry.rotation?.y]
  );
  const tunnelStatus = useMemo(
    () => getTunnelStatus(
      telemetry.position,
      telemetry.rotation?.y ?? telemetry.heading ?? playerVehicleConfig.spawn.heading,
      chunkSnapshot.loadedChunks
    ),
    [chunkSnapshot.loadedChunks, telemetry.heading, telemetry.position, telemetry.rotation?.y]
  );
  const displayedCollisionCount = raceModeEnabled
    ? Math.min(COLLISION_LIMIT, gameState.collisionCount)
    : telemetry.collisionCount ?? 0;
  const raceScore = calculateRaceScore({
    gameState,
    raceModeEnabled,
    telemetry,
    timeLeftMs
  });
  const shellClassName = [
    'game-shell',
    telemetry.collisionPulse > 0 ? 'is-hit' : '',
    nightMode ? 'is-night' : '',
    cameraMode === 'firstPerson' ? 'is-first-person' : '',
    tunnelStatus.state !== 'outsideTunnel' ? `is-${tunnelStatus.state}` : '',
    `weather-${weatherMode}`
  ].filter(Boolean).join(' ');
  const t = useCallback((key) => getText(language, key), [language]);

  useEffect(() => {
    const nextRadius = renderQuality.loadRadius ?? 1;
    const manager = chunkManagerRef.current;

    if (manager.loadRadius === nextRadius) return;

    manager.setLoadRadius(nextRadius);

    if (chunkLoadingRef.current) return;

    const nextSnapshot = manager.updateForPlayerPosition(telemetry.position);

    setChunkSnapshot((previousSnapshot) => (
      areChunkSnapshotsEquivalent(previousSnapshot, nextSnapshot)
        ? previousSnapshot
        : nextSnapshot
    ));
  }, [renderQuality.loadRadius, telemetry.position]);

  useEffect(() => {
    const unlockAudio = () => {
      const audio = ensureGameAudio(gameAudioRef);
      audio?.context?.resume?.();
    };

    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      stopGameAudio(gameAudioRef.current);
    };
  }, []);

  useEffect(() => {
    updateVehicleAudio(gameAudioRef.current, telemetry, isGamePaused || launchOverlayOpen || mapOpen);
  }, [
    isGamePaused,
    launchOverlayOpen,
    mapOpen,
    telemetry.nitroActive,
    telemetry.speedKmh,
    telemetry.surfaceType
  ]);

  useEffect(() => {
    const previousCount = previousCollisionCountRef.current ?? 0;
    const nextCount = telemetry.collisionCount ?? 0;

    if (nextCount > previousCount) {
      playCollisionSound(ensureGameAudio(gameAudioRef), telemetry.collisionPulse);
    }

    previousCollisionCountRef.current = nextCount;
  }, [telemetry.collisionCount, telemetry.collisionPulse]);

  const loadChunksForPosition = useCallback(async (position, {
    clearExisting = false,
    label = 'loading chunks'
  } = {}) => {
    const token = ++chunkLoadTokenRef.current;

    chunkLoadingRef.current = true;
    setChunkLoading({
      active: true,
      label,
      loaded: 0,
      total: 0
    });

    if (clearExisting) {
      const removedKeys = chunkManagerRef.current.unloadAll();
      setChunkSnapshot(chunkManagerRef.current.createSnapshot(null, [], removedKeys));
      await waitForNextFrame();
    }

    let nextSnapshot;

    try {
      nextSnapshot = await chunkManagerRef.current.updateForPlayerPositionAsync(position, {
        onProgress: ({ loaded, total }) => {
          if (token !== chunkLoadTokenRef.current) return;

          setChunkLoading({
            active: true,
            label,
            loaded,
            total
          });
        },
        shouldContinue: () => token === chunkLoadTokenRef.current
      });
    } catch {
      if (token === chunkLoadTokenRef.current) {
        chunkLoadingRef.current = false;
        setChunkLoading(initialChunkLoading);
      }

      return null;
    }

    if (token !== chunkLoadTokenRef.current || !nextSnapshot) return null;

    setChunkSnapshot(nextSnapshot);
    setChunkLoading({
      active: false,
      label: '',
      loaded: nextSnapshot.loadedChunkKeys.length,
      total: nextSnapshot.loadedChunkKeys.length
    });
    chunkLoadingRef.current = false;

    return nextSnapshot;
  }, []);

  useEffect(() => {
    if (chunkLoadingRef.current) return;

    const nextSnapshot = chunkManagerRef.current.updateForPlayerPosition(telemetry.position);

    setChunkSnapshot((previousSnapshot) => {
      if (areChunkSnapshotsEquivalent(previousSnapshot, nextSnapshot)) {
        return previousSnapshot;
      }

      return nextSnapshot;
    });
  }, [telemetry.position.x, telemetry.position.z]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return;

      if (event.code === 'KeyC') {
        event.preventDefault();
        setCameraMode((value) => {
          const nextMode = value === 'firstPerson' ? 'chase' : 'firstPerson';
          writeCameraModePreference(nextMode);
          return nextMode;
        });
        return;
      }

      if (event.code === 'KeyN') {
        event.preventDefault();
        setNightMode((value) => {
          const nextMode = !value;
          writeNightModePreference(nextMode);
          return nextMode;
        });
        return;
      }

      if (event.code === 'KeyV') {
        event.preventDefault();
        setWeatherMode((value) => {
          const nextMode = getNextWeatherMode(value);
          writeWeatherModePreference(nextMode);
          return nextMode;
        });
        return;
      }

      if (event.code !== 'KeyM') return;

      event.preventDefault();
      setMapClickMode('teleport');
      writeMapClickModePreference('teleport');
      setMapOpen((value) => !value);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, (cooldownUntilRef.current - performance.now()) / 1000);
      setCooldownRemaining(remaining);
    }, 100);

    return () => {
      chunkLoadTokenRef.current += 1;
      chunkLoadingRef.current = false;
      window.clearInterval(interval);

      if (teleportResumeTimerRef.current) {
        window.clearTimeout(teleportResumeTimerRef.current);
      }
    };
  }, []);

  const focusGameCanvas = useCallback(() => {
    window.requestAnimationFrame(() => {
      const canvas = mainRef.current?.querySelector('canvas');

      if (canvas) {
        canvas.tabIndex = 0;
        canvas.focus({ preventScroll: true });
        return;
      }

      mainRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const clearTouchInput = useCallback(() => {
    setTouchInput(neutralTouchInput);
  }, []);

  const setTouchControl = useCallback((action, pressed) => {
    setTouchInput((previousInput) => (
      previousInput[action] === pressed
        ? previousInput
        : { ...previousInput, [action]: pressed }
    ));
  }, []);

  const resetToStartPosition = useCallback(async () => {
    const spawnChunk = worldToChunkCoord(spawnPosition);
    const chunkLabel = spawnChunk ? `${spawnChunk.chunkX}:${spawnChunk.chunkZ}` : 'spawn';

    setTeleporting(true);
    setTeleportStatus(`loading ${chunkLabel}`);
    clearTouchInput();

    const nextSnapshot = await loadChunksForPosition(spawnPosition, {
      clearExisting: true,
      label: `loading ${chunkLabel}`
    });

    if (!nextSnapshot) {
      setTeleporting(false);
      setTeleportStatus('start load failed');
      return false;
    }

    carRef.current?.resetToSpawn?.();
    setTelemetry({
      ...initialTelemetry,
      position: { ...spawnPosition },
      rotation: { x: 0, y: playerVehicleConfig.spawn.heading, z: 0 }
    });
    setTeleportStatus('ready');
    setTeleporting(false);

    return true;
  }, [clearTouchInput, loadChunksForPosition]);

  const handleStartRace = useCallback(async () => {
    setRaceModeEnabled(true);
    setFreeDrivePaused(false);
    setLaunchOverlayOpen(false);
    writeRaceModePreference(true);
    setTransportMission(initialTransportMission);
    setMapOpen(false);
    focusGameCanvas();

    const didReset = await resetToStartPosition();
    if (!didReset) return;

    setGameState((previousState) => ({
      ...previousState,
      phase: 'countdown',
      countdownStep: 0,
      elapsedMs: 0,
      resultMs: null,
      failReason: '',
      checkpointIndex: 0,
      collisionBaseline: 0,
      collisionCount: 0
    }));
  }, [focusGameCanvas, resetToStartPosition]);

  const handleFreeDrive = useCallback(() => {
    setRaceModeEnabled(false);
    setFreeDrivePaused(false);
    setLaunchOverlayOpen(false);
    writeRaceModePreference(false);
    setMapOpen(false);
    clearTouchInput();
    setGameState((previousState) => ({
      ...previousState,
      phase: 'freeDrive',
      countdownStep: 0,
      startedAt: 0,
      elapsedMs: 0,
      resultMs: null,
      failReason: '',
      checkpointIndex: 0,
      collisionBaseline: telemetry.collisionCount ?? 0,
      collisionCount: 0
    }));
    focusGameCanvas();
  }, [clearTouchInput, focusGameCanvas, telemetry.collisionCount]);

  const handleStartTransportMission = useCallback(() => {
    const route = TRANSPORT_MISSION_ROUTES[cargoRouteIndex % TRANSPORT_MISSION_ROUTES.length];

    setRaceModeEnabled(false);
    setFreeDrivePaused(false);
    setLaunchOverlayOpen(false);
    writeRaceModePreference(false);
    setMapOpen(false);
    clearTouchInput();
    setGameState((previousState) => ({
      ...previousState,
      phase: 'freeDrive',
      countdownStep: 0,
      startedAt: 0,
      elapsedMs: 0,
      resultMs: null,
      failReason: '',
      checkpointIndex: 0,
      collisionBaseline: telemetry.collisionCount ?? 0,
      collisionCount: 0
    }));
    setTransportMission({
      phase: 'pickup',
      route,
      startedAt: 0,
      elapsedMs: 0,
      resultMs: null,
      reward: 0,
      bestMs: readCargoBestTime(),
      failReason: ''
    });
    setNavigationTarget(route.pickup);
    setCargoRouteIndex((value) => value + 1);
    focusGameCanvas();
  }, [cargoRouteIndex, clearTouchInput, focusGameCanvas, telemetry.collisionCount]);

  const handleCancelTransportMission = useCallback(() => {
    setTransportMission({
      ...initialTransportMission,
      bestMs: readCargoBestTime()
    });
    setNavigationTarget(null);
    focusGameCanvas();
  }, [focusGameCanvas]);

  const handleEnableRaceMode = useCallback(() => {
    setRaceModeEnabled(true);
    setFreeDrivePaused(false);
    setLaunchOverlayOpen(false);
    writeRaceModePreference(true);
    setTransportMission(initialTransportMission);
    setGameState((previousState) => ({
      ...createInitialGameState(true),
      bestMs: previousState.bestMs
    }));
    clearTouchInput();
  }, [clearTouchInput]);

  const handleRestart = useCallback(async () => {
    if (raceModeEnabled) {
      await handleStartRace();
      return;
    }

    setMapOpen(false);
    setFreeDrivePaused(false);
    focusGameCanvas();

    const didReset = await resetToStartPosition();
    if (!didReset) return;

    setGameState((previousState) => ({
      ...previousState,
      phase: 'freeDrive',
      countdownStep: 0,
      startedAt: 0,
      elapsedMs: 0,
      resultMs: null,
      failReason: '',
      checkpointIndex: 0,
      collisionBaseline: 0,
      collisionCount: 0
    }));
  }, [focusGameCanvas, handleStartRace, raceModeEnabled, resetToStartPosition]);

  const handleResumeRace = useCallback(() => {
    setGameState((previousState) => (
      previousState.phase === 'paused'
        ? {
            ...previousState,
            phase: 'running',
            startedAt: performance.now() - previousState.elapsedMs
          }
        : previousState
    ));
    focusGameCanvas();
  }, [focusGameCanvas]);

  const handlePauseToggle = useCallback(() => {
    clearTouchInput();

    if (!raceModeEnabled) {
      setFreeDrivePaused((value) => {
        const nextPaused = !value;

        if (!nextPaused) {
          setTransportMission((previousMission) => (
            previousMission.phase === 'delivery'
              ? {
                  ...previousMission,
                  startedAt: performance.now() - previousMission.elapsedMs
                }
              : previousMission
          ));
        }

        return nextPaused;
      });
      focusGameCanvas();
      return;
    }

    setGameState((previousState) => {
      if (previousState.phase === 'running') {
        return {
          ...previousState,
          phase: 'paused',
          elapsedMs: performance.now() - previousState.startedAt
        };
      }

      if (previousState.phase === 'paused') {
        return {
          ...previousState,
          phase: 'running',
          startedAt: performance.now() - previousState.elapsedMs
        };
      }

      return previousState;
    });
    focusGameCanvas();
  }, [clearTouchInput, focusGameCanvas, raceModeEnabled]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat || event.code !== 'KeyP') return;

      event.preventDefault();
      handlePauseToggle();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handlePauseToggle]);

  const finishRace = useCallback(() => {
    setGameState((previousState) => {
      if (previousState.phase !== 'running') return previousState;

      const finalMs = performance.now() - previousState.startedAt;
      const previousBest = readBestTime();
      const nextBest = previousBest ? Math.min(previousBest, finalMs) : finalMs;

      writeBestTime(nextBest);

      return {
        ...previousState,
        phase: 'finished',
        elapsedMs: finalMs,
        resultMs: finalMs,
        bestMs: nextBest,
        checkpointIndex: RACE_CHECKPOINTS.length
      };
    });
    clearTouchInput();
  }, [clearTouchInput]);

  const failRace = useCallback((reason) => {
    setGameState((previousState) => {
      if (previousState.phase !== 'running') return previousState;

      const finalMs = performance.now() - previousState.startedAt;

      return {
        ...previousState,
        phase: 'failed',
        elapsedMs: finalMs,
        resultMs: finalMs,
        failReason: reason
      };
    });
    clearTouchInput();
  }, [clearTouchInput]);

  useEffect(() => {
    if (!raceModeEnabled || gameState.phase !== 'countdown') return undefined;

    const timer = window.setTimeout(() => {
      setGameState((previousState) => {
        if (previousState.phase !== 'countdown') return previousState;

        if (previousState.countdownStep < COUNTDOWN_LABELS.length - 1) {
          return {
            ...previousState,
            countdownStep: previousState.countdownStep + 1
          };
        }

        return {
          ...previousState,
          phase: 'running',
          startedAt: performance.now(),
          elapsedMs: 0,
          checkpointIndex: 0,
          collisionBaseline: telemetry.collisionCount ?? 0,
          collisionCount: 0
        };
      });
      focusGameCanvas();
    }, gameState.countdownStep < COUNTDOWN_LABELS.length - 1 ? 850 : 620);

    return () => {
      window.clearTimeout(timer);
    };
  }, [focusGameCanvas, gameState.countdownStep, gameState.phase, raceModeEnabled, telemetry.collisionCount]);

  useEffect(() => {
    if (!raceModeEnabled || gameState.phase !== 'running') return undefined;

    const timer = window.setInterval(() => {
      setGameState((previousState) => {
        if (previousState.phase !== 'running') return previousState;

        const elapsedMs = performance.now() - previousState.startedAt;

        if (elapsedMs >= GAME_TIME_LIMIT_MS) {
          return {
            ...previousState,
            phase: 'failed',
            elapsedMs: GAME_TIME_LIMIT_MS,
            resultMs: GAME_TIME_LIMIT_MS,
            failReason: 'Time limit reached'
          };
        }

        return {
          ...previousState,
          elapsedMs
        };
      });
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [gameState.phase, raceModeEnabled]);

  useEffect(() => {
    if (!raceModeEnabled || gameState.phase !== 'running') return;

    if (!telemetry.insideWorld) {
      failRace('Out of bounds');
      return;
    }

    const collisionCount = Math.max(0, (telemetry.collisionCount ?? 0) - gameState.collisionBaseline);

    if (collisionCount !== gameState.collisionCount) {
      setGameState((previousState) => (
        previousState.phase === 'running'
          ? { ...previousState, collisionCount }
          : previousState
      ));
    }

    if (collisionCount >= COLLISION_LIMIT) {
      failRace('Too many collisions');
    }
  }, [
    failRace,
    gameState.collisionBaseline,
    gameState.collisionCount,
    gameState.phase,
    raceModeEnabled,
    telemetry.collisionCount,
    telemetry.insideWorld
  ]);

  useEffect(() => {
    if (!raceModeEnabled || gameState.phase !== 'running' || !nextCheckpoint) return;
    if (!isCheckpointReached(telemetry.position, nextCheckpoint)) return;

    if (gameState.checkpointIndex >= RACE_CHECKPOINTS.length - 1) {
      finishRace();
      return;
    }

    setGameState((previousState) => (
      previousState.phase === 'running' &&
      previousState.checkpointIndex === gameState.checkpointIndex
        ? { ...previousState, checkpointIndex: previousState.checkpointIndex + 1 }
        : previousState
    ));
  }, [
    finishRace,
    gameState.checkpointIndex,
    gameState.phase,
    nextCheckpoint,
    raceModeEnabled,
    telemetry.position.x,
    telemetry.position.y,
    telemetry.position.z
  ]);

  useEffect(() => {
    if (transportMission.phase !== 'pickup') return;
    if (freeDrivePaused) return;
    if (!transportMission.route?.pickup) return;

    const distanceToPickup = getPlanarDistance(telemetry.position, transportMission.route.pickup.position);

    if (distanceToPickup > transportMission.route.pickup.radius) return;

    setTransportMission({
      phase: 'delivery',
      route: transportMission.route,
      startedAt: performance.now(),
      elapsedMs: 0,
      resultMs: null,
      reward: 0,
      bestMs: readCargoBestTime(),
      failReason: ''
    });
    setNavigationTarget(transportMission.route.dropoff);
  }, [
    telemetry.position.x,
    telemetry.position.y,
    telemetry.position.z,
    freeDrivePaused,
    transportMission.route,
    transportMission.phase
  ]);

  useEffect(() => {
    if (transportMission.phase !== 'delivery') return undefined;
    if (freeDrivePaused) return undefined;

    const updateMissionTimer = () => {
      setTransportMission((previousMission) => {
        if (previousMission.phase !== 'delivery') return previousMission;

        const elapsedMs = performance.now() - previousMission.startedAt;
        const limitMs = previousMission.route?.limitMs ?? 240000;

        if (elapsedMs >= limitMs) {
          return {
            ...previousMission,
            phase: 'failed',
            elapsedMs: limitMs,
            resultMs: limitMs,
            failReason: 'Time limit reached'
          };
        }

        return {
          ...previousMission,
          elapsedMs
        };
      });
    };

    updateMissionTimer();

    const timer = window.setInterval(updateMissionTimer, 160);

    return () => {
      window.clearInterval(timer);
    };
  }, [freeDrivePaused, transportMission.phase]);

  useEffect(() => {
    if (transportMission.phase === 'failed') {
      setNavigationTarget(null);
    }
  }, [transportMission.phase]);

  useEffect(() => {
    if (transportMission.phase !== 'delivery') return;
    if (freeDrivePaused) return;
    if (!transportMission.route?.dropoff) return;

    const distanceToDropoff = getPlanarDistance(telemetry.position, transportMission.route.dropoff.position);

    if (distanceToDropoff > transportMission.route.dropoff.radius) return;

    setTransportMission((previousMission) => {
      const elapsedMs = performance.now() - previousMission.startedAt;
      const previousBest = readCargoBestTime();
      const nextBest = previousBest ? Math.min(previousBest, elapsedMs) : elapsedMs;
      const limitMs = previousMission.route?.limitMs ?? 240000;
      const baseReward = previousMission.route?.reward ?? 1200;
      const timeBonus = Math.round(Math.max(0, limitMs - elapsedMs) / 1000) * 6;
      const reward = baseReward + timeBonus;

      writeCargoBestTime(nextBest);

      return {
        ...previousMission,
        phase: 'finished',
        elapsedMs,
        resultMs: elapsedMs,
        reward,
        bestMs: nextBest,
        failReason: ''
      };
    });
    setNavigationTarget(null);
  }, [
    telemetry.position.x,
    telemetry.position.y,
    telemetry.position.z,
    freeDrivePaused,
    transportMission.route,
    transportMission.phase
  ]);

  useEffect(() => {
    if (raceModeEnabled) return;

    focusGameCanvas();
  }, [focusGameCanvas, raceModeEnabled]);

  const applyLocalTeleport = useCallback(async (position, heading, currentChunk, mode = 'teleported') => {
    const chunkLabel = currentChunk
      ? `${currentChunk.chunkX}:${currentChunk.chunkZ}`
      : 'unknown';

    setTeleportStatus(`loading ${chunkLabel}`);

    const nextSnapshot = await loadChunksForPosition(position, {
      clearExisting: true,
      label: `loading chunk ${chunkLabel}`
    });

    if (!nextSnapshot) {
      setTeleporting(false);
      return;
    }

    carRef.current?.teleportTo?.({
      ...position,
      heading
    });
    setTelemetry({
      speedKmh: 0,
      speed: 0,
      steering: 0,
      heading,
      rotation: { x: 0, y: heading, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      position,
      insideWorld: true,
      onElevated: false,
      surfaceType: 'groundRoad',
      surfaceGrip: 1,
      grip: 1,
      weatherGrip: 1,
      nitroRatio: 1,
      nitroActive: false,
      collisionCount: 0,
      collisionPulse: 0,
      stuckTimer: 0
    });

    cooldownUntilRef.current = performance.now() + TELEPORT_COOLDOWN_MS;
    setCooldownRemaining(TELEPORT_COOLDOWN_MS / 1000);
    setTeleportStatus(`${mode} ${chunkLabel}`);
    setMapOpen(false);

    if (teleportResumeTimerRef.current) {
      window.clearTimeout(teleportResumeTimerRef.current);
    }

    teleportResumeTimerRef.current = window.setTimeout(() => {
      setTeleporting(false);
    }, 180);
  }, [loadChunksForPosition]);

  const handleMapTeleport = useCallback((targetPosition) => {
    const now = performance.now();
    const remainingMs = cooldownUntilRef.current - now;

    if (remainingMs > 0) {
      setTeleportStatus(`cooldown ${(remainingMs / 1000).toFixed(1)}s`);
      return;
    }

    const targetChunk = worldToChunkCoord(targetPosition);

    if (!targetChunk) {
      setTeleportStatus('outside world');
      return;
    }

    const safeTeleport = getSafeTeleportPosition(targetPosition);
    const safePosition = {
      x: safeTeleport.x,
      y: safeTeleport.y,
      z: safeTeleport.z
    };
    const safeChunk = worldToChunkCoord(safePosition);
    const heading = safeTeleport.heading ?? playerVehicleConfig.spawn.heading;

    setTeleporting(true);
    carRef.current?.pauseControls?.(320);
    setTeleportStatus(`requesting ${targetChunk.chunkX}:${targetChunk.chunkZ}`);

    if (multiplayer.status === 'connected' && multiplayer.playerId) {
      if (!multiplayer.requestTeleport({ ...safePosition, heading }, CURRENT_ROOM_ID)) {
        setTeleportStatus('local teleport fallback');
        void applyLocalTeleport(safePosition, heading, safeChunk, 'local');
      }

      return;
    }

    setTeleportStatus('local teleport');
    void applyLocalTeleport(safePosition, heading, safeChunk, 'local');
  }, [applyLocalTeleport, multiplayer]);

  const handleNavigationTarget = useCallback((destination) => {
    if (!destination?.position) return;

    setNavigationTarget({
      ...destination,
      position: { ...destination.position }
    });
    setMapOpen(false);
    focusGameCanvas();
  }, [focusGameCanvas]);

  const handleCustomNavigationTarget = useCallback((position) => {
    if (!position) return;

    setNavigationTarget({
      id: 'custom-waypoint',
      label: 'Custom Point',
      shortLabel: 'Custom',
      type: 'custom',
      position: {
        x: position.x,
        y: position.y ?? playerVehicleConfig.spawn.position.y,
        z: position.z
      }
    });
    setMapOpen(false);
    focusGameCanvas();
  }, [focusGameCanvas]);

  const handleMapClickModeChange = useCallback((mode) => {
    const nextMode = mode === 'navigate' ? 'navigate' : 'teleport';

    setMapClickMode(nextMode);
    writeMapClickModePreference(nextMode);
    focusGameCanvas();
  }, [focusGameCanvas]);

  const handleToggleGroundNavigationGuide = useCallback(() => {
    setGroundNavigationGuideEnabled((enabled) => {
      const nextEnabled = !enabled;

      writeGroundNavigationGuidePreference(nextEnabled);
      return nextEnabled;
    });
    focusGameCanvas();
  }, [focusGameCanvas]);

  const handleClearNavigation = useCallback(() => {
    setNavigationTarget(null);
    focusGameCanvas();
  }, [focusGameCanvas]);

  useEffect(() => {
    const event = multiplayer.teleportEvent;

    if (!event?.playerId) return;

    if (event.playerId !== multiplayer.playerId) {
      setTeleportStatus(`player teleported ${event.currentChunk?.chunkX ?? '?'}:${event.currentChunk?.chunkZ ?? '?'}`);
      return;
    }

    const safePosition = {
      x: event.position.x,
      y: event.position.y,
      z: event.position.z
    };
    const heading = event.rotation?.y ?? playerVehicleConfig.spawn.heading;

    void applyLocalTeleport(safePosition, heading, event.currentChunk, 'teleported');
  }, [applyLocalTeleport, multiplayer.teleportEvent, multiplayer.playerId]);

  useEffect(() => {
    const rejection = multiplayer.teleportRejected;

    if (!rejection?.eventId) return;
    if (rejection.playerId && rejection.playerId !== multiplayer.playerId) return;

    setTeleporting(false);
    setTeleportStatus(`teleport rejected: ${rejection.reason ?? 'server rejected'}`);

    if (rejection.remainingCooldownMs > 0) {
      cooldownUntilRef.current = performance.now() + rejection.remainingCooldownMs;
      setCooldownRemaining(rejection.remainingCooldownMs / 1000);
    }
  }, [multiplayer.teleportRejected, multiplayer.playerId]);

  useEffect(() => {
    const debugApi = {
      getState: () => ({
        activeLoopsCount: window.__GAME4_ACTIVE_LOOPS__?.scene ?? 0,
        chunk: chunkSnapshot.currentChunk,
        currentSegment: telemetry.surfaceId ?? null,
        lightingFactor: tunnelStatus.lightingFactor,
        loadedChunks: chunkSnapshot.loadedChunkKeys,
        playerPosition: { ...telemetry.position },
        tunnelState: tunnelStatus.state,
        tunnelStatus: { ...tunnelStatus },
        weather: weatherMode,
        telemetry: {
          ...telemetry,
          position: { ...telemetry.position },
          rotation: { ...telemetry.rotation },
          velocity: { ...telemetry.velocity }
        },
        vehicle: carRef.current?.getVehicleState?.() ?? null
      }),
      reset: () => {
        void handleRestart();
      },
      setFreeDrive: () => {
        handleFreeDrive();
      },
      teleportTo: async ({ x, y, z, heading = playerVehicleConfig.spawn.heading }) => {
        const position = { x, y, z };
        const currentChunk = worldToChunkCoord(position);

        if (!currentChunk) return false;

        setTeleporting(true);
        carRef.current?.pauseControls?.(320);
        await applyLocalTeleport(position, heading, currentChunk, 'debug');
        return true;
      },
      teleportToTunnel: async (index = 0, section = 'inside') => {
        const sample = getDebugTunnelSample(index, section);
        if (!sample) return false;

        return debugApi.teleportTo(sample);
      }
    };

    window.__gameDebug = debugApi;
    window.__GAME4_DEBUG__ = debugApi;

    return () => {
      if (window.__gameDebug === debugApi) {
        delete window.__gameDebug;
      }

      if (window.__GAME4_DEBUG__ === debugApi) {
        delete window.__GAME4_DEBUG__;
      }
    };
  }, [
    applyLocalTeleport,
    chunkSnapshot.currentChunk,
    chunkSnapshot.loadedChunkKeys,
    handleFreeDrive,
    handleRestart,
    telemetry,
    tunnelStatus,
    weatherMode
  ]);

  return (
    <main ref={mainRef} className={shellClassName} tabIndex={-1}>
      <Suspense
        fallback={(
          <div className="world-loading world-loading--renderer" role="status" aria-live="polite">
            <strong>{t('loadingRenderer')}</strong>
            <span>{t('scene3d')}</span>
          </div>
        )}
      >
        <GameScene
          cameraMode={cameraMode}
          carRef={carRef}
          chunkSnapshot={chunkSnapshot}
          gameControlsEnabled={gameControlsEnabled}
          gameState={gameState}
          multiplayer={multiplayer}
          navigationRoute={navigationRoute}
          nightMode={nightMode}
          playerVehicleConfig={playerVehicleConfig}
          raceModeEnabled={raceModeEnabled}
          renderQuality={renderQuality}
          sceneWeather={sceneWeather}
          showGroundNavigationGuide={Boolean(navigationInfo && groundNavigationGuideEnabled)}
          setPerfStats={setPerfStats}
          setTelemetry={setTelemetry}
          telemetry={telemetry}
          touchInput={touchInput}
          tunnelStatus={tunnelStatus}
          weatherMode={weatherMode}
          weatherPreset={weatherPreset}
        />
      </Suspense>
      <WorldMap
        cooldownRemaining={cooldownRemaining}
        isOpen={mapOpen}
        language={language}
        loadedChunks={chunkSnapshot.loadedChunks}
        mapClickMode={mapClickMode}
        navigationDestinations={NAVIGATION_DESTINATIONS}
        navigationInfo={navigationInfo}
        navigationRoute={navigationRoute}
        navigationTarget={navigationTarget}
        onClearNavigation={handleClearNavigation}
        onClose={() => setMapOpen(false)}
        onCustomNavigate={handleCustomNavigationTarget}
        onMapClickModeChange={handleMapClickModeChange}
        onNavigate={handleNavigationTarget}
        onTeleport={handleMapTeleport}
        onToggle={() => {
          setMapClickMode('teleport');
          writeMapClickModePreference('teleport');
          setMapOpen((value) => !value);
        }}
        playerHeading={telemetry.rotation?.y ?? telemetry.heading ?? 0}
        playerPosition={telemetry.position}
        status={teleportStatus}
      />

      {navigationInfo ? (
        <div className="navigation-guide" role="status" aria-live="polite">
          <span
            className="navigation-guide__arrow"
            style={{ transform: `rotate(${navigationInfo.relativeBearing}rad)` }}
          />
          <div>
            <strong>{navigationInfo.targetLabel}</strong>
            <span>{navigationInfo.distanceLabel} · {navigationInfo.directionLabel}</span>
          </div>
          <button type="button" onClick={handleToggleGroundNavigationGuide} aria-label="Toggle ground navigation guide">
            {t('line')} {groundNavigationGuideEnabled ? t('on') : t('off')}
          </button>
          <button type="button" onClick={handleClearNavigation} aria-label="Clear navigation">
            {t('clear')}
          </button>
        </div>
      ) : null}

      {chunkLoading.active && (
        <div className="world-loading" role="status" aria-live="polite">
          <strong>{chunkLoading.label}</strong>
          <span>{formatLoadingProgress(chunkLoading)}</span>
        </div>
      )}

      <GameOverlay
        checkpoint={nextCheckpoint ?? RACE_CHECKPOINTS[0]}
        chunkLoading={chunkLoading.active}
        gameState={gameState}
        language={language}
        onFreeDrive={handleFreeDrive}
        onRestart={handleRestart}
        onResume={handleResumeRace}
        onStart={handleStartRace}
        onStartTransportMission={handleStartTransportMission}
        raceModeEnabled={raceModeEnabled}
        showLaunch={launchOverlayOpen}
      />

      {transportMission.phase === 'finished' || transportMission.phase === 'failed' ? (
        <section className="mission-result" aria-label="Cargo mission result">
          <div>
            <span>{getTransportRouteText(language, transportMission.route) ?? t('cargoRun')}</span>
            <strong>{transportMission.phase === 'finished' ? t('delivered') : t('failed')}</strong>
            <p>
              {transportMission.phase === 'finished'
                ? `${formatRaceTime(transportMission.resultMs)} · ${t('reward')} ${transportMission.reward}`
                : getFailReasonText(language, transportMission.failReason) || (language === 'zh' ? '任务失败' : 'Mission failed')}
            </p>
            <small>{t('best')} {transportMission.bestMs ? formatRaceTime(transportMission.bestMs) : '--'}</small>
          </div>
          <button type="button" onClick={handleStartTransportMission}>
            {t('nextCargo')}
          </button>
          <button type="button" onClick={handleCancelTransportMission}>
            {t('close')}
          </button>
        </section>
      ) : null}

      <section className="hud" aria-label="世界坐标调试">
        <div className="hud-title">City Drive</div>
        <div className="hud-actions">
          <button type="button" onClick={handleRestart}>
            {raceModeEnabled && gameState.phase === 'ready' ? t('start') : t('restart')}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={handlePauseToggle}
            disabled={teleporting || launchOverlayOpen || (raceModeEnabled && !['running', 'paused'].includes(gameState.phase))}
          >
            {isGamePaused ? t('resume') : t('pause')}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={raceModeEnabled ? handleFreeDrive : handleEnableRaceMode}
          >
            {raceModeEnabled ? t('raceOff') : t('raceOn')}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={() => {
              setCameraMode((value) => {
                const nextMode = value === 'firstPerson' ? 'chase' : 'firstPerson';
                writeCameraModePreference(nextMode);
                return nextMode;
              });
              focusGameCanvas();
            }}
          >
            {cameraMode === 'firstPerson' ? t('chaseView') : t('driverView')}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={() => {
              setNightMode((value) => {
                const nextMode = !value;
                writeNightModePreference(nextMode);
                return nextMode;
              });
              focusGameCanvas();
            }}
          >
            {nightMode ? t('dayMode') : t('nightMode')}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={() => {
              setWeatherMode((value) => {
                const nextMode = getNextWeatherMode(value);
                writeWeatherModePreference(nextMode);
                return nextMode;
              });
              focusGameCanvas();
            }}
          >
            {t('weather')}: {getWeatherText(language, weatherMode, weatherPreset.label)}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={() => {
              setQualityMode((value) => {
                const nextMode = getNextQualityMode(value);
                writeQualityModePreference(nextMode);
                return nextMode;
              });
              focusGameCanvas();
            }}
          >
            {t('quality')}: {formatQualityMode(qualityMode, language)}
          </button>
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={transportMission.phase === 'pickup' || transportMission.phase === 'delivery'
              ? handleCancelTransportMission
              : handleStartTransportMission}
          >
            {transportMission.phase === 'pickup' || transportMission.phase === 'delivery'
              ? (language === 'zh' ? '取消货运' : 'Cancel Cargo')
              : t('cargoRun')}
          </button>
          {navigationTarget ? (
            <button
              type="button"
              className="hud-actions__secondary"
              onClick={handleClearNavigation}
            >
              {t('clearNav')}
            </button>
          ) : null}
          <button
            type="button"
            className="hud-actions__secondary"
            onClick={() => {
              setLanguage((value) => {
                const nextLanguage = getNextLanguage(value);
                writeLanguagePreference(nextLanguage);
                return nextLanguage;
              });
              focusGameCanvas();
            }}
          >
            {t('language')}: {getLanguageName(language)}
          </button>
        </div>
        <div className="hud-row muted">
          <span>{t('fps')}</span>
          <strong>{perfStats.fps}</strong>
        </div>
        <div className="hud-row">
          <span>{t('speed')}</span>
          <strong>{Math.round(telemetry.speedKmh)}</strong>
          <small>km/h</small>
        </div>
        <div className="hud-row muted">
          <span>{t('score')}</span>
          <strong>{raceScore}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('distance')}</span>
          <strong>{distanceToGoal === null ? '--' : `${Math.round(distanceToGoal)}m`}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('cargo')}</span>
          <strong>{formatTransportMissionPhase(transportMission.phase, language)}</strong>
        </div>
        {transportMission.phase !== 'idle' ? (
          <>
            <div className="hud-row muted">
              <span>{t('cargoTime')}</span>
              <strong>{formatTransportMissionTime(transportMission)}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('cargoGoal')}</span>
              <strong>{getTransportMissionGoalLabel(transportMission, language)}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('cargoRoute')}</span>
              <strong>{getTransportRouteText(language, transportMission.route)}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('cargoBest')}</span>
              <strong>{transportMission.bestMs ? formatRaceTime(transportMission.bestMs) : '--'}</strong>
            </div>
          </>
        ) : null}
        {navigationInfo ? (
          <>
            <div className="hud-row muted">
              <span>{t('nav')}</span>
              <strong>{navigationInfo.targetLabel}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('route')}</span>
              <strong>{navigationInfo.distanceLabel}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('guide')}</span>
              <strong>{navigationInfo.directionLabel}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('next')}</span>
              <strong>{navigationInfo.maneuverLabel}</strong>
            </div>
            <div className="hud-row muted">
              <span>{t('groundLine')}</span>
              <strong>{groundNavigationGuideEnabled ? t('on') : t('off')}</strong>
            </div>
          </>
        ) : null}
        <div className="hud-row hud-row--meter muted">
          <span>{t('nitro')}</span>
          <strong>{Math.round((telemetry.nitroRatio ?? 1) * 100)}%</strong>
          <div className="hud-meter" aria-hidden="true">
            <span style={{ width: `${Math.round((telemetry.nitroRatio ?? 1) * 100)}%` }} />
          </div>
        </div>
        <div className="hud-row muted">
          <span>{t('mode')}</span>
          <strong>{raceModeEnabled ? t('race') : t('free')}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('state')}</span>
          <strong>{isGamePaused ? t('paused') : getGamePhaseText(language, gameState.phase)}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('view')}</span>
          <strong>{cameraMode === 'firstPerson' ? t('driver') : t('chase')}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('light')}</span>
          <strong>{nightMode ? t('night') : t('day')}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('weather')}</span>
          <strong>{getWeatherText(language, weatherMode, weatherPreset.label)}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('grip')}</span>
          <strong>{Math.round((telemetry.grip ?? telemetry.weatherGrip ?? 1) * 100)}%</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('quality')}</span>
          <strong>{formatQualityMode(qualityMode, language)}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('time')}</span>
          <strong>
            {!raceModeEnabled
              ? t('off')
              : gameState.phase === 'finished' || gameState.phase === 'failed'
              ? formatRaceTime(gameState.resultMs)
              : formatRaceTime(timeLeftMs)}
          </strong>
        </div>
        <div className="hud-row muted">
          <span>{t('goal')}</span>
          <strong>{raceModeEnabled ? getCheckpointText(language, nextCheckpoint) ?? t('done') : t('freeRoam')}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('hits')}</span>
          <strong>{raceModeEnabled ? `${displayedCollisionCount}/${COLLISION_LIMIT}` : displayedCollisionCount}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('best')}</span>
          <strong>{raceModeEnabled && gameState.bestMs ? formatRaceTime(gameState.bestMs) : '--'}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('chunk')}</span>
          <strong>
            {chunkSnapshot.currentChunk
              ? `${chunkSnapshot.currentChunk.chunkX}:${chunkSnapshot.currentChunk.chunkZ}`
                : t('outside')}
          </strong>
        </div>
        <div className="hud-row muted">
          <span>{t('loaded')}</span>
          <strong>{chunkSnapshot.loadedChunkKeys.length}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('meshes')}</span>
          <strong>{perfStats.meshCount}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('online')}</span>
          <strong>{multiplayer.status} {multiplayer.playerCount}/8</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('teleport')}</span>
          <strong>{teleportStatus}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('area')}</span>
          <strong>{chunkSnapshot.currentAreaName}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('height')}</span>
          <strong>{formatCoord(telemetry.position.y)}</strong>
        </div>
        <div className="hud-row muted">
          <span>{t('road')}</span>
          <strong>{getSurfaceTypeText(language, telemetry.surfaceType ?? 'groundRoad')}</strong>
        </div>
        <div className="hud-debug">
          <div>
            <span>World X</span>
            <strong>{formatCoord(telemetry.position.x)}</strong>
          </div>
          <div>
            <span>World Y</span>
            <strong>{formatCoord(telemetry.position.y)}</strong>
          </div>
          <div>
            <span>World Z</span>
            <strong>{formatCoord(telemetry.position.z)}</strong>
          </div>
          <div>
            <span>Inside</span>
            <strong>{telemetry.insideWorld ? 'yes' : 'no'}</strong>
          </div>
          <div>
            <span>Draws</span>
            <strong>{perfStats.drawCalls}</strong>
          </div>
        </div>
        <div className="chunk-debug">
          {chunkSnapshot.loadedChunkKeys.map((key) => (
            <span
              key={key}
              className={
                chunkSnapshot.currentChunk &&
                key === `${chunkSnapshot.currentChunk.chunkX}:${chunkSnapshot.currentChunk.chunkZ}`
                  ? 'active'
                  : undefined
              }
            >
              {key}
            </span>
          ))}
        </div>
      </section>

      <VirtualControls language={language} setTouchControl={setTouchControl} />
      <div className="orientation-hint" role="status">
        {t('rotateDevice')}
      </div>
    </main>
  );
}

function readRaceModePreference() {
  try {
    return window.localStorage.getItem(RACE_MODE_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function writeRaceModePreference(enabled) {
  try {
    window.localStorage.setItem(RACE_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function readCameraModePreference() {
  try {
    return window.localStorage.getItem(CAMERA_MODE_STORAGE_KEY) === 'firstPerson'
      ? 'firstPerson'
      : 'chase';
  } catch {
    return 'chase';
  }
}

function writeCameraModePreference(mode) {
  try {
    window.localStorage.setItem(CAMERA_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function readNightModePreference() {
  try {
    return window.localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeNightModePreference(enabled) {
  try {
    window.localStorage.setItem(NIGHT_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function readWeatherModePreference() {
  try {
    const value = window.localStorage.getItem(WEATHER_MODE_STORAGE_KEY);
    return WEATHER_SEQUENCE.includes(value) ? value : 'clear';
  } catch {
    return 'clear';
  }
}

function writeWeatherModePreference(mode) {
  try {
    window.localStorage.setItem(WEATHER_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function readMapClickModePreference() {
  try {
    return window.localStorage.getItem(MAP_CLICK_MODE_STORAGE_KEY) === 'navigate'
      ? 'navigate'
      : 'teleport';
  } catch {
    return 'teleport';
  }
}

function writeMapClickModePreference(mode) {
  try {
    window.localStorage.setItem(MAP_CLICK_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function readGroundNavigationGuidePreference() {
  try {
    return window.localStorage.getItem(GROUND_NAVIGATION_GUIDE_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function writeGroundNavigationGuidePreference(enabled) {
  try {
    window.localStorage.setItem(GROUND_NAVIGATION_GUIDE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function readQualityModePreference() {
  try {
    const value = window.localStorage.getItem(QUALITY_MODE_STORAGE_KEY);
    if (value === 'low' || value === 'high' || value === 'ultra' || value === 'auto') return value;
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }

  if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) {
    return 'low';
  }

  return 'auto';
}

function writeQualityModePreference(mode) {
  try {
    window.localStorage.setItem(QUALITY_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function createCargoWaypoint(id, label, shortLabel, type, point, radius) {
  return {
    id,
    label,
    shortLabel,
    type,
    radius,
    position: {
      x: point.x,
      y: point.y ?? spawnPosition.y,
      z: point.z
    }
  };
}

function readCargoBestTime() {
  try {
    const value = Number(window.localStorage.getItem(CARGO_BEST_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeCargoBestTime(value) {
  try {
    if (Number.isFinite(value) && value > 0) {
      window.localStorage.setItem(CARGO_BEST_STORAGE_KEY, String(Math.round(value)));
    }
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}

function getNextQualityMode(mode) {
  if (mode === 'auto') return 'low';
  if (mode === 'low') return 'high';
  if (mode === 'high') return 'ultra';
  return 'auto';
}

function formatQualityMode(mode, language = 'en') {
  return getQualityText(language, mode);
}

function getNextWeatherMode(mode) {
  const currentIndex = WEATHER_SEQUENCE.indexOf(mode);
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;

  return WEATHER_SEQUENCE[nextIndex % WEATHER_SEQUENCE.length];
}

function createSceneWeatherSettings(weatherPreset, nightMode, renderQuality) {
  const baseFogFar = nightMode ? renderQuality.fogFar * 0.78 : renderQuality.fogFar;
  const fogNear = nightMode ? weatherPreset.fog.nearNight : weatherPreset.fog.nearDay;
  const fogFar = Math.max(fogNear + 44, baseFogFar * weatherPreset.fog.farMultiplier);
  const sunBase = nightMode ? 0.68 : 2.05;
  const fillBase = nightMode ? 0.16 : 0.3;
  const ambientBase = nightMode ? 0.2 : 0.42;
  const hemisphereBase = nightMode ? 0.42 : 0.86;

  return {
    skyColor: nightMode ? weatherPreset.sky.night : weatherPreset.sky.day,
    fogColor: nightMode ? weatherPreset.fog.night : weatherPreset.fog.day,
    fogNear,
    fogFar,
    hemiSky: nightMode ? weatherPreset.hemiSky.night : weatherPreset.hemiSky.day,
    hemiGround: nightMode ? weatherPreset.hemiGround.night : weatherPreset.hemiGround.day,
    hemisphereIntensity: hemisphereBase * weatherPreset.ambientMultiplier,
    ambientIntensity: ambientBase * weatherPreset.ambientMultiplier,
    sunPosition: nightMode ? [-58, 78, -42] : [42, 86, 24],
    sunColor: nightMode ? '#c7dcff' : '#fff3d0',
    sunIntensity: sunBase * weatherPreset.sunMultiplier,
    fillColor: nightMode ? '#8fb4dd' : '#d9f4ff',
    fillIntensity: fillBase * weatherPreset.fillMultiplier,
    exposure: (nightMode ? 1.12 : 1.16) * weatherPreset.exposureMultiplier
  };
}

function getRenderQualitySettings(mode = 'auto') {
  if (mode === 'low') {
    return {
      antialias: false,
      cameraFar: 500,
      fogFar: 390,
      loadRadius: 1,
      maxDpr: 1,
      powerPreference: 'low-power',
      precision: 'mediump',
      shadowMapSize: 512,
      shadows: false
    };
  }

  if (mode === 'high') {
    return {
      antialias: true,
      cameraFar: 780,
      fogFar: 640,
      loadRadius: 1,
      maxDpr: 1.25,
      powerPreference: 'high-performance',
      precision: 'highp',
      shadowMapSize: 1024,
      shadows: false
    };
  }

  if (mode === 'ultra') {
    return {
      antialias: true,
      cameraFar: 980,
      fogFar: 780,
      loadRadius: 1,
      maxDpr: 1.35,
      powerPreference: 'high-performance',
      precision: 'highp',
      shadowMapSize: 1024,
      shadows: true
    };
  }

  if (typeof navigator === 'undefined') {
    return {
      antialias: false,
      cameraFar: 560,
      fogFar: 440,
      loadRadius: 1,
      maxDpr: 1,
      powerPreference: 'low-power',
      precision: 'mediump',
      shadowMapSize: 512,
      shadows: false
    };
  }

  const cores = Number(navigator.hardwareConcurrency) || 4;
  const memoryGb = Number(navigator.deviceMemory) || 4;
  const coarsePointer = typeof window !== 'undefined'
    ? window.matchMedia?.('(pointer: coarse)').matches ?? false
    : false;
  const compactDevice = coarsePointer || cores <= 4 || memoryGb <= 4;

  if (compactDevice) {
    return {
      antialias: false,
      cameraFar: 500,
      fogFar: 390,
      loadRadius: 1,
      maxDpr: 1,
      powerPreference: 'low-power',
      precision: 'mediump',
      shadowMapSize: 512,
      shadows: false
    };
  }

  return {
    antialias: false,
    cameraFar: 620,
    fogFar: 500,
    loadRadius: 1,
    maxDpr: 1,
    powerPreference: 'low-power',
    precision: 'mediump',
    shadowMapSize: 512,
    shadows: false
  };
}

function formatCoord(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '--';
}

function formatTransportMissionPhase(phase, language = 'en') {
  return getTransportPhaseText(language, phase);
}

function formatTransportMissionTime(mission) {
  if (mission.phase === 'pickup') return 'at pickup';
  if (mission.phase === 'delivery') {
    const limitMs = mission.route?.limitMs ?? 240000;
    return formatRaceTime(Math.max(0, limitMs - mission.elapsedMs));
  }
  if (mission.phase === 'finished' || mission.phase === 'failed') {
    return formatRaceTime(mission.resultMs);
  }

  return '--';
}

function getTransportMissionGoalLabel(mission, language = 'en') {
  if (mission.phase === 'pickup') return getDestinationShortLabel(language, mission.route?.pickup) ?? 'Pickup';
  if (mission.phase === 'delivery') return getDestinationShortLabel(language, mission.route?.dropoff) ?? 'Dropoff';
  if (mission.phase === 'finished') return getText(language, 'delivered');
  if (mission.phase === 'failed') return getFailReasonText(language, mission.failReason || 'Timeout');
  return '--';
}

function formatLoadingProgress(chunkLoading) {
  if (!chunkLoading.total) return 'preparing';

  return `${chunkLoading.loaded}/${chunkLoading.total}`;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    window.requestAnimationFrame(finish);
    window.setTimeout(finish, 48);
  });
}

function areChunkSnapshotsEquivalent(previousSnapshot, nextSnapshot) {
  if (!previousSnapshot.currentChunk || !nextSnapshot.currentChunk) {
    return previousSnapshot.currentChunk === nextSnapshot.currentChunk;
  }

  if (
    previousSnapshot.currentChunk.chunkX !== nextSnapshot.currentChunk.chunkX ||
    previousSnapshot.currentChunk.chunkZ !== nextSnapshot.currentChunk.chunkZ ||
    previousSnapshot.loadedChunkKeys.length !== nextSnapshot.loadedChunkKeys.length
  ) {
    return false;
  }

  return previousSnapshot.loadedChunkKeys.every(
    (key, index) => key === nextSnapshot.loadedChunkKeys[index]
  );
}

function ensureGameAudio(audioRef) {
  if (audioRef.current) return audioRef.current;
  if (typeof window === 'undefined') return null;

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  const context = new AudioContextConstructor();
  const master = context.createGain();
  const engine = context.createOscillator();
  const engineFilter = context.createBiquadFilter();
  const engineGain = context.createGain();

  master.gain.value = 0.18;
  master.connect(context.destination);

  engine.type = 'sawtooth';
  engine.frequency.value = 54;
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 220;
  engineGain.gain.value = 0;
  engine.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(master);
  engine.start();

  audioRef.current = {
    context,
    engine,
    engineFilter,
    engineGain,
    master,
    lastCollisionAt: 0
  };

  return audioRef.current;
}

function updateVehicleAudio(audio, telemetry, muted) {
  if (!audio?.context) return;

  const now = audio.context.currentTime;
  const speedRatio = clampAudio((telemetry.speedKmh ?? 0) / 180, 0, 1);
  const surfaceRumble = telemetry.surfaceType === 'grass' ? 1.18 : 1;
  const nitroBoost = telemetry.nitroActive ? 32 : 0;
  const targetFrequency = (54 + speedRatio * 122 + nitroBoost) * surfaceRumble;
  const targetFilter = 180 + speedRatio * 520 + (telemetry.nitroActive ? 180 : 0);
  const targetGain = muted ? 0 : (0.012 + speedRatio * 0.055) * surfaceRumble;

  audio.engine.frequency.setTargetAtTime(targetFrequency, now, 0.075);
  audio.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.12);
  audio.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
}

function playCollisionSound(audio, pulse = 1) {
  if (!audio?.context) return;

  const now = audio.context.currentTime;
  if (now - audio.lastCollisionAt < 0.12) return;
  audio.lastCollisionAt = now;

  const impact = clampAudio(pulse || 0.65, 0.45, 1);
  const oscillator = audio.context.createOscillator();
  const impactGain = audio.context.createGain();
  const noise = createImpactNoise(audio.context, impact);

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(96, now);
  oscillator.frequency.exponentialRampToValueAtTime(34, now + 0.18);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(0.32 * impact, now + 0.012);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  oscillator.connect(impactGain);
  impactGain.connect(audio.master);
  oscillator.start(now);
  oscillator.stop(now + 0.25);

  if (noise) {
    noise.start(now);
    noise.stop(now + 0.16);
  }
}

function createImpactNoise(context, impact) {
  const sampleCount = Math.floor(context.sampleRate * 0.16);
  if (sampleCount <= 0) return null;

  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    const decay = 1 - index / sampleCount;
    channel[index] = (Math.random() * 2 - 1) * decay * decay;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = 420;
  filter.Q.value = 0.9;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18 * impact, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  return source;
}

function stopGameAudio(audio) {
  try {
    audio?.engine?.stop?.();
    audio?.context?.close?.();
  } catch {
    // Audio nodes may already be stopped during page teardown.
  }
}

function clampAudio(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
