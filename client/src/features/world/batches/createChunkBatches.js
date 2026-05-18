import { BUILDING_COLOR_GROUPS } from '../materials/worldMaterials.js';
import { clamp, clampInt, localOffsetToWorld } from '../utils/math.js';

export function createChunkBatches(chunks, currentKey) {
  const batches = {
    activeBoundaries: [],
    boundaries: [],
    billboardPanels: [],
    billboardPoles: [],
    buildingRoofCaps: [],
    buildingRoofUnits: [],
    buildingWindowBands: [],
    buildingsFarByColor: createBuildingColorBuckets(),
    buildingsNearByColor: createBuildingColorBuckets(),
    crosswalkMarks: [],
    ground: [],
    guardrails: [],
    highways: [],
    islandGrounds: [],
    laneMarks: [],
    laneMarksYellow: [],
    lightArmsNear: [],
    lightLampsNear: [],
    lightPolesNear: [],
    lightsFar: [],
    localRoads: [],
    mainRoads: [],
    medianBarriers: [],
    parkingLots: [],
    parkingMarks: [],
    rampRoads: [],
    roadCurbs: [],
    roadSignLabels: [],
    roadSigns: [],
    roundaboutIslands: [],
    roundabouts: [],
    sidewalkRails: [],
    sidewalks: [],
    stopBars: [],
    treeCanopyAccentsNear: [],
    treeCanopiesNear: [],
    treeTrunksNear: [],
    trafficObstacles: [],
    trafficSignalArms: [],
    trafficSignalHeads: [],
    trafficSignalLamps: [],
    trafficSignalPoles: [],
    trafficVehicles: [],
    treesFar: [],
    tunnelFrames: [],
    tunnelLightGlows: [],
    tunnelLights: [],
    tunnelWallPanels: [],
    waterAreas: []
  };

  for (const chunk of chunks) {
    const isNear = chunk.key === currentKey;
    const { bounds } = chunk;

    if (chunk.terrainType === 'ocean' || chunk.terrainType === 'island') {
      for (const waterArea of chunk.waterAreas ?? []) {
        batches.waterAreas.push({
          position: waterArea.position,
          rotation: [-Math.PI / 2, 0, 0],
          scale: [waterArea.scale[0], waterArea.scale[1], 1]
        });
      }
    } else {
      addGroundInstances(batches, bounds, chunk.groundCutouts ?? []);
    }

    for (const island of chunk.islands ?? []) {
      batches.islandGrounds.push({
        position: island.position,
        scale: [island.radius, island.height, island.radius]
      });
    }

    for (const road of chunk.roads) {
      if (road.roadType === 'ramp') {
        const roadScale = road.visualScale ?? road.scale;
        batches.rampRoads.push({
          basis: road.basis,
          position: road.position,
          rotation: road.rotation ?? [-Math.PI / 2, 0, 0],
          scale: [roadScale[0], roadScale[1], 0.08]
        });
        continue;
      }

      const target = getRoadBatch(batches, road.roadType);
      const roadScale = road.visualScale ?? road.scale;
      target.push({
        position: road.position,
        rotation: road.rotation ?? [-Math.PI / 2, 0, 0],
        scale: [roadScale[0], roadScale[1], 1]
      });
    }

    for (const roundabout of chunk.roundabouts ?? []) {
      batches.roundabouts.push({
        position: roundabout.position,
        scale: [roundabout.radius, 0.04, roundabout.radius]
      });
      batches.roundaboutIslands.push({
        position: [roundabout.position[0], 0.08, roundabout.position[2]],
        scale: [roundabout.islandRadius, 0.18, roundabout.islandRadius]
      });
    }

    for (const mark of chunk.laneMarks) {
      if (!isNear && !isExpresswayLaneMark(mark)) continue;

      const targetLaneMarkBatch = mark.color === 'yellow'
        ? batches.laneMarksYellow
        : batches.laneMarks;

      targetLaneMarkBatch.push({
        position: mark.position,
        rotation: mark.rotation,
        scale: mark.scale
      });
    }

    if (isNear) {
      for (const mark of chunk.parkingMarks ?? []) {
        batches.parkingMarks.push({
          position: mark.position,
          scale: mark.scale
        });
      }

      for (const curb of chunk.roadDetails?.curbs ?? []) {
        batches.roadCurbs.push({
          position: curb.position,
          rotation: curb.rotation,
          scale: curb.scale
        });
      }

      for (const sidewalk of chunk.roadDetails?.sidewalks ?? []) {
        batches.sidewalks.push({
          position: sidewalk.position,
          rotation: sidewalk.rotation,
          scale: sidewalk.scale
        });
      }

      for (const rail of chunk.roadDetails?.sidewalkRails ?? []) {
        batches.sidewalkRails.push({
          position: rail.position,
          rotation: rail.rotation,
          scale: rail.scale
        });
      }

      for (const median of chunk.roadDetails?.medianBarriers ?? []) {
        batches.medianBarriers.push({
          position: median.position,
          rotation: median.rotation,
          scale: median.scale
        });
      }

      for (const crosswalk of chunk.roadDetails?.crosswalks ?? []) {
        batches.crosswalkMarks.push({
          position: crosswalk.position,
          rotation: crosswalk.rotation,
          scale: crosswalk.scale
        });
      }

      for (const stopBar of chunk.roadDetails?.stopBars ?? []) {
        batches.stopBars.push({
          position: stopBar.position,
          rotation: stopBar.rotation,
          scale: stopBar.scale
        });
      }

      for (const signal of chunk.roadDetails?.trafficSignals ?? []) {
        addTrafficSignalInstances(batches, signal);
      }
    }

    for (const building of chunk.buildings) {
      const colorKey = getBuildingColorKey(building.color);
      const target = isNear
        ? batches.buildingsNearByColor[colorKey]
        : batches.buildingsFarByColor[colorKey];

      target.push({
        position: building.position,
        scale: building.scale
      });

      if (isNear) {
        addBuildingDetails(batches, building);
      }
    }

    for (const tree of chunk.trees) {
      if (isNear) {
        batches.treeTrunksNear.push({
          position: [tree.position[0], tree.trunkHeight / 2, tree.position[2]],
          scale: [0.5, tree.trunkHeight, 0.5]
        });
        batches.treeCanopiesNear.push({
          position: [
            tree.position[0],
            tree.trunkHeight + tree.canopyHeight / 2 - 0.5,
            tree.position[2]
          ],
          scale: [tree.canopyRadius, tree.canopyHeight, tree.canopyRadius]
        });
        batches.treeCanopyAccentsNear.push({
          position: [
            tree.position[0],
            tree.trunkHeight + tree.canopyHeight * 0.42,
            tree.position[2]
          ],
          scale: [tree.canopyRadius * 1.12, tree.canopyHeight * 0.58, tree.canopyRadius * 1.12]
        });
      } else {
        const height = tree.trunkHeight + tree.canopyHeight - 0.6;
        batches.treesFar.push({
          position: [tree.position[0], height / 2, tree.position[2]],
          scale: [tree.canopyRadius * 0.82, height, tree.canopyRadius * 0.82]
        });
      }
    }

    for (const streetLight of chunk.streetLights) {
      if (isNear) {
        addHighDetailLight(batches, streetLight);
      } else {
        batches.lightsFar.push({
          position: [streetLight.position[0], 2.55, streetLight.position[2]],
          rotation: [0, streetLight.rotationY, 0],
          scale: [0.22, 5.1, 0.22]
        });
      }
    }

    for (const billboard of chunk.billboards ?? []) {
      addBillboardInstances(batches, billboard, isNear);
    }

    for (const guardrail of chunk.guardrails ?? []) {
      batches.guardrails.push({
        position: guardrail.position,
        rotation: guardrail.rotation,
        scale: guardrail.scale
      });
    }

    for (const tunnelEntrance of chunk.tunnelEntrances ?? []) {
      addTunnelInstances(batches, tunnelEntrance, isNear);
    }

    for (const sign of chunk.roadSigns ?? []) {
      batches.roadSigns.push({
        color: sign.color,
        position: sign.position,
        rotation: sign.rotation,
        scale: sign.scale
      });
      batches.roadSignLabels.push({
        id: sign.id,
        text: sign.text ?? 'EXPRESSWAY',
        position: localOffsetToWorld(sign.position, sign.rotation?.[1] ?? 0, 0, sign.position?.[1] ?? 0, 0.19),
        rotation: sign.rotation,
        width: sign.scale[0] * 0.88,
        height: sign.scale[1] * 0.66
      });
    }

    for (const obstacle of chunk.trafficObstacles ?? []) {
      const obstacleInstance = {
        basis: obstacle.basis,
        color: obstacle.color,
        position: obstacle.position,
        rotation: obstacle.rotation,
        scale: obstacle.scale
      };

      if (obstacle.type === 'transportUnderpassLight') {
        batches.tunnelLights.push(obstacleInstance);
        continue;
      }

      if (obstacle.type === 'transportUnderpassLightGlow') {
        batches.tunnelLightGlows.push(obstacleInstance);
        continue;
      }

      if (isTunnelWallPanelObstacle(obstacle)) {
        batches.tunnelWallPanels.push(obstacleInstance);
        continue;
      }

      batches.trafficObstacles.push(obstacleInstance);
    }

    for (const vehicle of chunk.trafficVehicles ?? []) {
      batches.trafficVehicles.push(vehicle);
    }

  }

  return batches;
}

