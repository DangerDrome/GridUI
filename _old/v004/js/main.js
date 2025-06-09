/**
 * Main application code
 * Initializes the grid system and handles UI interactions
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get container element
  const container = document.getElementById('grid-container');
  
  // Create grid instance
  const grid = new Grid(container, {
    columns: 100,
    rowHeight: 10,
    gap: 10,
    snapToGrid: true,
    autoSave: true,
    theme: localStorage.getItem('theme') || 'dark'
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
  
  const settingsBtn = document.getElementById('settings-btn');
  settingsBtn.addEventListener('click', () => {
    showSettingsDialog(grid);
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
    <h2><span class="material-icons">add_box</span> Add New Grid Item</h2>
    <div class="plugin-list"></div>
    <button class="cancel-button"><span class="material-icons">cancel</span> Cancel</button>
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
 * @returns {string} - Icon HTML with Material Icons
 */
function getPluginIcon(type) {
  const icons = {
    markdown: '<span class="material-icons">description</span>',
    video: '<span class="material-icons">videocam</span>',
    filetree: '<span class="material-icons">folder</span>',
    nodegraph: '<span class="material-icons">account_tree</span>'
  };
  
  return icons[type] || '<span class="material-icons">insert_drive_file</span>';
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
    width: 30,
    height: 40,
    plugin: {
      type: 'markdown',
      state: {
        content: '# Welcome to Grid UI\n\nThis is a resizable, sortable, extendable Grid UI System with plugin support.\n\n## Features\n\n- Drag and drop grid items\n- Resize grid items\n- Multiple content types via plugins\n- Dark and light themes\n- Persistent layouts'
      }
    }
  });
  
  // Add a video player
  grid.addItem({
    x: 12,
    y: 0,
    width: 28,
    height: 26,
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
    y: 8,
    width: 24,
    height: 60,
    plugin: {
      type: 'filetree'
    }
  });
  
  // Add a node graph
  grid.addItem({
    x: 8,
    y: 8,
    width: 28,
    height: 26,
    plugin: {
      type: 'nodegraph'
    }
  });
}

/**
 * Show settings dialog for grid configuration
 * @param {Grid} grid - The grid instance
 */
function showSettingsDialog(grid) {
  // Create dialog element
  const dialog = document.createElement('div');
  dialog.className = 'settings-dialog';
  dialog.innerHTML = `
    <h2><span class="material-icons">settings</span> Grid Settings</h2>
    <form class="settings-form">
      <div class="settings-group">
        <h3>Grid Layout</h3>
        <div class="settings-row">
          <label class="settings-label" for="columns">Columns</label>
          <input class="settings-input" id="columns" type="number" min="1" max="100" value="${grid.options.columns}">
        </div>
        <div class="settings-row">
          <label class="settings-label" for="rowHeight">Row Height (px)</label>
          <input class="settings-input" id="rowHeight" type="number" min="5" max="200" value="${grid.options.rowHeight}">
        </div>
        <div class="settings-row">
          <label class="settings-label" for="gap">Gap (px)</label>
          <input class="settings-input" id="gap" type="number" min="0" max="50" value="${grid.options.gap}">
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Behavior</h3>
        <div class="settings-row">
          <label class="settings-label" for="snapToGrid">Snap to Grid</label>
          <input class="settings-checkbox" id="snapToGrid" type="checkbox" ${grid.options.snapToGrid ? 'checked' : ''}>
        </div>
        <div class="settings-row">
          <label class="settings-label" for="autoSave">Auto Save</label>
          <input class="settings-checkbox" id="autoSave" type="checkbox" ${grid.options.autoSave ? 'checked' : ''}>
        </div>
      </div>
      
      <div class="settings-actions">
        <button type="button" class="settings-button settings-cancel"><span class="material-icons">close</span> Cancel</button>
        <button type="submit" class="settings-button settings-save"><span class="material-icons">save</span> Save Changes</button>
      </div>
    </form>
  `;
  
  // Add dialog to document
  document.body.appendChild(dialog);
  
  // Set up event listeners
  const form = dialog.querySelector('.settings-form');
  const cancelButton = dialog.querySelector('.settings-cancel');
  
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const columnsInput = form.querySelector('#columns');
    const rowHeightInput = form.querySelector('#rowHeight');
    const gapInput = form.querySelector('#gap');
    
    // Validate inputs
    let isValid = true;
    const columns = parseInt(columnsInput.value);
    const rowHeight = parseInt(rowHeightInput.value);
    const gap = parseInt(gapInput.value);
    
    // Validate columns
    if (isNaN(columns) || columns < 1 || columns > 100) {
      columnsInput.classList.add('error');
      isValid = false;
    } else {
      columnsInput.classList.remove('error');
    }
    
    // Validate rowHeight
    if (isNaN(rowHeight) || rowHeight < 5 || rowHeight > 100) {
      rowHeightInput.classList.add('error');
      isValid = false;
    } else {
      rowHeightInput.classList.remove('error');
    }
    
    // Validate gap
    if (isNaN(gap) || gap < 0 || gap > 50) {
      gapInput.classList.add('error');
      isValid = false;
    } else {
      gapInput.classList.remove('error');
    }
    
    if (!isValid) {
      return;
    }
    
    const snapToGrid = form.querySelector('#snapToGrid').checked;
    const autoSave = form.querySelector('#autoSave').checked;
    
    // Update grid options
    grid.updateOptions({
      columns,
      rowHeight,
      gap,
      snapToGrid,
      autoSave
    });
    
    // Show notification
    showNotification('Grid settings updated');
    
    // Remove dialog
    document.body.removeChild(dialog);
  });
}
