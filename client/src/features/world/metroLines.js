export const METRO_TRANSFER_POINTS = {
  airport: { x: -5825, z: 5210 },
  west: { x: -1480, z: 940 },
  central: { x: 120, z: 620 },
  trainStation: { x: 5520, z: -5060 }
};

const { airport, west, central, trainStation } = METRO_TRANSFER_POINTS;

const RED_NORTH_TERMINAL = { x: -5140, z: -6316 };
const RED_NORTHWEST_STATION = { x: -4903, z: -1933 };
const RED_WEST_STATION = { x: -1462, z: 54 };
const RED_CENTRAL_STATION = { x: 108, z: 97 };
const RED_SOUTH_HARBOR_STATION = { x: 387, z: 3055 };
const RED_SOUTHEAST_STATION = { x: 6366, z: 6402 };
const BLUE_WEST_STATION = { x: -6086, z: 76 };
const BLUE_INDUSTRIAL_STATION = { x: -3570, z: 1371 };
const BLUE_CENTRAL_STATION = { x: 151, z: 1371 };
const BLUE_EAST_RIDGE_STATION = { x: 3806, z: 1306 };
const BLUE_EAST_TERMINAL = { x: 7441, z: 1457 };
const GREEN_AIRPORT_TURNBACK = { x: -5780, z: 5000 };
const GREEN_AIRPORT_STATION = { x: -5780, z: 5120 };
const GREEN_WEST_STATION = { x: -3355, z: -723 };
const GREEN_CENTRAL_STATION = { x: -495, z: -2623 };
const GREEN_EAST_RIDGE_STATION = { x: 3054, z: -1846 };
const GREEN_TRAIN_STATION = { x: 5527, z: -5063 };
const PURPLE_AIRPORT_TURNBACK = { x: -6160, z: 4970 };
const PURPLE_AIRPORT_STATION = { x: -6025, z: 5035 };
const PURPLE_TRAIN_STATION = { x: 4344, z: -4869 };

