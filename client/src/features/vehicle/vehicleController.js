import { CAR_CONFIG } from './carConfig.js';
import { WORLD_SETTINGS } from '../world/worldConfig.js';

export function createVehicleState(config = CAR_CONFIG) {
  return {
    position: { ...config.spawn.position },
    heading: config.spawn.heading,
    moveHeading: config.spawn.heading,
    steering: 0,
    angularVelocity: 0,
    driftAmount: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    nitroEnergy: config.nitroCapacity,
    nitroActive: false,
    surfaceId: null,
    surfaceType: 'groundRoad',
    surfaceGrip: 1,
    onElevated: false,
    collisionCount: 0,
    collisionCooldown: 0,
    collisionPulse: 0,
    stuckTimer: 0,
    lastSafeTransform: createSafeTransform(
      config.spawn.position,
      config.spawn.heading,
      config.spawn.heading,
      null,
      'groundRoad',
      false
    )
  };
}

export function resetVehicleState(state, config = CAR_CONFIG) {
  state.position.x = config.spawn.position.x;
  state.position.y = config.spawn.position.y;
  state.position.z = config.spawn.position.z;
  state.heading = config.spawn.heading;
  state.moveHeading = config.spawn.heading;
  state.steering = 0;
  state.angularVelocity = 0;
  state.driftAmount = 0;
  state.pitch = 0;
  state.roll = 0;
  state.speed = 0;
  state.nitroEnergy = config.nitroCapacity;
  state.nitroActive = false;
  state.surfaceId = null;
  state.surfaceType = 'groundRoad';
  state.surfaceGrip = 1;
  state.onElevated = false;
  state.collisionCount = 0;
  state.collisionCooldown = 0;
  state.collisionPulse = 0;
  state.stuckTimer = 0;
  state.lastSafeTransform = createSafeTransform(
    config.spawn.position,
    config.spawn.heading,
    config.spawn.heading,
    null,
    'groundRoad',
    false
  );
  return state;
}

export function teleportVehicleState(state, teleport, config = CAR_CONFIG) {
  state.position.x = clamp(teleport.x, WORLD_SETTINGS.worldMinX, WORLD_SETTINGS.worldMaxX);
  state.position.y = Number.isFinite(teleport.y) ? teleport.y : config.spawn.position.y;
  state.position.z = clamp(teleport.z, WORLD_SETTINGS.worldMinZ, WORLD_SETTINGS.worldMaxZ);
  state.heading = Number.isFinite(teleport.heading) ? teleport.heading : state.heading;
  state.moveHeading = state.heading;
  state.steering = 0;
  state.angularVelocity = 0;
  state.driftAmount = 0;
  state.pitch = 0;
  state.roll = 0;
  state.speed = 0;
  state.nitroEnergy = config.nitroCapacity;
  state.nitroActive = false;
  state.surfaceId = null;
  state.surfaceType = 'groundRoad';
  state.surfaceGrip = 1;
  state.onElevated = false;
  state.collisionCooldown = 0;
  state.collisionPulse = 0;
  state.stuckTimer = 0;
  state.lastSafeTransform = createSafeTransform(
    state.position,
    state.heading,
    state.moveHeading,
    state.surfaceId,
    state.surfaceType,
    state.onElevated
  );
  return state;
}

export function stepVehicle(
  state,
  input,
  delta,
  config = CAR_CONFIG,
  colliders = [],
  driveSurfaces = []
) {
  const dt = clamp(delta, 0, 0.05);

  ensureStateDefaults(state, config);
  state.collisionCooldown = Math.max(0, state.collisionCooldown - dt);
  state.collisionPulse = Math.max(0, state.collisionPulse - dt * 3.2);

  if (input.reset) {
    resetVehicleState(state, config);
    return state;
  }

  const previousPosition = { ...state.position };
  updateSpeed(state, input, dt, config);
  updateSteering(state, input, dt, config);
  updateMoveHeading(state, input, dt, config);
  const movement = integratePosition(state, dt, config, colliders, driveSurfaces);

  updateRecoveryState(
    state,
    input,
    movement,
    previousPosition,
    dt,
    config,
    colliders
  );

  return state;
}

