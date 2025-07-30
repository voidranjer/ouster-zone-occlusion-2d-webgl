#version 300 es
#ifdef GL_ES
precision highp float;
#endif

in vec3 v_color;
out vec4 FragColor;

void main() {
  FragColor = vec4(v_color, 1.0);
}
