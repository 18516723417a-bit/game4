import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDisposableResource } from '../rendering/instanceRenderers.jsx';
import { clamp, lerp, positiveModulo } from '../utils/math.js';

const trafficVehicleRootObject = new THREE.Object3D();
const trafficVehiclePartObject = new THREE.Object3D();
const colorObject = new THREE.Color();
const INTERSECTION_YIELD_LOOKAHEAD = 0.13;
const INTERSECTION_YIELD_RADIUS = 58;
const SMOOTH_TRAFFIC_PATH_TYPES = new Set(['bus-route', 'intersection-turn', 'junction-route', 'metro-line', 'smart-turn']);
const TRAFFIC_TURN_LOOKAHEAD_DISTANCE = 6.5;

const TRAFFIC_VEHICLE_PARTS = [
  {
    key: 'body',
    geometry: 'body',
    colorFromVehicle: true,
    metalness: 0.14,
    position: [0, 0.52, 0],
    receiveShadow: true,
    roughness: 0.44,
    scale: [0.92, 0.82, 0.92],
    side: THREE.DoubleSide
  },
  {
    key: 'hood',
    geometry: 'box',
    colorFromVehicle: true,
    colorLightness: 0.04,
    hideTypes: ['bus'],
    metalness: 0.16,
    position: [0, 0.73, 0.31],
    receiveShadow: true,
    rotation: [-0.06, 0, 0],
    roughness: 0.4,
    scale: [0.66, 0.1, 0.22]
  },
  {
    key: 'cabin',
    color: '#172634',
    geometry: 'cabin',
    hideTypes: ['bus'],
    metalness: 0.08,
    position: [0, 0.98, -0.08],
    receiveShadow: true,
    roughness: 0.22,
    scale: [0.62, 0.62, 0.36],
    side: THREE.DoubleSide
  },
  {
    key: 'roof',
    geometry: 'box',
    colorFromVehicle: true,
    colorLightness: -0.06,
    metalness: 0.16,
    hideTypes: ['bus'],
    position: [0, 1.24, -0.11],
    receiveShadow: true,
    roughness: 0.42,
    scale: [0.46, 0.08, 0.24]
  },
  {
    key: 'bus-window-left',
    color: '#102634',
    geometry: 'box',
    metalness: 0.08,
    onlyTypes: ['bus'],
    position: [-0.49, 0.86, -0.02],
    roughness: 0.18,
    scale: [0.035, 0.28, 0.72]
  },
  {
    key: 'bus-window-right',
    color: '#102634',
    geometry: 'box',
    metalness: 0.08,
    onlyTypes: ['bus'],
    position: [0.49, 0.86, -0.02],
    roughness: 0.18,
    scale: [0.035, 0.28, 0.72]
  },
  {
    key: 'bus-route-board',
    color: '#f2d486',
    geometry: 'box',
    emissive: '#b48f20',
    emissiveIntensity: 0.35,
    onlyTypes: ['bus'],
    position: [0, 0.78, 0.51],
    roughness: 0.26,
    scale: [0.42, 0.12, 0.032]
  },
  {
    key: 'bus-side-stripe-left',
    colorFromVehicle: true,
    colorLightness: 0.08,
    geometry: 'box',
    onlyTypes: ['bus'],
    position: [-0.505, 0.52, -0.02],
    roughness: 0.4,
    scale: [0.026, 0.06, 0.82]
  },
  {
    key: 'bus-side-stripe-right',
    colorFromVehicle: true,
    colorLightness: 0.08,
    geometry: 'box',
    onlyTypes: ['bus'],
    position: [0.505, 0.52, -0.02],
    roughness: 0.4,
    scale: [0.026, 0.06, 0.82]
  },
  {
    key: 'taxi-roof-light',
    color: '#fff3a6',
    emissive: '#f2d486',
    emissiveIntensity: 0.58,
    geometry: 'box',
    onlyTypes: ['taxi'],
    position: [0, 1.34, -0.02],
    roughness: 0.2,
    scale: [0.25, 0.075, 0.14]
  },
  {
    key: 'taxi-door-card-left',
    color: '#101214',
    geometry: 'box',
    onlyTypes: ['taxi'],
    position: [-0.505, 0.62, -0.03],
    roughness: 0.24,
    scale: [0.025, 0.12, 0.16]
  },
  {
    key: 'taxi-door-card-right',
    color: '#101214',
    geometry: 'box',
    onlyTypes: ['taxi'],
    position: [0.505, 0.62, -0.03],
    roughness: 0.24,
    scale: [0.025, 0.12, 0.16]
  },
  {
    key: 'metro-body',
    colorFromVehicle: true,
    emissive: '#dfe8ec',
    emissiveIntensity: 0.18,
    geometry: 'box',
    metalness: 0.12,
    onlyTypes: ['metroTrain'],
    position: [0, 0.5, 0],
    receiveShadow: true,
    roughness: 0.34,
    scale: [1, 1, 1]
  },
  {
    key: 'metro-roof',
    color: '#d7dee2',
    emissive: '#c4cdd2',
    emissiveIntensity: 0.08,
    geometry: 'box',
    metalness: 0.18,
    onlyTypes: ['metroTrain'],
    position: [0, 1.03, 0],
    receiveShadow: true,
    roughness: 0.34,
    scale: [0.92, 0.12, 0.9]
  },
  {
    key: 'metro-roof-equipment-a',
    color: '#8b969d',
    geometry: 'box',
    metalness: 0.2,
    onlyTypes: ['metroTrain'],
    position: [0, 1.15, -0.18],
    receiveShadow: true,
    roughness: 0.32,
    scale: [0.42, 0.08, 0.22]
  },
  {
    key: 'metro-roof-equipment-b',
    color: '#8b969d',
    geometry: 'box',
    metalness: 0.2,
    onlyTypes: ['metroTrain'],
    position: [0, 1.15, 0.22],
    receiveShadow: true,
    roughness: 0.32,
    scale: [0.34, 0.07, 0.16]
  },
  {
    key: 'metro-window-left',
    color: '#21313a',
    geometry: 'box',
    metalness: 0.08,
    onlyTypes: ['metroTrain'],
    position: [-0.51, 0.72, 0],
    roughness: 0.16,
    scale: [0.035, 0.28, 0.78]
  },
  {
    key: 'metro-window-right',
    color: '#21313a',
    geometry: 'box',
    metalness: 0.08,
    onlyTypes: ['metroTrain'],
    position: [0.51, 0.72, 0],
    roughness: 0.16,
    scale: [0.035, 0.28, 0.78]
  },
  {
    key: 'metro-front-window',
    color: '#21313a',
    geometry: 'box',
    metalness: 0.08,
    onlyTypes: ['metroTrain'],
    position: [0, 0.76, 0.505],
    roughness: 0.16,
    scale: [0.56, 0.28, 0.035]
  },
  {
    key: 'metro-rear-window',
    color: '#21313a',
    geometry: 'box',
    metalness: 0.08,
    onlyTypes: ['metroTrain'],
    position: [0, 0.76, -0.505],
    roughness: 0.16,
    scale: [0.56, 0.28, 0.035]
  },
  {
    key: 'metro-front-route-board',
    colorFromLine: true,
    emissiveFromLine: true,
    emissiveIntensity: 0.48,
    geometry: 'box',
    onlyTrainEnds: ['front'],
    onlyTypes: ['metroTrain'],
    position: [0, 1.0, 0.545],
    roughness: 0.2,
    scale: [0.42, 0.1, 0.025]
  },
  {
    key: 'metro-rear-route-board',
    colorFromLine: true,
    emissiveFromLine: true,
    emissiveIntensity: 0.34,
    geometry: 'box',
    onlyTrainEnds: ['rear'],
    onlyTypes: ['metroTrain'],
    position: [0, 1.0, -0.545],
    roughness: 0.2,
    scale: [0.42, 0.1, 0.025]
  },
  {
    key: 'metro-line-stripe-left',
    colorFromLine: true,
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [-0.525, 0.47, 0],
    roughness: 0.36,
    scale: [0.03, 0.095, 0.98]
  },
  {
    key: 'metro-line-stripe-right',
    colorFromLine: true,
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [0.525, 0.47, 0],
    roughness: 0.36,
    scale: [0.03, 0.095, 0.98]
  },
  {
    key: 'metro-line-stripe-front',
    colorFromLine: true,
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [0, 0.47, 0.525],
    roughness: 0.36,
    scale: [0.84, 0.095, 0.024]
  },
  {
    key: 'metro-line-stripe-rear',
    colorFromLine: true,
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [0, 0.47, -0.525],
    roughness: 0.36,
    scale: [0.84, 0.095, 0.024]
  },
  {
    key: 'metro-door-left-a',
    color: '#cbd3d8',
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [-0.535, 0.5, -0.24],
    roughness: 0.28,
    scale: [0.02, 0.56, 0.16]
  },
  {
    key: 'metro-door-left-b',
    color: '#cbd3d8',
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [-0.535, 0.5, 0.24],
    roughness: 0.28,
    scale: [0.02, 0.56, 0.16]
  },
  {
    key: 'metro-door-right-a',
    color: '#cbd3d8',
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [0.535, 0.5, -0.24],
    roughness: 0.28,
    scale: [0.02, 0.56, 0.16]
  },
  {
    key: 'metro-door-right-b',
    color: '#cbd3d8',
    geometry: 'box',
    onlyTypes: ['metroTrain'],
    position: [0.535, 0.5, 0.24],
    roughness: 0.28,
    scale: [0.02, 0.56, 0.16]
  },
  {
    key: 'metro-front-headlight-left',
    color: '#fff3a6',
    emissive: '#f2d486',
    emissiveIntensity: 0.8,
    geometry: 'box',
    onlyTrainEnds: ['front'],
    onlyTypes: ['metroTrain'],
    position: [-0.24, 0.28, 0.515],
    roughness: 0.18,
    scale: [0.14, 0.1, 0.025]
  },
  {
    key: 'metro-front-headlight-right',
    color: '#fff3a6',
    emissive: '#f2d486',
    emissiveIntensity: 0.8,
    geometry: 'box',
    onlyTrainEnds: ['front'],
    onlyTypes: ['metroTrain'],
    position: [0.24, 0.28, 0.515],
    roughness: 0.18,
    scale: [0.14, 0.1, 0.025]
  },
  {
    key: 'metro-rear-light-left',
    color: '#e36d5c',
    emissive: '#8f1510',
    emissiveIntensity: 0.48,
    geometry: 'box',
    onlyTrainEnds: ['rear'],
    onlyTypes: ['metroTrain'],
    position: [-0.24, 0.28, -0.515],
    roughness: 0.18,
    scale: [0.12, 0.1, 0.025]
  },
  {
    key: 'metro-rear-light-right',
    color: '#e36d5c',
    emissive: '#8f1510',
    emissiveIntensity: 0.48,
    geometry: 'box',
    onlyTrainEnds: ['rear'],
    onlyTypes: ['metroTrain'],
    position: [0.24, 0.28, -0.515],
    roughness: 0.18,
    scale: [0.12, 0.1, 0.025]
  },
  {
    key: 'truck-cargo-box',
    color: '#cfd4ca',
    geometry: 'box',
    metalness: 0.05,
    onlyTypes: ['truck'],
    position: [0, 0.78, -0.16],
    receiveShadow: true,
    roughness: 0.58,
    scale: [0.86, 0.68, 0.76]
  },
  {
    key: 'truck-cargo-top',
    color: '#e5eef2',
    geometry: 'box',
    onlyTypes: ['truck'],
    position: [0, 1.13, -0.16],
    roughness: 0.54,
    scale: [0.82, 0.035, 0.72]
  },
  {
    key: 'windshield',
    color: '#0d1b25',
    geometry: 'box',
    hideTypes: ['bus'],
    metalness: 0.08,
    position: [0, 0.96, 0.15],
    roughness: 0.16,
    rotation: [-0.2, 0, 0],
    scale: [0.54, 0.06, 0.12]
  },
  {
    key: 'rear-window',
    color: '#0d1b25',
    geometry: 'box',
    hideTypes: ['bus', 'truck'],
    metalness: 0.08,
    position: [0, 0.94, -0.29],
    roughness: 0.18,
    rotation: [0.14, 0, 0],
    scale: [0.52, 0.06, 0.1]
  },
  {
    key: 'left-side-window',
    color: '#102634',
    geometry: 'box',
    hideTypes: ['bus'],
    metalness: 0.08,
    position: [-0.46, 0.94, -0.08],
    roughness: 0.18,
    scale: [0.035, 0.26, 0.3]
  },
  {
    key: 'right-side-window',
    color: '#102634',
    geometry: 'box',
    hideTypes: ['bus'],
    metalness: 0.08,
    position: [0.46, 0.94, -0.08],
    roughness: 0.18,
    scale: [0.035, 0.26, 0.3]
  },
  {
    key: 'front-bumper',
    color: '#15191d',
    geometry: 'box',
    metalness: 0.24,
    position: [0, 0.36, 0.49],
    receiveShadow: true,
    roughness: 0.38,
    scale: [0.58, 0.14, 0.04]
  },
  {
    key: 'rear-bumper',
    color: '#202428',
    geometry: 'box',
    metalness: 0.2,
    position: [0, 0.34, -0.49],
    receiveShadow: true,
    roughness: 0.48,
    scale: [0.64, 0.14, 0.04]
  },
  {
    key: 'left-headlight',
    color: '#f7f0c9',
    emissive: '#f2d486',
    emissiveIntensity: 0.7,
    geometry: 'box',
    position: [-0.22, 0.43, 0.51],
    roughness: 0.22,
    scale: [0.14, 0.11, 0.03]
  },
  {
    key: 'right-headlight',
    color: '#f7f0c9',
    emissive: '#f2d486',
    emissiveIntensity: 0.7,
    geometry: 'box',
    position: [0.22, 0.43, 0.51],
    roughness: 0.22,
    scale: [0.14, 0.11, 0.03]
  },
  {
    key: 'left-tail-light',
    color: '#ff3b30',
    dynamicColor: true,
    emissive: '#9c1411',
    emissiveIntensity: 0.48,
    geometry: 'box',
    lightRole: 'tail',
    position: [-0.24, 0.45, -0.51],
    roughness: 0.2,
    scale: [0.12, 0.11, 0.03]
  },
  {
    key: 'right-tail-light',
    color: '#ff3b30',
    dynamicColor: true,
    emissive: '#9c1411',
    emissiveIntensity: 0.48,
    geometry: 'box',
    lightRole: 'tail',
    position: [0.24, 0.45, -0.51],
    roughness: 0.2,
    scale: [0.12, 0.11, 0.03]
  },
  {
    key: 'left-front-turn-signal',
    color: '#2a1606',
    dynamicColor: true,
    geometry: 'box',
    lightRole: 'indicator',
    position: [-0.38, 0.44, 0.51],
    roughness: 0.18,
    scale: [0.08, 0.09, 0.035],
    signalSide: 'left'
  },
  {
    key: 'right-front-turn-signal',
    color: '#2a1606',
    dynamicColor: true,
    geometry: 'box',
    lightRole: 'indicator',
    position: [0.38, 0.44, 0.51],
    roughness: 0.18,
    scale: [0.08, 0.09, 0.035],
    signalSide: 'right'
  },
  {
    key: 'left-rear-turn-signal',
    color: '#2a1606',
    dynamicColor: true,
    geometry: 'box',
    lightRole: 'indicator',
    position: [-0.4, 0.45, -0.51],
    roughness: 0.18,
    scale: [0.08, 0.09, 0.035],
    signalSide: 'left'
  },
  {
    key: 'right-rear-turn-signal',
    color: '#2a1606',
    dynamicColor: true,
    geometry: 'box',
    lightRole: 'indicator',
    position: [0.4, 0.45, -0.51],
    roughness: 0.18,
    scale: [0.08, 0.09, 0.035],
    signalSide: 'right'
  },
  {
    key: 'wheel-front-left',
    color: '#101214',
    geometry: 'wheel',
    position: [-0.47, 0.18, 0.32],
    receiveShadow: true,
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.72,
    scale: [0.24, 0.055, 0.24],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'wheel-front-right',
    color: '#101214',
    geometry: 'wheel',
    position: [0.47, 0.18, 0.32],
    receiveShadow: true,
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.72,
    scale: [0.24, 0.055, 0.24],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'wheel-rear-left',
    color: '#101214',
    geometry: 'wheel',
    position: [-0.47, 0.18, -0.32],
    receiveShadow: true,
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.72,
    scale: [0.24, 0.055, 0.24],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'wheel-rear-right',
    color: '#101214',
    geometry: 'wheel',
    position: [0.47, 0.18, -0.32],
    receiveShadow: true,
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.72,
    scale: [0.24, 0.055, 0.24],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'hub-front-left',
    color: '#c6c9c8',
    geometry: 'wheel',
    metalness: 0.52,
    position: [-0.49, 0.18, 0.32],
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.3,
    scale: [0.12, 0.018, 0.12],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'hub-front-right',
    color: '#c6c9c8',
    geometry: 'wheel',
    metalness: 0.52,
    position: [0.49, 0.18, 0.32],
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.3,
    scale: [0.12, 0.018, 0.12],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'hub-rear-left',
    color: '#c6c9c8',
    geometry: 'wheel',
    metalness: 0.52,
    position: [-0.49, 0.18, -0.32],
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.3,
    scale: [0.12, 0.018, 0.12],
    scaleAxes: [1, 0, 1]
  },
  {
    key: 'hub-rear-right',
    color: '#c6c9c8',
    geometry: 'wheel',
    metalness: 0.52,
    position: [0.49, 0.18, -0.32],
    rotation: [0, 0, Math.PI / 2],
    roughness: 0.3,
    scale: [0.12, 0.018, 0.12],
    scaleAxes: [1, 0, 1]
  }
];

