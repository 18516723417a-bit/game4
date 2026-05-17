import { ChunkBatchRenderer } from './ChunkRenderer.jsx';
import { getChunkKey } from './worldConfig.js';

export function CityWorld({ chunkSnapshot, nightMode = false, playerPosition, weatherMode = 'clear' }) {
  const currentKey = chunkSnapshot.currentChunk
    ? getChunkKey(chunkSnapshot.currentChunk.chunkX, chunkSnapshot.currentChunk.chunkZ)
    : null;

  return (
    <ChunkBatchRenderer
      chunks={chunkSnapshot.loadedChunks}
      currentKey={currentKey}
      nightMode={nightMode}
      playerPosition={playerPosition}
      weatherMode={weatherMode}
    />
  );
}
