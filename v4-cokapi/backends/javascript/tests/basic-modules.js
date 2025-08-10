// Test basic module syntax handling for Phase 3

// Simulate module imports (transform to variable assignments)
// import { add } from './math'; -> var add = __modules.math.add;
var add = function(a, b) { return a + b; }; // Simulated import

// Simulate module exports (transform to object assignment)  
// export function multiply(a, b) { return a * b; }
function multiply(a, b) { 
  return a * b; 
}
// Simulated export: __exports.multiply = multiply;

// Test the "imported" function
var sum = add(5, 3);

// Test the "exported" function  
var product = multiply(4, 6);

// Export default simulation
// export default class Calculator {}
var Calculator = function(name) {
  this.name = name;
};
// Simulated: __exports.default = Calculator;

var calc = new Calculator("MyCalc");