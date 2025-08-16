#version 300 es
layout (location = 0) in float a_reflectivity;
layout (location = 1) in vec3 a_position;
layout (location = 2) in float a_index;
layout (location = 3) in float a_range;

uniform vec2 u_xzVertices[4];

out vec3 v_color;

const int NUM_ROWS = 128;
const int NUM_COLS = 1024;

float normalizeToMinusOneToOne(int x, int minVal, int maxVal) {
    float t = float(x - minVal) / float(maxVal - minVal); // Normalize to [0, 1]
    return t * 2.0 - 1.0; // Map to [-1, 1]
}

bool isInside(vec2 point, vec2 polygon[4], int num_verts) {
  int intersections = 0;
  // WebGL2 allows dynamic loops, making the code much cleaner!
  for (int i = 0; i < num_verts; ++i) {
    vec2 p1 = polygon[i];
    // Use modulo to wrap around from the last vertex to the first
    vec2 p2 = polygon[(i + 1) % num_verts];

    if (((p1.y > point.y) != (p2.y > point.y))) {
      float x_intersection = (point.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
      if (point.x < x_intersection) {
        intersections++;
      }
    }
  }
  // Bitwise operators are supported in GLSL 3.00 es!
  return (intersections & 1) == 1;
}

void main() {
  float x = normalizeToMinusOneToOne(int(a_index) % NUM_COLS, 0, NUM_COLS - 1);
  float y = -1.0 * normalizeToMinusOneToOne(int(a_index) / NUM_COLS, 0, NUM_ROWS - 1);

  gl_Position = vec4(x, y, a_range, 1.0);
  gl_PointSize = 3.5; // TODO: make this dynamic based on canvas size (from uniform)

  vec2 point = vec2(a_position.x, a_position.z);

  if (isInside(point, u_xzVertices, 4)) {
    v_color = vec3(a_reflectivity, 0.5, 0.0);
  } else {
    v_color = vec3(a_reflectivity);
  }
}
