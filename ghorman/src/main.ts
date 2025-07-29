import { FLOAT32_SIZE } from './lib/constants';
import { compileShader, createProgram, fetchTextFile, resize } from './lib/utils';
import './style.css'




async function main() {
  // Get canvas and webgl context
  const canvas = document.getElementById('webgl-canvas')! as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2')!;

  // Resize
  resize(gl, canvas);
  window.addEventListener('resize', () => {
    resize(gl, canvas);
  });

  // Shaders
  const vertexShader = await compileShader(gl, 'shaders/points.vert', gl.VERTEX_SHADER);
  const fragmentShader = await compileShader(gl, 'shaders/points.frag', gl.FRAGMENT_SHADER);

  // Program
  const program = createProgram(gl, vertexShader, fragmentShader)!;

  // Buffer
  const text = await fetchTextFile('data/points.txt');
  const coords = text.split('\n')
    .filter(txt => txt.trim())
    .map(txtCoord => txtCoord
      .split(' ')
      .map(s => parseFloat(s))
    );
  const points = coords.map(
    coord => [
      Math.atan2(coord[1], coord[0]) / Math.PI,
      coord[2],
      0
    ]
  )

  // const vertices = new Float32Array([
  //   -0.5, -0.5, 0,
  //   0.5, -0.5, 0,
  //   0, 0.5, 0
  // ]);
  const vertices = new Float32Array(points.flat());
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  gl.enableVertexAttribArray(0);
  gl.useProgram(program);


  function animate() {
    // Clear background
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.POINTS, 0, points.length);
    requestAnimationFrame(animate);
  }
  animate();

  // Cleanup
  window.onbeforeunload = () => {
    gl.deleteProgram(program);
    gl.deleteBuffer(vbo);
  };
}

main();
