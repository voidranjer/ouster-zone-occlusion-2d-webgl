import { render3js } from "@src/World3D";
import { handleResize } from "./eventHandlers";
import { initializePointsProgram, renderPoints } from "./points";

export const canvas = document.getElementById("image2d-canvas") as HTMLCanvasElement;
export const gl = canvas.getContext("webgl2")!;

export async function start() {
  const { pointsProgram, pointsVao } = await initializePointsProgram(gl);

  gl.enable(gl.DEPTH_TEST);
  
  handleResize();

  function animate() {
    renderPoints(gl, pointsProgram, pointsVao);
    render3js();
    requestAnimationFrame(animate);
  }
  animate();
}