// Modern TypeScript entry point for Interactive Coding Tutor - Render Mode
// Python Tutor-style visualization display with Ace Editor code display
// Uses D3.js and jsPlumb like the original Python Tutor for maximum compatibility

import ace from "ace-builds";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-textmate";

// Modern ES module imports instead of require()
import * as d3 from "d3";
import $ from "jquery";
import { jsPlumb } from "jsplumb";

// Make jQuery globally available (for compatibility)
(window as any).$ = $;
(window as any).jQuery = $;

console.log("🎬 Interactive Coding Tutor - Render Mode Loaded!");

// Global state for visualization (render mode)
let renderCurrentStep = 0;
let renderTotalSteps = 0;
let renderExecutionTrace: any[] = [];
let renderSourceCode = "";
let renderConsoleOutputText = "";
let renderCodeEditor: ace.Ace.Editor;

// D3 and jsPlumb instances (matching Python Tutor architecture)
let domRootD3: any;
let jsPlumbInstance: any;

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
  renderConsoleOutputText = consoleOutput;

  // Transform our simple trace format to Python Tutor format
  renderExecutionTrace = transformTraceTopythonTutorFormat(trace);
  renderCurrentStep = 0;
  renderTotalSteps = renderExecutionTrace.length;

  console.log("Original trace:", trace);
  console.log("Transformed trace:", renderExecutionTrace);
  console.log("Total steps:", renderTotalSteps);

  createVisualizationUI();
  updateVisualization();
}

// Transform our simple trace format to match Python Tutor's expected format
function transformTraceTopythonTutorFormat(trace: any[]): any[] {
  const transformedTrace: any[] = [];
  let heapObjectCounter = 1;
  const globalObjectMap = new Map(); // Track object instances globally across all steps
  let cumulativeHeap: any = {}; // Build up heap cumulatively across steps

  trace.forEach((step, stepIndex) => {
    console.log(`Step ${stepIndex}:`, step);
    console.log(`Step ${stepIndex} globals:`, step.globals);
    console.log(`Step ${stepIndex} ordered_globals:`, step.ordered_globals);
    console.log(`Step ${stepIndex} stack_to_render:`, step.stack_to_render);
    console.log(`Step ${stepIndex} heap:`, step.heap);

    // Check if this step already has Python Tutor format
    if (step.heap !== undefined && typeof step.heap === "object") {
      // Already in Python Tutor format, just ensure cumulative heap
      Object.assign(cumulativeHeap, step.heap);
      step.heap = { ...cumulativeHeap };
      transformedTrace.push(step);
      return;
    }

    const heap: any = { ...cumulativeHeap }; // Start with existing heap
    const transformedGlobals: any = {};
    const orderedGlobals: string[] = [];

    // Process globals and create heap objects for complex types
    if (step.globals) {
      for (const [name, value] of Object.entries(step.globals)) {
        if (typeof value === "function") {
          // Handle functions - they should appear in the heap like Python Tutor
          const objectId = heapObjectCounter++;
          const funcKey = `func_${name}_${value.toString().substring(0, 50)}`;

          if (!globalObjectMap.has(funcKey)) {
            globalObjectMap.set(funcKey, objectId);

            // Create FUNCTION heap object (similar to Python Tutor)
            heap[objectId] = [
              "FUNCTION",
              {
                name: name,
                __name__: name,
                __code__: value.toString(),
              },
            ];
          }

          // Reference the heap object
          transformedGlobals[name] = ["REF", globalObjectMap.get(funcKey)];
        } else if (typeof value === "object" && value !== null) {
          // Create heap object
          const objectId = heapObjectCounter++;
          const objKey = JSON.stringify(value);

          if (!globalObjectMap.has(objKey)) {
            globalObjectMap.set(objKey, objectId);

            if (Array.isArray(value)) {
              // Create LIST heap object
              heap[objectId] = ["LIST", ...value];
            } else {
              // Create DICT heap object
              heap[objectId] = ["DICT", value];
            }
          }

          // Reference the heap object
          transformedGlobals[name] = ["REF", globalObjectMap.get(objKey)];
        } else {
          // Primitive value
          transformedGlobals[name] = value;
        }
        orderedGlobals.push(name);
      }
    }

    // Create stack frames if we have function calls
    const stackToRender: any[] = [];
    if (step.stack_to_render && step.stack_to_render.length > 0) {
      step.stack_to_render.forEach((frame: any, frameIndex: number) => {
        const encodedLocals: any = {};
        const orderedVarnames: string[] = [];

        // Transform local variables
        if (frame.locals || frame.ordered_varnames) {
          const locals = frame.locals || {};
          const varnames = frame.ordered_varnames || Object.keys(locals);

          varnames.forEach((varName: string) => {
            const value = locals[varName];
            if (typeof value === "object" && value !== null) {
              // Create heap object for local variable
              const objectId = heapObjectCounter++;
              const objKey = JSON.stringify(value);

              if (!globalObjectMap.has(objKey)) {
                globalObjectMap.set(objKey, objectId);

                if (Array.isArray(value)) {
                  heap[objectId] = ["LIST", ...value];
                } else {
                  heap[objectId] = ["DICT", value];
                }
              }

              encodedLocals[varName] = ["REF", globalObjectMap.get(objKey)];
            } else {
              encodedLocals[varName] = value;
            }
            orderedVarnames.push(varName);
          });
        }

        stackToRender.push({
          frame_id: frame.frame_id || frameIndex + 1,
          encoded_locals: encodedLocals,
          is_highlighted: frameIndex === step.stack_to_render.length - 1, // Highlight top frame
          is_parent: false,
          func_name: frame.func_name || "function",
          is_zombie: false,
          parent_frame_id_list: frame.parent_frame_id_list || [],
          unique_hash: frame.unique_hash || `frame_${frameIndex}`,
          ordered_varnames: orderedVarnames,
        });
      });
    }

    // Create transformed step
    const transformedStep = {
      line: step.line || 1,
      event: step.event || "step_line",
      func_name: step.func_name || "<module>",
      globals: transformedGlobals,
      ordered_globals:
        step.ordered_globals && step.ordered_globals.length > 0
          ? step.ordered_globals
          : orderedGlobals,
      stack_to_render: stackToRender,
      heap: heap,
      stdout: step.stdout || "",
    };

    // Add exception info if present
    if (step.exception_msg) {
      transformedStep.event = "exception";
      (transformedStep as any).exception_msg = step.exception_msg;
    }

    transformedTrace.push(transformedStep);

    // Update cumulative heap for next step
    cumulativeHeap = { ...heap };
  });

  return transformedTrace;
}