trafficVehicleRootObject.add(trafficVehiclePartObject);

let trafficMotionFrameCache = {
  elapsed: Number.NaN,
  instances: null,
  motions: [],
  playerX: null,
  playerZ: null
};

export function MovingTrafficVehicleInstances({ instances, playerPosition }) {
  if (instances.length === 0) return null;

  return (
    <group name="MovingTrafficVehicleInstances">
      {TRAFFIC_VEHICLE_PARTS.map((part) => (
        <TrafficVehiclePartInstances
          key={part.key}
          instances={instances}
          playerPosition={playerPosition}
          part={part}
        />
      ))}
    </group>
  );
}

function TrafficVehiclePartInstances({ instances, part, playerPosition }) {
  const meshRef = useRef(null);
  const renderEntries = useMemo(() => (
    instances
      .map((vehicle, sourceIndex) => ({ sourceIndex, vehicle }))
      .filter(({ vehicle }) => isTrafficVehiclePartVisible(part, vehicle))
      .map((entry, renderIndex) => ({ ...entry, renderIndex }))
  ), [instances, part]);
  const animatedEntries = useMemo(() => (
    renderEntries.filter(({ vehicle }) => Boolean(vehicle.speed))
  ), [renderEntries]);
  const geometry = useDisposableResource(() => createTrafficVehiclePartGeometry(part.geometry), [part.geometry]);
  const material = useDisposableResource(() => new THREE.MeshStandardMaterial({
    color: part.colorFromVehicle || part.colorFromLine || part.dynamicColor ? '#ffffff' : part.color,
    emissive: part.emissiveFromLine ? '#f2d486' : part.emissive ?? '#000000',
    emissiveIntensity: part.emissiveIntensity ?? 0,
    metalness: part.metalness ?? 0.04,
    roughness: part.roughness ?? 0.5,
    side: part.side ?? THREE.FrontSide,
    vertexColors: Boolean(part.colorFromVehicle || part.colorFromLine || part.dynamicColor)
  }), [part]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    for (let index = 0; index < renderEntries.length; index += 1) {
      const { sourceIndex, vehicle } = renderEntries[index];
      const motion = part.dynamicColor
        ? getTrafficVehicleMotion(vehicle, 0, instances, sourceIndex, playerPosition)
        : null;

      writeTrafficVehiclePartMatrix(mesh, index, vehicle, 0, part, instances, playerPosition, motion, sourceIndex);

      if (part.colorFromVehicle || part.colorFromLine || part.dynamicColor) {
        mesh.setColorAt(index, getTrafficVehiclePartColor(vehicle, part, 0, motion));
      }
    }

    mesh.count = renderEntries.length;
    mesh.instanceMatrix.needsUpdate = true;

    if ((part.colorFromVehicle || part.colorFromLine || part.dynamicColor) && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
      mesh.material.needsUpdate = true;
    }
  }, [instances, part, playerPosition, renderEntries]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    if (!mesh) return;

    const elapsed = clock.elapsedTime;

    for (let index = 0; index < animatedEntries.length; index += 1) {
      const { renderIndex, sourceIndex, vehicle } = animatedEntries[index];
      const motion = getTrafficVehicleMotion(vehicle, elapsed, instances, sourceIndex, playerPosition);

      writeTrafficVehiclePartMatrix(mesh, renderIndex, vehicle, elapsed, part, instances, playerPosition, motion, sourceIndex);

      if (part.dynamicColor) {
        mesh.setColorAt(renderIndex, getTrafficVehiclePartColor(vehicle, part, elapsed, motion));
      }
    }

    if (animatedEntries.length === 0) return;

    mesh.count = renderEntries.length;
    mesh.instanceMatrix.needsUpdate = true;

    if (part.dynamicColor && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  if (renderEntries.length === 0) return null;

  return (
    <instancedMesh
      key={`${part.key}-${renderEntries.length}`}
      ref={meshRef}
      args={[geometry, material, renderEntries.length]}
      castShadow={part.castShadow !== false}
      dispose={null}
      frustumCulled={false}
      name={`MovingTrafficVehiclePart:${part.key}`}
      receiveShadow={!!part.receiveShadow}
    />
  );
}

function writeTrafficVehiclePartMatrix(mesh, index, vehicle, elapsed, part, instances, playerPosition, motionOverride = null, sourceIndex = index) {
  const motion = motionOverride ?? getTrafficVehicleMotion(vehicle, elapsed, instances, sourceIndex, playerPosition);
  const pose = motion.pose ?? getTrafficPathPose(vehicle.path, motion.progress);
  const [width, height, depth] = vehicle.scale;
  const [localX, localY, localZ] = part.position;
  const [rotationX = 0, rotationY = 0, rotationZ = 0] = part.rotation ?? [];
  const [scaleX, scaleY, scaleZ] = (
    isTrafficVehiclePartVisible(part, vehicle) &&
    isTrafficVehiclePoseInsideRenderBounds(vehicle, pose)
  )
    ? getTrafficVehiclePartScale(part, width, height, depth)
    : [0, 0, 0];

  trafficVehicleRootObject.position.set(pose.x, pose.y ?? vehicle.baseY, pose.z);
  trafficVehicleRootObject.rotation.set(0, pose.yaw, 0);
  trafficVehiclePartObject.position.set(localX * width, localY * height, localZ * depth);
  trafficVehiclePartObject.rotation.set(rotationX, rotationY, rotationZ);
  trafficVehiclePartObject.scale.set(scaleX, scaleY, scaleZ);
  trafficVehicleRootObject.updateMatrixWorld(true);
  mesh.setMatrixAt(index, trafficVehiclePartObject.matrixWorld);
}

function isTrafficVehiclePartVisible(part, vehicle) {
  const type = vehicle?.vehicleType ?? 'car';

  if (type === 'metroTrain' && (!Array.isArray(part.onlyTypes) || !part.onlyTypes.includes(type))) return false;
  if (Array.isArray(part.onlyTypes) && !part.onlyTypes.includes(type)) return false;
  if (Array.isArray(part.hideTypes) && part.hideTypes.includes(type)) return false;
  if (Array.isArray(part.onlyTrainEnds) && !part.onlyTrainEnds.includes(vehicle?.trainEnd)) return false;
  return true;
}

function isTrafficVehiclePoseInsideRenderBounds(vehicle, pose) {
  const bounds = vehicle?.renderBounds;
  if (!bounds) return true;

  return pose.x >= bounds.minX &&
    pose.x <= bounds.maxX &&
    pose.z >= bounds.minZ &&
    pose.z <= bounds.maxZ;
}

function getTrafficVehicleMotion(vehicle, elapsed, instances = [], vehicleIndex = -1, playerPosition = null) {
  const cache = getTrafficMotionFrameCache(instances, elapsed, playerPosition);
  if (cache && vehicleIndex >= 0) {
    const cached = cache.motions[vehicleIndex];
    if (cached) return cached;
  }

  if (!vehicle.speed) {
    return finalizeTrafficVehicleMotion(vehicle, {
      direction: 1,
      braking: 0,
      progress: clamp(vehicle.offset ?? 0, 0, 1)
    }, cache, vehicleIndex);
  }

  const timedMotion = getTimedTrafficMotion(vehicle, elapsed);
  const trafficMotion = applyFollowingDistance(timedMotion, vehicle, instances, vehicleIndex, elapsed);
  const yieldedMotion = applyIntersectionYield(trafficMotion, vehicle, instances, vehicleIndex, elapsed);

  return finalizeTrafficVehicleMotion(
    vehicle,
    applyPlayerAvoidance(yieldedMotion, vehicle, playerPosition),
    cache,
    vehicleIndex
  );
}

function getTrafficMotionFrameCache(instances, elapsed, playerPosition) {
  if (!Array.isArray(instances)) return null;

  const playerX = Number.isFinite(playerPosition?.x) ? playerPosition.x : null;
  const playerZ = Number.isFinite(playerPosition?.z) ? playerPosition.z : null;

  if (
    trafficMotionFrameCache.instances !== instances ||
    trafficMotionFrameCache.elapsed !== elapsed ||
    trafficMotionFrameCache.playerX !== playerX ||
    trafficMotionFrameCache.playerZ !== playerZ
  ) {
    trafficMotionFrameCache = {
      elapsed,
      instances,
      motions: new Array(instances.length),
      playerX,
      playerZ
    };
  }

  return trafficMotionFrameCache;
}

function finalizeTrafficVehicleMotion(vehicle, motion, cache, vehicleIndex) {
  const pose = getTrafficPathPose(vehicle.path, motion.progress);

  if (motion.direction < 0) {
    pose.yaw += Math.PI;
  }

  const result = {
    ...motion,
    pose
  };

  if (cache && vehicleIndex >= 0) {
    cache.motions[vehicleIndex] = result;
  }

  return result;
}

function getTimedTrafficMotion(vehicle, elapsed) {
  if (vehicle.behavior === 'metro-train' && Array.isArray(vehicle.metroStops)) {
    return getMetroTrainTimedMotion(vehicle, elapsed);
  }

  const rawProgress = (vehicle.offset ?? 0) + elapsed * vehicle.speed;
  const progress = positiveModulo(rawProgress, 1);
  const direction = 1;

  let motion = { direction, braking: 0, progress: clamp(progress, 0, 1) };

  for (const zone of vehicle.slowZones ?? []) {
    if (zone.kind === 'trafficSignal') {
      if (!isTrafficSignalStop(zone, elapsed)) continue;

      const aheadDelta = motion.direction > 0
        ? zone.t - motion.progress
        : motion.progress - zone.t;
      const radius = zone.radius ?? 0.08;

      if (aheadDelta < -0.01 || aheadDelta > radius) continue;

      const stopStrength = aheadDelta <= 0.008
        ? 1
        : (1 - aheadDelta / radius) * (zone.intensity ?? 1);

      motion = applyMotionBrake(motion, 0.058 * stopStrength);
      continue;
    }

    if (zone.kind === 'transitStop') {
      const delta = motion.progress - zone.t;
      const radius = zone.radius ?? 0.032;
      const absDelta = Math.abs(delta);

      if (absDelta >= radius) continue;

      const cycleSeconds = zone.cycleSeconds ?? 8.5;
      const dwellSeconds = zone.dwellSeconds ?? 2.35;
      const phase = positiveModulo(
        elapsed + (vehicle.offset ?? 0) * 7 + (zone.phaseOffset ?? 0),
        cycleSeconds
      );
      const dwell = phase < dwellSeconds && absDelta < radius * 0.42;

      if (dwell) {
        motion = {
          ...motion,
          braking: 1,
          progress: zone.t
        };
        continue;
      }

      const strength = (zone.intensity ?? 1) * (1 - absDelta / radius);
      motion = applyMotionBrake(motion, 0.07 * strength);
      continue;
    }

    const delta = motion.progress - zone.t;
    const radius = zone.radius ?? 0.04;
    const absDelta = Math.abs(delta);

    if (absDelta >= radius) continue;

    const strength = (zone.intensity ?? 0.55) * (1 - absDelta / radius);
    motion = applyMotionBrake(motion, strength * 0.028);
  }

  return motion;
}

function getMetroTrainTimedMotion(vehicle, elapsed) {
  const schedule = getMetroTrainSchedule(vehicle);
  if (!schedule || schedule.entries.length === 0) {
    const progress = positiveModulo((vehicle.offset ?? 0) + elapsed * (vehicle.speed ?? 0), 1);

    return {
      direction: 1,
      braking: 0,
      progress
    };
  }

  const phase = positiveModulo(elapsed + (vehicle.trainOffset ?? vehicle.offset ?? 0) * schedule.cycleSeconds, schedule.cycleSeconds);
  let cursor = 0;

  for (const entry of schedule.entries) {
    if (phase < cursor + entry.dwellSeconds) {
      return createMetroTrainMotion(vehicle, entry.from, entry.direction, 1, true);
    }

    cursor += entry.dwellSeconds;

    if (phase < cursor + entry.moveSeconds) {
      const t = clamp((phase - cursor) / Math.max(entry.moveSeconds, 0.001), 0, 1);
      const eased = easeInOutSine(t);
      const progress = lerp(entry.from, entry.to, eased);
      const braking = t < 0.16 || t > 0.84 ? 0.35 : 0;

      return createMetroTrainMotion(vehicle, progress, entry.direction, braking, false);
    }

    cursor += entry.moveSeconds;
  }

  const last = schedule.entries[schedule.entries.length - 1];
  return createMetroTrainMotion(vehicle, last.to, last.direction, 1, true);
}

function getMetroTrainSchedule(vehicle) {
  if (vehicle.__metroSchedule) return vehicle.__metroSchedule;

  const stops = createMetroStopSequence(vehicle.metroStops, vehicle.metroTerminalMargin ?? 0, vehicle.metroOneWay);
  if (stops.length < 2) return null;

  const cycleSeconds = Math.max(vehicle.metroCycleSeconds ?? 720, 1);
  const dwellTotal = stops.reduce((total, stop) => total + getMetroStopDwellSeconds(vehicle, stop), 0);
  const travelProgress = vehicle.metroOneWay
    ? stops.slice(0, -1).reduce((total, stop, index) => total + Math.max(0, stops[index + 1] - stop), 0)
    : stops.reduce((total, stop, index) => {
        const next = stops[(index + 1) % stops.length];
        return total + Math.abs(next - stop);
      }, 0);
  const cruiseSpeed = travelProgress / Math.max(cycleSeconds - dwellTotal, 1);
  const entries = stops.map((stop, index) => {
    const next = vehicle.metroOneWay
      ? stops[index + 1] ?? stop
      : stops[(index + 1) % stops.length];
    const distance = vehicle.metroOneWay
      ? Math.max(0, next - stop)
      : Math.abs(next - stop);
    const direction = vehicle.metroOneWay ? 1 : next >= stop ? 1 : -1;

    return {
      from: stop,
      to: next,
      direction,
      dwellSeconds: getMetroStopDwellSeconds(vehicle, stop),
      moveSeconds: distance / Math.max(cruiseSpeed, 0.000001)
    };
  });

  vehicle.__metroSchedule = {
    cycleSeconds,
    entries
  };

  return vehicle.__metroSchedule;
}

function createMetroStopSequence(stops, terminalMargin = 0, oneWay = false) {
  const minStop = clamp(terminalMargin, 0, 0.12);
  const maxStop = 1 - minStop;
  const sortedStops = [...new Set(
    [minStop, maxStop, ...(stops ?? [])]
      .filter(Number.isFinite)
      .map((stop) => Number(clamp(stop, minStop, maxStop).toFixed(5)))
  )].sort((a, b) => a - b);

  if (oneWay) return sortedStops;

  return [
    ...sortedStops,
    ...sortedStops.slice(1, -1).reverse()
  ];
}

function getMetroStopDwellSeconds(vehicle, stop) {
  const terminalMargin = clamp(vehicle.metroTerminalMargin ?? 0, 0, 0.12);
  const isTerminal = stop <= terminalMargin + 0.00001 || stop >= 1 - terminalMargin - 0.00001;
  return isTerminal
    ? vehicle.metroTerminalDwellSeconds ?? 10.5
    : vehicle.metroDwellSeconds ?? 7.5;
}

function createMetroTrainMotion(vehicle, centerProgress, direction, braking, stopped) {
  const carOffset = (vehicle.trainCarOffset ?? 0) * direction;

  return {
    direction,
    braking,
    progress: clamp(centerProgress + carOffset, 0, 1),
    stopped
  };
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
}

function isTrafficSignalStop(zone, elapsed) {
  const cycle = 18;
  const phase = positiveModulo(elapsed + (zone.phaseOffset ?? 0), cycle);

  if (zone.axis === 'x') {
    return phase >= 8.2;
  }

  if (zone.axis === 'z') {
    return phase < 9.2 || phase >= 17.2;
  }

  return false;
}

function applyFollowingDistance(motion, vehicle, instances, vehicleIndex, elapsed) {
  if (vehicle.behavior === 'metro-train') return motion;
  if (!vehicle.pathKey || !vehicle.speed || !Array.isArray(instances)) return motion;

  let strongestBrake = 0;
  const minGap = vehicle.behavior === 'lane-keep' ? 0.085 : 0.065;

  for (let index = 0; index < instances.length; index += 1) {
    if (index === vehicleIndex) continue;

    const other = instances[index];
    if (!other?.speed || other.pathKey !== vehicle.pathKey) continue;

    const otherMotion = getTimedTrafficMotion(other, elapsed);
    if (otherMotion.direction !== motion.direction) continue;

    const aheadDelta = getForwardPathDelta(motion, otherMotion.progress);

    if (aheadDelta <= 0.004 || aheadDelta >= minGap) continue;

    strongestBrake = Math.max(strongestBrake, (1 - aheadDelta / minGap) * 0.038);
  }

  return strongestBrake > 0 ? applyMotionBrake(motion, strongestBrake) : motion;
}

function applyIntersectionYield(motion, vehicle, instances, vehicleIndex, elapsed) {
  if (vehicle.behavior === 'metro-train') return motion;
  if (!vehicle.speed || !Array.isArray(instances)) return motion;

  const yieldInfo = getVehicleYieldInfo(vehicle);
  if (!yieldInfo) return motion;

  const aheadDelta = getForwardPathDelta(motion, yieldInfo.t);
  if (aheadDelta < -0.014 || aheadDelta > INTERSECTION_YIELD_LOOKAHEAD) return motion;

  let strongestBrake = 0;

  for (let index = 0; index < instances.length; index += 1) {
    if (index === vehicleIndex) continue;

    const other = instances[index];
    if (!other?.speed || other.pathKey === vehicle.pathKey) continue;

    const otherYieldInfo = getVehicleYieldInfo(other);
    if (!otherYieldInfo) continue;
    if (getYieldPointDistance(yieldInfo, otherYieldInfo) > INTERSECTION_YIELD_RADIUS) continue;

    const otherMotion = getTimedTrafficMotion(other, elapsed);
    const otherAheadDelta = getForwardPathDelta(otherMotion, otherYieldInfo.t);
    const otherInsideIntersection = otherAheadDelta <= 0.018 && otherAheadDelta >= -0.11;
    const otherArrivesFirst = otherAheadDelta > 0 && otherAheadDelta < aheadDelta - 0.006;
    const otherHasTiePriority = Math.abs(otherAheadDelta - aheadDelta) <= 0.006 &&
      String(other.id).localeCompare(String(vehicle.id)) < 0;

    if (!otherInsideIntersection && !otherArrivesFirst && !otherHasTiePriority) continue;

    const strength = aheadDelta <= 0.018
      ? 1
      : 1 - aheadDelta / INTERSECTION_YIELD_LOOKAHEAD;

    strongestBrake = Math.max(strongestBrake, 0.056 * strength);
  }

  return strongestBrake > 0 ? applyMotionBrake(motion, strongestBrake) : motion;
}

function getVehicleYieldInfo(vehicle) {
  const path = vehicle?.path;
  const point = path?.yieldPoint;
  const t = Number.isFinite(path?.yieldT) ? path.yieldT : path?.signalT;

  if (!point || !Number.isFinite(t)) return null;

  return {
    point,
    t
  };
}

function getYieldPointDistance(a, b) {
  return Math.hypot((a.point.x ?? 0) - (b.point.x ?? 0), (a.point.z ?? 0) - (b.point.z ?? 0));
}

function applyPlayerAvoidance(motion, vehicle, playerPosition) {
  if (vehicle.behavior === 'metro-train') return motion;
  if (!vehicle.speed || !playerPosition) return motion;

  const projection = projectPointToTrafficPath(playerPosition, vehicle.path);
  if (!projection || projection.lateralDistance > 18) return motion;

  const aheadDelta = getForwardPathDelta(motion, projection.t);
  if (aheadDelta <= 0.006 || aheadDelta >= 0.105) return motion;

  const lateralStrength = 1 - projection.lateralDistance / 18;
  const distanceStrength = 1 - aheadDelta / 0.105;
  const brake = 0.052 * lateralStrength * distanceStrength;

  return applyMotionBrake(motion, brake);
}

function projectPointToTrafficPath(point, path) {
  if (!point || !path) return null;

  const points = getTrafficPathPoints(path);
  const totalLength = getTrafficPathLength(points);

  if (totalLength <= 0.000001) return null;

  let bestProjection = null;
  let walked = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const segmentLengthSq = dx * dx + dz * dz;

    if (segmentLengthSq <= 0.000001) continue;

    const rawT = ((point.x - start.x) * dx + (point.z - start.z) * dz) / segmentLengthSq;
    const segmentT = clamp(rawT, 0, 1);
    const x = lerp(start.x, end.x, segmentT);
    const z = lerp(start.z, end.z, segmentT);
    const lateralDistance = Math.hypot((point.x ?? 0) - x, (point.z ?? 0) - z);
    const segmentLength = Math.sqrt(segmentLengthSq);
    const t = (walked + segmentLength * segmentT) / totalLength;

    if (!bestProjection || lateralDistance < bestProjection.lateralDistance) {
      bestProjection = { lateralDistance, t };
    }

    walked += segmentLength;
  }

  return bestProjection;
}

