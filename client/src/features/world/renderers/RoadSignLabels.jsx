import * as THREE from 'three';
import { useDisposableResource } from '../rendering/instanceRenderers.jsx';

export function RoadSignLabelMeshes({ instances }) {
  if (instances.length === 0) return null;

  return (
    <group name="RoadSignLabelMeshes">
      {instances.map((sign) => (
        <RoadSignLabel key={sign.id} sign={sign} />
      ))}
    </group>
  );
}

function RoadSignLabel({ sign }) {
  const geometry = useDisposableResource(
    () => new THREE.PlaneGeometry(sign.width, sign.height),
    [sign.width, sign.height]
  );
  const material = useDisposableResource(
    () => {
      const texture = createRoadSignTexture(sign.text);
      const signMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true
      });
      const originalDispose = signMaterial.dispose.bind(signMaterial);

      signMaterial.dispose = () => {
        texture.dispose();
        originalDispose();
      };

      return signMaterial;
    },
    [sign.text]
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={sign.position}
      rotation={sign.rotation}
      frustumCulled={false}
      name={`RoadSignLabel:${sign.id}`}
    />
  );
}

function createRoadSignTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  const rawText = String(text ?? '');
  const lines = rawText.split('\n').slice(0, 2);
  const upperText = rawText.toUpperCase();
  const palette = upperText.includes('SPEED')
    ? { background: '#f2f0dc', border: '#1b2023', text: '#151a1c' }
    : upperText.includes('HEIGHT')
      ? { background: '#f2d486', border: '#151a1c', text: '#151a1c' }
      : upperText.includes('TUNNEL')
        ? { background: '#203b49', border: '#f2d486', text: '#f7f0c9' }
        : { background: '#1d2b24', border: '#f2d486', text: '#f7f0c9' };

  context.fillStyle = palette.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = palette.border;
  context.lineWidth = 10;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  context.fillStyle = palette.text;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  if (lines.length > 1) {
    context.font = '800 43px Arial, sans-serif';
    context.fillText(lines[0], canvas.width / 2, 62, canvas.width - 54);
    context.font = '800 34px Arial, sans-serif';
    context.fillText(lines[1], canvas.width / 2, 112, canvas.width - 70);
  } else {
    context.font = '700 42px Arial, sans-serif';
    context.fillText(lines[0] ?? '', canvas.width / 2, canvas.height / 2, canvas.width - 54);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}