export const METRO_LINE_DEFINITIONS = [
  {
    id: 'red',
    color: '#e9495d',
    elevation: 'standard',
    name: 'RED LINE',
    samplesPerSegment: 10,
    controlPoints: [
      RED_NORTH_TERMINAL,
      { x: -5097, z: -4178 },
      RED_NORTHWEST_STATION,
      { x: -4495, z: -378 },
      { x: -3226, z: -119 },
      RED_WEST_STATION,
      RED_CENTRAL_STATION,
      { x: 387, z: 2192 },
      RED_SOUTH_HARBOR_STATION,
      { x: 1226, z: 3358 },
      { x: 4022, z: 3358 },
      { x: 6215, z: 3401 },
      { x: 6473, z: 4632 },
      RED_SOUTHEAST_STATION,
      { x: 4946, z: 6532 }
    ],
    stations: [
      { id: 'red-northwest', label: 'Metro', name: 'NW\nMETRO', point: RED_NORTHWEST_STATION },
      { id: 'red-west-transfer', label: 'Metro', name: 'WEST\nTRANSFER', point: RED_WEST_STATION, mapOffset: { x: -120, z: 110 } },
      { id: 'red-central-transfer', label: 'Metro', name: 'CENTRAL\nTRANSFER', point: RED_CENTRAL_STATION, mapOffset: { x: 0, z: -185 } },
      { id: 'red-south-harbor', label: 'Metro', name: 'SOUTH\nHARBOR', point: RED_SOUTH_HARBOR_STATION },
      { id: 'red-southeast', label: 'Metro', name: 'SE\nMETRO', point: RED_SOUTHEAST_STATION }
    ]
  },
  {
    id: 'blue',
    color: '#208df2',
    elevation: 'high',
    name: 'BLUE LINE',
    samplesPerSegment: 10,
    controlPoints: [
      { x: -7484, z: 76 },
      BLUE_WEST_STATION,
      { x: -4989, z: 874 },
      BLUE_INDUSTRIAL_STATION,
      BLUE_CENTRAL_STATION,
      BLUE_EAST_RIDGE_STATION,
      { x: 5699, z: 443 },
      { x: 7312, z: 97 },
      BLUE_EAST_TERMINAL
    ],
    stations: [
      { id: 'blue-west-terminal', label: 'Metro', name: 'WEST\nMETRO', point: BLUE_WEST_STATION },
      { id: 'blue-industrial', label: 'Metro', name: 'INDUSTRIAL\nMETRO', point: BLUE_INDUSTRIAL_STATION },
      { id: 'blue-central-transfer', label: 'Metro', name: 'CENTRAL\nTRANSFER', point: BLUE_CENTRAL_STATION, mapOffset: { x: -135, z: 105 } },
      { id: 'blue-east-ridge', label: 'Metro', name: 'EAST\nRIDGE', point: BLUE_EAST_RIDGE_STATION },
      { id: 'blue-east-terminal', label: 'Metro', name: 'EAST\nMETRO', point: BLUE_EAST_TERMINAL }
    ]
  },
  {
    id: 'green',
    color: '#2fd66f',
    elevation: 'green',
    name: 'GREEN LINE',
    samplesPerSegment: 10,
    controlPoints: [
      GREEN_AIRPORT_TURNBACK,
      GREEN_AIRPORT_STATION,
      { x: -6151, z: 2084 },
      { x: -5914, z: 572 },
      { x: -4903, z: -399 },
      GREEN_WEST_STATION,
      { x: -1634, z: -939 },
      { x: -559, z: -1695 },
      GREEN_CENTRAL_STATION,
      { x: 366, z: -2710 },
      { x: 1656, z: -2278 },
      GREEN_EAST_RIDGE_STATION,
      { x: 4086, z: -1911 },
      { x: 4753, z: -2494 },
      { x: 4774, z: -3703 },
      { x: 5161, z: -4588 },
      GREEN_TRAIN_STATION
    ],
    stations: [
      { id: 'green-airport-transfer', label: 'Metro', name: 'AIRPORT\nTERMINAL', point: GREEN_AIRPORT_STATION, mapOffset: { x: -95, z: -105 } },
      { id: 'green-west-transfer', label: 'Metro', name: 'WEST\nTRANSFER', point: GREEN_WEST_STATION, mapOffset: { x: 120, z: -110 } },
      { id: 'green-central-transfer', label: 'Metro', name: 'CENTRAL\nTRANSFER', point: GREEN_CENTRAL_STATION, mapOffset: { x: 140, z: 120 } },
      { id: 'green-east-ridge', label: 'Metro', name: 'EAST\nRIDGE', point: GREEN_EAST_RIDGE_STATION },
      { id: 'green-station-transfer', label: 'Metro', name: 'STATION\nTRANSFER', point: GREEN_TRAIN_STATION, mapOffset: { x: -120, z: 120 } }
    ]
  },
  {
    id: 'purple',
    color: '#9b59ff',
    elevation: 'express',
    name: 'PURPLE LINK',
    serviceOffsets: [0, 0.5],
    samplesPerSegment: 10,
    speedMultiplier: 1.8,
    controlPoints: [
      PURPLE_AIRPORT_TURNBACK,
      PURPLE_AIRPORT_STATION,
      { x: -5226, z: 3120 },
      { x: -2796, z: 961 },
      { x: -65, z: -1414 },
      { x: 2624, z: -3703 },
      PURPLE_TRAIN_STATION
    ],
    stations: [
      { id: 'purple-airport-terminal', label: 'Metro', name: 'AIRPORT\nLINK', point: PURPLE_AIRPORT_STATION, mapOffset: { x: 120, z: 90 } },
      { id: 'purple-train-station', label: 'Metro', name: 'STATION\nLINK', point: PURPLE_TRAIN_STATION, mapOffset: { x: 130, z: -110 } }
    ]
  }
];
