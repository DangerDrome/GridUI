/**
 * Grid System
 * Main grid implementation with drag, resize, and plugin support
 */
class Grid {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      columns: 100,           // Increased column count for finer granularity
      rowHeight: 10,         // Reduced row height for smaller cells
      gap: 10,                // Reduced gap for tighter grid
      snapToGrid: true,     // Enable snapping to grid
      autoSave: true,     // Enable auto-saving of layout
      theme: 'dark' // Default theme
    }, options);
    
    this.items = new Map();
    this.nextId = 1;
    
    this.init();
  }
  
  init() {
    // Create grid container
    this.gridElement = document.createElement('div');
    this.gridElement.className = 'grid-container';
    this.container.appendChild(this.gridElement);
    
    // Apply initial theme
    document.body.setAttribute('data-theme', this.options.theme);
    
    // Load saved layout if available
    this.loadLayout();
    
    // Initialize the grid
    this.updateGridStyles();
  }
  
  updateGridStyles() {
    // Set grid CSS properties
    this.gridElement.style.setProperty('--grid-columns', this.options.columns);
    this.gridElement.style.setProperty('--grid-row-height', `${this.options.rowHeight}px`);
    this.gridElement.style.setProperty('--grid-gap', `${this.options.gap}px`);
    
    // Also apply the grid settings directly to ensure they override :root variables
    this.gridElement.style.gridTemplateColumns = `repeat(${this.options.columns}, 1fr)`;
    this.gridElement.style.gridAutoRows = `${this.options.rowHeight}px`;
    this.gridElement.style.gridGap = `${this.options.gap}px`;
    
    console.log('Grid settings updated:', this.options);
  }
  
  addItem(options = {}) {
    const id = options.id || `item-${this.nextId++}`;
    
    // Create grid item
    const itemOptions = {
      id,
      x: options.x || 0,
      y: options.y || 0,
      width: options.width || 3,
      height: options.height || 2,
      zIndex: options.zIndex || 1,
      plugin: options.plugin || { type: 'markdown' } // Default to markdown
    };
    
    // Create DOM element
    const element = document.createElement('div');
    element.className = 'grid-item';
    element.dataset.id = id;
    element.dataset.x = itemOptions.x;
    element.dataset.y = itemOptions.y;
    element.dataset.width = itemOptions.width;
    element.dataset.height = itemOptions.height;
    element.dataset.zIndex = itemOptions.zIndex;
    
    // Set grid position and size
    element.style.gridColumnStart = itemOptions.x + 1;
    element.style.gridColumnEnd = itemOptions.x + itemOptions.width + 1;
    element.style.gridRowStart = itemOptions.y + 1;
    element.style.gridRowEnd = itemOptions.y + itemOptions.height + 1;
    element.style.zIndex = itemOptions.zIndex;
    
    // Create item header with title and controls
    const header = document.createElement('div');
    header.className = 'grid-item-header';
    
    // Get plugin display name
    const pluginInfo = this.getPluginInfo(itemOptions.plugin.type);
    
    header.innerHTML = `
      <div class="grid-item-title">${pluginInfo.name}</div>
      <div class="grid-item-controls">
        <button class="grid-item-close" title="Close">×</button>
      </div>
    `;
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'grid-item-content';
    
    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'grid-item-resize';
    
    // Assemble the item
    element.appendChild(header);
    element.appendChild(content);
    element.appendChild(resizeHandle);
    
    // Add to grid
    this.gridElement.appendChild(element);
    
    // Set up event handlers
    this.setupDragHandlers(element, header);
    this.setupResizeHandlers(element, resizeHandle);
    
    // Set up close button
    const closeBtn = element.querySelector('.grid-item-close');
    closeBtn.addEventListener('click', () => {
      this.removeItem(id);
    });
    
    // Create plugin instance
    const plugin = pluginRegistry.createPlugin(
      itemOptions.plugin.type,
      content,
      itemOptions.plugin.options
    );
    
    // Initialize plugin
    if (plugin) {
      plugin.init();
      
      // Load state if available
      if (itemOptions.plugin.state) {
        plugin.deserialize({
          options: itemOptions.plugin.options,
          state: itemOptions.plugin.state
        });
      }
    }
    
    // Store item data
    this.items.set(id, {
      element,
      content,
      x: itemOptions.x,
      y: itemOptions.y,
      width: itemOptions.width,
      height: itemOptions.height,
      zIndex: itemOptions.zIndex,
      plugin,
      pluginType: itemOptions.plugin.type
    });
    
    // Auto save if enabled
    if (this.options.autoSave) {
      this.saveLayout();
    }
    
    return id;
  }
  
  removeItem(id) {
    const item = this.items.get(id);
    if (!item) return;
    
    // Clean up plugin
    if (item.plugin) {
      item.plugin.destroy();
    }
    
    // Remove DOM element
    if (item.element && item.element.parentNode) {
      item.element.parentNode.removeChild(item.element);
    }
    
    // Remove from items collection
    this.items.delete(id);
    
    // Auto save if enabled
    if (this.options.autoSave) {
      this.saveLayout();
    }
  }
  
  getItem(id) {
    return this.items.get(id);
  }
  
  setupDragHandlers(element, header) {
    let isDragging = false;
    let startX, startY;
    let startGridX, startGridY;
    
    const startDrag = (e) => {
      e.preventDefault();
      isDragging = true;
      
      // Store initial mouse/touch position
      if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }
      
      // Store initial grid position
      startGridX = parseInt(element.dataset.x);
      startGridY = parseInt(element.dataset.y);
      
      // Add global event listeners
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      
      // Increase z-index during drag
      element.style.zIndex = 1000;
    };
    
    const onDrag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      let clientX, clientY;
      if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // Calculate drag distance in grid cells
      const cellWidth = (this.gridElement.clientWidth / this.options.columns);
      const cellHeight = this.options.rowHeight + this.options.gap;
      
      // Use standard calculation for delta - fixes the "faster than mouse" issue
      const deltaX = Math.round((clientX - startX) / cellWidth);
      const deltaY = Math.round((clientY - startY) / cellHeight);
      
      // Calculate new grid position
      const newGridX = Math.max(0, Math.min(this.options.columns - parseInt(element.dataset.width), startGridX + deltaX));
      const newGridY = Math.max(0, startGridY + deltaY);
      
      // Update element position
      element.style.gridColumnStart = newGridX + 1;
      element.style.gridColumnEnd = newGridX + parseInt(element.dataset.width) + 1;
      element.style.gridRowStart = newGridY + 1;
      element.style.gridRowEnd = newGridY + parseInt(element.dataset.height) + 1;
      
      // Update dataset
      element.dataset.x = newGridX;
      element.dataset.y = newGridY;
    };
    
    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      
      // Remove global event listeners
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      
      // Reset z-index
      element.style.zIndex = element.dataset.zIndex;
      
      // Update item data
      const itemId = element.dataset.id;
      const item = this.items.get(itemId);
      
      if (item) {
        item.x = parseInt(element.dataset.x);
        item.y = parseInt(element.dataset.y);
        
        // Auto save if enabled
        if (this.options.autoSave) {
          this.saveLayout();
        }
      }
    };
    
    header.addEventListener('mousedown', startDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
  }
  
  setupResizeHandlers(element, handle) {
    let isResizing = false;
    let startX, startY;
    let startWidth, startHeight;
    
    const startResize = (e) => {
      e.preventDefault();
      isResizing = true;
      
      // Store initial mouse/touch position
      if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }
      
      // Store initial size
      startWidth = parseInt(element.dataset.width);
      startHeight = parseInt(element.dataset.height);
      
      // Add global event listeners
      document.addEventListener('mousemove', onResize);
      document.addEventListener('touchmove', onResize, { passive: false });
      document.addEventListener('mouseup', stopResize);
      document.addEventListener('touchend', stopResize);
    };
    
    const onResize = (e) => {
      if (!isResizing) return;
      e.preventDefault();
      
      let clientX, clientY;
      if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // Calculate resize distance in grid cells
      const cellWidth = (this.gridElement.clientWidth / this.options.columns);
      const cellHeight = this.options.rowHeight + this.options.gap;
      
      // Use standard calculation for delta - fixes the "faster than mouse" issue
      const deltaX = Math.round((clientX - startX) / cellWidth);
      const deltaY = Math.round((clientY - startY) / cellHeight);
      
      // Calculate new size (minimum 1x1)
      const newWidth = Math.max(1, Math.min(this.options.columns - parseInt(element.dataset.x), startWidth + deltaX));
      const newHeight = Math.max(1, startHeight + deltaY);
      
      // Update element size
      element.style.gridColumnEnd = (parseInt(element.style.gridColumnStart) + newWidth);
      element.style.gridRowEnd = (parseInt(element.style.gridRowStart) + newHeight);
      
      // Update dataset
      element.dataset.width = newWidth;
      element.dataset.height = newHeight;
    };
    
    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      
      // Remove global event listeners
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('touchmove', onResize);
      document.removeEventListener('mouseup', stopResize);
      document.removeEventListener('touchend', stopResize);
      
      // Update item data
      const itemId = element.dataset.id;
      const item = this.items.get(itemId);
      
      if (item) {
        item.width = parseInt(element.dataset.width);
        item.height = parseInt(element.dataset.height);
        
        // Notify plugin about resize
        if (item.plugin && typeof item.plugin.onResize === 'function') {
          item.plugin.onResize(item.width, item.height);
        }
        
        // Auto save if enabled
        if (this.options.autoSave) {
          this.saveLayout();
        }
      }
    };
    
    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: false });
  }
  
  saveLayout() {
    const layout = {
      gridOptions: this.options,
      items: []
    };
    
    // Serialize each item
    this.items.forEach((item, id) => {
      const itemData = {
        id,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        zIndex: item.zIndex,
        plugin: {
          type: item.pluginType,
          options: item.plugin ? item.plugin.options : {},
          state: item.plugin ? item.plugin.state : {}
        }
      };
      
      layout.items.push(itemData);
    });
    
    // Save to localStorage
    try {
      localStorage.setItem('grid-layout', JSON.stringify(layout));
    } catch (err) {
      console.error('Failed to save layout:', err);
    }
    
    return layout;
  }
  
  loadLayout() {
    try {
      const savedLayout = localStorage.getItem('grid-layout');
      
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        
        // Apply grid options
        if (layout.gridOptions) {
          this.options = Object.assign(this.options, layout.gridOptions);
          this.updateGridStyles();
        }
        
        // Create items
        if (layout.items && Array.isArray(layout.items)) {
          layout.items.forEach(itemData => {
            this.addItem(itemData);
          });
        }
      }
    } catch (err) {
      console.error('Failed to load layout:', err);
    }
  }
  
  clearLayout() {
    // Remove all items
    this.items.forEach((item, id) => {
      this.removeItem(id);
    });
    
    // Reset counter
    this.nextId = 1;
    
    // Clear saved layout
    localStorage.removeItem('grid-layout');
  }
  
  toggleTheme() {
    this.options.theme = this.options.theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', this.options.theme);
    
    // Notify plugins about theme change
    this.items.forEach(item => {
      if (item.plugin && typeof item.plugin.onThemeChange === 'function') {
        item.plugin.onThemeChange(this.options.theme);
      }
    });
    
    // Save settings
    if (this.options.autoSave) {
      this.saveLayout();
    }
    
    return this.options.theme;
  }
  
  /**
   * Update grid options
   * @param {Object} newOptions - New grid options
   */
  updateOptions(newOptions) {
    // Update options
    this.options = Object.assign(this.options, newOptions);
    
    // Update grid styles
    this.updateGridStyles();
    
    // Save layout if autoSave is enabled
    if (this.options.autoSave) {
      this.saveLayout();
    }
    
    return this.options;
  }
  
  getPluginInfo(type) {
    const pluginClass = pluginRegistry.plugins[type];
    return {
      type,
      name: pluginClass ? pluginClass.name || type : type
    };
  }
}
