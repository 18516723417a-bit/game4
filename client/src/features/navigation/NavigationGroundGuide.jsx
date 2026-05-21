import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDisposableResource } from '../world/rendering/instanceRenderers.jsx';

const GUIDE_Y = 0.18;
const GUIDE_SURFACE_OFFSET = 0.16;
const GUIDE_WIDTH = 2.2;
const DASH_LENGTH = 18;
const DASH_SPACING = 34;
const ARROW_SPACING = 92;
const MAX_DASHES = 260;
const MAX_ARROWS = 120;
const arrowMatrix = new THREE.Matrix4();
const arrowQuaternion = new THREE.Quaternion();
const arrowRotation = new THREE.Euler();
const arrowScale = new THREE.Vector3(1, 1, 1);
const arrowPosition = new THREE.Vector3();
const dashMatrix = new THREE.Matrix4();
const dashQuaternion = new THREE.Quaternion();
const dashRotation = new THREE.Euler();
const dashScale = new THREE.Vector3();
const dashPosition = new THREE.Vector3();

export function NavigationGroundGuide({ enabled, route, driveSurfaces = [] }) {
  const guide = useMemo(() => createGuideInstances(route, driveSurfaces), [driveSurfaces, route]);
  const dashGeometry = useDisposableResource(() => new THREE.PlaneGeometry(1, 1), []);
  const dashMaterial = useDisposableResource(
    () => new THREE.MeshBasicMaterial({
      color: '#70f0ff',
      depthWrite: false,
      opacity: 0.52,
      side: THREE.DoubleSide,
      transparent: true
    }),
    []
  );
  const arrowGeometry = useDisposableResource(createArrowGeometry, []);
  const arrowMaterial = useDisposableResource(
    () => new THREE.MeshBasicMaterial({
      color: '#70f0ff',
      depthWrite: false,
      opacity: 0.92,
      side: THREE.DoubleSide,
      transparent: true
    }),
    []
  );

  if (!enabled || guide.lines.length === 0) return null;

  return (
    <group name="NavigationGroundGuide" renderOrder={8}>
      <NavigationGroundGuideDashes
        dashes={guide.lines}
        geometry={dashGeometry}
        material={dashMaterial}
      />
      <NavigationGroundGuideArrows
        arrows={guide.arrows}
        geometry={arrowGeometry}
        material={arrowMaterial}
      />
    </group>
  );
}

function NavigationGroundGuideDashes({ dashes, geometry, material }) {
  const meshRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    for (let index = 0; index < dashes.length; index += 1) {
      const dash = dashes[index];

      dashPosition.set(dash.position[0], dash.position[1], dash.position[2]);
      dashRotation.set(-Math.PI / 2, 0, dash.rotationZ);
      dashQuaternion.setFromEuler(dashRotation);
      dashScale.set(dash.length, GUIDE_WIDTH, 1);
      dashMatrix.compose(dashPosition, dashQuaternion, dashScale);
      mesh.setMatrixAt(index, dashMatrix);
    }

    mesh.count = dashes.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dashes]);

  if (dashes.length === 0) return null;

  return (
    <instancedMesh
      key={`navigation-ground-guide-dashes-${dashes.length}`}
      ref={meshRef}
      args={[geometry, material, dashes.length]}
      frustumCulled={false}
      name="NavigationGroundGuideDashInstances"
      renderOrder={8}
    />
  );
}

function NavigationGroundGuideArrows({ arrows, geometry, material }) {
  const meshRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    for (let index = 0; index < arrows.length; index += 1) {
      const arrow = arrows[index];
      const scale = arrow.scale ?? 1;

      arrowPosition.set(arrow.position[0], arrow.position[1], arrow.position[2]);
      arrowRotation.set(-Math.PI / 2, 0, arrow.rotationZ);
      arrowQuaternion.setFromEuler(arrowRotation);
      arrowScale.set(scale, scale, 1);
      arrowMatrix.compose(arrowPosition, arrowQuaternion, arrowScale);
      mesh.setMatrixAt(index, arrowMatrix);
    }

    mesh.count = arrows.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [arrows]);

  if (arrows.length === 0) return null;

  return (
    <instancedMesh
      key={`navigation-ground-guide-arrows-${arrows.length}`}
      ref={meshRef}
      args={[geometry, material, arrows.length]}
      frustumCulled={false}
      name="NavigationGroundGuideArrowInstances"
      renderOrder={9}
    />
  );
}

function createGuideInstances(route, driveSurfaces) {
  if (!route?.segments?.length) {
    return { arrows: [], lines: [] };
  }

  const lines = [];
  const arrows = [];

  for (let segmentIndex = 0; segmentIndex < route.segments.length; segmentIndex += 1) {
    const segment = route.segments[segmentIndex];
    if (!segment?.start || !segment?.end || segment.length <= 2) continue;

    const yaw = getSegmentBoxYaw(segment.start, segment.end);
    const dashCount = Math.min(
      MAX_DASHES - lines.length,
      Math.max(1, Math.floor(segment.length / DASH_SPACING))
    );

    for (let index = 0; index < dashCount; index += 1) {
      const distance = Math.min(segment.length - 2, index * DASH_SPACING + DASH_SPACING * 0.5);
      const t = distance / segment.length;

      if (t <= 0.02 || t >= 0.98) continue;

      const x = lerp(segment.start.x, segment.end.x, t);
      const z = lerp(segment.start.z, segment.end.z, t);
      const y = getGuideYAt(x, z, driveSurfaces);

      if (!Number.isFinite(y)) continue;

      lines.push({
        length: Math.min(DASH_LENGTH, segment.length * 0.46),
        position: [x, y, z],
        rotationZ: yaw
      });
    }

    const arrowCount = Math.min(MAX_ARROWS - arrows.length, Math.floor(segment.length / ARROW_SPACING));

    for (let index = 1; index <= arrowCount; index += 1) {
      const distance = index * ARROW_SPACING;
      const t = distance / segment.length;

      if (t >= 0.96) continue;

      const x = lerp(segment.start.x, segment.end.x, t);
      const z = lerp(segment.start.z, segment.end.z, t);
      const y = getGuideYAt(x, z, driveSurfaces);

      if (!Number.isFinite(y)) continue;

      arrows.push({
        position: [x, y + 0.035, z],
        rotationZ: yaw
      });
    }

    const turnArrow = createTurnPreviewArrow(segment, route.segments[segmentIndex + 1], driveSurfaces);

    if (turnArrow && arrows.length < MAX_ARROWS) {
      arrows.push(turnArrow);
    }

    if (arrows.length >= MAX_ARROWS || lines.length >= MAX_DASHES) break;
  }

  return { arrows, lines };
}