function addGroundInstances(batches, bounds, cutouts = []) {
  const groundRects = splitGroundByCutouts(bounds, cutouts);

  for (const rect of groundRects) {
    const width = rect.maxX - rect.minX;
    const depth = rect.maxZ - rect.minZ;

    if (width <= 0.5 || depth <= 0.5) continue;

    batches.ground.push({
      position: [(rect.minX + rect.maxX) / 2, 0, (rect.minZ + rect.maxZ) / 2],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [width, depth, 1]
    });
  }
}

function splitGroundByCutouts(bounds, cutouts = []) {
  let rects = [{
    minX: bounds.minX,
    maxX: bounds.maxX,
    minZ: bounds.minZ,
    maxZ: bounds.maxZ
  }];

  for (const cutout of cutouts) {
    const clipped = {
      minX: clamp(cutout.minX ?? bounds.minX, bounds.minX, bounds.maxX),
      maxX: clamp(cutout.maxX ?? bounds.maxX, bounds.minX, bounds.maxX),
      minZ: clamp(cutout.minZ ?? bounds.minZ, bounds.minZ, bounds.maxZ),
      maxZ: clamp(cutout.maxZ ?? bounds.maxZ, bounds.minZ, bounds.maxZ)
    };

    if (clipped.maxX - clipped.minX <= 0.5 || clipped.maxZ - clipped.minZ <= 0.5) continue;

    const nextRects = [];

    for (const rect of rects) {
      if (!doRectanglesOverlap(rect, clipped)) {
        nextRects.push(rect);
        continue;
      }

      const overlapMinX = Math.max(rect.minX, clipped.minX);
      const overlapMaxX = Math.min(rect.maxX, clipped.maxX);
      const overlapMinZ = Math.max(rect.minZ, clipped.minZ);
      const overlapMaxZ = Math.min(rect.maxZ, clipped.maxZ);

      pushGroundRect(nextRects, rect.minX, overlapMinX, rect.minZ, rect.maxZ);
      pushGroundRect(nextRects, overlapMaxX, rect.maxX, rect.minZ, rect.maxZ);
      pushGroundRect(nextRects, overlapMinX, overlapMaxX, rect.minZ, overlapMinZ);
      pushGroundRect(nextRects, overlapMinX, overlapMaxX, overlapMaxZ, rect.maxZ);
    }

    rects = nextRects;
  }

  return rects;
}

