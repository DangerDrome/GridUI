/**
 * Markdown Editor Plugin
 * Provides a simple markdown editor with live preview
 */
class MarkdownPlugin extends GridPlugin {
  static get type() { return 'markdown'; }
  static get name() { return 'Markdown Editor'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      content: options.content || '# Heading\nWrite markdown here'
    };
  }
  
  init() {
    this.container.innerHTML = `
      <div class="markdown-editor">
        <div class="editor-toolbar">
          <button title="Bold" data-action="bold">B</button>
          <button title="Italic" data-action="italic">I</button>
          <button title="Heading" data-action="heading">#</button>
          <button title="List" data-action="list">•</button>
          <button title="Link" data-action="link">🔗</button>
        </div>
        <div class="editor-container">
          <textarea class="markdown-input"></textarea>
          <div class="markdown-preview"></div>
        </div>
      </div>
    `;
    
    this.textarea = this.container.querySelector('.markdown-input');
    this.preview = this.container.querySelector('.markdown-preview');
    this.toolbar = this.container.querySelector('.editor-toolbar');
    
    // Set initial content
    this.textarea.value = this.state.content;
    
    // Set up event listeners
    this.textarea.addEventListener('input', () => {
      this.state.content = this.textarea.value;
      this.updatePreview();
    });
    
    // Set up toolbar buttons
    this.toolbar.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        this.handleToolbarAction(e.target.dataset.action);
      }
    });
    
    // Initial preview render
    this.updatePreview();
  }
  
  handleToolbarAction(action) {
    const textarea = this.textarea;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const selected = textarea.value.substring(selStart, selEnd);
    
    let replacement = '';
    let cursorOffset = 0;
    
    switch(action) {
      case 'bold':
        replacement = `**${selected}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        replacement = `*${selected}*`;
        cursorOffset = 1;
        break;
      case 'heading':
        replacement = `\n# ${selected}`;
        cursorOffset = 2;
        break;
      case 'list':
        replacement = `\n- ${selected}`;
        cursorOffset = 3;
        break;
      case 'link':
        replacement = `[${selected}](url)`;
        cursorOffset = 1;
        break;
    }
    
    // Insert the replacement text
    textarea.focus();
    
    if (selected) {
      textarea.value = 
        textarea.value.substring(0, selStart) + 
        replacement + 
        textarea.value.substring(selEnd);
      textarea.selectionStart = selStart + replacement.length;
      textarea.selectionEnd = selStart + replacement.length;
    } else {
      textarea.value = 
        textarea.value.substring(0, selStart) + 
        replacement + 
        textarea.value.substring(selEnd);
      textarea.selectionStart = selStart + cursorOffset;
      textarea.selectionEnd = selStart + replacement.length - cursorOffset;
    }
    
    // Update state and preview
    this.state.content = textarea.value;
    this.updatePreview();
  }
  
  updatePreview() {
    // Simple markdown parser
    let html = this.state.content
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
    
    // Wrap lists in <ul>
    html = html.replace(/<li>(.*?)<\/li>/g, function(match) {
      return '<ul>' + match + '</ul>';
    }).replace(/<\/ul><ul>/g, '');
    
    this.preview.innerHTML = html;
  }
  
  render() {
    if (!this.textarea) {
      this.init();
    } else {
      this.textarea.value = this.state.content;
      this.updatePreview();
    }
  }
  
  onThemeChange(theme) {
    // Apply appropriate theme class if needed
  }
}

// Register the plugin
pluginRegistry.register(MarkdownPlugin);
