import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// import { useRef, useEffect, useCallback } from "react"

import { Highlighter } from "./highlighter";
// import { resize, handleMouseMove } from "./eventHandlers";

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

// export default function World3D(props: World3DProps) {
//   const {
//     singletons: { camera },
//     state: { renderer, setRenderer, controls, setControls }
//   } = props;

//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   const handleResize = useCallback(() => {
//     /* `useCallback` is required for stable reference to function passed to `window.addEventListener` */
//     if (!canvasRef.current || !renderer || !camera || !controls) return;
//     resize(canvasRef.current, renderer, camera, controls);
//   }, [renderer, camera, controls]);

//   useEffect(() => {
//     if (canvasRef.current) {
//       const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
//       setRenderer(renderer);
//       setControls(new OrbitControls(camera, renderer.domElement));
//     }
//   }, [])

//   useEffect(() => {
//     handleResize(); // Initial resize to set canvas size
//     window.addEventListener('resize', handleResize);

//     return () => {
//       window.removeEventListener('resize', handleResize);
//     }
//   }, [handleResize])

//   return (
//     <canvas
//       id="threejs-canvas"
//       ref={canvasRef}
//       className="block w-full h-[calc(100vh-150px)]"
//       onMouseMove={(event) => handleMouseMove(event, props)}
//     >
//     </canvas>
//   )
// }
