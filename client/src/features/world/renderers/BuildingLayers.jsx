import { BUILDING_COLOR_GROUPS, getWeatherBuildingColor } from '../materials/worldMaterials.js';
import { BoxInstances } from '../rendering/instanceRenderers.jsx';

export function BuildingLayers({ batches, nightMode = false, weatherMode, worldMaterials }) {
  const windowColor = nightMode ? '#ffe7a3' : '#c4e4ea';
  const windowEmissive = nightMode ? '#ffd36c' : '#6ca2b4';
  const windowEmissiveIntensity = nightMode ? 1.35 : 0.08;

  return (
    <>
      {BUILDING_COLOR_GROUPS.map((group) => (
        <BoxInstances
          key={`building-near-${group.key}`}
          name={`BuildingNearInstances:${group.key}`}
          color={getWeatherBuildingColor(group.color, weatherMode, false)}
          instances={batches.buildingsNearByColor[group.key]}
          materialType="standard"
          roughness={worldMaterials.buildingRoughness}
          metalness={worldMaterials.buildingMetalness}
        />
      ))}
      {BUILDING_COLOR_GROUPS.map((group) => (
        <BoxInstances
          key={`building-far-${group.key}`}
          name={`BuildingFarInstances:${group.key}`}
          color={getWeatherBuildingColor(group.color, weatherMode, true)}
          instances={batches.buildingsFarByColor[group.key]}
          materialType="basic"
          roughness={0.9}
          metalness={0}
        />
      ))}
      <BoxInstances
        name="BuildingWindowBandInstances"
        color={windowColor}
        emissive={windowEmissive}
        emissiveIntensity={windowEmissiveIntensity}
        instances={batches.buildingWindowBands}
        materialType="standard"
        roughness={0.32}
        metalness={0.04}
      />
      <BoxInstances
        name="BuildingRoofCapInstances"
        color={worldMaterials.roofCap.color}
        instances={batches.buildingRoofCaps}
        materialType="standard"
        receiveShadow
        roughness={worldMaterials.roofCap.roughness}
        metalness={worldMaterials.roofCap.metalness}
      />
      <BoxInstances
        name="BuildingRoofUnitInstances"
        color={worldMaterials.roofUnit.color}
        instances={batches.buildingRoofUnits}
        materialType="standard"
        receiveShadow
        castShadow
        roughness={worldMaterials.roofUnit.roughness}
        metalness={worldMaterials.roofUnit.metalness}
      />
    </>
  );
}
