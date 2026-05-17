import { CylinderInstances, PlaneInstances } from '../rendering/instanceRenderers.jsx';

export function TerrainLayers({ batches, worldMaterials }) {
  return (
    <>
      <PlaneInstances
        name="GroundInstances"
        color={worldMaterials.ground.color}
        instances={batches.ground}
        metalness={worldMaterials.ground.metalness}
        roughness={worldMaterials.ground.roughness}
        receiveShadow
      />
      <PlaneInstances
        name="WaterInstances"
        color={worldMaterials.water.color}
        instances={batches.waterAreas}
        metalness={worldMaterials.water.metalness}
        roughness={worldMaterials.water.roughness}
        receiveShadow
      />
      <CylinderInstances
        name="IslandGroundInstances"
        color={worldMaterials.island.color}
        instances={batches.islandGrounds}
        radialSegments={28}
        receiveShadow
        roughness={worldMaterials.island.roughness}
      />
    </>
  );
}
