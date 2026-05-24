import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BoxInstances, CylinderInstances, useDisposableResource } from '../rendering/instanceRenderers.jsx';
import { MovingTrafficVehicleInstances } from './MovingTrafficVehicleInstances.jsx';
import { RoadSignLabelMeshes } from './RoadSignLabels.jsx';

const trafficSignalMatrixObject = new THREE.Object3D();
const trafficSignalColorObject = new THREE.Color();
const airportLightMatrixObject = new THREE.Object3D();
const airportLightColorObject = new THREE.Color();

export function RoadsideLayers({ batches, nightMode = false, playerPosition, renderQuality }) {
  return (
    <>
      <StreetLightPointLights
        color="#ffd98a"
        enabled={nightMode && (renderQuality?.dynamicLightCount ?? 0) > 0}
        intensity={0.62}
        instances={batches.lightLampsNear}
        maxLights={renderQuality?.dynamicLightCount ?? 0}
        playerPosition={playerPosition}
        radius={46}
      />
      <StreetLightPointLights
        color="#f4d98a"
        enabled={(renderQuality?.dynamicLightCount ?? 0) > 0}
        intensity={0.42}
        instances={batches.tunnelLights}
        maxLights={Math.min(6, renderQuality?.dynamicLightCount ?? 0)}
        playerPosition={playerPosition}
        radius={34}
      />
      <AirportLightPointLights
        enabled={nightMode && (renderQuality?.dynamicLightCount ?? 0) > 0}
        instances={batches.airportLights}
        maxLights={Math.min(8, renderQuality?.dynamicLightCount ?? 0)}
        playerPosition={playerPosition}
      />
      <AirportLightInstances instances={batches.airportLights} nightMode={nightMode} />
      <CylinderInstances
        name="StreetLightPoleNearInstances"
        color="#2d3438"
        instances={batches.lightPolesNear}
        radialSegments={8}
        receiveShadow
        castShadow
        roughness={0.54}
        metalness={0.24}
      />
      <BoxInstances
        name="StreetLightArmNearInstances"
        color="#2d3438"
        instances={batches.lightArmsNear}
        materialType="standard"
        receiveShadow
        castShadow
        roughness={0.52}
        metalness={0.22}
      />
      <BoxInstances
        name="StreetLightLampNearInstances"
        color="#f2d486"
        emissive="#d08a1f"
        emissiveIntensity={nightMode ? 1.25 : 0.34}
        instances={batches.lightLampsNear}
        materialType="standard"
        roughness={0.48}
        toneMapped={false}
      />
      <CylinderInstances
        name="TrafficSignalPoleInstances"
        color="#30383c"
        instances={batches.trafficSignalPoles}
        radialSegments={8}
        receiveShadow
        castShadow
        roughness={0.5}
        metalness={0.2}
      />
      <BoxInstances
        name="TrafficSignalArmInstances"
        color="#30383c"
        instances={batches.trafficSignalArms}
        materialType="standard"
        receiveShadow
        castShadow
        roughness={0.52}
        metalness={0.18}
      />
      <BoxInstances
        name="TrafficSignalHeadInstances"
        color="#161b1d"
        instances={batches.trafficSignalHeads}
        materialType="standard"
        receiveShadow
        castShadow
        roughness={0.46}
        metalness={0.08}
      />
      <TrafficSignalLampInstances instances={batches.trafficSignalLamps} />
      <BoxInstances
        name="StreetLightLowInstances"
        color="#2d3438"
        instances={batches.lightsFar}
        materialType="standard"
        receiveShadow
        roughness={0.72}
        metalness={0.08}
      />
      <CylinderInstances
        name="BillboardPoleInstances"
        color="#353c42"
        instances={batches.billboardPoles}
        radialSegments={6}
        receiveShadow
        roughness={0.62}
        metalness={0.16}
      />
      <BoxInstances
        name="BillboardPanelInstances"
        instances={batches.billboardPanels}
        materialType="standard"
        receiveShadow
        useInstanceColor
        roughness={0.58}
        metalness={0.02}
      />
      <BoxInstances
        name="ExpresswayGuardrailInstances"
        color="#768187"
        instances={batches.guardrails}
        materialType="standard"
        receiveShadow
        castShadow
        roughness={0.56}
        side={THREE.DoubleSide}
        metalness={0.1}
      />
      <BoxInstances
        name="TunnelFrameInstances"
        color="#68737a"
        instances={batches.tunnelFrames}
        materialType="standard"
        receiveShadow
        roughness={0.76}
      />
      <BoxInstances
        name="TunnelWallPanelInstances"
        color="#68737a"
        emissive="#273035"
        emissiveIntensity={0.58}
        instances={batches.tunnelWallPanels}
        materialType="standard"
        receiveShadow
        useInstanceColor
        roughness={0.82}
      />
      <BoxInstances
        name="TunnelLightGlowInstances"
        color="#f4d98a"
        depthWrite={false}
        instances={batches.tunnelLightGlows}
        materialType="basic"
        opacity={0.38}
        transparent
      />
      <BoxInstances
        name="TunnelLightInstances"
        color="#f2d486"
        emissive="#f2d486"
        emissiveIntensity={nightMode ? 1.75 : 1.1}
        instances={batches.tunnelLights}
        materialType="standard"
        roughness={0.32}
        toneMapped={false}
      />
      <BoxInstances
        name="RoadSignPanelInstances"
        instances={batches.roadSigns}
        materialType="standard"
        receiveShadow
        useInstanceColor
        roughness={0.58}
      />
      <RoadSignLabelMeshes instances={batches.roadSignLabels} />
      <BoxInstances
        name="MetroObstacleInstances"
        color="#05070a"
        instances={batches.metroObstacles}
        materialType="basic"
        receiveShadow={false}
        castShadow={false}
        useInstanceColor
      />
      <BoxInstances
        name="TrafficObstacleInstances"
        instances={batches.trafficObstacles}
        materialType="standard"
        receiveShadow
        castShadow
        useInstanceColor
        roughness={0.62}
        metalness={0.02}
      />
      <MovingTrafficVehicleInstances instances={batches.trafficVehicles} playerPosition={playerPosition} />
    </>
  );
}

