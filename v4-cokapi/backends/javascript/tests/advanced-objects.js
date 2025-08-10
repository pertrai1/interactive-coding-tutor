// Test advanced object features for Phase 3

// Object shorthand property notation
var name = "Alice";
var age = 30;
var person = {name, age};

// Computed property names
var key = "dynamicKey";
var obj = {[key]: "dynamicValue"};

// Method definitions
var calculator = {
  add(a, b) {
    return a + b;
  },
  multiply(x, y) {
    return x * y;
  }
};

var result = calculator.add(5, 3);
var product = calculator.multiply(4, 6);