function createTurnPreviewArrow(segment, nextSegment, driveSurfaces) {
  if (!nextSegment?.start || !nextSegment?.end || nextSegment.length <= 2 || segment.length <= 18) return null;

  const currentBearing = getSegmentBearing(segment.start, segment.end);
  const nextBearing = getSegmentBearing(nextSegment.start, nextSegment.end);
  const delta = normalizeAngle(nextBearing - currentBearing);
  const absDelta = Math.abs(delta);

  if (absDelta < Math.PI / 7) return null;

  const previewDistance = clamp(segment.length - clamp(segment.length * 0.16, 18, 54), 8, segment.length - 4);
  const t = previewDistance / segment.length;
  const x = lerp(segment.start.x, segment.end.x, t);
  const z = lerp(segment.start.z, segment.end.z, t);
  const y = getGuideYAt(x, z, driveSurfaces);

  if (!Number.isFinite(y)) return null;

  return {
    position: [x, y + 0.07, z],
    rotationZ: getSegmentBoxYaw(nextSegment.start, nextSegment.end),
    scale: absDelta > Math.PI * 0.72 ? 1.45 : 1.26
  };
}

function getGuideYAt(x, z, driveSurfaces) {
  let best = null;

  for (const surface of driveSurfaces ?? []) {
    const match = getSurfaceYAt(surface, x, z, 3.4);
    if (!match) continue;

    if (
      !best ||
      match.distance < best.distance ||
      (Math.abs(match.distance - best.distance) < 0.001 && match.y > best.y)
    ) {
      best = match;
    }
  }

  return best ? best.y + GUIDE_SURFACE_OFFSET : null;
}

function getSurfaceYAt(surface, x, z, margin = 0) {
  if (!surface) return null;

  if (surface.shape === 'circle') {
    const dx = x - surface.centerX;
    const dz = z - surface.centerZ;
    const distance = Math.hypot(dx, dz);
    const radius = (surface.radius ?? 0) + margin;

    return distance <= radius
      ? { y: getFlatSurfaceY(surface), distance: Math.max(0, distance - (surface.radius ?? 0)) }
      : null;
  }

  if (surface.shape === 'segment' || surface.shape === 'ramp' || surface.axis === 'segment') {
    return getSegmentSurfaceYAt(surface, x, z, margin);
  }

  const minX = surface.minX - margin;
  const maxX = surface.maxX + margin;
  const minZ = surface.minZ - margin;
  const maxZ = surface.maxZ + margin;

  if (x < minX || x > maxX || z < minZ || z > maxZ) return null;

  return {
    y: getFlatSurfaceY(surface),
    distance: Math.min(
      Math.abs(x - (surface.centerX ?? x)),
      Math.abs(z - (surface.centerZ ?? z))
    )
  };
}

function getSegmentSurfaceYAt(surface, x, z, margin) {
  const startX = surface.startX;
  const startZ = surface.startZ;
  const endX = surface.endX;
  const endZ = surface.endZ;

  if (![startX, startZ, endX, endZ].every(Number.isFinite)) return null;

  const dx = endX - startX;
  const dz = endZ - startZ;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq <= 0.000001) return null;

  const t = clamp(((x - startX) * dx + (z - startZ) * dz) / lengthSq, 0, 1);
  const projectedX = startX + dx * t;
  const projectedZ = startZ + dz * t;
  const lateralDistance = Math.hypot(x - projectedX, z - projectedZ);
  const halfWidth = (surface.width ?? 0) / 2 + margin;

  if (lateralDistance > halfWidth) return null;

  const startY = surface.startY ?? surface.y ?? surface.position?.[1] ?? GUIDE_Y;
  const endY = surface.endY ?? surface.y ?? surface.position?.[1] ?? startY;

  return {
    y: lerp(startY, endY, t),
    distance: lateralDistance
  };
}

function getFlatSurfaceY(surface) {
  return surface.y ?? surface.position?.[1] ?? GUIDE_Y;
}

function createArrowGeometry() {
  const shape = new THREE.Shape();

  shape.moveTo(7, 0);
  shape.lineTo(-5, 4.8);
  shape.lineTo(-2.2, 0);
  shape.lineTo(-5, -4.8);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function getSegmentBoxYaw(start, end) {
  return Math.atan2(-(end.z - start.z), end.x - start.x);
}

function getSegmentBearing(start, end) {
  return Math.atan2(end.x - start.x, end.z - start.z);
}

function normalizeAngle(angle) {
  let normalized = angle;

  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;

  return normalized;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
