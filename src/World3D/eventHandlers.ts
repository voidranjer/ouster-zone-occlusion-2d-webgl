import * as THREE from "three";

import { updatePointColors } from "./updators";
import {
  camera,
  canvas,
  controls,
  highlighter,
  pointCloud,
  raycaster,
  renderer,
  zone,
} from "./World3D";
import type { ExtendedWindow } from "@/lib/types";

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

canvas.addEventListener("mousemove", (event: MouseEvent) => {
  const appMode = (window as ExtendedWindow).appState.mode;

  if (appMode === "normal") return;

  // Raycasting to find intersection with the plane
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

  const point = new THREE.Vector3();
  const farPoint = new THREE.Vector3(10000, 0, 10000); // Default far point if no intersection

  if (appMode === "edit") {
    const intersectsPlane = raycaster.intersectObject(
      highlighter.invisiblePlane
    );
    point.copy(
      intersectsPlane.length > 0 ? intersectsPlane[0].point : farPoint
    );
    zone.setLastVertexPosition(point);
    updatePointColors();
    return;
  }

  if (appMode === "highlight") {
    const intersects = raycaster.intersectObject(pointCloud);
    if (intersects.length !== 0) {
      point.copy(intersects[0].point);
    } else {
      const intersectsPlane = raycaster.intersectObject(
        highlighter.invisiblePlane
      );
      point.copy(
        intersectsPlane.length > 0 ? intersectsPlane[0].point : farPoint
      );
    }

    // Move the highlight plane and cuboid to the new position
    highlighter.setPosition(point.x, point.z);

    const radius = highlighter.HIGHLIGHT_RADIUS;

    // Transform zone vertices from world coordinates to point cloud local coordinates
    const worldVertices = [
      [point.x - radius, point.z + radius],
      [point.x + radius, point.z + radius],
      [point.x + radius, point.z - radius],
      [point.x - radius, point.z - radius],
    ];
    zone.setXzVertices(worldVertices); // For 2D Point-in-Polygon test
    updatePointColors(); // For 3D Point-in-Polygon test
  }
});

canvas.addEventListener('click', () => {
  if ((window as ExtendedWindow).appState.mode !== "edit") return;

  const vertexAdded = zone.addVertex();
  if (!vertexAdded) {
    (window as ExtendedWindow).setAppState(appState => ({ ...appState, mode: "normal" })); // Switch back to normal mode after completing the zone
    updatePointColors(); // Update point colors when zone is complete
    return;
  }
});

canvas.addEventListener("dblclick", () => {
  if (!(window as ExtendedWindow).appState.mode.startsWith("highlight")) return;
  (window as ExtendedWindow).setAppState(appState => ({ ...appState, mode: "highlight-freeze" }));
});
