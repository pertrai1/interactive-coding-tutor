#!/usr/bin/env node

/*
Stack-Aware JavaScript Execution Tracer for Interactive Coding Tutor
Provides function call stack tracking similar to Python Tutor's detailed visualization

This version instruments JavaScript code to capture:
- Function declarations and calls
- Function parameters and local variables
- Call stack frames with proper scope tracking
- Function entry/exit events

Based on the original jslogger-modern.js but enhanced for stack frame visualization.
*/

"use strict";

var vm = require("vm");
var util = require("util");
var fs = require("fs");
var _ = require("underscore");

var log = console.warn; // use stderr because stdout is being captured in the trace

var argv = require("minimist")(process.argv.slice(2));

// Global state for execution tracing
var trace = [];
var output = "";
var stepCount = 0;
var currentLine = 1;
var executed_lines = 0;

// Stack frame tracking
var callStack = [];
var frameIdCounter = 1;

// Function tracking
var functionDeclarations = new Map(); // Store function info
var currentScope = {}; // Track current scope variables

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
  console: true,
  require: true,
  module: true,
  exports: true,
  __filename: true,
  __dirname: true,

  // Common built-ins
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

  // Our instrumentation
  __tracer: true,
  __currentLine: true,
  __functionEntry: true,
  __functionExit: true,
  __captureScope: true,
};

// Enhanced execution tracer with function call stack tracking
function traceExecution(code) {
  try {
    // Reset execution state
    executed_lines = 0;
    trace = [];
    output = "";
    stepCount = 0;
    currentLine = 1;
    callStack = [];
    frameIdCounter = 1;
    currentScope = {};
    functionDeclarations.clear();

    // Parse the code to identify function declarations
    var functionInfo = extractFunctionInfo(code);

    // Split code into lines for instrumentation
    var codeLines = code.split("\n");
    var instrumentedCode = instrumentCodeWithStackTracking(
      codeLines,
      functionInfo
    );

    if (argv.dumpsrc) {
      log("=== INSTRUMENTED CODE ===");
      log(instrumentedCode);
      log("=== END INSTRUMENTED CODE ===");
    }

    // Create enhanced sandbox with function tracking
    var sandbox = createStackAwareSandbox();

    // Execute the instrumented code
    vm.runInContext(instrumentedCode, sandbox, {
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
      func_name:
        callStack.length > 0
          ? callStack[callStack.length - 1].func_name
          : "<module>",
      globals: captureGlobalVariables({}),
      ordered_globals: [],
      stack_to_render: [...callStack],
      heap: {},
      stdout: output,
    });

    return {
      code: code,
      trace: trace,
    };
  }
}

// Extract function declaration information from code
function extractFunctionInfo(code) {
  var functionInfo = [];
  var lines = code.split("\n");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    var lineNumber = i + 1;

    // Match regular function declarations
    var funcDeclMatch = line.match(/^function\s+(\w+)\s*\(([^)]*)\)/);
    if (funcDeclMatch) {
      var funcName = funcDeclMatch[1];
      var paramStr = funcDeclMatch[2].trim();
      var params = paramStr ? paramStr.split(",").map((p) => p.trim()) : [];

      functionInfo.push({
        name: funcName,
        params: params,
        line: lineNumber,
        isAsync: false,
      });
    }

    // Match async function declarations
    var asyncFuncMatch = line.match(/^async\s+function\s+(\w+)\s*\(([^)]*)\)/);
    if (asyncFuncMatch) {
      var funcName = asyncFuncMatch[1];
      var paramStr = asyncFuncMatch[2].trim();
      var params = paramStr ? paramStr.split(",").map((p) => p.trim()) : [];

      functionInfo.push({
        name: funcName,
        params: params,
        line: lineNumber,
        isAsync: true,
      });
    }

    // Match arrow functions assigned to variables
    var arrowFuncMatch = line.match(
      /^(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/
    );
    if (arrowFuncMatch) {
      var funcName = arrowFuncMatch[1];
      var paramStr = arrowFuncMatch[2].trim();
      var params = paramStr ? paramStr.split(",").map((p) => p.trim()) : [];

      functionInfo.push({
        name: funcName,
        params: params,
        line: lineNumber,
        isAsync: false,
      });
    }

    // Match async arrow functions assigned to variables
    var asyncArrowFuncMatch = line.match(
      /^(?:const|let|var)\s+(\w+)\s*=\s*async\s*\(([^)]*)\)\s*=>/
    );
    if (asyncArrowFuncMatch) {
      var funcName = asyncArrowFuncMatch[1];
      var paramStr = asyncArrowFuncMatch[2].trim();
      var params = paramStr ? paramStr.split(",").map((p) => p.trim()) : [];

      functionInfo.push({
        name: funcName,
        params: params,
        line: lineNumber,
        isAsync: true,
      });
    }
  }

  return functionInfo;
}

