import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { Highlighter } from "./highlighter";

// Three.js essentials
export const canvas = document.getElementById(
  "world3d-canvas"
)! as HTMLCanvasElement;
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
export const scene = new THREE.Scene();
// export const camera = new THREE.OrthographicCamera();
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Singletons
export const controls = new OrbitControls(camera, renderer.domElement);
export const raycaster = new THREE.Raycaster();
export const pointCloud = new THREE.Points();
export const extrinsicsHelper = new THREE.Group();
export const highlighter = new Highlighter(scene);

// State
export const zoneVertices: THREE.Mesh[] = []; // Cube indicators for the zone vertices
export const zoneLines: THREE.Line[] = []; // Lines connecting the zone vertices
export const xzVertices: number[][] = []; //  World XZ coordinates of the zone vertices

