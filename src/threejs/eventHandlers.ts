import * as THREE from 'three';
import { lines, canvas, scene, renderer, camera, controls, mouse, raycaster, plane, vertices } from './index.ts';
import { createLine } from "./utils"

export function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  controls.update();
}

export function onMouseClick(event: MouseEvent) {
  const mode = localStorage.getItem('mode');
  if (mode === null || mode !== 'edit') return;

  if (vertices.length >= 4) return; // Stop after 4 points

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(plane);
  if (intersects.length === 0) return;

  const point = intersects[0].point.clone();
  vertices.push(point);

  console.log(-1 * Math.atan2(-point.z, point.x) / Math.PI);

  // Add the box
  const boxSize = 0.5;
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.copy(point);
  scene.add(box);

  // Draw a line to the previous point
  if (vertices.length > 1) {
    const prev = vertices[vertices.length - 2];
    const line = createLine(prev, point);
    scene.add(line);
    lines.push(line);
  }

  // Close the loop if this is the 4th point
  if (vertices.length === 4) {
    const line = createLine(vertices[3], vertices[0]);
    scene.add(line);
    lines.push(line);
  }
}

