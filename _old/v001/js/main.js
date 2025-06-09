/**
 * Main application code
 * Initializes the grid system and handles UI interactions
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get container element
  const container = document.getElementById('grid-container');
  
  // Create grid instance
  const grid = new Grid(container, {
    columns: 12,
    rowHeight: 50,
    gap: 10,
    snapToGrid: true,
    autoSave: true,
    theme: localStorage.getItem('theme') || 'light'
  });
  
  // Set up event listeners
  const addItemBtn = document.getElementById('add-item-btn');
  addItemBtn.addEventListener('click', () => {
    showAddItemDialog(grid);
  });
  
  const saveBtn = document.getElementById('save-btn');
  saveBtn.addEventListener('click', () => {
    grid.saveLayout();
    showNotification('Layout saved successfully');
  });
  
  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the layout? This cannot be undone.')) {
      grid.clearLayout();
      showNotification('Layout reset successfully');
    }
  });
  
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', () => {
    const newTheme = grid.toggleTheme();
    showNotification(`Switched to ${newTheme} theme`);
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
  });
  
  // Apply saved theme
  document.body.setAttribute('data-theme', grid.options.theme);
  
  // Create default layout if no saved layout exists
  if (!localStorage.getItem('grid-layout')) {
    createDefaultLayout(grid);
  }
});

/**
 * Show a dialog to add a new grid item
 * @param {Grid} grid - The grid instance
 */
function showAddItemDialog(grid) {
  // Create dialog element
  const dialog = document.createElement('div');
  dialog.className = 'add-item-dialog';
  dialog.innerHTML = `
    <h2>Add New Grid Item</h2>
    <div class="plugin-list"></div>
    <button class="cancel-button">Cancel</button>
  `;
  
  // Get plugin list container
  const pluginList = dialog.querySelector('.plugin-list');
  
  // Add plugin options
  const plugins = pluginRegistry.getPluginTypes();
  plugins.forEach(type => {
    const pluginClass = pluginRegistry.plugins[type];
    const name = pluginClass.name || type;
    
    const button = document.createElement('button');
    button.className = 'plugin-button';
    button.dataset.type = type;
    button.innerHTML = `
      <div class="plugin-icon">${getPluginIcon(type)}</div>
      <div class="plugin-name">${name}</div>
    `;
    
    pluginList.appendChild(button);
  });
  
  // Add dialog to document
  document.body.appendChild(dialog);
  
  // Set up event listeners
  const cancelButton = dialog.querySelector('.cancel-button');
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
  
  // Plugin button click handler
  pluginList.addEventListener('click', (e) => {
    const button = e.target.closest('.plugin-button');
    if (!button) return;
    
    const type = button.dataset.type;
    
    // Add new grid item with selected plugin
    grid.addItem({
      plugin: { type }
    });
    
    // Remove dialog
    document.body.removeChild(dialog);
  });
}

/**
 * Get icon for plugin type
 * @param {string} type - Plugin type
 * @returns {string} - Icon character
 */
function getPluginIcon(type) {
  const icons = {
    markdown: '📝',
    video: '🎬',
    filetree: '📁',
    nodegraph: '🔀'
  };
  
  return icons[type] || '📄';
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 */
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

/**
 * Create a default layout with example grid items
 * @param {Grid} grid - The grid instance
 */
function createDefaultLayout(grid) {
  // Add a markdown editor
  grid.addItem({
    x: 0,
    y: 0,
    width: 6,
    height: 4,
    plugin: {
      type: 'markdown',
      state: {
        content: '# Welcome to Grid System\n\nThis is a resizable, sortable, extendable grid with plugin support.\n\n## Features\n\n- Drag and drop grid items\n- Resize grid items\n- Multiple content types via plugins\n- Dark and light themes\n- Persistent layouts'
      }
    }
  });
  
  // Add a video player
  grid.addItem({
    x: 6,
    y: 0,
    width: 6,
    height: 4,
    plugin: {
      type: 'video',
      options: {
        controls: true
      },
      state: {
        src: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
      }
    }
  });
  
  // Add a file tree
  grid.addItem({
    x: 0,
    y: 4,
    width: 4,
    height: 5,
    plugin: {
      type: 'filetree'
    }
  });
  
  // Add a node graph
  grid.addItem({
    x: 4,
    y: 4,
    width: 8,
    height: 5,
    plugin: {
      type: 'nodegraph'
    }
  });
}
