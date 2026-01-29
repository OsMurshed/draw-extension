// Draw Extension - Popup Script
'use strict';

// State
let currentTool = 'pen';
let currentSize = 8;
let currentColor = '#ff0000';
let isDrawingMode = false;

// DOM Elements
const toggleBtn = document.getElementById('toggleBtn');
const toolBtns = document.querySelectorAll('.tool-btn');
const sizeBtns = document.querySelectorAll('.size-btn');
const colorBtns = document.querySelectorAll('.color-btn');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const colorSection = document.getElementById('colorSection');
const exportPngBtn = document.getElementById('exportPngBtn');
const copyBtn = document.getElementById('copyBtn');
const autoSaveCheckbox = document.getElementById('autoSaveCheckbox');

// Send message to content script
async function sendToContent(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    return chrome.tabs.sendMessage(tab.id, message);
  }
}

// Update UI state
function updateUI() {
  // Toggle button
  toggleBtn.classList.toggle('active', isDrawingMode);
  toggleBtn.querySelector('.toggle-text').textContent =
    isDrawingMode ? 'Disable Drawing' : 'Enable Drawing';

  // Tool buttons
  toolBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === currentTool);
  });

  // Size buttons
  sizeBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.size) === currentSize);
  });

  // Color buttons
  colorBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === currentColor);
  });

  // Hide color section for eraser
  colorSection.style.display = currentTool === 'eraser' ? 'none' : 'block';
}

// Initialize
async function init() {
  try {
    const response = await sendToContent({ action: 'getState' });
    if (response && response.success) {
      currentTool = response.state.currentTool;
      currentSize = response.state.strokeSize;
      currentColor = response.state.strokeColor;
      isDrawingMode = response.state.isDrawingMode;
      autoSaveCheckbox.checked = response.state.autoSaveEnabled;
    }
  } catch (error) {
    console.log('Could not get initial state:', error);
  }
  updateUI();
}

// Event Listeners

// Toggle drawing mode
toggleBtn.addEventListener('click', async () => {
  isDrawingMode = !isDrawingMode;
  await sendToContent({ action: 'toggleDrawingMode', enabled: isDrawingMode });
  updateUI();
});

// Tool selection
toolBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    currentTool = btn.dataset.tool;
    await sendToContent({ action: 'setTool', tool: currentTool });

    // Adjust size for highlighter
    if (currentTool === 'highlighter') {
      currentSize = Math.max(currentSize, 10);
      await sendToContent({ action: 'setStrokeSize', size: currentSize });
    }

    updateUI();
  });
});

// Size selection
sizeBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    currentSize = parseInt(btn.dataset.size);

    // Adjust size for highlighter
    if (currentTool === 'highlighter') {
      currentSize = currentSize * 4; // Highlighter sizes are larger
    }

    await sendToContent({ action: 'setStrokeSize', size: currentSize });
    updateUI();
  });
});

// Color selection
colorBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    currentColor = btn.dataset.color;
    await sendToContent({ action: 'setStrokeColor', color: currentColor });
    updateUI();
  });
});

// Clear canvas
clearBtn.addEventListener('click', async () => {
  if (confirm('Clear all annotations?')) {
    await sendToContent({ action: 'clearCanvas' });
  }
});

// Undo
undoBtn.addEventListener('click', async () => {
  await sendToContent({ action: 'undo' });
});

// Redo
redoBtn.addEventListener('click', async () => {
  await sendToContent({ action: 'redo' });
});

// Export as PNG
exportPngBtn.addEventListener('click', async () => {
  try {
    const response = await sendToContent({ action: 'getCanvasData' });

    if (response && response.success && response.data) {
      // Create download link
      const link = document.createElement('a');
      link.download = `annotations-${Date.now()}.png`;
      link.href = response.data;
      link.click();
      showStatus('Exported as PNG');
    }
  } catch (error) {
    console.error('Export failed:', error);
    showStatus('Export failed');
  }
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
  try {
    const response = await sendToContent({ action: 'getCanvasData' });

    if (response && response.success && response.data) {
      // Convert data URL to blob
      const res = await fetch(response.data);
      const blob = await res.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showStatus('Copied to clipboard');
    }
  } catch (error) {
    console.error('Copy failed:', error);
    showStatus('Copy failed - try PNG export');
  }
});

// Auto-save toggle
autoSaveCheckbox.addEventListener('change', async () => {
  await sendToContent({ action: 'setAutoSave', enabled: autoSaveCheckbox.checked });
  showStatus(autoSaveCheckbox.checked ? 'Auto-save enabled' : 'Auto-save disabled');
});

// Show status message
function showStatus(message) {
  // Remove existing status
  const existing = document.querySelector('.status-message');
  if (existing) existing.remove();

  // Create status element
  const status = document.createElement('div');
  status.className = 'status-message';
  status.textContent = message;
  document.body.appendChild(status);

  // Show and hide
  setTimeout(() => status.classList.add('show'), 10);
  setTimeout(() => {
    status.classList.remove('show');
    setTimeout(() => status.remove(), 300);
  }, 2000);
}

// Initialize on load
init();