export function getVehicleTelemetry(state, config = CAR_CONFIG) {
  const nitroCapacity = config.nitroCapacity ?? 100;

  return {
    speedKmh: Math.abs(state.speed) * 3.6,
    speed: state.speed,
    heading: state.heading,
    steering: state.steering,
    surfaceId: state.surfaceId,
    surfaceType: state.surfaceType,
    surfaceGrip: state.surfaceGrip ?? getSurfaceGrip(state, config),
    onElevated: Boolean(state.onElevated),
    nitroRatio: clamp(state.nitroEnergy / nitroCapacity, 0, 1),
    nitroActive: Boolean(state.nitroActive),
    collisionCount: state.collisionCount,
    collisionPulse: state.collisionPulse,
    stuckTimer: state.stuckTimer,
    rotation: {
      x: state.pitch ?? 0,
      y: state.heading,
      z: state.roll ?? 0
    },
    velocity: {
      x: Math.sin(state.moveHeading) * state.speed,
      y: 0,
      z: Math.cos(state.moveHeading) * state.speed
    }
  };
}

function updateSpeed(state, input, dt, config) {
  const wantsForward = Boolean(input.forward) && !input.backward;
  const wantsReverse = Boolean(input.backward) && !input.forward;
  const wantsBrake = Boolean(input.forward) && Boolean(input.backward);
  const surfaceGrip = getSurfaceGrip(state, config);
  const brakePower = (config.brakePower ?? config.brakeForce) * getSurfaceBrakeRatio(state, config);
  const friction = getSurfaceCoastDrag(state, config);
  const rollingResistance = getSurfaceRollingResistance(state, config);
  const accelerationRatio = getSurfaceAccelerationRatio(state, config);
  const nitroCapacity = config.nitroCapacity ?? 100;
  let speed = state.speed;
  let nitroActive = false;

  if (wantsBrake) {
    speed = approach(speed, 0, brakePower * dt);
  } else if (input.handbrake && Math.abs(speed) > config.stopSnapSpeed) {
    speed = approach(speed, 0, brakePower * 0.42 * dt);
  } else if (wantsForward) {
    if (speed < -config.directionChangeBrakeThreshold) {
      speed = approach(speed, 0, brakePower * dt);
    } else {
      const speedRatio = clamp(speed / config.maxSpeed, 0, 1);
      const accelRatio = lerp(1, config.accelerationMinRatio, smoothstep(speedRatio));
      speed += config.acceleration * accelerationRatio * accelRatio * dt;

      if (
        input.nitro &&
        state.nitroEnergy > 0 &&
        speed > (config.nitroMinSpeed ?? 0) &&
        surfaceGrip > 0.72
      ) {
        nitroActive = true;
        state.nitroEnergy = Math.max(0, state.nitroEnergy - (config.nitroDrainRate ?? 30) * dt);
        speed += config.acceleration * accelerationRatio * ((config.nitroBoost ?? 1.25) - 1) * 1.8 * dt;
      }
    }
  } else if (wantsReverse) {
    if (speed > config.directionChangeBrakeThreshold) {
      speed = approach(speed, 0, brakePower * dt);
    } else {
      const reverseRatio = clamp(Math.abs(speed) / config.maxReverseSpeed, 0, 1);
      const reverseForce = config.reverseAcceleration * lerp(1, 0.28, smoothstep(reverseRatio));
      speed -= reverseForce * accelerationRatio * dt;
    }
  } else {
    speed *= Math.exp(-friction * dt);
    speed = approach(speed, 0, rollingResistance * dt);
  }

  if (!nitroActive) {
    state.nitroEnergy = Math.min(nitroCapacity, state.nitroEnergy + (config.nitroRechargeRate ?? 12) * dt);
  }

  state.nitroActive = nitroActive;

  const maxForwardSpeed = config.maxSpeed * (nitroActive ? (config.nitroMaxSpeedMultiplier ?? 1.2) : 1);
  speed = clamp(speed, -config.maxReverseSpeed, maxForwardSpeed);

  if (!wantsForward && !wantsReverse && Math.abs(speed) < config.stopSnapSpeed) {
    speed = 0;
  }

  state.speed = snapTinyValue(speed);
}

function isOffRoadState(state) {
  return !state.surfaceId || state.surfaceType === 'offRoad' || state.surfaceType === 'grass';
}

function getSurfaceGrip(state, config) {
  return isOffRoadState(state) ? (config.offRoadGrip ?? 0.58) : 1;
}

function getSurfaceGripForSurface(surface, config) {
  return !surface?.id ? (config.offRoadGrip ?? 0.58) : 1;
}

function getSurfaceAccelerationRatio(state, config) {
  return isOffRoadState(state) ? (config.offRoadAccelerationRatio ?? 0.82) : 1;
}

function getSurfaceBrakeRatio(state, config) {
  return isOffRoadState(state) ? (config.offRoadBrakeRatio ?? 0.72) : 1;
}

function getSurfaceTurnRatio(state, config) {
  return isOffRoadState(state) ? (config.offRoadTurnRatio ?? 0.64) : 1;
}

