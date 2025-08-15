import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function resize(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
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
