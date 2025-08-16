import * as THREE from "three";

import { worldToLocalCoordinates } from "./utils";
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
  appState,
} from "./World3D";

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
  if (appState.mode !== "highlight") return;

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
        : new THREE.Vector3(0, 0, 1000)
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
