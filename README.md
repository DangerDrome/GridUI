# GridUI

![image](https://github.com/user-attachments/assets/bccc7c09-6f7a-4f4b-ba72-ef2d2bdaa2e7)

![image](https://github.com/user-attachments/assets/25cf783f-eb0d-4344-8e84-24abf16444e3)

### A resizable, sortable, extendable, drag-and-drop grid system built with vanilla JavaScript, CSS, and HTML.

## Features

- **Drag and Drop**: Move grid items anywhere in the workspace by dragging their headers
- **Resizable**: Adjust item dimensions by dragging the resize handle in the bottom right corner
- **Extendable**: Plugin architecture allows for easy addition of new content types
- **Multiple Content Types**: Comes with four built-in plugins:
  - Markdown Editor with live preview
  - Video Player with custom controls
  - File Explorer with folder navigation
  - Node Graph for visual connections
- **Context Menu**: Right-click anywhere on the grid to add items directly at that location
- **Smart Z-Index Management**: Selected or newly added items are automatically brought to front
- **Dark & Light Themes**: Switch between themes with a single click
- **Persistent Settings**: Layout and preferences are saved to localStorage
- **Workspace Save/Load**: Export and import workspace layouts with custom file naming
- **Browser-Based Storage**: Save workspaces directly to the browser's IndexedDB storage
- **File Management**: Rename or delete saved workspace files
- **Responsive Design**: Works well on various screen sizes

## Live Demo

Try the [live demo](http://localhost:8000/grid-system/)

## Installation

No build process required! Simply clone the repository and serve it with any web server:

```bash
# Clone the repository
git clone https://github.com/yourusername/gridui.git

# Navigate to the project
cd gridui

Then open `index.html`

## Usage

- **Add Items**: Click the "Add Item" button in the header or right-click anywhere on the grid
- **Move Items**: Drag items by their header bars
- **Resize Items**: Drag the small triangle in the bottom-right corner
- **Close Items**: Click the "×" button in the item's header
- **Save Layout**: Click the "Save" button to persist your layout
- **Reset Layout**: Click the "Reset" button to restore default layout
- **Toggle Theme**: Click the "Theme" button to switch between light and dark mode

## Project Structure

```
grid-system/
├── css/
│   └── styles.css          # Main stylesheet with light/dark themes
├── js/
│   ├── grid.js             # Core grid functionality
│   ├── main.js             # Application initialization
│   └── plugins/            # Plugin system
│       ├── base.js         # Base plugin class
│       ├── registry.js     # Plugin registry
│       ├── markdown.js     # Markdown editor plugin
│       ├── video.js        # Video player plugin
│       ├── filetree.js     # File explorer plugin
│       └── nodegraph.js    # Node graph plugin
└── index.html              # Main HTML entry point
```

## Technical Details

### Grid System

The grid system uses CSS Grid for layout and JavaScript for interaction. Each grid item is positioned using grid coordinates, and the dragging/resizing logic translates mouse movements into grid position changes.

### Plugin Architecture

The plugin system is based on a simple inheritance model:

1. All plugins extend the base `GridPlugin` class
2. Plugins register themselves with the `pluginRegistry`
3. When adding a grid item, a plugin instance is created for that item
4. Each plugin handles its own rendering and state management

### Context Menu

The right-click context menu provides a quick way to add items exactly where you need them:

1. Right-click anywhere on the grid
2. Select a plugin type from the menu
3. A new item will be created at the clicked position
4. The new item is automatically brought to the front (highest z-index)

### Themes

Themes are implemented using CSS variables. Switching themes is as simple as changing the `data-theme` attribute on the body element, which triggers a cascade of style changes throughout the application.

### Data Persistence

The application uses the browser's localStorage API to save:
- Grid layout (position and size of items)
- Plugin configurations
- Theme preference
- Content state for each plugin

## Creating Custom Plugins

To create a new plugin:

1. Create a new JS file in the `plugins` directory
2. Extend the `GridPlugin` class
3. Implement required methods: `init()`, `render()`, and `destroy()`
4. Define static `type` and `name` properties
5. Register the plugin with `pluginRegistry.register(YourPlugin)`

Example:

```javascript
class MyCustomPlugin extends GridPlugin {
  static get type() { return 'custom'; }
  static get name() { return 'My Custom Plugin'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      // Custom state properties
    };
  }
  
  init() {
    // Initialize your plugin
    this.container.innerHTML = `
      <div class="custom-plugin">
        <h2>My Custom Plugin</h2>
        <p>Custom content goes here</p>
      </div>
    `;
    
    // Set up event listeners if needed
  }
  
  render() {
    // Update the UI based on state
  }
  
  destroy() {
    // Clean up resources
    this.container.innerHTML = '';
  }
}

// Register the plugin
pluginRegistry.register(MyCustomPlugin);
```

## Browser Compatibility

The application is compatible with all modern browsers that support:
- CSS Grid
- CSS Variables
- ES6 Classes
- LocalStorage API

## License

MIT License - feel free to use, modify, and distribute as you wish.

## Contributing

Contributions are welcome! Feel free to submit pull requests with new features, plugins, or bug fixes.

## Acknowledgments

This project was built as a demonstration of what's possible with vanilla JavaScript and modern CSS techniques, without relying on any external libraries or frameworks.
