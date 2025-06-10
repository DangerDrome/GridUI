/**
 * File Tree Plugin
 * Provides a file explorer interface that accesses the file system directly
 */
class FileTreePlugin extends GridPlugin {
  static get type() { return 'filetree'; }
  static get name() { return 'File Explorer'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      rootHandle: options.rootHandle || null,
      files: options.files || [],
      expanded: options.expanded || {},
      currentPath: '',
      sequences: {} // Store detected image sequences
    };
    
    // Store file handles for reuse
    this.fileHandles = new Map();
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
          <h3><span class="material-icons">folder</span> File Explorer</h3>
          <button class="open-directory"><span class="material-icons">folder_open</span> Open Directory</button>
          <button class="add-file"><span class="material-icons">note_add</span> New File</button>
          <button class="add-folder"><span class="material-icons">create_new_folder</span> New Folder</button>
        </div>
        <div class="file-tree-content">
          <div class="file-tree-placeholder">
            Loading GridUI directory...
          </div>
        </div>
      </div>
    `;
    
    this.treeContent = this.container.querySelector('.file-tree-content');
    
    // Add event listeners for buttons
    const openDirectoryBtn = this.container.querySelector('.open-directory');
    openDirectoryBtn.addEventListener('click', () => this.openDirectory());
    
    const addFileBtn = this.container.querySelector('.add-file');
    addFileBtn.addEventListener('click', () => this.addFile());
    addFileBtn.disabled = !this.state.rootHandle;
    
    const addFolderBtn = this.container.querySelector('.add-folder');
    addFolderBtn.addEventListener('click', () => this.addFolder());
    addFolderBtn.disabled = !this.state.rootHandle;
    
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      this.treeContent.innerHTML = `
        <div class="file-tree-error">
          Your browser does not support the File System Access API.<br>
          Please use a modern browser like Chrome or Edge.
        </div>
      `;
      openDirectoryBtn.disabled = true;
      addFileBtn.disabled = true;
      addFolderBtn.disabled = true;
    } else {
      // Display a message suggesting the user to open the GridUI directory
      this.treeContent.innerHTML = `
        <div class="file-tree-message">
          <p>Click "Open Directory" to select the GridUI root directory.</p>
        </div>
      `;
    }
    
    // If we have a stored root handle, try to restore it
    if (this.state.rootHandle) {
      this.loadFromHandle(this.state.rootHandle).then(() => {
        this.renderTree();
      }).catch(err => {
        console.error('Failed to restore file handle:', err);
        this.state.rootHandle = null;
        this.state.files = [];
        this.renderTree();
      });
    } else {
      this.renderTree();
    }
  }
  
  async openDirectory(defaultPath = null) {
    try {
      let directoryHandle;
      let options = { mode: 'readwrite' };
      
      // If a default path is provided, try to use it
      if (defaultPath) {
        console.log(`Attempting to open default directory: ${defaultPath}`);
        
        try {
          // Try to open the default directory
          options.startIn = 'desktop'; // Start in a common location
          options.id = 'GridUI-root'; // Use a consistent ID for the directory
          directoryHandle = await window.showDirectoryPicker(options);
        } catch (defaultErr) {
          console.log(`Couldn't automatically open ${defaultPath}: ${defaultErr.message}`);
          console.log("Showing directory picker without defaults...");
          