function StreetLightPointLights({
  color,
  enabled,
  instances,
  intensity,
  maxLights,
  playerPosition,
  radius
}) {
  const activeLights = useMemo(() => {
    if (!enabled || maxLights <= 0 || instances.length === 0 || !playerPosition) return [];

    const playerX = playerPosition.x ?? 0;
    const playerZ = playerPosition.z ?? 0;

    return instances
      .map((instance, index) => {
        const [x, y, z] = instance.position;
        const dx = x - playerX;
        const dz = z - playerZ;

        return {
          id: `${index}-${x.toFixed(1)}-${z.toFixed(1)}`,
          distanceSq: dx * dx + dz * dz,
          position: [x, y - 0.18, z]
        };
      })
      .filter((light) => light.distanceSq < 240 * 240)
      .sort((a, b) => a.distanceSq - b.distanceSq)
      .slice(0, maxLights);
  }, [enabled, instances, maxLights, playerPosition]);

  if (!enabled || activeLights.length === 0) return null;

  return (
    <>
      {activeLights.map((light, index) => (
        <pointLight
          key={light.id}
          position={light.position}
          intensity={index < 4 ? intensity : intensity * 0.62}
          distance={index < 4 ? radius : radius * 0.74}
          decay={2}
          color={color}
        />
      ))}
    </>
  );
}

function AirportLightPointLights({ enabled, instances = [], maxLights, playerPosition }) {
  const activeLights = useMemo(() => {
    if (!enabled || maxLights <= 0 || instances.length === 0 || !playerPosition) return [];

    const playerX = playerPosition.x ?? 0;
    const playerZ = playerPosition.z ?? 0;

    return instances
      .map((instance, index) => {
        const [x, y, z] = instance.position;
        const dx = x - playerX;
        const dz = z - playerZ;

        return {
          id: `${index}-${x.toFixed(1)}-${z.toFixed(1)}`,
          color: instance.color ?? '#f7f0c9',
          distanceSq: dx * dx + dz * dz,
          position: [x, y + 0.16, z]
        };
      })
      .filter((light) => light.distanceSq < 340 * 340)
      .sort((a, b) => a.distanceSq - b.distanceSq)
      .slice(0, maxLights);
  }, [enabled, instances, maxLights, playerPosition]);

  if (!enabled || activeLights.length === 0) return null;

  return (
    <>
      {activeLights.map((light, index) => (
        <pointLight
          key={light.id}
          position={light.position}
          intensity={index < 4 ? 0.58 : 0.32}
          distance={light.color === '#f0503f' ? 42 : 34}
          decay={2}
          color={light.color}
        />
      ))}
    </>
  );
}