function getForwardPathDelta(motion, targetProgress) {
  return motion.direction > 0
    ? targetProgress - motion.progress
    : motion.progress - targetProgress;
}

function applyMotionBrake(motion, brake) {
  return {
    ...motion,
    braking: Math.max(motion.braking ?? 0, brake),
    progress: clamp(motion.progress - motion.direction * brake, 0, 1)
  };
}

function getTrafficPathPose(path, progress) {
  const points = getTrafficPathPoints(path);
  const totalLength = getTrafficPathLength(points);

  if (points.length < 2 || totalLength <= 0.000001) {
    const fallback = points[0] ?? { x: 0, z: 0 };

    return { x: fallback.x, y: fallback.y, z: fallback.z, yaw: 0 };
  }

  const targetDistance = clamp(progress, 0, 1) * totalLength;
  const pose = sampleTrafficPathAtDistance(points, totalLength, targetDistance);
  const lookBehind = sampleTrafficPathAtDistance(
    points,
    totalLength,
    Math.max(0, targetDistance - TRAFFIC_TURN_LOOKAHEAD_DISTANCE)
  );
  const lookAhead = sampleTrafficPathAtDistance(
    points,
    totalLength,
    Math.min(totalLength, targetDistance + TRAFFIC_TURN_LOOKAHEAD_DISTANCE)
  );
  let dx = lookAhead.x - lookBehind.x;
  let dz = lookAhead.z - lookBehind.z;

  if (Math.hypot(dx, dz) <= 0.000001) {
    const fallback = getTrafficPathSegmentAtDistance(points, totalLength, targetDistance);
    dx = fallback.end.x - fallback.start.x;
    dz = fallback.end.z - fallback.start.z;
  }

  return {
    ...pose,
    yaw: Math.atan2(dx, dz)
  };
}

