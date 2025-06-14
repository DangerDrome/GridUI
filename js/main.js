/**
 * Main application code
 * Initializes the grid system and handles UI interactions
 */
 
// Global reference to grid instance
let gridInstance;

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
  
  // Setup context menu for right-click adding items
  setupContextMenu(container, grid);
  
  // Set up event listeners
  const addItemBtn = document.getElementById('add-item-btn');
  addItemBtn.addEventListener('click', () => {
    showAddItemDialog(grid);
  });
  
  // Save button removed as it's replaced by Export/Import functionality
  
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
  
  // Store grid instance globally
  gridInstance = grid;
  
  // Set up file tree event listener for opening markdown files
  document.addEventListener('file-selected', handleFileSelected, true);
  
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
 * Handle file selected from file tree
 * @param {CustomEvent} event - The file-selected event
 */
async function handleFileSelected(event) {
  const fileData = event.detail;
  const filePath = fileData.path;
  const fileContents = fileData.contents;
  
  console.log('File selected:', filePath, fileData);
  
  // Check if it's a markdown file
  if (filePath && (filePath.endsWith('.md') || filePath.endsWith('.markdown'))) {
    // Get or create a markdown editor
    let markdownItem = findMarkdownEditor();
    
    if (!markdownItem) {
      // Create a new markdown editor if none exists
      gridInstance.addItem({
        x: 30, // Position it next to the file tree
        y: 0,
        width: 40,
        height: 40,
        plugin: {
          type: 'markdown',
          state: {
            content: fileContents || ''
          }
        }
      });
      showNotification(`Opened ${filePath.split('/').pop()} in new Markdown Editor`);
    } else {
      // Update the existing markdown editor
      const pluginInstance = markdownItem.plugin;
      if (pluginInstance && typeof pluginInstance.setState === 'function') {
        pluginInstance.setState({ content: fileContents || '' });
        pluginInstance.render();
        showNotification(`Opened ${filePath.split('/').pop()} in Markdown Editor`);
      }
    }
  }
  // Check if it's a video file
  else if (filePath && (
    filePath.endsWith('.mp4') || 
    filePath.endsWith('.webm') || 
    filePath.endsWith('.ogg') || 
    filePath.endsWith('.mov') || 
    filePath.endsWith('.avi')
  )) {
    console.log('Video file selected:', fileData);
    
    // Create blob URL for the video file if we have a handle
    let videoUrl = '';
    if (fileData.handle) {
      try {
        const file = await fileData.handle.getFile();
        videoUrl = URL.createObjectURL(file);
        console.log('Created blob URL for video:', videoUrl);
      } catch (err) {
        console.error('Error creating blob URL:', err);
      }
    }
    
    // Get or create a video player
    let videoItem = findVideoPlayer();
    
    if (!videoItem) {
      // Create a new video player if none exists
      gridInstance.addItem({
        x: 30, // Position it appropriately
        y: 0,
        width: 40,
        height: 30,
        plugin: {
          type: 'video',
          options: {
            controls: true
          },
          state: {
            src: videoUrl || fileData.url || fileData.blobUrl || fileData.path
          }
        }
      });
      showNotification(`Opened ${filePath.split('/').pop()} in new Video Player`);
    } else {
      // Update the existing video player
      const pluginInstance = videoItem.plugin;
      if (pluginInstance && typeof pluginInstance.setState === 'function') {
        pluginInstance.setState({ 
          src: videoUrl || fileData.url || fileData.blobUrl || fileData.path,
          currentTime: 0,
          playing: false
        });
        pluginInstance.render();
        showNotification(`Opened ${filePath.split('/').pop()} in Video Player`);
      }
    }
  }
}

/**
 * Find an existing markdown editor in the grid
 * @returns {Object|null} - The markdown editor grid item or null if not found
 */
function findMarkdownEditor() {
  if (!gridInstance || !gridInstance.items) {
    console.log('No grid instance or items found');
    return null;
  }
  
  // Items is a Map, so we need to iterate it differently
  for (const [itemId, item] of gridInstance.items) {
    console.log('Checking item:', itemId, item);
    // Check both ways - either through constructor.type or directly through pluginType
    if ((item.plugin && item.plugin.constructor && item.plugin.constructor.type === 'markdown') || 
        (item.pluginType === 'markdown')) {
      console.log('Found markdown editor:', item);
      return item;
    }
  }
  
  console.log('No markdown editor found in grid items');
  return null;
}

/**
 * Find an existing video player in the grid
 * @returns {Object|null} - The video player grid item or null if not found
 */
