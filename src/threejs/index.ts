import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { fetchJsonFile } from '../lib/utils';
import { NUM_VERTICES, PLANE_Y } from './eventHandlers';
import { resetZone } from './utils';

const POINTS_SIZE = 1.5;

// Three.js essentials
export const scene = new THREE.Scene();
export const camera = new THREE.OrthographicCamera();
export const canvas = document.getElementById('threejs-canvas')! as HTMLCanvasElement;
export const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

// Singletons
export let controls: OrbitControls;
export let raycaster = new THREE.Raycaster();
export let mouse = new THREE.Vector2();
export let plane: THREE.Mesh;

// State
export const zoneVertices: THREE.Mesh[] = [];
export const zoneLines: THREE.Line[] = [];
export const xzVertices: number[][] = [];

/* --- FUNCTIONS ---*/


export function render() {
  controls.update(); // required if enableDamping is true
  controls.enabled = localStorage.getItem('mode') !== 'edit';
  renderer.render(scene, camera);
}

export async function setup() {
  renderer.setPixelRatio(window.devicePixelRatio); // for retina displays
  camera.position.set(0, 30, 0);

  // Orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // smooth orbiting
  controls.dampingFactor = 0.05;
  // controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  // Add point cloud
  const geometry = new THREE.BufferGeometry();
  const pointsData: number[][] = await fetchJsonFile('data/points.json');
  const positions = new Float32Array(pointsData.flat());
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const reflectivityData: number[][] = await fetchJsonFile('data/points_reflectivity.json');
  const colors = new Float32Array(reflectivityData.flat());
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    // color: new THREE.Color(0, 1, 0),
    vertexColors: true,
    size: POINTS_SIZE,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Create invisible plane at minY
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0,
    transparent: true,
    visible: false,  // keep plane invisible
  });
  plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;  // rotate to horizontal (XZ)
  plane.position.y = PLANE_Y;
  scene.add(plane);

  // Origin indicator (white cube)
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, 0, 0);
  scene.add(box);

  // Initialize localStorage state
  localStorage.removeItem('mode');
  resetZone();
}
