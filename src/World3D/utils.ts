import * as THREE from "three";

import { MAX_RANGE } from "@src/lib/constants";
import { extrinsicsHelper } from "./World3D";

// Helper function to reverse extrinsics and convert world coordinates to local coordinates
export function worldToLocalCoordinates(
  worldX: number,
  worldZ: number
): [number, number] {
  extrinsicsHelper.updateMatrixWorld();
  const inverseMatrix = extrinsicsHelper.matrixWorld.clone().invert();
  const worldPoint = new THREE.Vector3(worldX, 0, worldZ);
  const localPoint = worldPoint.applyMatrix4(inverseMatrix);
  return [localPoint.x, localPoint.z];
}

// Helper function for point-in-polygon test
export function isPointInPolygon(
  x: number,
  z: number,
  vertices: number[][]
): boolean {
  if (vertices.length < 3) return false;

  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0],
      zi = vertices[i][1];
    const xj = vertices[j][0],
      zj = vertices[j][1];

    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function createLine(p1: THREE.Vector3, p2: THREE.Vector3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  return new THREE.Line(geometry, material);
}

// Converts world X/Z coordinates (post-extrinsics in 3js) to clip space (WebGL) coordinates
export function xzToClipSpace(x: number, z: number): [number, number] {
  // TODO: this doesn't account for if X/Z extrinsics are applied
  const normalizedX = (-1 * Math.atan2(-z, x)) / Math.PI;
  const normalizedZ =
    2 *
      (new THREE.Vector2(x, z).distanceTo(new THREE.Vector2(0, 0)) /
        MAX_RANGE) -
    1;
  return [normalizedX, normalizedZ];
}
