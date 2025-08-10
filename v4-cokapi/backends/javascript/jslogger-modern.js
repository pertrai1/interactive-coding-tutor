#!/usr/bin/env node

/*
Enhanced JavaScript execution tracer for Interactive Coding Tutor
Provides line-by-line execution tracing similar to Python Tutor's detailed visualization

This version instruments the JavaScript code to capture each line execution,
providing a detailed step-by-step trace for educational purposes.

LINE MAPPING SOLUTION:
- Original source code is preserved and returned to frontend for display
- During instrumentation, tracer calls use original line numbers directly
- Babel transpilation preserves source maps when needed
- Result: trace steps correspond exactly to original source lines in editor
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

    // Step 1: Apply line-by-line instrumentation to original code first
    var instrumentedOriginalCode = wrapCodeForVariableTracking(code);

    // Step 2: Check if transpilation is needed and apply it to the instrumented code
    var workingCode = instrumentedOriginalCode;
    var sourceMap = null;
    if (babelConfig.needsTranspilation(code)) {
      var babelResult = babelConfig.transpileCode(instrumentedOriginalCode);
      if (babelResult.success) {
        workingCode = babelResult.code;
        sourceMap = babelResult.map;
        // Store source map globally for line number mapping
        global.__sourceMap = sourceMap;
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

    // Step 3: Transform let/const to var for better variable tracking
    var transformedCode = workingCode
      .replace(/\blet\s+/g, "var ")
      .replace(/\bconst\s+/g, "var ");

    // Step 4: Create enhanced sandbox with tracer function
    var sandbox = createEnhancedSandbox();

    // Step 5: Execute the transformed code (already instrumented)
    vm.runInContext(transformedCode, sandbox, {
      filename: "user_script.js",
      timeout: 5000, // 5 second timeout
    });

    return {
      code: code, // Return original source code for frontend display
      trace: trace, // Trace contains line numbers mapped to original source
      // Line mapping solution: The tracer function receives original line numbers
      // directly, so trace steps correspond to the original source code lines
      // that the frontend displays. This solves the sourcemap TODO.
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

// Wrap code to track variable assignments with source mapping
function wrapCodeForVariableTracking(code) {
  var lines = code.split("\n");
  var wrappedLines = [];

  // __tracer is already available as a global in the sandbox context
  // No need to set it up - it's injected by the VM context

  // Smart instrumentation: only add tracers at valid statement boundaries
  var inMultiLineConstruct = false;
  var braceDepth = 0;
  var multiLineConstructStartLine = 0;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    var originalLineNumber = i + 1;
    var originalLine = lines[i];

    // Process the line to add variable tracking
    var processedLine = instrumentVariableAssignments(originalLine);
    wrappedLines.push(processedLine);

    // Skip empty lines and comments
    if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
      continue;
    }

    // Detect start of multi-line constructs
    if (line.match(/^(class|function)\s+/) || line.includes('{')) {
      if (!inMultiLineConstruct && line.includes('{')) {
        inMultiLineConstruct = true;
        multiLineConstructStartLine = originalLineNumber;
        braceDepth = 1;
      } else if (inMultiLineConstruct) {
        // Count braces to track nesting
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
      }
    } else if (inMultiLineConstruct) {
      // Count braces in continued multi-line constructs
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
    }

    // Add tracer call only at valid boundaries
    if (!inMultiLineConstruct || braceDepth === 0) {
      // End of multi-line construct or standalone statement
      if (inMultiLineConstruct && braceDepth === 0) {
        // Add tracer for the completed multi-line construct
        wrappedLines.push(`(function() { __tracer.call(this, ${multiLineConstructStartLine}); }).call(this);`);
        inMultiLineConstruct = false;
      } else if (!inMultiLineConstruct) {
        // Simple statement
        wrappedLines.push(`(function() { __tracer.call(this, ${originalLineNumber}); }).call(this);`);
      }
    }
  }

  // Store the original code globally for source mapping
  global.__originalCode = code;

  return wrappedLines.join("\n");
}

// Instrument variable assignments to track them
function instrumentVariableAssignments(line) {
  // Simplified variable assignment tracking - just return the line as-is
  // Variables will be captured directly from the sandbox context
  return line;
}

// Check if a variable name is a built-in that we shouldn't track
function isBuiltInVariable(varName) {
  const builtins = [
    "console",
    "window",
    "document",
    "setTimeout",
    "setInterval",
    "process",
    "Buffer",
    "__tracer",
    "__userVars",
    // Add commonly captured built-ins that shouldn't be shown to students
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
    "undefined",
    "null",
    "true",
    "false",
    "Infinity",
    "NaN",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURIComponent",
    "decodeURIComponent",
    // Add Node.js and modern environment globals
    "globalThis",
    "global",
    "Intl",
    "Reflect",
    "Atomics",
    "WebAssembly",
    "WeakRef",
    "FinalizationRegistry",
    "SharedArrayBuffer",
  ];
  return builtins.includes(varName);
}

// Create enhanced sandbox with variable tracking capabilities
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

    // Tracer function to capture execution state - make it a global variable
    __tracer: function (lineNumber) {
      currentLine = lineNumber;
      executed_lines++;

      if (executed_lines > MAX_EXECUTED_LINES) {
        throw new Error("Maximum execution limit exceeded (too many steps)");
      }

      // Enhanced variable capture - need to access sandbox context directly
      var currentVars = {};
      var foundVars = [];
      
      try {
        // Get reference to the actual sandbox context
        var sandboxContext = this;
        
        // Capture all user-defined variables in the sandbox scope  
        // First try regular enumerable properties
        for (var key in sandboxContext) {
          if (
            sandboxContext.hasOwnProperty &&
            sandboxContext.hasOwnProperty(key) &&
            !key.startsWith("__") &&
            key !== "console" &&
            !isBuiltInVariable(key) &&
            typeof sandboxContext[key] !== "function" &&
            sandboxContext[key] !== undefined // Only show initialized variables
          ) {
            currentVars[key] = serializeValue(sandboxContext[key]);
            foundVars.push(key);
          }
        }
        
        // Also try Object.getOwnPropertyNames for non-enumerable properties
        try {
          var allProps = Object.getOwnPropertyNames(sandboxContext);
          for (var i = 0; i < allProps.length; i++) {
            var key = allProps[i];
            if (
              !key.startsWith("__") &&
              key !== "console" &&
              !isBuiltInVariable(key) &&
              typeof sandboxContext[key] !== "function" &&
              sandboxContext[key] !== undefined &&
              !currentVars[key] // Don't duplicate
            ) {
              currentVars[key] = serializeValue(sandboxContext[key]);
              foundVars.push(key);
            }
          }
        } catch (e) {
          // Ignore errors in property enumeration
        }
        
      } catch (e) {
        output += `[DEBUG Line ${lineNumber}] Error capturing variables: ${e.message}\n`;
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

  // Debug: log all available keys in scope
  var allKeys = Object.getOwnPropertyNames(scope);
  console.log(
    "DEBUG - All scope keys:",
    allKeys.filter((k) => !k.startsWith("__"))
  );

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
      console.log("DEBUG - Found user variable:", key, "=", scope[key]);
      vars[key] = serializeValue(scope[key]);
    }
  }

  console.log("DEBUG - Captured variables:", vars);
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
