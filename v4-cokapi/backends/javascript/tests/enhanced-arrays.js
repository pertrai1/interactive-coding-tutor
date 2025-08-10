// Test enhanced array methods for Phase 3

var numbers = [1, 2, 3, 4, 5];

// Test find method
var found = numbers.find(function(n) { return n > 3; });

// Test includes method
var hasThree = numbers.includes(3);

// Test method chaining
var result = numbers
  .filter(function(n) { return n % 2 === 0; })
  .map(function(n) { return n * 2; });

// Test flatMap if available
var nested = [[1, 2], [3, 4]];
try {
  var flattened = nested.flatMap ? nested.flatMap(function(arr) { return arr; }) : 'flatMap not available';
} catch (e) {
  var flattened = 'flatMap error: ' + e.message;
}