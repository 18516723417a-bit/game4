import { ConeInstances, CylinderInstances } from '../rendering/instanceRenderers.jsx';

export function VegetationLayers({ batches, worldMaterials }) {
  return (
    <>
      <CylinderInstances
        name="TreeTrunkNearInstances"
        color="#6d4c31"
        instances={batches.treeTrunksNear}
        radialSegments={6}
        receiveShadow
        castShadow
        roughness={0.9}
      />
      <ConeInstances
        name="TreeCanopyNearInstances"
        color={worldMaterials.tree.color}
        instances={batches.treeCanopiesNear}
        radialSegments={7}
        receiveShadow
        castShadow
        roughness={0.86}
      />
      <ConeInstances
        name="TreeCanopyAccentNearInstances"
        color={worldMaterials.treeAccent.color}
        instances={batches.treeCanopyAccentsNear}
        radialSegments={7}
        receiveShadow
        castShadow
        roughness={0.84}
      />
      <ConeInstances
        name="TreeLowInstances"
        color={worldMaterials.tree.color}
        instances={batches.treesFar}
        radialSegments={5}
        receiveShadow
        roughness={0.94}
      />
    </>
  );
}
