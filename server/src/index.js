import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { serverConfig } from './config.js';
import { decode, encode, messageTypes } from './protocol.js';

const clients = new Map();
const rooms = new Map();
const worldBounds = createWorldBounds();
const stateUpdateMinIntervalMs = Math.floor(1000 / serverConfig.maxStateUpdatesPerSecond);

const httpServer = http.createServer((request, response) => {
  if (request.url === '/health') {
    sendJson(response, 200, {
      ok: true,
      players: clients.size,
      rooms: rooms.size,
      maxRooms: serverConfig.maxRooms,
      maxPlayersPerRoom: serverConfig.maxPlayersPerRoom,
      worldWidth: serverConfig.worldWidth,
      worldHeight: serverConfig.worldHeight,
      tickRate: serverConfig.tickRate,
      wsPath: serverConfig.wsPath,
      roomPopulations: getRoomPopulations()
    });
    return;
  }

  sendJson(response, 200, {
    name: 'game4-city-racer-server',
    status: 'running',
    players: clients.size,
    rooms: rooms.size,
    ws: serverConfig.wsPath
  });
});

const wss = new WebSocketServer({
  server: httpServer,
  path: serverConfig.wsPath,
  perMessageDeflate: false
});

wss.on('connection', (socket, request) => {
  const roomId = sanitizeRoomId(getQueryParam(request.url, 'roomId') || serverConfig.defaultRoomId);
  const room = getOrCreateRoom(roomId);

  if (!room) {
    socket.close(1013, 'Room limit reached');
    return;
  }

  if (room.players.size >= serverConfig.maxPlayersPerRoom) {
    socket.close(1013, 'Room full');
    return;
  }

  const clientId = randomUUID();
  const nickname = sanitizeNickname(getQueryParam(request.url, 'nickname'), `Driver-${clientId.slice(0, 4)}`);
  const now = Date.now();
  const client = {
    id: clientId,
    roomId,
    socket,
    connectedAt: now,
    lastSeenAt: now,
    lastStateAt: 0,
    lastTeleportAt: 0,
    lastTeleportRequestAt: 0,
    stateLockedUntil: 0,
    player: createPlayerState(clientId, nickname, roomId, now)
  };

  clients.set(clientId, client);
  room.players.add(clientId);

  socket.send(
    encode(messageTypes.serverHello, {
      playerId: clientId,
      roomId,
      tickRate: serverConfig.tickRate,
      maxPlayersPerRoom: serverConfig.maxPlayersPerRoom,
      maxRooms: serverConfig.maxRooms,
      features: {
        multiplayerSync: true,
        serverAuthoritativeTeleport: true,
        rooms: true,
        chunkStreaming: false
      }
    })
  );

  socket.on('message', (raw) => {
    const activeClient = clients.get(clientId);
    if (!activeClient) return;

    activeClient.lastSeenAt = Date.now();

    try {
      const message = decode(raw);
      handleClientMessage(activeClient, message);
    } catch (error) {
      sendToSocket(socket, messageTypes.serverError, {
        message: error.message
      });
    }
  });

  socket.on('close', () => {
    removeClient(clientId);
  });

  socket.on('error', () => {
    removeClient(clientId);
  });
});

setInterval(() => {
  const now = Date.now();

  for (const [clientId, client] of clients) {
    if (
      client.socket.readyState !== client.socket.OPEN ||
      now - client.lastSeenAt > serverConfig.staleClientMs
    ) {
      client.socket.terminate();
      removeClient(clientId);
    }
  }
}, serverConfig.heartbeatIntervalMs).unref();

setInterval(() => {
  broadcastSnapshots();
}, Math.round(1000 / serverConfig.tickRate)).unref();

setInterval(() => {
  logServerStats();
}, serverConfig.logIntervalMs).unref();

httpServer.listen(serverConfig.port, serverConfig.host, () => {
  console.log(
    `Game4 server listening on http://${serverConfig.host}:${serverConfig.port}`
  );
  console.log(`WebSocket path: ${serverConfig.wsPath}`);
  console.log(
    `Tick rate: ${serverConfig.tickRate}Hz, rooms: max ${serverConfig.maxRooms}, players per room: ${serverConfig.maxPlayersPerRoom}`
  );
});

function handleClientMessage(client, message) {
  if (message.type === messageTypes.clientPing) {
    sendToSocket(client.socket, messageTypes.serverPong, {
      playerId: client.id,
      receivedAt: Date.now()
    });
    return;
  }

  if (message.type === messageTypes.clientState) {
    updatePlayerState(client, message.payload);
    return;
  }

  if (message.type === messageTypes.clientTeleport) {
    handleTeleportRequest(client, message.payload);
    return;
  }

  sendToSocket(client.socket, messageTypes.serverAck, {
    playerId: client.id,
    accepted: false,
    reason: `Unhandled message type: ${message.type}`
  });
}

