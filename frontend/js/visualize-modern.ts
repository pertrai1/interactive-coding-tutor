// Modern TypeScript entry point for Interactive Coding Tutor
// Ace Editor-powered WYSIWYG code editor

import ace from "ace-builds";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-noconflict/ext-language_tools";

console.log("🚀 Interactive Coding Tutor - Modern Build System Loaded!");

// Global Ace Editor instance
let codeEditor: ace.Ace.Editor;

// Simple initialization
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded, initializing application...");

  // Check if this is the visualize page
  if (window.location.pathname.includes("visualize.html")) {
    initializeVisualizerPage();
  }
});

function initializeVisualizerPage() {
  console.log("📊 Initializing JavaScript/TypeScript Visualizer...");

  // Create basic UI structure if not present
  const container = document.getElementById("pyInputPane") || document.body;

  // Add basic styling and content
  if (!document.querySelector(".modern-ui-loaded")) {
    const style = document.createElement("style");
    style.className = "modern-ui-loaded";
    style.textContent = `
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: #f8f9fa;
        margin: 0;
        padding: 20px;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
      }

      .title {
        color: #2563eb;
        margin-bottom: 20px;
        text-align: center;
      }

      .editor-container {
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 15px;
      }

      .editor-header {
        background: #f8f9fa;
        border-bottom: 1px solid #e5e7eb;
        padding: 8px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        color: #6b7280;
      }

      .language-selector {
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        background: white;
      }

      .ace-editor {
        width: 100%;
        height: 400px;
        font-size: 14px !important;
      }

      .editor-toolbar {
        background: #f8f9fa;
        border-top: 1px solid #e5e7eb;
        padding: 8px 15px;
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 12px;
        color: #6b7280;
      }

      .theme-selector {
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 11px;
        background: white;
      }

      .execute-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 10px;
      }

      .execute-btn:hover {
        background: #1d4ed8;
      }

      .output {
        margin-top: 20px;
        padding: 15px;
        background: #f3f4f6;
        border-radius: 6px;
        border-left: 4px solid #10b981;
      }

      .visualization-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 20px;
      }

      .code-display {
        background: #1f2937;
        color: #f9fafb;
        padding: 15px;
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
      }

      .code-line {
        padding: 2px 0;
        border-radius: 3px;
      }

      .code-line.current {
        background: #3b82f6;
        color: white;
        font-weight: bold;
      }

      .variables-panel {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 15px;
      }

      .variables-title {
        font-weight: bold;
        margin-bottom: 10px;
        color: #374151;
      }

      .variable-item {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .variable-name {
        font-weight: 600;
        color: #7c3aed;
      }

      .variable-value {
        color: #059669;
        font-family: monospace;
      }

      .step-controls {
        margin: 15px 0;
        text-align: center;
      }

      .step-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        margin: 0 5px;
        cursor: pointer;
        font-size: 14px;
      }

      .step-btn:hover {
        background: #059669;
      }

      .step-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .step-info {
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        margin: 10px 0;
      }

      .console-output {
        background: #f8f9fa;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        padding: 10px;
        border-radius: 4px;
        font-family: monospace;
        margin-top: 10px;
        min-height: 40px;
      }
    `;
    document.head.appendChild(style);

    // Create modern UI with Ace Editor
    container.innerHTML = `
      <div class="container">
        <h1 class="title">🚀 Interactive JavaScript/TypeScript Code Tutor</h1>
        <p style="text-align: center; color: #6b7280; margin-bottom: 30px;">
          Professional Code Editor • Modern ECMAScript 2025 Support • Step-by-step Execution Visualization
        </p>

        <div class="editor-container">
          <div class="editor-header">
            <span>📝 Code Editor</span>
            <div>
              <label for="languageSelect" style="margin-right: 8px;">Language:</label>
              <select id="languageSelect" class="language-selector">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>
          </div>

          <div id="aceEditor" class="ace-editor"></div>

          <div class="editor-toolbar">
            <span>Theme:</span>
            <select id="themeSelect" class="theme-selector">
              <option value="github" selected>Light Theme</option>
              <option value="textmate">Light Theme (Textmate)</option>
            </select>

            <span style="margin-left: 20px;">Features: Line numbers, Syntax highlighting, Auto-completion, Bracket matching • Light Mode UI</span>
          </div>
        </div>

        <button id="executeBtn" class="execute-btn">
          ▶️ Visualize Execution
        </button>

        <div id="output" class="output" style="display: none;">
          <h3 style="margin-top: 0;">Execution Status:</h3>
          <div id="outputContent"></div>
        </div>
      </div>
    `;

    // Initialize Ace Editor
    initializeAceEditor();

    // Add event handlers
    setupEventHandlers();
  }
}