function getSurfaceCoastDrag(state, config) {
  return isOffRoadState(state)
    ? (config.offRoadDrag ?? config.friction ?? config.coastDrag)
    : (config.friction ?? config.coastDrag);
}

function getSurfaceRollingResistance(state, config) {
  return isOffRoadState(state)
    ? (config.offRoadRollingResistance ?? config.rollingResistance)
    : config.rollingResistance;
}

function getSurfaceVelocityAlignmentRatio(state, config) {
  return isOffRoadState(state) ? (config.offRoadVelocityAlignmentRatio ?? 0.42) : 1;
}

function getSurfaceDriftBuildRatio(state, config) {
  return isOffRoadState(state) ? (config.offRoadDriftBuildRatio ?? 1.35) : 1;
}

function getSurfaceMaxSlipMultiplier(state, config) {
  return isOffRoadState(state) ? (config.offRoadMaxSlipAngleMultiplier ?? 1.75) : 1;
}

function getSurfaceSlipTarget(state, steerAmount, speedAbs, config) {
  if (!isOffRoadState(state)) return 0;

  const speedRatio = smoothstep(clamp(
    (speedAbs - (config.offRoadSlipStartSpeed ?? 13)) / Math.max(config.maxSpeed * 0.62, 1),
    0,
    1
  ));
  const steerRatio = smoothstep(clamp((steerAmount - 0.18) / 0.72, 0, 1));

  return speedRatio * lerp(0.14, 0.82, steerRatio);
}

function updateSteering(state, input, dt, config) {
  const steerTarget = Number(Boolean(input.left)) - Number(Boolean(input.right));
  const steerRate = steerTarget === 0 ? config.steeringReturnSpeed : config.steeringResponse;

  state.steering = approach(state.steering, steerTarget, steerRate * dt);

  if (Math.abs(state.steering) < 0.002) {
    state.steering = 0;
  }

  const speedAbs = Math.abs(state.speed);

  if (speedAbs < 0.02) {
    state.angularVelocity = 0;
    return;
  }

  const movingTurnRatio = clamp(speedAbs / config.minSteerSpeed, 0, 1);
  const lowSpeedRatio = clamp(speedAbs / config.lowSpeedTurnBoostSpeed, 0, 1);
  const lowSpeedBoost = lerp(config.lowSpeedTurnBoost, 1, smoothstep(lowSpeedRatio));
  const highSpeedRatio = clamp(
    (speedAbs - config.highSpeedTurnStart) / (config.maxSpeed - config.highSpeedTurnStart),
    0,
    1
  );
  const highSpeedDamping = lerp(1, config.highSpeedTurnRatio, smoothstep(highSpeedRatio));
  const direction = state.speed >= 0 ? 1 : -1;
  const yawDelta = (
    state.steering *
    config.turnSpeed *
    getSurfaceTurnRatio(state, config) *
    movingTurnRatio *
    lowSpeedBoost *
    highSpeedDamping *
    direction *
    dt
  );

  state.heading = normalizeAngle(state.heading + yawDelta);
  state.angularVelocity = dt > 0 ? yawDelta / dt : 0;
}

function updateMoveHeading(state, input, dt, config) {
  const speedAbs = Math.abs(state.speed);

  if (speedAbs < config.stopSnapSpeed) {
    state.moveHeading = state.heading;
    state.driftAmount = 0;
    return;
  }

  const steerAmount = Math.abs(state.steering);
  const driftSpeedRatio = clamp(
    (speedAbs - config.driftStartSpeed) / (config.driftFullSpeed - config.driftStartSpeed),
    0,
    1
  );
  const driftSteerRatio = clamp(
    (steerAmount - config.driftSteerThreshold) / (1 - config.driftSteerThreshold),
    0,
    1
  );
  const driftTarget = smoothstep(driftSpeedRatio) * smoothstep(driftSteerRatio);
  const handbrakeDriftTarget = input.handbrake
    ? smoothstep(clamp((speedAbs - config.driftStartSpeed * 0.55) / Math.max(config.driftFullSpeed * 0.55, 0.1), 0, 1))
    : 0;
  const finalDriftTarget = Math.max(driftTarget, handbrakeDriftTarget);
  const surfaceSlipTarget = getSurfaceSlipTarget(state, steerAmount, speedAbs, config);
  const combinedDriftTarget = Math.max(finalDriftTarget, surfaceSlipTarget);
  const driftRate = combinedDriftTarget > state.driftAmount
    ? config.driftBuildRate * getSurfaceDriftBuildRatio(state, config) * 1.35
    : config.driftDecayRate;

  state.driftAmount = approach(state.driftAmount, combinedDriftTarget, driftRate * dt);

  const speedRatio = clamp(speedAbs / config.maxSpeed, 0, 1);
  const alignment = lerp(config.velocityAlignment, config.driftAlignment, state.driftAmount);
  const highSpeedAlignment = lerp(1, 0.58, smoothstep(speedRatio));
  const alignmentBlend = 1 - Math.exp(-alignment * highSpeedAlignment * getSurfaceVelocityAlignmentRatio(state, config) * dt);

  state.moveHeading = lerpAngle(state.moveHeading, state.heading, alignmentBlend);
  state.moveHeading = clampAngleFromTarget(
    state.moveHeading,
    state.heading,
    config.maxSlipAngle * getSurfaceMaxSlipMultiplier(state, config)
  );

  if (!input.left && !input.right && !input.handbrake && state.driftAmount === 0) {
    state.moveHeading = lerpAngle(
      state.moveHeading,
      state.heading,
      1 - Math.exp(-config.velocityAlignment * getSurfaceVelocityAlignmentRatio(state, config) * dt)
    );
  }
}

