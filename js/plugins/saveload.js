/**
 * SaveLoad Plugin
 * Extends the base grid plugin to provide simple file-based save/load functionality
 * Allows saving and loading grid layouts and plugin states to/from JSON files
 */
class SaveLoadPlugin extends GridPlugin {
  static get type() { return 'saveload'; }
  static get name() { return 'Save & Load'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      recentFiles: options.recentFiles || []
    };
    
    // Reference to the grid instance (will be set in init)
    this.grid = null;
  }
  
  init() {
    // Get reference to grid instance
    this.grid = gridInstance;
    
    // Create the plugin UI
    this.container.innerHTML = `
      <div class="saveload-plugin">
        <div class="saveload-header">
          <h2>Save & Load Workspace</h2>
        </div>
        <div class="saveload-actions">
          <button class="saveload-btn save-btn">
            <span class="material-icons">save</span>
            Save Workspace
          </button>
          <button class="saveload-btn load-btn">
            <span class="material-icons">file_upload</span>
            Load Workspace
          </button>
        </div>
        <div class="saveload-recent">
          <h3>Recent Files</h3>
          <div class="recent-files-list">
            ${this.renderRecentFiles()}
          </div>
        </div>
        <div class="saveload-info">
          <p>Use this tool to export your workspace layout as a JSON file that can be shared and re-imported later.</p>
        </div>
      </div>
    `;
    
    // Hidden file input for loading
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    this.container.appendChild(this.fileInput);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for the plugin UI
   */
  setupEventListeners() {
    // Save button
    const saveBtn = this.container.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => this.saveToFile());
    
    // Load button
    const loadBtn = this.container.querySelector('.load-btn');
    loadBtn.addEventListener('click', () => this.fileInput.click());
    
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.loadFromFile(e.target.files[0]);
        // Reset the input to allow selecting the same file again
        e.target.value = '';
      }
    });
  }
  
  /**
   * Save the current grid layout and plugin states to a JSON file
   */
  saveToFile() {
    if (!this.grid) {
      console.error('Grid instance not available');
      return;
    }
    
    try {
      // Get the complete layout from the grid
      const layout = this.grid.saveLayout();
      
      // Create a JSON string with pretty formatting
      const jsonStr = JSON.stringify(layout, null, 2);
      
      // Generate filename with date and time
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      let filename = `gridui_workspace_${timestamp}.json`;
      
      // Prompt for custom filename
      const userFilename = prompt('Enter a name for your workspace file:', filename);
      if (userFilename) {
        filename = userFilename.endsWith('.json') ? userFilename : `${userFilename}.json`;
      }
      
      // Create a Blob with the JSON data
      const blob = new Blob([jsonStr], { type: 'application/json' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Set up and trigger download
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Add to recent files
      this.addToRecentFiles(filename);
      
      // Show notification
      this.showNotification('Workspace saved to file successfully');
    } catch (err) {
      console.error('Failed to save workspace to file:', err);
      this.showNotification('Failed to save workspace to file');
    }
  }
  
  /**
   * Load a grid layout and plugin states from a JSON file
   * @param {File} file - The JSON file to load
   */
  loadFromFile(file) {
    if (!this.grid) {
      console.error('Grid instance not available');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Parse the JSON data
        const layout = JSON.parse(e.target.result);
        
        // Confirm before loading
        if (confirm('Loading this file will replace your current workspace. Continue?')) {
          // Clear the current layout
          this.grid.clearLayout();
          
          // Apply grid options
          if (layout.gridOptions) {
            this.grid.updateOptions(layout.gridOptions);
          }
          
          // Create items
          if (layout.items && Array.isArray(layout.items)) {
            layout.items.forEach(itemData => {
              this.grid.addItem(itemData);
            });
          }
          
          // Add to recent files
          this.addToRecentFiles(file.name);
          
          // Show notification
          this.showNotification('Workspace loaded from file successfully');
        }
      } catch (err) {
        console.error('Failed to load workspace from file:', err);
        this.showNotification('Failed to load workspace from file: Invalid format');
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      this.showNotification('Error reading file');
    };
    
    // Read the file as text
    reader.readAsText(file);
  }
  
  /**
   * Add a file to the recent files list
   * @param {string} filename - The name of the file
   */
  addToRecentFiles(filename) {
    // Remove if it already exists
    const existingIndex = this.state.recentFiles.indexOf(filename);
    if (existingIndex !== -1) {
      this.state.recentFiles.splice(existingIndex, 1);
    }
    
    // Add to the beginning of the list
    this.state.recentFiles.unshift(filename);
    
    // Limit to 5 recent files
    if (this.state.recentFiles.length > 5) {
      this.state.recentFiles = this.state.recentFiles.slice(0, 5);
    }
    
    // Store in localStorage
    try {
      localStorage.setItem('gridui_recent_files', JSON.stringify(this.state.recentFiles));
    } catch (err) {
      console.warn('Could not save recent files to localStorage:', err);
    }
    
    // Update the UI
    this.updateRecentFilesList();
  }
  
  /**
   * Update the recent files list in the UI
   */
  updateRecentFilesList() {
    const recentFilesList = this.container.querySelector('.recent-files-list');
    if (recentFilesList) {
      recentFilesList.innerHTML = this.renderRecentFiles();
    }
  }
  
  /**
   * Render the HTML for the recent files list
   * @returns {string} - The HTML for the recent files list
   */
  renderRecentFiles() {
    if (!this.state.recentFiles || this.state.recentFiles.length === 0) {
      return '<p class="no-recent-files">No recent files</p>';
    }
    
    return this.state.recentFiles.map(filename => `
      <div class="recent-file-item">
        <span class="material-icons">description</span>
        <span class="recent-file-name">${filename}</span>
      </div>
    `).join('');
  }
  
  /**
   * Display a notification message
   * @param {string} message - The message to display
   */
  showNotification(message) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message);
    } else {
      console.log('Notification:', message);
      
      // Create notification element
      const notification = document.createElement('div');
      notification.className = 'notification';
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '10px 15px';
      notification.style.background = '#333';
      notification.style.color = '#fff';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.style.zIndex = '9999';
      
      // Add to document
      document.body.appendChild(notification);
      
      // Remove after animation completes
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  }
  
  /**
   * Render the plugin UI (called when state changes)
   */
  render() {
    // Update the recent files list
    this.updateRecentFilesList();
  }
  
  /**
   * Clean up resources when the plugin is destroyed
   */
  destroy() {
    // Remove event listeners
    const saveBtn = this.container.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.removeEventListener('click', this.saveToFile);
    }
    
    const loadBtn = this.container.querySelector('.load-btn');
    if (loadBtn) {
      loadBtn.removeEventListener('click', () => this.fileInput.click());
    }
    
    if (this.fileInput) {
      this.fileInput.removeEventListener('change', this.loadFromFile);
    }
    
    // Clear content
    this.container.innerHTML = '';
  }
  
  /**
   * Handle theme changes
   * @param {string} theme - The new theme ('light' or 'dark')
   */
  onThemeChange(theme) {
    // Nothing specific needed for theme changes
  }
}

