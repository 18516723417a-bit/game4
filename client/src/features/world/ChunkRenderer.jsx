import { useMemo } from 'react';
import { createChunkBatches } from './batches/createChunkBatches.js';
import { getWeatherWorldMaterials } from './materials/worldMaterials.js';
import { BuildingLayers } from './renderers/BuildingLayers.jsx';
import { RoadLayers } from './renderers/RoadLayers.jsx';
import { RoadsideLayers } from './renderers/RoadsideLayers.jsx';
import { TerrainLayers } from './renderers/TerrainLayers.jsx';
import { VegetationLayers } from './renderers/VegetationLayers.jsx';

export function ChunkBatchRenderer({ chunks, currentKey, nightMode = false, playerPosition, weatherMode = 'clear' }) {
  const batches = useMemo(
    () => createChunkBatches(chunks, currentKey),
    [chunks, currentKey]
  );
  const worldMaterials = getWeatherWorldMaterials(weatherMode);

  return (
    <group name="streamed-city-chunks">
      <TerrainLayers batches={batches} worldMaterials={worldMaterials} />
      <RoadLayers batches={batches} worldMaterials={worldMaterials} />
      <BuildingLayers batches={batches} nightMode={nightMode} weatherMode={weatherMode} worldMaterials={worldMaterials} />
      <VegetationLayers batches={batches} worldMaterials={worldMaterials} />
      <RoadsideLayers batches={batches} playerPosition={playerPosition} />
    </group>
  );
}