function sampleTrafficPathAtDistance(points, totalLength, distance) {
  const segment = getTrafficPathSegmentAtDistance(points, totalLength, distance);

  return {
    x: lerp(segment.start.x, segment.end.x, segment.t),
    y: getTrafficPoseY(segment.start, segment.end, segment.t),
    z: lerp(segment.start.z, segment.end.z, segment.t)
  };
}

function getTrafficPathSegmentAtDistance(points, totalLength, distance) {
  const targetDistance = clamp(distance, 0, totalLength);
  let walked = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z);

    if (segmentLength <= 0.000001) continue;

    if (walked + segmentLength >= targetDistance || index === points.length - 2) {
      return {
        start,
        end,
        t: clamp((targetDistance - walked) / segmentLength, 0, 1)
      };
    }

    walked += segmentLength;
  }

  return {
    start: points[points.length - 2],
    end: points[points.length - 1],
    t: 1
  };
}

function getTrafficPoseY(start, end, t) {
  if (!Number.isFinite(start.y) && !Number.isFinite(end.y)) return undefined;

  const startY = Number.isFinite(start.y) ? start.y : end.y;
  const endY = Number.isFinite(end.y) ? end.y : start.y;

  return lerp(startY, endY, t);
}

function getTrafficPathPoints(path) {
  if (Array.isArray(path?.points) && path.points.length >= 2) {
    return getSmoothedTrafficPathPoints(path);
  }

  return [
    { x: path?.startX ?? 0, z: path?.startZ ?? 0 },
    { x: path?.endX ?? 0, z: path?.endZ ?? 0 }
  ];
}

