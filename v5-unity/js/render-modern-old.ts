// Modern TypeScript entry point for Interactive Coding Tutor - Render Mode
// Handles the visualization display after code execution

console.log("🎬 Interactive Coding Tutor - Render Mode Loaded!");

// Global state for visualization (render mode)
let renderCurrentStep = 0;
let renderTotalSteps = 0;
let renderExecutionTrace: any[] = [];
let renderSourceCode = "";
let renderConsoleOutputText = "";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded, initializing render mode...");

  // Parse URL parameters to get execution data
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const mode = urlParams.get("mode");

  if (mode === "display") {
    const code = urlParams.get("code");
    const traceData = urlParams.get("trace");
    const output = urlParams.get("output");

    if (code && traceData) {
      try {
        const trace = JSON.parse(traceData);
        initializeVisualization(code, trace, output || "");
      } catch (error) {
        console.error("Error parsing trace data:", error);
        showError("Invalid trace data received");
      }
    } else {
      showError(
        "Missing execution data. Please run code from the editor first."
      );
    }
  } else {
    showError("Invalid mode. Expected mode=display");
  }
});

function initializeVisualization(
  code: string,
  trace: any[],
  consoleOutput: string
) {
  renderSourceCode = code;
  renderExecutionTrace = trace;
  renderConsoleOutputText = consoleOutput;
  renderCurrentStep = 0;
  renderTotalSteps = trace.length;

  createVisualizationUI();
  updateVisualization();
}

