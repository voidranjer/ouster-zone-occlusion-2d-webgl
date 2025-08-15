import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { useRef, useEffect, useCallback } from "react"

import { Highlighter } from "./highlighter";
import { resize, handleMouseMove } from "./eventHandlers";

export type World3DProps = {
  singletons: {
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    pointCloud: THREE.Points,
    extrinsicsHelper: THREE.Group,
    highlighter: Highlighter,
  };
  state: {
    renderer: THREE.WebGLRenderer | null,
    setRenderer: React.Dispatch<React.SetStateAction<THREE.WebGLRenderer | null>>,
    controls: OrbitControls | null,
    setControls: React.Dispatch<React.SetStateAction<OrbitControls | null>>,
    zoneVertices: THREE.Mesh[],
    zoneLines: THREE.Line[],
    xzVertices: number[][],
    extrinsics: {
      translation: { x: number, y: number, z: number },
      rotation: { x: number, y: number, z: number },
    },
    setExtrinsics: React.Dispatch<React.SetStateAction<{
      translation: { x: number, y: number, z: number },
      rotation: { x: number, y: number, z: number },
    }>>,
    appMode: "normal" | "edit" | "highlight",
    setAppMode: React.Dispatch<React.SetStateAction<"normal" | "edit" | "highlight">>,
  }
}

export default function World3D(props: World3DProps) {
  const {
    singletons: { camera },
    state: { renderer, setRenderer, controls, setControls }
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleResize = useCallback(() => {
    /* `useCallback` is required for stable reference to function passed to `window.addEventListener` */
    if (!canvasRef.current || !renderer || !camera || !controls) return;
    resize(canvasRef.current, renderer, camera, controls);
  }, [renderer, camera, controls]);

  useEffect(() => {
    if (canvasRef.current) {
      const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
      setRenderer(renderer);
      setControls(new OrbitControls(camera, renderer.domElement));
    }
  }, [])

  useEffect(() => {
    handleResize(); // Initial resize to set canvas size
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [handleResize])

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-[calc(100vh-150px)]"
      onMouseMove={(event) => handleMouseMove(event, props)}
    >
    </canvas>
  )
}
