import * as THREE from 'three';

import { xzVertices } from '.';
import { zoneVertices, zoneLines } from '.';
import { MAX_RANGE } from './eventHandlers';

export function createLine(p1: THREE.Vector3, p2: THREE.Vector3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  return new THREE.Line(geometry, material);
}

export function resetZone() {
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

export function xzToClipSpace(x: number, z: number): [number, number] {
  // TODO: this doesn't account for if X/Z extrinsics are applied
  const normalizedX = -1 * Math.atan2(-z, x) / Math.PI;
  const normalizedZ = 2 * ((new THREE.Vector2(x, z).distanceTo((new THREE.Vector2(0, 0)))) / MAX_RANGE) - 1;
  return [normalizedX, normalizedZ];
}
