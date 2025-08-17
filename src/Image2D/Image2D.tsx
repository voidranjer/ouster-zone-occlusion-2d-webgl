import { render3js } from "@/World3D";
import { handleResize } from "./eventHandlers";
import { initializePointsProgram, renderPoints } from "./points";
import { initializeZoneProgram, renderZone } from "./zone";


export async function start() {
  const canvas = document.getElementById("image2d-canvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2")!;

  const { pointsProgram, pointsVao } = await initializePointsProgram(gl);
  const { zoneProgram, zoneVao, zoneVbo } = await initializeZoneProgram(gl);

  gl.enable(gl.DEPTH_TEST);
  
  handleResize(gl, canvas);
  window.addEventListener("resize", () => {
  handleResize(gl, canvas);
});

  function animate() {
    // Clear background
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderPoints(gl, pointsProgram, pointsVao);
    renderZone(gl, zoneProgram, zoneVao, zoneVbo);
    render3js();
    requestAnimationFrame(animate);
  }
  animate();

  // Cleanup
  // TODO: incomplete. grep 'create' in the code - clean these up
  // window.onbeforeunload = () => {
  //   gl.deleteProgram(program);
  //   gl.deleteBuffer(pointsVbo);
  // };
}