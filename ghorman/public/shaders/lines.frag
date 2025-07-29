#version 300 es
#ifdef GL_ES
precision highp float;
#endif

out vec4 FragColor;

void makeCircle() {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(gl_PointCoord, center);

  // Create smooth circle with anti-aliasing
  float alpha = 1.0 - smoothstep(0.4, 0.5, dist);

  if (alpha < 0.01) {
    discard;
  }
}

void main() {
  // makeCircle();
  FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