function integratePosition(state, dt, config, colliders, driveSurfaces) {
  const previousX = state.position.x;
  const previousY = state.position.y;
  const previousZ = state.position.z;
  const previousSpeed = state.speed;
  const nextX = snapTinyValue(previousX + Math.sin(state.moveHeading) * state.speed * dt);
  const nextZ = snapTinyValue(previousZ + Math.cos(state.moveHeading) * state.speed * dt);
  const clampedX = clamp(nextX, WORLD_SETTINGS.worldMinX, WORLD_SETTINGS.worldMaxX);
  const clampedZ = clamp(nextZ, WORLD_SETTINGS.worldMinZ, WORLD_SETTINGS.worldMaxZ);
  const hitWorldBoundary = clampedX !== nextX || clampedZ !== nextZ;

  state.position.x = clampedX;
  state.position.z = clampedZ;

  const surface = sampleDriveSurface(state.position, previousY, driveSurfaces, config.spawn.position.y, config);
  state.position.y = surface.y;
  state.surfaceId = surface.id;
  state.surfaceType = surface.roadType;
  state.surfaceGrip = getSurfaceGripForSurface(surface, config);
  state.onElevated = surface.y > config.spawn.position.y + 3 || surface.roadType === 'elevatedHighway' || surface.roadType === 'bridge';
  applySurfaceAttitude(state, surface, dt, config);

  const hit = getColliderHit(
    state.position,
    colliders,
    config.collisionRadius,
    state.position.x - previousX,
    state.position.z - previousZ
  );
  const abruptDrop = isAbruptSurfaceDrop(previousY, surface, config);

  if (hitWorldBoundary || abruptDrop || hit) {
    const resolved = hit
      ? resolveColliderHit(state.position, hit, colliders, config)
      : null;

    if (resolved && !hitWorldBoundary && !abruptDrop) {
      state.position.x = resolved.x;
      state.position.z = resolved.z;

      const resolvedSurface = sampleDriveSurface(
        state.position,
        previousY,
        driveSurfaces,
        config.spawn.position.y,
        config
      );

      state.position.y = resolvedSurface.y;
      state.surfaceId = resolvedSurface.id;
      state.surfaceType = resolvedSurface.roadType;
      state.surfaceGrip = getSurfaceGripForSurface(resolvedSurface, config);
      state.onElevated = resolvedSurface.y > config.spawn.position.y + 3 ||
        resolvedSurface.roadType === 'elevatedHighway' ||
        resolvedSurface.roadType === 'bridge';
      applySurfaceAttitude(state, resolvedSurface, dt, config);
    } else {
      state.position.x = previousX;
      state.position.y = previousY;
      state.position.z = previousZ;
    }

    applyCollisionResponse(
      state,
      previousSpeed,
      hit,
      hitWorldBoundary ? 'worldBoundary' : abruptDrop ? 'surfaceDrop' : hit.collider.type,
      config
    );
    registerCollision(state);

    return {
      collided: true,
      collisionType: hitWorldBoundary ? 'worldBoundary' : abruptDrop ? 'surfaceDrop' : hit.collider.type,
      movedDistance: distance2d({ x: previousX, z: previousZ }, state.position)
    };
  }

  return {
    collided: false,
    collisionType: null,
    movedDistance: distance2d({ x: previousX, z: previousZ }, state.position)
  };
}

