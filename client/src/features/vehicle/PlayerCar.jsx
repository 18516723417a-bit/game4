import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide } from 'three';
import { useVehicleInput } from './input.js';
import { CAR_CONFIG } from './carConfig.js';
import {
  createVehicleState,
  getVehicleTelemetry,
  resetVehicleState,
  stepVehicle,
  teleportVehicleState
} from './vehicleController.js';
import { isPositionInsideWorld } from '../world/worldConfig.js';

const neutralInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  reset: false,
  nitro: false,
  handbrake: false
};
const CAR_VISUAL_RIDE_HEIGHT = 0.16;

export const PlayerCar = forwardRef(function PlayerCar({
  activeColliders = [],
  activeRoadSurfaces = [],
  autopilotInput = neutralInput,
  config = CAR_CONFIG,
  controlsEnabled = true,
  driverView = false,
  isNight = false,
  touchInput = neutralInput,
  weatherMode = 'clear',
  onTelemetry
}, forwardedRef) {
  const groupRef = useRef(null);
  const bodyMaterialRef = useRef(null);
  const cabinMaterialRef = useRef(null);
  const leftTailLightMaterialRef = useRef(null);
  const rightTailLightMaterialRef = useRef(null);
  const steeringWheelRef = useRef(null);
  const speedNeedleRef = useRef(null);
  const nitroNeedleRef = useRef(null);
  const vehicleStateRef = useRef(createVehicleState(config));
  const telemetryTimerRef = useRef(0);
  const inputRef = useVehicleInput();
  const frameInputRef = useRef({ ...neutralInput });
  const controlsPausedUntilRef = useRef(0);
  const spawnPosition = config.spawn.position;
  const drivingConfig = useMemo(() => (
    createWeatherAdjustedVehicleConfig(config, weatherMode)
  ), [config, weatherMode]);

  const clearInput = useCallback(() => {
    Object.assign(inputRef.current, neutralInput);
  }, [inputRef]);

  const emitTelemetry = useCallback(() => {
    const vehicleState = vehicleStateRef.current;
    const telemetry = getVehicleTelemetry(vehicleState, drivingConfig);
    const weatherGrip = drivingConfig.weatherGrip ?? 1;
    const surfaceGrip = telemetry.surfaceGrip ?? 1;

    onTelemetry({
      ...telemetry,
      grip: weatherGrip * surfaceGrip,
      weatherGrip,
      position: { ...vehicleState.position },
      insideWorld: isPositionInsideWorld(vehicleState.position)
    });
  }, [drivingConfig, onTelemetry]);

  const applyVehicleTransform = useCallback(() => {
    const car = groupRef.current;
    const vehicleState = vehicleStateRef.current;

    if (!car) return;

    car.position.set(
      vehicleState.position.x,
      vehicleState.position.y,
      vehicleState.position.z
    );
    car.rotation.set(vehicleState.pitch ?? 0, vehicleState.heading, vehicleState.roll ?? 0);
    car.userData.vehicleState = vehicleState;
    car.userData.vehicleTelemetry = getVehicleTelemetry(vehicleState, drivingConfig);
  }, [drivingConfig]);

  const teleportTo = useCallback((teleport) => {
    controlsPausedUntilRef.current = performance.now() + 220;
    clearInput();
    teleportVehicleState(vehicleStateRef.current, teleport, config);
    applyVehicleTransform();
    emitTelemetry();
  }, [applyVehicleTransform, clearInput, config, emitTelemetry]);

  const resetToSpawn = useCallback(() => {
    controlsPausedUntilRef.current = performance.now() + 260;
    clearInput();
    resetVehicleState(vehicleStateRef.current, config);
    applyVehicleTransform();
    emitTelemetry();
  }, [applyVehicleTransform, clearInput, config, emitTelemetry]);

  useImperativeHandle(forwardedRef, () => {
    const car = groupRef.current;

    if (!car) return null;

    car.teleportTo = teleportTo;
    car.resetToSpawn = resetToSpawn;
    car.getVehicleState = () => {
      const vehicleState = vehicleStateRef.current;

      return {
        ...vehicleState,
        position: { ...vehicleState.position },
        lastSafeTransform: vehicleState.lastSafeTransform
          ? {
              ...vehicleState.lastSafeTransform,
              position: { ...vehicleState.lastSafeTransform.position }
            }
          : null
      };
    };
    car.pauseControls = (durationMs = 220) => {
      controlsPausedUntilRef.current = performance.now() + durationMs;
      clearInput();
    };

    return car;
  }, [clearInput, resetToSpawn, teleportTo]);

  useFrame((_, delta) => {
    const car = groupRef.current;
    if (!car) return;

    const dt = Math.min(delta, drivingConfig.simulationMaxFrameDelta);
    const controlsPaused = performance.now() < controlsPausedUntilRef.current;
    const input = frameInputRef.current;
    const vehicleState = vehicleStateRef.current;
    let remainingTime = dt;

    const manualForward = Boolean(inputRef.current.forward || touchInput.forward);
    const manualBackward = Boolean(inputRef.current.backward || touchInput.backward);
    const manualLeft = Boolean(inputRef.current.left || touchInput.left);
    const manualRight = Boolean(inputRef.current.right || touchInput.right);
    const manualNitro = Boolean(inputRef.current.nitro || touchInput.nitro);
    const manualHandbrake = Boolean(inputRef.current.handbrake || touchInput.handbrake);
    const manualDrivingInput = manualForward ||
      manualBackward ||
      manualLeft ||
      manualRight ||
      manualNitro ||
      manualHandbrake;
    const assistedInput = manualDrivingInput ? neutralInput : autopilotInput;

    input.forward = Boolean(manualForward || assistedInput.forward);
    input.backward = Boolean(manualBackward || assistedInput.backward);
    input.left = Boolean(manualLeft || assistedInput.left);
    input.right = Boolean(manualRight || assistedInput.right);
    input.reset = Boolean(inputRef.current.reset || touchInput.reset);
    input.nitro = Boolean(manualNitro || assistedInput.nitro);
    input.handbrake = Boolean(manualHandbrake || assistedInput.handbrake);

    if (!controlsEnabled || controlsPaused) {
      clearInput();
      Object.assign(input, neutralInput);
      applyVehicleTransform();
      updateCollisionVisuals(vehicleState.collisionPulse, bodyMaterialRef.current, cabinMaterialRef.current);
      updateBrakeLights(
        false,
        leftTailLightMaterialRef.current,
        rightTailLightMaterialRef.current
      );
      updateCockpitTelemetry(
        vehicleState,
        drivingConfig,
        steeringWheelRef.current,
        speedNeedleRef.current,
        nitroNeedleRef.current
      );
      telemetryTimerRef.current += dt;

      if (telemetryTimerRef.current >= config.telemetryInterval) {
        telemetryTimerRef.current = 0;
        emitTelemetry();
      }

      return;
    }

    while (remainingTime > 0) {
      const step = Math.min(remainingTime, drivingConfig.simulationStep);

      stepVehicle(
        vehicleState,
        input,
        step,
        drivingConfig,
        activeColliders,
        activeRoadSurfaces
      );

      remainingTime -= step;
    }

    applyVehicleTransform();
    updateCollisionVisuals(vehicleState.collisionPulse, bodyMaterialRef.current, cabinMaterialRef.current);
    updateBrakeLights(
      Boolean(input.backward && vehicleState.speed > 0.22),
      leftTailLightMaterialRef.current,
      rightTailLightMaterialRef.current
    );
    updateCockpitTelemetry(
      vehicleState,
      drivingConfig,
      steeringWheelRef.current,
      speedNeedleRef.current,
      nitroNeedleRef.current
    );

    if (input.reset) input.reset = false;
    if (inputRef.current.reset) inputRef.current.reset = false;

    telemetryTimerRef.current += dt;

    if (telemetryTimerRef.current >= config.telemetryInterval) {
      telemetryTimerRef.current = 0;
      emitTelemetry();
    }
  });

  return (
    <group
      ref={groupRef}
      position={[spawnPosition.x, spawnPosition.y, spawnPosition.z]}
      rotation={[0, config.spawn.heading, 0]}
    >
      <group position={[0, CAR_VISUAL_RIDE_HEIGHT, 0]} visible={!driverView}>
      <mesh castShadow receiveShadow position={[0, 0.34, 0]}>
        <boxGeometry args={[2.14, 0.58, 4.36]} />
        <meshStandardMaterial
          ref={bodyMaterialRef}
          color="#c9352f"
          roughness={0.44}
          metalness={0.18}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.7, 1.92]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[1.72, 0.16, 1.04]} />
        <meshStandardMaterial color="#d63a32" roughness={0.36} metalness={0.22} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.68, 1.16]}>
        <boxGeometry args={[1.78, 0.22, 1.42]} />
        <meshStandardMaterial color="#d94339" roughness={0.38} metalness={0.22} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.88, -0.36]}>
        <boxGeometry args={[1.5, 0.62, 1.72]} />
        <meshStandardMaterial
          ref={cabinMaterialRef}
          color="#202a31"
          roughness={0.28}
          metalness={0.18}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 1.22, -0.44]}>
        <boxGeometry args={[1.28, 0.12, 1.24]} />
        <meshStandardMaterial color="#b8322f" roughness={0.42} metalness={0.18} />
      </mesh>

      <mesh position={[0, 0.98, 0.58]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[1.32, 0.08, 0.58]} />
        <meshStandardMaterial color="#0d1b25" roughness={0.16} metalness={0.08} side={DoubleSide} transparent opacity={0.42} />
      </mesh>

      <mesh position={[0, 0.96, -1.22]} rotation={[0.16, 0, 0]}>
        <boxGeometry args={[1.28, 0.08, 0.5]} />
        <meshStandardMaterial color="#0d1b25" roughness={0.16} metalness={0.08} transparent opacity={0.62} />
      </mesh>

      {[
        [-0.78, 0.94, -0.34],
        [0.78, 0.94, -0.34]
      ].map(([x, y, z]) => (
        <mesh key={`side-window-${x}`} position={[x, y, z]}>
          <boxGeometry args={[0.08, 0.42, 1.02]} />
          <meshStandardMaterial color="#102634" roughness={0.18} metalness={0.08} transparent opacity={0.58} />
        </mesh>
      ))}

      <CockpitDashboard
        steeringWheelRef={steeringWheelRef}
        speedNeedleRef={speedNeedleRef}
        nitroNeedleRef={nitroNeedleRef}
      />

      <mesh castShadow receiveShadow position={[0, 0.4, 2.21]}>
        <boxGeometry args={[1.62, 0.28, 0.16]} />
        <meshStandardMaterial color="#161b1f" roughness={0.42} metalness={0.2} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.56, 2.3]}>
        <boxGeometry args={[1.04, 0.18, 0.1]} />
        <meshStandardMaterial color="#0d1115" roughness={0.28} metalness={0.34} />
      </mesh>

      {[
        [-1.12, 0.44, 1.34],
        [1.12, 0.44, 1.34],
        [-1.12, 0.44, -1.28],
        [1.12, 0.44, -1.28]
      ].map(([x, y, z]) => (
        <mesh key={`fender-${x}-${z}`} castShadow receiveShadow position={[x, y, z]}>
          <boxGeometry args={[0.22, 0.24, 0.92]} />
          <meshStandardMaterial color="#9f201d" roughness={0.46} metalness={0.12} />
        </mesh>
      ))}

      {[
        [-0.54, 0.48, 2.32],
        [0.54, 0.48, 2.32]
      ].map(([x, y, z]) => (
        <mesh key={`headlight-${x}`} position={[x, y, z]}>
          <boxGeometry args={[0.46, 0.18, 0.08]} />
          <meshStandardMaterial
            color="#f7f0c9"
            emissive="#f2d486"
            emissiveIntensity={0.75}
            roughness={0.22}
            metalness={0.02}
          />
        </mesh>
      ))}

      {isNight ? (
        <>
          <pointLight position={[-0.54, 0.58, 2.55]} intensity={0.85} distance={18} color="#fff1bd" />
          <pointLight position={[0.54, 0.58, 2.55]} intensity={0.85} distance={18} color="#fff1bd" />
          <mesh position={[0, 0.52, 4.7]}>
            <boxGeometry args={[2.4, 0.06, 4.2]} />
            <meshBasicMaterial color="#fff1bd" transparent opacity={0.13} depthWrite={false} />
          </mesh>
        </>
      ) : null}

      <mesh castShadow receiveShadow position={[0, 0.33, -2.25]}>
        <boxGeometry args={[1.72, 0.22, 0.18]} />
        <meshStandardMaterial color="#202428" roughness={0.48} metalness={0.18} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.46, -2.2]}>
        <boxGeometry args={[1.65, 0.26, 0.34]} />
        <meshStandardMaterial color="#f4d35e" emissive="#4a3908" emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[-0.68, 0.58, -2.32]}>
        <boxGeometry args={[0.34, 0.2, 0.08]} />
        <meshStandardMaterial
          ref={leftTailLightMaterialRef}
          color="#ff3b30"
          emissive="#9c1411"
          emissiveIntensity={0.55}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.68, 0.58, -2.32]}>
        <boxGeometry args={[0.34, 0.2, 0.08]} />
        <meshStandardMaterial
          ref={rightTailLightMaterialRef}
          color="#ff3b30"
          emissive="#9c1411"
          emissiveIntensity={0.55}
          roughness={0.2}
        />
      </mesh>

      {[
        [-1.1, 0.92, 0.34, -0.22],
        [1.1, 0.92, 0.34, 0.22]
      ].map(([x, y, z, yaw]) => (
        <mesh key={`mirror-${x}`} castShadow position={[x, y, z]} rotation={[0, yaw, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.34]} />
          <meshStandardMaterial color="#151a1e" roughness={0.34} metalness={0.18} />
        </mesh>
      ))}

      {[
        [-1.12, 0.38, -1.28],
        [1.12, 0.38, -1.28],
        [-1.12, 0.38, 1.3],
        [1.12, 0.38, 1.3]
      ].map(([x, y, z]) => (
        <Wheel key={`${x}-${z}`} position={[x, y, z]} />
      ))}
      </group>
    </group>
  );
});

