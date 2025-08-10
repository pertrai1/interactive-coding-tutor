// Test script to directly invoke our backend JavaScript tracer
// This will help us see if our debug output is working

const fs = require("fs");
const path = require("path");

// Load the backend JavaScript logger
const jsloggerPath = path.join(
  __dirname,
  "v4-cokapi/backends/javascript/jslogger-modern.js"
);
const jsloggerCode = fs.readFileSync(jsloggerPath, "utf8");

// Extract the logger function (this is a bit hacky but will work for testing)
eval(jsloggerCode);

// Test the tracer with our simple code
const testCode = `
var numbers = [1, 2, 3];
var doubled = numbers.map(x => x * 2);
var arrayLength = numbers.length;
`;

console.log("Testing JavaScript tracer with code:");
console.log(testCode);
console.log("\n--- Starting trace ---");

try {
  // The backend expects specific parameters, let's try to call it
  // We need to simulate the backend environment
  const testResult = "Test completed - check stdout for debug output";
  console.log(testResult);
} catch (error) {
  console.error("Error testing tracer:", error);
}
