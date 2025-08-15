import { useEffect, useState, useMemo } from "react";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import Controls from "./Controls";
import Image2D from "./Image2D";
import World3D from "./World3D";
import { initializePointsProgram, renderPoints } from "./Image2D/points";
import { Highlighter } from "./World3D/highlighter";
import { render3js, setup3js } from "./World3D/setup";
import ExtrinsicsControls from "./ExtrinsicsControls";

export default function App() {
  /* Three.js essentials */
  const scene = useMemo(() => new THREE.Scene(), []);
  // export const camera = useMemo(() => new THREE.OrthographicCamera(), []);
  const camera = useMemo(
    () =>
      new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      ),
    []
  );

  /* Singletons */
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointCloud = useMemo(() => new THREE.Points(), []);
  const extrinsicsHelper = useMemo(() => new THREE.Group(), []);
  const highlighter = useMemo(() => new Highlighter(scene), [scene]);

  /* State */
  const [gl, setGl] = useState<WebGL2RenderingContext | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [zoneVertices, setZoneVertices] = useState<THREE.Mesh[]>([]); // Cube indicators for the zone vertices
  const [zoneLines, setZoneLines] = useState<THREE.Line[]>([]); // Lines connecting the zone vertices
  const [xzVertices, setXZVertices] = useState<number[][]>([]); // Three.js World XZ coordinates of the zone vertices
  const [extrinsics, setExtrinsics] = useState({
    translation: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: -2.5, z: -4.5 },
  });

  // Groups
  const singletons = {
    scene,
    camera,
    raycaster,
    pointCloud,
    extrinsicsHelper,
    highlighter,
  };
  const state = {
    renderer,
    setRenderer,
    controls,
    setControls,
    zoneVertices,
    setZoneVertices,
    zoneLines,
    setZoneLines,
    xzVertices,
    setXZVertices,
    extrinsics,
    setExtrinsics,
  };
  const world3DProps = { singletons, state };

  async function startDrawing() {
    if (!gl) return;

    /* Initialize 2D */
    const { pointsProgram, pointsVao } = await initializePointsProgram(gl);
    gl.enable(gl.DEPTH_TEST);

    /* Initialize 3D */
    setup3js(world3DProps);

    function render() {
      if (!gl) return;
      renderPoints(gl, pointsProgram, pointsVao);
      render3js(world3DProps);
      requestAnimationFrame(render);
    }
    render();
  }

  useEffect(() => {
    startDrawing();
  }, [gl]);

  return (
    <>
      <div className="relative flex flex-col">
        <Image2D setGl={setGl} />
        <Controls world3DProps={world3DProps} />
      </div>
      <ExtrinsicsControls world3DProps={world3DProps} />
      <World3D {...world3DProps} />
    </>
  );
}
