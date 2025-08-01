import * as THREE from 'three';
import { zoneLines, canvas, scene, renderer, camera, controls, mouse, raycaster, plane, zoneVertices, xzVertices } from './index.ts';
import { createLine } from "./utils"
import { gl } from '../main.ts';

export const PLANE_Y = -1.0;
const MAX_RANGE = 200; // 200m for OS-1-128

export function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  renderer.setSize(width, height, false);

  const aspect = width / height;
  const viewSize = 80;

  camera.left = -aspect * viewSize / 2;
  camera.right = aspect * viewSize / 2;
  camera.top = viewSize / 2;
  camera.bottom = -viewSize / 2;

  camera.updateProjectionMatrix();
  controls.update();
}

export function onMouseClick(event: MouseEvent) {
  const mode = localStorage.getItem('mode');
  if (mode === null || mode !== 'edit') return;

  if (zoneVertices.length >= 4) return; // Stop after 4 points

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(plane);
  if (intersects.length === 0) return;

  const point = intersects[0].point.clone();
  zoneVertices.push(point);

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

  // Draw a line to the previous point
  if (zoneVertices.length > 1) {
    const prev = zoneVertices[zoneVertices.length - 2];
    const line = createLine(prev, point);
    scene.add(line);
    zoneLines.push(line);
  }

  // Close the loop if this is the 4th point
  if (zoneVertices.length === 4) {
    const line = createLine(zoneVertices[3], zoneVertices[0]);
    scene.add(line);
    zoneLines.push(line);

    // Set these points into localStorage
    localStorage.setItem('xzVertices', JSON.stringify(xzVertices));
    localStorage.removeItem('mode');
  }
}

document.getElementById("selectionButton")?.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.setItem('mode', 'edit');
  localStorage.removeItem('xzVertices');
})
