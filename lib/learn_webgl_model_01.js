/**
 * learn_webgl_model.js, By Wayne Brown, Fall 2015
 *
 * A model is a collection of data that defines a 3D object.
 * The model data can come from a variety of sources. There are 3 sources
 * included here: 1) from .obj (and .mtl) files, 2) from ?? files,
 * or 3) from javascript code.
 *
 * The 4x4 matrices are stored in column-major order using an array of 32-bit
 * floating point numbers, which is what WebGL expects for transformation
 * matrices.
 *
 * The functions do not create new objects because in real-time graphics,
 * creating new objects slows things down.
 *
 * Function parameters are ordered in the same order an equivalent
 * assignment. For example, r = a*b, has parameters (r, a, b).
 * All matrix parameters are capital letters.
 *
 * The functions are defined inside an object to prevent pollution of
 * JavaScript's global address space. The functions contain no validation
 * of parameters, which makes them more efficient at run-time.
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
// To render a 3D object in WebGL, you need to render a set of triangles.
// The simplest definition of a triangle requires 3 points and the material
// properties of its surface.
//-------------------------------------------------------------------------
function Triangle() {
  this.vertices = []; // a list of 3 vertices
  this.material = null; // a Material object
}

//-------------------------------------------------------------------------
// A point in space can be rendered as part of a model.
// The simplest definition of a point requires 1 vertex and its material
// properties.
//-------------------------------------------------------------------------
function Point() {
  this.vertex = []; // a single vertex (x,y,z)
  this.material = null; // a Material object
}

//-------------------------------------------------------------------------
// A line segment in space can be rendered as part of a model.
// The simplest definition of a line segment requires 2 vertices and its
// material properties.
//-------------------------------------------------------------------------
function Line() {
  this.vertices = []; // a list of 2 vertices
  this.material = null; // a Material object
}

//-------------------------------------------------------------------------
// A model of a 3D object is defined as a set of triangles.
//-------------------------------------------------------------------------
function Model01(name) {
  this.name = name;
  this.triangle_list = [];
  this.line_list = [];
  this.point_list = [];
}

//-------------------------------------------------------------------------
// Material Object
//-------------------------------------------------------------------------

function ModelMaterial(material_name) {
  this.name = material_name;
  this.Ns = null;
  this.Ka = null;
  this.Kd = null;
  this.Ks = null;
  this.Ni = null;
  this.d = null;
  this.illum = null;
  this.map_Kd = null;
  this.textureMap = null;
}

//-------------------------------------------------------------------------
// StringParser: Parse a string of text and pull out values.
//-------------------------------------------------------------------------
var StringParser = function () {
  // Constructor
  // The string to parse.
  this.str = null;
  // The current position in the string to be processed.
  this.index = null;

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Initialize StringParser object
  this.init = function (str) {
    this.str = str;
    this.index = 0;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.restart = function () {
    this.index = 0;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.isDelimiter = function (c) {
    return (
      c === ' ' ||
      c === '\t' ||
      c === '(' ||
      c === ')' ||
      c === '"'  ||
      c === "'"
    );
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.skipDelimiters = function () {
    while (this.index < this.str.length &&
        this.isDelimiter(this.str.charAt(this.index))) {
      this.index += 1;
    }
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.getWordLength = function (start) {
    var i = start;
    while (i < this.str.length &&
        !this.isDelimiter(this.str.charAt(i))) {
      i += 1;
    }
    return i - start;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.skipToNextWord = function () {
    this.skipDelimiters();
    this.index += (this.getWordLength(this.index) + 1);
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.getWord = function () {
    var n, word;
    this.skipDelimiters();
    n = this.getWordLength(this.index);
    if (n === 0) {
      return null;
    }
    word = this.str.substr(this.index, n);
    this.index += (n + 1);

    return word;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.getInt = function () {
    var word = this.getWord();
    if (word) {
      return parseInt(word, 10);
    }
    return null;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.getFloat = function () {
    var word = this.getWord();
    if (word) {
      return parseFloat(word);
    }
    return null;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Parses next 'word' into a series of integers.
  // Assumes the integers are separated by a slash (/).
  this.getIndexes = function (indexes) {
    var j, word, indexesAsStrings;
    word = this.getWord();
    if (word) {
      // The face indexes are vertex/texture/normal
      indexes[0] = -1;
      indexes[1] = -1;
      indexes[2] = -1;

      indexesAsStrings = word.split("/");
      for (j = 0; j < indexesAsStrings.length; j += 1) {
        indexes[j] = parseInt(indexesAsStrings[j], 10);
      }
      return true;
    }
    return false;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  this.getRestOfLine = function () {
    return this.str.substr(this.index);
  };

};

//=========================================================================
// Create one or more 3D models from .OBJ data.
// Returns an array of Model objects.
//=========================================================================
/**
 * @param model_description String containing the model data
 * @param out An object that knows where to display output messages
 * @return a dictionary of models. The model name is the key.
 */