function doRectanglesOverlap(a, b) {
  return a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ;
}

function pushGroundRect(rects, minX, maxX, minZ, maxZ) {
  if (maxX - minX <= 0.5 || maxZ - minZ <= 0.5) return;

  rects.push({ minX, maxX, minZ, maxZ });
}

function addTrafficSignalInstances(batches, signal) {
  batches.trafficSignalPoles.push({
    position: signal.polePosition,
    scale: [0.12, 4.7, 0.12]
  });
  batches.trafficSignalArms.push({
    position: signal.armPosition,
    rotation: [0, signal.armRotationY, 0],
    scale: [signal.armLength, 0.14, 0.14]
  });
  batches.trafficSignalHeads.push({
    position: signal.headPosition,
    rotation: [0, signal.rotationY, 0],
    scale: [0.72, 1.38, 0.28]
  });

  const lampSpecs = [
    ['red', '#f0503f', 0.42],
    ['yellow', '#f2d486', 0],
    ['green', '#63d486', -0.42]
  ];

  for (const [type, color, offsetY] of lampSpecs) {
    batches.trafficSignalLamps.push({
      axis: signal.axis,
      color,
      lampType: type,
      position: localOffsetToWorld(signal.headPosition, signal.rotationY, 0, signal.headPosition[1] + offsetY, -0.16),
      rotation: [0, signal.rotationY, 0],
      scale: [0.3, 0.22, 0.045]
    });
  }
}

