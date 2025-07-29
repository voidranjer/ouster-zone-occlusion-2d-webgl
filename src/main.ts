import { FLOAT32_SIZE } from './lib/constants';
import { compileShader, createProgram, fetchJsonFile, fetchTextFile, glNormalize, resize } from './lib/utils';
import './style.css'




async function main() {
  // Get canvas and webgl context
  const canvas = document.getElementById('webgl-canvas')! as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2')!;

  // Global GL settings
  gl.enable(gl.DEPTH_TEST);

  // Resize
  resize(gl, canvas);
  window.addEventListener('resize', () => {
    resize(gl, canvas);
  });

  // Points
  const pointsVertexShader = await compileShader(gl, 'shaders/points.vert', gl.VERTEX_SHADER);
  const pointsFragmentShader = await compileShader(gl, 'shaders/points.frag', gl.FRAGMENT_SHADER);
  const pointsProgram = createProgram(gl, pointsVertexShader, pointsFragmentShader)!;
  // Buffer
  // const text = await fetchTextFile('data/points.txt');
  // const coords = text.split('\n')
  //   .filter(txt => txt.trim())
  //   .map(txtCoord => txtCoord
  //     .split(' ')
  //     .map(s => parseFloat(s))
  //   );
  // const points = coords.map(
  //   coord => [
  //     Math.atan2(coord[1], coord[0]) / Math.PI,
  //     coord[2],
  //     0
  //   ]
  // )

  const payload: number[][] = await fetchJsonFile('data/points.json');
  const MAX_ROWS = 128;
  const MAX_COLS = 227;
  const MAX_RANGE = 20000; // 200 meters

  const points = payload.map((row, rowIdx) => {
    const yCoord = -1 * glNormalize(rowIdx, MAX_ROWS);
    return row
      .map((measurement, colIdx) => {
        const xCoord = glNormalize(colIdx, MAX_COLS);
        // zero values (infinite distance). TODO: experiment with 'discard' on the Fragment Shader
        const zCoord = measurement === 0 ? 1 : glNormalize(measurement, MAX_RANGE);
        return [xCoord, yCoord, zCoord];
      });
  }).flat();


  const pointsVao = gl.createVertexArray();
  const pointsVbo = gl.createBuffer();
  gl.bindVertexArray(pointsVao);
  // const vertices = new Float32Array([
  //   -0.5, -0.5, 0,
  //   0.5, -0.5, 0,
  //   0, 0.5, 0
  // ]);
  const pointsVertices = new Float32Array(points.flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsVbo);
  gl.bufferData(gl.ARRAY_BUFFER, pointsVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  gl.enableVertexAttribArray(0);

  // Lines
  const linesVertexShader = await compileShader(gl, 'shaders/lines.vert', gl.VERTEX_SHADER);
  const linesFragmentShader = await compileShader(gl, 'shaders/lines.frag', gl.FRAGMENT_SHADER);
  const linesProgram = createProgram(gl, linesVertexShader, linesFragmentShader)!;
  // Buffer
  const lines = [
    [1, -0.1, 1], // bottom right
    [1, 0.1, 1], // top right
    [-1, 0.1, -1], // top left
    [-1, -0.1, -1] // bottom left
  ]
  const linesVertices = new Float32Array(lines.flat());
  const linesVao = gl.createVertexArray();
  const linesVbo = gl.createBuffer();
  gl.bindVertexArray(linesVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, linesVbo);
  gl.bufferData(gl.ARRAY_BUFFER, linesVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  gl.enableVertexAttribArray(0);


  function animate() {
    // Clear background
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(pointsProgram);
    gl.bindVertexArray(pointsVao);
    gl.drawArrays(gl.POINTS, 0, points.length);

    gl.useProgram(linesProgram);
    gl.bindVertexArray(linesVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, lines.length);

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

main();