function findVideoPlayer() {
  if (!gridInstance || !gridInstance.items) {
    console.log('No grid instance or items found');
    return null;
  }
  
  // Items is a Map, so we need to iterate it differently
  for (const [itemId, item] of gridInstance.items) {
    console.log('Checking item for video player:', itemId, item);
    // Check both ways - either through constructor.type or directly through pluginType
    if ((item.plugin && item.plugin.constructor && item.plugin.constructor.type === 'video') || 
        (item.pluginType === 'video')) {
      console.log('Found video player:', item);
      return item;
    }
  }
  
  console.log('No video player found in grid items');
  return null;
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
    nodegraph: '<span class="material-icons">account_tree</span>',
    imagesequence: '<span class="material-icons">collections</span>'
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
  console.log('Creating default layout directly');
  
  // Add a markdown editor
  grid.addItem({
    x: 24,
    y: 33,
    width: 44, 
    height: 26,
    plugin: {
      type: 'markdown',
      state: {
        content: '# Welcome to Grid UI\n\nThis is a resizable, sortable, extendable Grid UI System with plugin support.\n\n## Features\n\n- Drag and drop grid items\n- Resize grid items\n- Multiple content types via plugins\n- Dark and light themes\n- Persistent layouts\n- File-based export/import system'
      }
    }
  });
  
  // Add a video player
  grid.addItem({
    x: 24,
    y: 0,
    width: 30,
    height: 33,
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
    y: 0,
    width: 24,
    height: 59,
    plugin: {
      type: 'filetree'
    }
  });
  
  // Add a node graph
  grid.addItem({
    x: 68,
    y: 33,
    width: 32,
    height: 26,
    plugin: {
      type: 'nodegraph'
    }
  });
  
  // Add an image sequence player
  grid.addItem({
    x: 54,
    y: 0,
    width: 46,
    height: 33,
    plugin: {
      type: 'imagesequence',
      options: {
        framerate: 24
      }
    }
  });
  
  // Add the plugin manager
  grid.addItem({
    x: 0,
    y: 60,
    width: 100,
    height: 35,
    plugin: {
      type: 'plugin-manager'
    }
  });
  
  console.log('Default layout created successfully');
}

/**
 * Create a fallback layout if default_layout.json can't be loaded
 * @param {Grid} grid - The grid instance
 */
function createFallbackLayout(grid) {
  console.log('Using fallback layout');
  
  // Add a markdown editor
  grid.addItem({
    x: 0,
    y: 0,
    width: 30,
    height: 40,
    plugin: {
      type: 'markdown',
      state: {
        content: '# Welcome to Grid UI\n\nThis is a resizable, sortable, extendable Grid UI System with plugin support.\n\n## Features\n\n- Drag and drop grid items\n- Resize grid items\n- Multiple content types via plugins\n- Dark and light themes\n- Persistent layouts\n- File-based export/import system'
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
}

/**
 * Setup context menu for right-click on grid
 * @param {HTMLElement} container - The grid container
 * @param {Grid} grid - The grid instance
 */
function setupContextMenu(container, grid) {
  // Create context menu element
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.display = 'none';
  document.body.appendChild(contextMenu);
  
  // Variables to store mouse position
  let mouseX = 0;
  let mouseY = 0;
  let gridX = 0;
  let gridY = 0;
  
  // Listen for contextmenu event on the container
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    // Calculate position in grid coordinates
    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Store mouse position for item creation
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Calculate grid coordinates based on cell size
    const cellWidth = container.clientWidth / grid.options.columns;
    const cellHeight = grid.options.rowHeight + grid.options.gap;
    gridX = Math.floor(relativeX / cellWidth);
    gridY = Math.floor(relativeY / cellHeight);
    
    // Build context menu
    contextMenu.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'context-menu-title';
    title.innerHTML = '<span class="material-icons">add_box</span> Add Item';
    contextMenu.appendChild(title);
    
    // Add plugins to menu
    const plugins = pluginRegistry.getPluginTypes();
    plugins.forEach(type => {
      const pluginClass = pluginRegistry.plugins[type];
      const name = pluginClass.name || type;
      
      const item = document.createElement('div');
      item.className = 'context-menu-item';
      item.innerHTML = `
        <span class="context-menu-icon">${getPluginIcon(type)}</span>
        <span class="context-menu-text">${name}</span>
      `;
      
      item.addEventListener('click', () => {
        // Add new item at click position
        grid.addItem({
          x: gridX,
          y: gridY,
          width: type === 'markdown' ? 30 : 20,
          height: type === 'markdown' ? 20 : 15,
          zIndex: grid.getNextZIndex(), // Get highest z-index + 1
          plugin: { type }
        });
        
        // Hide menu
        hideContextMenu();
      });
      
      contextMenu.appendChild(item);
    });
    
    // Position and show context menu
    contextMenu.style.left = `${mouseX}px`;
    contextMenu.style.top = `${mouseY}px`;
    contextMenu.style.display = 'block';
    
    // Make sure context menu stays within viewport
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      contextMenu.style.left = `${mouseX - menuRect.width}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      contextMenu.style.top = `${mouseY - menuRect.height}px`;
    }
  });
  
  // Hide context menu when clicking elsewhere
  document.addEventListener('click', hideContextMenu);
  
  // Also hide on scroll
  document.addEventListener('scroll', hideContextMenu);
  
  function hideContextMenu() {
    contextMenu.style.display = 'none';
  }
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