function CockpitDashboard({ steeringWheelRef, speedNeedleRef, nitroNeedleRef }) {
  return (
    <group name="cockpit-dashboard">
      <mesh castShadow receiveShadow position={[0, 0.9, 0.2]} rotation={[-0.16, 0, 0]}>
        <boxGeometry args={[1.62, 0.24, 0.78]} />
        <meshStandardMaterial color="#171d21" roughness={0.5} metalness={0.18} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 1.02, 0.57]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.72, 0.14, 0.24]} />
        <meshStandardMaterial color="#0f1519" roughness={0.58} metalness={0.12} />
      </mesh>

      <mesh position={[0.36, 0.98, 0.04]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.42, 0.13, 0.08]} />
        <meshStandardMaterial color="#10161a" roughness={0.42} metalness={0.26} emissive="#05212b" emissiveIntensity={0.16} />
      </mesh>

      <mesh position={[0.37, 0.99, -0.005]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.28, 0.035, 0.014]} />
        <meshStandardMaterial color="#65d8ff" emissive="#65d8ff" emissiveIntensity={0.42} />
      </mesh>

      <Gauge position={[-0.56, 1.01, 0.02]} needleRef={speedNeedleRef} accent="#70f0ff" />
      <Gauge position={[-0.26, 1.01, 0.02]} needleRef={nitroNeedleRef} accent="#f2d486" />

      <mesh position={[-0.42, 0.9, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.048, 0.36, 16]} />
        <meshStandardMaterial color="#12171b" roughness={0.44} metalness={0.38} />
      </mesh>

      <group ref={steeringWheelRef} position={[-0.42, 0.88, -0.2]} rotation={[-0.2, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.22, 0.021, 12, 36]} />
          <meshStandardMaterial color="#11161a" roughness={0.48} metalness={0.22} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[0.066, 0.015, 10, 24]} />
          <meshStandardMaterial color="#242b30" roughness={0.38} metalness={0.34} />
        </mesh>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
          <mesh key={`steering-spoke-${angle}`} position={[Math.sin(angle) * 0.052, Math.cos(angle) * 0.052, 0.012]} rotation={[0, 0, -angle]}>
            <boxGeometry args={[0.025, 0.16, 0.018]} />
            <meshStandardMaterial color="#242b30" roughness={0.38} metalness={0.34} />
          </mesh>
        ))}
      </group>

      <mesh position={[-0.88, 0.99, 0.12]} rotation={[0, 0.24, 0]}>
        <boxGeometry args={[0.08, 0.28, 0.12]} />
        <meshStandardMaterial color="#10161a" roughness={0.46} metalness={0.22} />
      </mesh>

      <mesh position={[0.86, 0.99, 0.12]} rotation={[0, -0.24, 0]}>
        <boxGeometry args={[0.08, 0.28, 0.12]} />
        <meshStandardMaterial color="#10161a" roughness={0.46} metalness={0.22} />
      </mesh>
    </group>
  );
}