function applyCollisionResponse(state, previousSpeed, hit, collisionType, config) {
  const speedAbs = Math.abs(previousSpeed);

  if (hit && speedAbs > 0.7) {
    const vx = Math.sin(state.moveHeading) * previousSpeed;
    const vz = Math.cos(state.moveHeading) * previousSpeed;
    const normalSpeed = vx * hit.normalX + vz * hit.normalZ;
    const tangentX = vx - hit.normalX * normalSpeed;
    const tangentZ = vz - hit.normalZ * normalSpeed;
    const tangentSpeed = Math.hypot(tangentX, tangentZ);
    const isScrape = tangentSpeed > 0.9 && Math.abs(normalSpeed) < speedAbs * 0.72;

    if (isScrape) {
      state.moveHeading = Math.atan2(tangentX, tangentZ);
      state.heading = lerpAngle(state.heading, state.moveHeading, 0.18);
      state.speed = Math.min(
        tangentSpeed * (config.collisionSlideRetention ?? 0.48),
        speedAbs * 0.62
      );
    } else {
      state.speed = -Math.sign(previousSpeed) * Math.min(
        speedAbs * (config.collisionSlowdown ?? 0.16),
        config.collisionBounceMaxSpeed ?? 3.2
      );
      state.moveHeading = state.heading;
    }
  } else {
    state.speed = 0;
  }

  if (collisionType === 'surfaceDrop' || collisionType === 'worldBoundary') {
    state.speed = Math.abs(previousSpeed) > 1
      ? -Math.sign(previousSpeed) * Math.min(Math.abs(previousSpeed) * 0.22, config.collisionBounceMaxSpeed ?? 3.2)
      : 0;
    state.moveHeading = state.heading;
  }

  state.angularVelocity = 0;
  state.steering *= config.collisionSteeringRetention ?? 0.28;
  state.driftAmount = 0;
  state.nitroActive = false;
}

function ensureStateDefaults(state, config) {
  if (!Number.isFinite(state.moveHeading)) state.moveHeading = state.heading;
  if (!Number.isFinite(state.steering)) state.steering = 0;
  if (!Number.isFinite(state.angularVelocity)) state.angularVelocity = 0;
  if (!Number.isFinite(state.driftAmount)) state.driftAmount = 0;
  if (!Number.isFinite(state.pitch)) state.pitch = 0;
  if (!Number.isFinite(state.roll)) state.roll = 0;
  if (!Number.isFinite(state.nitroEnergy)) state.nitroEnergy = config.nitroCapacity ?? 100;
  if (typeof state.nitroActive !== 'boolean') state.nitroActive = false;
  if (!Number.isFinite(state.surfaceGrip)) state.surfaceGrip = getSurfaceGrip(state, config);
  if (!Number.isFinite(state.collisionCount)) state.collisionCount = 0;
  if (!Number.isFinite(state.collisionCooldown)) state.collisionCooldown = 0;
  if (!Number.isFinite(state.collisionPulse)) state.collisionPulse = 0;
  if (!Number.isFinite(state.stuckTimer)) state.stuckTimer = 0;
  if (!state.lastSafeTransform) {
    state.lastSafeTransform = createSafeTransform(
      state.position,
      state.heading,
      state.moveHeading,
      state.surfaceId,
      state.surfaceType,
      state.onElevated
    );
  }
}

function registerCollision(state) {
  if (state.collisionCooldown <= 0) {
    state.collisionCount += 1;
    state.collisionCooldown = 0.42;
  }

  state.collisionPulse = 1;
}

function approach(value, target, amount) {
  if (value < target) {
    return Math.min(value + amount, target);
  }

  return Math.max(value - amount, target);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  return normalizeAngle(a + shortestAngleDelta(a, b) * clamp(t, 0, 1));
}

function shortestAngleDelta(a, b) {
  return normalizeAngle(b - a);
}

function clampAngleFromTarget(angle, target, maxDelta) {
  const delta = clamp(shortestAngleDelta(target, angle), -maxDelta, maxDelta);
  return normalizeAngle(target + delta);
}

function normalizeAngle(angle) {
  let value = angle;

  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;

  return value;
}

function smoothstep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function snapTinyValue(value) {
  return Math.abs(value) < 1e-9 ? 0 : value;
}

function updateRecoveryState(
  state,
  input,
  movement,
  previousPosition,
  dt,
  config,
  colliders
) {
  const tryingToMove = Boolean(input.forward || input.backward);
  const barelyMoved = movement.movedDistance < (config.stuckMoveEpsilon ?? 0.08);

  if (movement.collided || (tryingToMove && barelyMoved && Math.abs(state.speed) < 0.9)) {
    state.stuckTimer += dt;
  } else {
    state.stuckTimer = Math.max(0, state.stuckTimer - dt * 1.8);
  }

  if (!movement.collided && isSafeRoadPosition(state, colliders, config)) {
    state.lastSafeTransform = createSafeTransform(
      state.position,
      state.heading,
      state.moveHeading,
      state.surfaceId,
      state.surfaceType,
      state.onElevated
    );
  }

  if (state.stuckTimer < (config.autoRecoverDelay ?? 1.8)) return;

  recoverToLastSafeTransform(state, previousPosition, config);
}

