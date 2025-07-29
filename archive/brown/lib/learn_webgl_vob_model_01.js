/**
 * learn_webgl_vob_model_01.js, By Wayne Brown, Fall 2015
 *
 * Given
 *   - a model definition as defined in learn_webgl_model_01.js, and
 *   - specific shader programs: vShader01.vert, fShader01.frag
 * Perform the following tasks:
 *   1) Build appropriate Vertex Object Buffers (VOB's)
 *   2) Create GPU VOB's for the data and copy the data into the buffers.
 *   3) Render the VOB's
 */

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 C. Wayne Brown
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

//-------------------------------------------------------------------------
// Build, create, copy and render 3D objects specific to a particular
// model definition and particular WebGL shaders.
//-------------------------------------------------------------------------
var Learn_webgl_vob_model_01 = function (gl, program, model, out, controls) {

  // Variables to remember so the model can be rendered.
  var number_triangles = 0;
  var triangles_vertex_buffer_id = null;
  var triangles_color_buffer_id = null;

  var number_lines = 0;
  var lines_vertex_buffer_id = null;
  var lines_color_buffer_id = null;

  var number_points = 0;
  var points_vertex_buffer_id = null;
  var points_color_buffer_id = null;

  // Shader variables
  var a_Vertex = null;
  var a_Color = null;

  //-----------------------------------------------------------------------
  function _createGpuVob(gl, data) {
    // Create a buffer object
    var buffer_id;

    buffer_id = gl.createBuffer();
    if (!buffer_id) {
      out.displayError('Failed to create the buffer object for ' + model.name);
      return null;
    }

    // Make the buffer object the active buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_id);

    // Upload the data for this buffer object to the GPU.
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    return buffer_id;
  }

  //-----------------------------------------------------------------------
  function _buildVobBuffers() {
    var j, k, m, nv, nc, numberVertices, triangle, triangle_color, vertex,
      line, line_color, point, point_color, vertices3, colors4;

    // Build the buffers for the triangles
    if (model.triangle_list.length > 0) {
      number_triangles = model.triangle_list.length;
      numberVertices = number_triangles * 3;
      vertices3 = new Float32Array(numberVertices * 3);
      colors4 = new Float32Array(numberVertices * 4);

      nv = 0;
      nc = 0;
      for (j = 0; j < model.triangle_list.length; j += 1) {
        triangle = model.triangle_list[j];
        triangle_color = triangle.material.Kd;
        for (k = 0; k < 3; k += 1) {
          vertex = triangle.vertices[k];
          for (m = 0; m < 3; m += 1, nv += 1) {
            vertices3[nv] = vertex[m];
          }
          for (m = 0; m < 4; m += 1, nc += 1) {
            colors4[nc] = triangle_color[m];
          }
        }
      }

      triangles_vertex_buffer_id = _createGpuVob(gl, vertices3);
      triangles_color_buffer_id = _createGpuVob(gl, colors4);
    }

    // Build the buffers for the lines
    if (model.line_list.length > 0) {
      number_lines = model.line_list.length;
      numberVertices = number_lines * 2;
      vertices3 = new Float32Array(numberVertices * 3);
      colors4 = new Float32Array(numberVertices * 4);

      nv = 0;
      nc = 0;
      for (j = 0; j < model.line_list.length; j += 1) {
        line = model.line_list[j];
        line_color = line.material.Kd;
        for (k = 0; k < 2; k += 1) {
          vertex = line.vertices[k];
          for (m = 0; m < 3; m += 1, nv += 1) {
            vertices3[nv] = vertex[m];
          }
          for (m = 0; m < 4; m += 1, nc += 1) {
            colors4[nc] = line_color[m];
          }
        }
      }

      lines_vertex_buffer_id = _createGpuVob(gl, vertices3);
      lines_color_buffer_id = _createGpuVob(gl, colors4);
    }

    // Build the buffers for the points
    if (model.point_list.length > 0) {
      number_points = model.point_list.length;
      vertices3 = new Float32Array(number_points * 3);
      colors4 = new Float32Array(number_points * 4);

      nv = 0;
      nc = 0;
      for (j = 0; j < model.point_list.length; j += 1) {
        point = model.point_list[j];
        point_color = point.material.Kd;
        vertex = point.vertex;
        for (m = 0; m < 3; m += 1, nv += 1) {
          vertices3[nv] = vertex[m];
        }
        for (m = 0; m < 4; m += 1, nc += 1) {
          colors4[nc] = point_color[m];
        }
      }

      points_vertex_buffer_id = _createGpuVob(gl, vertices3);
      points_color_buffer_id = _createGpuVob(gl, colors4);
    }

    // Release these temporary arrays
    vertices3 = null;
    colors4 = null;
  }

  //-----------------------------------------------------------------------
  function _getLocationOfShaderVariables() {
    // Get the location of the shader variables
    a_Vertex = gl.getAttribLocation(program, 'a_Vertex');
    a_Color = gl.getAttribLocation(program, 'a_Color');
  }

  //-----------------------------------------------------------------------
  // These one-time tasks set up the rendering of the models.
  _buildVobBuffers();
  _getLocationOfShaderVariables();

  //-----------------------------------------------------------------------
  this.delete = function (gl) {
    if (number_triangles > 0) {
      gl.deleteBuffer(triangles_vertex_buffer_id);
      gl.deleteBuffer(triangles_color_buffer_id);
    }
    if (number_lines > 0) {
      gl.deleteBuffer(lines_vertex_buffer_id);
      gl.deleteBuffer(lines_color_buffer_id);
    }
    if (number_points > 0) {
      gl.deleteBuffer(points_vertex_buffer_id);
      gl.deleteBuffer(points_color_buffer_id);
    }
  };

  //-----------------------------------------------------------------------
  this.render = function (gl, transform_location, transform) {

    // Set the transform for all the faces, lines, and points
    gl.uniformMatrix4fv(transform_location, false, transform);

    if (number_triangles > 0) {
      // Activate the model's triangle vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, triangles_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Vertex);

      // Activate the model's triangle color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, triangles_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Color);

      // Draw all of the triangles
      gl.drawArrays(gl.TRIANGLES, 0, number_triangles * 3);
    }

    if (number_lines > 0) {
      // Activate the model's line vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, lines_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Vertex);

      // Activate the model's line color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, lines_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Color);

      // Draw all of the lines
      gl.drawArrays(gl.LINES, 0, number_lines * 2);
    }

    if (number_points > 0) {
      // Activate the model's vertex object buffer (VOB)
      gl.bindBuffer(gl.ARRAY_BUFFER, points_vertex_buffer_id);

      // Bind the vertices VOB to the 'a_Vertex' shader variable
      //var stride = self.vertices3[0].BYTES_PER_ELEMENT*3;
      gl.vertexAttribPointer(a_Vertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Vertex);

      // Activate the model's point color object buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, points_color_buffer_id);

      // Bind the colors VOB to the 'a_Color' shader variable
      gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Color);

      // Draw all of the lines
      gl.drawArrays(gl.POINTS, 0, number_points);
    }
  };

};
