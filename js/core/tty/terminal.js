// Copyright 2014-2015 runtime.js project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
var keyboard = require('../keyboard');
var printer = require('./printer');
var LineEditor = require('./line-editor');

exports.color = printer.color;
exports.print = printer.print;
exports.moveOffset = printer.moveOffset;
exports.moveTo = printer.moveTo;

var isReading = false;

exports.read = function(cb) {
  if (isReading) {
    throw new Error('nested terminal read is not allowed');
  }

  var editor = new LineEditor();
  isReading = true;

  function addinput(keyinfo) {
    switch (keyinfo.type) {
    case 'character':
      printer.print(keyinfo.character);
      cb(keyinfo.character);
      keyboard.onKeydown.remove(addinput);
      break;
    case 'backspace':
      break;
    case 'enter':
      printer.print('\n');
      isReading = false;
      setImmediate(function() {
        cb('\n');
      });
      keyboard.onKeydown.remove(addinput);
      break;
    }
  }

  keyboard.onKeydown.add(addinput);
  editor.drawCursor();
};

exports.readLine = function(cb) {
  if (isReading) {
    throw new Error('nested terminal read is not allowed');
  }

  var editor = new LineEditor();
  isReading = true;

  function addinput(keyinfo) {
    switch (keyinfo.type) {
    case 'kpleft':
      editor.moveCursorLeft();
      break;
    case 'kpright':
      editor.moveCursorRight();
      break;
    case 'character':
      editor.putChar(keyinfo.character);
      break;
    case 'backspace':
      editor.removeChar();
      break;
    case 'enter':
      editor.removeCursor();
      printer.print('\n');
      isReading = false;
      setImmediate(function() {
        cb(editor.getText());
      });
      keyboard.onKeydown.remove(addinput);
      break;
    }
  }

  keyboard.onKeydown.add(addinput);
  editor.drawCursor();
};
