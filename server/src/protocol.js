export const messageTypes = {
  serverHello: 'server:hello',
  clientPing: 'client:ping',
  serverPong: 'server:pong',
  clientState: 'client:state',
  clientTeleport: 'client:teleport',
  serverSnapshot: 'server:snapshot',
  serverTeleport: 'server:teleport',
  serverTeleportRejected: 'server:teleportRejected',
  serverAck: 'server:ack',
  serverError: 'server:error'
};

export function encode(type, payload = {}) {
  return JSON.stringify({
    type,
    payload,
    sentAt: Date.now()
  });
}

export function decode(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
  const message = JSON.parse(text);

  if (!message || typeof message.type !== 'string') {
    throw new Error('Invalid message shape');
  }

  return message;
}
