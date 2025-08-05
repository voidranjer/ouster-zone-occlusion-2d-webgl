import * as THREE from 'three';

import { xzVertices } from '.';
import { zoneVertices, zoneLines } from '.';

export function createLine(p1: THREE.Vector3, p2: THREE.Vector3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  return new THREE.Line(geometry, material);
}

export function resetZone() {
  localStorage.removeItem('xzVertices');

  let xzVertex = xzVertices.pop();
  while (xzVertex !== undefined) {
    xzVertex = xzVertices.pop();
  }

  let vertex = zoneVertices.pop();
  while (vertex !== undefined) {
    vertex.removeFromParent();
    vertex = zoneVertices.pop();
  }

  let line = zoneLines.pop();
  while (line !== undefined) {
    line.removeFromParent();
    line = zoneLines.pop();
  }
}
