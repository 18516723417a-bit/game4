import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, Vector3 } from 'three';

const forward = new Vector3();
const desiredPosition = new Vector3();
const lookAtPosition = new Vector3();
const upOffset = new Vector3();
const driverEyeBase = new Vector3(-0.48, 1.18, -1.08);
const driverLookBase = new Vector3(-0.14, 1.2, 42);
const driverEyeLocal = new Vector3();
const driverLookLocal = new Vector3();

export function ChaseCamera({ mode = 'chase', targetRef, tunnelStatus }) {
  const { camera } = useThree();
  const previousSpeedRef = useRef(0);
  const headBobPhaseRef = useRef(0);

  useFrame((_, delta) => {
    const target = targetRef.current;
    if (!target) return;

    target.getWorldDirection(forward);
    const telemetry = target.userData.vehicleTelemetry;
    const speed = telemetry?.speed ?? 0;
    const speedKmh = Math.abs(telemetry?.speedKmh ?? 0);
    const speedRatio = Math.min(speedKmh / 155, 1);
    const driverSpeedRatio = Math.min(speedKmh / 210, 1);
    const steering = MathUtils.clamp(telemetry?.steering ?? 0, -1, 1);
    const collisionPulse = MathUtils.clamp(telemetry?.collisionPulse ?? 0, 0, 1);
    const acceleration = delta > 0
      ? MathUtils.clamp((speed - previousSpeedRef.current) / Math.max(delta, 0.001), -95, 95)
      : 0;
    const tunnelBlend = getTunnelCameraBlend(tunnelStatus);
    const chaseDistance = lerp(lerp(10.5, 16.5, speedRatio), lerp(6.8, 9.2, speedRatio), tunnelBlend);
    const chaseHeight = lerp(lerp(5.1, 7.1, speedRatio), lerp(1.35, 1.78, speedRatio), tunnelBlend);
    const lookAhead = lerp(lerp(7, 15, speedRatio), lerp(9, 13, speedRatio), tunnelBlend);

    previousSpeedRef.current = speed;

    if (mode === 'firstPerson') {
      headBobPhaseRef.current += delta * lerp(4.8, 14.5, driverSpeedRatio);

      const phase = headBobPhaseRef.current;
      const roadTexture = (
        Math.sin(phase * 2.1) * 0.009 +
        Math.sin(phase * 0.73) * 0.006
      ) * driverSpeedRatio;
      const throttleLag = MathUtils.clamp(-acceleration * 0.0012, -0.055, 0.075);
      const lateralSway = -steering * lerp(0.018, 0.052, driverSpeedRatio);

      driverEyeLocal.copy(driverEyeBase);
      driverEyeLocal.x += lateralSway;
      driverEyeLocal.y += roadTexture + collisionPulse * 0.014;
      driverEyeLocal.z += throttleLag;

      desiredPosition.copy(driverEyeLocal);
      target.localToWorld(desiredPosition);

      const distanceToSeat = camera.position.distanceTo(desiredPosition);
      if (distanceToSeat > 1.4) {
        camera.position.copy(desiredPosition);
      } else {
        camera.position.lerp(desiredPosition, 1 - Math.exp(-52 * delta));
      }

      driverLookLocal.copy(driverLookBase);
      driverLookLocal.x += steering * lerp(0.18, 0.62, driverSpeedRatio);
      driverLookLocal.y += roadTexture * 1.65 - driverSpeedRatio * 0.035;
      driverLookLocal.z += lerp(0, 8, driverSpeedRatio);

      lookAtPosition.copy(driverLookLocal);
      target.localToWorld(lookAtPosition);
      camera.lookAt(lookAtPosition);
      camera.rotateZ((telemetry?.rotation?.z ?? 0) * 0.28 + steering * driverSpeedRatio * 0.035);
      updateCameraLens(camera, lerp(66, 78, driverSpeedRatio) + (telemetry?.nitroActive ? 2.6 : 0), 0.035, delta);
      return;
    } else {
      upOffset.set(0, chaseHeight, 0);
      desiredPosition
        .copy(target.position)
        .addScaledVector(forward, -chaseDistance)
        .add(upOffset);
    }

    const distanceToTarget = camera.position.distanceTo(desiredPosition);

    if (distanceToTarget > 80 || mode === 'firstPerson') {
      camera.position.copy(desiredPosition);
    } else {
      const blend = 1 - Math.exp(-lerp(6.4, 4.2, speedRatio) * delta);
      camera.position.lerp(desiredPosition, blend);
    }

    lookAtPosition.copy(target.position);

    lookAtPosition
      .addScaledVector(forward, lookAhead)
      .addScalar(0);
    lookAtPosition.y += lerp(1.25, 2.2, speedRatio);

    camera.lookAt(lookAtPosition);
      updateCameraLens(camera, lerp(55, 61, tunnelBlend), lerp(0.1, 0.035, tunnelBlend), delta);
  });

  return null;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function updateCameraLens(camera, targetFov, targetNear, delta) {
  const fovBlend = 1 - Math.exp(-6.2 * delta);
  const nextFov = lerp(camera.fov, targetFov, fovBlend);
  const fovChanged = Math.abs(camera.fov - nextFov) > 0.02;
  const nearChanged = Math.abs(camera.near - targetNear) > 0.001;

  if (!fovChanged && !nearChanged) return;

  camera.fov = nextFov;
  camera.near = targetNear;
  camera.updateProjectionMatrix();
}

function getTunnelCameraBlend(tunnelStatus) {
  if (!tunnelStatus || tunnelStatus.state === 'outsideTunnel') return 0;

  const darknessBlend = MathUtils.clamp((1 - (tunnelStatus.lightingFactor ?? 1)) / 0.42, 0, 1);

  if (tunnelStatus.state === 'approachingTunnel') return darknessBlend * 0.38;
  if (tunnelStatus.state === 'enteringTunnel') return Math.max(0.55, darknessBlend);

  return Math.max(0.78, darknessBlend);
}
