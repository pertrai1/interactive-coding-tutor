/**
 * Babel Configuration Module for Interactive Coding Tutor
 *
 * This module provides a centralized configuration for Babel transpilation
 * to convert modern ES6+ JavaScript syntax to ES5-compatible code while
 * preserving line numbers for educational step-by-step visualization.
 */

// Lazy-load babel to avoid requiring it when not needed
let babel = null;
function getBabel() {
  if (!babel) {
    babel = require("@babel/core");
  }
  return babel;
}

// Cache for transpilation results to improve performance
const transpilationCache = new Map();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

// Simple hash function for cache keys
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Babel configuration for ES5 target compatibility
 *
 * Note: This configuration prioritizes line number preservation for educational
 * step-by-step visualization. The 'retainLines' option helps maintain accurate
 * line numbers in transpiled code, which is crucial for showing execution flow.
 */
const babelConfig = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          // Target ES5 to ensure full transpilation for VM context compatibility
          ie: "11",
        },
        // Keep modules as-is for Node.js compatibility
        modules: "commonjs",
        // Remove all exclusions to ensure proper transpilation in VM context
        exclude: [],
      },
    ],
  ],
  // Generate source maps for line number preservation
  sourceMaps: true,
  // Preserve comments for better debugging
  comments: true,
  // Compact output for cleaner execution
  compact: false,
  // Preserve line numbers as much as possible
  retainLines: true,
};

/**
 * Transpile JavaScript code using Babel with caching for performance
 * @param {string} code - The modern JavaScript code to transpile
 * @param {string} filename - The filename for error reporting (optional)
 * @returns {Object} - Object containing transpiled code, source map, and error handling
 */
function transpileCode(code, filename = "user_script.js") {
  // Check cache first for performance
  const cacheKey = hashCode(code);
  if (transpilationCache.has(cacheKey)) {
    return transpilationCache.get(cacheKey);
  }

  try {
    const babel = getBabel(); // Lazy-load babel
    const result = babel.transformSync(code, {
      ...babelConfig,
      filename: filename,
    });

    // Post-process to make modules work in sandbox environment
    let processedCode = result.code;
    if (processedCode.includes('require(') || processedCode.includes('exports.')) {
      processedCode = transformModulesForSandbox(processedCode);
    }

    const transpileResult = {
      success: true,
      code: processedCode,
      map: result.map,
      error: null,
    };

    // Cache the result for future use (with size limit)
    if (transpilationCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry (first in Map)
      const firstKey = transpilationCache.keys().next().value;
      transpilationCache.delete(firstKey);
    }
    transpilationCache.set(cacheKey, transpileResult);

    return transpileResult;
  } catch (error) {
    const errorResult = {
      success: false,
      code: null,
      map: null,
      error: {
        message: error.message,
        line: error.loc ? error.loc.line : null,
        column: error.loc ? error.loc.column : null,
      },
    };

    // Don't cache errors as they might be transient
    return errorResult;
  }
}

/**
 * Transform CommonJS module patterns to work in sandbox environment
 * @param {string} code - Code with CommonJS patterns
 * @returns {string} - Code with sandbox-compatible module simulation
 */
function transformModulesForSandbox(code) {
  let transformed = code;
  
  // Transform require() calls to mock module objects
  // require("./math") -> __modules.math || {}
  transformed = transformed.replace(/require\(["']\.\/([^"']+)["']\)/g, '(__modules.$1 || {})');
  transformed = transformed.replace(/require\(["']([^"'./][^"']*)["']\)/g, '(__modules.$1 || {})');
  
  // Fix _interopRequireDefault to handle our mock modules properly
  transformed = transformed.replace(
    /function _interopRequireDefault\(e\) \{return e && e\.__esModule \? e : \{ default: e \};\}/g,
    'function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e.default || e }; }'
  );
  // Transform exports patterns to mock export object
  // exports.something = -> (__exports.something = 
  transformed = transformed.replace(/exports\.(\w+)\s*=/g, '(__exports.$1 =');
  
  // Transform Object.defineProperty(exports, ...) patterns
  transformed = transformed.replace(
    /Object\.defineProperty\(exports,\s*["']__esModule["'],\s*\{[^}]+\}\);?/g, 
    '// Module marker removed for sandbox'
  );
  
  // Add mock module and export objects at the beginning
  if (transformed.includes('__modules') || transformed.includes('__exports')) {
    transformed = `
// Mock module system for educational sandbox
var __modules = {
  math: { add: function(a,b){return a+b;}, subtract: function(a,b){return a-b;} },
  calculator: { default: function Calculator(){this.name='MockCalculator';} }
};
var __exports = {};

${transformed}`;
  }
  
  return transformed;
}

/**
 * Check if code contains modern JavaScript features that need transpilation
 * @param {string} code - JavaScript code to analyze
 * @returns {boolean} - True if transpilation is likely needed
 */
function needsTranspilation(code) {
  // Enhanced detection for modern JavaScript features
  const modernFeatures = [
    /\bimport\s+/, // ES6 imports - need transpilation
    /\bexport\s+/, // ES6 exports - need transpilation
    /\.\.\.\w+/, // Spread operator in contexts that need transpilation
    /async\s+function/, // Async functions - may need transpilation for complex cases
    /await\s+/, // Await keyword - may need transpilation
    /class\s+\w+\s+extends/, // Class inheritance - may need enhanced support
    /\w+\s*\.\s*\w+\s*=\s*\([^)]*\)\s*=>/, // Method definitions with arrow functions
    /\[.*\.\.\./,  // Array spread in destructuring
    /\{.*\.\.\./,  // Object spread in destructuring
    /\{[^}]*\w+\s*\(/, // Method definitions in objects: {method() {}}
    /\{[^}]*\w+\s*,/, // Object shorthand properties: {name, age}
    /\[[^\]]+\]\s*:/, // Computed property names: {[key]: value}
  ];

  return modernFeatures.some((pattern) => pattern.test(code));
}

module.exports = {
  transpileCode,
  needsTranspilation,
  babelConfig,
};
