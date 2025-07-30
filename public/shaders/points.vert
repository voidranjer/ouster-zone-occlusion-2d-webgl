#version 300 es
layout (location = 0) in vec3 a_position;

out vec3 v_color;

void main() {
  gl_Position = vec4(a_position, 1.0);
  gl_PointSize = 2.0; // make this dynamic based on canvas size (from uniform)

    v_color = vec3(a_position.z);
}
