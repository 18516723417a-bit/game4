export const GAME_TIME_LIMIT_MS = 90000;
export const COLLISION_LIMIT = 5;
export const COUNTDOWN_LABELS = ['3', '2', '1', 'GO'];

export const RACE_CHECKPOINTS = [
  {
    id: 'roundabout-exit',
    label: 'Roundabout exit',
    position: { x: 96, y: 0.52, z: 92 },
    radius: 24,
    yTolerance: 3
  },
  {
    id: 'main-road-run',
    label: 'Main road run',
    position: { x: 282, y: 0.52, z: 146 },
    radius: 24,
    yTolerance: 3
  },
  {
    id: 'finish',
    label: 'Finish',
    position: { x: 620, y: 0.52, z: 146 },
    radius: 28,
    yTolerance: 3
  }
];