function initializeAceEditor() {
  // Configure Ace Editor
  ace.config.set(
    "basePath",
    "https://cdn.jsdelivr.net/npm/ace-builds@latest/src-noconflict/"
  );

  // Create the editor
  codeEditor = ace.edit("aceEditor");

  // Set default theme and mode
  codeEditor.setTheme("ace/theme/github");
  codeEditor.session.setMode("ace/mode/javascript");

  // Configure editor options
  codeEditor.setOptions({
    fontSize: "14px",
    showLineNumbers: true,
    showGutter: true,
    highlightActiveLine: true,
    showPrintMargin: false,
    displayIndentGuides: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    tabSize: 2,
    useSoftTabs: true,
    wrap: false,
    autoScrollEditorIntoView: true,
  });

  // Set default code
  const defaultCode = `// Welcome to the Interactive JavaScript/TypeScript Code Tutor!
// This professional code editor features:
// • Line numbers and syntax highlighting
// • Auto-completion and bracket matching
// • Multiple language support
// • Professional debugging visualization

console.log('Hello, Interactive Tutor!');

// Try modern JavaScript features:
var numbers = [1, 2, 3, 4, 5];
var doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Arrow functions and safe destructuring
var arrayLength = numbers.length;
console.log('Array length:', arrayLength);

// Modern async/await
async function fetchData() {
  return new Promise(resolve => {
    setTimeout(() => resolve('Data loaded!'), 1000);
  });
}

// Uncomment to test async code:
// fetchData().then(data => console.log(data));`;

  // Check URL parameters for existing code
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const codeFromUrl = urlParams.get("code");

  if (codeFromUrl) {
    try {
      const decodedCode = decodeURIComponent(codeFromUrl);
      codeEditor.setValue(decodedCode, -1);
    } catch (error) {
      console.error("Error decoding code from URL:", error);
      codeEditor.setValue(defaultCode, -1);
    }
  } else {
    codeEditor.setValue(defaultCode, -1);
  }
  codeEditor.clearSelection();

  // Add language selector handler
  const languageSelect = document.getElementById(
    "languageSelect"
  ) as HTMLSelectElement;
  languageSelect?.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    const mode =
      target.value === "typescript"
        ? "ace/mode/typescript"
        : "ace/mode/javascript";
    codeEditor.session.setMode(mode);
  });

  // Add theme selector handler
  const themeSelect = document.getElementById(
    "themeSelect"
  ) as HTMLSelectElement;
  themeSelect?.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    const theme =
      target.value === "textmate" ? "ace/theme/textmate" : "ace/theme/github";
    codeEditor.setTheme(theme);
  });
}

