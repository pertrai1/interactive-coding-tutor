import { a as ace } from "./theme-textmate.chunk.js";
console.log("🎬 Interactive Coding Tutor - Render Mode Loaded!");
let renderCurrentStep = 0;
let renderTotalSteps = 0;
let renderExecutionTrace = [];
let renderSourceCode = "";
let renderConsoleOutputText = "";
let renderCodeEditor;
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded, initializing render mode...");
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
function initializeVisualization(code, trace, consoleOutput) {
  renderSourceCode = code;
  renderExecutionTrace = trace;
  renderConsoleOutputText = consoleOutput;
  renderCurrentStep = 0;
  renderTotalSteps = trace.length;
  console.log("Trace data:", trace);
  console.log("Total steps:", renderTotalSteps);
  console.log("First few steps:");
  trace.slice(0, 5).forEach((step, index) => {
    console.log(`  Step ${index + 1}: Line ${step.line}, Event: ${step.event}`);
    console.log(`    Globals:`, step.globals);
    console.log(`    Stack frames:`, step.stack_to_render);
    console.log(`    Heap objects:`, step.heap);
  });
  createVisualizationUI();
  updateVisualization();
}
function createVisualizationUI() {
  const container = document.getElementById("visualizerContainer");
  if (!container) return;
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
      width: 50%;
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

    #vcrControls button:disabled {
      background: #f0f0f0;
      color: #999999;
      cursor: not-allowed;
    }

    #curInstr {
      margin: 0 15px;
      font-weight: bold;
    }

    /* Code Display with Ace Editor */
    .ace-editor-container {
      border: 1px solid #999999;
      margin-bottom: 10px;
      background: white;
    }

    .ace-editor-header {
      background: #e8e8e8;
      border-bottom: 1px solid #999999;
      padding: 5px 10px;
      font-size: 9pt;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ace-code-editor {
      width: 100%;
      height: 400px;
      font-size: 12px !important;
    }

    /* Execution line highlighting styles */
    .ace_execution_current {
      background: #ffff88 !important;
      border-left: 4px solid #0066cc !important;
      position: relative !important;
      z-index: 1000 !important;
    }

    .ace_execution_previous {
      background: #e6f3ff !important;
      border-left: 3px solid #66b3ff !important;
      position: relative !important;
      z-index: 500 !important;
    }

    .ace_execution_next {
      background: #f0f8e6 !important;
      border-left: 3px solid #90ee90 !important;
      position: relative !important;
      z-index: 250 !important;
    }

    .execution-status {
      background: #f0f8ff;
      border: 1px solid #b6d7ff;
      padding: 5px 10px;
      margin-bottom: 10px;
      font-size: 9pt;
      border-radius: 3px;
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
      width: 30%;
    }

    .stackFrameValue {
      font-family: "Andale Mono", monospace;
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
      border: 1px solid #999999;
      background: #f5f5f5;
    }

    .outputHeader {
      background: #e8e8e8;
      border-bottom: 1px solid #999999;
      padding: 3px 5px;
      font-weight: bold;
      font-size: 9pt;
    }

    #pyStdout {
      font-family: "Andale Mono", monospace;
      font-size: 9pt;
      padding: 5px;
      background: #f8f9fa;
      color: #1f2937;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
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

    .error-container {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      color: #dc2626;
    }

    .back-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 10px;
    }

    .back-btn:hover {
      background: #4b5563;
    }
  `;
  document.head.appendChild(style);
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 15px;">
      <button class="back-btn" id="editCodeBtn">
        ✏️ Edit Current Code
      </button>
    </div>

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
          <div class="execution-status" id="executionStatus">
            Ready to visualize code execution
          </div>

          <div class="ace-editor-container">
            <div class="ace-editor-header">
              <span>📝 Source Code</span>
              <span id="lineInfo">Line 1</span>
            </div>
            <div id="aceCodeEditor" class="ace-code-editor"></div>
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
  setupEventListeners();
  initializeRenderCodeEditor();
  createGlobalFrame();
}
function initializeRenderCodeEditor() {
  ace.config.set(
    "basePath",
    "https://cdn.jsdelivr.net/npm/ace-builds@latest/src-noconflict/"
  );
  renderCodeEditor = ace.edit("aceCodeEditor");
  renderCodeEditor.setTheme("ace/theme/github");
  renderCodeEditor.session.setMode("ace/mode/javascript");
  renderCodeEditor.setOptions({
    fontSize: "12px",
    showLineNumbers: true,
    showGutter: true,
    highlightActiveLine: false,
    // We'll handle this manually
    showPrintMargin: false,
    displayIndentGuides: true,
    readOnly: true,
    highlightSelectedWord: false,
    cursorStyle: "slim",
    tabSize: 2,
    useSoftTabs: true,
    wrap: false
  });
  renderCodeEditor.setHighlightActiveLine(false);
  try {
    renderCodeEditor.renderer.$cursorLayer.element.style.display = "none";
  } catch (e) {
    console.log("Could not hide cursor:", e);
  }
  renderCodeEditor.setValue(renderSourceCode, -1);
  renderCodeEditor.clearSelection();
}
function setupEventListeners() {
  const firstBtn = document.getElementById("jmpFirstInstr");
  const stepBackBtn = document.getElementById("jmpStepBack");
  const stepFwdBtn = document.getElementById("jmpStepFwd");
  const lastBtn = document.getElementById("jmpLastInstr");
  const editCodeBtn = document.getElementById("editCodeBtn");
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
  if (editCodeBtn) {
    editCodeBtn.addEventListener("click", () => {
      const encodedCode = encodeURIComponent(renderSourceCode);
      window.location.href = `visualize.html#mode=edit&code=${encodedCode}`;
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && renderCurrentStep > 0) {
      renderCurrentStep--;
      updateVisualization();
    } else if (e.key === "ArrowRight" && renderCurrentStep < renderTotalSteps - 1) {
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
function createGlobalFrame() {
  const globalsArea = document.getElementById("globals_area");
  if (!globalsArea) return;
  const globalFrame = document.createElement("div");
  globalFrame.className = "stackFrame";
  globalFrame.id = "globals";
  globalFrame.innerHTML = `
    <div class="stackFrameHeader">Global frame</div>
    <table class="stackFrameVarTable" id="global_table"></table>
  `;
  globalsArea.appendChild(globalFrame);
}
function updateVisualization() {
  updateStepInfo();
  updateCodeDisplay();
  updateStackFrames();
  updateHeapObjects();
  updateConsoleDisplay();
  updateControls();
}
function updateStepInfo() {
  const curInstr = document.getElementById("curInstr");
  if (curInstr) {
    curInstr.textContent = `Step ${renderCurrentStep + 1} of ${renderTotalSteps}`;
  }
}
function updateCodeDisplay() {
  if (!renderCodeEditor) return;
  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const currentLine = currentTraceStep?.line || 1;
  const prevTraceStep = renderCurrentStep > 0 ? renderExecutionTrace[renderCurrentStep - 1] : null;
  const nextTraceStep = renderCurrentStep < renderTotalSteps - 1 ? renderExecutionTrace[renderCurrentStep + 1] : null;
  const prevLine = prevTraceStep?.line;
  const nextLine = nextTraceStep?.line;
  const session = renderCodeEditor.session;
  session.clearAnnotations();
  const markers = session.getMarkers();
  if (markers) {
    for (const markerId in markers) {
      session.removeMarker(parseInt(markerId));
    }
  }
  if (nextLine && nextLine !== currentLine && nextLine !== prevLine) {
    session.addMarker(
      new ace.Range(nextLine - 2, 0, nextLine - 2, Number.MAX_VALUE),
      "ace_execution_next",
      "fullLine"
    );
  }
  if (prevLine && prevLine !== currentLine) {
    session.addMarker(
      new ace.Range(prevLine - 2, 0, prevLine - 2, Number.MAX_VALUE),
      "ace_execution_previous",
      "fullLine"
    );
  }
  {
    session.addMarker(
      new ace.Range(currentLine - 2, 0, currentLine - 2, Number.MAX_VALUE),
      "ace_execution_current",
      "fullLine"
    );
    renderCodeEditor.scrollToLine(currentLine - 1, true, true, () => {
    });
    const lineInfo = document.getElementById("lineInfo");
    if (lineInfo) {
      lineInfo.textContent = `Line ${currentLine}`;
    }
  }
  const executionStatus = document.getElementById("executionStatus");
  if (executionStatus) {
    const eventType = currentTraceStep?.event || "step";
    const stepText = `Step ${renderCurrentStep + 1}/${renderTotalSteps}`;
    const lineText = `Line ${currentLine}`;
    const eventText = eventType === "call" ? "Function call" : eventType === "return" ? "Function return" : eventType === "exception" ? "Exception" : "Executing";
    executionStatus.innerHTML = `
      <strong>${stepText}:</strong> ${eventText} at ${lineText}
      ${prevLine ? `<span style="color: #0066cc;">• Previous: Line ${prevLine}</span>` : ""}
      ${nextLine ? `<span style="color: #009900;">• Next: Line ${nextLine}</span>` : ""}
    `;
  }
}
function updateStackFrames() {
  const stackDiv = document.getElementById("stack");
  const globalTable = document.getElementById("global_table");
  if (!stackDiv || !globalTable) return;
  stackDiv.innerHTML = "";
  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  updateGlobalVariables(globalTable, currentTraceStep);
  if (currentTraceStep?.stack_to_render) {
    currentTraceStep.stack_to_render.forEach((frame, index) => {
      const frameDiv = createStackFrame(frame, index);
      stackDiv.appendChild(frameDiv);
    });
  }
}
function updateGlobalVariables(table, traceStep) {
  const globals = traceStep?.globals || {};
  console.log("updateGlobalVariables called with:", {
    traceStep,
    globals,
    globalKeys: Object.keys(globals)
  });
  let html = "";
  for (const [name, value] of Object.entries(globals)) {
    if (!isBuiltInObject(name)) {
      console.log(`Adding global variable: ${name} = ${value}`);
      html += `
        <tr>
          <td class="stackFrameVar">${escapeHtml(name)}</td>
          <td class="stackFrameValue">${formatValue(value)}</td>
        </tr>
      `;
    }
  }
  console.log("Generated HTML for globals:", html);
  table.innerHTML = html;
}
function createStackFrame(frame, index) {
  const frameDiv = document.createElement("div");
  frameDiv.className = "stackFrame";
  frameDiv.id = `stack${index}`;
  const functionName = frame.func_name || "function";
  let html = `
    <div class="stackFrameHeader">${escapeHtml(functionName)}</div>
    <table class="stackFrameVarTable">
  `;
  if (frame.ordered_varnames) {
    frame.ordered_varnames.forEach((varName) => {
      const value = frame.locals?.[varName];
      if (value !== void 0) {
        html += `
          <tr>
            <td class="stackFrameVar">${escapeHtml(varName)}</td>
            <td class="stackFrameValue">${formatValue(value)}</td>
          </tr>
        `;
      }
    });
  }
  html += `</table>`;
  frameDiv.innerHTML = html;
  return frameDiv;
}
function updateHeapObjects() {
  const heapDiv = document.getElementById("heap");
  if (!heapDiv) return;
  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const heap = currentTraceStep?.heap || {};
  let html = '<div id="heapHeader">Objects</div>';
  for (const [objId, objData] of Object.entries(heap)) {
    if (objData && typeof objData === "object") {
      html += createHeapObject(objId, objData);
    }
  }
  if (Object.keys(heap).length === 0) {
    html += '<div style="color: #999; font-style: italic; text-align: center; padding: 20px;">No objects yet</div>';
  }
  heapDiv.innerHTML = html;
}
function createHeapObject(objId, objData) {
  const objType = Array.isArray(objData) ? objData[0] : typeof objData;
  let html = `
    <div class="heapObject" id="obj${objId}">
      <div class="heapObjectHeader">${objType} (id: ${objId})</div>
      <table class="heapObjectTable">
  `;
  if (Array.isArray(objData)) {
    if (objData[0] === "LIST") {
      objData.slice(1).forEach((item, index) => {
        html += `
          <tr>
            <td>${index}</td>
            <td>${formatValue(item)}</td>
          </tr>
        `;
      });
    }
  } else if (typeof objData === "object") {
    for (const [key, value] of Object.entries(objData)) {
      html += `
        <tr>
          <td class="stackFrameVar">${escapeHtml(key)}</td>
          <td class="stackFrameValue">${formatValue(value)}</td>
        </tr>
      `;
    }
  }
  html += `</table></div>`;
  return html;
}
function updateConsoleDisplay() {
  const progOutputs = document.getElementById("progOutputs");
  const pyStdout = document.getElementById("pyStdout");
  if (!progOutputs || !pyStdout) return;
  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const stdout = currentTraceStep?.stdout || renderConsoleOutputText;
  if (stdout && stdout.trim()) {
    progOutputs.style.display = "block";
    pyStdout.value = stdout.trim();
  } else {
    progOutputs.style.display = "none";
  }
}
function updateControls() {
  const firstBtn = document.getElementById(
    "jmpFirstInstr"
  );
  const stepBackBtn = document.getElementById(
    "jmpStepBack"
  );
  const stepFwdBtn = document.getElementById("jmpStepFwd");
  const lastBtn = document.getElementById("jmpLastInstr");
  if (firstBtn) firstBtn.disabled = renderCurrentStep === 0;
  if (stepBackBtn) stepBackBtn.disabled = renderCurrentStep === 0;
  if (stepFwdBtn)
    stepFwdBtn.disabled = renderCurrentStep === renderTotalSteps - 1;
  if (lastBtn) lastBtn.disabled = renderCurrentStep === renderTotalSteps - 1;
}
function isBuiltInObject(name) {
  const builtIns = [
    "JSON",
    "Math",
    "console",
    "window",
    "document",
    "global",
    "process",
    "Buffer",
    "require",
    "__dirname",
    "__filename",
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURI",
    "decodeURI",
    "encodeURIComponent",
    "decodeURIComponent"
  ];
  return builtIns.includes(name);
}
function formatValue(value) {
  if (value === null) {
    return '<span class="nullObj">null</span>';
  } else if (value === void 0) {
    return '<span class="nullObj">undefined</span>';
  } else if (typeof value === "string") {
    return `<span class="stringObj">"${escapeHtml(value)}"</span>`;
  } else if (typeof value === "number") {
    return `<span class="primitiveObj">${value}</span>`;
  } else if (typeof value === "boolean") {
    return `<span class="primitiveObj">${value}</span>`;
  } else if (Array.isArray(value)) {
    if (value.length === 2 && value[0] === "REF") {
      return `<span style="color: #3D58A2;">→ obj${value[1]}</span>`;
    }
    if (value[0] === "LIST") {
      return `<span class="typeLabel">list [${value.length - 1} element${value.length === 2 ? "" : "s"}]</span>`;
    }
    return `<span class="typeLabel">array [${value.length} element${value.length === 1 ? "" : "s"}]</span>`;
  } else if (typeof value === "object") {
    return `<span class="typeLabel">object</span>`;
  } else if (typeof value === "function") {
    return `<span class="typeLabel">function</span>`;
  } else {
    return `<span class="primitiveObj">${String(value)}</span>`;
  }
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function showError(message) {
  const container = document.getElementById("visualizerContainer");
  if (!container) return;
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const code = urlParams.get("code");
  container.innerHTML = `
    <div class="error-container">
      <h2>❌ Error</h2>
      <p>${escapeHtml(message)}</p>
      <button class="back-btn" id="errorBackBtn">
        ⬅️ Back to Editor
      </button>
    </div>
  `;
  const errorBackBtn = document.getElementById("errorBackBtn");
  if (errorBackBtn && code) {
    errorBackBtn.addEventListener("click", () => {
      window.location.href = `visualize.html#mode=edit&code=${encodeURIComponent(
        code
      )}`;
    });
  } else if (errorBackBtn) {
    errorBackBtn.addEventListener("click", () => {
      window.location.href = "visualize.html#mode=edit";
    });
  }
}
window.modernRenderApp = {
  initializeVisualization,
  renderCurrentStep,
  renderTotalSteps,
  renderExecutionTrace
};