          // Show directory picker without specifying a default
          directoryHandle = await window.showDirectoryPicker(options);
        }
      } else {
        // No default path, just show the picker
        directoryHandle = await window.showDirectoryPicker(options);
      }
      
      // Store the root handle
      this.state.rootHandle = directoryHandle;
      
      // Clear existing file handles
      this.fileHandles.clear();
      
      // Reset files array
      this.state.files = [];
      
      // Add root directory
      this.state.files.push({
        name: directoryHandle.name,
        type: 'folder',
        children: []
      });
      
      // Store the handle
      this.fileHandles.set(directoryHandle.name, directoryHandle);
      
      // Expand root directory
      const rootId = btoa(directoryHandle.name).replace(/=/g, '');
      this.state.expanded[rootId] = true;
      
      // Load directory contents
      await this.loadDirectoryContents(directoryHandle, directoryHandle.name);
      
      // Enable add buttons
      const addFileBtn = this.container.querySelector('.add-file');
      addFileBtn.disabled = false;
      
      const addFolderBtn = this.container.querySelector('.add-folder');
      addFolderBtn.disabled = false;
      
      // Render the tree
      this.renderTree();
      
      // Dispatch event
      const event = new CustomEvent('directory-opened', {
        detail: {
          path: directoryHandle.name
        }
      });
      this.container.dispatchEvent(event);
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error opening directory:', err);
        this.treeContent.innerHTML = `
          <div class="file-tree-error">
            Error opening directory: ${err.message}
          </div>
        `;
      }
    }
  }
  
  async loadDirectoryContents(directoryHandle, path) {
    try {
      // Get the folder object
      const folderParts = path.split('/');
      let current = this.state.files;
      
      // Navigate to the correct folder
      for (let i = 0; i < folderParts.length; i++) {
        const part = folderParts[i];
        const index = current.findIndex(item => item.name === part);
        
        if (index === -1) {
          console.error('Folder not found:', part);
          return;
        }
        
        if (i === folderParts.length - 1) {
          // Clear children
          current[index].children = [];
          current = current[index].children;
        } else {
          current = current[index].children;
        }
      }
      
      // Check for image sequences in this directory
      const sequences = await this.detectImageSequence(directoryHandle);
      if (sequences) {
        // Store detected sequences
        this.state.sequences[path] = sequences;
      }
      
      // Read all entries
      for await (const entry of directoryHandle.values()) {
        // Store the handle
        const entryPath = path + '/' + entry.name;
        this.fileHandles.set(entryPath, entry);
        
        if (entry.kind === 'directory') {
          // Add directory entry
          current.push({
            name: entry.name,
            type: 'folder',
            children: []
          });
          
          // If directory is expanded, load its contents
          const dirId = btoa(entryPath).replace(/=/g, '');
          if (this.state.expanded[dirId]) {
            await this.loadDirectoryContents(entry, entryPath);
          }
        } else {
          // Add file entry
          // Check if this file is part of a sequence
          let isPartOfSequence = false;
          
          if (this.state.sequences[path]) {
            // Check each sequence in this directory
            for (const seq of this.state.sequences[path]) {
              if (seq.files.includes(entry.name)) {
                isPartOfSequence = true;
                break;
              }
            }
          }
          
          // Only add if not part of a sequence (we'll add sequences separately)
          if (!isPartOfSequence) {
            current.push({
              name: entry.name,
              type: 'file'
            });
          }
        }
      }
      
      // Add image sequences as special entries
      if (this.state.sequences[path]) {
        for (const sequence of this.state.sequences[path]) {
          current.push({
            name: sequence.name,
            type: 'sequence',
            folderPath: path,
            files: sequence.files,
            count: sequence.files.length
          });
        }
      }
      
      // Sort entries: folders first, then sequences, then files, all alphabetically
      current.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        if (a.type === 'folder') return -1;
        if (b.type === 'folder') return 1;
        if (a.type === 'sequence') return -1;
        if (b.type === 'sequence') return 1;
        return 0;
      });
      
    } catch (err) {
      console.error('Error loading directory contents:', err);
    }
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
              <span class="folder-icon"><span class="material-icons">${isExpanded ? 'folder_open' : 'folder'}</span></span>
              <span class="folder-name">${item.name}</span>
            </div>
            ${item.children && isExpanded ? this.buildTreeHTML(item.children, itemPath) : ''}
          </li>
        `;
      } else if (item.type === 'sequence') {
        html += `
          <li class="sequence" data-id="${itemId}" data-path="${item.folderPath}" data-name="${item.name}">
            <span class="file-icon"><span class="material-icons">movie</span></span>
            <span class="file-name">${item.name} (${item.count} frames)</span>
          </li>
        `;
      } else {
        html += `
          <li class="file" data-id="${itemId}" data-path="${itemPath}">
            <span class="file-icon"><span class="material-icons">insert_drive_file</span></span>
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
      folder.addEventListener('click', async (e) => {
        const li = folder.closest('li');
        const folderId = li.dataset.id;
        const folderPath = li.dataset.path;
        
        // Toggle expanded state
        this.state.expanded[folderId] = !this.state.expanded[folderId];
        
        // If expanding and we have a real folder handle, load its contents
        if (this.state.expanded[folderId] && this.fileHandles.has(folderPath)) {
          const folderHandle = this.fileHandles.get(folderPath);
          await this.loadDirectoryContents(folderHandle, folderPath);
        }
        
        // Re-render the tree
        this.renderTree();
        
        e.stopPropagation();
      });
    });
    
    // Sequence click events
    const sequences = this.treeContent.querySelectorAll('.sequence');
    sequences.forEach(sequence => {
      sequence.addEventListener('dblclick', (e) => {
        // Remove selected class from all items
        this.treeContent.querySelectorAll('.selected').forEach(el => {
          el.classList.remove('selected');
        });
        
        // Add selected class to clicked item
        sequence.classList.add('selected');
        
        const folderPath = sequence.dataset.path;
        const sequenceName = sequence.dataset.name;
        
        // Find the sequence details
        const sequenceData = this.state.sequences[folderPath]?.find(seq => seq.name === sequenceName);
        
        if (sequenceData) {
          // Create path for image sequence plugin
          const fullPath = `${folderPath}/${sequenceName}`;
          
          // Dispatch custom event for image sequence
          const event = new CustomEvent('sequence-selected', {
            detail: {
              name: sequenceName,
              folderPath: folderPath,
              files: sequenceData.files.map(file => `${folderPath}/${file}`),
              path: fullPath
            }
          });
          this.container.dispatchEvent(event);
          
          // Also dispatch a global event for other components to listen to
          document.dispatchEvent(new CustomEvent('sequence-selected', {
            detail: {
              name: sequenceName,
              folderPath: folderPath,
              files: sequenceData.files.map(file => `${folderPath}/${file}`),
              path: fullPath
            }
          }));
        }
        
        e.stopPropagation();
      });
    });
    
    // File double-click events
    const files = this.treeContent.querySelectorAll('.file');
    files.forEach(file => {
      file.addEventListener('dblclick', async (e) => {
        // Remove selected class from all items
        this.treeContent.querySelectorAll('.selected').forEach(el => {
          el.classList.remove('selected');
        });
        
        // Add selected class to clicked item
        file.classList.add('selected');
        
        const filePath = file.dataset.path;
        const fileId = file.dataset.id;
        
        // Get file handle if available
        let fileContents = null;
        if (this.fileHandles.has(filePath)) {
          try {
            const fileHandle = this.fileHandles.get(filePath);
            // Get file object
            const fileObj = await fileHandle.getFile();
            // Get file contents (for text files)
            fileContents = await this.getFileContents(fileObj);
          } catch (err) {
            console.error('Error reading file:', err);
          }
        }
        
        // Dispatch custom event
        const event = new CustomEvent('file-selected', {
          detail: {
            id: fileId,
            path: filePath,
            handle: this.fileHandles.get(filePath) || null,
            contents: fileContents,
            blobUrl: file.blobUrl // Include blob URL if it exists
          }
        });
        this.container.dispatchEvent(event);
        
        e.stopPropagation();
      });
    });
  }
  
  async getFileContents(file) {
    // Check if this is a video file
    const videoTypes = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const isVideo = videoTypes.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (isVideo) {
      try {
        // For video files, create an object URL
        const blobUrl = URL.createObjectURL(file);
        console.log('Created blob URL for video:', blobUrl);
        // Store the blob URL to include it in the file-selected event
        file.blobUrl = blobUrl;
        return null; // Don't return text content for video files
      } catch (err) {
        console.error('Error creating object URL for video:', err);
        return null;
      }
    } else {
      // For text files, read as text
      try {
        return await file.text();
      } catch (err) {
        console.error('Error reading file as text:', err);
        return null;
      }
    }
  }
  
  // Detects if a folder contains an image sequence
  async detectImageSequence(folderHandle) {
    try {
      const imageFiles = [];
      const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
      const sequenceRegex = /(.+?)_(\d+)\.(jpg|jpeg|png|gif|webp)$/i;
      
      // Scan for image files in the folder
      for await (const entry of folderHandle.values()) {
        if (entry.kind === 'file' && imageRegex.test(entry.name)) {
          imageFiles.push(entry.name);
        }
      }
      
      // Check if we have enough images to be a sequence (at least 3)
      if (imageFiles.length < 3) {
        return null;
      }
      
      // Group image files by sequence name
      const sequences = {};
      
      imageFiles.forEach(filename => {
        const match = filename.match(sequenceRegex);
        if (match) {
          const [, baseName, number, ext] = match;
          const sequenceName = `${baseName}`;
          
          if (!sequences[sequenceName]) {
            sequences[sequenceName] = [];
          }
          
          sequences[sequenceName].push({
            filename,
            number: parseInt(number),
            ext
          });
        }
      });
      
      // Check if we have any valid sequences
      const validSequences = [];
      
      for (const [name, files] of Object.entries(sequences)) {
        if (files.length >= 3) {
          // Sort by frame number
          files.sort((a, b) => a.number - b.number);
          
          validSequences.push({
            name,
            files: files.map(f => f.filename),
            folderName: folderHandle.name,
            folderPath: folderHandle.name
          });
        }
      }
      
      return validSequences.length ? validSequences : null;
      
    } catch (err) {
      console.error('Error detecting image sequence:', err);
      return null;
    }
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
  
  async addFile() {
    if (!this.state.rootHandle) {
      alert('Please open a directory first');
      return;
    }
    
    // Get selected folder or use root
    const selected = this.treeContent.querySelector('.folder.selected');
    let parentPath = '';
    let parentHandle = null;
    
    if (selected) {
      parentPath = selected.dataset.path;
      if (this.fileHandles.has(parentPath)) {
        parentHandle = this.fileHandles.get(parentPath);
      } else {
        alert('Cannot find selected folder');
        return;
      }
    } else {
      // Use root directory
      parentPath = this.state.rootHandle.name;
      parentHandle = this.state.rootHandle;
    }
    
    const filename = prompt('Enter file name:', 'new-file.txt');
    if (!filename) return;
    
    try {
      // Create new file in the file system
      const newFileHandle = await parentHandle.getFileHandle(filename, { create: true });
      
      // Create a writable to write empty content
      const writable = await newFileHandle.createWritable();
      await writable.write('');
      await writable.close();
      
      // Store the new file handle
      const newFilePath = parentPath + '/' + filename;
      this.fileHandles.set(newFilePath, newFileHandle);
      
      // Update the UI representation
      if (parentPath === this.state.rootHandle.name) {
        // Add to root
        this.state.files.push({
          name: filename,
          type: 'file'
        });
      } else {
        // Add to specified folder
        const folder = this.findFolder(parentPath);
        if (folder) {
          folder.parent[folder.index].children.push({
            name: filename,
            type: 'file'
          });
        }
      }
      
      // Re-render the tree
      this.renderTree();
      
    } catch (err) {
      console.error('Error creating file:', err);
      alert(`Error creating file: ${err.message}`);
    }
  }
  
  async addFolder() {
    if (!this.state.rootHandle) {
      alert('Please open a directory first');
      return;
    }
    
    // Get selected folder or use root
    const selected = this.treeContent.querySelector('.folder.selected');
    let parentPath = '';
    let parentHandle = null;
    
    if (selected) {
      parentPath = selected.dataset.path;
      if (this.fileHandles.has(parentPath)) {
        parentHandle = this.fileHandles.get(parentPath);
      } else {
        alert('Cannot find selected folder');
        return;
      }
    } else {
      // Use root directory
      parentPath = this.state.rootHandle.name;
      parentHandle = this.state.rootHandle;
    }
    
    const foldername = prompt('Enter folder name:', 'New Folder');
    if (!foldername) return;
    
    try {
      // Create new directory in the file system
      const newDirHandle = await parentHandle.getDirectoryHandle(foldername, { create: true });
      
      // Store the new directory handle
      const newDirPath = parentPath + '/' + foldername;
      this.fileHandles.set(newDirPath, newDirHandle);
      
      // Update the UI representation
      if (parentPath === this.state.rootHandle.name) {
        // Add to root
        this.state.files.push({
          name: foldername,
          type: 'folder',
          children: []
        });
      } else {
        // Add to specified folder
        const folder = this.findFolder(parentPath);
        if (folder) {
          folder.parent[folder.index].children.push({
            name: foldername,
            type: 'folder',
            children: []
          });
        }
      }
      
      // Re-render the tree
      this.renderTree();
      
    } catch (err) {
      console.error('Error creating directory:', err);
      alert(`Error creating directory: ${err.message}`);
    }
  }
  
  async loadFromHandle(rootHandle) {
    if (!rootHandle) return;
    
    // Store the root handle
    this.state.rootHandle = rootHandle;
    
    // Clear existing file handles
    this.fileHandles.clear();
    
    // Reset files array
    this.state.files = [];
    
    // Add root directory
    this.state.files.push({
      name: rootHandle.name,
      type: 'folder',
      children: []
    });
    
    // Store the handle
    this.fileHandles.set(rootHandle.name, rootHandle);
    
    // Expand root directory by default
    const rootId = btoa(rootHandle.name).replace(/=/g, '');
    this.state.expanded[rootId] = true;
    
    // Load directory contents
    await this.loadDirectoryContents(rootHandle, rootHandle.name);
  }
  
  async saveFile(path, content) {
    if (!this.fileHandles.has(path)) {
      console.error('File handle not found:', path);
      return false;
    }
    
    try {
      const fileHandle = this.fileHandles.get(path);
      
      // Create a writable stream
      const writable = await fileHandle.createWritable();
      
      // Write the content
      await writable.write(content);
      
      // Close the stream
      await writable.close();
      
      return true;
    } catch (err) {
      console.error('Error saving file:', err);
      return false;
    }
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
