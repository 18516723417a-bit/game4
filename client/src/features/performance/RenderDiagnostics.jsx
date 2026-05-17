import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export function RendererSettings({ exposure }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

  return null;
}

export function PerformanceProbe({ loadedChunkCount, onStats, playerPosition }) {
  const { gl, scene } = useThree();
  const elapsedRef = useRef(0);
  const framesRef = useRef(0);
  const meshCountElapsedRef = useRef(0);
  const meshCountRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    meshCountElapsedRef.current += delta;
    framesRef.current += 1;

    if (elapsedRef.current < 1) return;

    if (meshCountElapsedRef.current >= 5 || meshCountRef.current === 0) {
      meshCountRef.current = countSceneMeshes(scene);
      meshCountElapsedRef.current = 0;
    }

    const fps = Math.round(framesRef.current / elapsedRef.current);
    const nextStats = {
      drawCalls: gl.info.render.calls,
      fps,
      loadedChunkCount,
      meshCount: meshCountRef.current,
      playerPosition
    };

    onStats((previousStats) => (
      previousStats.drawCalls === nextStats.drawCalls &&
      previousStats.fps === nextStats.fps &&
      previousStats.meshCount === nextStats.meshCount
        ? previousStats
        : nextStats
    ));

    elapsedRef.current = 0;
    framesRef.current = 0;
  });

  return null;
}

function countSceneMeshes(scene) {
  let count = 0;

  scene.traverse((object) => {
    if (object.isMesh || object.isInstancedMesh) {
      count += 1;
    }
  });

  return count;
}