function recoverToLastSafeTransform(state, fallbackPosition, config) {
  const safe = state.lastSafeTransform ?? createSafeTransform(
    fallbackPosition,
    config.spawn.heading,
    config.spawn.heading,
    null,
    'groundRoad',
    false
  );

  state.position.x = safe.position.x;
  state.position.y = safe.position.y;
  state.position.z = safe.position.z;
  state.heading = safe.heading;
  state.moveHeading = safe.moveHeading;
  state.steering = 0;
  state.angularVelocity = 0;
  state.driftAmount = 0;
  state.pitch = 0;
  state.roll = 0;
  state.speed = 0;
  state.nitroActive = false;
  state.surfaceId = safe.surfaceId;
  state.surfaceType = safe.surfaceType;
  state.surfaceGrip = 1;
  state.onElevated = safe.onElevated;
  state.stuckTimer = 0;
  state.collisionPulse = 1;
}

function isSafeRoadPosition(state, colliders, config) {
  if (!state.surfaceId) return false;

  return !getColliderHit(
    state.position,
    colliders,
    config.collisionRadius + (config.safePointClearance ?? 1.35),
    0,
    0
  );
}

function createSafeTransform(position, heading, moveHeading, surfaceId, surfaceType, onElevated) {
  return {
    position: { ...position },
    heading,
    moveHeading,
    surfaceId,
    surfaceType,
    onElevated
  };
}

function resolveColliderHit(position, hit, colliders, config) {
  const skin = config.collisionSkin ?? 0.08;
  const resolved = {
    ...position,
    x: position.x + hit.normalX * (hit.penetration + skin),
    z: position.z + hit.normalZ * (hit.penetration + skin)
  };

  if (
    resolved.x < WORLD_SETTINGS.worldMinX ||
    resolved.x > WORLD_SETTINGS.worldMaxX ||
    resolved.z < WORLD_SETTINGS.worldMinZ ||
    resolved.z > WORLD_SETTINGS.worldMaxZ
  ) {
    return null;
  }

  return getColliderHit(resolved, colliders, config.collisionRadius, 0, 0)
    ? null
    : resolved;
}

function getColliderHit(position, colliders, radius, moveX = 0, moveZ = 0) {
  if (!colliders.length) return null;

  let bestHit = null;

  for (const collider of colliders) {
    if (!isColliderYRelevant(position, collider)) continue;

    const hit = collider.shape === 'segment'
      ? getSegmentColliderHit(position, collider, radius, moveX, moveZ)
      : getBoxColliderHit(position, collider, radius, moveX, moveZ);

    if (!hit) continue;

    if (!bestHit || hit.penetration > bestHit.penetration) {
      bestHit = hit;
    }
  }

  return bestHit;
}

function getBoxColliderHit(position, collider, radius, moveX, moveZ) {
  const closestX = clamp(position.x, collider.minX, collider.maxX);
  const closestZ = clamp(position.z, collider.minZ, collider.maxZ);
  const dx = position.x - closestX;
  const dz = position.z - closestZ;
  const distanceSq = dx * dx + dz * dz;

  if (distanceSq >= radius * radius) return null;

  const distance = Math.sqrt(distanceSq);
  const normal = getCollisionNormal(position, collider, dx, dz, distance, moveX, moveZ);
  const penetration = distance > 0 ? radius - distance : radius;

  return {
    collider,
    normalX: normal.x,
    normalZ: normal.z,
    penetration
  };
}

function getSegmentColliderHit(position, collider, radius, moveX, moveZ) {
  const dx = collider.endX - collider.startX;
  const dz = collider.endZ - collider.startZ;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0.000001) return null;

  const t = clamp(
    ((position.x - collider.startX) * dx + (position.z - collider.startZ) * dz) / lengthSq,
    0,
    1
  );
  const closestX = collider.startX + dx * t;
  const closestZ = collider.startZ + dz * t;
  const offsetX = position.x - closestX;
  const offsetZ = position.z - closestZ;
  const distanceSq = offsetX * offsetX + offsetZ * offsetZ;
  const colliderRadius = (collider.width ?? 0) / 2;
  const overlapRadius = radius + colliderRadius;

  if (distanceSq >= overlapRadius * overlapRadius) return null;

  const distance = Math.sqrt(distanceSq);
  let normalX;
  let normalZ;

  if (distance > 0.0001) {
    normalX = offsetX / distance;
    normalZ = offsetZ / distance;
  } else if (Math.hypot(moveX, moveZ) > 0.0001) {
    const movementLength = Math.hypot(moveX, moveZ);
    normalX = -moveX / movementLength;
    normalZ = -moveZ / movementLength;
  } else {
    const length = Math.sqrt(lengthSq);
    normalX = -dz / length;
    normalZ = dx / length;
  }

  return {
    collider,
    normalX,
    normalZ,
    penetration: distance > 0 ? overlapRadius - distance : overlapRadius
  };
}

