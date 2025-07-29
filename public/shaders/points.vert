#version 300 es
layout (location = 0) in vec3 a_position;

out float v_depth;

void main() {
  gl_Position = vec4(a_position, 1.0);
  gl_PointSize = 8.0; // make this dynamic based on canvas size (from uniform)
  v_depth = a_position.z;
}