function updatePlayerState(client, payload = {}) {
  const now = Date.now();
  const player = client.player;

  player.nickname = sanitizeNickname(payload.nickname, player.nickname);

  if (now - client.lastStateAt < stateUpdateMinIntervalMs) {
    return;
  }

  client.lastStateAt = now;

  if (now < client.stateLockedUntil) {
    player.updatedAt = now;
    return;
  }

  player.position = sanitizeVec3(payload.position, player.position);
  player.rotation = sanitizeVec3(payload.rotation, player.rotation);
  player.velocity = sanitizeVec3(payload.velocity, player.velocity);
  player.currentChunk = sanitizeChunk(payload.currentChunk, player.currentChunk);
  player.isTeleporting = false;
  player.updatedAt = now;
}

function handleTeleportRequest(client, payload = {}) {
  const now = Date.now();
  const playerId = typeof payload.playerId === 'string' ? payload.playerId : client.id;
  const currentRoomId = sanitizeRoomId(payload.currentRoomId || client.roomId);

  if (!clients.has(client.id) || playerId !== client.id) {
    rejectTeleport(client, 'player not found');
    return;
  }

  if (currentRoomId !== client.roomId || !rooms.has(currentRoomId)) {
    rejectTeleport(client, 'room not found');
    return;
  }

  if (now - client.lastTeleportRequestAt < serverConfig.teleportRequestMinIntervalMs) {
    rejectTeleport(client, 'teleport request rate limited');
    return;
  }

  client.lastTeleportRequestAt = now;

  const remainingCooldownMs = serverConfig.teleportCooldownMs - (now - client.lastTeleportAt);

  if (remainingCooldownMs > 0) {
    rejectTeleport(client, 'teleport cooldown', remainingCooldownMs);
    return;
  }

  const targetPosition = sanitizeTargetPosition(payload.targetPosition);

  if (!targetPosition || !isPositionInsideWorldBounds(targetPosition)) {
    rejectTeleport(client, 'target outside world');
    return;
  }

  const targetChunk = worldToChunkCoord(targetPosition);

  if (!targetChunk) {
    rejectTeleport(client, 'target chunk invalid');
    return;
  }

  const safeTeleport = getLightweightSafeTeleportPosition(targetPosition);
  const safePosition = {
    x: safeTeleport.x,
    y: safeTeleport.y,
    z: safeTeleport.z
  };
  const safeChunk = worldToChunkCoord(safePosition);

  if (!safeChunk) {
    rejectTeleport(client, 'safe teleport point unavailable');
    return;
  }

  const rotation = {
    x: 0,
    y: Number.isFinite(safeTeleport.heading) ? safeTeleport.heading : client.player.rotation.y,
    z: 0
  };
  const velocity = { x: 0, y: 0, z: 0 };

  client.player.position = safePosition;
  client.player.rotation = rotation;
  client.player.velocity = velocity;
  client.player.currentChunk = safeChunk;
  client.player.isTeleporting = true;
  client.player.updatedAt = now;
  client.lastTeleportAt = now;
  client.stateLockedUntil = now + 500;

  broadcastTeleport(client.roomId, {
    playerId: client.id,
    nickname: client.player.nickname,
    currentRoomId: client.roomId,
    requestedPosition: targetPosition,
    targetChunk,
    position: safePosition,
    rotation,
    velocity,
    currentChunk: safeChunk,
    cooldownMs: serverConfig.teleportCooldownMs,
    serverTime: now
  });

  setTimeout(() => {
    const activeClient = clients.get(client.id);
    if (activeClient) {
      activeClient.player.isTeleporting = false;
    }
  }, 250).unref();
}

function rejectTeleport(client, reason, remainingCooldownMs = 0) {
  sendToSocket(client.socket, messageTypes.serverTeleportRejected, {
    playerId: client.id,
    reason,
    remainingCooldownMs,
    serverTime: Date.now()
  });
}

function broadcastTeleport(roomId, payload) {
  const message = encode(messageTypes.serverTeleport, payload);
  const room = rooms.get(roomId);

  if (!room) return;

  for (const clientId of room.players) {
    const client = clients.get(clientId);

    if (client?.socket.readyState === client.socket.OPEN) {
      client.socket.send(message);
    }
  }
}

function broadcastSnapshots() {
  if (rooms.size === 0) return;

  const serverTime = Date.now();

  for (const room of rooms.values()) {
    if (room.players.size === 0) {
      room.lastSnapshotPlayerCount = 0;
      continue;
    }

    if (room.players.size === 1 && room.lastSnapshotPlayerCount <= 1) {
      continue;
    }

    const players = [];

    for (const clientId of room.players) {
      const client = clients.get(clientId);

      if (client) {
        players.push(createNetworkPlayer(client.player));
      }
    }

    const message = encode(messageTypes.serverSnapshot, {
      roomId: room.id,
      serverTime,
      players
    });

    for (const clientId of room.players) {
      const client = clients.get(clientId);

      if (client?.socket.readyState === client.socket.OPEN) {
        client.socket.send(message);
      }
    }

    room.lastSnapshotPlayerCount = room.players.size;
  }
}

