import { FLOAT32_SIZE } from '@src/lib/constants';
import { compileShader, createProgram } from '@src/lib/utils';
import { xzVertices, xzToClipSpace } from '@src/World3D';

export async function initializeZoneProgram(gl: WebGL2RenderingContext) {
  const zoneVertexShader = await compileShader(gl, 'shaders/zone.vert', gl.VERTEX_SHADER);
  const zoneFragmentShader = await compileShader(gl, 'shaders/zone.frag', gl.FRAGMENT_SHADER);
  const zoneProgram = createProgram(gl, zoneVertexShader, zoneFragmentShader)!;
  
  const zoneVao = gl.createVertexArray();
  const zoneVbo = gl.createBuffer();
  gl.bindVertexArray(zoneVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, zoneVbo);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOAT32_SIZE * 3, 0);
  gl.enableVertexAttribArray(0);

  return {
    zoneProgram,
    zoneVao,
    zoneVbo
  }
}

export function renderZone(gl: WebGL2RenderingContext, program: WebGLProgram, vao: WebGLVertexArrayObject, vbo: WebGLBuffer) {
  if (xzVertices.length === 0) return;

  const skyscrapers: number[][] = [];

  xzVertices.forEach(anchor => {
    const clipSpaceAnchor = xzToClipSpace(anchor[0], anchor[1]);
    skyscrapers.push([clipSpaceAnchor[0], -1, clipSpaceAnchor[1]]);
    skyscrapers.push([clipSpaceAnchor[0], 1, clipSpaceAnchor[1]]);
  });

  const zoneVertices = new Float32Array(skyscrapers.flat());

  // Important: Explicitly bind the VBO buffer before uploading data
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, zoneVertices, gl.DYNAMIC_DRAW);
  
  // Important: Explicitly bind the VAO before drawing
  gl.bindVertexArray(vao);
  gl.useProgram(program);
  gl.drawArrays(gl.LINES, 0, skyscrapers.length);
}
