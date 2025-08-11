function deepOmit(obj, keys) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((val) => deepOmit(val, keys));
  }
  if (typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (!keys.includes(key)) {
        newObj[key] = deepOmit(obj[key], keys);
      }
    }
    return newObj;
  }
}

const obj = {
  a: 1,
  b: 2,
  c: {
    d: 3,
    e: 4,
  },
  f: [5, 6],
};
deepOmit(obj, ["b", "c", "e"]); // { a: 1, f: [5, 6] }
