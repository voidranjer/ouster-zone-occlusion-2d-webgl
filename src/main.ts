import { FLOAT32_SIZE } from './lib/constants';
import { render, setup as threejsSetup, xzVertices } from './threejs';
import { NUM_VERTICES, resize as threejsResize } from './threejs/eventHandlers';
import { compileShader, createProgram, fetchJsonFile, resize } from './lib/utils';
import './style.css'
import { xzToClipSpace } from './threejs/utils';

export const NUM_ROWS = 128;
export const NUM_COLS = 1024;
export const NUM_PIXELS = NUM_ROWS * NUM_COLS;

// Get canvas and webgl context
const canvas = document.getElementById('webgl-canvas')! as HTMLCanvasElement;
export const gl = canvas.getContext('webgl2')!;

async function main() {
  // Global GL settings
  gl.enable(gl.DEPTH_TEST);

  // Resize
  resize(gl, canvas);
  threejsResize();
  window.addEventListener('resize', () => {
    resize(gl, canvas);
    threejsResize();
  });

  /* --- Points --- */
  const pointsVertexShader = await compileShader(gl, 'shaders/points.vert', gl.VERTEX_SHADER);
  const pointsFragmentShader = await compileShader(gl, 'shaders/points.frag', gl.FRAGMENT_SHADER);
  const pointsProgram = createProgram(gl, pointsVertexShader, pointsFragmentShader)!;

  const pointsPayload: number[] = await fetchJsonFile('data/points.json');
  const reflectivityPayload: number[] = await fetchJsonFile('data/reflectivity.json');
  const rangePayload: number[] = await fetchJsonFile('data/range.json');

  const vao2D = gl.createVertexArray();
  gl.bindVertexArray(vao2D);

  const vboReflectivity2D = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboReflectivity2D);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(reflectivityPayload), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, FLOAT32_SIZE * 1, 0);
  gl.enableVertexAttribArray(0);

  const vboPoints2D = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboPoints2D);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsPayload.flat()), gl.STATIC_DRAW);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  gl.enableVertexAttribArray(1);

  const vboIndex2D = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboIndex2D);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array.from({length: NUM_PIXELS}, (_, idx) => idx)), gl.STATIC_DRAW);

  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, FLOAT32_SIZE * 1, 0);
  gl.enableVertexAttribArray(2);

  const vboRange = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboRange);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rangePayload.map(measurement => 
    (measurement === -1) ? -2 : measurement // cull zero values (infinite distance)
  )), gl.STATIC_DRAW);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, FLOAT32_SIZE * 1, 0);
  gl.enableVertexAttribArray(3);

  /* --- Zone --- */
  const zoneVertexShader = await compileShader(gl, 'shaders/zone.vert', gl.VERTEX_SHADER);
  const zoneFragmentShader = await compileShader(gl, 'shaders/zone.frag', gl.FRAGMENT_SHADER);
  const zoneProgram = createProgram(gl, zoneVertexShader, zoneFragmentShader)!;

  const zoneVao = gl.createVertexArray();
  const zoneVbo = gl.createBuffer();
  gl.bindVertexArray(zoneVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, zoneVbo);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  gl.enableVertexAttribArray(0);

  function animate() {
    // Clear background
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let xzVerticesLocation: WebGLUniformLocation | null;

    // Point Cloud
    gl.useProgram(pointsProgram);
    if (xzVertices.length === NUM_VERTICES) {
      xzVerticesLocation = gl.getUniformLocation(pointsProgram, "u_xzVertices");
      gl.uniform2fv(
        xzVerticesLocation,
        new Float32Array(xzVertices.flat())
      );
    }
    gl.bindVertexArray(vao2D);
    gl.drawArrays(gl.POINTS, 0, NUM_PIXELS);

    // Zones
    gl.useProgram(zoneProgram);
    gl.bindVertexArray(zoneVao);
    const skyscrapers: number[][] = [];
    xzVertices.forEach(anchor => {
      const clipSpaceAnchor = xzToClipSpace(anchor[0], anchor[1]);
      skyscrapers.push([clipSpaceAnchor[0], -1, clipSpaceAnchor[1]]);
      skyscrapers.push([clipSpaceAnchor[0], 1, clipSpaceAnchor[1]]);
    });
    const zoneVertices = new Float32Array(skyscrapers.flat());
    gl.bufferData(gl.ARRAY_BUFFER, zoneVertices, gl.DYNAMIC_DRAW); // TODO: bad practice. minimize copying to VBO from RAM (move out of animate func)
    gl.drawArrays(gl.LINES, 0, skyscrapers.length);

    render();
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

threejsSetup();
main();