function isExpresswayLaneMark(mark) {
  return mark?.roadType === 'highway' || mark?.roadType === 'elevatedHighway' || mark?.roadType === 'ramp';
}

function isTunnelWallPanelObstacle(obstacle) {
  return obstacle.type === 'transportUnderpassCeiling' ||
    obstacle.type === 'transportUnderpassOverheadDeck' ||
    obstacle.type === 'transportUnderpassRetainingWall' ||
    obstacle.type === 'transportUnderpassRib' ||
    obstacle.type === 'transportUnderpassTrenchFloor' ||
    obstacle.type === 'transportUnderpassWall' ||
    obstacle.type === 'transportUnderpassWallTile';
}

function getRoadBatch(batches, roadType) {
  if (roadType === 'highway' || roadType === 'elevatedHighway' || roadType === 'ramp') return batches.highways;
  if (roadType === 'local' || roadType === 'groundRoad') return batches.localRoads;
  if (roadType === 'parking') return batches.parkingLots;
  return batches.mainRoads;
}

function createBuildingColorBuckets() {
  return BUILDING_COLOR_GROUPS.reduce((buckets, group) => {
    buckets[group.key] = [];
    return buckets;
  }, {});
}

function getBuildingColorKey(color) {
  const match = BUILDING_COLOR_GROUPS.find((group) => group.color === color);
  return match?.key ?? 'blue';
}

function addBuildingDetails(batches, building) {
  const [x, y, z] = building.position;
  const [width, height, depth] = building.scale;
  const baseY = y - height / 2;
  const topY = y + height / 2;
  const isWarehouse = building.kind === 'warehouse';
  const isOldBlock = building.kind === 'oldBlock';
  const isHighRise = building.kind === 'highRise' ||
    building.kind === 'showcaseTower' ||
    building.kind === 'economicTower' ||
    building.kind === 'apartmentTower' ||
    building.kind === 'oldMidRise' ||
    (!isWarehouse && !isOldBlock && height >= 42);

  batches.buildingRoofCaps.push({
    position: [x, topY + 0.09, z],
    scale: [width + 0.8, 0.18, depth + 0.8]
  });

  if (isWarehouse) {
    batches.buildingWindowBands.push({
      position: [x, baseY + height * 0.42, z + depth / 2 + 0.05],
      scale: [Math.max(5, width * 0.7), Math.max(1.6, height * 0.16), 0.08]
    });
    batches.buildingWindowBands.push({
      position: [x, baseY + height * 0.42, z - depth / 2 - 0.05],
      scale: [Math.max(5, width * 0.7), Math.max(1.6, height * 0.16), 0.08]
    });
    batches.buildingRoofUnits.push({
      position: [x, topY + 0.5, z],
      scale: [Math.max(5, width * 0.42), 1, Math.max(3.4, depth * 0.22)]
    });
    return;
  }

  if (isHighRise) {
    const facadeHeight = Math.max(16, height * 0.7);
    const facadeY = baseY + Math.max(7, height * 0.14) + facadeHeight / 2;
    const frontStripCount = clampInt(Math.floor(width / 8), 2, 5);
    const sideStripCount = clampInt(Math.floor(depth / 8), 2, 5);

    addFacadeWindowStrips(
      batches,
      x,
      z + depth / 2 + 0.055,
      facadeY,
      width,
      facadeHeight,
      frontStripCount,
      'front'
    );
    addFacadeWindowStrips(
      batches,
      x,
      z - depth / 2 - 0.055,
      facadeY,
      width,
      facadeHeight,
      frontStripCount,
      'back'
    );
    addFacadeWindowStrips(
      batches,
      x + width / 2 + 0.055,
      z,
      facadeY,
      depth,
      facadeHeight,
      sideStripCount,
      'right'
    );
    addFacadeWindowStrips(
      batches,
      x - width / 2 - 0.055,
      z,
      facadeY,
      depth,
      facadeHeight,
      sideStripCount,
      'left'
    );
    batches.buildingRoofUnits.push({
      position: [x + width * 0.18, topY + 1.35, z - depth * 0.18],
      scale: [Math.max(4.2, width * 0.22), 2.7, Math.max(3.4, depth * 0.18)]
    });
    batches.buildingRoofUnits.push({
      position: [x - width * 0.18, topY + 0.78, z + depth * 0.2],
      scale: [Math.max(2.8, width * 0.14), 1.56, Math.max(2.8, depth * 0.14)]
    });
    return;
  }

  if (isOldBlock) {
    batches.buildingWindowBands.push({
      position: [x, baseY + height * 0.42, z + depth / 2 + 0.05],
      scale: [Math.max(3, width * 0.58), Math.max(1.2, height * 0.18), 0.08]
    });
    batches.buildingWindowBands.push({
      position: [x, baseY + height * 0.7, z + depth / 2 + 0.055],
      scale: [Math.max(2.6, width * 0.46), Math.max(1, height * 0.14), 0.08]
    });
    return;
  }

  batches.buildingWindowBands.push({
    position: [x, baseY + height * 0.56, z + depth / 2 + 0.05],
    scale: [Math.max(3, width * 0.64), Math.max(1.8, height * 0.22), 0.08]
  });
}