function createVisualizationUI() {
  const container = document.getElementById("visualizerContainer");
  if (!container) return;

  // Add CSS styles based on original Python Tutor layout
  const style = document.createElement("style");
  style.textContent = `
    body {
      font-family: Verdana, Arial, Helvetica, sans-serif;
      font-size: 10pt;
      background: #ffffff;
      margin: 0;
      padding: 15px;
    }

    .visualizer {
      border-collapse: collapse;
      border-spacing: 0;
      width: 100%;
    }

    .vizLayoutTd {
      vertical-align: top;
      padding: 0;
    }

    #vizLayoutTdFirst {
      border-right: 1px solid #cccccc;
      padding-right: 15px;
    }

    #vizLayoutTdSecond {
      padding-left: 15px;
      width: 50%;
    }

    /* VCR Controls */
    #vcrControls {
      margin: 15px 0;
      text-align: center;
      padding: 10px;
      background: #f0f0f0;
      border: 1px solid #cccccc;
    }

    #vcrControls button {
      margin: 0 5px;
      padding: 5px 10px;
      font-size: 10pt;
      border: 1px solid #999999;
      background: #f8f8f8;
      cursor: pointer;
    }

    #vcrControls button:hover {
      background: #e0e0e0;
    }

    #curInstr {
      margin: 0 15px;
      font-weight: bold;
    }

    /* Code Display */
    #pyCodeOutputDiv {
      border: 1px solid #999999;
      font-family: Andale mono, monospace;
      font-size: 10pt;
      background: #ffffff;
    }

    .cod {
      padding: 2px;
      border: 0px solid white;
      margin: 0px;
      display: table;
      width: 100%;
    }

    .cod.highlight {
      background: #ffff99;
      border: 2px solid #3D58A2;
    }

    .cod .codPre {
      float: left;
      margin: 0;
      padding: 2px 4px;
      color: #555555;
      width: 25px;
      text-align: right;
    }

    .cod .codTxt {
      margin-left: 35px;
      padding: 2px 4px;
      white-space: pre;
    }

    /* Stack and Heap Layout */
    #stackHeapTable {
      width: 100%;
      border-collapse: collapse;
    }

    #stack_td, #heap_td {
      vertical-align: top;
      width: 50%;
      padding: 10px;
    }

    #stackHeader, #heapHeader {
      background: #e8e8e8;
      border: 1px solid #999999;
      padding: 5px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 10px;
    }

    /* Stack Frames */
    .stackFrame {
      border: 1px solid #999999;
      margin-bottom: 10px;
      background: #ffffff;
    }

    .stackFrame.highlightedStackFrame {
      border: 2px solid #3D58A2;
      background: #ffffcc;
    }

    .stackFrameHeader {
      background: #e8e8e8;
      border-bottom: 1px solid #999999;
      padding: 3px 5px;
      font-weight: bold;
      font-size: 9pt;
    }

    .stackFrameVarTable {
      width: 100%;
      border-collapse: collapse;
    }

    .stackFrameVarTable td {
      border-bottom: 1px dotted #cccccc;
      padding: 3px 5px;
      vertical-align: top;
    }

    .stackFrameVar {
      font-weight: bold;
      color: #3D58A2;
    }

    .stackFrameValue {
      font-family: Andale mono, monospace;
      font-size: 9pt;
    }

    /* Heap Objects */
    .heapRow {
      margin-bottom: 15px;
    }

    .heapObject {
      border: 1px solid #999999;
      background: #ffffff;
      display: inline-block;
      margin-right: 10px;
      margin-bottom: 10px;
    }

    .heapObjectHeader {
      background: #e8e8e8;
      border-bottom: 1px solid #999999;
      padding: 2px 5px;
      font-size: 8pt;
      color: #666666;
    }

    .heapObjectTable {
      border-collapse: collapse;
    }

    .heapObjectTable td {
      border-bottom: 1px dotted #cccccc;
      padding: 2px 4px;
      vertical-align: top;
      font-size: 9pt;
    }

    /* Console Output */
    #progOutputs {
      margin-top: 10px;
      border: 1px solid #999999;
      background: #f5f5f5;
    }

    #progOutputs .outputHeader {
      background: #e8e8e8;
      border-bottom: 1px solid #999999;
      padding: 3px 5px;
      font-weight: bold;
      font-size: 9pt;
    }

    #pyStdout {
      font-family: Andale mono, monospace;
      font-size: 9pt;
      padding: 5px;
      background: #000000;
      color: #00ff00;
      border: none;
      resize: none;
      width: 100%;
      height: 100px;
    }

    .typeLabel {
      font-size: 8pt;
      color: #666666;
      font-style: italic;
    }

    .primitiveObj {
      color: #e93f34;
    }

    .stringObj {
      color: #006400;
    }

    .nullObj {
      color: #555555;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);

  // Create the Python Tutor-style layout
  container.innerHTML = `
    <div id="vcrControls">
      <button id="jmpFirstInstr" type="button">&lt;&lt; First</button>
      <button id="jmpStepBack" type="button">&lt; Back</button>
      <span id="curInstr">Step 1 of ${renderTotalSteps}</span>
      <button id="jmpStepFwd" type="button">Forward &gt;</button>
      <button id="jmpLastInstr" type="button">Last &gt;&gt;</button>
    </div>

    <table border="0" class="visualizer">
      <tr>
        <td class="vizLayoutTd" id="vizLayoutTdFirst">
          <div id="codeDisplayDiv">
            <div id="pyCodeOutputDiv"></div>
          </div>
          <div id="progOutputs" style="display: none;">
            <div class="outputHeader">Program output:</div>
            <textarea id="pyStdout" readonly></textarea>
          </div>
        </td>
        <td class="vizLayoutTd" id="vizLayoutTdSecond">
          <div id="dataViz">
            <table id="stackHeapTable">
              <tr>
                <td id="stack_td">
                  <div id="globals_area">
                    <div id="stackHeader">Frames</div>
                  </div>
                  <div id="stack"></div>
                </td>
                <td id="heap_td">
                  <div id="heap">
                    <div id="heapHeader">Objects</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
  `;

  // Add event listeners
  setupEventListeners();
  
  // Create the global frame
  createGlobalFrame();
}

function setupEventListeners() {
  const firstBtn = document.getElementById("jmpFirstInstr");
  const stepBackBtn = document.getElementById("jmpStepBack");
  const stepFwdBtn = document.getElementById("jmpStepFwd");
  const lastBtn = document.getElementById("jmpLastInstr");

  if (firstBtn) {
    firstBtn.addEventListener("click", () => {
      renderCurrentStep = 0;
      updateVisualization();
    });
  }

  if (stepBackBtn) {
    stepBackBtn.addEventListener("click", () => {
      if (renderCurrentStep > 0) {
        renderCurrentStep--;
        updateVisualization();
      }
    });
  }

  if (stepFwdBtn) {
    stepFwdBtn.addEventListener("click", () => {
      if (renderCurrentStep < renderTotalSteps - 1) {
        renderCurrentStep++;
        updateVisualization();
      }
    });
  }

  if (lastBtn) {
    lastBtn.addEventListener("click", () => {
      renderCurrentStep = renderTotalSteps - 1;
      updateVisualization();
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && renderCurrentStep > 0) {
      renderCurrentStep--;
      updateVisualization();
    } else if (
      e.key === "ArrowRight" &&
      renderCurrentStep < renderTotalSteps - 1
    ) {
      renderCurrentStep++;
      updateVisualization();
    } else if (e.key === "Home") {
      renderCurrentStep = 0;
      updateVisualization();
    } else if (e.key === "End") {
      renderCurrentStep = renderTotalSteps - 1;
      updateVisualization();
    }
  });
}

function updateVisualization() {
  updateCodeDisplay();
  updateVariablesDisplay();
  updateStepControls();
  updateConsoleDisplay();
}

function updateCodeDisplay() {
  const codeDisplay = document.getElementById("codeDisplay");
  if (!codeDisplay) return;

  const lines = renderSourceCode.split("\\n");
  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
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

  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const globals = currentTraceStep?.globals || {};

  let html = "";
  for (const [name, value] of Object.entries(globals)) {
    // Filter out built-in objects
    if (name !== "JSON" && name !== "Math" && name !== "console") {
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
      '<div style="color: #9ca3af; font-style: italic; text-align: center; padding: 20px;">No user-defined variables yet</div>';
  }

  variablesList.innerHTML = html;
}

function updateStepControls() {
  const stepInfo = document.getElementById("stepInfo");
  const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
  const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;
  const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
  const endBtn = document.getElementById("endBtn") as HTMLButtonElement;

  if (stepInfo) {
    const currentTraceStep = renderExecutionTrace[renderCurrentStep];
    const eventType = currentTraceStep?.event || "unknown";
    stepInfo.innerHTML = `
      Step <strong>${
        renderCurrentStep + 1
      }</strong> of <strong>${renderTotalSteps}</strong>
      <span style="color: #6b7280;">(${eventType})</span>
    `;
  }

  if (prevBtn) prevBtn.disabled = renderCurrentStep === 0;
  if (nextBtn) nextBtn.disabled = renderCurrentStep === renderTotalSteps - 1;
  if (resetBtn) resetBtn.disabled = renderCurrentStep === 0;
  if (endBtn) endBtn.disabled = renderCurrentStep === renderTotalSteps - 1;
}

function updateConsoleDisplay() {
  const consoleOutput = document.getElementById("consoleOutput");
  if (!consoleOutput) return;

  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const stdout = currentTraceStep?.stdout || "";

  if (stdout.trim()) {
    consoleOutput.textContent = `Console Output: ${stdout.trim()}`;
  } else {
    consoleOutput.textContent = "Console: (no output yet)";
  }
}

function formatValue(value: any): string {
  if (Array.isArray(value) && value[0] === "LIST") {
    return `[${value.slice(1).join(", ")}]`;
  } else if (Array.isArray(value) && value[0] === "INSTANCE") {
    return `${value[1]} instance`;
  } else if (typeof value === "string") {
    return `"${value}"`;
  } else if (typeof value === "function") {
    return "function";
  } else {
    return String(value);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showError(message: string) {
  const container = document.getElementById("visualizerContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="error-container">
      <h2>❌ Error</h2>
      <p>${escapeHtml(message)}</p>
      <button class="back-btn" onclick="window.location.href='visualize.html#mode=edit'">
        ⬅️ Back to Editor
      </button>
    </div>
  `;
}

// Export for global access if needed
(window as any).modernRenderApp = {
  initializeVisualization,
  updateVisualization,
};
