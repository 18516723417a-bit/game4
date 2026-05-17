export function localOffsetToWorld(position, rotationY, localX, localY, localZ) {
  const sin = Math.sin(rotationY);
  const cos = Math.cos(rotationY);

  return [
    position[0] + localX * cos + localZ * sin,
    localY,
    position[2] - localX * sin + localZ * cos
  ];
}

export function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function isPointInsideBounds(x, z, bounds) {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}
