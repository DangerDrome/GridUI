/**
 * File Tree Plugin
 * Provides a simple file explorer interface
 */
class FileTreePlugin extends GridPlugin {
  static get type() { return 'filetree'; }
  static get name() { return 'File Explorer'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      files: options.files || this.getDefaultFiles(),
      expanded: options.expanded || {}
    };
  }
  
  getDefaultFiles() {
    return [
      {
        name: 'Documents',
        type: 'folder',
        children: [
          { name: 'Resume.pdf', type: 'file' },
          { name: 'Notes.txt', type: 'file' }
        ]
      },
      {
        name: 'Images',
        type: 'folder',
        children: [
          { name: 'vacation.jpg', type: 'file' },
          { name: 'profile.png', type: 'file' }
        ]
      },
      {
        name: 'Projects',
        type: 'folder',
        children: [
          { 
            name: 'Website',
            type: 'folder',
            children: [
              { name: 'index.html', type: 'file' },
              { name: 'styles.css', type: 'file' },
              { name: 'app.js', type: 'file' }
            ]
          },
          { name: 'Notes.md', type: 'file' }
        ]
      }
    ];
  }
  
  init() {
    this.container.innerHTML = `
      <div class="file-tree">
        <div class="file-tree-header">
          <h3>File Explorer</h3>
          <button class="add-file">New File</button>
          <button class="add-folder">New Folder</button>
        </div>
        <div class="file-tree-content"></div>
      </div>
    `;
    
    this.treeContent = this.container.querySelector('.file-tree-content');
    
    // Add event listeners for buttons
    const addFileBtn = this.container.querySelector('.add-file');
    addFileBtn.addEventListener('click', () => this.addFile());
    
    const addFolderBtn = this.container.querySelector('.add-folder');
    addFolderBtn.addEventListener('click', () => this.addFolder());
    
    // Render the file tree
    this.renderTree();
  }
  
  renderTree() {
    this.treeContent.innerHTML = this.buildTreeHTML(this.state.files);
    
    // Add event listeners for tree items
    this.setupTreeEventListeners();
  }
  
  buildTreeHTML(items, path = '') {
    let html = '<ul class="tree">';
    
    items.forEach(item => {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      const itemId = btoa(itemPath).replace(/=/g, ''); // Simple ID generation
      
      if (item.type === 'folder') {
        const isExpanded = this.state.expanded[itemId];
        html += `
          <li class="folder ${isExpanded ? 'expanded' : 'collapsed'}" data-id="${itemId}" data-path="${itemPath}">
            <div class="folder-label">
              <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
              <span class="folder-name">${item.name}</span>
            </div>
            ${item.children && isExpanded ? this.buildTreeHTML(item.children, itemPath) : ''}
          </li>
        `;
      } else {
        html += `
          <li class="file" data-id="${itemId}" data-path="${itemPath}">
            <span class="file-icon">📄</span>
            <span class="file-name">${item.name}</span>
          </li>
        `;
      }
    });
    
    html += '</ul>';
    return html;
  }
  
  setupTreeEventListeners() {
    // Folder click events
    const folders = this.treeContent.querySelectorAll('.folder-label');
    folders.forEach(folder => {
      folder.addEventListener('click', (e) => {
        const li = folder.closest('li');
        const folderId = li.dataset.id;
        
        // Toggle expanded state
        this.state.expanded[folderId] = !this.state.expanded[folderId];
        
        // Re-render the tree
        this.renderTree();
        
        e.stopPropagation();
      });
    });
    
    // File click events
    const files = this.treeContent.querySelectorAll('.file');
    files.forEach(file => {
      file.addEventListener('click', (e) => {
        // Remove selected class from all items
        this.treeContent.querySelectorAll('.selected').forEach(el => {
          el.classList.remove('selected');
        });
        
        // Add selected class to clicked item
        file.classList.add('selected');
        
        // Dispatch custom event
        const event = new CustomEvent('file-selected', {
          detail: {
            id: file.dataset.id,
            path: file.dataset.path
          }
        });
        this.container.dispatchEvent(event);
        
        e.stopPropagation();
      });
    });
  }
  
  findFolder(path) {
    // Split path into parts
    const parts = path.split('/');
    
    // Start at root
    let current = this.state.files;
    let parent = null;
    let index = -1;
    
    // Navigate to the correct folder
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      index = current.findIndex(item => item.name === part);
      
      if (index === -1) {
        return null; // Path not found
      }
      
      if (i === parts.length - 1) {
        return { parent: current, index }; // Found the folder
      }
      
      if (current[index].type !== 'folder') {
        return null; // Not a folder
      }
      
      parent = current;
      current = current[index].children || [];
    }
    
    return null;
  }
  
  addFile() {
    // Get selected folder or use root
    const selected = this.treeContent.querySelector('.folder.selected');
    let path = '';
    
    if (selected) {
      path = selected.dataset.path;
    }
    
    const filename = prompt('Enter file name:', 'new-file.txt');
    if (!filename) return;
    
    if (path) {
      // Add to specified folder
      const folder = this.findFolder(path);
      if (folder) {
        folder.parent[folder.index].children.push({
          name: filename,
          type: 'file'
        });
      }
    } else {
      // Add to root
      this.state.files.push({
        name: filename,
        type: 'file'
      });
    }
    
    this.renderTree();
  }
  
  addFolder() {
    // Get selected folder or use root
    const selected = this.treeContent.querySelector('.folder.selected');
    let path = '';
    
    if (selected) {
      path = selected.dataset.path;
    }
    
    const foldername = prompt('Enter folder name:', 'New Folder');
    if (!foldername) return;
    
    if (path) {
      // Add to specified folder
      const folder = this.findFolder(path);
      if (folder) {
        folder.parent[folder.index].children.push({
          name: foldername,
          type: 'folder',
          children: []
        });
      }
    } else {
      // Add to root
      this.state.files.push({
        name: foldername,
        type: 'folder',
        children: []
      });
    }
    
    this.renderTree();
  }
  
  render() {
    if (!this.treeContent) {
      this.init();
    } else {
      this.renderTree();
    }
  }
  
  onThemeChange() {
    // Update theme-specific styles if needed
  }
}

// Register the plugin
pluginRegistry.register(FileTreePlugin);
