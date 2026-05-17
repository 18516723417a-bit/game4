import { RACE_CHECKPOINTS } from './raceConfig.js';

export function RaceMarkers({ checkpointIndex, loadedChunks, phase }) {
  if (phase === 'finished' || phase === 'failed') return null;

  return (
    <group name="race-checkpoints">
      {RACE_CHECKPOINTS.map((checkpoint, index) => {
        if (index < checkpointIndex) return null;
        if (!isPointInLoadedChunks(checkpoint.position, loadedChunks)) return null;

        const isNext = index === checkpointIndex;
        const color = isNext ? '#f2d486' : '#61d9ff';
        const opacity = isNext ? 0.82 : 0.42;

        return (
          <group
            key={checkpoint.id}
            position={[checkpoint.position.x, checkpoint.position.y + 0.08, checkpoint.position.z]}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[checkpoint.radius * 0.68, checkpoint.radius, 36]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={opacity} />
            </mesh>
            <mesh position={[-checkpoint.radius * 0.58, 3.1, 0]}>
              <boxGeometry args={[0.65, 6.2, 0.65]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
            </mesh>
            <mesh position={[checkpoint.radius * 0.58, 3.1, 0]}>
              <boxGeometry args={[0.65, 6.2, 0.65]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
            </mesh>
            <mesh position={[0, 6.2, 0]}>
              <boxGeometry args={[checkpoint.radius * 1.16, 0.58, 0.58]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function isPointInLoadedChunks(position, loadedChunks) {
  return loadedChunks.some((chunk) => (
    position.x >= chunk.bounds.minX &&
    position.x <= chunk.bounds.maxX &&
    position.z >= chunk.bounds.minZ &&
    position.z <= chunk.bounds.maxZ
  ));
}