function getSmoothedTrafficPathPoints(path) {
  if (!shouldSmoothTrafficPath(path)) return path.points;
  if (path.__smoothedTrafficPointsSource === path.points && path.__smoothedTrafficPoints) {
    return path.__smoothedTrafficPoints;
  }

  path.__smoothedTrafficPointsSource = path.points;
  path.__smoothedTrafficPoints = smoothTrafficPathPoints(
    path.points,
    path.pathType === 'bus-route' ? 1 : 2
  );

  return path.__smoothedTrafficPoints;
}

function shouldSmoothTrafficPath(path) {
  return SMOOTH_TRAFFIC_PATH_TYPES.has(path?.pathType) &&
    Array.isArray(path?.points) &&
    path.points.length >= 3;
}

function smoothTrafficPathPoints(points, iterations) {
  let smoothed = points.map((point) => ({ ...point }));

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    if (smoothed.length < 3) break;

    const next = [{ ...smoothed[0] }];

    for (let index = 0; index < smoothed.length - 1; index += 1) {
      const start = smoothed[index];
      const end = smoothed[index + 1];

      next.push(lerpTrafficPoint(start, end, 0.25));
      next.push(lerpTrafficPoint(start, end, 0.75));
    }

    next.push({ ...smoothed[smoothed.length - 1] });
    smoothed = dedupeTrafficRenderPoints(next);
  }

  return smoothed;
}

