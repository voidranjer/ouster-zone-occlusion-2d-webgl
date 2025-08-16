import * as THREE from "three";

import { createLine, worldToLocalCoordinates } from "./utils";
import { updatePointColors } from "./updators";
import {
  camera,
  canvas,
  controls,
  highlighter,
  pointCloud,
  raycaster,
  renderer,
  xzVertices,
  zoneVertices,
  scene,
  zoneLines,
} from "./World3D";
import { NUM_ZONE_VERTICES } from "@src/lib/constants";
import type { ExtendedWindow } from "@src/lib/types";

export function handleResize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const aspect = width / height;
  renderer.setSize(width, height, false);

  // Perspective camera
  camera.aspect = aspect;

  // Orthographic camera
  // const viewSize = 50;
  // camera.left = -aspect * viewSize / 2;
  // camera.right = aspect * viewSize / 2;
  // camera.top = viewSize / 2;
  // camera.bottom = -viewSize / 2;

  camera.updateProjectionMatrix();
  controls.update();
}

window.addEventListener("resize", () => {
  handleResize();
});

window.addEventListener("mousemove", (event: MouseEvent) => {
  if ((window as ExtendedWindow).appState.mode !== "highlight") return;

  // Raycasting to find intersection with the plane
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

  const point = new THREE.Vector3();

  const intersects = raycaster.intersectObject(pointCloud);
  if (intersects.length !== 0) {
    point.copy(intersects[0].point);
  } else {
    const intersectsPlane = raycaster.intersectObject(
      highlighter.invisiblePlane
    );
    point.copy(
      intersectsPlane.length > 0
        ? intersectsPlane[0].point
        : new THREE.Vector3(10000, 0, 10000)
    ); // Default far point if no intersection
  }

  // Move the highlight plane and cuboid to the new position
  highlighter.setPosition(point.x, point.z);

  // Get vertices from highlighter.highlightPlane after it's been positioned
  const planePosition = highlighter.highlightPlane.position;
  const radius = highlighter.HIGHLIGHT_RADIUS;

  // Transform zone vertices from world coordinates to point cloud local coordinates
  const worldVertices = [
    [planePosition.x - radius, planePosition.z + radius],
    [planePosition.x + radius, planePosition.z + radius],
    [planePosition.x + radius, planePosition.z - radius],
    [planePosition.x - radius, planePosition.z - radius],
  ];

  for (let i = 0; i < 4; i++) {
    const [localX, localZ] = worldToLocalCoordinates(
      worldVertices[i][0],
      worldVertices[i][1]
    );
    xzVertices[i] = [localX, localZ];
  }
  updatePointColors(); // Update point colors when highlight moves
});

window.addEventListener('click', (event: MouseEvent) => {
  if ((window as ExtendedWindow).appState.mode !== "edit") return;

  if (zoneVertices.length >= NUM_ZONE_VERTICES) return; // Stop after 4 points

  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

  const intersects = raycaster.intersectObject(highlighter.invisiblePlane);
  if (intersects.length === 0) return;

  const point = intersects[0].point.clone();

  // Transform the world coordinate point to local coordinates for xzVertices
  const [localX, localZ] = worldToLocalCoordinates(point.x, point.z);
  xzVertices.push([localX, localZ]);

  // Add the box
  const boxSize = 0.2;
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.copy(point);
  scene.add(box);
  zoneVertices.push(box);

  // Draw a line to the previous point
  if (zoneVertices.length > 1) {
    const prev = zoneVertices[zoneVertices.length - 2].position;
    const line = createLine(prev, point);
    scene.add(line);
    zoneLines.push(line);
  }

  // Close the loop if this is the 4th point
  if (zoneVertices.length === NUM_ZONE_VERTICES) {
    const line = createLine(zoneVertices[3].position, zoneVertices[0].position);
    scene.add(line);
    zoneLines.push(line);

    (window as ExtendedWindow).setAppState({ mode: "normal" }); // Switch back to normal mode after completing the zone
    updatePointColors(); // Update point colors when zone is complete
  }
});