function addFacadeWindowStrips(batches, x, z, y, span, height, count, side) {
  const step = span / (count + 1);
  const stripWidth = clamp(span * 0.055, 0.9, 1.8);

  for (let index = 1; index <= count; index += 1) {
    const offset = -span / 2 + step * index;

    if (side === 'front' || side === 'back') {
      batches.buildingWindowBands.push({
        position: [x + offset, y, z],
        scale: [stripWidth, height, 0.08]
      });
      continue;
    }

    batches.buildingWindowBands.push({
      position: [x, y, z + offset],
      scale: [0.08, height, stripWidth]
    });
  }
}

function addHighDetailLight(batches, streetLight) {
  const rotation = [0, streetLight.rotationY, 0];

  batches.lightPolesNear.push({
    position: [
      streetLight.position[0],
      2.65,
      streetLight.position[2]
    ],
    rotation,
    scale: [0.18, 5.3, 0.18]
  });
  batches.lightArmsNear.push({
    position: localOffsetToWorld(streetLight.position, streetLight.rotationY, 0, 5.26, -0.68),
    rotation,
    scale: [0.28, 0.22, 1.42]
  });
  batches.lightLampsNear.push({
    position: localOffsetToWorld(streetLight.position, streetLight.rotationY, 0, 5.17, -1.35),
    rotation,
    scale: [0.42, 0.18, 0.34]
  });
}

function addBillboardInstances(batches, billboard, isNear) {
  const rotation = [0, billboard.rotationY, 0];
  const panelY = isNear ? 5.2 : 4.4;
  const panelScale = isNear
    ? [billboard.width, billboard.height, 0.28]
    : [billboard.width * 0.8, billboard.height * 0.72, 0.22];

  if (isNear) {
    batches.billboardPoles.push({
      position: [billboard.position[0], 2.4, billboard.position[2]],
      rotation,
      scale: [0.16, 4.8, 0.16]
    });
  }

  batches.billboardPanels.push({
    color: billboard.color,
    position: [billboard.position[0], panelY, billboard.position[2]],
    rotation,
    scale: panelScale
  });
}

