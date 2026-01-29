// Draw Extension - Canvas Overlay with Undo/Redo, Shortcuts, Floating Panel
(function() {
  'use strict';

  if (window.drawExtensionInitialized) return;
  window.drawExtensionInitialized = true;

  // State
  const state = {
    isDrawingMode: false,
    isDrawing: false,
    currentTool: 'pen',
    strokeSize: 5,
    strokeColor: '#ff0000',
    lastX: 0,
    lastY: 0,
    autoSaveEnabled: true,
    autoSaveTimeout: null,
    hasUnsavedChanges: false,
    panelMinimized: false
  };

  // ========== UNDO/REDO HISTORY ==========
  const history = {
    states: [],
    index: -1,
    maxSize: 50
  };

  function saveToHistory() {
    // Remove any redo states
    history.states = history.states.slice(0, history.index + 1);
    // Save current state
    history.states.push(mainCanvas.toDataURL());
    history.index++;
    // Limit history size
    if (history.states.length > history.maxSize) {
      history.states.shift();
      history.index--;
    }
    updateUndoRedoButtons();
  }

  function undo() {
    if (history.index > 0) {
      history.index--;
      loadHistoryState(history.index);
      updateUndoRedoButtons();
      scheduleAutoSave();
    }
  }

  function redo() {
    if (history.index < history.states.length - 1) {
      history.index++;
      loadHistoryState(history.index);
      updateUndoRedoButtons();
      scheduleAutoSave();
    }
  }

  function loadHistoryState(index) {
    const img = new Image();
    img.onload = () => {
      mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      mainCtx.drawImage(img, 0, 0);
    };
    img.src = history.states[index];
  }

  function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('draw-ext-undo');
    const redoBtn = document.getElementById('draw-ext-redo');
    if (undoBtn) undoBtn.disabled = history.index <= 0;
    if (redoBtn) redoBtn.disabled = history.index >= history.states.length - 1;
  }

  // ========== MAIN CANVAS ==========
  const mainCanvas = document.createElement('canvas');
  mainCanvas.id = 'draw-extension-canvas';
  mainCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:2147483640;pointer-events:none;';
  document.body.appendChild(mainCanvas);
  const mainCtx = mainCanvas.getContext('2d');

  // ========== DRAWING CANVAS ==========
  const drawCanvas = document.createElement('canvas');
  drawCanvas.id = 'draw-extension-active';
  drawCanvas.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483645;pointer-events:none;';
  document.body.appendChild(drawCanvas);
  const drawCtx = drawCanvas.getContext('2d', { desynchronized: true });

  // ========== FLOATING PANEL ==========
  const panel = document.createElement('div');
  panel.id = 'draw-ext-panel';
  panel.innerHTML = `
    <div id="draw-ext-panel-header">
      <span>Draw</span>
      <div>
        <button id="draw-ext-minimize" title="Minimize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
        </button>
        <button id="draw-ext-close" title="Stop Drawing">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div id="draw-ext-panel-body">
      <div class="draw-ext-section">
        <button class="draw-ext-tool active" data-tool="pen" title="Pen (Ctrl+P)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </button>
        <button class="draw-ext-tool" data-tool="highlighter" title="Highlighter (Ctrl+H)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/></svg>
        </button>
        <button class="draw-ext-tool" data-tool="eraser" title="Eraser (Ctrl+E)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16c-.6-.6-.6-1.5 0-2.1l10-10c.6-.6 1.5-.6 2.1 0l6 6c.6.6.6 1.5 0 2.1L13 20"/><path d="M6 11l8 8"/></svg>
        </button>
      </div>
      <div class="draw-ext-section" id="draw-ext-colors">
        <button class="draw-ext-color active" data-color="#ff0000" style="background:#ff0000" title="Red"></button>
        <button class="draw-ext-color" data-color="#00ff00" style="background:#00ff00" title="Green"></button>
        <button class="draw-ext-color" data-color="#0000ff" style="background:#0000ff" title="Blue"></button>
        <button class="draw-ext-color" data-color="#ffff00" style="background:#ffff00" title="Yellow"></button>
        <button class="draw-ext-color" data-color="#ff00ff" style="background:#ff00ff" title="Magenta"></button>
        <button class="draw-ext-color" data-color="#ffa500" style="background:#ffa500" title="Orange"></button>
        <button class="draw-ext-color" data-color="#000000" style="background:#000000" title="Black"></button>
        <button class="draw-ext-color" data-color="#ffffff" style="background:#ffffff" title="White"></button>
        <button class="draw-ext-color" data-color="#00ffff" style="background:#00ffff" title="Cyan"></button>
        <button class="draw-ext-color" data-color="#ff69b4" style="background:#ff69b4" title="Pink"></button>
        <button class="draw-ext-color" data-color="#800080" style="background:#800080" title="Purple"></button>
        <button class="draw-ext-color" data-color="#8b4513" style="background:#8b4513" title="Brown"></button>
        <button class="draw-ext-color" data-color="#808080" style="background:#808080" title="Gray"></button>
        <button class="draw-ext-color" data-color="#32cd32" style="background:#32cd32" title="Lime"></button>
        <button class="draw-ext-color" data-color="#000080" style="background:#000080" title="Navy"></button>
        <button class="draw-ext-color" data-color="#ff7f50" style="background:#ff7f50" title="Coral"></button>
      </div>
      <div class="draw-ext-section">
        <button class="draw-ext-size" data-size="3" title="Small">S</button>
        <button class="draw-ext-size active" data-size="8" title="Medium">M</button>
        <button class="draw-ext-size" data-size="16" title="Large">L</button>
        <button class="draw-ext-size" data-size="32" title="Extra Large">LL</button>
      </div>
      <div class="draw-ext-section">
        <button id="draw-ext-undo" title="Undo (Ctrl+Z)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
        </button>
        <button id="draw-ext-redo" title="Redo (Ctrl+Y)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>
        </button>
        <button id="draw-ext-clear" title="Clear All">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
    </div>
  `;
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    background: #1a1a2e;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: none;
    user-select: none;
    min-width: 180px;
  `;
  document.body.appendChild(panel);

  // Panel styles
  const panelStyles = document.createElement('style');
  panelStyles.textContent = `
    #draw-ext-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #2a2a4e;
      border-radius: 10px 10px 0 0;
      cursor: move;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }
    #draw-ext-panel-header > div {
      display: flex;
      gap: 4px;
    }
    #draw-ext-panel-header button {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #draw-ext-panel-header button:hover {
      background: rgba(255,255,255,0.1);
    }
    #draw-ext-close:hover {
      background: rgba(255,100,100,0.3) !important;
    }
    #draw-ext-panel-body {
      padding: 10px;
    }
    #draw-ext-panel.minimized #draw-ext-panel-body {
      display: none;
    }
    #draw-ext-panel.minimized #draw-ext-panel-header {
      border-radius: 10px;
    }
    #draw-ext-panel.minimized {
      min-width: auto;
    }
    .draw-ext-section {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .draw-ext-section:last-child {
      margin-bottom: 0;
    }
    .draw-ext-tool, .draw-ext-size, #draw-ext-undo, #draw-ext-redo, #draw-ext-clear {
      width: 36px;
      height: 36px;
      border: 2px solid #333;
      border-radius: 6px;
      background: #2a2a3e;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .draw-ext-tool:hover, .draw-ext-size:hover, #draw-ext-undo:hover, #draw-ext-redo:hover, #draw-ext-clear:hover {
      background: #3a3a4e;
    }
    .draw-ext-tool.active, .draw-ext-size.active {
      border-color: #4CAF50;
      background: #2a3e2a;
    }
    .draw-ext-color {
      width: 24px;
      height: 24px;
      border: 2px solid #333;
      border-radius: 4px;
      cursor: pointer;
    }
    .draw-ext-color.active {
      border-color: #fff;
      box-shadow: 0 0 0 2px #4CAF50;
    }
    #draw-ext-colors {
      display: grid;
      grid-template-columns: repeat(8, 24px);
      gap: 6px;
    }
    #draw-ext-undo:disabled, #draw-ext-redo:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(panelStyles);

  // Panel drag functionality
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const panelHeader = panel.querySelector('#draw-ext-panel-header');
  panelHeader.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    dragOffsetX = e.clientX - panel.offsetLeft;
    dragOffsetY = e.clientY - panel.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - dragOffsetX) + 'px';
    panel.style.top = (e.clientY - dragOffsetY) + 'px';
    panel.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Panel button handlers
  panel.querySelector('#draw-ext-minimize').addEventListener('click', () => {
    state.panelMinimized = !state.panelMinimized;
    panel.classList.toggle('minimized', state.panelMinimized);
    const minBtn = panel.querySelector('#draw-ext-minimize');
    minBtn.innerHTML = state.panelMinimized
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>';
  });

  panel.querySelector('#draw-ext-close').addEventListener('click', () => {
    setDrawingMode(false);
    // Notify popup that drawing mode was disabled
    chrome.runtime.sendMessage({ action: 'drawingModeChanged', enabled: false });
  });

  panel.querySelectorAll('.draw-ext-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      setTool(btn.dataset.tool);
    });
  });

  panel.querySelectorAll('.draw-ext-color').forEach(btn => {
    btn.addEventListener('click', () => {
      setColor(btn.dataset.color);
    });
  });

  panel.querySelectorAll('.draw-ext-size').forEach(btn => {
    btn.addEventListener('click', () => {
      setSize(parseInt(btn.dataset.size));
    });
  });

  panel.querySelector('#draw-ext-undo').addEventListener('click', undo);
  panel.querySelector('#draw-ext-redo').addEventListener('click', redo);
  panel.querySelector('#draw-ext-clear').addEventListener('click', () => {
    if (confirm('Clear all drawings?')) {
      clearCanvas();
      saveToHistory();
    }
  });

  function setTool(tool) {
    state.currentTool = tool;
    panel.querySelectorAll('.draw-ext-tool').forEach(b => {
      b.classList.toggle('active', b.dataset.tool === tool);
    });
    updateCursor();
  }

  function setColor(color) {
    state.strokeColor = color;
    panel.querySelectorAll('.draw-ext-color').forEach(b => {
      b.classList.toggle('active', b.dataset.color === color);
    });
  }

  function setSize(size) {
    state.strokeSize = size;
    panel.querySelectorAll('.draw-ext-size').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size) === size);
    });
  }

  // ========== KEYBOARD SHORTCUTS ==========
  document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when drawing mode is active
    if (!state.isDrawingMode) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          undo();
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'h':
          e.preventDefault();
          setTool('highlighter');
          break;
        case 'p':
          e.preventDefault();
          setTool('pen');
          break;
        case 'e':
          e.preventDefault();
          setTool('eraser');
          break;
      }
    }
  });

  // ========== CANVAS RESIZE ==========
  function resizeMainCanvas() {
    const w = Math.max(document.body.scrollWidth, window.innerWidth);
    const h = Math.max(document.body.scrollHeight, window.innerHeight);
    if (mainCanvas.width === w && mainCanvas.height === h) return;
    const imageData = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    mainCanvas.width = w;
    mainCanvas.height = h;
    mainCanvas.style.width = w + 'px';
    mainCanvas.style.height = h + 'px';
    mainCtx.putImageData(imageData, 0, 0);
  }

  function resizeDrawCanvas() {
    drawCanvas.width = window.innerWidth;
    drawCanvas.height = window.innerHeight;
    drawCanvas.style.width = window.innerWidth + 'px';
    drawCanvas.style.height = window.innerHeight + 'px';
  }

  resizeMainCanvas();
  resizeDrawCanvas();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeMainCanvas();
      resizeDrawCanvas();
    }, 300);
  });

  // ========== DRAWING FUNCTIONS ==========
  function getViewportCoords(e) {
    const touch = e.touches?.[0];
    return {
      x: touch?.clientX ?? e.clientX,
      y: touch?.clientY ?? e.clientY
    };
  }

  function setDrawingMode(enabled) {
    state.isDrawingMode = enabled;
    drawCanvas.style.pointerEvents = enabled ? 'auto' : 'none';
    panel.style.display = enabled ? 'block' : 'none';
    mainCanvas.style.display = enabled ? 'block' : 'none';
    updateCursor();
    if (enabled && history.states.length === 0) {
      saveToHistory(); // Save initial state
    }
  }

  function updateCursor() {
    drawCanvas.style.cursor = state.isDrawingMode ?
      (state.currentTool === 'eraser' ? 'cell' : 'crosshair') : 'default';
  }

  function setupDrawContext() {
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.lineWidth = state.strokeSize;
    drawCtx.strokeStyle = state.strokeColor;
    drawCtx.globalAlpha = 1;

    if (state.currentTool === 'eraser') {
      drawCtx.strokeStyle = 'rgba(180,180,180,0.7)';
    }

    drawCanvas.style.opacity = state.currentTool === 'highlighter' ? '0.25' : '1';
  }

  function startDrawing(e) {
    if (!state.isDrawingMode) return;
    state.isDrawing = true;
    const p = getViewportCoords(e);
    state.lastX = p.x;
    state.lastY = p.y;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    setupDrawContext();
    drawCtx.beginPath();
    drawCtx.arc(p.x, p.y, state.strokeSize / 2, 0, Math.PI * 2);
    drawCtx.fillStyle = drawCtx.strokeStyle;
    drawCtx.fill();
  }

  function draw(e) {
    if (!state.isDrawing) return;
    e.preventDefault();
    const p = getViewportCoords(e);
    drawCtx.beginPath();
    drawCtx.moveTo(state.lastX, state.lastY);
    drawCtx.lineTo(p.x, p.y);
    drawCtx.stroke();
    state.lastX = p.x;
    state.lastY = p.y;
  }

  function stopDrawing() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    transferToMain();
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    saveToHistory();
    scheduleAutoSave();
  }

  function transferToMain() {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    drawCanvas.style.opacity = '1';

    if (state.currentTool === 'eraser') {
      mainCtx.globalCompositeOperation = 'destination-out';
      mainCtx.drawImage(drawCanvas, scrollX, scrollY);
      mainCtx.globalCompositeOperation = 'source-over';
    } else if (state.currentTool === 'highlighter') {
      mainCtx.globalAlpha = 0.25;
      mainCtx.drawImage(drawCanvas, scrollX, scrollY);
      mainCtx.globalAlpha = 1;
    } else {
      mainCtx.drawImage(drawCanvas, scrollX, scrollY);
    }
  }

  drawCanvas.addEventListener('mousedown', startDrawing);
  drawCanvas.addEventListener('mousemove', draw);
  drawCanvas.addEventListener('mouseup', stopDrawing);
  drawCanvas.addEventListener('mouseleave', stopDrawing);
  drawCanvas.addEventListener('touchstart', startDrawing, { passive: false });
  drawCanvas.addEventListener('touchmove', draw, { passive: false });
  drawCanvas.addEventListener('touchend', stopDrawing);

  // ========== CANVAS OPERATIONS ==========
  function clearCanvas() {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  }

  function getCanvasData() {
    return mainCanvas.toDataURL('image/png');
  }

  function loadCanvasData(dataUrl) {
    const img = new Image();
    img.onload = () => {
      mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      mainCtx.drawImage(img, 0, 0);
      saveToHistory();
    };
    img.src = dataUrl;
  }

  // ========== STORAGE ==========
  function getStorageKey() {
    return 'annotations_' + location.hostname + location.pathname;
  }

  async function autoLoadAnnotations() {
    try {
      const key = getStorageKey();
      const result = await chrome.storage.local.get(key);
      if (result[key]?.data) {
        loadCanvasData(result[key].data);
      }
    } catch (e) {}
  }

  async function autoSave() {
    if (!state.autoSaveEnabled || !state.hasUnsavedChanges) return;
    try {
      await chrome.storage.local.set({
        [getStorageKey()]: {
          data: getCanvasData(),
          url: location.href,
          timestamp: Date.now()
        }
      });
      state.hasUnsavedChanges = false;
    } catch (e) {}
  }

  function scheduleAutoSave() {
    state.hasUnsavedChanges = true;
    clearTimeout(state.autoSaveTimeout);
    state.autoSaveTimeout = setTimeout(autoSave, 3000);
  }

  window.addEventListener('beforeunload', () => {
    if (state.hasUnsavedChanges) autoSave();
  });

  // ========== MESSAGE HANDLER ==========
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    switch (msg.action) {
      case 'toggleDrawingMode':
        setDrawingMode(msg.enabled);
        respond({ success: true });
        break;
      case 'setTool':
        setTool(msg.tool);
        respond({ success: true });
        break;
      case 'setStrokeSize':
        setSize(msg.size);
        respond({ success: true });
        break;
      case 'setStrokeColor':
        setColor(msg.color);
        respond({ success: true });
        break;
      case 'clearCanvas':
        clearCanvas();
        saveToHistory();
        respond({ success: true });
        break;
      case 'getCanvasData':
        respond({ success: true, data: getCanvasData() });
        break;
      case 'loadCanvasData':
        loadCanvasData(msg.data);
        respond({ success: true });
        break;
      case 'getState':
        respond({ success: true, state });
        break;
      case 'setAutoSave':
        state.autoSaveEnabled = msg.enabled;
        respond({ success: true });
        break;
      case 'undo':
        undo();
        respond({ success: true });
        break;
      case 'redo':
        redo();
        respond({ success: true });
        break;
    }
    return true;
  });

  // ========== INIT ==========
  autoLoadAnnotations();
  console.log('Draw Extension loaded with undo/redo, shortcuts, and floating panel');
})();
