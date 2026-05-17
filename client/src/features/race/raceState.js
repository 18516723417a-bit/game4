const BEST_TIME_STORAGE_KEY = 'game4:showcaseSprintBestMs';

export function createInitialGameState(raceModeEnabled = true) {
  return {
    phase: raceModeEnabled ? 'ready' : 'freeDrive',
    countdownStep: 0,
    startedAt: 0,
    elapsedMs: 0,
    resultMs: null,
    failReason: '',
    checkpointIndex: 0,
    collisionBaseline: 0,
    collisionCount: 0,
    bestMs: readBestTime()
  };
}

export function calculateRaceScore({ gameState, raceModeEnabled, telemetry, timeLeftMs }) {
  const speedScore = Math.round((telemetry.speedKmh ?? 0) * 4);

  if (!raceModeEnabled) {
    return Math.max(0, speedScore);
  }

  if (gameState.phase === 'ready' || gameState.phase === 'countdown') {
    return 0;
  }

  const checkpointScore = gameState.checkpointIndex * 1200;
  const timeScore = Math.round(Math.max(0, timeLeftMs) / 250);
  const hitPenalty = (gameState.collisionCount ?? 0) * 250;

  return Math.max(0, checkpointScore + timeScore + speedScore - hitPenalty);
}

export function getPlanarDistance(position, target) {
  if (!position || !target) return 0;

  const dx = position.x - target.x;
  const dz = position.z - target.z;

  return Math.sqrt(dx * dx + dz * dz);
}

export function isCheckpointReached(position, checkpoint) {
  const dx = position.x - checkpoint.position.x;
  const dz = position.z - checkpoint.position.z;
  const dy = Math.abs(position.y - checkpoint.position.y);

  return dx * dx + dz * dz <= checkpoint.radius * checkpoint.radius &&
    dy <= checkpoint.yTolerance;
}

export function formatGamePhase(phase) {
  if (phase === 'freeDrive') return 'Free Drive';
  if (phase === 'countdown') return 'Starting';
  if (phase === 'running') return 'Racing';
  if (phase === 'paused') return 'Paused';
  if (phase === 'finished') return 'Finished';
  if (phase === 'failed') return 'Game Over';
  return 'Ready';
}

export function formatRaceTime(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '--';

  return `${Math.max(0, milliseconds / 1000).toFixed(1)}s`;
}

export function readBestTime() {
  try {
    const value = window.localStorage.getItem(BEST_TIME_STORAGE_KEY);
    const time = Number(value);

    return Number.isFinite(time) && time > 0 ? time : null;
  } catch {
    return null;
  }
}

export function writeBestTime(time) {
  try {
    window.localStorage.setItem(BEST_TIME_STORAGE_KEY, String(time));
  } catch {
    // localStorage can be unavailable in strict private browsing modes.
  }
}
