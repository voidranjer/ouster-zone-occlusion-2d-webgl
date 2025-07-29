#version 300 es
#ifdef GL_ES
precision highp float;
#endif

in float v_depth;
out vec4 FragColor;

void main() {
  FragColor = vec4(v_depth, v_depth, v_depth, 1.0);
}
