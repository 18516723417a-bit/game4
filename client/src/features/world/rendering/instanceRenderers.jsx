import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const matrixObject = new THREE.Object3D();
const colorObject = new THREE.Color();
const basisXVector = new THREE.Vector3();
const basisYVector = new THREE.Vector3();
const basisZVector = new THREE.Vector3();
const basisScaleVector = new THREE.Vector3();

export function PlaneInstances({ name, color, instances, metalness = 0, roughness, receiveShadow }) {
  const geometry = useDisposableResource(() => new THREE.PlaneGeometry(1, 1), []);
  const material = useDisposableResource(
    () => new THREE.MeshStandardMaterial({ color, metalness, roughness }),
    [color, metalness, roughness]
  );

  return (
    <InstancedBatch
      geometry={geometry}
      instances={instances}
      material={material}
      name={name}
      receiveShadow={receiveShadow}
    />
  );
}

export function BoxInstances({
  name,
  color = '#ffffff',
  depthWrite = true,
  emissive = '#000000',
  emissiveIntensity = 0,
  instances,
  materialType,
  metalness = 0,
  opacity = 1,
  receiveShadow,
  castShadow,
  roughness = 1,
  side = THREE.FrontSide,
  toneMapped = true,
  transparent = false,
  useInstanceColor = false
}) {
  const geometry = useDisposableResource(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useDisposableResource(() => {
    if (materialType === 'basic') {
      return new THREE.MeshBasicMaterial({
        color,
        depthWrite,
        opacity,
        side,
        toneMapped,
        transparent,
        vertexColors: useInstanceColor
      });
    }

    return new THREE.MeshStandardMaterial({
      color,
      depthWrite,
      emissive,
      emissiveIntensity,
      metalness,
      opacity,
      roughness,
      side,
      toneMapped,
      transparent,
      vertexColors: useInstanceColor
    });
  }, [
    color,
    depthWrite,
    emissive,
    emissiveIntensity,
    materialType,
    metalness,
    opacity,
    roughness,
    side,
    toneMapped,
    transparent,
    useInstanceColor
  ]);

  return (
    <InstancedBatch
      castShadow={castShadow}
      geometry={geometry}
      instances={instances}
      material={material}
      name={name}
      receiveShadow={receiveShadow}
      useInstanceColor={useInstanceColor}
    />
  );
}

export function CylinderInstances({
  name,
  color,
  instances,
  metalness = 0,
  radialSegments,
  receiveShadow,
  castShadow,
  roughness
}) {
  const geometry = useDisposableResource(
    () => new THREE.CylinderGeometry(1, 1, 1, radialSegments),
    [radialSegments]
  );
  const material = useDisposableResource(
    () => new THREE.MeshStandardMaterial({ color, metalness, roughness }),
    [color, metalness, roughness]
  );

  return (
    <InstancedBatch
      castShadow={castShadow}
      geometry={geometry}
      instances={instances}
      material={material}
      name={name}
      receiveShadow={receiveShadow}
    />
  );
}

export function ConeInstances({
  name,
  color,
  instances,
  radialSegments,
  receiveShadow,
  castShadow,
  roughness
}) {
  const geometry = useDisposableResource(
    () => new THREE.ConeGeometry(1, 1, radialSegments),
    [radialSegments]
  );
  const material = useDisposableResource(
    () => new THREE.MeshStandardMaterial({ color, roughness }),
    [color, roughness]
  );

  return (
    <InstancedBatch
      castShadow={castShadow}
      geometry={geometry}
      instances={instances}
      material={material}
      name={name}
      receiveShadow={receiveShadow}
    />
  );
}

function InstancedBatch({
  name,
  geometry,
  material,
  instances,
  receiveShadow = false,
  castShadow = false,
  useInstanceColor = false
}) {
  const meshRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    for (let index = 0; index < instances.length; index += 1) {
      writeInstanceMatrix(mesh, index, instances[index]);

      if (useInstanceColor) {
        mesh.setColorAt(index, colorObject.set(instances[index].color ?? '#ffffff'));
      }
    }

    mesh.count = instances.length;
    mesh.instanceMatrix.needsUpdate = true;

    if (useInstanceColor && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
      mesh.material.needsUpdate = true;
    }

    mesh.computeBoundingSphere();
  }, [instances, useInstanceColor]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      key={`${name}-${instances.length}`}
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow={castShadow}
      dispose={null}
      frustumCulled
      name={name}
      receiveShadow={receiveShadow}
    />
  );
}

function writeInstanceMatrix(mesh, index, instance) {
  const [x, y, z] = instance.position;
  const [scaleX, scaleY, scaleZ] = instance.scale;

  if (instance.basis) {
    basisXVector.set(instance.basis.x[0], instance.basis.x[1], instance.basis.x[2]);
    basisYVector.set(instance.basis.y[0], instance.basis.y[1], instance.basis.y[2]);
    basisZVector.set(instance.basis.z[0], instance.basis.z[1], instance.basis.z[2]);
    basisScaleVector.set(scaleX, scaleY, scaleZ);
    matrixObject.matrix.makeBasis(basisXVector, basisYVector, basisZVector);
    matrixObject.matrix.scale(basisScaleVector);
    matrixObject.matrix.setPosition(x, y, z);
    mesh.setMatrixAt(index, matrixObject.matrix);
    return;
  }

  const [rotationX = 0, rotationY = 0, rotationZ = 0] = instance.rotation ?? [];

  matrixObject.position.set(x, y, z);
  matrixObject.rotation.set(rotationX, rotationY, rotationZ);
  matrixObject.scale.set(scaleX, scaleY, scaleZ);
  matrixObject.updateMatrix();
  mesh.setMatrixAt(index, matrixObject.matrix);
}

export function useDisposableResource(factory, dependencies) {
  const resource = useMemo(factory, dependencies);

  useEffect(() => () => {
    resource.dispose();
  }, [resource]);

  return resource;
}
