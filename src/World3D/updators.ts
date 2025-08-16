import * as THREE from "three";

import {
  extrinsicsHelper,
  pointCloud,
  xzVertices,
  zoneLines,
  zoneVertices,
} from "./World3D";
import { isPointInPolygon } from "./utils";
import type { Extrinsics } from "@src/lib/types";

export function updateExtrinsics(extrinsics: Extrinsics) {
  const { translation, rotation } = extrinsics;

  // Reset the group's transformation
  extrinsicsHelper.matrix.identity();
  extrinsicsHelper.matrixAutoUpdate = false;

  // Create new transformation matrix
  const matrix = new THREE.Matrix4();

  // Apply translation
  const translationMatrix = new THREE.Matrix4().makeTranslation(translation.x, translation.y, translation.z);

  // Apply rotations (in XYZ order)
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(rotation.x),
    THREE.MathUtils.degToRad(rotation.y),
    THREE.MathUtils.degToRad(rotation.z),
    'XYZ'
  ));

  // Combine transformations: Translation * Rotation
  matrix.multiplyMatrices(translationMatrix, rotationMatrix);

  // Apply the matrix to the group
  extrinsicsHelper.applyMatrix4(matrix);
}

// Function to update point colors based on zones
export function updatePointColors() {
  const positions = pointCloud.geometry.getAttribute(
    "position"
  ) as THREE.BufferAttribute;
  const colors = pointCloud.geometry.getAttribute(
    "color"
  ) as THREE.BufferAttribute;

  // Store original colors if not already stored
  // @ts-expect-error custom property on THREE.Points
  if (!pointCloud.originalColors) {
    // @ts-expect-error custom property on THREE.Points
    pointCloud.originalColors = colors.array.slice();
  }
  // @ts-expect-error custom property on THREE.Points
  const originalColors = pointCloud.originalColors;

  // Reset to original colors first
  colors.array.set(originalColors);

  // Check each point against zone vertices (both now in local coordinates)
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    // Point-in-polygon test using xzVertices (now in local coordinates)
    if (xzVertices.length >= 3 && isPointInPolygon(x, z, xzVertices)) {
      // Blend with original color like the shader: keep red channel, add green
      const originalR = originalColors[i * 3];
      colors.setXYZ(i, originalR, 0.5, 0);
    }
  }

  colors.needsUpdate = true;
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

  updatePointColors(); // Reset point colors when zone is cleared
}
