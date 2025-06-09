/**
 * Base Plugin class
 * All plugins must extend this class
 */
class GridPlugin {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options || {};
    this.state = {};
  }
  
  // Methods each plugin will implement
  init() {
    // Initialize the plugin
    // This should be overridden by subclasses
  }
  
  render() {
    // Render the plugin content
    // This should be overridden by subclasses
  }
  
  destroy() {
    // Clean up resources
    this.container.innerHTML = '';
  }
  
  onResize() {
    // Called when the container is resized
    // This can be overridden by subclasses
  }
  
  onThemeChange(theme) {
    // Called when the theme changes
    // This can be overridden by subclasses
  }
  
  // Serialization methods
  serialize() {
    return {
      type: this.constructor.type,
      options: this.options,
      state: this.state
    };
  }
  
  deserialize(data) {
    this.options = data.options || {};
    this.state = data.state || {};
    this.render();
  }
}
