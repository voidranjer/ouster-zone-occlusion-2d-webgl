import { canvas, gl } from "./Image2D";

export function handleResize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

window.addEventListener("resize", () => {
  handleResize();
});