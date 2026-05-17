import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useDisposableResource } from '../world/rendering/instanceRenderers.jsx';

const GUIDE_Y = 0.18;
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

export function NavigationGroundGuide({ enabled, route }) {
  const guide = useMemo(() => createGuideInstances(route), [route]);
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

function createGuideInstances(route) {
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

      lines.push({
        length: Math.min(DASH_LENGTH, segment.length * 0.46),
        position: [
          lerp(segment.start.x, segment.end.x, t),
          GUIDE_Y,
          lerp(segment.start.z, segment.end.z, t)
        ],
        rotationZ: yaw
      });
    }

    const arrowCount = Math.min(MAX_ARROWS - arrows.length, Math.floor(segment.length / ARROW_SPACING));

    for (let index = 1; index <= arrowCount; index += 1) {
      const distance = index * ARROW_SPACING;
      const t = distance / segment.length;

      if (t >= 0.96) continue;

      arrows.push({
        position: [
          lerp(segment.start.x, segment.end.x, t),
          GUIDE_Y + 0.035,
          lerp(segment.start.z, segment.end.z, t)
        ],
        rotationZ: yaw
      });
    }

    const turnArrow = createTurnPreviewArrow(segment, route.segments[segmentIndex + 1]);

    if (turnArrow && arrows.length < MAX_ARROWS) {
      arrows.push(turnArrow);
    }

    if (arrows.length >= MAX_ARROWS || lines.length >= MAX_DASHES) break;
  }

  return { arrows, lines };
}

function createTurnPreviewArrow(segment, nextSegment) {
  if (!nextSegment?.start || !nextSegment?.end || nextSegment.length <= 2 || segment.length <= 18) return null;

  const currentBearing = getSegmentBearing(segment.start, segment.end);
  const nextBearing = getSegmentBearing(nextSegment.start, nextSegment.end);
  const delta = normalizeAngle(nextBearing - currentBearing);
  const absDelta = Math.abs(delta);

  if (absDelta < Math.PI / 7) return null;

  const previewDistance = clamp(segment.length - clamp(segment.length * 0.16, 18, 54), 8, segment.length - 4);
  const t = previewDistance / segment.length;

  return {
    position: [
      lerp(segment.start.x, segment.end.x, t),
      GUIDE_Y + 0.07,
      lerp(segment.start.z, segment.end.z, t)
    ],
    rotationZ: getSegmentBoxYaw(nextSegment.start, nextSegment.end),
    scale: absDelta > Math.PI * 0.72 ? 1.45 : 1.26
  };
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
