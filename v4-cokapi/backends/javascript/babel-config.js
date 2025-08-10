/**
 * Babel Configuration Module for Interactive Coding Tutor
 * 
 * This module provides a centralized configuration for Babel transpilation
 * to convert modern ES6+ JavaScript syntax to ES5-compatible code while
 * preserving line numbers for educational step-by-step visualization.
 */

const babel = require('@babel/core');

/**
 * Babel configuration for ES5 target compatibility
 * 
 * Note: This configuration prioritizes line number preservation for educational
 * step-by-step visualization. The 'retainLines' option helps maintain accurate
 * line numbers in transpiled code, which is crucial for showing execution flow.
 */
const babelConfig = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        // Target ES5 for maximum compatibility
        ie: '9'
      },
      // Preserve modules to avoid complex transformations
      modules: false,
      // Don't transform arrow functions if not needed for compatibility
      exclude: []
    }]
  ],
  // Generate source maps for line number preservation
  sourceMaps: true,
  // Preserve comments for better debugging
  comments: true,
  // Compact output for cleaner execution
  compact: false,
  // Preserve line numbers as much as possible
  retainLines: true
};

/**
 * Transpile JavaScript code using Babel
 * @param {string} code - The modern JavaScript code to transpile
 * @param {string} filename - The filename for error reporting (optional)
 * @returns {Object} - Object containing transpiled code, source map, and error handling
 */
function transpileCode(code, filename = 'user_script.js') {
  try {
    const result = babel.transformSync(code, {
      ...babelConfig,
      filename: filename
    });

    return {
      success: true,
      code: result.code,
      map: result.map,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      code: null,
      map: null,
      error: {
        message: error.message,
        line: error.loc ? error.loc.line : null,
        column: error.loc ? error.loc.column : null
      }
    };
  }
}

/**
 * Check if code contains modern JavaScript features that need transpilation
 * @param {string} code - JavaScript code to analyze
 * @returns {boolean} - True if transpilation is likely needed
 */
function needsTranspilation(code) {
  // Simple heuristic check for modern features
  const modernFeatures = [
    /\bclass\s+\w+/,           // Class declarations
    /=>/,                      // Arrow functions
    /`[^`]*\$\{[^}]*\}[^`]*`/, // Template literals with interpolation
    /\bimport\s+/,             // ES6 imports
    /\bexport\s+/,             // ES6 exports
    /\basync\s+/,              // Async functions
    /\bawait\s+/,              // Await expressions
    /\.\.\./,                  // Spread/rest operators
    /\b(?:let|const)\s+/,      // Let/const declarations (though Node.js supports these)
  ];

  return modernFeatures.some(pattern => pattern.test(code));
}

module.exports = {
  transpileCode,
  needsTranspilation,
  babelConfig
};