function isColliderYRelevant(position, collider) {
  if (!Number.isFinite(collider.minY) || !Number.isFinite(collider.maxY)) {
    return true;
  }

  const vehicleMinY = position.y - 0.38;
  const vehicleMaxY = position.y + 1.25;

  return vehicleMaxY >= collider.minY && vehicleMinY <= collider.maxY;
}

function getCollisionNormal(position, collider, dx, dz, distance, moveX, moveZ) {
  if (distance > 0.0001) {
    return {
      x: dx / distance,
      z: dz / distance
    };
  }

  if (Math.hypot(moveX, moveZ) > 0.0001) {
    const movementLength = Math.hypot(moveX, moveZ);

    return {
      x: -moveX / movementLength,
      z: -moveZ / movementLength
    };
  }

  const distances = [
    { x: -1, z: 0, value: Math.abs(position.x - collider.minX) },
    { x: 1, z: 0, value: Math.abs(collider.maxX - position.x) },
    { x: 0, z: -1, value: Math.abs(position.z - collider.minZ) },
    { x: 0, z: 1, value: Math.abs(collider.maxZ - position.z) }
  ].sort((a, b) => a.value - b.value);

  return {
    x: distances[0].x,
    z: distances[0].z
  };
}

function isAbruptSurfaceDrop(previousY, surface, config) {
  if (surface.roadType === 'ramp') return false;

  const maxDrop = config.maxSurfaceDrop ?? 2.2;
  const wasHigh = previousY > config.spawn.position.y + maxDrop;
  const drop = previousY - surface.y;

  return wasHigh && drop > maxDrop;
}

function applySurfaceAttitude(state, surface, dt, config) {
  const attitude = getSurfaceAttitude(surface, state.heading);
  const speedRatio = clamp(Math.abs(state.speed) / config.maxSpeed, 0, 1);
  const leanTarget = -state.steering * speedRatio * (config.visualLean ?? 0.055);
  const response = config.slopeAttitudeResponse ?? 8;
  const blend = 1 - Math.exp(-response * dt);

  state.pitch = lerp(state.pitch, attitude.pitch, blend);
  state.roll = lerp(state.roll, attitude.roll + leanTarget, blend);
}

function getSurfaceAttitude(surface, heading) {
  if (surface.shape !== 'ramp' || !Number.isFinite(surface.length) || surface.length <= 0) {
    return { pitch: 0, roll: 0 };
  }

  const dx = surface.endX - surface.startX;
  const dz = surface.endZ - surface.startZ;
  const length = Math.max(Math.hypot(dx, dz), 0.0001);
  const slope = (surface.endY - surface.startY) / length;
  const rampX = dx / length;
  const rampZ = dz / length;
  const forwardX = Math.sin(heading);
  const forwardZ = Math.cos(heading);
  const rightX = Math.cos(heading);
  const rightZ = -Math.sin(heading);
  const forwardGrade = slope * (forwardX * rampX + forwardZ * rampZ);
  const sideGrade = slope * (rightX * rampX + rightZ * rampZ);

  return {
    pitch: -Math.atan(forwardGrade),
    roll: Math.atan(sideGrade) * 0.45
  };
}