function lerpTrafficPoint(start, end, t) {
  const point = {
    x: lerp(start.x, end.x, t),
    z: lerp(start.z, end.z, t)
  };

  if (Number.isFinite(start.y) || Number.isFinite(end.y)) {
    point.y = getTrafficPoseY(start, end, t);
  }

  return point;
}

function dedupeTrafficRenderPoints(points) {
  const deduped = [];

  for (const point of points) {
    const previous = deduped[deduped.length - 1];

    if (!previous || Math.hypot(point.x - previous.x, point.z - previous.z) > 0.15) {
      deduped.push(point);
    }
  }

  return deduped;
}

function getTrafficPathLength(points) {
  let length = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    length += Math.hypot(points[index + 1].x - points[index].x, points[index + 1].z - points[index].z);
  }

  return length;
}

function getTrafficVehiclePartScale(part, width, height, depth) {
  const sourceScale = [width, height, depth];
  const axes = part.scaleAxes ?? [0, 1, 2];

  return part.scale.map((factor, index) => sourceScale[axes[index]] * factor);
}

function getTrafficVehiclePartColor(vehicle, part, elapsed = 0, motion = null) {
  if (part.dynamicColor) {
    return getTrafficVehicleDynamicLightColor(vehicle, part, elapsed, motion);
  }

  colorObject.set(part.colorFromLine ? (vehicle.lineColor ?? '#ffffff') : (vehicle.color ?? '#ffffff'));

  if (part.colorLightness) {
    colorObject.offsetHSL(0, 0, part.colorLightness);
  }

  return colorObject;
}

