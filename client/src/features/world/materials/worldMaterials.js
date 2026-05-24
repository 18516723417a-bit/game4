import * as THREE from 'three';

const weatherColorObject = new THREE.Color();
const weatherMixColorObject = new THREE.Color();
export const BUILDING_COLOR_GROUPS = [
  { key: 'brick', color: '#c28f69' },
  { key: 'blue', color: '#7898a8' },
  { key: 'olive', color: '#a3aa78' },
  { key: 'gold', color: '#d1bb78' },
  { key: 'violet', color: '#9b89b0' },
  { key: 'slate', color: '#6f8490' },
  { key: 'concrete', color: '#aeb8b8' },
  { key: 'limestone', color: '#cfd4ca' },
  { key: 'glass', color: '#5f7580' }
];

export function getWeatherWorldMaterials(weatherMode) {
  if (weatherMode === 'snow') {
    return {
      buildingMetalness: 0.02,
      buildingRoughness: 0.78,
      curb: { color: '#d3dcda', roughness: 0.62 },
      ground: { color: '#dfe8e7', metalness: 0, roughness: 0.64 },
      highway: { color: '#4d555a' },
      island: { color: '#d9e5de', roughness: 0.68 },
      localRoad: { color: '#606a6f', roughness: 0.54 },
      mainRoad: { color: '#535c61' },
      markings: { color: '#fbfbf2', roughness: 0.44 },
      medianBarrier: { color: '#e6ece8', roughness: 0.58 },
      parking: { color: '#737b80', roughness: 0.5 },
      roadCrack: { color: '#252b2e', opacity: 0.16 },
      roadDirt: { color: '#6f7777', opacity: 0.14 },
      roadMetalness: 0.02,
      roadRoughness: 0.5,
      roadWear: { color: '#384046', opacity: 0.16 },
      roofCap: { color: '#eef4f2', metalness: 0, roughness: 0.56 },
      roofUnit: { color: '#cbd8d8', metalness: 0.02, roughness: 0.62 },
      roundabout: { color: '#596166' },
      roundaboutIsland: { color: '#e4ece8', roughness: 0.6 },
      sidewalk: { color: '#c9d3cf', roughness: 0.7 },
      sidewalkRail: { color: '#f4f6ef', roughness: 0.48 },
      tree: { color: '#d6e1db' },
      treeAccent: { color: '#edf4ef' },
      water: { color: '#8fb1be', metalness: 0, roughness: 0.36 }
    };
  }

  if (weatherMode === 'rain' || weatherMode === 'storm') {
    const storm = weatherMode === 'storm';

    return {
      buildingMetalness: 0.08,
      buildingRoughness: storm ? 0.42 : 0.48,
      curb: { color: '#7f8887', roughness: 0.36 },
      ground: { color: storm ? '#334238' : '#3d5144', metalness: 0.02, roughness: 0.58 },
      highway: { color: storm ? '#11161a' : '#182026' },
      island: { color: storm ? '#40523e' : '#4d6148', roughness: 0.5 },
      localRoad: { color: storm ? '#1b2428' : '#222c31', roughness: 0.34 },
      mainRoad: { color: storm ? '#141b1f' : '#1d252a' },
      markings: { color: '#f1e7c8', roughness: 0.22 },
      medianBarrier: { color: storm ? '#687070' : '#87908c', roughness: storm ? 0.34 : 0.42 },
      parking: { color: storm ? '#2b3236' : '#333b3f', roughness: 0.32 },
      roadCrack: { color: '#05080a', opacity: storm ? 0.3 : 0.26 },
      roadDirt: { color: '#10161a', opacity: storm ? 0.22 : 0.18 },
      roadMetalness: storm ? 0.14 : 0.08,
      roadRoughness: storm ? 0.26 : 0.32,
      roadWear: { color: '#070b0e', opacity: storm ? 0.34 : 0.3 },
      roofCap: { color: storm ? '#3e494f' : '#4c575d', metalness: 0.08, roughness: 0.34 },
      roofUnit: { color: storm ? '#242e34' : '#2f3a40', metalness: 0.12, roughness: 0.32 },
      roundabout: { color: storm ? '#181e22' : '#20272b' },
      roundaboutIsland: { color: storm ? '#3a4c3a' : '#485d44', roughness: 0.52 },
      sidewalk: { color: storm ? '#495052' : '#596361', roughness: storm ? 0.34 : 0.42 },
      sidewalkRail: { color: storm ? '#d7ded8' : '#e9eee7', roughness: storm ? 0.28 : 0.36 },
      tree: { color: storm ? '#234332' : '#28543a' },
      treeAccent: { color: storm ? '#2d543a' : '#326543' },
      water: { color: storm ? '#244f61' : '#2a657c', metalness: 0.04, roughness: 0.18 }
    };
  }

  return {
    buildingMetalness: 0.06,
    buildingRoughness: 0.56,
    curb: { color: '#a7aca4', roughness: 0.78 },
    ground: { color: '#62765b', metalness: 0, roughness: 0.86 },
    highway: { color: '#20282d' },
    island: { color: '#667d55', roughness: 0.86 },
    localRoad: { color: '#363f44', roughness: 0.8 },
    mainRoad: { color: '#2b3439' },
    markings: { color: '#f1e8c8', roughness: 0.54 },
    medianBarrier: { color: '#c4cbc4', roughness: 0.76 },
    parking: { color: '#464f53', roughness: 0.86 },
    roadCrack: { color: '#080b0d', opacity: 0.3 },
    roadDirt: { color: '#161b1e', opacity: 0.2 },
    roadMetalness: 0.015,
    roadRoughness: 0.72,
    roadWear: { color: '#090d10', opacity: 0.28 },
    roofCap: { color: '#687279', metalness: 0.05, roughness: 0.58 },
    roofUnit: { color: '#3d4850', metalness: 0.1, roughness: 0.5 },
    roundabout: { color: '#2c3136' },
    roundaboutIsland: { color: '#536b4e', roughness: 0.92 },
    sidewalk: { color: '#777b72', roughness: 0.86 },
    sidewalkRail: { color: '#ecefe6', roughness: 0.62 },
    tree: { color: '#2f6b45' },
    treeAccent: { color: '#3b7a4d' },
    water: { color: '#2f718c', metalness: 0, roughness: 0.42 }
  };
}

export function getWeatherBuildingColor(baseColor, weatherMode, isFar) {
  weatherColorObject.set(baseColor);

  if (weatherMode === 'snow') {
    weatherMixColorObject.set(isFar ? '#d5dcdd' : '#edf2f1');
    return `#${weatherColorObject.lerp(weatherMixColorObject, isFar ? 0.36 : 0.5).getHexString()}`;
  }

  if (weatherMode === 'rain' || weatherMode === 'storm') {
    weatherMixColorObject.set(weatherMode === 'storm' ? '#273139' : '#374149');
    return `#${weatherColorObject.lerp(weatherMixColorObject, isFar ? 0.3 : 0.22).getHexString()}`;
  }

  return baseColor;
}