function getMaterialFileNamesFromOBJ(model_description) {
  var sp, lines, which_line, command, material_filename_list;

  material_filename_list = [];

  // Create StringParser
  sp = new StringParser();

  // Break up the input into individual lines of text.
  lines = model_description.split('\n');

  for (which_line = 0; which_line < lines.length; which_line += 1) {

    sp.init(lines[which_line]);
    command = sp.getWord();

    if (command) {
      switch (command) {
      case 'mtllib': // Save the material data filename for later retrieval
        material_filename_list.push(sp.getWord());
        break;
      }
    }
  }

  return material_filename_list;
}

//=========================================================================
// Create one or more 3D models from .OBJ data.
// Returns an array of Model objects.
//=========================================================================
/**
 * @param model_description String containing the model data
 * @param materials_dictionary Dictionary of material objects
 * @param out An object that knows where to display output messages
 * @return a dictionary of models. The model name is the key.
 */
function createModelsFromOBJ(model_description, materials_dictionary, out) {

  var model_dictionary = {};
  var z_factor = 1.0;

  //-----------------------------------------------------------------------
  function parse_face(sp, model, material_file, material, vertices) {
    var index, index_list, numberTriangles, triangle, n, model_materials;

    // Get the indexes of the vertices that define the face
    index_list = [];
    index = sp.getWord();
    while (index) {
      index_list.push(index);
      index = sp.getWord();
    }

    // Create the face triangles.
    numberTriangles = index_list.length - 2;
    n = 1;
    while (n <= numberTriangles) {
      // Add a triangle to the model definition
      triangle = new Triangle();
      model_materials = materials_dictionary[material_file];
      triangle.material = model_materials[material];
      triangle.vertices.push(vertices[index_list[0]]);
      triangle.vertices.push(vertices[index_list[n]]);
      triangle.vertices.push(vertices[index_list[n + 1]]);

      model.triangle_list.push(triangle);

      n += 1; // if there is more than one triangle
    }
  }

  //-----------------------------------------------------------------------
  function parse_points(sp, model, material_file, material, vertices) {
    var index, point, model_materials;

    // Get the indexes of the vertices that define the point(s)
    index = sp.getWord();
    while (index) {
      // Add a point to the model definition
      point = new Point();
      model_materials = materials_dictionary[material_file];
      point.material = model_materials[material];
      point.vertex.push(vertices[index]);

      model.point_list.push(point);

      index = sp.getWord();
    }
  }

  //-----------------------------------------------------------------------
  function parse_lines(sp, model, material_file, material, vertices) {
    var start_index, end_index, line, model_materials;

    // Get the indexes of the vertices that define the point(s)
    start_index = sp.getWord();
    end_index = sp.getWord();
    while (end_index) {
      // Add a point to the model definition
      line = new Line();
      model_materials = materials_dictionary[material_file];
      line.material = model_materials[material];
      line.vertices.push(vertices[start_index]);
      line.vertices.push(vertices[end_index]);

      model.line_list.push(line);

      start_index = end_index;
      end_index = sp.getWord();
    }
  }

  //-----------------------------------------------------------------------
  function create_models() {
    var sp, lines, which_line, command, model_name, current_model,
      current_material_file, current_material, vertices, x, y, z,
      dot_position;

    // Create StringParser
    sp = new StringParser();

    // Break up the input into individual lines of text.
    lines = model_description.split('\n');

    // The vertices are broken into sections for each model, but face
    // indexes for vertices are global for the entire vertex list.
    // Therefore, keep a single list of vertices for all models.
    vertices = [];
    // OBJ vertices are indexed starting at 1 (not 0).
    vertices.push([]);  // empty vertex for [0].

    for (which_line = 0; which_line < lines.length; which_line += 1) {

      sp.init(lines[which_line]);

      command = sp.getWord();

      if (command) {

        switch (command) {
          case '#':
            break; // Skip comments

          case 'mtllib': // Save the material data filename for later retrieval
            current_material_file = sp.getWord();
            // Remove the filename extension
            dot_position = current_material_file.lastIndexOf('.');
            if (dot_position > 0) {
              current_material_file = current_material_file.substr(0, dot_position);
            }
            break;

          case 'o':
          case 'g': // Read Object name and create a new Model
            model_name = sp.getWord();
            current_model = new Model01(model_name);
            model_dictionary[model_name] = current_model;
            break;

          case 'v':  // Read vertex
            x = sp.getFloat();
            y = sp.getFloat();
            z = sp.getFloat() * z_factor;
            vertices.push(new Float32Array([x, y, z]));
            break;

          case 'p':  // Read one or more points
            parse_points(sp, current_model, current_material_file, current_material, vertices);
            break;

          case 'l':  // Read one or more lines
            parse_lines(sp, current_model, current_material_file, current_material, vertices);
            break;

          case 'usemtl': // Material name - future faces have this material
            current_material = sp.getWord();
            break;

          case 'f': // Read face, which may contain multiple triangles
            parse_face(sp, current_model, current_material_file, current_material, vertices);
            break;

        } // end switch
      } // end of if (command)
    }// end looping over each line

    return true;

  }

  //------------------------------------------------------------------------
  // body of create_model_from_obj()

  if (!model_description) {
    out.displayError('Model data for ' + model_description + ' is empty.');
    return [null, null];
  }

  create_models();

  // Display the models that were created to the console window.
  // This can be comments out is you don't want the confirmation.
  out.displayInfo('Created models: ' + Object.keys(model_dictionary));

  return model_dictionary;
}