function getTrafficVehicleDynamicLightColor(vehicle, part, elapsed, motion) {
  if (part.lightRole === 'tail') {
    const brakeStrength = clamp((motion?.braking ?? 0) * 18, 0, 1);

    colorObject.setRGB(
      lerp(0.48, 1, brakeStrength),
      lerp(0.035, 0.08, brakeStrength),
      lerp(0.025, 0.035, brakeStrength)
    );
    return colorObject;
  }

  if (part.lightRole === 'indicator') {
    const signalIntensity = getTurnSignalIntensity(vehicle, part.signalSide, motion, elapsed);

    colorObject.setRGB(
      lerp(0.07, 1, signalIntensity),
      lerp(0.032, 0.54, signalIntensity),
      lerp(0.005, 0.06, signalIntensity)
    );
    return colorObject;
  }

  colorObject.set(part.color ?? '#ffffff');
  return colorObject;
}

function getTurnSignalIntensity(vehicle, signalSide, motion, elapsed) {
  const path = vehicle?.path;

  if (!signalSide || path?.turnSignal !== signalSide) return 0;

  const progress = motion?.progress ?? clamp(vehicle.offset ?? 0, 0, 1);
  const turnCenter = Number.isFinite(path.yieldT)
    ? path.yieldT
    : Number.isFinite(path.signalT)
      ? path.signalT
      : 0.5;
  const startT = Number.isFinite(path.turnSignalStartT) ? path.turnSignalStartT : Math.max(0, turnCenter - 0.12);
  const endT = Number.isFinite(path.turnSignalEndT) ? path.turnSignalEndT : Math.min(1, turnCenter + 0.16);

  if (progress < startT || progress > endT) return 0;

  return positiveModulo(elapsed * 1.65 + (vehicle.offset ?? 0) * 2.7, 1) < 0.54 ? 1 : 0.08;
}

