import { FLOAT32_SIZE } from './lib/constants';
import { render, setup as threejsSetup, xzVertices, } from './threejs';
import { resize as threejsResize } from './threejs/eventHandlers';
import { compileShader, createProgram, fetchJsonFile, glNormalize, resize } from './lib/utils';
import './style.css'

export const MAX_ROWS = 128;
export const MAX_COLS = 1024;

async function main() {
  // Get canvas and webgl context
  const canvas = document.getElementById('webgl-canvas')! as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2')!;

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

  const rangePayload: number[][] = await fetchJsonFile('data/range.json');
  const reflectivityPayload: number[][] = await fetchJsonFile('data/reflectivity.json');

  const points = rangePayload.map((row, rowIdx) => {
    const yCoord = -1 * glNormalize(rowIdx, MAX_ROWS);
    return row
      .map((measurement, colIdx) => {
        const xCoord = glNormalize(colIdx, MAX_COLS);
        const zCoord = (measurement === 0) ? -2 : measurement; // cull zero values (infinite distance)
        const reflectivity_measurement = Math.min(reflectivityPayload[rowIdx][colIdx] + 0.1, 1.0); // `+0.1` for brightness
        return [xCoord, yCoord, zCoord, reflectivity_measurement];
      });
  }).flat();

  const pointsVao = gl.createVertexArray();
  const pointsVbo = gl.createBuffer();
  gl.bindVertexArray(pointsVao);
  const pointsVertices = new Float32Array(points.flat());
  gl.bindBuffer(gl.ARRAY_BUFFER, pointsVbo);
  gl.bufferData(gl.ARRAY_BUFFER, pointsVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 4, 0);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, FLOAT32_SIZE * 4, FLOAT32_SIZE * 3);
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);

  /* --- Zone --- */
  // const zoneVertexShader = await compileShader(gl, 'shaders/zone.vert', gl.VERTEX_SHADER);
  // const zoneFragmentShader = await compileShader(gl, 'shaders/zone.frag', gl.FRAGMENT_SHADER);
  // const zoneProgram = createProgram(gl, zoneVertexShader, zoneFragmentShader)!;
  //
  // const xzVertices = JSON.parse(localStorage.getItem('xzVertices') ?? '[]') as number[][];
  // const skyscrapers: number[][] = [];
  // xzVertices.forEach(anchor => {
  //   skyscrapers.push([anchor[0], -1, -1]);
  //   skyscrapers.push([anchor[0], 1, -1]);
  //   // skyscrapers.push([anchor[0], -1, anchor[1]]);
  //   // skyscrapers.push([anchor[0], 1, anchor[1]]);
  // });
  // // skyscrapers.push(
  // //   [0, 0, -1],
  // // );
  // // console.log(skyscrapers);
  //
  // const zoneVao = gl.createVertexArray();
  // const zoneVbo = gl.createBuffer();
  // gl.bindVertexArray(zoneVao);
  // const zoneVertices = new Float32Array(skyscrapers.flat());
  // gl.bindBuffer(gl.ARRAY_BUFFER, zoneVbo);
  // gl.bufferData(gl.ARRAY_BUFFER, zoneVertices, gl.STATIC_DRAW);
  // gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  // gl.enableVertexAttribArray(0);



  function animate() {
    // Clear background
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Uniforms
    gl.useProgram(pointsProgram);
    const xzVerticesLocation = gl.getUniformLocation(pointsProgram, "u_xzVertices");
    const xzVertices = JSON.parse(localStorage.getItem('xzVertices') ?? '[]') as number[][];
    gl.uniform2fv(xzVerticesLocation, new Float32Array(xzVertices.flat()));
    gl.bindVertexArray(pointsVao);
    gl.drawArrays(gl.POINTS, 0, points.length);

    // gl.useProgram(zoneProgram);
    // gl.bindVertexArray(zoneVao);
    // gl.drawArrays(gl.LINES, 0, skyscrapers.length);


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
