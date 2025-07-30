import * as THREE from 'three';
import { canvas, scene, renderer, camera, controls, mouse, raycaster, plane } from './index.ts';

export function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  controls.update();
}

export function onMouseClick(event: MouseEvent) {
  if (!localStorage.getItem('isInEditMode')) return

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

    // Create a visible box at the clicked point
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    box.position.copy(point);
    // Optional: raise the box so it sits on the plane (since box center is middle)
    box.position.y += 0.05;

    scene.add(box);
  }
}