// Register the plugin
pluginRegistry.register(SaveLoadPlugin);

/**
 * Add SaveLoad buttons to the application header
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DOM content to be loaded
  setTimeout(() => {
    // Get the app controls container
    const appControls = document.querySelector('.app-controls');
    
    if (appControls) {
      // Create save to file button
      const saveToFileBtn = document.createElement('button');
      saveToFileBtn.id = 'save-to-file-btn';
      saveToFileBtn.className = 'control-btn';
      saveToFileBtn.title = 'Save Workspace';
      saveToFileBtn.innerHTML = `
        <span class="btn-icon material-icons">download</span>
        <span class="btn-text">Export</span>
      `;
      
      // Create load from file button
      const loadFromFileBtn = document.createElement('button');
      loadFromFileBtn.id = 'load-from-file-btn';
      loadFromFileBtn.className = 'control-btn';
      loadFromFileBtn.title = 'Load Workspace';
      loadFromFileBtn.innerHTML = `
        <span class="btn-icon material-icons">upload</span>
        <span class="btn-text">Import</span>
      `;
      
      // Add buttons to controls
      appControls.appendChild(saveToFileBtn);
      appControls.appendChild(loadFromFileBtn);
      
      // Set up event listeners
      saveToFileBtn.addEventListener('click', () => {
        // Create a saveload plugin instance just for saving
        const saveLoader = new SaveLoadPlugin(document.createElement('div'));
        saveLoader.grid = gridInstance;
        saveLoader.saveToFile();
      });
      
      loadFromFileBtn.addEventListener('click', () => {
        // Create a saveload plugin instance just for loading
        const saveLoader = new SaveLoadPlugin(document.createElement('div'));
        saveLoader.grid = gridInstance;
        
        // Create a file input for loading
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Add event listener for file selection
        fileInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            saveLoader.loadFromFile(e.target.files[0]);
            // Reset to allow selecting the same file again
            fileInput.value = '';
          }
          // Remove the input when done
          document.body.removeChild(fileInput);
        });
        
        // Trigger file selection
        fileInput.click();
      });
    }
  }, 0);
});

/**
 * Add SaveLoad options to the context menu
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DOM content to be loaded
  setTimeout(() => {
    // Since the context menu is created dynamically in setupContextMenu,
    // we need to add our saveload options by extending the original function
    
    // Store the original function
    const originalSetupContextMenu = window.setupContextMenu;
    
    // Override the function if it exists
    if (typeof originalSetupContextMenu === 'function') {
      window.setupContextMenu = function(container, grid) {
        // Call the original function
        originalSetupContextMenu(container, grid);
        
        // Get the context menu
        const contextMenu = document.querySelector('.context-menu');
        
        if (contextMenu) {
          // Create separator
          const separator = document.createElement('div');
          separator.className = 'context-menu-separator';
          contextMenu.appendChild(separator);
          
          // Create save to file option
          const saveToFileItem = document.createElement('div');
          saveToFileItem.className = 'context-menu-item';
          saveToFileItem.innerHTML = `
            <span class="context-menu-icon"><span class="material-icons">download</span></span>
            <span class="context-menu-text">Export Workspace</span>
          `;
          
          saveToFileItem.addEventListener('click', () => {
            // Hide menu
            contextMenu.style.display = 'none';
            
            // Create a saveload plugin instance just for saving
            const saveLoader = new SaveLoadPlugin(document.createElement('div'));
            saveLoader.grid = grid;
            saveLoader.saveToFile();
          });
          
          contextMenu.appendChild(saveToFileItem);
          
          // Create load from file option
          const loadFromFileItem = document.createElement('div');
          loadFromFileItem.className = 'context-menu-item';
          loadFromFileItem.innerHTML = `
            <span class="context-menu-icon"><span class="material-icons">upload</span></span>
            <span class="context-menu-text">Import Workspace</span>
          `;
          
          loadFromFileItem.addEventListener('click', () => {
            // Hide menu
            contextMenu.style.display = 'none';
            
            // Create a saveload plugin instance just for loading
            const saveLoader = new SaveLoadPlugin(document.createElement('div'));
            saveLoader.grid = grid;
            
            // Create a file input for loading
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // Add event listener for file selection
            fileInput.addEventListener('change', (e) => {
              if (e.target.files.length > 0) {
                saveLoader.loadFromFile(e.target.files[0]);
                // Reset to allow selecting the same file again
                fileInput.value = '';
              }
              // Remove the input when done
              document.body.removeChild(fileInput);
            });
            
            // Trigger file selection
            fileInput.click();
          });
          
          contextMenu.appendChild(loadFromFileItem);
        }
      };
    }
  }, 0);
});
