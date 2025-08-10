#!/usr/bin/env node

/*
Modern JavaScript execution tracer for Interactive Coding Tutor
Replaces the legacy jslogger.js to work with Node.js v24+ and ECMAScript 2025

This version uses modern Node.js capabilities instead of the deprecated V8 Debug API.
Focus: Simple execution tracing for educational purposes without complex debugging features.
*/

"use strict";

var vm = require("vm");
var util = require("util");
var fs = require("fs");
var _ = require("underscore");

var log = console.warn; // use stderr because stdout is being captured in the trace

var argv = require("minimist")(process.argv.slice(2));

var IGNORE_GLOBAL_VARS = {
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
  // Node.js globals
  global: true,
  process: true,
  Buffer: true,
  setImmediate: true,
  clearImmediate: true,
  __dirname: true,
  __filename: true,
  exports: true,
  module: true,
  require: true,
  console: true,
  setTimeout: true,
  clearTimeout: true,
  setInterval: true,
  clearInterval: true,
};

var MAX_EXECUTED_LINES = 1000;
var executed_lines = 0;

var trace = [];

// Simple execution state tracker
var executionState = {
  lineNumber: 1,
  columnNumber: 1,
  scope: {},
  stack: [],
};

// Simplified execution tracer - capture basic execution flow
function traceExecution(code) {
  try {
    // Reset execution state
    executed_lines = 0;
    trace = [];

    // Add initial trace entry
    trace.push({
      line: 1,
      event: "step_line",
      func_name: "<module>",
      globals: {},
      ordered_globals: [],
      stack_to_render: [],
      heap: {},
      stdout: "",
    });

    // Simple evaluation - for educational purposes, we'll execute and capture final state
    var originalConsoleLog = console.log;
    var output = "";

    // Transform let/const to var for better variable tracking (educational simplification)
    var transformedCode = code
      .replace(/\blet\s+/g, "var ")
      .replace(/\bconst\s+/g, "var ");

    // Create a more comprehensive sandbox
    var sandbox = vm.createContext({
      console: {
        log: function () {
          var args = Array.prototype.slice.call(arguments);
          output += args.join(" ") + "\n";
          originalConsoleLog.apply(console, arguments);
        },
      },
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      Buffer: Buffer,
      process: process,
      // Add some common global functions
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,
    });

    // Execute the transformed code in the sandbox
    vm.runInContext(transformedCode, sandbox, { filename: "user_script.js" });

    // Restore console.log
    console.log = originalConsoleLog;

    // Add final trace entry
    trace.push({
      line: code.split("\n").length,
      event: "return",
      func_name: "<module>",
      globals: captureVariables(sandbox),
      ordered_globals: [],
      stack_to_render: [],
      heap: {},
      stdout: output,
    });

    return {
      code: code,
      trace: trace,
    };
  } catch (error) {
    // Handle execution errors
    trace.push({
      line: 1,
      event: "exception",
      exception_msg: error.message,
      globals: {},
      ordered_globals: [],
      stack_to_render: [],
      heap: {},
      stdout: "",
    });

    return {
      code: code,
      trace: trace,
    };
  }
}

// Capture variables from a scope (simplified)
function captureVariables(scope) {
  var vars = {};

  // Capture user-defined variables from the sandbox
  for (var key in scope) {
    if (
      !IGNORE_GLOBAL_VARS[key] &&
      typeof scope[key] !== "function" &&
      !key.startsWith("_") &&
      key !== "console"
    ) {
      vars[key] = serializeValue(scope[key]);
    }
  }

  return vars;
}

// Serialize a value for the trace
function serializeValue(value) {
  if (value === null) {
    return ["SPECIAL", null];
  }
  if (value === undefined) {
    return ["SPECIAL", "undefined"];
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (isNaN(value)) {
      return ["SPECIAL", "NaN"];
    }
    if (!isFinite(value)) {
      return ["SPECIAL", value > 0 ? "Infinity" : "-Infinity"];
    }
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "bigint") {
    return ["SPECIAL", value.toString() + "n"];
  }
  if (typeof value === "symbol") {
    return ["SPECIAL", value.toString()];
  }
  if (Array.isArray(value)) {
    return ["LIST"].concat(value.map(serializeValue));
  }
  if (typeof value === "object") {
    return ["INSTANCE", "Object"];
  }
  if (typeof value === "function") {
    return ["FUNCTION", value.name || "<anonymous>"];
  }

  return ["SPECIAL", typeof value];
}

// Main execution
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
    // Default JSON output for backend compatibility
    console.log(JSON.stringify(result));
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  traceExecution: traceExecution,
};
