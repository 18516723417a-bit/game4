import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

const targetPosition = new Vector3();

export function RemotePlayers({ players, teleportEvent }) {
  return (
    <group name="remote-players">
      {players.map((player) => (
        <RemoteVehicle
          key={player.id}
          player={player}
          teleportEvent={teleportEvent}
        />
      ))}
    </group>
  );
}

function RemoteVehicle({ player, teleportEvent }) {
  const groupRef = useRef(null);
  const targetRef = useRef(player);
  const lastTeleportEventIdRef = useRef(null);

  useEffect(() => {
    targetRef.current = player;
  }, [player]);

  useEffect(() => {
    const group = groupRef.current;

    if (
      !group ||
      !teleportEvent ||
      teleportEvent.playerId !== player.id ||
      teleportEvent.eventId === lastTeleportEventIdRef.current
    ) {
      return;
    }

    lastTeleportEventIdRef.current = teleportEvent.eventId;
    group.position.set(
      teleportEvent.position.x,
      teleportEvent.position.y ?? 0.48,
      teleportEvent.position.z
    );
    group.rotation.set(0, teleportEvent.rotation?.y ?? group.rotation.y, 0);
    targetRef.current = {
      ...player,
      position: teleportEvent.position,
      rotation: teleportEvent.rotation,
      velocity: teleportEvent.velocity,
      currentChunk: teleportEvent.currentChunk
    };
  }, [player, teleportEvent]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const target = targetRef.current;

    if (!group || !target?.position) return;

    targetPosition.set(
      target.position.x,
      target.position.y ?? 0.48,
      target.position.z
    );

    const distance = group.position.distanceTo(targetPosition);

    if (distance > 80) {
      group.position.copy(targetPosition);
    } else {
      group.position.lerp(targetPosition, 1 - Math.exp(-10 * delta));
    }

    group.rotation.y = lerpAngle(
      group.rotation.y,
      target.rotation?.y ?? 0,
      1 - Math.exp(-12 * delta)
    );
  });

  return (
    <group
      ref={groupRef}
      position={[
        player.position?.x ?? 0,
        player.position?.y ?? 0.48,
        player.position?.z ?? 0
      ]}
      rotation={[0, player.rotation?.y ?? 0, 0]}
    >
      <mesh castShadow receiveShadow position={[0, 0.34, 0]}>
        <boxGeometry args={[2.05, 0.58, 4.1]} />
        <meshStandardMaterial color="#2f8bd8" roughness={0.52} metalness={0.08} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.82, -0.32]}>
        <boxGeometry args={[1.45, 0.62, 1.75]} />
        <meshStandardMaterial color="#13202b" roughness={0.38} metalness={0.12} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.46, -2.2]}>
        <boxGeometry args={[1.65, 0.26, 0.34]} />
        <meshStandardMaterial color="#d9edf8" emissive="#123b55" emissiveIntensity={0.2} />
      </mesh>

      {[
        [-1.12, 0.18, -1.28],
        [1.12, 0.18, -1.28],
        [-1.12, 0.18, 1.3],
        [1.12, 0.18, 1.3]
      ].map(([x, y, z]) => (
        <mesh key={`${player.id}-${x}-${z}`} castShadow position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.32, 18]} />
          <meshStandardMaterial color="#101417" roughness={0.74} />
        </mesh>
      ))}
    </group>
  );
}

function lerpAngle(from, to, amount) {
  return from + shortestAngleDelta(from, to) * amount;
}

function shortestAngleDelta(from, to) {
  let delta = to - from;

  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  return delta;
}
