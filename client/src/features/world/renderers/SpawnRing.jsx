import { WORLD_SETTINGS } from '../worldConfig.js';
import { isPointInsideBounds } from '../utils/math.js';

export function SpawnRing({ chunks }) {
  const [x, y, z] = WORLD_SETTINGS.teleportAnchors.downtown.position;
  const isVisible = chunks.some((chunk) => isPointInsideBounds(x, z, chunk.bounds));

  if (!isVisible) return null;

  return (
    <mesh receiveShadow position={[x, y - 0.462, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[3.2, 4.2, 32]} />
      <meshStandardMaterial
        color="#61d9ff"
        emissive="#168db0"
        emissiveIntensity={0.55}
        roughness={0.58}
      />
    </mesh>
  );
}
