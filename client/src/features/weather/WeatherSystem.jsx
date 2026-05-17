import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CloudLayer } from './CloudLayer.jsx';
import { getWeatherPreset } from './weatherPresets.js';

export function WeatherSystem({ mode = 'clear', nightMode = false, targetRef }) {
  const preset = getWeatherPreset(mode);

  if (mode === 'clear') return null;

  return (
    <group name="weather-system">
      {preset.cloudOpacity > 0 ? (
        <CloudLayer nightMode={nightMode} opacity={preset.cloudOpacity} />
      ) : null}
      {preset.hazeOpacity > 0 ? (
        <GroundHaze color={preset.fog[nightMode ? 'night' : 'day']} opacity={preset.hazeOpacity} />
      ) : null}
      {preset.precipitation !== 'none' ? (
        <Precipitation key={mode} preset={preset} targetRef={targetRef} />
      ) : null}
      {preset.lightning ? <StormLightning nightMode={nightMode} /> : null}
    </group>
  );
}

function Precipitation({ preset, targetRef }) {
  const linesRef = useRef(null);
  const geometryRef = useRef(null);
  const positions = useMemo(() => createPrecipitationPositions(preset), [preset]);
  const dropCount = Math.floor(positions.length / 6);
  const lowY = -10;
  const highY = 44;

  useFrame(({ camera }, delta) => {
    const lines = linesRef.current;
    const geometry = geometryRef.current;
    const attribute = geometry?.attributes?.position;

    if (!lines || !attribute) return;

    const anchor = targetRef?.current?.position ?? camera.position;
    lines.position.set(anchor.x, anchor.y, anchor.z);

    const array = attribute.array;
    const fall = preset.precipitationSpeed * delta;
    const driftX = (preset.wind?.x ?? 0) * delta * 12;
    const driftZ = (preset.wind?.z ?? 0) * delta * 12;

    for (let i = 0; i < array.length; i += 6) {
      array[i] += driftX;
      array[i + 1] -= fall;
      array[i + 2] += driftZ;
      array[i + 3] += driftX;
      array[i + 4] -= fall;
      array[i + 5] += driftZ;

      if (array[i + 1] < lowY) {
        resetDrop(array, i, preset, highY);
      }
    }

    attribute.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef} name="weather-precipitation" frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={dropCount * 2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={preset.precipitationColor}
        depthWrite={false}
        opacity={preset.precipitationOpacity}
        transparent
      />
    </lineSegments>
  );
}

function GroundHaze({ color, opacity }) {
  const hazeRef = useRef(null);

  useFrame(({ camera }) => {
    const haze = hazeRef.current;
    if (!haze) return;

    haze.position.x = camera.position.x;
    haze.position.z = camera.position.z;
  });

  return (
    <mesh ref={hazeRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[260, 260, 1, 1]} />
      <meshBasicMaterial color={color} depthWrite={false} opacity={opacity} transparent />
    </mesh>
  );
}

function StormLightning({ nightMode }) {
  const lightRef = useRef(null);
  const stateRef = useRef({
    nextStrike: 1.8,
    intensity: 0
  });

  useFrame((_, delta) => {
    const state = stateRef.current;
    state.nextStrike -= delta;
    state.intensity = Math.max(0, state.intensity - delta * 16);

    if (state.nextStrike <= 0) {
      state.nextStrike = 2.2 + Math.random() * 4.2;
      state.intensity = (nightMode ? 9 : 6) + Math.random() * 5;
    }

    if (lightRef.current) {
      lightRef.current.intensity = state.intensity;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      color="#d9efff"
      distance={720}
      position={[-120, 165, 80]}
    />
  );
}

function createPrecipitationPositions(preset) {
  const count = preset.precipitationCount ?? 800;
  const radius = preset.precipitation === 'storm' ? 86 : preset.precipitation === 'snow' ? 82 : 72;
  const length = preset.precipitationLength ?? 1;
  const positions = new Float32Array(count * 6);

  for (let i = 0; i < positions.length; i += 6) {
    resetDrop(positions, i, preset, Math.random() * 50);

    positions[i] = Math.random() * radius * 2 - radius;
    positions[i + 2] = Math.random() * radius * 2 - radius;
    positions[i + 3] = positions[i] - (preset.wind?.x ?? 0) * length;
    positions[i + 5] = positions[i + 2] - (preset.wind?.z ?? 0) * length;
  }

  return positions;
}

function resetDrop(array, index, preset, topY) {
  const radius = preset.precipitation === 'storm' ? 86 : preset.precipitation === 'snow' ? 82 : 72;
  const length = preset.precipitationLength ?? 1;
  const x = Math.random() * radius * 2 - radius;
  const y = topY + Math.random() * 18;
  const z = Math.random() * radius * 2 - radius;
  const windX = preset.wind?.x ?? 0;
  const windZ = preset.wind?.z ?? 0;

  array[index] = x;
  array[index + 1] = y;
  array[index + 2] = z;
  array[index + 3] = x - windX * length;
  array[index + 4] = y - length;
  array[index + 5] = z - windZ * length;
}
