import * as THREE from 'three';
import { zoneLines, canvas, scene, renderer, camera, controls, mouse, raycaster, plane, zoneVertices, xzVertices } from './index.ts';
import { createLine, resetZone } from "./utils"

export const PLANE_Y = -1.0;
const MAX_RANGE = 200; // 200m for OS-1-128
export const NUM_VERTICES = 4;

export function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  renderer.setSize(width, height, false);

  const aspect = width / height;
  const viewSize = 100;

  camera.left = -aspect * viewSize / 2;
  camera.right = aspect * viewSize / 2;
  camera.top = viewSize / 2;
  camera.bottom = -viewSize / 2;

  camera.updateProjectionMatrix();
  controls.update();
}

window.addEventListener('click', (event: MouseEvent) => {
  const mode = localStorage.getItem('mode');
  if (mode === null || mode !== 'edit') return;

  if (zoneVertices.length >= NUM_VERTICES) return; // Stop after 4 points

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(plane);
  if (intersects.length === 0) return;

  const point = intersects[0].point.clone();

  const normalizedX = -1 * Math.atan2(-point.z, point.x) / Math.PI;
  // IMPORTANT NOTE: distanceTo(0,0,0) MUST MATCH VERTICLE LEVEL WITH RAYCAST PLANE
  const normalizedZ = 2 * ((point.distanceTo((new THREE.Vector3(0, PLANE_Y, 0)))) / MAX_RANGE) - 1;
  xzVertices.push([normalizedX, normalizedZ]);

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
  if (zoneVertices.length === NUM_VERTICES) {
    const line = createLine(zoneVertices[3].position, zoneVertices[0].position);
    scene.add(line);
    zoneLines.push(line);

    localStorage.removeItem('mode');
  }
});

document.getElementById("rezoneButton")?.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.setItem('mode', 'edit');
  resetZone();
})

document.getElementById("highlightButton")?.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.setItem('mode', 'highlight');
  resetZone();
})