function createNetworkPlayer(player) {
  return {
    id: player.id,
    nickname: player.nickname,
    position: player.position,
    rotation: player.rotation,
    velocity: player.velocity,
    currentChunk: player.currentChunk,
    isTeleporting: Boolean(player.isTeleporting)
  };
}

function getOrCreateRoom(roomId) {
  const existingRoom = rooms.get(roomId);

  if (existingRoom) return existingRoom;
  if (rooms.size >= serverConfig.maxRooms) return null;

  const room = {
    id: roomId,
    players: new Set(),
    createdAt: Date.now(),
    lastSnapshotPlayerCount: 0
  };

  rooms.set(roomId, room);
  return room;
}

function removeClient(clientId) {
  const client = clients.get(clientId);

  if (!client) return;

  clients.delete(clientId);

  const room = rooms.get(client.roomId);

  if (room) {
    room.players.delete(clientId);

    if (room.players.size === 0) {
      rooms.delete(room.id);
    }
  }
}

function createPlayerState(id, nickname, roomId, now) {
  return {
    id,
    nickname,
    position: { x: 0, y: serverConfig.groundY, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    currentChunk: null,
    currentRoomId: roomId,
    isTeleporting: false,
    connectedAt: now,
    updatedAt: now
  };
}

function getLightweightSafeTeleportPosition(targetPosition) {
  return {
    x: clamp(targetPosition.x, worldBounds.minX, worldBounds.maxX),
    y: clamp(targetPosition.y, serverConfig.groundY, serverConfig.maxTeleportY),
    z: clamp(targetPosition.z, worldBounds.minZ, worldBounds.maxZ),
    heading: Number.isFinite(targetPosition.heading) ? targetPosition.heading : 0
  };
}

function worldToChunkCoord(position) {
  if (!isPositionInsideWorldBounds(position)) return null;

  return {
    chunkX: clamp(
      Math.floor(position.x / serverConfig.chunkSize),
      Math.floor(worldBounds.minX / serverConfig.chunkSize),
      Math.ceil(worldBounds.maxX / serverConfig.chunkSize) - 1
    ),
    chunkZ: clamp(
      Math.floor(position.z / serverConfig.chunkSize),
      Math.floor(worldBounds.minZ / serverConfig.chunkSize),
      Math.ceil(worldBounds.maxZ / serverConfig.chunkSize) - 1
    )
  };
}

function createWorldBounds() {
  return {
    minX: -serverConfig.worldWidth / 2,
    maxX: serverConfig.worldWidth / 2,
    minZ: -serverConfig.worldHeight / 2,
    maxZ: serverConfig.worldHeight / 2
  };
}

function logServerStats() {
  const roomDetails = getRoomPopulations()
    .map((room) => `${room.id}:${room.players}`)
    .join(', ') || 'none';

  console.log(
    `[stats] online=${clients.size} rooms=${rooms.size} roomPlayers=${roomDetails}`
  );
}

function getRoomPopulations() {
  return [...rooms.values()].map((room) => ({
    id: room.id,
    players: room.players.size
  }));
}

function sendToSocket(socket, type, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(encode(type, payload));
  }
}

function getQueryParam(url, key) {
  try {
    const parsed = new URL(url, 'http://game4.local');
    return parsed.searchParams.get(key);
  } catch {
    return null;
  }
}

function sanitizeNickname(value, fallback) {
  if (typeof value !== 'string') return fallback;

  const clean = value.replace(/[^\w -]/g, '').trim().slice(0, 24);
  return clean || fallback;
}

function sanitizeRoomId(value) {
  if (typeof value !== 'string') return serverConfig.defaultRoomId;

  const clean = value.replace(/[^\w-]/g, '').trim().slice(0, 32);
  return clean || serverConfig.defaultRoomId;
}

function sanitizeVec3(value, fallback) {
  if (!value || typeof value !== 'object') return fallback;

  return {
    x: sanitizeNumber(value.x, fallback.x),
    y: sanitizeNumber(value.y, fallback.y),
    z: sanitizeNumber(value.z, fallback.z)
  };
}

function sanitizeChunk(value, fallback) {
  if (!value || typeof value !== 'object') return fallback;

  const chunkX = Number(value.chunkX);
  const chunkZ = Number(value.chunkZ);

  if (!Number.isInteger(chunkX) || !Number.isInteger(chunkZ)) {
    return fallback;
  }

  return { chunkX, chunkZ };
}

function sanitizeTargetPosition(value) {
  if (!value || typeof value !== 'object') return null;

  const x = Number(value.x);
  const y = Number(value.y);
  const z = Number(value.z);
  const heading = Number(value.heading);

  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null;
  }

  return {
    x,
    y: Number.isFinite(y) ? y : serverConfig.groundY,
    z,
    heading: Number.isFinite(heading) ? heading : Number.NaN
  };
}

function sanitizeNumber(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(-100000, Math.min(100000, number));
}

function isPositionInsideWorldBounds(position) {
  return (
    position.x >= worldBounds.minX &&
    position.x <= worldBounds.maxX &&
    position.z >= worldBounds.minZ &&
    position.z <= worldBounds.maxZ
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}
