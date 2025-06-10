/**
 * Context Menu Export/Import Plugin
 * Adds export/import functionality to the context menu
 */

/**
 * Add Export/Import options to the context menu
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DOM content to be loaded
  setTimeout(() => {
    // Since the context menu is created dynamically in setupContextMenu,
    // we need to add our export/import options by extending the original function
    
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
          
          // Create export option
          const exportItem = document.createElement('div');
          exportItem.className = 'context-menu-item';
          exportItem.innerHTML = `
            <span class="context-menu-icon"><span class="material-icons">download</span></span>
            <span class="context-menu-text">Export Workspace</span>
          `;
          
          exportItem.addEventListener('click', () => {
            // Hide menu
            contextMenu.style.display = 'none';
            
            // Export functionality
            exportWorkspace(grid);
          });
          
          contextMenu.appendChild(exportItem);
          
          // Create import option
          const importItem = document.createElement('div');
          importItem.className = 'context-menu-item';
          importItem.innerHTML = `
            <span class="context-menu-icon"><span class="material-icons">upload</span></span>
            <span class="context-menu-text">Import Workspace</span>
          `;
          
          importItem.addEventListener('click', () => {
            // Hide menu
            contextMenu.style.display = 'none';
            
            // Import functionality
            importWorkspace(grid);
          });
          
          contextMenu.appendChild(importItem);
        }
      };
    }
  }, 0);
});

/**
 * Export the current workspace to a JSON file
 * @param {Object} grid - The grid instance
 */
function exportWorkspace(grid) {
  if (!grid) {
    console.error('Grid instance not available');
    return;
  }
  
  try {
    // Get the complete layout from the grid
    const layout = grid.saveLayout();
    
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
    
    // Show notification
    showNotification('Workspace exported to file successfully');
  } catch (err) {
    console.error('Failed to export workspace to file:', err);
    showNotification('Failed to export workspace to file');
  }
}

/**
 * Import a workspace from a JSON file
 * @param {Object} grid - The grid instance
 */
function importWorkspace(grid) {
  if (!grid) {
    console.error('Grid instance not available');
    return;
  }
  
  // Create a file input for loading
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // Add event listener for file selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Parse the JSON data
          const layout = JSON.parse(e.target.result);
          
          // Confirm before loading
          if (confirm('Loading this file will replace your current workspace. Continue?')) {
            // Clear the current layout
            grid.clearLayout();
            
            // Apply grid options
            if (layout.gridOptions) {
              grid.updateOptions(layout.gridOptions);
            }
            
            // Create items
            if (layout.items && Array.isArray(layout.items)) {
              layout.items.forEach(itemData => {
                grid.addItem(itemData);
              });
            }
            
            // Show notification
            showNotification('Workspace imported from file successfully');
          }
        } catch (err) {
          console.error('Failed to import workspace from file:', err);
          showNotification('Failed to import workspace from file: Invalid format');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        showNotification('Error reading file');
      };
      
      // Read the file as text
      reader.readAsText(file);
      
      // Reset to allow selecting the same file again
      fileInput.value = '';
    }
    // Remove the input when done
    document.body.removeChild(fileInput);
  });
  
  // Trigger file selection
  fileInput.click();
}

/**
 * Display a notification message
 * @param {string} message - The message to display
 */
function showNotification(message) {
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

// Add export/import buttons to the application header
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DOM content to be loaded
  setTimeout(() => {
    // Get the app controls container
    const appControls = document.querySelector('.app-controls');
    
    if (appControls) {
      // Create export button
      const exportBtn = document.createElement('button');
      exportBtn.id = 'export-btn';
      exportBtn.className = 'control-btn';
      exportBtn.title = 'Export Workspace';
      exportBtn.innerHTML = `
        <span class="btn-icon material-icons">download</span>
        <span class="btn-text">Export</span>
      `;
      
      // Create import button
      const importBtn = document.createElement('button');
      importBtn.id = 'import-btn';
      importBtn.className = 'control-btn';
      importBtn.title = 'Import Workspace';
      importBtn.innerHTML = `
        <span class="btn-icon material-icons">upload</span>
        <span class="btn-text">Import</span>
      `;
      
      // Add buttons to controls
      appControls.appendChild(exportBtn);
      appControls.appendChild(importBtn);
      
      // Set up event listeners
      exportBtn.addEventListener('click', () => {
        exportWorkspace(gridInstance);
      });
      
      importBtn.addEventListener('click', () => {
        importWorkspace(gridInstance);
      });
    }
  }, 0);
});
