import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { worldToChunkCoord } from '../world/worldConfig.js';

const messageTypes = {
  serverHello: 'server:hello',
  clientState: 'client:state',
  clientTeleport: 'client:teleport',
  serverSnapshot: 'server:snapshot',
  serverTeleport: 'server:teleport',
  serverTeleportRejected: 'server:teleportRejected'
};
const SEND_RATE_HZ = 4;
const IDLE_KEEPALIVE_MS = 8000;
const POSITION_EPSILON_SQ = 0.05 * 0.05;
const ROTATION_EPSILON = 0.004;
const VELOCITY_EPSILON_SQ = 0.02 * 0.02;

export function useMultiplayerClient(localTelemetry) {
  const telemetryRef = useRef(localTelemetry);
  const lastSentStateRef = useRef(null);
  const playerIdRef = useRef(null);
  const socketRef = useRef(null);
  const eventIdRef = useRef(0);
  const roomIdRef = useRef('default');
  const nickname = useMemo(() => getNickname(), []);
  const [status, setStatus] = useState('connecting');
  const [playerId, setPlayerId] = useState(null);
  const [remotePlayers, setRemotePlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [teleportEvent, setTeleportEvent] = useState(null);
  const [teleportRejected, setTeleportRejected] = useState(null);

  useEffect(() => {
    telemetryRef.current = localTelemetry;
  }, [localTelemetry]);

  useEffect(() => {
    const socket = new WebSocket(getWsUrl(nickname));
    let sendTimer = null;
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setStatus('connected');
      sendTimer = window.setInterval(() => {
        sendLocalState(socket, nickname, telemetryRef.current, lastSentStateRef);
      }, Math.round(1000 / SEND_RATE_HZ));
      sendLocalState(socket, nickname, telemetryRef.current, lastSentStateRef);
    });

    socket.addEventListener('message', (event) => {
      const message = decodeMessage(event.data);
      if (!message) return;

      if (message.type === messageTypes.serverHello) {
        const nextPlayerId = message.payload?.playerId;
        playerIdRef.current = nextPlayerId;
        roomIdRef.current = message.payload?.roomId ?? roomIdRef.current;
        setPlayerId(nextPlayerId);
        return;
      }

      if (message.type === messageTypes.serverSnapshot) {
        const players = Array.isArray(message.payload?.players)
          ? message.payload.players
          : [];
        setPlayerCount(players.length);
        setRemotePlayers(
          players.filter((player) => player.id && player.id !== playerIdRef.current)
        );
      }

      if (message.type === messageTypes.serverTeleport) {
        const event = {
          ...message.payload,
          eventId: ++eventIdRef.current
        };

        setTeleportEvent(event);
        setRemotePlayers((players) => upsertTeleportedPlayer(players, event, playerIdRef.current));
      }

      if (message.type === messageTypes.serverTeleportRejected) {
        setTeleportRejected({
          ...message.payload,
          eventId: ++eventIdRef.current
        });
      }
    });

    socket.addEventListener('close', () => {
      setStatus('disconnected');
      setRemotePlayers([]);
      setPlayerCount(1);
    });

    socket.addEventListener('error', () => {
      setStatus('error');
    });

    return () => {
      if (sendTimer) window.clearInterval(sendTimer);
      if (socketRef.current === socket) socketRef.current = null;
      socket.close();
    };
  }, [nickname]);

  const requestTeleport = useCallback((targetPosition, currentRoomId = roomIdRef.current) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN || !playerIdRef.current) {
      return false;
    }

    socket.send(JSON.stringify({
      type: messageTypes.clientTeleport,
      payload: {
        playerId: playerIdRef.current,
        targetPosition,
        currentRoomId
      },
      sentAt: Date.now()
    }));

    return true;
  }, []);

  return {
    nickname,
    playerId,
    playerCount,
    remotePlayers,
    requestTeleport,
    status,
    teleportEvent,
    teleportRejected
  };
}

function sendLocalState(socket, nickname, telemetry, lastSentStateRef) {
  if (socket.readyState !== WebSocket.OPEN || !telemetry?.position) return;

  const payload = {
    nickname,
    position: telemetry.position,
    rotation: telemetry.rotation ?? { x: 0, y: telemetry.heading ?? 0, z: 0 },
    velocity: telemetry.velocity ?? { x: 0, y: 0, z: 0 },
    currentChunk: worldToChunkCoord(telemetry.position)
  };
  const now = Date.now();

  if (shouldSkipStateSend(payload, lastSentStateRef?.current, now)) return;

  socket.send(JSON.stringify({
    type: messageTypes.clientState,
    payload,
    sentAt: now
  }));

  if (lastSentStateRef) {
    lastSentStateRef.current = {
      payload,
      sentAt: now
    };
  }
}

function shouldSkipStateSend(payload, lastSentState, now) {
  if (!lastSentState?.payload) return false;
  if (now - lastSentState.sentAt >= IDLE_KEEPALIVE_MS) return false;

  const previous = lastSentState.payload;
  if (!isSameChunk(payload.currentChunk, previous.currentChunk)) return false;
  if (getVec3DistanceSq(payload.position, previous.position) > POSITION_EPSILON_SQ) return false;
  if (getVec3DistanceSq(payload.velocity, previous.velocity) > VELOCITY_EPSILON_SQ) return false;

  const rotationDelta = Math.abs((payload.rotation?.y ?? 0) - (previous.rotation?.y ?? 0));
  return rotationDelta <= ROTATION_EPSILON;
}

function isSameChunk(a, b) {
  return a?.chunkX === b?.chunkX && a?.chunkZ === b?.chunkZ;
}

function getVec3DistanceSq(a = {}, b = {}) {
  const dx = (a.x ?? 0) - (b.x ?? 0);
  const dy = (a.y ?? 0) - (b.y ?? 0);
  const dz = (a.z ?? 0) - (b.z ?? 0);

  return dx * dx + dy * dy + dz * dz;
}

function decodeMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function upsertTeleportedPlayer(players, event, localPlayerId) {
  if (!event?.playerId || event.playerId === localPlayerId) return players;

  const nextPlayer = {
    id: event.playerId,
    nickname: event.nickname ?? `Driver-${event.playerId.slice(0, 4)}`,
    position: event.position,
    rotation: event.rotation,
    velocity: event.velocity,
    currentChunk: event.currentChunk,
    isTeleporting: true,
    updatedAt: event.serverTime
  };
  const index = players.findIndex((player) => player.id === event.playerId);

  if (index === -1) {
    return [...players, nextPlayer];
  }

  return players.map((player, playerIndex) => (
    playerIndex === index
      ? { ...player, ...nextPlayer }
      : player
  ));
}

function getNickname() {
  const storageKey = 'game4:nickname';

  const nickname = `Driver-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const existing = window.localStorage.getItem(storageKey);

    if (existing) return existing;

    window.localStorage.setItem(storageKey, nickname);
  } catch {
    return nickname;
  }

  return nickname;
}

function getWsUrl(nickname) {
  const explicitUrl = import.meta.env.VITE_GAME4_WS_URL;

  if (explicitUrl) {
    return appendNickname(explicitUrl, nickname);
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_GAME4_WS_HOST ?? window.location.host;
  const path = import.meta.env.VITE_GAME4_WS_PATH ?? '/game4/ws';

  return appendNickname(`${protocol}//${host}${path}`, nickname);
}

function appendNickname(url, nickname) {
  const parsed = new URL(url);
  parsed.searchParams.set('nickname', nickname);
  return parsed.toString();
}