function addTunnelInstances(batches, tunnelEntrance, isNear) {
  const rotation = [0, tunnelEntrance.rotationY, 0];
  const width = tunnelEntrance.width;
  const wallThickness = Math.max(3.6, width * 0.11);
  const pillarOffset = width / 2 - wallThickness / 2;
  const depth = tunnelEntrance.depth ?? (isNear ? 16 : 9.5);
  const height = tunnelEntrance.height ?? (isNear ? 13.5 : 9.5);
  const roofThickness = Math.max(2.6, height * 0.18);
  const retainingHeight = Math.max(3.8, height * 0.42);
  const baseY = tunnelEntrance.position?.[1] ?? 0;
  const offsetToWorld = (localX, localY, localZ) => {
    const position = localOffsetToWorld(tunnelEntrance.position, tunnelEntrance.rotationY, localX, localY, localZ);
    position[1] += baseY;
    return position;
  };

  batches.tunnelFrames.push(
    {
      position: offsetToWorld(-pillarOffset, height / 2, 0),
      rotation,
      scale: [wallThickness, height, depth]
    },
    {
      position: offsetToWorld(pillarOffset, height / 2, 0),
      rotation,
      scale: [wallThickness, height, depth]
    },
    {
      position: offsetToWorld(0, height - roofThickness / 2, 0),
      rotation,
      scale: [width + 3.8, roofThickness, depth]
    },
    {
      position: offsetToWorld(0, height + 0.38, -1.2),
      rotation,
      scale: [width + 7.4, 0.76, depth + 2.4]
    },
    {
      position: offsetToWorld(-width / 2 - 2.6, retainingHeight / 2, -13.5),
      rotation,
      scale: [1.4, retainingHeight, 24]
    },
    {
      position: offsetToWorld(width / 2 + 2.6, retainingHeight / 2, -13.5),
      rotation,
      scale: [1.4, retainingHeight, 24]
    },
    {
      position: offsetToWorld(-width / 2 - 3.8, retainingHeight / 2 - 0.2, 9.5),
      rotation,
      scale: [1.2, retainingHeight - 0.4, 22]
    },
    {
      position: offsetToWorld(width / 2 + 3.8, retainingHeight / 2 - 0.2, 9.5),
      rotation,
      scale: [1.2, retainingHeight - 0.4, 22]
    }
  );

  if (!isNear) return;

  const signPosition = offsetToWorld(0, height - roofThickness - 0.15, -depth / 2 - 0.18);
  const lightPosition = offsetToWorld(0, height - roofThickness - 0.72, -depth / 2 - 0.32);

  batches.roadSigns.push({
    color: '#203b49',
    position: signPosition,
    rotation,
    scale: [Math.min(width * 0.62, 16), 2.1, 0.28]
  });
  batches.roadSignLabels.push({
    id: `${tunnelEntrance.id}-portal-sign`,
    text: 'CITY TUNNEL\nHEIGHT 4.5M',
    position: localOffsetToWorld(signPosition, tunnelEntrance.rotationY, 0, signPosition[1], -0.19),
    rotation,
    width: Math.min(width * 0.55, 14),
    height: 1.42
  });

  batches.tunnelLights.push({
    position: lightPosition,
    rotation,
    scale: [Math.min(width * 0.52, 13), 0.16, 0.2]
  });
  batches.tunnelLightGlows.push({
    position: offsetToWorld(0, height - roofThickness - 1.02, -depth / 2 - 0.36),
    rotation,
    scale: [Math.min(width * 0.76, 20), 0.08, 3.4]
  });

  for (const side of [-1, 1]) {
    const barrierX = side * (width / 2 - 1.4);

    batches.trafficObstacles.push(
      {
        color: '#ffd21f',
        position: offsetToWorld(barrierX, 0.72, -depth / 2 - 2.1),
        rotation,
        scale: [0.78, 1.44, 1.2]
      },
      {
        color: '#151a1c',
        position: offsetToWorld(barrierX, 0.48, -depth / 2 - 2.1),
        rotation,
        scale: [0.86, 0.16, 1.28]
      },
      {
        color: '#151a1c',
        position: offsetToWorld(barrierX, 0.94, -depth / 2 - 2.1),
        rotation,
        scale: [0.86, 0.16, 1.28]
      },
      {
        color: '#f7f0c9',
        position: offsetToWorld(side * (width / 2 + 1.1), 1.35, -depth / 2 - 4.4),
        rotation,
        scale: [0.16, 0.34, 1.4]
      }
    );
  }
}
