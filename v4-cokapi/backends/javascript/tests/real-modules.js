// Test real module syntax that should be transformed

// Named imports  
import { add, subtract } from './math';

// Default import
import Calculator from './calculator';

// Named exports
export function multiply(a, b) {
  return a * b;
}

// Default export
export default function divide(a, b) {
  return a / b;
}

// Use the imported functions
var sum = add(5, 3);
var calc = new Calculator();