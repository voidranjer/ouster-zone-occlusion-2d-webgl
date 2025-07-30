#version 300 es
layout (location = 0) in vec3 a_position;
layout (location = 1) in float a_reflectivity;

uniform vec2 u_xzVertices[4];

out vec3 v_color;

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
  gl_Position = vec4(a_position, 1.0);
  gl_PointSize = 2.0; // make this dynamic based on canvas size (from uniform)

  vec2 point = vec2(a_position.x, a_position.z);

  // TODO: num_verts [4] should not be hardcoded
  // Set a max value, and have another uniform provide the actual number (should be <max)
  if (isInside(point, u_xzVertices, 4)) {
    v_color = vec3(a_reflectivity, 0.5, 0.0);
  } else {
    v_color = vec3(a_reflectivity);
  }
}
