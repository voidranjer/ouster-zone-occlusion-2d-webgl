import { FLOAT32_SIZE, NUM_PIXELS, NUM_ZONE_VERTICES } from '@src/lib/constants';
import { compileShader, createProgram, fetchJsonFile } from '@src/lib/utils';
import { xzVertices } from '@src/World3D';

export async function initializePointsProgram(gl: WebGL2RenderingContext) {
  const pointsVertexShader = await compileShader(gl, 'shaders/points.vert', gl.VERTEX_SHADER);
  const pointsFragmentShader = await compileShader(gl, 'shaders/points.frag', gl.FRAGMENT_SHADER);
  const pointsProgram = createProgram(gl, pointsVertexShader, pointsFragmentShader)!;

  const pointsPayload: number[] = await fetchJsonFile('data/points.json');
  const reflectivityPayload: number[] = await fetchJsonFile('data/reflectivity.json');
  const rangePayload: number[] = await fetchJsonFile('data/range.json');

  const pointsVao = gl.createVertexArray();
  gl.bindVertexArray(pointsVao);

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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array.from({ length: NUM_PIXELS }, (_, idx) => idx)), gl.STATIC_DRAW);

  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, FLOAT32_SIZE * 1, 0);
  gl.enableVertexAttribArray(2);

  const vboRange = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboRange);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rangePayload.map(measurement =>
    (measurement === -1) ? -2 : measurement // cull zero values (infinite distance)
  )), gl.STATIC_DRAW);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, FLOAT32_SIZE * 1, 0);
  gl.enableVertexAttribArray(3);

  return {
    pointsProgram,
    pointsVao
  }
}

export function renderPoints(gl: WebGL2RenderingContext, program: WebGLProgram, vao: WebGLVertexArrayObject) {
  let xzVerticesLocation: WebGLUniformLocation | null;

  // Point Cloud
  gl.useProgram(program);
  if (xzVertices.length === NUM_ZONE_VERTICES) {
    xzVerticesLocation = gl.getUniformLocation(program, "u_xzVertices");
    gl.uniform2fv(
      xzVerticesLocation,
      new Float32Array(xzVertices.flat())
    );
  }
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.POINTS, 0, NUM_PIXELS);
}
