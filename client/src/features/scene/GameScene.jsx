import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { ChaseCamera } from '../camera/ChaseCamera.jsx';
import { NavigationGroundGuide } from '../navigation/NavigationGroundGuide.jsx';
import { PerformanceProbe, RendererSettings } from '../performance/RenderDiagnostics.jsx';
import { RaceMarkers } from '../race/RaceMarkers.jsx';
import { PlayerCar } from '../vehicle/PlayerCar.jsx';
import { RemotePlayers } from '../vehicle/RemotePlayers.jsx';
import { WeatherSystem } from '../weather/WeatherSystem.jsx';
import { CityWorld } from '../world/CityWorld.jsx';

export default function GameScene({
  cameraMode,
  carRef,
  chunkSnapshot,
  gameControlsEnabled,
  gameState,
  multiplayer,
  navigationRoute,
  nightMode,
  playerVehicleConfig,
  raceModeEnabled,
  renderQuality,
  sceneWeather,
  showGroundNavigationGuide,
  setPerfStats,
  setTelemetry,
  telemetry,
  touchInput,
  tunnelStatus,
  weatherMode,
  weatherPreset
}) {
  const tunnelLightFloor = 1;
  const sceneExposure = sceneWeather.exposure * tunnelLightFloor;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const registry = window.__GAME4_ACTIVE_LOOPS__ ?? { scene: 0 };
    registry.scene = (registry.scene ?? 0) + 1;
    window.__GAME4_ACTIVE_LOOPS__ = registry;

    return () => {
      registry.scene = Math.max(0, (registry.scene ?? 1) - 1);
    };
  }, []);

  return (
    <Canvas
      shadows={renderQuality.shadows}
      dpr={[1, renderQuality.maxDpr]}
      camera={{ position: [0, 7, 14], fov: 55, near: 0.1, far: renderQuality.cameraFar }}
      gl={{
        antialias: renderQuality.antialias,
        powerPreference: renderQuality.powerPreference,
        precision: renderQuality.precision
      }}
      tabIndex={0}
      onCreated={({ gl }) => {
        gl.domElement.tabIndex = 0;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = sceneExposure;
        gl.shadowMap.enabled = renderQuality.shadows;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <RendererSettings exposure={sceneExposure} />
      <color attach="background" args={[sceneWeather.skyColor]} />
      <fog attach="fog" args={[sceneWeather.fogColor, sceneWeather.fogNear, sceneWeather.fogFar]} />
      <hemisphereLight args={[sceneWeather.hemiSky, sceneWeather.hemiGround, sceneWeather.hemisphereIntensity * tunnelLightFloor]} />
      <ambientLight intensity={sceneWeather.ambientIntensity * tunnelLightFloor} />
      <directionalLight
        castShadow={renderQuality.shadows}
        position={sceneWeather.sunPosition}
        intensity={sceneWeather.sunIntensity * tunnelLightFloor}
        color={sceneWeather.sunColor}
        shadow-bias={-0.00015}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
        shadow-mapSize-width={renderQuality.shadowMapSize}
        shadow-mapSize-height={renderQuality.shadowMapSize}
      />
      <directionalLight
        position={[-44, 34, -36]}
        intensity={sceneWeather.fillIntensity * tunnelLightFloor}
        color={sceneWeather.fillColor}
      />
      {nightMode ? (
        <>
          <pointLight position={[40, 9, 64]} intensity={1.25} distance={110} color="#f2d486" />
          <pointLight position={[130, 10, 82]} intensity={1.1} distance={120} color="#f2d486" />
          <pointLight position={[130, 10, 208]} intensity={1.1} distance={120} color="#f2d486" />
          <pointLight position={[260, 15, 146]} intensity={0.9} distance={130} color="#f2d486" />
          <pointLight position={[24, 8, 226]} intensity={0.85} distance={105} color="#f2d486" />
        </>
      ) : null}
      <WeatherSystem mode={weatherMode} nightMode={nightMode} targetRef={carRef} />
      <CityWorld
        chunkSnapshot={chunkSnapshot}
        nightMode={nightMode}
        playerPosition={telemetry.position}
        weatherMode={weatherMode}
      />
      <NavigationGroundGuide enabled={showGroundNavigationGuide} route={navigationRoute} />
      <PlayerCar
        ref={carRef}
        config={playerVehicleConfig}
        activeColliders={chunkSnapshot.colliders}
        activeRoadSurfaces={chunkSnapshot.driveSurfaces}
        controlsEnabled={gameControlsEnabled}
        driverView={cameraMode === 'firstPerson'}
        isNight={nightMode || weatherPreset.headlightsOn}
        touchInput={touchInput}
        weatherMode={weatherMode}
        onTelemetry={setTelemetry}
      />
      {raceModeEnabled ? (
        <RaceMarkers
          checkpointIndex={gameState.checkpointIndex}
          loadedChunks={chunkSnapshot.loadedChunks}
          phase={gameState.phase}
        />
      ) : null}
      <RemotePlayers
        players={multiplayer.remotePlayers}
        teleportEvent={multiplayer.teleportEvent}
      />
      <ChaseCamera mode={cameraMode} targetRef={carRef} tunnelStatus={tunnelStatus} />
      <PerformanceProbe
        loadedChunkCount={chunkSnapshot.loadedChunkKeys.length}
        onStats={setPerfStats}
        playerPosition={telemetry.position}
      />
    </Canvas>
  );
}
