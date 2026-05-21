export const serverConfig = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3001),
  wsPath: process.env.WS_PATH || '/ws',
  tickRate: clamp(Number(process.env.TICK_RATE || 3), 3, 12),
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 30000),
  staleClientMs: 30000,
  maxPlayersPerRoom: clamp(Number(process.env.MAX_PLAYERS_PER_ROOM || 5), 2, 8),
  maxRooms: clamp(Number(process.env.MAX_ROOMS || 48), 1, 512),
  maxStateUpdatesPerSecond: clamp(Number(process.env.MAX_STATE_UPDATES_PER_SECOND || 4), 3, 16),
  maxBufferedBytes: Number(process.env.MAX_BUFFERED_BYTES || 64 * 1024),
  maxClientMessageBytes: Number(process.env.MAX_CLIENT_MESSAGE_BYTES || 4096),
  teleportRequestMinIntervalMs: Number(process.env.TELEPORT_REQUEST_MIN_INTERVAL_MS || 500),
  teleportCooldownMs: Number(process.env.TELEPORT_COOLDOWN_MS || 3000),
  defaultRoomId: process.env.DEFAULT_ROOM_ID || 'default',
  logIntervalMs: Number(process.env.LOG_INTERVAL_MS || 60000),
  worldWidth: Number(process.env.WORLD_WIDTH || 16000),
  worldHeight: Number(process.env.WORLD_HEIGHT || 16000),
  chunkSize: 500,
  groundY: 0.48,
  maxTeleportY: Number(process.env.MAX_TELEPORT_Y || 24)
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
