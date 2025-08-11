#!/usr/bin/env node

/*
Simplified Stack-Aware JavaScript Execution Tracer
A simpler version that focuses on basic function call tracking
without complex instrumentation that breaks syntax
*/

"use strict";

var vm = require("vm");
var util = require("util");
var fs = require("fs");

var log = console.warn;
var argv = require("minimist")(process.argv.slice(2));

// Global state
var trace = [];
var output = "";
var currentLine = 1;
var callStack = [];
var frameIdCounter = 1;

var IGNORE_GLOBALS = {
  ArrayBuffer: true,
  Int8Array: true,
  Uint8Array: true,
  Uint8ClampedArray: true,
  Int16Array: true,
  Uint16Array: true,
  Int32Array: true,
  Uint32Array: true,
  Float32Array: true,
  Float64Array: true,
  DataView: true,
  Promise: true,
  Symbol: true,
  Map: true,
  Set: true,
  WeakMap: true,
  WeakSet: true,
  Proxy: true,
  Reflect: true,
  BigInt: true,
  BigInt64Array: true,
  BigUint64Array: true,
  global: true,
  process: true,
  Buffer: true,
  console: true,
  require: true,
  module: true,
  exports: true,
  __filename: true,
  __dirname: true,
  undefined: true,
  NaN: true,
  Infinity: true,
  isNaN: true,
  isFinite: true,
  parseFloat: true,
  parseInt: true,
  encodeURI: true,
  encodeURIComponent: true,
  decodeURI: true,
  decodeURIComponent: true,
  escape: true,
  unescape: true,
  __tracer: true,
  __currentLine: true,
};

function traceExecution(code) {
  try {
    // Reset state
    trace = [];
    output = "";
    currentLine = 1;
    callStack = [];
    frameIdCounter = 1;

    // Simple line-by-line instrumentation (much simpler approach)
    var lines = code.split("\n");
    var instrumentedLines = [];

    // Add tracer setup
    instrumentedLines.push("var __tracer = this.__tracer;");
    instrumentedLines.push("var __currentLine = 1;");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var lineNumber = i + 1;
      var originalLine = lines[i];

      // Skip empty lines and comments
      if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
        instrumentedLines.push(originalLine);
        continue;
      }

      // Add line tracking (only for non-trivial lines)
      if (
        line &&
        !line.match(/^\s*[{}]\s*$/) &&
        !line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^,}]+[,}]?\s*$/)
      ) {
        instrumentedLines.push(`__currentLine = ${lineNumber}; __tracer();`);
      }

      instrumentedLines.push(originalLine);
    }

    if (argv.dumpsrc) {
      log("=== INSTRUMENTED CODE ===");
      log(instrumentedLines.join("\n"));
      log("=== END INSTRUMENTED CODE ===");
    }

    // Create simple sandbox
    var sandbox = {
      console: {
        log: function (...args) {
          output += args.join(" ") + "\n";
        },
      },

      __tracer: function () {
        var globals = captureGlobals(sandbox);

        trace.push({
          line: currentLine,
          event: "step_line",
          func_name: "<module>",
          globals: globals,
          ordered_globals: Object.keys(globals),
          stack_to_render: [], // Keep empty for now, focus on getting basic execution working
          heap: {},
          stdout: output,
        });
      },

      set __currentLine(line) {
        currentLine = line;
      },
    };

    vm.createContext(sandbox);

    // Execute instrumented code
    vm.runInContext(instrumentedLines.join("\n"), sandbox, {
      filename: "user_script.js",
      timeout: 5000,
    });

    return {
      code: code,
      trace: trace,
    };
  } catch (error) {
    trace.push({
      line: currentLine,
      event: "exception",
      exception_msg: error.message,
      func_name: "<module>",
      globals: {},
      ordered_globals: [],
      stack_to_render: [],
      heap: {},
      stdout: output,
    });

    return {
      code: code,
      trace: trace,
    };
  }
}

function captureGlobals(scope) {
  var variables = {};

  for (var key in scope) {
    if (scope.hasOwnProperty(key) && !IGNORE_GLOBALS[key]) {
      try {
        variables[key] = serializeValue(scope[key]);
      } catch (e) {
        variables[key] = `<${typeof scope[key]}>`;
      }
    }
  }

  return variables;
}

function serializeValue(value) {
  if (value === null) return null;
  if (value === undefined) return undefined;

  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return value;

    case "function":
      return `<function ${value.name || "anonymous"}>`;

    case "object":
      if (Array.isArray(value)) {
        return value.map(serializeValue);
      } else {
        var obj = {};
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            obj[key] = serializeValue(value[key]);
          }
        }
        return obj;
      }

    default:
      return `<${typeof value}>`;
  }
}

function main() {
  var usrCod = "";

  if (argv.code) {
    usrCod = argv.code;
  } else if (argv._[0]) {
    usrCod = fs.readFileSync(argv._[0], "utf8");
  } else {
    console.error(
      'Error: No code provided. Use --code="..." or provide a filename.'
    );
    process.exit(1);
  }

  var result = traceExecution(usrCod);

  if (argv.jsondump) {
    console.log(JSON.stringify(result, null, 2));
  } else if (argv.prettydump) {
    console.log("Code:", result.code);
    console.log("Trace:");
    result.trace.forEach(function (step, i) {
      console.log(`Step ${i + 1}:`, step);
    });
  } else {
    console.log(JSON.stringify(result));
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  traceExecution: traceExecution,
};
