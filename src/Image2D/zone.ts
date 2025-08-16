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
    zoneVao
  }
}

export function renderZone(gl: WebGL2RenderingContext, program: WebGLProgram, vao: WebGLVertexArrayObject) {
  gl.useProgram(program);
  gl.bindVertexArray(vao);

  const skyscrapers: number[][] = [];
  
  xzVertices.forEach(anchor => {
    const clipSpaceAnchor = xzToClipSpace(anchor[0], anchor[1]);
    skyscrapers.push([clipSpaceAnchor[0], -1, clipSpaceAnchor[1]]);
    skyscrapers.push([clipSpaceAnchor[0], 1, clipSpaceAnchor[1]]);
  });

  const zoneVertices = new Float32Array(skyscrapers.flat());

  gl.bufferData(gl.ARRAY_BUFFER, zoneVertices, gl.DYNAMIC_DRAW); // TODO: bad practice. minimize copying to VBO from RAM (move out of animate func)
  gl.drawArrays(gl.LINES, 0, skyscrapers.length);
}
