#!/usr/bin/env node

/*
Enhanced JavaScript execution tracer for Interactive Coding Tutor
Provides line-by-line execution tracing similar to Python Tutor's detailed visualization

This version instruments the JavaScript code to capture each line execution,
providing a detailed step-by-step trace for educational purposes.
*/

"use strict";

var vm = require("vm");
var util = require("util");
var fs = require("fs");
var _ = require("underscore");
var babelConfig = require("./babel-config");

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
  // Internal tracer variables
  __tracer: true,
  __trace: true,
  __output: true,
  __stepCount: true,
  __currentLine: true,
  __sandboxVars: true,
};

var MAX_EXECUTED_LINES = 1000;
var executed_lines = 0;

var trace = [];
var output = "";
var stepCount = 0;
var currentLine = 1;
var sandboxVars = {};

// Enhanced execution tracer with line-by-line instrumentation
function traceExecution(code) {
  try {
    // Reset execution state
    executed_lines = 0;
    trace = [];
    output = "";
    stepCount = 0;
    currentLine = 1;

    // Step 1: Babel transpilation for modern JavaScript features
    var workingCode = code;
    if (babelConfig.needsTranspilation(code)) {
      var babelResult = babelConfig.transpileCode(code);
      if (babelResult.success) {
        workingCode = babelResult.code;
        // TODO: Use source map for accurate line number mapping in future iterations
      } else {
        // Handle Babel transpilation errors
        trace.push({
          line: babelResult.error.line || 1,
          event: "exception",
          exception_msg: "Transpilation Error: " + babelResult.error.message,
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

    // Step 2: Transform let/const to var for better variable tracking (fallback)
    var transformedCode = workingCode
      .replace(/\blet\s+/g, "var ")
      .replace(/\bconst\s+/g, "var ");

    // Step 3: Create a modified code with variable assignments wrapped to track them
    var wrappedCode = wrapCodeForVariableTracking(transformedCode);

    // Step 4: Create enhanced sandbox with tracer function
    var sandbox = createEnhancedSandbox();

    // Step 5: Execute the wrapped code
    vm.runInContext(wrappedCode, sandbox, {
      filename: "user_script.js",
      timeout: 5000, // 5 second timeout
    });

    return {
      code: code,
      trace: trace,
    };
  } catch (error) {
    // Handle execution errors
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

// Wrap code to track variable assignments
function wrapCodeForVariableTracking(code) {
  var lines = code.split("\n");
  var wrappedLines = [];

  // Use the global __userVars from the sandbox instead of creating a new one
  wrappedLines.push("var __tracer = this.__tracer;");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    var lineNumber = i + 1;

    if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
      wrappedLines.push(lines[i]);
      continue;
    }

    // Process the line to wrap variable declarations and assignments
    var processedLine = processVariableLine(lines[i]);
    wrappedLines.push(processedLine);

    // Add tracer call AFTER each line (so variables are captured after assignment)
    wrappedLines.push(`__tracer(${lineNumber});`);
  }

  return wrappedLines.join("\n");
}

// Process a line to wrap variable declarations and assignments
function processVariableLine(line) {
  // Handle multiple variable declarations on one line
  var processedLine = line;

  // Replace var declarations with tracking
  processedLine = processedLine.replace(
    /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*/g,
    function (match, varName) {
      return `var ${varName} = __userVars.${varName} = `;
    }
  );

  // Also handle assignments to existing variables (but be careful not to double-wrap)
  if (!processedLine.includes("__userVars")) {
    processedLine = processedLine.replace(
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^=])/g,
      function (match, varName, rest) {
        if (
          !isBuiltinGlobal(varName) &&
          varName !== "__userVars" &&
          varName !== "__tracer"
        ) {
          return `${varName} = __userVars.${varName} = ${rest}`;
        }
        return match;
      }
    );
  }

  return processedLine;
}

// Instrument JavaScript code to add line-by-line tracing
function instrumentCode(codeLines) {
  var instrumentedLines = [];

  // Add tracer setup at the beginning
  instrumentedLines.push("var __tracer = this.__tracer;");
  instrumentedLines.push("var __varTracker = this.__varTracker;");

  for (var i = 0; i < codeLines.length; i++) {
    var line = codeLines[i].trim();
    var lineNumber = i + 1;

    // Skip empty lines and comments for instrumentation, but preserve original line
    if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
      instrumentedLines.push(codeLines[i]);
      continue;
    }

    // Add tracer call before each significant line
    instrumentedLines.push(`__tracer(${lineNumber});`);
    instrumentedLines.push(codeLines[i]);
  }

  return instrumentedLines.join("\n");
}

// Create enhanced sandbox with comprehensive context
function createEnhancedSandbox() {
  var originalConsoleLog = console.log;

  // Global variable storage for tracking user variables
  var globalUserVars = {};

  var sandbox = vm.createContext({
    // Console override to capture output
    console: {
      log: function () {
        var args = Array.prototype.slice.call(arguments);
        output += args.join(" ") + "\n";
        originalConsoleLog.apply(console, arguments);
      },
    },

    // Global user variables tracker
    __userVars: globalUserVars,

    // Tracer function to capture execution state
    __tracer: function (lineNumber) {
      currentLine = lineNumber;
      executed_lines++;

      if (executed_lines > MAX_EXECUTED_LINES) {
        throw new Error("Maximum execution limit exceeded (too many steps)");
      }

      // Get user variables from our global tracker
      var currentVars = {};
      for (var key in globalUserVars) {
        if (globalUserVars.hasOwnProperty(key)) {
          currentVars[key] = serializeValue(globalUserVars[key]);
        }
      }

      trace.push({
        line: lineNumber,
        event: "step_line",
        func_name: "<module>",
        globals: currentVars,
        ordered_globals: Object.keys(currentVars),
        stack_to_render: [],
        heap: {},
        stdout: output,
      });
    },

    // Variable tracker
    __varTracker: globalUserVars,

    // Standard JavaScript environment
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    Buffer: Buffer,
    process: process,

    // Built-in functions and objects
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

    // Additional commonly used globals
    undefined: undefined,
    null: null,
    true: true,
    false: false,
    Infinity: Infinity,
    NaN: NaN,
  });

  return sandbox;
}

// Capture variables from the sandbox context
function captureVariables(scope) {
  var vars = {};

  for (var key in scope) {
    if (
      scope.hasOwnProperty &&
      scope.hasOwnProperty(key) &&
      !IGNORE_GLOBAL_VARS[key] &&
      !key.startsWith("__") &&
      key !== "console" &&
      // Only include user-defined variables and functions
      !isBuiltinGlobal(key)
    ) {
      vars[key] = serializeValue(scope[key]);
    }
  }

  return vars;
}

// Check if a variable is a built-in global
function isBuiltinGlobal(varName) {
  var builtins = [
    "setTimeout",
    "setInterval",
    "clearTimeout",
    "clearInterval",
    "Buffer",
    "JSON",
    "Math",
    "Date",
    "Array",
    "Object",
    "String",
    "Number",
    "Boolean",
    "RegExp",
    "Error",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURIComponent",
    "decodeURIComponent",
    "undefined",
    "null",
    "true",
    "false",
    "Infinity",
    "NaN",
  ];
  return builtins.includes(varName);
}

// Enhanced value serialization for educational display
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
  if (typeof value === "object" && value.constructor === Object) {
    // Plain objects - serialize as instance with properties
    var objRepr = ["INSTANCE", "Object"];
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        objRepr.push([key, serializeValue(value[key])]);
      }
    }
    return objRepr;
  }
  if (typeof value === "object") {
    return ["INSTANCE", value.constructor ? value.constructor.name : "Object"];
  }
  if (typeof value === "function") {
    return ["FUNCTION", value.name || "<anonymous>"];
  }

  return ["SPECIAL", typeof value];
}

// Main execution function
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
