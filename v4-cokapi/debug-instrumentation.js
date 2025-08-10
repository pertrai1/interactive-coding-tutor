#!/usr/bin/env node

// Debug script to see the instrumented code
var fs = require("fs");

function instrumentCode(codeLines) {
  var instrumentedLines = [];

  // Add tracer setup at the beginning
  instrumentedLines.push("var __tracer = this.__tracer;");
  instrumentedLines.push("var __currentLine = 1;");

  for (var i = 0; i < codeLines.length; i++) {
    var line = codeLines[i].trim();
    var lineNumber = i + 1;

    // Skip empty lines and comments for instrumentation, but preserve original line
    if (line === "" || line.startsWith("//") || line.startsWith("/*")) {
      instrumentedLines.push(codeLines[i]);
      continue;
    }

    // Transform let/const to var for better variable tracking in educational context
    var transformedLine = codeLines[i]
      .replace(/\blet\s+/g, "var ")
      .replace(/\bconst\s+/g, "var ");

    // Add tracer call before each significant line
    instrumentedLines.push(
      `__currentLine = ${lineNumber}; __tracer(${lineNumber});`
    );
    instrumentedLines.push(transformedLine);
  }

  return instrumentedLines.join("\n");
}

var code = "let x = 5; let y = 10; let sum = x + y;";
var codeLines = code.split("\n");
var instrumentedCode = instrumentCode(codeLines);

console.log("Original code:");
console.log(code);
console.log("\nInstrumented code:");
console.log(instrumentedCode);
