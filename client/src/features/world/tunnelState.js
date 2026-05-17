const APPROACH_DISTANCE = 150;
const PORTAL_BLEND_DISTANCE = 22;
const TUNNEL_LATERAL_MARGIN = 8;
const APPROACH_LATERAL_MARGIN = 28;

const OUTSIDE_TUNNEL = {
  activeZoneId: null,
  distanceToPortal: Number.POSITIVE_INFINITY,
  lightingFactor: 1,
  progress: null,
  state: 'outsideTunnel'
};

export function getTunnelStatus(position, heading = 0, chunks = []) {
  if (!position || !Array.isArray(chunks) || chunks.length === 0) return OUTSIDE_TUNNEL;

  const headingVector = {
    x: Math.sin(heading),
    z: Math.cos(heading)
  };
  let best = null;

  for (const chunk of chunks) {
    for (const zone of chunk.tunnelZones ?? []) {
      const status = getZoneTunnelStatus(position, headingVector, zone);
      if (!status) continue;

      if (!best || status.priority < best.priority || (
        status.priority === best.priority &&
        status.distanceToCenter < best.distanceToCenter
      )) {
        best = status;
      }
    }
  }

  if (!best) return OUTSIDE_TUNNEL;

  return {
    activeZoneId: best.activeZoneId,
    distanceToPortal: best.distanceToPortal,
    lightingFactor: best.lightingFactor,
    progress: best.progress,
    state: best.state
  };
}

function getZoneTunnelStatus(position, headingVector, zone) {
  const start = zone.rampStart;
  const end = zone.rampEnd;
  const tunnelStart = zone.tunnelStart;
  const tunnelEnd = zone.tunnelEnd;
  if (!start || !end || !tunnelStart || !tunnelEnd) return null;

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length <= 0.001) return null;

  const tangent = {
    x: dx / length,
    z: dz / length
  };
  const normal = {
    x: -tangent.z,
    z: tangent.x
  };
  const relative = {
    x: position.x - start.x,
    z: position.z - start.z
  };
  const along = relative.x * tangent.x + relative.z * tangent.z;
  const lateral = Math.abs(relative.x * normal.x + relative.z * normal.z);
  const width = zone.width ?? 12;
  const inTunnelCorridor = lateral <= width / 2 + TUNNEL_LATERAL_MARGIN;
  const inApproachCorridor = lateral <= width / 2 + APPROACH_LATERAL_MARGIN;

  if (!inApproachCorridor) return null;
  if (along < -APPROACH_DISTANCE || along > length + APPROACH_DISTANCE) return null;

  const dot = headingVector.x * tangent.x + headingVector.z * tangent.z;
  const forward = dot >= 0;
  const entryDistance = forward
    ? getDistanceAlongLine(start, tangent, tunnelStart)
    : length - getDistanceAlongLine(start, tangent, tunnelEnd);
  const exitDistance = forward
    ? getDistanceAlongLine(start, tangent, tunnelEnd)
    : length - getDistanceAlongLine(start, tangent, tunnelStart);
  const travelProgress = forward ? along : length - along;
  const beforeEntry = travelProgress < 0;
  const afterExit = travelProgress > length;
  const distanceToEntryPortal = Math.max(0, -travelProgress);
  const distanceFromExitPortal = Math.max(0, travelProgress - length);
  const distanceToPortal = beforeEntry
    ? distanceToEntryPortal
    : afterExit
      ? distanceFromExitPortal
      : Math.min(Math.abs(travelProgress - entryDistance), Math.abs(travelProgress - exitDistance));

  if (beforeEntry) {
    const t = 1 - clamp01(distanceToEntryPortal / APPROACH_DISTANCE);
    return createStatus(zone, 'approachingTunnel', lerp(1, 0.82, t), distanceToPortal, travelProgress, lateral, 4);
  }

  if (afterExit) {
    const t = clamp01(distanceFromExitPortal / APPROACH_DISTANCE);
    return createStatus(zone, 'exitingTunnel', lerp(0.78, 1, t), distanceToPortal, travelProgress, lateral, 3);
  }

  if (!inTunnelCorridor) return null;

  if (travelProgress < entryDistance) {
    const t = clamp01(travelProgress / Math.max(entryDistance, 0.001));
    return createStatus(zone, 'enteringTunnel', lerp(0.82, 0.58, smoothstep(t)), distanceToPortal, travelProgress, lateral, 1);
  }

  if (travelProgress > exitDistance) {
    const t = clamp01((travelProgress - exitDistance) / Math.max(length - exitDistance, 0.001));
    return createStatus(zone, 'exitingTunnel', lerp(0.58, 0.9, smoothstep(t)), distanceToPortal, travelProgress, lateral, 1);
  }

  const insideProgress = clamp01((travelProgress - entryDistance) / Math.max(exitDistance - entryDistance, 0.001));
  const nearEntrance = Math.min(insideProgress, 1 - insideProgress) * (exitDistance - entryDistance);
  const state = nearEntrance < PORTAL_BLEND_DISTANCE
    ? (insideProgress < 0.5 ? 'enteringTunnel' : 'exitingTunnel')
    : 'insideTunnel';
  const lightPulse = 0.04 * Math.sin(insideProgress * Math.PI * 8);

  return createStatus(zone, state, clamp(0.62 + lightPulse, 0.56, 0.7), distanceToPortal, travelProgress, lateral, 0);
}

function createStatus(zone, state, lightingFactor, distanceToPortal, progress, lateral, priority) {
  return {
    activeZoneId: zone.id,
    distanceToCenter: lateral + Math.max(0, distanceToPortal) * 0.05,
    distanceToPortal,
    lightingFactor,
    priority,
    progress,
    state
  };
}

function getDistanceAlongLine(start, tangent, point) {
  return (point.x - start.x) * tangent.x + (point.z - start.z) * tangent.z;
}

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