function AirportLightInstances({ instances = [], nightMode = false }) {
  const meshRef = useRef(null);
  const geometry = useDisposableResource(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useDisposableResource(
    () => new THREE.MeshBasicMaterial({ toneMapped: false, vertexColors: true }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let index = 0; index < instances.length; index += 1) {
      writeAirportLightMatrix(mesh, index, instances[index]);
      mesh.setColorAt(index, getAirportLightColor(instances[index], 0, nightMode));
    }

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    mesh.computeBoundingSphere();
  }, [instances, nightMode]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();

    for (let index = 0; index < instances.length; index += 1) {
      mesh.setColorAt(index, getAirportLightColor(instances[index], elapsed, nightMode));
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      key={`AirportLightInstances-${instances.length}`}
      ref={meshRef}
      args={[geometry, material, instances.length]}
      dispose={null}
      frustumCulled
      name="AirportLightInstances"
    />
  );
}

function writeAirportLightMatrix(mesh, index, instance) {
  const [x, y, z] = instance.position;
  const [scaleX, scaleY, scaleZ] = instance.scale;
  const [rotationX = 0, rotationY = 0, rotationZ = 0] = instance.rotation ?? [];

  airportLightMatrixObject.position.set(x, y, z);
  airportLightMatrixObject.rotation.set(rotationX, rotationY, rotationZ);
  airportLightMatrixObject.scale.set(scaleX, scaleY, scaleZ);
  airportLightMatrixObject.updateMatrix();
  mesh.setMatrixAt(index, airportLightMatrixObject.matrix);
}

function getAirportLightColor(instance, elapsed, nightMode) {
  airportLightColorObject.set(instance.color ?? '#f7f0c9');
  const baseIntensity = nightMode ? 1.55 : 0.76;
  const pulse = instance.blink
    ? 0.32 + Math.max(0, Math.sin(elapsed * 3.8 + (instance.phase ?? 0))) * 1.12
    : 1;

  return airportLightColorObject.multiplyScalar(baseIntensity * pulse);
}

function TrafficSignalLampInstances({ instances }) {
  const meshRef = useRef(null);
  const geometry = useDisposableResource(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useDisposableResource(
    () => new THREE.MeshBasicMaterial({ vertexColors: true }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let index = 0; index < instances.length; index += 1) {
      writeTrafficSignalLampMatrix(mesh, index, instances[index]);
      mesh.setColorAt(index, getTrafficSignalLampColor(instances[index], 0));
    }

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    mesh.computeBoundingSphere();
  }, [instances]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = clock.getElapsedTime();

    for (let index = 0; index < instances.length; index += 1) {
      mesh.setColorAt(index, getTrafficSignalLampColor(instances[index], elapsed));
    }

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      key={`TrafficSignalLampInstances-${instances.length}`}
      ref={meshRef}
      args={[geometry, material, instances.length]}
      dispose={null}
      frustumCulled
      name="TrafficSignalLampInstances"
    />
  );
}

function writeTrafficSignalLampMatrix(mesh, index, instance) {
  const [x, y, z] = instance.position;
  const [scaleX, scaleY, scaleZ] = instance.scale;
  const [rotationX = 0, rotationY = 0, rotationZ = 0] = instance.rotation ?? [];

  trafficSignalMatrixObject.position.set(x, y, z);
  trafficSignalMatrixObject.rotation.set(rotationX, rotationY, rotationZ);
  trafficSignalMatrixObject.scale.set(scaleX, scaleY, scaleZ);
  trafficSignalMatrixObject.updateMatrix();
  mesh.setMatrixAt(index, trafficSignalMatrixObject.matrix);
}

function getTrafficSignalLampColor(instance, elapsed) {
  const active = isTrafficSignalLampActive(instance, elapsed);
  const color = active
    ? instance.color
    : instance.lampType === 'red'
      ? '#351515'
      : instance.lampType === 'yellow'
        ? '#3b3216'
        : '#16351f';

  return trafficSignalColorObject.set(color);
}

function isTrafficSignalLampActive(instance, elapsed) {
  const cycle = 18;
  const phase = ((elapsed % cycle) + cycle) % cycle;

  if (instance.axis === 'x') {
    if (instance.lampType === 'green') return phase < 8.2;
    if (instance.lampType === 'yellow') return phase >= 8.2 && phase < 9.2;
    return phase >= 9.2;
  }

  if (instance.lampType === 'red') return phase < 9.2;
  if (instance.lampType === 'green') return phase >= 9.2 && phase < 17.2;
  return phase >= 17.2;
}
