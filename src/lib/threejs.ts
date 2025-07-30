import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { fetchJsonFile } from './utils';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const threejsCanvas = document.getElementById('threejs-canvas')! as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: threejsCanvas, antialias: true });

let controls: OrbitControls;

/* --- FUNCTIONS ---*/

export function resize() {
  const width = threejsCanvas.clientWidth;
  const height = threejsCanvas.clientHeight;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  controls.update();
}

export function render() {
  controls.update(); // required if enableDamping is true
  renderer.render(scene, camera);
}

export async function setup() {
  renderer.setPixelRatio(window.devicePixelRatio); // for retina displays
  // camera.position.set(100, 100, 100);
  camera.position.z = 5;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // smooth orbiting
  controls.dampingFactor = 0.05;
  // controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  const pointsData: number[][] = await fetchJsonFile('data/points.json');

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(pointsData.flat());

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00ff00,
    size: 0.05,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
}
