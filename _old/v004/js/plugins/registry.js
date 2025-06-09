/**
 * Plugin Registry
 * Manages all plugin types and creates instances
 */
class PluginRegistry {
  constructor() {
    this.plugins = {};
  }
  
  /**
   * Register a plugin class
   * @param {class} pluginClass - The plugin class to register
   * @returns {PluginRegistry} - This registry, for chaining
   */
  register(pluginClass) {
    if (!pluginClass.type) {
      console.error('Plugin must have a static type property');
      return this;
    }
    
    this.plugins[pluginClass.type] = pluginClass;
    return this;
  }
  
  /**
   * Create a new plugin instance
   * @param {string} type - The type of plugin to create
   * @param {HTMLElement} container - The container element for the plugin
   * @param {Object} options - Options for the plugin
   * @returns {GridPlugin|null} - The plugin instance or null if type not found
   */
  createPlugin(type, container, options = {}) {
    if (!this.plugins[type]) {
      console.error(`Plugin type "${type}" not found`);
      return null;
    }
    
    const PluginClass = this.plugins[type];
    return new PluginClass(container, options);
  }
  
  /**
   * Get all registered plugin types
   * @returns {string[]} - Array of plugin type strings
   */
  getPluginTypes() {
    return Object.keys(this.plugins);
  }
  
  /**
   * Get information about all registered plugins
   * @returns {Array} - Array of objects with type and name properties
   */
  getPluginInfo() {
    return Object.entries(this.plugins).map(([type, pluginClass]) => ({
      type,
      name: pluginClass.name || type
    }));
  }
}

// Create global plugin registry
const pluginRegistry = new PluginRegistry();