function createTrafficVehiclePartGeometry(type) {
  if (type === 'body') {
    return createTrafficHullGeometry([
      { z: -0.5, halfWidth: 0.34, bottomY: -0.34, topY: 0.06 },
      { z: -0.36, halfWidth: 0.48, bottomY: -0.48, topY: 0.34 },
      { z: 0.18, halfWidth: 0.5, bottomY: -0.5, topY: 0.5 },
      { z: 0.5, halfWidth: 0.36, bottomY: -0.38, topY: 0.02 }
    ]);
  }

  if (type === 'cabin') {
    return createTrafficHullGeometry([
      { z: -0.5, halfWidth: 0.48, bottomY: -0.38, topY: 0.26 },
      { z: -0.08, halfWidth: 0.43, bottomY: -0.44, topY: 0.5 },
      { z: 0.5, halfWidth: 0.32, bottomY: -0.36, topY: 0.1 }
    ]);
  }

  if (type === 'wheel') {
    return new THREE.CylinderGeometry(1, 1, 1, 18);
  }

  return new THREE.BoxGeometry(1, 1, 1);
}

function createTrafficHullGeometry(sections) {
  const vertices = [];
  const indices = [];

  for (const section of sections) {
    vertices.push(
      -section.halfWidth, section.bottomY, section.z,
      section.halfWidth, section.bottomY, section.z,
      section.halfWidth, section.topY, section.z,
      -section.halfWidth, section.topY, section.z
    );
  }

  for (let index = 0; index < sections.length - 1; index += 1) {
    const current = index * 4;
    const next = (index + 1) * 4;

    addQuad(indices, current, next, next + 1, current + 1);
    addQuad(indices, current + 1, next + 1, next + 2, current + 2);
    addQuad(indices, current + 2, next + 2, next + 3, current + 3);
    addQuad(indices, current + 3, next + 3, next, current);
  }

  const last = (sections.length - 1) * 4;

  addQuad(indices, 0, 1, 2, 3);
  addQuad(indices, last + 3, last + 2, last + 1, last);

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

function addQuad(indices, a, b, c, d) {
  indices.push(a, b, c, a, c, d);
}
