# Drawing Tool - Web Version

A standalone JavaScript drawing tool for any webpage. No browser extension required.

## Quick Start

### Option 1: CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/draw-extension@main/web/drawing-tool.js"></script>
<script>
  DrawingTool.init().enable();
</script>
```

Replace `YOUR_USERNAME` with your GitHub username.

### Option 2: Self-hosted

1. Download `drawing-tool.js`
2. Add to your project:

```html
<script src="drawing-tool.js"></script>
<script>
  DrawingTool.init().enable();
</script>
```

## Usage

### Initialize

```javascript
// Initialize (required once)
DrawingTool.init();

// Initialize with options
DrawingTool.init({
  autoLoad: false  // Don't load saved drawings from localStorage
});
```

### Enable/Disable

```javascript
// Enable drawing mode
DrawingTool.enable();

// Disable drawing mode
DrawingTool.disable();

// Toggle drawing mode
DrawingTool.toggle();

// Check if enabled
DrawingTool.isEnabled();
```

### Tools

```javascript
DrawingTool.setTool('pen');         // Pen tool
DrawingTool.setTool('highlighter'); // Highlighter tool
DrawingTool.setTool('eraser');      // Eraser tool
```

### Colors

```javascript
DrawingTool.setColor('#ff0000');  // Red
DrawingTool.setColor('#00ff00');  // Green
DrawingTool.setColor('#0000ff');  // Blue
// ... any hex color
```

### Sizes

```javascript
DrawingTool.setSize(3);   // Small
DrawingTool.setSize(8);   // Medium
DrawingTool.setSize(16);  // Large
DrawingTool.setSize(32);  // Extra Large
```

### Undo/Redo

```javascript
DrawingTool.undo();
DrawingTool.redo();
DrawingTool.clear();  // Clear all drawings
```

### Get State

```javascript
const state = DrawingTool.getState();
// { isDrawingMode, currentTool, strokeSize, strokeColor, ... }
```

## Example: Add a Toggle Button

```html
<button id="draw-btn">Toggle Drawing</button>

<script src="drawing-tool.js"></script>
<script>
  DrawingTool.init();

  document.getElementById('draw-btn').addEventListener('click', () => {
    DrawingTool.toggle();
  });
</script>
```

## Keyboard Shortcuts

When drawing mode is enabled:

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+P | Pen tool |
| Ctrl+H | Highlighter tool |
| Ctrl+E | Eraser tool |

## Features

- Pen, Highlighter, Eraser tools
- 16 colors
- 4 brush sizes (S, M, L, XL)
- Undo/Redo (50 steps)
- Auto-save to localStorage
- Draggable floating panel
- Touch support
- Keyboard shortcuts

## Browser Support

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## License

MIT
