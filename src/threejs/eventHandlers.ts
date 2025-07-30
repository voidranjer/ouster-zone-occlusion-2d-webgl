import * as THREE from 'three';
import { canvas, scene, renderer, camera, controls, mouse, raycaster, plane, vertices } from './index.ts';

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

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObject(plane);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    vertices.push(point);

    // webgl has weird coordinate system
    console.log(Math.atan2(-point.z, point.x) / Math.PI);

    // Create a visible box at the clicked point
    const boxSize = 0.5;
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.copy(point);
    // Optional: raise the box so it sits on the plane (since box center is middle)
    box.position.y += boxSize;
    scene.add(box);
  }
}

