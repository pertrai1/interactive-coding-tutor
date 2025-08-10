let x = 5;
let y = 10;
let sum = x + y;
console.log("Sum:", sum);

let numbers = [1, 2, 3, 4, 5];
let doubled = numbers.map(function (num) {
  return num * 2;
});

console.log("Doubled:", doubled);

function greet(name) {
  return "Hello, " + name + "!";
}

let message = greet("World");
console.log(message);
