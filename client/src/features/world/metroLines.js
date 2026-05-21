export const METRO_TRANSFER_POINTS = {
  airport: { x: -5520, z: 4740 },
  west: { x: -1480, z: 940 },
  central: { x: 120, z: 620 },
  trainStation: { x: 5520, z: -5060 }
};

const { airport, west, central, trainStation } = METRO_TRANSFER_POINTS;

export const METRO_LINE_DEFINITIONS = [
  {
    id: 'red',
    color: '#e9495d',
    elevation: 'standard',
    name: 'RED LINE',
    smooth: false,
    controlPoints: [
      { x: -3300, z: 3320 },
      { x: -3100, z: 2580 },
      { x: -2660, z: 1820 },
      west,
      { x: -760, z: 820 },
      central,
      { x: 240, z: -760 },
      { x: 250, z: -2080 },
      { x: 330, z: -3440 },
      { x: 650, z: -4700 },
      { x: 1560, z: -5420 },
      { x: 2850, z: -5750 },
      { x: 4220, z: -5900 }
    ],
    stations: [
      { id: 'red-northwest', label: 'Metro', name: 'NW\nMETRO', point: { x: -3100, z: 2580 } },
      { id: 'red-west-transfer', label: 'Metro', name: 'WEST\nTRANSFER', point: west, structureForwardOffset: -76, mapOffset: { x: -120, z: 110 } },
      { id: 'red-central-transfer', label: 'Metro', name: 'CENTRAL\nTRANSFER', point: central, structureForwardOffset: -100, mapOffset: { x: 0, z: -185 } },
      { id: 'red-south-harbor', label: 'Metro', name: 'SOUTH\nHARBOR', point: { x: 330, z: -3440 } },
      { id: 'red-southeast', label: 'Metro', name: 'SE\nMETRO', point: { x: 2850, z: -5750 } }
    ]
  },
  {
    id: 'blue',
    color: '#208df2',
    elevation: 'high',
    name: 'BLUE LINE',
    smooth: false,
    controlPoints: [
      { x: -7300, z: -1180 },
      { x: -5600, z: -980 },
      { x: -4200, z: -850 },
      { x: -2880, z: -620 },
      { x: -1680, z: -410 },
      { x: -640, z: -130 },
      central,
      { x: 1380, z: -40 },
      { x: 2860, z: -70 },
      { x: 4300, z: 80 },
      { x: 5900, z: 330 },
      { x: 7540, z: 470 },
      { x: 7820, z: -420 },
      { x: 7820, z: -1460 }
    ],
    stations: [
      { id: 'blue-west-terminal', label: 'Metro', name: 'WEST\nMETRO', point: { x: -5600, z: -980 } },
      { id: 'blue-industrial', label: 'Metro', name: 'INDUSTRIAL\nMETRO', point: { x: -2880, z: -620 } },
      { id: 'blue-central-transfer', label: 'Metro', name: 'CENTRAL\nTRANSFER', point: central, structureForwardOffset: 0, mapOffset: { x: -135, z: 105 } },
      { id: 'blue-east-ridge', label: 'Metro', name: 'EAST\nRIDGE', point: { x: 2860, z: -70 } },
      { id: 'blue-east-terminal', label: 'Metro', name: 'EAST\nMETRO', point: { x: 5900, z: 330 } }
    ]
  },
  {
    id: 'green',
    color: '#2fd66f',
    elevation: 'green',
    name: 'GREEN LINE',
    smooth: false,
    controlPoints: [
      airport,
      { x: -6220, z: 3920 },
      { x: -5660, z: 2680 },
      { x: -4350, z: 1740 },
      { x: -3000, z: 1380 },
      { x: -2040, z: 1660 },
      west,
      { x: -780, z: 1080 },
      central,
      { x: 900, z: 1260 },
      { x: 2200, z: 1160 },
      { x: 3560, z: 1100 },
      { x: 5040, z: 1020 },
      { x: 6300, z: 760 },
      { x: 6900, z: -120 },
      { x: 6820, z: -1180 },
      { x: 6200, z: -1880 },
      { x: 5480, z: -2150 },
      { x: 5100, z: -1660 },
      { x: 5260, z: -650 },
      { x: 5780, z: -360 },
      { x: 6300, z: -980 },
      { x: 6160, z: -2360 },
      trainStation
    ],
    stations: [
      { id: 'green-airport-transfer', label: 'Metro', name: 'AIRPORT\nTRANSFER', point: airport, structureForwardOffset: -76, mapOffset: { x: -95, z: -105 } },
      { id: 'green-west-transfer', label: 'Metro', name: 'WEST\nTRANSFER', point: west, structureForwardOffset: 76, mapOffset: { x: 120, z: -110 } },
      { id: 'green-central-transfer', label: 'Metro', name: 'CENTRAL\nTRANSFER', point: central, structureForwardOffset: 100, mapOffset: { x: 140, z: 120 } },
      { id: 'green-east-ridge', label: 'Metro', name: 'EAST\nRIDGE', point: { x: 3600, z: 1080 } },
      { id: 'green-station-transfer', label: 'Metro', name: 'STATION\nTRANSFER', point: trainStation, structureForwardOffset: -76, mapOffset: { x: -120, z: 120 } }
    ]
  },
  {
    id: 'purple',
    color: '#9b59ff',
    elevation: 'express',
    name: 'PURPLE LINK',
    samplesPerSegment: 4,
    serviceOffsets: [0, 0.5],
    smooth: false,
    speedMultiplier: 1.8,
    controlPoints: [
      airport,
      { x: -3680, z: 2940 },
      { x: -1080, z: 1160 },
      { x: 1600, z: -960 },
      { x: 3600, z: -2860 },
      trainStation
    ],
    stations: [
      { id: 'purple-airport-terminal', label: 'Metro', name: 'AIRPORT\nLINK', point: airport, structureForwardOffset: 76, mapOffset: { x: 120, z: 90 } },
      { id: 'purple-train-station', label: 'Metro', name: 'STATION\nLINK', point: trainStation, structureForwardOffset: 76, mapOffset: { x: 130, z: -110 } }
    ]
  }
];