function Gauge({ position, needleRef, accent }) {
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[0.13, 32]} />
        <meshStandardMaterial color="#071016" roughness={0.38} metalness={0.2} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <torusGeometry args={[0.132, 0.008, 8, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.24} roughness={0.24} metalness={0.18} />
      </mesh>
      {[-1.8, -0.9, 0, 0.9, 1.8].map((angle) => (
        <mesh key={`tick-${angle}`} position={[Math.sin(angle) * 0.095, Math.cos(angle) * 0.095, 0.024]} rotation={[0, 0, -angle]}>
          <boxGeometry args={[0.01, 0.035, 0.01]} />
          <meshStandardMaterial color="#d8e4eb" emissive="#9fc7d8" emissiveIntensity={0.12} />
        </mesh>
      ))}
      <group ref={needleRef} position={[0, 0, 0.034]} rotation={[0, 0, -2.18]}>
        <mesh position={[0, 0.052, 0]}>
          <boxGeometry args={[0.012, 0.108, 0.012]} />
          <meshStandardMaterial color="#f4d35e" emissive="#f4d35e" emissiveIntensity={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.022, 12, 8]} />
          <meshStandardMaterial color="#d8e4eb" roughness={0.2} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Wheel({ position }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.34, 24]} />
        <meshStandardMaterial color="#101214" roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.176, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.026, 18]} />
        <meshStandardMaterial color="#c6c9c8" roughness={0.3} metalness={0.52} />
      </mesh>
      <mesh position={[0, -0.176, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.026, 18]} />
        <meshStandardMaterial color="#c6c9c8" roughness={0.3} metalness={0.52} />
      </mesh>
    </group>
  );
}

