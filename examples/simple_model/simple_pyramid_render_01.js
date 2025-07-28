/**
 * learn_webgl_render_01.js, By Wayne Brown, Fall 2015
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

// Global definitions used in this code:
//var Float32Array, Uint16Array, parseInt, parseFloat, console;

//-------------------------------------------------------------------------
// Build, create, copy and render 3D objects specific to a particular
// model definition and particular WebGL shaders.
//-------------------------------------------------------------------------
var SceneSimplePyramidRender = function (learn, vshaders_dictionary,
                                fshaders_dictionary, models, controls) {

  var self = this;

  // Private variables
  var canvas_id = learn.canvas_id;
  var out = learn.out;

  var gl = null;
  var program = null;

  var matrix = new Learn_webgl_matrix();
  var transform = matrix.create();
  var projection = matrix.createOrthographic(-1,1,-1,1,-1,1);
  var rotate_x_matrix = matrix.create();
  var rotate_y_matrix = matrix.create();
  var pyramid = null;
  var events = null;

  //-----------------------------------------------------------------------
  self.render = function () {

    // Clear the entire canvas window background with the clear color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Build individual transforms
    matrix.rotate(rotate_x_matrix, self.angle_x, 1, 0, 0);
    matrix.rotate(rotate_y_matrix, self.angle_y, 0, 1, 0);

    // Combine the transforms into a single transformation
    matrix.multiplySeries(transform, projection, rotate_x_matrix, rotate_y_matrix);

    // Render the model
    pyramid.render(gl, transform);
  };

  //-----------------------------------------------------------------------
  self.delete = function () {

    // Clean up shader programs
    gl.deleteShader(program.vShader);
    gl.deleteShader(program.fShader);
    gl.deleteProgram(program);

    // Delete each model's VOB
    pyramid.delete(gl);

    // Remove all event handlers
    events.removeAllEventHandlers();

    // Disable any animation
    self.animate_active = false;
  };

  //-----------------------------------------------------------------------
  // Object constructor. One-time initialization of the scene.

  // Public variables that will possibly be used or changed by event handlers.
  self.canvas = null;
  self.angle_x = 0.0;
  self.angle_y = 0.0;
  self.animate_active = true;

  // Get the rendering context for the canvas
  self.canvas = learn.getCanvas(canvas_id);
  if (self.canvas) {
    gl = learn.getWebglContext(self.canvas);
  }
  if (!gl) {
    return null;
  }

  // Set up the rendering program and set the state of webgl
  program = learn.createProgram(gl, vshaders_dictionary["shader01"], fshaders_dictionary["shader01"]);

  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

  // Create a simple model of a pyramid
  var pyramid_model = CreatePyramid();
  var pyramid_color = new Float32Array([1.0, 0.0, 0.0, 1.0]);

  // Create Buffer Objects for the model
  pyramid = new SimpleModelRender_01(gl, program, pyramid_model, pyramid_color, out);

  // Set up callbacks for user and timer events
  events = new SimpleEvents_01(self, controls, canvas_id);
  events.animate();
};

