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
const SEND_RATE_HZ = 8;

export function useMultiplayerClient(localTelemetry) {
  const telemetryRef = useRef(localTelemetry);
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
        sendLocalState(socket, nickname, telemetryRef.current);
      }, Math.round(1000 / SEND_RATE_HZ));
      sendLocalState(socket, nickname, telemetryRef.current);
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

function sendLocalState(socket, nickname, telemetry) {
  if (socket.readyState !== WebSocket.OPEN || !telemetry?.position) return;

  socket.send(JSON.stringify({
    type: messageTypes.clientState,
    payload: {
      nickname,
      position: telemetry.position,
      rotation: telemetry.rotation ?? { x: 0, y: telemetry.heading ?? 0, z: 0 },
      velocity: telemetry.velocity ?? { x: 0, y: 0, z: 0 },
      currentChunk: worldToChunkCoord(telemetry.position)
    },
    sentAt: Date.now()
  }));
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
