#!/usr/bin/env node

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

// Wrap code to track variable assignments
function wrapCodeForVariableTracking(code) {
  var lines = code.split("\n");
  var wrappedLines = [];

  // Initialize variable tracker
  wrappedLines.push("var __userVars = {};");
  wrappedLines.push("var __tracer = this.__tracer;");

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    var lineNumber = i + 1;

    if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
      wrappedLines.push(lines[i]);
      continue;
    }

    // Add tracer call before each line
    wrappedLines.push(`__tracer(${lineNumber});`);

    // Process the line to wrap variable declarations and assignments
    var processedLine = processVariableLine(lines[i]);
    wrappedLines.push(processedLine);
  }

  return wrappedLines.join("\n");
}

var code = "var x = 5; var y = 10; var sum = x + y;";
console.log("Testing original:");
console.log(code);
console.log("\nWrapped:");
console.log(wrapCodeForVariableTracking(code));

console.log("\n\nTesting let/const transformed:");
var transformed = code
  .replace(/\blet\s+/g, "var ")
  .replace(/\bconst\s+/g, "var ");
console.log(transformed);
console.log("\nWrapped:");
console.log(wrapCodeForVariableTracking(transformed));