// Initialize D3.js and jsPlumb for visualization
function initializeD3AndJsPlumb() {
  // Initialize D3 root selection (modern D3 doesn't need this, but for compatibility)
  domRootD3 = d3.select("#dataViz");

  // Initialize jsPlumb instance for connecting elements
  jsPlumbInstance = jsPlumb.getInstance({
    Container: "dataViz",
    Connector: ["Flowchart", { stub: [10, 10], gap: 10 }],
    ConnectionOverlays: [["Arrow", { length: 10, width: 8, location: 1 }]],
    PaintStyle: { stroke: "#666", strokeWidth: 2 },
    HoverPaintStyle: { stroke: "#333", strokeWidth: 3 },
    Endpoint: ["Dot", { radius: 3 }],
    EndpointStyle: { fill: "#666" },
    EndpointHoverStyle: { fill: "#333" },
  });

  console.log("✅ D3.js and jsPlumb initialized for visualization");
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
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 10pt;
      border-radius: 4px;
      font-weight: bold;
    }

    .execution-status.error {
      background: #ffebee;
      border: 1px solid #ffcdd2;
      color: #c62828;
    }

    .execution-status.completed {
      background: #e8f5e8;
      border: 1px solid #c8e6c9;
      color: #2e7d32;
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
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .heapObject {
      border: 1px solid #999999;
      background: #ffffff;
      display: inline-block;
      margin-right: 10px;
      margin-bottom: 10px;
      transition: all 0.2s ease;
    }

    .heapObject:hover {
      border-color: #3D58A2;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toplevelHeapObject {
      vertical-align: top;
    }

    .heapObjectHeader {
      background: #e8e8e8;
      border-bottom: 1px solid #999999;
      padding: 2px 5px;
      font-size: 8pt;
      color: #666666;
      text-align: center;
    }

    .heapObjectTable {
      border-collapse: collapse;
      min-width: 120px;
    }

    .heapObjectTable td {
      border-bottom: 1px dotted #cccccc;
      padding: 2px 4px;
      vertical-align: top;
      font-size: 9pt;
    }

    .objectRef {
      cursor: pointer;
      text-decoration: underline;
      color: #3D58A2 !important;
    }

    .objectRef:hover {
      background-color: #e6f3ff;
      text-decoration: none;
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

  // Create the Python Tutor-style layout
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

  // Initialize D3 and jsPlumb for Python Tutor compatibility
  initializeD3AndJsPlumb();

  // Add event listeners
  setupEventListeners();

  // Initialize Ace Editor for code display
  initializeRenderCodeEditor();

  // Create the global frame
  createGlobalFrame();
}

function initializeRenderCodeEditor() {
  // Configure Ace Editor
  ace.config.set(
    "basePath",
    "https://cdn.jsdelivr.net/npm/ace-builds@latest/src-noconflict/"
  );

  // Create the read-only editor for code visualization
  renderCodeEditor = ace.edit("aceCodeEditor");

  // Set editor theme and mode
  renderCodeEditor.setTheme("ace/theme/github");
  renderCodeEditor.session.setMode("ace/mode/javascript");

  // Configure as read-only display
  renderCodeEditor.setOptions({
    fontSize: "12px",
    showLineNumbers: true,
    showGutter: true,
    highlightActiveLine: false, // We'll handle this manually
    showPrintMargin: false,
    displayIndentGuides: true,
    readOnly: true,
    highlightSelectedWord: false,
    cursorStyle: "slim",
    tabSize: 2,
    useSoftTabs: true,
    wrap: false,
  });

  // Configure read-only appearance
  renderCodeEditor.setHighlightActiveLine(false);

  // Hide cursor completely using type assertion
  try {
    (renderCodeEditor.renderer as any).$cursorLayer.element.style.display =
      "none";
  } catch (e) {
    // Fallback if cursor hiding fails
    console.log("Could not hide cursor:", e);
  }

  // Set initial code
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

  // Edit Current Code button
  if (editCodeBtn) {
    editCodeBtn.addEventListener("click", () => {
      const encodedCode = encodeURIComponent(renderSourceCode);
      window.location.href = `visualize.html#mode=edit&code=${encodedCode}`;
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    // Allow keyboard navigation when not focused on input elements
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    let handled = false;

    if ((e.key === "ArrowLeft" || e.key === "h") && renderCurrentStep > 0) {
      renderCurrentStep--;
      updateVisualization();
      handled = true;
    } else if (
      (e.key === "ArrowRight" || e.key === "l") &&
      renderCurrentStep < renderTotalSteps - 1
    ) {
      renderCurrentStep++;
      updateVisualization();
      handled = true;
    } else if (e.key === "Home" || e.key === "g") {
      renderCurrentStep = 0;
      updateVisualization();
      handled = true;
    } else if (e.key === "End" || e.key === "G") {
      renderCurrentStep = renderTotalSteps - 1;
      updateVisualization();
      handled = true;
    } else if (e.key === " " || e.key === "Enter") {
      // Space or Enter to step forward
      if (renderCurrentStep < renderTotalSteps - 1) {
        renderCurrentStep++;
        updateVisualization();
        handled = true;
      }
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
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
  updateExecutionStatus();
  updateCodeDisplay();
  updateStackFrames();
  updateHeapObjects();
  updateConsoleDisplay();
  updateControls();
}

function updateStepInfo() {
  const curInstr = document.getElementById("curInstr");
  if (curInstr) {
    curInstr.textContent = `Step ${
      renderCurrentStep + 1
    } of ${renderTotalSteps}`;
  }
}

function updateExecutionStatus() {
  const executionStatus = document.getElementById("executionStatus");
  if (!executionStatus) return;

  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const isLastStep = renderCurrentStep === renderTotalSteps - 1;

  let statusMessage = "";
  let statusClass = "";

  if (!currentTraceStep) {
    statusMessage = "No execution data available";
    statusClass = "error";
  } else if (isLastStep) {
    if (currentTraceStep.event === "exception") {
      statusMessage = `⚠️ Exception occurred: ${
        currentTraceStep.exception_msg || "Unknown error"
      }`;
      statusClass = "error";
    } else {
      statusMessage = "✅ Program execution completed successfully";
      statusClass = "completed";
    }
  } else {
    const eventType = currentTraceStep.event;
    const line = currentTraceStep.line;
    const functionName = currentTraceStep.func_name;

    switch (eventType) {
      case "step_line":
        statusMessage = `📍 Executing line ${line}`;
        break;
      case "call":
        statusMessage = `📞 Calling function: ${functionName || "anonymous"}`;
        break;
      case "return":
        statusMessage = `↩️ Returning from function: ${
          functionName || "anonymous"
        }`;
        break;
      case "exception":
        statusMessage = `⚠️ Exception: ${
          currentTraceStep.exception_msg || "Unknown error"
        }`;
        statusClass = "error";
        break;
      default:
        statusMessage = `⚡ ${eventType} at line ${line}`;
    }
  }

  executionStatus.innerHTML = statusMessage;
  executionStatus.className = `execution-status ${statusClass}`;
}

function updateCodeDisplay() {
  if (!renderCodeEditor) return;

  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  const currentLine = currentTraceStep?.line || 1;

  // Get previous and next lines for enhanced visualization
  const prevTraceStep =
    renderCurrentStep > 0 ? renderExecutionTrace[renderCurrentStep - 1] : null;
  const nextTraceStep =
    renderCurrentStep < renderTotalSteps - 1
      ? renderExecutionTrace[renderCurrentStep + 1]
      : null;

  const prevLine = prevTraceStep?.line;
  const nextLine = nextTraceStep?.line;

  // Clear all previous line markers
  const session = renderCodeEditor.session;
  session.clearAnnotations();

  // Remove all existing markers
  const markers = session.getMarkers();
  if (markers) {
    for (const markerId in markers) {
      session.removeMarker(parseInt(markerId));
    }
  }

  // Add line markers for execution visualization
  // Note: Ace Editor markers use currentLine - 2 indexing for proper positioning

  // 1. Next line to execute (light green background)
  if (nextLine && nextLine !== currentLine && nextLine !== prevLine) {
    session.addMarker(
      new ace.Range(nextLine - 2, 0, nextLine - 2, Number.MAX_VALUE),
      "ace_execution_next",
      "fullLine"
    );
  }

  // 2. Previous line executed (light blue background)
  if (prevLine && prevLine !== currentLine) {
    session.addMarker(
      new ace.Range(prevLine - 2, 0, prevLine - 2, Number.MAX_VALUE),
      "ace_execution_previous",
      "fullLine"
    );
  }

  // 3. Current line being executed (yellow background)
  if (currentLine) {
    session.addMarker(
      new ace.Range(currentLine - 2, 0, currentLine - 2, Number.MAX_VALUE),
      "ace_execution_current",
      "fullLine"
    );

    // Scroll to current line
    renderCodeEditor.scrollToLine(currentLine - 1, true, true, () => {});

    // Update line info
    const lineInfo = document.getElementById("lineInfo");
    if (lineInfo) {
      lineInfo.textContent = `Line ${currentLine}`;
    }
  }

  // Update execution status
  const executionStatus = document.getElementById("executionStatus");
  if (executionStatus) {
    const eventType = currentTraceStep?.event || "step";
    const stepText = `Step ${renderCurrentStep + 1}/${renderTotalSteps}`;
    const lineText = currentLine ? `Line ${currentLine}` : "Unknown line";
    const eventText =
      eventType === "call"
        ? "Function call"
        : eventType === "return"
        ? "Function return"
        : eventType === "exception"
        ? "Exception"
        : "Executing";

    executionStatus.innerHTML = `
      <strong>${stepText}:</strong> ${eventText} at ${lineText}
      ${
        prevLine
          ? `<span style="color: #0066cc;">• Previous: Line ${prevLine}</span>`
          : ""
      }
      ${
        nextLine
          ? `<span style="color: #009900;">• Next: Line ${nextLine}</span>`
          : ""
      }
    `;
  }
}

function updateStackFrames() {
  const stackDiv = document.getElementById("stack");
  const globalTable = document.getElementById("global_table");

  if (!stackDiv || !globalTable) return;

  const currentTraceStep = renderExecutionTrace[renderCurrentStep];
  console.log(
    `Step ${renderCurrentStep} - updateStackFrames:`,
    currentTraceStep
  );

  // Update global variables first
  updateGlobalVariables(globalTable, currentTraceStep);

  // Highlight global frame if it has variables or if we're at global scope
  const globalFrame = document.getElementById("globals");
  const hasGlobals =
    currentTraceStep?.globals &&
    Object.keys(currentTraceStep.globals).some((key) => !isBuiltInObject(key));
  const isGlobalScope =
    !currentTraceStep?.stack_to_render ||
    currentTraceStep.stack_to_render.length === 0;

  if (globalFrame) {
    if (isGlobalScope || hasGlobals) {
      globalFrame.className = "stackFrame highlightedStackFrame";
    } else {
      globalFrame.className = "stackFrame";
    }
  }

  // Clear existing stack frames (but preserve global frame structure)
  const existingFrames = stackDiv.querySelectorAll(".stackFrame:not(#globals)");
  existingFrames.forEach((frame) => frame.remove());

  // Add stack frames if any
  if (
    currentTraceStep?.stack_to_render &&
    currentTraceStep.stack_to_render.length > 0
  ) {
    // Render frames in order (most recent frame at bottom)
    currentTraceStep.stack_to_render.forEach((frame: any, index: number) => {
      const frameDiv = createEnhancedStackFrame(frame, index, currentTraceStep);
      stackDiv.appendChild(frameDiv);
    });

    // Highlight the top frame (most recent call) if we're in a function
    const topFrameDiv = stackDiv.querySelector(".stackFrame:last-child");
    if (topFrameDiv && currentTraceStep.event !== "return") {
      topFrameDiv.classList.add("highlightedStackFrame");
    }
  }
}

function updateGlobalVariables(table: HTMLElement, traceStep: any) {
  const globals = traceStep?.globals || {};

  let html = "";
  let hasVisibleGlobals = false;

  for (const [name, value] of Object.entries(globals)) {
    // Filter out built-in objects for cleaner display
    if (!isBuiltInObject(name)) {
      hasVisibleGlobals = true;
      html += `
        <tr class="variableTr" id="global_var_${name}">
          <td class="stackFrameVar">${escapeHtml(name)}</td>
          <td class="stackFrameValue">${formatValue(value)}</td>
        </tr>
      `;
    }
  }

  // Show message if no global variables
  if (!hasVisibleGlobals) {
    html = `
      <tr>
        <td colspan="2" style="color: #999; font-style: italic; text-align: center; padding: 5px;">
          No global variables
        </td>
      </tr>
    `;
  }

  table.innerHTML = html;
}

function createEnhancedStackFrame(
  frame: any,
  index: number,
  currentTraceStep: any
): HTMLElement {
  const frameDiv = document.createElement("div");
  frameDiv.className = "stackFrame";
  frameDiv.id = `stack${index}`;

  // Add data attributes for frame identification (matching Python Tutor)
  frameDiv.setAttribute("data-frame_id", frame.frame_id || index);
  if (frame.parent_frame_id_list && frame.parent_frame_id_list.length > 0) {
    frameDiv.setAttribute(
      "data-parent_frame_id",
      frame.parent_frame_id_list[0]
    );
  }

  // Enhanced function name display (matching Python Tutor)
  const functionName = frame.func_name || "function";
  let headerLabel = escapeHtml(functionName);

  // Add frame ID if it's a parent frame or if showing all frame labels
  if (frame.is_parent || frame.frame_id !== undefined) {
    headerLabel = `f${frame.frame_id || index}: ${headerLabel}`;
  }

  // Add parent frame info if available
  if (frame.parent_frame_id_list && frame.parent_frame_id_list.length > 0) {
    headerLabel += ` [parent=f${frame.parent_frame_id_list[0]}]`;
  } else {
    headerLabel += ` [parent=Global]`;
  }

  let html = `
    <div class="stackFrameHeader">${headerLabel}</div>
    <table class="stackFrameVarTable">
  `;

  // Use encoded_locals (Python Tutor format) or fall back to locals
  const variables = frame.encoded_locals || frame.locals || {};
  const varNames = frame.ordered_varnames || Object.keys(variables);

  // Add frame variables with enhanced formatting
  if (varNames.length > 0) {
    varNames.forEach((varName: string) => {
      const value = variables[varName];
      if (value !== undefined) {
        html += `
          <tr class="variableTr" id="var_${
            frame.unique_hash || index
          }_${varName}">
            <td class="stackFrameVar">${escapeHtml(varName)}</td>
            <td class="stackFrameValue">${formatValue(value)}</td>
          </tr>
        `;
      }
    });
  } else {
    // Show empty frame message if no variables
    html += `
      <tr>
        <td colspan="2" style="color: #999; font-style: italic; text-align: center; padding: 5px;">
          No local variables
        </td>
      </tr>
    `;
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

  console.log(`Step ${renderCurrentStep} - updateHeapObjects:`, heap);

  let html = '<div id="heapHeader">Objects</div>';

  // Organize heap objects into rows (similar to Python Tutor's layout)
  const heapObjectIds = Object.keys(heap);

  if (heapObjectIds.length > 0) {
    // Create heap rows - for simplicity, we'll put objects in rows of 3
    const rowSize = 3;
    for (let i = 0; i < heapObjectIds.length; i += rowSize) {
      html += '<div class="heapRow">';

      const rowObjects = heapObjectIds.slice(i, i + rowSize);
      rowObjects.forEach((objId) => {
        const objData = heap[objId];
        if (objData) {
          html += createEnhancedHeapObject(objId, objData);
        }
      });

      html += "</div>";
    }
  } else {
    html +=
      '<div style="color: #999; font-style: italic; text-align: center; padding: 20px;">No objects yet</div>';
  }

  heapDiv.innerHTML = html;
}

function createEnhancedHeapObject(objId: string, objData: any): string {
  // Determine object type and structure
  let objType = "object";
  let isArray = false;
  let properties: Array<{ key: string; value: any }> = [];

  if (Array.isArray(objData)) {
    objType = objData[0] || "UNKNOWN";

    if (objType === "LIST") {
      isArray = true;
      // Convert list items to indexed properties
      objData.slice(1).forEach((item: any, index: number) => {
        properties.push({ key: index.toString(), value: item });
      });
    } else if (objType === "DICT" || objType === "INSTANCE") {
      // Handle dictionary or instance objects
      const objContents = objData[1] || {};
      for (const [key, value] of Object.entries(objContents)) {
        properties.push({ key, value });
      }
    } else if (objType === "FUNCTION") {
      // Handle function objects
      const objContents = objData[1] || {};
      if (objContents.__name__) {
        properties.push({ key: "__name__", value: objContents.__name__ });
      }
      if (objContents.__code__) {
        properties.push({
          key: "__code__",
          value: objContents.__code__.substring(0, 100) + "...",
        });
      }
      // Show other function properties
      for (const [key, value] of Object.entries(objContents)) {
        if (key !== "__name__" && key !== "__code__") {
          properties.push({ key, value });
        }
      }
    } else {
      // Generic array handling
      objData.slice(1).forEach((item: any, index: number) => {
        properties.push({ key: index.toString(), value: item });
      });
    }
  } else if (typeof objData === "object" && objData !== null) {
    // Plain JavaScript object
    objType = "object";
    for (const [key, value] of Object.entries(objData)) {
      properties.push({ key, value });
    }
  }

  // Create enhanced object header with type and ID
  const typeLabel = objType.toLowerCase();
  const elementCount = properties.length;
  const pluralSuffix = elementCount === 1 ? "" : "s";

  let headerText = "";
  if (objType === "FUNCTION") {
    headerText = `function`;
  } else if (isArray) {
    headerText = `${typeLabel} [${elementCount} element${pluralSuffix}]`;
  } else {
    headerText = `${typeLabel} [${elementCount} propert${
      elementCount === 1 ? "y" : "ies"
    }]`;
  }

  let html = `
    <div class="heapObject toplevelHeapObject" id="obj${objId}">
      <div class="heapObjectHeader">
        <span class="typeLabel">${headerText}</span>
        <br><span style="color: #666; font-size: 7pt;">id${objId}</span>
      </div>
      <table class="heapObjectTable">
  `;

  // Add properties/elements
  if (properties.length > 0) {
    properties.forEach(({ key, value }) => {
      html += `
        <tr>
          <td class="objectKey" style="font-weight: bold; color: #3D58A2; font-size: 9pt; padding: 2px 4px; border-bottom: 1px dotted #cccccc;">
            ${escapeHtml(key)}
          </td>
          <td class="objectValue" style="font-family: 'Andale Mono', monospace; font-size: 9pt; padding: 2px 4px; border-bottom: 1px dotted #cccccc;">
            ${formatValue(value)}
          </td>
        </tr>
      `;
    });
  } else {
    html += `
      <tr>
        <td colspan="2" style="color: #999; font-style: italic; text-align: center; padding: 5px; font-size: 8pt;">
          empty
        </td>
      </tr>
    `;
  }

  html += `</table></div>`;
  return html;
}

function updateConsoleDisplay() {
  const progOutputs = document.getElementById("progOutputs");
  const pyStdout = document.getElementById("pyStdout") as HTMLTextAreaElement;

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
  ) as HTMLButtonElement;
  const stepBackBtn = document.getElementById(
    "jmpStepBack"
  ) as HTMLButtonElement;
  const stepFwdBtn = document.getElementById("jmpStepFwd") as HTMLButtonElement;
  const lastBtn = document.getElementById("jmpLastInstr") as HTMLButtonElement;

  if (firstBtn) firstBtn.disabled = renderCurrentStep === 0;
  if (stepBackBtn) stepBackBtn.disabled = renderCurrentStep === 0;
  if (stepFwdBtn)
    stepFwdBtn.disabled = renderCurrentStep === renderTotalSteps - 1;
  if (lastBtn) lastBtn.disabled = renderCurrentStep === renderTotalSteps - 1;
}

function isBuiltInObject(name: string): boolean {
  const builtIns = [
    // Core JavaScript objects
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

    // Built-in functions
    "parseInt",
    "parseFloat",
    "isNaN",
    "isFinite",
    "encodeURI",
    "decodeURI",
    "encodeURIComponent",
    "decodeURIComponent",
    "escape",
    "unescape",
    "eval",

    // JavaScript constructors and prototypes
    "Object",
    "Array",
    "String",
    "Number",
    "Boolean",
    "Date",
    "RegExp",
    "Error",
    "Function",
    "Symbol",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Promise",
    "Proxy",
    "Reflect",

    // Browser/environment specific
    "setTimeout",
    "setInterval",
    "clearTimeout",
    "clearInterval",
    "fetch",
    "XMLHttpRequest",
    "location",
    "history",
    "navigator",
    "screen",
    "localStorage",
    "sessionStorage",

    // Node.js specific
    "module",
    "exports",
    "__webpack_require__",
    "__webpack_exports__",

    // Common library globals that might leak through
    "jQuery",
    "$",
    "_",
    "React",
    "Vue",
    "Angular",
  ];
  return builtIns.includes(name);
}

function formatValue(value: any): string {
  if (value === null) {
    return '<span class="nullObj">null</span>';
  } else if (value === undefined) {
    return '<span class="nullObj">undefined</span>';
  } else if (typeof value === "string") {
    // Handle special string cases and escape properly
    const escapedValue = escapeHtml(value);
    if (value.length > 50) {
      // Truncate very long strings
      const truncated = escapedValue.substring(0, 50) + "...";
      return `<span class="stringObj" title="${escapedValue}">"${truncated}"</span>`;
    }
    return `<span class="stringObj">"${escapedValue}"</span>`;
  } else if (typeof value === "number") {
    return `<span class="primitiveObj">${value}</span>`;
  } else if (typeof value === "boolean") {
    return `<span class="primitiveObj">${value}</span>`;
  } else if (typeof value === "function") {
    return '<span class="typeLabel">function</span>';
  } else if (Array.isArray(value)) {
    // Handle reference arrays like ["REF", 123] - these point to heap objects
    if (value.length === 2 && value[0] === "REF") {
      const objId = value[1];
      return `<span class="objectRef" style="color: #3D58A2; cursor: pointer; text-decoration: underline;"
                onclick="highlightHeapObject('obj${objId}')"
                onmouseover="highlightHeapObject('obj${objId}')"
                onmouseout="unhighlightHeapObject('obj${objId}')">
                → id${objId}
              </span>`;
    }

    // Handle typed array representations
    if (value.length > 0) {
      const arrayType = value[0];

      if (arrayType === "LIST") {
        const elementCount = value.length - 1;
        return `<span class="typeLabel">list [${elementCount} element${
          elementCount === 1 ? "" : "s"
        }]</span>`;
      } else if (arrayType === "DICT") {
        const entries = value[1] || {};
        const entryCount = Object.keys(entries).length;
        return `<span class="typeLabel">dict [${entryCount} entr${
          entryCount === 1 ? "y" : "ies"
        }]</span>`;
      } else if (arrayType === "INSTANCE") {
        const className = value[1] || "Object";
        return `<span class="typeLabel">${className} instance</span>`;
      } else if (arrayType === "FUNCTION") {
        const funcName = value[1] || "anonymous";
        return `<span class="typeLabel">function ${funcName}</span>`;
      } else if (arrayType === "CLASS") {
        const className = value[1] || "Class";
        return `<span class="typeLabel">class ${className}</span>`;
      }
    }

    // Generic array
    return `<span class="typeLabel">array [${value.length} element${
      value.length === 1 ? "" : "s"
    }]</span>`;
  } else if (typeof value === "object") {
    // Handle plain objects
    const keyCount = Object.keys(value).length;
    return `<span class="typeLabel">object [${keyCount} propert${
      keyCount === 1 ? "y" : "ies"
    }]</span>`;
  } else {
    // Fallback for any other types
    return `<span class="primitiveObj">${String(value)}</span>`;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Helper functions for object highlighting and interaction
function highlightHeapObject(objId: string) {
  const obj = document.getElementById(objId);
  if (obj) {
    obj.style.border = "2px solid #ffcc00";
    obj.style.backgroundColor = "#ffffcc";
  }
}

function unhighlightHeapObject(objId: string) {
  const obj = document.getElementById(objId);
  if (obj) {
    obj.style.border = "1px solid #999999";
    obj.style.backgroundColor = "#ffffff";
  }
}

// Make these functions globally available for onclick handlers
(window as any).highlightHeapObject = highlightHeapObject;
(window as any).unhighlightHeapObject = unhighlightHeapObject;

function showError(message: string) {
  const container = document.getElementById("visualizerContainer");
  if (!container) return;

  // Try to get code from URL parameters for the back button
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const code = urlParams.get("code");
  const backUrl = code
    ? `visualize.html#mode=edit&code=${encodeURIComponent(code)}`
    : "visualize.html#mode=edit";

  container.innerHTML = `
    <div class="error-container">
      <h2>❌ Error</h2>
      <p>${escapeHtml(message)}</p>
      <button class="back-btn" id="errorBackBtn">
        ⬅️ Back to Editor
      </button>
    </div>
  `;

  // Add event listener for the back button
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

// Export for global access if needed
(window as any).modernRenderApp = {
  initializeVisualization,
  renderCurrentStep,
  renderTotalSteps,
  renderExecutionTrace,
};