function setupEventHandlers() {
  const executeBtn = document.getElementById("executeBtn");
  const output = document.getElementById("output");
  const outputContent = document.getElementById("outputContent");

  executeBtn?.addEventListener("click", async () => {
    // Get code from Ace Editor instead of textarea
    const code = codeEditor.getValue().trim();
    if (!code) {
      alert("Please enter some code to execute!");
      return;
    }

    executeBtn.textContent = "⏳ Executing...";
    executeBtn.setAttribute("disabled", "true");

    try {
      // Send to backend for execution using GET with URL parameters
      const url = new URL("http://localhost:3000/exec_js_native");
      url.searchParams.append("user_script", code);

      const response = await fetch(url.toString(), {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the response as text first
      const responseText = await response.text();

      // The response contains console output followed by JSON
      // Find the start of the JSON (first '{' character)
      const jsonStart = responseText.indexOf("{");

      if (jsonStart === -1) {
        throw new Error("No JSON data found in response");
      }

      // Extract console output and JSON separately
      const consoleOutput = responseText.substring(0, jsonStart).trim();
      const jsonData = responseText.substring(jsonStart);

      // Parse the JSON part
      const result = JSON.parse(jsonData);

      // Initialize the visualization by redirecting to render mode
      const params = new URLSearchParams({
        code: code,
        trace: JSON.stringify(result.trace),
        output: consoleOutput,
      });

      // Redirect to render.html with the execution data
      window.location.href = `render.html#mode=display&${params.toString()}`;

      console.log("✅ Execution result:", result);
    } catch (error) {
      console.error("❌ Execution error:", error);
      const output = document.getElementById("output");
      if (output) {
        output.innerHTML = `
          <h3 style="margin-top: 0;">Execution Error</h3>
          <div style="color: #dc2626; font-family: monospace; padding: 10px; background: #fef2f2; border-radius: 4px;">
            Error: ${error instanceof Error ? error.message : String(error)}
          </div>
        `;
        output.style.display = "block";
      }
    } finally {
      executeBtn.textContent = "▶️ Visualize Execution";
      executeBtn.removeAttribute("disabled");
    }
  });
}

// Export for global access if needed
(window as any).modernTutorApp = {
  initializeVisualizerPage,
};

// Global state for visualization
let currentStep = 0;
let totalSteps = 0;
let executionTrace: any[] = [];
let sourceCode = "";
let consoleOutputText = "";

function initializeVisualization(
  code: string,
  trace: any[],
  consoleOutput: string
) {
  sourceCode = code;
  executionTrace = trace;
  consoleOutputText = consoleOutput;
  currentStep = 0;
  totalSteps = trace.length;

  // Show the output panel
  const output = document.getElementById("output");
  if (output) {
    output.style.display = "block";
  }

  // Set up code display
  updateCodeDisplay();
  updateVariablesDisplay();
  updateStepControls();
  updateConsoleDisplay();

  // Add event listeners for step controls
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        updateVisualization();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentStep < totalSteps - 1) {
        currentStep++;
        updateVisualization();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentStep = 0;
      updateVisualization();
    });
  }
}

function updateVisualization() {
  updateCodeDisplay();
  updateVariablesDisplay();
  updateStepControls();
}

function updateCodeDisplay() {
  const codeDisplay = document.getElementById("codeDisplay");
  if (!codeDisplay) return;

  const lines = sourceCode.split("\n");
  const currentTraceStep = executionTrace[currentStep];
  const currentLine = currentTraceStep?.line || 1;

  const htmlLines = lines
    .map((line, index) => {
      const lineNumber = index + 1;
      const isCurrent = lineNumber === currentLine;
      const className = isCurrent ? "code-line current" : "code-line";
      return `<div class="${className}">${lineNumber}: ${escapeHtml(
        line
      )}</div>`;
    })
    .join("");

  codeDisplay.innerHTML = htmlLines;
}

function updateVariablesDisplay() {
  const variablesList = document.getElementById("variablesList");
  if (!variablesList) return;

  const currentTraceStep = executionTrace[currentStep];
  const globals = currentTraceStep?.globals || {};

  let html = "";
  for (const [name, value] of Object.entries(globals)) {
    if (name !== "JSON" && name !== "Math") {
      // Filter out built-in objects
      html += `
        <div class="variable-item">
          <span class="variable-name">${escapeHtml(name)}</span>
          <span class="variable-value">${formatValue(value)}</span>
        </div>
      `;
    }
  }

  if (html === "") {
    html =
      '<div style="color: #9ca3af; font-style: italic;">No variables defined yet</div>';
  }

  variablesList.innerHTML = html;
}

function updateStepControls() {
  const stepInfo = document.getElementById("stepInfo");
  const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
  const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;

  if (stepInfo) {
    stepInfo.textContent = `Step ${currentStep + 1} of ${totalSteps}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentStep === 0;
  }

  if (nextBtn) {
    nextBtn.disabled = currentStep === totalSteps - 1;
  }
}

function updateConsoleDisplay() {
  const consoleOutput = document.getElementById("consoleOutput");
  if (!consoleOutput) return;

  const currentTraceStep = executionTrace[currentStep];
  const stdout = currentTraceStep?.stdout || "";

  consoleOutput.textContent = stdout || "No output yet...";
}

function formatValue(value: any): string {
  if (Array.isArray(value) && value[0] === "LIST") {
    return `[${value.slice(1).join(", ")}]`;
  } else if (Array.isArray(value) && value[0] === "INSTANCE") {
    return `${value[1]} instance`;
  } else if (typeof value === "string") {
    return `"${value}"`;
  } else {
    return String(value);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
