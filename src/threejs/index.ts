import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { fetchJsonFile } from '../lib/utils';
import { PLANE_Y } from './eventHandlers';
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
export let extrinsicsHelper: THREE.Group;

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

export function updateExtrinsics(translation: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }) {
  if (!extrinsicsHelper) return;
  
  // Save to localStorage
  const extrinsicsData = {
    translation,
    rotation
  };
  localStorage.setItem('extrinsics', JSON.stringify(extrinsicsData));
  
  // Reset the group's transformation
  extrinsicsHelper.matrix.identity();
  extrinsicsHelper.matrixAutoUpdate = false;
  
  // Create new transformation matrix
  const matrix = new THREE.Matrix4();
  
  // Apply translation
  const translationMatrix = new THREE.Matrix4().makeTranslation(translation.x, translation.y, translation.z);
  
  // Apply rotations (in XYZ order)
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(rotation.x),
    THREE.MathUtils.degToRad(rotation.y), 
    THREE.MathUtils.degToRad(rotation.z),
    'XYZ'
  ));
  
  // Combine transformations: Translation * Rotation
  matrix.multiplyMatrices(translationMatrix, rotationMatrix);
  
  // Apply the matrix to the group
  extrinsicsHelper.applyMatrix4(matrix);
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

  // Helper to apply sensor extrinsics to point cloud and sensor wireframe
  extrinsicsHelper = new THREE.Group();
  extrinsicsHelper.name = 'extrinsics';
  const extrinsics = new THREE.Matrix4();
  extrinsics.set(
    1, 0, 0, 0,      // X row: rotation, translation X
    0, 1, 0, 0,  // Y row: rotation, translation Y
    0, 0, 1, 0,        // Z row: rotation, translation Z
    0, 0, 0, 1         // last row: homogeneous coordinate
  );
  extrinsicsHelper.applyMatrix4(extrinsics);
  scene.add(extrinsicsHelper);

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
  extrinsicsHelper.add(points);

  // Sensor wireframe
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, 0, 0);
  extrinsicsHelper.add(box);

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

  // Create a grid helper
  const size = 200;      // 400 meters wide
  const divisions = 100; // 2 meter per grid square
  const gridHelper = new THREE.GridHelper(size, divisions, 0xff0000, 0x3b3b3b);
  gridHelper.position.y = PLANE_Y;  // position at the same Y level as before
  scene.add(gridHelper);

  // Initialize localStorage state
  localStorage.removeItem('mode');
  resetZone();
}
