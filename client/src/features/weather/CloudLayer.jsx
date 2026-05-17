import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const CLOUD_LAYOUT = [
  [-68, 72, -42, 18, 4.4, 9],
  [-32, 66, 38, 24, 5.2, 11],
  [18, 76, -58, 28, 5.8, 13],
  [54, 69, 22, 22, 4.9, 10],
  [92, 82, -8, 30, 6.2, 14],
  [-104, 78, 18, 26, 5.6, 12],
  [-82, 86, 82, 32, 6, 15],
  [74, 74, 82, 26, 5.4, 12],
  [122, 92, -74, 36, 6.8, 16],
  [-132, 88, -92, 34, 6.4, 15]
];

export function CloudLayer({ nightMode, opacity }) {
  const groupRef = useRef(null);
  const cloudColor = nightMode ? '#415367' : '#d9e2e1';

  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.position.x = camera.position.x;
    group.position.z = camera.position.z;
    group.rotation.y += delta * 0.004;
  });

  return (
    <group ref={groupRef} name="weather-cloud-layer">
      {CLOUD_LAYOUT.map(([x, y, z, scaleX, scaleY, scaleZ], index) => (
        <mesh
          key={`cloud-${index}`}
          position={[x, y, z]}
          scale={[scaleX, scaleY, scaleZ]}
          renderOrder={-1}
        >
          <sphereGeometry args={[1, 16, 8]} />
          <meshBasicMaterial
            color={cloudColor}
            depthWrite={false}
            opacity={Math.min(0.82, opacity)}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}
