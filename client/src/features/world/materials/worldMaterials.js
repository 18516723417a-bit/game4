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
      highway: { color: '#535b60' },
      island: { color: '#d9e5de', roughness: 0.68 },
      localRoad: { color: '#677075', roughness: 0.48 },
      mainRoad: { color: '#596166' },
      markings: { color: '#f7f8f1', roughness: 0.46 },
      medianBarrier: { color: '#e6ece8', roughness: 0.58 },
      parking: { color: '#737b80', roughness: 0.5 },
      roadMetalness: 0.02,
      roadRoughness: 0.42,
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
      highway: { color: storm ? '#151a1e' : '#1b2227' },
      island: { color: storm ? '#40523e' : '#4d6148', roughness: 0.5 },
      localRoad: { color: storm ? '#20282c' : '#252f33', roughness: 0.3 },
      mainRoad: { color: storm ? '#181e22' : '#20272b' },
      markings: { color: '#e9e0c4', roughness: 0.24 },
      medianBarrier: { color: storm ? '#687070' : '#87908c', roughness: storm ? 0.34 : 0.42 },
      parking: { color: storm ? '#2b3236' : '#333b3f', roughness: 0.32 },
      roadMetalness: storm ? 0.16 : 0.1,
      roadRoughness: storm ? 0.2 : 0.26,
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
    buildingMetalness: 0.05,
    buildingRoughness: 0.6,
    curb: { color: '#9fa39c', roughness: 0.82 },
    ground: { color: '#596b55', metalness: 0, roughness: 0.9 },
    highway: { color: '#262b30' },
    island: { color: '#5f7650', roughness: 0.9 },
    localRoad: { color: '#384044', roughness: 0.92 },
    mainRoad: { color: '#2f3438' },
    markings: { color: '#d9d3bf', roughness: 0.7 },
    medianBarrier: { color: '#c4cbc4', roughness: 0.76 },
    parking: { color: '#454b4f', roughness: 0.94 },
    roadMetalness: 0,
    roadRoughness: 0.88,
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