// Instrument JavaScript code to add stack-aware tracing
function instrumentCodeWithStackTracking(codeLines, functionInfo) {
  var instrumentedLines = [];

  // Add tracer setup at the beginning
  instrumentedLines.push("var __tracer = this.__tracer;");
  instrumentedLines.push("var __functionEntry = this.__functionEntry;");
  instrumentedLines.push("var __functionExit = this.__functionExit;");
  instrumentedLines.push("var __captureScope = this.__captureScope;");
  instrumentedLines.push("var __currentLine = 1;");

  for (var i = 0; i < codeLines.length; i++) {
    var line = codeLines[i].trim();
    var lineNumber = i + 1;
    var originalLine = codeLines[i];

    // Skip empty lines and comments
    if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
      instrumentedLines.push(originalLine);
      continue;
    }

    // Skip lines that are only object/array properties (simple heuristic)
    if (
      line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^,}]+[,}]?\s*$/) ||
      line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*\{?\s*$/) ||
      line.match(/^\s*[}],?\s*$/) ||
      line.match(/^\s*],?\s*$/) ||
      line.match(/^\s*\d+[,\]]\s*$/)
    ) {
      instrumentedLines.push(originalLine);
      continue;
    }

    // Check if this line contains a function declaration
    var funcInfo = functionInfo.find((f) => f.line === lineNumber);
    if (funcInfo) {
      // Instrument function declaration
      instrumentedLines.push(`__currentLine = ${lineNumber}; __tracer();`);

      if (funcInfo.isAsync) {
        // Handle async function declaration
        instrumentedLines.push(
          originalLine.replace(
            /^(\s*)async\s+function\s+(\w+)\s*\(([^)]*)\)\s*{/,
            `$1async function $2($3) { __functionEntry('$2', [${funcInfo.params
              .map((p) => `'${p}'`)
              .join(", ")}], arguments, ${lineNumber});`
          )
        );
      } else {
        // Handle regular function declaration
        instrumentedLines.push(
          originalLine.replace(
            /^(\s*)function\s+(\w+)\s*\(([^)]*)\)\s*{/,
            `$1function $2($3) { __functionEntry('$2', [${funcInfo.params
              .map((p) => `'${p}'`)
              .join(", ")}], arguments, ${lineNumber});`
          )
        );
      }
    } else if (line.includes("return") && !line.includes("=>")) {
      // Instrument return statements (but avoid arrow functions)
      instrumentedLines.push(`__currentLine = ${lineNumber}; __tracer();`);

      // Only instrument simple return statements, not those in arrow functions
      if (originalLine.trim().match(/^\s*return\s+[^;]+;?\s*$/)) {
        instrumentedLines.push(
          originalLine.replace(
            /return\s+([^;]+);?/,
            "var __returnValue = $1; __functionExit(__returnValue); return __returnValue;"
          )
        );
      } else {
        instrumentedLines.push(originalLine);
      }
    } else {
      // Regular line instrumentation
      instrumentedLines.push(`__currentLine = ${lineNumber}; __tracer();`);
      instrumentedLines.push(originalLine);
    }
  }

  return instrumentedLines.join("\n");
}

// Create enhanced sandbox with stack tracking functions
function createStackAwareSandbox() {
  var sandbox = {
    console: {
      log: function (...args) {
        output += args.join(" ") + "\n";
      },
    },

    // Tracer function for line execution
    __tracer: function () {
      var globals = captureGlobalVariables(sandbox);

      trace.push({
        line: currentLine,
        event: "step_line",
        func_name:
          callStack.length > 0
            ? callStack[callStack.length - 1].func_name
            : "<module>",
        globals: globals,
        ordered_globals: Object.keys(globals),
        stack_to_render: [...callStack], // Copy current call stack
        heap: {},
        stdout: output,
      });

      stepCount++;
    },

    // Function entry tracking
    __functionEntry: function (funcName, paramNames, args, lineNumber) {
      var frameId = frameIdCounter++;
      var locals = {};

      // Capture function parameters
      for (var i = 0; i < paramNames.length && i < args.length; i++) {
        locals[paramNames[i]] = args[i];
      }

      var frame = {
        func_name: funcName,
        frame_id: frameId,
        parent_frame_id_list:
          callStack.length > 0
            ? [callStack[callStack.length - 1].frame_id]
            : [],
        encoded_locals: locals,
        ordered_varnames: paramNames,
        is_highlighted: true,
        is_parent: false,
        is_zombie: false,
        unique_hash: `frame_${frameId}`,
      };

      callStack.push(frame);

      // Trace function entry
      var globals = captureGlobalVariables(sandbox);
      trace.push({
        line: lineNumber,
        event: "call",
        func_name: funcName,
        globals: globals,
        ordered_globals: Object.keys(globals),
        stack_to_render: [...callStack],
        heap: {},
        stdout: output,
      });
    },

    // Function exit tracking
    __functionExit: function (returnValue) {
      if (callStack.length > 0) {
        var frame = callStack.pop();

        // Trace function exit
        var globals = captureGlobalVariables(sandbox);
        trace.push({
          line: currentLine,
          event: "return",
          func_name: frame.func_name,
          globals: globals,
          ordered_globals: Object.keys(globals),
          stack_to_render: [...callStack],
          heap: {},
          stdout: output,
        });
      }
    },

    // Update current line number
    set __currentLine(line) {
      currentLine = line;
    },
  };

  // Make sandbox global context available
  vm.createContext(sandbox);
  return sandbox;
}

// Capture global variables (excluding built-ins)
function captureGlobalVariables(scope) {
  var variables = {};

  for (var key in scope) {
    if (scope.hasOwnProperty(key) && !IGNORE_GLOBAL_VARS[key]) {
      try {
        variables[key] = serializeValue(scope[key]);
      } catch (e) {
        variables[key] = `<${typeof scope[key]}>`;
      }
    }
  }

  return variables;
}

// Enhanced value serialization for educational display
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
