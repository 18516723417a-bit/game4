import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useDisposableResource } from '../rendering/instanceRenderers.jsx';
import { clamp, lerp, positiveModulo } from '../utils/math.js';

const trafficVehicleRootObject = new THREE.Object3D();
const trafficVehiclePartObject = new THREE.Object3D();
const colorObject = new THREE.Color();
const INTERSECTION_YIELD_LOOKAHEAD = 0.13;
const INTERSECTION_YIELD_RADIUS = 58;

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
    position: [0, 1.24, -0.11],
    receiveShadow: true,
    roughness: 0.42,
    scale: [0.46, 0.08, 0.24]
  },
  {
    key: 'windshield',
    color: '#0d1b25',
    geometry: 'box',
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
    metalness: 0.08,
    position: [-0.46, 0.94, -0.08],
    roughness: 0.18,
    scale: [0.035, 0.26, 0.3]
  },
  {
    key: 'right-side-window',
    color: '#102634',
    geometry: 'box',
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
  const geometry = useDisposableResource(() => createTrafficVehiclePartGeometry(part.geometry), [part.geometry]);
  const material = useDisposableResource(() => new THREE.MeshStandardMaterial({
    color: part.colorFromVehicle || part.dynamicColor ? '#ffffff' : part.color,
    emissive: part.emissive ?? '#000000',
    emissiveIntensity: part.emissiveIntensity ?? 0,
    metalness: part.metalness ?? 0.04,
    roughness: part.roughness ?? 0.5,
    side: part.side ?? THREE.FrontSide,
    vertexColors: Boolean(part.colorFromVehicle || part.dynamicColor)
  }), [part]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    for (let index = 0; index < instances.length; index += 1) {
      const motion = part.dynamicColor
        ? getTrafficVehicleMotion(instances[index], 0, instances, index, null)
        : null;

      writeTrafficVehiclePartMatrix(mesh, index, instances[index], 0, part, instances, null, motion);

      if (part.colorFromVehicle || part.dynamicColor) {
        mesh.setColorAt(index, getTrafficVehiclePartColor(instances[index], part, 0, motion));
      }
    }

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;

    if ((part.colorFromVehicle || part.dynamicColor) && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
      mesh.material.needsUpdate = true;
    }
  }, [instances, part]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;

    if (!mesh) return;

    const elapsed = clock.getElapsedTime();

    for (let index = 0; index < instances.length; index += 1) {
      const motion = part.dynamicColor
        ? getTrafficVehicleMotion(instances[index], elapsed, instances, index, playerPosition)
        : null;

      writeTrafficVehiclePartMatrix(mesh, index, instances[index], elapsed, part, instances, playerPosition, motion);

      if (part.dynamicColor) {
        mesh.setColorAt(index, getTrafficVehiclePartColor(instances[index], part, elapsed, motion));
      }
    }

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;

    if (part.dynamicColor && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      key={`${part.key}-${instances.length}`}
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow={part.castShadow !== false}
      dispose={null}
      frustumCulled={false}
      name={`MovingTrafficVehiclePart:${part.key}`}
      receiveShadow={!!part.receiveShadow}
    />
  );
}

function writeTrafficVehiclePartMatrix(mesh, index, vehicle, elapsed, part, instances, playerPosition, motionOverride = null) {
  const motion = motionOverride ?? getTrafficVehicleMotion(vehicle, elapsed, instances, index, playerPosition);
  const pose = getTrafficPathPose(vehicle.path, motion.progress);
  const [width, height, depth] = vehicle.scale;
  const [localX, localY, localZ] = part.position;
  const [rotationX = 0, rotationY = 0, rotationZ = 0] = part.rotation ?? [];
  const [scaleX, scaleY, scaleZ] = getTrafficVehiclePartScale(part, width, height, depth);

  trafficVehicleRootObject.position.set(pose.x, pose.y ?? vehicle.baseY, pose.z);
  trafficVehicleRootObject.rotation.set(0, pose.yaw, 0);
  trafficVehiclePartObject.position.set(localX * width, localY * height, localZ * depth);
  trafficVehiclePartObject.rotation.set(rotationX, rotationY, rotationZ);
  trafficVehiclePartObject.scale.set(scaleX, scaleY, scaleZ);
  trafficVehicleRootObject.updateMatrixWorld(true);
  mesh.setMatrixAt(index, trafficVehiclePartObject.matrixWorld);
}

function getTrafficVehicleMotion(vehicle, elapsed, instances = [], vehicleIndex = -1, playerPosition = null) {
  if (!vehicle.speed) {
    return {
      direction: 1,
      braking: 0,
      progress: clamp(vehicle.offset ?? 0, 0, 1)
    };
  }

  const timedMotion = getTimedTrafficMotion(vehicle, elapsed);
  const trafficMotion = applyFollowingDistance(timedMotion, vehicle, instances, vehicleIndex, elapsed);
  const yieldedMotion = applyIntersectionYield(trafficMotion, vehicle, instances, vehicleIndex, elapsed);

  return applyPlayerAvoidance(yieldedMotion, vehicle, playerPosition);
}

function getTimedTrafficMotion(vehicle, elapsed) {
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

    const delta = motion.progress - zone.t;
    const radius = zone.radius ?? 0.04;
    const absDelta = Math.abs(delta);

    if (absDelta >= radius) continue;

    const strength = (zone.intensity ?? 0.55) * (1 - absDelta / radius);
    motion = applyMotionBrake(motion, strength * 0.028);
  }

  return motion;
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
  let walked = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z);

    if (segmentLength <= 0.000001) continue;

    if (walked + segmentLength >= targetDistance || index === points.length - 2) {
      const segmentT = clamp((targetDistance - walked) / segmentLength, 0, 1);
      const dx = end.x - start.x;
      const dz = end.z - start.z;

      const forwardYaw = Math.atan2(dx, dz);

      return {
        x: lerp(start.x, end.x, segmentT),
        y: getTrafficPoseY(start, end, segmentT),
        z: lerp(start.z, end.z, segmentT),
        yaw: forwardYaw
      };
    }

    walked += segmentLength;
  }

  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const dx = last.x - previous.x;
  const dz = last.z - previous.z;

  return {
    x: last.x,
    y: last.y,
    z: last.z,
    yaw: Math.atan2(dx, dz)
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
    return path.points;
  }

  return [
    { x: path?.startX ?? 0, z: path?.startZ ?? 0 },
    { x: path?.endX ?? 0, z: path?.endZ ?? 0 }
  ];
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

  colorObject.set(vehicle.color ?? '#ffffff');

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
