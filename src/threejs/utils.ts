import * as THREE from 'three';

export function createLine(p1: THREE.Vector3, p2: THREE.Vector3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  return new THREE.Line(geometry, material);
}
