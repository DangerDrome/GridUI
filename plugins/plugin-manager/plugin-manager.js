/**
 * Plugin Manager Plugin
 * A centralized interface for managing, configuring, and controlling all plugins
 */
class PluginManagerPlugin extends GridPlugin {
  static get type() { return 'plugin-manager'; }
  static get name() { return 'Plugin Manager'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      selectedPlugin: null,
      view: 'list', // 'list', 'details', 'settings'
      searchQuery: ''
    };
    
    this.elements = {};
  }
  
  init() {
    // Initial setup
    this.render();
  }
  
  render() {
    // Create the UI structure
    this.container.innerHTML = `
      <div class="plugin-manager">
        <div class="pm-header">
          <h2>Plugin Manager</h2>
          <div class="pm-search">
            <input type="text" placeholder="Search plugins..." class="pm-search-input">
            <span class="material-icons">search</span>
          </div>
        </div>
        
        <div class="pm-content">
          <div class="pm-sidebar">
            <div class="pm-categories">
              <div class="pm-category active" data-category="all">All Plugins</div>
              <div class="pm-category" data-category="active">Active</div>
              <div class="pm-category" data-category="inactive">Inactive</div>
              <div class="pm-category" data-category="content">Content</div>
              <div class="pm-category" data-category="utilities">Utilities</div>
            </div>
            <div class="pm-plugin-list"></div>
          </div>
          
          <div class="pm-details">
            <div class="pm-empty-state">
              <span class="material-icons">extension</span>
              <p>Select a plugin to view details</p>
            </div>
            
            <div class="pm-plugin-details" style="display: none;">
              <div class="pm-plugin-header">
                <h3 class="pm-plugin-title"></h3>
                <label class="pm-switch">
                  <input type="checkbox" class="pm-toggle">
                  <span class="pm-slider"></span>
                </label>
              </div>
              
              <div class="pm-tabs">
                <div class="pm-tab active" data-tab="info">Information</div>
                <div class="pm-tab" data-tab="settings">Settings</div>
                <div class="pm-tab" data-tab="docs">Documentation</div>
              </div>
              
              <div class="pm-tab-content">
                <div class="pm-tab-pane active" data-pane="info">
                  <div class="pm-info-grid">
                    <div class="pm-info-item">
                      <strong>Type:</strong>
                      <span class="pm-plugin-type"></span>
                    </div>
                    <div class="pm-info-item">
                      <strong>Name:</strong>
                      <span class="pm-plugin-name"></span>
                    </div>
                    <div class="pm-info-item">
                      <strong>Status:</strong>
                      <span class="pm-plugin-status"></span>
                    </div>
                    <div class="pm-info-item">
                      <strong>Path:</strong>
                      <span class="pm-plugin-path"></span>
                    </div>
                  </div>
                  
                  <div class="pm-plugin-description"></div>
                </div>
                
                <div class="pm-tab-pane" data-pane="settings">
                  <div class="pm-settings-form"></div>
                </div>
                
                <div class="pm-tab-pane" data-pane="docs">
                  <div class="pm-docs-content markdown-body"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Cache DOM elements
    this.elements = {
      searchInput: this.container.querySelector('.pm-search-input'),
      categories: this.container.querySelectorAll('.pm-category'),
      pluginList: this.container.querySelector('.pm-plugin-list'),
      emptyState: this.container.querySelector('.pm-empty-state'),
      pluginDetails: this.container.querySelector('.pm-plugin-details'),
      pluginTitle: this.container.querySelector('.pm-plugin-title'),
      pluginToggle: this.container.querySelector('.pm-toggle'),
      tabs: this.container.querySelectorAll('.pm-tab'),
      tabPanes: this.container.querySelectorAll('.pm-tab-pane'),
      pluginType: this.container.querySelector('.pm-plugin-type'),
      pluginName: this.container.querySelector('.pm-plugin-name'),
      pluginStatus: this.container.querySelector('.pm-plugin-status'),
      pluginPath: this.container.querySelector('.pm-plugin-path'),
      pluginDescription: this.container.querySelector('.pm-plugin-description'),
      settingsForm: this.container.querySelector('.pm-settings-form'),
      docsContent: this.container.querySelector('.pm-docs-content')
    };
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Load plugins data
    this.loadPlugins();
  }
  
  setupEventHandlers() {
    // Search input
    this.elements.searchInput.addEventListener('input', () => {
      this.state.searchQuery = this.elements.searchInput.value.toLowerCase();
      this.filterPlugins();
    });
    
    // Category selection
    this.elements.categories.forEach(category => {
      category.addEventListener('click', () => {
        this.elements.categories.forEach(c => c.classList.remove('active'));
        category.classList.add('active');
        this.filterPlugins(category.dataset.category);
      });
    });
    
    // Plugin toggle
    this.elements.pluginToggle.addEventListener('change', () => {
      if (this.state.selectedPlugin) {
        this.togglePlugin(this.state.selectedPlugin, this.elements.pluginToggle.checked);
      }
    });
    
    // Tab switching
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.elements.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.dataset.tab;
        this.elements.tabPanes.forEach(pane => {
          pane.classList.toggle('active', pane.dataset.pane === tabName);
        });
        
        if (tabName === 'docs' && this.state.selectedPlugin) {
          this.loadPluginDocs(this.state.selectedPlugin);
        }
      });
    });
  }
  
  loadPlugins() {
    // Get all registered plugins from the registry
    const plugins = pluginRegistry.getPluginInfo();
    
    // Clear the plugin list
    this.elements.pluginList.innerHTML = '';
    
    // Add each plugin to the list
    plugins.forEach(plugin => {
      const item = document.createElement('div');
      item.className = 'pm-plugin-item';
      item.dataset.type = plugin.type;
      item.innerHTML = `
        <div class="pm-plugin-icon">${this.getPluginIcon(plugin.type)}</div>
        <div class="pm-plugin-info">
          <div class="pm-plugin-name">${plugin.name}</div>
          <div class="pm-plugin-type">${plugin.type}</div>
        </div>
        <div class="pm-plugin-status">
          <span class="pm-status-indicator active"></span>
        </div>
      `;
      
      item.addEventListener('click', () => {
        this.selectPlugin(plugin);
      });
      
      this.elements.pluginList.appendChild(item);
    });
  }
  
  selectPlugin(plugin) {
    // Highlight the selected plugin in the list
    const items = this.elements.pluginList.querySelectorAll('.pm-plugin-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.type === plugin.type);
    });
    
    // Update state
    this.state.selectedPlugin = plugin;
    
    // Hide empty state and show plugin details
    this.elements.emptyState.style.display = 'none';
    this.elements.pluginDetails.style.display = 'block';
    
    // Update plugin details
    this.elements.pluginTitle.textContent = plugin.name;
    this.elements.pluginType.textContent = plugin.type;
    this.elements.pluginName.textContent = plugin.name;
    this.elements.pluginStatus.textContent = 'Active'; // Would need real status tracking
    this.elements.pluginPath.textContent = `plugins/${plugin.type}/`;
    
    // Set toggle state
    this.elements.pluginToggle.checked = true; // Would need real status tracking
    
    // Load plugin description
    this.loadPluginDescription(plugin);
    
    // Load plugin settings
    this.loadPluginSettings(plugin);
    
    // If on docs tab, load docs
    const activeTab = this.container.querySelector('.pm-tab.active');
    if (activeTab && activeTab.dataset.tab === 'docs') {
      this.loadPluginDocs(plugin);
    }
  }
  
  loadPluginDescription(plugin) {
    // In a real implementation, this would load from metadata
    this.elements.pluginDescription.innerHTML = `
      <p>The ${plugin.name} plugin provides functionality for the GridUI system. 
      See the Documentation tab for more details on usage and features.</p>
    `;
  }
  
  loadPluginSettings(plugin) {
    // In a real implementation, this would load settings schema from the plugin
    this.elements.settingsForm.innerHTML = `
      <div class="pm-settings-group">
        <h4>General Settings</h4>
        <div class="pm-setting-item">
          <label>Enabled
            <input type="checkbox" checked>
          </label>
        </div>
        <div class="pm-setting-item">
          <label>Auto-load
            <input type="checkbox" checked>
          </label>
        </div>
      </div>
      
      <div class="pm-settings-group">
        <h4>Plugin-specific Settings</h4>
        <p class="pm-settings-placeholder">This plugin does not expose any configurable settings.</p>
      </div>
      
      <button class="pm-save-settings">Save Settings</button>
    `;
  }
  
  async loadPluginDocs(plugin) {
    try {
      // Attempt to fetch README.md for the plugin
      const response = await fetch(`plugins/${plugin.type}/README.md`);
      if (response.ok) {
        const markdown = await response.text();
        // In a real implementation, we would use a Markdown parser here
        this.elements.docsContent.innerHTML = `<pre>${markdown}</pre>`;
      } else {
        this.elements.docsContent.innerHTML = `<p>No documentation available for ${plugin.name}.</p>`;
      }
    } catch (error) {
      console.error('Error loading plugin documentation:', error);
      this.elements.docsContent.innerHTML = `<p>Failed to load documentation for ${plugin.name}.</p>`;
    }
  }
  
  filterPlugins(category = 'all') {
    const items = this.elements.pluginList.querySelectorAll('.pm-plugin-item');
    const query = this.state.searchQuery;
    
    items.forEach(item => {
      const pluginName = item.querySelector('.pm-plugin-name').textContent.toLowerCase();
      const pluginType = item.dataset.type.toLowerCase();
      const isActive = item.querySelector('.pm-status-indicator').classList.contains('active');
      
      let visible = true;
      
      // Apply category filter
      if (category === 'active' && !isActive) visible = false;
      if (category === 'inactive' && isActive) visible = false;
      if (category === 'content' && !['markdown', 'video', 'imagesequence'].includes(pluginType)) visible = false;
      if (category === 'utilities' && !['filetree', 'saveload', 'contextmenu-exportimport'].includes(pluginType)) visible = false;
      
      // Apply search filter
      if (query && !pluginName.includes(query) && !pluginType.includes(query)) visible = false;
      
      item.style.display = visible ? 'flex' : 'none';
    });
  }
  
  togglePlugin(plugin, enabled) {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} plugin: ${plugin.name}`);
    // In a real implementation, this would actually enable/disable the plugin
    
    // Update UI
    const pluginItem = this.elements.pluginList.querySelector(`.pm-plugin-item[data-type="${plugin.type}"]`);
    if (pluginItem) {
      const indicator = pluginItem.querySelector('.pm-status-indicator');
      indicator.classList.toggle('active', enabled);
    }
    
    this.elements.pluginStatus.textContent = enabled ? 'Active' : 'Inactive';
  }
  
  getPluginIcon(type) {
    const icons = {
      markdown: '<span class="material-icons">description</span>',
      video: '<span class="material-icons">videocam</span>',
      filetree: '<span class="material-icons">folder</span>',
      nodegraph: '<span class="material-icons">account_tree</span>',
      imagesequence: '<span class="material-icons">collections</span>',
      saveload: '<span class="material-icons">save</span>',
      'contextmenu-exportimport': '<span class="material-icons">menu</span>',
      'plugin-manager': '<span class="material-icons">extension</span>'
    };
    
    return icons[type] || '<span class="material-icons">extension</span>';
  }
  
  onResize() {
    // Handle resize events if needed
  }
  
  destroy() {
    // Clean up resources
    this.container.innerHTML = '';
  }
}

// Register the plugin with the registry
pluginRegistry.register(PluginManagerPlugin);
