/**
 * learn_webgl_console_messages.js, By Wayne Brown, Fall 2015
 *
 * A class to track and display messages. Messages are always displayed
 * to the Javascript console window. For webgl directive applications
 * the messages are also displayed to the information textarea.
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

/**
 * A class for storing information messages for Learn_webgl applications.
 *
 * @param context_id The ID of the <div> element to display messages
 * @constructor
 */
var LearnWebglConsoleMessages = function (context_id) {

  var self = this;
  var webgl;   // Boolean: true if there is a Learn_webgl application.
  var console_id;  // The id of the <div> element to display messages.
  var errors_are_visible;   // Boolean: if true, display error messages.
  var warnings_are_visible; // Boolean: if true, display warning messages.
  var info_are_visible;     // Boolean: if true, display info messages.
  var number_messages;        // Integer: the number of messages stored.
  var error_messages;         // Array of strings
  var warning_messages;       // Array of strings
  var info_messages;          // Array of strings
  var error_messages_order;   // Array of integer indexes
  var warning_messages_order; // Array of integer indexes
  var info_messages_order;    // Array of integer indexes
  var messages;               // All messages in one string

  //-----------------------------------------------------------------------
  /**
   *
   * @param value
   */
  self.showErrors = function (value) {
    errors_are_visible = value;
    _buildDisplay();
    _updateScreen();
  };

  //-----------------------------------------------------------------------
  self.showWarnings = function (value) {
    warnings_are_visible = value;
    _buildDisplay();
    _updateScreen();
  };

  //-----------------------------------------------------------------------
  self.showInfo = function (value) {
    info_are_visible = value;
    _buildDisplay(self);
    _updateScreen(self);
  };

  //-----------------------------------------------------------------------
  self.displayError = function (error_message) {
    if (webgl) {
      error_messages.push(error_message);
      error_messages_order.push(number_messages);
      _addError(error_message);
      number_messages += 1;
      _buildDisplay();
      _updateScreen();
    }
    console.log("ERROR: " + error_message);
  };

  //-----------------------------------------------------------------------
  self.displayWarning = function (warning_message) {
    if (webgl) {
      warning_messages.push(warning_message);
      warning_messages_order.push(number_messages);
      _addWarning(warning_message);
      number_messages += 1;
      _buildDisplay();
      _updateScreen();
    }
    console.log("WARNING: " + warning_message);
  };

  //-----------------------------------------------------------------------
  self.displayInfo = function (info_message) {
    if (webgl) {
      info_messages.push(info_message);
      info_messages_order.push(number_messages);
      _addInfo(info_message);
      number_messages += 1;
      _buildDisplay();
      _updateScreen();
    }
    console.log(info_message);
  };

  //-----------------------------------------------------------------------
  self.clearMessages = function () {
    if (webgl) {
      number_messages = 0;
      messages = "";
      error_messages = [];
      error_messages_order = [];
      warning_messages = [];
      warning_messages_order = [];
      info_messages = [];
      info_messages_order = [];
      _updateScreen();
    }
  }

  //-----------------------------------------------------------------------
  function _addError(error_message) {
    if (errors_are_visible) {
      messages += '<div class="webgl_errorMessages">' + error_message + '</div>';
    }
  }

  //-----------------------------------------------------------------------
  function _addWarning(warning_message) {
    if (warnings_are_visible) {
      messages += '<div class="webgl_warningMessages">' + warning_message + '</div>';
    }
  }

  //-----------------------------------------------------------------------
  function _addInfo(info_message) {
    if (info_are_visible) {
      messages += '<div class="webgl_infoMessages">' + info_message + '</div>';
    }
  }

  //-----------------------------------------------------------------------
  function _buildDisplay() {
    var n = 0;
    var e = 0;
    var w = 0;
    var i = 0;
    messages = "";
    while (n < number_messages) {
      if (n == error_messages_order[e]) {
        _addError(error_messages[e]);
        e += 1;
      } else if (n == warning_messages_order[w]) {
        _addWarning(warning_messages[w]);
        w += 1;
      } else if (n == info_messages_order[i]) {
        _addInfo(info_messages[i]);
        i += 1;
      }
      n += 1;
    }
  }

  //-----------------------------------------------------------------------
  function _updateScreen() {
    $("#" + console_id).html(messages);
  }

  //-----------------------------------------------------------------------
  // Constructor

  if (context_id === undefined) {
    webgl = false;
  } else {
    webgl = true;
    console_id = context_id + "_webgl_output_div";
    errors_are_visible = true;
    warnings_are_visible = true;
    info_are_visible = true;
    number_messages = 0;
    this.clearMessages();
  }


};

