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

#pragma once

const char INIT_JS[] = R"JAVASCRIPT(
// NOTE: This script is executed in every context automatically
var console = (function(undef) {
  var times = {};

  return {
    log: isolate.log,
    error: isolate.log,
    time: function(label) {
      times['l' + label] = Date.now();
    },
    timeEnd: function(label) {
      var time = times['l' + label];
      if ('undefined' === typeof time) {
        return;
      }

      var d = Date.now() - time;
      isolate.log(label + ': ' + d/1000 + 'ms' + '\n');
      times['l' + label] = undef;
    },
  };
})();

(function(__native) {
  "use strict";

  /**
   * Helper function to support IPC function calls
   */
  function RPC_CALL(fn, threadPtr, argsArray, promiseid) {
    if (null === fn) {
      // Invalid function call
      __native.callResult(false, threadPtr, promiseid, null);
      return;
    }

    var ret;
    try {
      ret = fn.apply(this, argsArray);
    } catch (err) {
      __native.callResult(false, threadPtr, promiseid, err);
      throw err;
    }

    if (ret instanceof Promise) {
      if (!ret.then) return;

      ret.then(function(result) {
        __native.callResult(true, threadPtr, promiseid, result);
      }, function(err) {
        __native.callResult(false, threadPtr, promiseid, err);
      }).catch(function(err) {
        __native.callResult(false, threadPtr, promiseid, err);
      });

      return;
    }

    if (ret instanceof Error) {
      __native.callResult(false, threadPtr, promiseid, ret);
    } else {
      __native.callResult(true, threadPtr, promiseid, ret);
    }
  };

  __native.installInternals({
    callWrapper: RPC_CALL,
  });
});
// No more code here
)JAVASCRIPT";
