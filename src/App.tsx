import { useEffect, useState } from "react";

import Controls from "./Controls";
import Image2D from "./Image2D";
import World3D from "./World3D";
import { initializePointsProgram, renderPoints } from "./Image2D/points";

export default function App() {
  const [gl, setGl] = useState<WebGL2RenderingContext | null>(null);

  async function initializeWebGL2Canvas() {
    if (!gl) return;

    const { pointsProgram, pointsVao } = await initializePointsProgram(gl);

    gl.enable(gl.DEPTH_TEST);

    function render() {
      if (!gl) return;
      renderPoints(gl, pointsProgram, pointsVao);
      requestAnimationFrame(render);
    }
    render();
  }

  /* WebGL2 Canvas 2D Initialization */
  useEffect(() => {
    initializeWebGL2Canvas();
  }, [gl]);

  return (
    <>
      <div className="relative flex flex-col">
        <Image2D setGl={setGl} />
        <Controls />
      </div>

      <World3D />
    </>
  )
}