function distance2d(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function sampleDriveSurface(position, currentY, driveSurfaces, fallbackY, config = CAR_CONFIG) {
  const surfaceMargin = config.surfaceProbeMargin ?? 0;
  let best = {
    id: null,
    roadType: 'grass',
    y: fallbackY,
    score: Math.abs(currentY - fallbackY) + 0.12
  };
  let rampCandidate = null;

  for (const surface of driveSurfaces) {
    const y = getSurfaceYAt(surface, position.x, position.z, surfaceMargin);

    if (!Number.isFinite(y)) continue;
    if (isUndergroundSurfaceSnapCandidate(surface, y, currentY, fallbackY, config)) continue;

    let score = Math.abs(currentY - y);

    if (surface.roadType === 'ramp' && surface.shape === 'ramp') {
      const rampScore = score;
      if (!rampCandidate || rampScore < rampCandidate.score) {
        rampCandidate = {
          ...surface,
          y,
          score: rampScore
        };
      }

      if (currentY <= fallbackY + 0.8 && y > fallbackY + 0.9) {
        score += 2.2;
      } else {
        score -= 0.45;

        if (currentY <= fallbackY + 0.8 && y <= fallbackY + 0.7) {
          score -= 1.2;
        }
      }
    }

    if (
      surface.roadType === 'elevatedHighway' ||
      surface.roadType === 'bridge'
    ) {
      score += currentY < fallbackY + 3 ? 1.4 : -0.25;
    }

    if (score < best.score) {
      best = {
        ...surface,
        y,
        score
      };
    }
  }

  if (rampCandidate && shouldPreferRampSurface(rampCandidate, best, currentY, fallbackY)) {
    return rampCandidate;
  }

  return best;
}

function shouldPreferRampSurface(rampSurface, bestSurface, currentY, fallbackY) {
  if (!bestSurface?.id) return true;
  if (bestSurface.roadType === 'grass') return true;
  if (bestSurface.roadType === 'ramp' && bestSurface.shape !== 'ramp') {
    return Math.abs(currentY - rampSurface.y) <= Math.abs(currentY - bestSurface.y) + 0.8;
  }
  if (
    currentY >= fallbackY - 0.7 &&
    rampSurface.y < fallbackY - 1.2 &&
    rampSurface.y < currentY - 1.35
  ) {
    return false;
  }

  const rampStartsNearGround = Math.min(rampSurface.startY ?? fallbackY, rampSurface.endY ?? fallbackY) <= fallbackY + 0.8;
  if (rampStartsNearGround && rampSurface.y <= fallbackY + 2.2) return true;

  if (currentY > fallbackY + 0.65) {
    return Math.abs(currentY - rampSurface.y) <= Math.abs(currentY - bestSurface.y) + 1.2;
  }

  return false;
}

function isUndergroundSurfaceSnapCandidate(surface, y, currentY, fallbackY, config) {
  if (y >= fallbackY - 1.2) return false;

  const maxStepDown = Math.max(1.25, (config.maxSurfaceDrop ?? 2.2) * 0.62);
  if (currentY < fallbackY - 0.7) return false;
  if (surface.shape === 'ramp' && y >= currentY - maxStepDown) return false;

  return y < currentY - maxStepDown;
}

function getSurfaceYAt(surface, x, z, margin = 0) {
  if (surface.shape === 'circle') {
    const dx = x - surface.centerX;
    const dz = z - surface.centerZ;
    const distanceSq = dx * dx + dz * dz;
    const radius = surface.radius + margin;

    if (distanceSq > radius * radius) return Number.NaN;

    return surface.y;
  }

  if (
    x < surface.minX - margin ||
    x > surface.maxX + margin ||
    z < surface.minZ - margin ||
    z > surface.maxZ + margin
  ) {
    return Number.NaN;
  }

  if (surface.shape === 'segment') {
    const dx = surface.endX - surface.startX;
    const dz = surface.endZ - surface.startZ;
    const lengthSq = dx * dx + dz * dz;

    if (lengthSq <= 0) return Number.NaN;

    const t = ((x - surface.startX) * dx + (z - surface.startZ) * dz) / lengthSq;

    const length = Math.sqrt(lengthSq);
    const tMargin = margin / Math.max(length, 0.0001);

    if (t < -tMargin || t > 1 + tMargin) return Number.NaN;

    const lateral = Math.abs((x - surface.startX) * (-dz / length) + (z - surface.startZ) * (dx / length));

    if (lateral > surface.width / 2 + margin) return Number.NaN;

    return surface.y;
  }

  if (surface.shape === 'ramp') {
    if (Number.isFinite(surface.startX) && Number.isFinite(surface.endX)) {
      const dx = surface.endX - surface.startX;
      const dz = surface.endZ - surface.startZ;
      const lengthSq = dx * dx + dz * dz;

      if (lengthSq <= 0) return Number.NaN;

      const t = ((x - surface.startX) * dx + (z - surface.startZ) * dz) / lengthSq;

      const length = Math.sqrt(lengthSq);
      const tMargin = margin / Math.max(length, 0.0001);

      if (t < -tMargin || t > 1 + tMargin) return Number.NaN;

      const lateral = Math.abs((x - surface.startX) * (-dz / length) + (z - surface.startZ) * (dx / length));

      if (lateral > surface.width / 2 + margin) return Number.NaN;

      return lerp(surface.startY, surface.endY, clamp(t, 0, 1));
    }

    const t = clamp((z - surface.startZ) / (surface.endZ - surface.startZ), 0, 1);
    return lerp(surface.startY, surface.endY, t);
  }

  return surface.y;
}