function updateCollisionVisuals(collisionPulse, bodyMaterial, cabinMaterial) {
  const intensity = Math.max(0, Math.min(1, collisionPulse ?? 0));

  if (bodyMaterial) {
    bodyMaterial.emissive.set(intensity > 0 ? '#7d1f18' : '#000000');
    bodyMaterial.emissiveIntensity = intensity * 0.62;
  }

  if (cabinMaterial) {
    cabinMaterial.emissive.set(intensity > 0 ? '#f4d35e' : '#000000');
    cabinMaterial.emissiveIntensity = intensity * 0.18;
  }
}

function updateBrakeLights(active, leftMaterial, rightMaterial) {
  const intensity = active ? 1.85 : 0.55;
  const emissive = active ? '#ff1f18' : '#9c1411';

  [leftMaterial, rightMaterial].forEach((material) => {
    if (!material) return;

    material.emissive.set(emissive);
    material.emissiveIntensity = intensity;
  });
}

function updateCockpitTelemetry(vehicleState, config, steeringWheel, speedNeedle, nitroNeedle) {
  const steering = clamp(vehicleState.steering ?? 0, -1, 1);
  const speedRatio = clamp(Math.abs(vehicleState.speed ?? 0) / config.maxSpeed, 0, 1);
  const nitroCapacity = config.nitroCapacity ?? 100;
  const nitroRatio = clamp((vehicleState.nitroEnergy ?? nitroCapacity) / nitroCapacity, 0, 1);

  if (steeringWheel) {
    steeringWheel.rotation.z = -steering * 0.95;
  }

  if (speedNeedle) {
    speedNeedle.rotation.z = -2.18 + speedRatio * 4.36;
  }

  if (nitroNeedle) {
    nitroNeedle.rotation.z = -2.18 + nitroRatio * 4.36;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createWeatherAdjustedVehicleConfig(config, weatherMode) {
  if (weatherMode === 'snow') {
    return {
      ...config,
      acceleration: config.acceleration * 0.72,
      brakePower: config.brakePower * 0.58,
      brakeForce: config.brakeForce * 0.58,
      driftAlignment: config.driftAlignment * 0.54,
      driftBuildRate: config.driftBuildRate * 1.55,
      driftDecayRate: config.driftDecayRate * 0.52,
      driftFullSpeed: config.driftFullSpeed * 0.74,
      driftStartSpeed: config.driftStartSpeed * 0.52,
      friction: config.friction * 0.52,
      highSpeedTurnRatio: Math.min(0.22, config.highSpeedTurnRatio),
      maxReverseSpeed: config.maxReverseSpeed * 0.78,
      maxSlipAngle: config.maxSlipAngle * 1.52,
      maxSpeed: config.maxSpeed * 0.84,
      nitroBoost: config.nitroBoost * 0.9,
      offRoadDrag: config.offRoadDrag * 1.28,
      rollingResistance: config.rollingResistance * 0.62,
      turnSpeed: config.turnSpeed * 0.68,
      velocityAlignment: config.velocityAlignment * 0.42,
      weatherGrip: 0.48
    };
  }

  if (weatherMode === 'storm') {
    return {
      ...config,
      acceleration: config.acceleration * 0.82,
      brakePower: config.brakePower * 0.68,
      brakeForce: config.brakeForce * 0.68,
      driftAlignment: config.driftAlignment * 0.68,
      driftBuildRate: config.driftBuildRate * 1.34,
      driftDecayRate: config.driftDecayRate * 0.64,
      driftFullSpeed: config.driftFullSpeed * 0.82,
      driftStartSpeed: config.driftStartSpeed * 0.64,
      friction: config.friction * 0.62,
      highSpeedTurnRatio: Math.min(0.24, config.highSpeedTurnRatio),
      maxReverseSpeed: config.maxReverseSpeed * 0.86,
      maxSlipAngle: config.maxSlipAngle * 1.34,
      maxSpeed: config.maxSpeed * 0.9,
      offRoadDrag: config.offRoadDrag * 1.18,
      rollingResistance: config.rollingResistance * 0.72,
      turnSpeed: config.turnSpeed * 0.78,
      velocityAlignment: config.velocityAlignment * 0.58,
      weatherGrip: 0.62
    };
  }

  if (weatherMode === 'rain') {
    return {
      ...config,
      acceleration: config.acceleration * 0.9,
      brakePower: config.brakePower * 0.78,
      brakeForce: config.brakeForce * 0.78,
      driftAlignment: config.driftAlignment * 0.78,
      driftBuildRate: config.driftBuildRate * 1.2,
      driftDecayRate: config.driftDecayRate * 0.78,
      driftFullSpeed: config.driftFullSpeed * 0.9,
      driftStartSpeed: config.driftStartSpeed * 0.76,
      friction: config.friction * 0.72,
      maxSlipAngle: config.maxSlipAngle * 1.18,
      maxSpeed: config.maxSpeed * 0.95,
      offRoadDrag: config.offRoadDrag * 1.1,
      rollingResistance: config.rollingResistance * 0.82,
      turnSpeed: config.turnSpeed * 0.86,
      velocityAlignment: config.velocityAlignment * 0.72,
      weatherGrip: 0.76
    };
  }

  if (weatherMode === 'fog') {
    return {
      ...config,
      acceleration: config.acceleration * 0.94,
      brakePower: config.brakePower * 0.9,
      brakeForce: config.brakeForce * 0.9,
      maxSpeed: config.maxSpeed * 0.84,
      nitroMaxSpeedMultiplier: Math.min(config.nitroMaxSpeedMultiplier ?? 1.16, 1.08),
      turnSpeed: config.turnSpeed * 0.92,
      velocityAlignment: config.velocityAlignment * 0.86,
      weatherGrip: 0.86
    };
  }

  if (weatherMode === 'cloudy') {
    return {
      ...config,
      brakePower: config.brakePower * 0.96,
      brakeForce: config.brakeForce * 0.96,
      turnSpeed: config.turnSpeed * 0.97,
      weatherGrip: 0.96
    };
  }

  return {
    ...config,
    weatherGrip: 1
  };
}
