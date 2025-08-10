// Comprehensive test showing all Phase 3 features working together

// Module imports (transformed to mock system)
import { add } from './math';

// Advanced object features
const name = "JavaScript";
const config = {
  name,                               // Object shorthand
  getValue() {                        // Method definition
    return this.name;
  }
};

// Enhanced array methods with chaining
const numbers = [1, 2, 3, 4, 5];
const result = numbers
  .filter(n => n % 2 === 0)          // Filter even numbers
  .find(n => n > 2);                 // Find first > 2

// Test includes method
const hasThree = numbers.includes(3);

// Using imported function (mock module system)
const sum = add(5, 7);