//=========================================================================
// Class for creating material properties for a model from OBJ models
//=========================================================================
/**
 * For OBJ model definitions, material properties are defined in a separate
 * file. This class will parse the text data in an MTL file and return
 * a dictionary of material properties. The keys are the property names.
 *
 * @param data_string The text of a MTL file.
 * @returns dictionary { materialName: ModelMaterial }
 */
function createObjModelMaterials(data_string) {
  var material_dictionary;

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function parseRGB(sp) {
    var color;

    color = new Float32Array(4);

    color[0] = sp.getFloat();
    color[1] = sp.getFloat();
    color[2] = sp.getFloat();
    color[3] = sp.getFloat();

    // if there was no alpha value, make the color opaque.
    if (!color[3]) {
      color[3] = 1.0;
    }

    return color;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function parseDefinition(data_string) {
    var lineIndex, sp, command, lines, material_name, current_material,
        dot_position;

    current_material = null;

    // Break up into lines and store them as array
    lines = data_string.split('\n');

    sp = new StringParser();

    for (lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {

      sp.init(lines[lineIndex]);

      command = sp.getWord();

      if (command) {

        switch (command) {
        case '#':  // Skip comments
          break;

        case 'newmtl':  // Start a new material definition.
          material_name = sp.getWord();
            // Remove the filename extension
          dot_position = material_name.lastIndexOf('.');
          if (dot_position > 0) {
            material_name = material_name.substr(0, dot_position);
          }

          current_material = new ModelMaterial(material_name);
          material_dictionary[material_name] = current_material;
          break;

        case 'Ns':  //
          current_material.Ns = sp.getFloat();
          break;

        case 'Ka':  // Read the ambient color
          current_material.Ka = parseRGB(sp);
          break;

        case 'Kd':  // Read the diffuse color
          current_material.Kd = parseRGB(sp);
          break;

        case 'Ks':  // Read the specular color
          current_material.Ks = parseRGB(sp);
          break;

        case 'Ni':  // Read the specular color
          current_material.Ni = sp.getFloat();
          break;

        case 'd':  // Read the ???
          current_material.illum = sp.getFloat();
          break;

        case 'illum':  // Read the illumination coefficient
          current_material.illum = sp.getInt();
          break;

        case 'map_Kd': // Read the name of the texture map image
          current_material.map_Kd = sp.getRestOfLine();
          break;
        } // end switch
      }
    } // end for-loop for processing lines
  // end parseDefinition
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // body of CreateModelMaterials
  material_dictionary = {};

  parseDefinition(data_string);

  return material_dictionary;
}
