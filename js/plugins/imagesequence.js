/**
 * Image Sequence Player Plugin
 * Provides an image sequence player with scrubbing, annotations, and playlist features
 */
class ImageSequencePlugin extends GridPlugin {
  static get type() { return 'imagesequence'; }
  static get name() { return 'Image Sequence Player'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      playlists: [],
      currentPlaylist: 0,
      currentFrame: 0,
      playing: false,
      framerate: options.framerate || 24,
      annotations: {} // Format: { frameIndex: [annotations] }
    };
    
    this.playbackTimer = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.preloadedImages = [];
    this.imageCache = new Map();
  }
  
  init() {
    this.container.innerHTML = `
      <div class="image-sequence-player">
        <div class="sequence-main-container">
          <div class="sequence-playlist-sidebar">
            <div class="sequence-playlist-header">
              <span>Sequences</span>
              <button class="add-playlist-btn" title="Add Sequence">
                <span class="material-icons">add</span>
              </button>
            </div>
            <div class="sequence-playlist-list">
              <!-- Playlist items will be added here -->
            </div>
          </div>
          
          <div class="sequence-content">
            <div class="sequence-controls">
              <div class="sequence-buttons">
                <button class="play-pause-btn" title="Play/Pause">
                  <span class="material-icons">play_arrow</span>
                </button>
                <button class="prev-frame-btn" title="Previous Frame">
                  <span class="material-icons">skip_previous</span>
                </button>
                <button class="next-frame-btn" title="Next Frame">
                  <span class="material-icons">skip_next</span>
                </button>
                <div class="framerate-control">
                  <input type="number" class="framerate-input" min="1" max="60" value="${this.state.framerate}">
                  <span>FPS</span>
                </div>
              </div>
              <div class="annotation-tools">
                <button class="annotation-tool" data-tool="select" title="Select">
                  <span class="material-icons">pan_tool</span>
                </button>
                <button class="annotation-tool" data-tool="rectangle" title="Rectangle">
                  <span class="material-icons">crop_square</span>
                </button>
                <button class="annotation-tool" data-tool="text" title="Text">
                  <span class="material-icons">text_fields</span>
                </button>
                <button class="annotation-tool" data-tool="delete" title="Delete">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
            
            <div class="sequence-display-container">
              <div class="sequence-image-container">
                <img class="sequence-image" src="" alt="Image sequence frame">
                <canvas class="annotation-canvas"></canvas>
              </div>
            </div>
            
            <div class="sequence-timeline-container">
              <div class="sequence-timeline">
                <div class="timeline-track"></div>
                <div class="timeline-slider"></div>
                <div class="timeline-thumbnails"></div>
              </div>
              <div class="timeline-info">
                <span class="frame-counter">Frame: 0 / 0</span>
                <div class="annotation-counter">Annotations: 0</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="thumbnail-preview">
          <img class="thumbnail-image" src="" alt="Thumbnail preview">
        </div>

        <div class="context-menu">
          <ul>
            <li data-action="add-annotation">Add Annotation</li>
            <li data-action="add-playlist">Add Playlist</li>
            <li data-action="set-thumbnail">Set as Thumbnail</li>
            <li data-action="export-annotations">Export Annotations</li>
            <li data-action="delete-annotation">Delete Annotation</li>
          </ul>
        </div>
      </div>
    `;
    
    // Get DOM elements
    this.playlistList = this.container.querySelector('.sequence-playlist-list');
    this.addPlaylistBtn = this.container.querySelector('.add-playlist-btn');
    this.playPauseBtn = this.container.querySelector('.play-pause-btn');
    this.prevFrameBtn = this.container.querySelector('.prev-frame-btn');
    this.nextFrameBtn = this.container.querySelector('.next-frame-btn');
    this.framerateInput = this.container.querySelector('.framerate-input');
    this.sequenceImage = this.container.querySelector('.sequence-image');
    this.annotationCanvas = this.container.querySelector('.annotation-canvas');
    this.timelineTrack = this.container.querySelector('.timeline-track');
    this.timelineSlider = this.container.querySelector('.timeline-slider');
    this.thumbnailPreview = this.container.querySelector('.thumbnail-preview');
    this.thumbnailImage = this.container.querySelector('.thumbnail-image');
    this.frameCounter = this.container.querySelector('.frame-counter');
    this.annotationCounter = this.container.querySelector('.annotation-counter');
    this.annotationTools = this.container.querySelectorAll('.annotation-tool');
    this.contextMenu = this.container.querySelector('.context-menu');
    this.ctx = this.annotationCanvas.getContext('2d');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize from state if available
    this.loadPlaylistsFromState();
    
    // Adjust canvas size
    this.adjustCanvasSize();
    
    // Hide context menu initially
    this.contextMenu.style.display = 'none';
  }
  
  setupEventListeners() {
    // Add playlist button
    this.addPlaylistBtn.addEventListener('click', () => {
      this.showAddPlaylistDialog();
    });
    
    // Play/Pause button
    this.playPauseBtn.addEventListener('click', () => {
      this.togglePlayback();
    });
    
    // Previous frame button
    this.prevFrameBtn.addEventListener('click', () => {
      this.previousFrame();
    });
    
    // Next frame button
    this.nextFrameBtn.addEventListener('click', () => {
      this.nextFrame();
    });
    
    // Framerate input
    this.framerateInput.addEventListener('change', () => {
      const framerate = parseInt(this.framerateInput.value);
      if (!isNaN(framerate) && framerate > 0 && framerate <= 60) {
        this.state.framerate = framerate;
        
        // Update playback if currently playing
        if (this.state.playing) {
          this.stopPlayback();
          this.startPlayback();
        }
      } else {
        this.framerateInput.value = this.state.framerate;
      }
    });
    
    // Timeline interaction
    this.timelineTrack.addEventListener('mousedown', (e) => {
      const rect = this.timelineTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      this.scrubToPercentage(percentage);
    });
    
    // Timeline hover for thumbnail preview
    this.timelineTrack.addEventListener('mousemove', (e) => {
      const rect = this.timelineTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      
      this.showThumbnailAtPercentage(percentage, e.clientX, e.clientY);
    });
    
    this.timelineTrack.addEventListener('mouseenter', () => {
      this.thumbnailPreview.style.display = 'block';
    });
    
    this.timelineTrack.addEventListener('mouseleave', () => {
      this.thumbnailPreview.style.display = 'none';
    });
    
    // Annotation tools
    this.annotationTools.forEach(tool => {
      tool.addEventListener('click', () => {
        this.selectAnnotationTool(tool.dataset.tool);
      });
    });
    
    // Annotation canvas interactions
    this.annotationCanvas.addEventListener('mousedown', (e) => {
      this.handleCanvasMouseDown(e);
    });
    
    this.annotationCanvas.addEventListener('mousemove', (e) => {
      this.handleCanvasMouseMove(e);
    });
    
    this.annotationCanvas.addEventListener('mouseup', () => {
      this.handleCanvasMouseUp();
    });
    
    // Context menu
    this.container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });
    
    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.contextMenu.style.display = 'none';
      }
    });
    
    this.contextMenu.addEventListener('click', (e) => {
      const action = e.target.closest('li')?.dataset.action;
      if (action) {
        this.handleContextMenuAction(action);
        this.contextMenu.style.display = 'none';
      }
    });
    
    // Listen for resize events
    window.addEventListener('resize', () => {
      this.adjustCanvasSize();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.container.contains(document.activeElement)) return;
      
      switch (e.key) {
        case ' ': // Space
          this.togglePlayback();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          this.previousFrame();
          e.preventDefault();
          break;
        case 'ArrowRight':
          this.nextFrame();
          e.preventDefault();
          break;
      }
    });
    
    // Listen for sequence-selected events from the file tree
    document.addEventListener('sequence-selected', (e) => {
      const sequenceData = e.detail;
      this.addSequenceFromFiletree(sequenceData);
    });
  }
  
  addSequenceFromFiletree(sequenceData) {
    console.log("Adding sequence from filetree:", sequenceData);
    
    // Check if this sequence is already in the playlist
    const exists = this.state.playlists.some(playlist => 
      playlist.name === sequenceData.name && 
      playlist.folderPath === sequenceData.folderPath
    );
    
    if (exists) {
      // Find the index of the existing playlist and select it
      const index = this.state.playlists.findIndex(playlist => 
        playlist.name === sequenceData.name && 
        playlist.folderPath === sequenceData.folderPath
      );
      this.selectPlaylist(index);
      return;
    }
    
    // Create a new playlist from the sequence data
    const playlist = {
      name: sequenceData.name,
      folderPath: sequenceData.folderPath,
      images: sequenceData.files,
      thumbnailIndex: 0
    };
    
    // Add to state
    this.state.playlists.push(playlist);
    const playlistIndex = this.state.playlists.length - 1;
    
    // Add to playlist list
    const item = document.createElement('div');
    item.className = 'sequence-playlist-item';
    item.dataset.index = playlistIndex;
    item.innerHTML = `
      <span class="material-icons">movie</span>
      <span style="margin-left: 8px;">${sequenceData.name}</span>
    `;
    item.addEventListener('click', () => this.selectPlaylist(playlistIndex));
    this.playlistList.appendChild(item);
    
    // Select the new playlist
    this.selectPlaylist(playlistIndex);
  }
  
  // Playlist Management
  
  loadPlaylistsFromState() {
    if (this.state.playlists.length > 0) {
      // Clear existing playlist items
      this.playlistList.innerHTML = '';
      
      // Add playlists from state
      this.state.playlists.forEach((playlist, index) => {
        const item = document.createElement('div');
        item.className = 'sequence-playlist-item';
        if (index === this.state.currentPlaylist) {
          item.classList.add('active');
        }
        item.dataset.index = index;
        item.innerHTML = `
          <span class="material-icons">movie</span>
          <span style="margin-left: 8px;">${playlist.name}</span>
        `;
        item.addEventListener('click', () => this.selectPlaylist(index));
        this.playlistList.appendChild(item);
      });
      
      // Select current playlist
      this.selectPlaylist(this.state.currentPlaylist);
    }
  }
  
  showAddPlaylistDialog() {
    // Create a simple dialog to add a new playlist
    const dialog = document.createElement('div');
    dialog.className = 'add-playlist-dialog';
    dialog.innerHTML = `
      <h2>Add Sequence</h2>
      <div class="playlist-folders">
        <h3>Available Sequences:</h3>
        <ul class="folder-list">
          <li data-folder="media/seq/sq001">sq001 (test sequence)</li>
          <li data-folder="media/seq/sq002">sq002 (horses sequence)</li>
        </ul>
      </div>
      <div class="dialog-actions">
        <button class="cancel-btn">Cancel</button>
      </div>
    `;
    
    // Add dialog to container
    this.container.appendChild(dialog);
    
    // Set up event listeners
    const cancelBtn = dialog.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
      this.container.removeChild(dialog);
    });
    
    const folderItems = dialog.querySelectorAll('.folder-list li');
    folderItems.forEach(item => {
      item.addEventListener('click', () => {
        const folderPath = item.dataset.folder;
        const folderName = folderPath.split('/').pop();
        this.addPlaylist(folderName, folderPath);
        this.container.removeChild(dialog);
      });
    });
  }
  
  addPlaylist(name, folderPath) {
    // Load the image sequence
    this.loadImageSequence(folderPath).then(images => {
      // Create new playlist
      const playlist = {
        name,
        folderPath,
        images,
        thumbnailIndex: 0
      };
      
      // Add to state
      this.state.playlists.push(playlist);
      const playlistIndex = this.state.playlists.length - 1;
      
      // Add to playlist list
      const item = document.createElement('div');
      item.className = 'sequence-playlist-item';
      item.dataset.index = playlistIndex;
      item.innerHTML = `
        <span class="material-icons">movie</span>
        <span style="margin-left: 8px;">${name}</span>
      `;
      item.addEventListener('click', () => this.selectPlaylist(playlistIndex));
      this.playlistList.appendChild(item);
      
      // Select the new playlist
      this.selectPlaylist(playlistIndex);
    });
  }
  
  selectPlaylist(index) {
    if (index < 0 || index >= this.state.playlists.length) return;
    
    // Stop playback
    this.stopPlayback();
    
    // Update state
    this.state.currentPlaylist = index;
    this.state.currentFrame = 0;
    
    // Update playlist item selection in UI
    const playlistItems = this.playlistList.querySelectorAll('.sequence-playlist-item');
    playlistItems.forEach(item => {
      if (parseInt(item.dataset.index) === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update UI
    this.updateFrameDisplay();
    this.updateAnnotationCounter();
    this.updateTimelineSlider();
    
    // Load first frame
    this.loadFrame(0);
    
    // Preload first few frames
    this.preloadImages(0, 5);
  }
  
  // Image Loading
  
  async loadImageSequence(folderPath) {
    const images = [];
    
    if (folderPath === 'media/seq/sq001') {
      // Load test sequence
      for (let i = 1; i <= 167; i++) {
        const filename = `test_${i.toString().padStart(4, '0')}.jpg`;
        images.push(`${folderPath}/${filename}`);
      }
    } else if (folderPath === 'media/seq/sq002') {
      // Load horses sequence
      for (let i = 1; i <= 28; i++) {
        const filename = `horses_${i.toString().padStart(4, '0')}.jpg`;
        images.push(`${folderPath}/${filename}`);
      }
    }
    
    return images;
  }
  
  preloadImages(startIndex, count) {
    this.preloadedImages = [];
    
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist) return;
    
    const end = Math.min(startIndex + count, playlist.images.length);
    
    for (let i = startIndex; i < end; i++) {
      const imagePath = playlist.images[i];
      
      // Check cache first
      if (this.imageCache.has(imagePath)) {
        this.preloadedImages.push(this.imageCache.get(imagePath));
        continue;
      }
      
      // Load and cache image
      const img = new Image();
      img.src = imagePath;
      img.onload = () => {
        this.imageCache.set(imagePath, img);
      };
      this.preloadedImages.push(img);
    }
  }
  
  loadFrame(frameIndex) {
    console.log("Loading frame:", frameIndex);
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) {
      console.error("No playlist or empty images array");
      return;
    }
    
    // Ensure frame index is valid
    frameIndex = Math.max(0, Math.min(frameIndex, playlist.images.length - 1));
    
    // Update state
    this.state.currentFrame = frameIndex;
    
    const imagePath = playlist.images[frameIndex];
    console.log("Image path:", imagePath);
    
    // Create error handler for image loading
    const handleImageError = () => {
      console.error("Failed to load image:", imagePath);
      this.sequenceImage.src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23ddd" width="200" height="150"/><text fill="%23666" font-family="sans-serif" font-size="15" dy="10.5" font-weight="bold" x="100" y="75" text-anchor="middle">Image Load Error</text></svg>';
    };
    
    // Try from cache first
    if (this.imageCache.has(imagePath)) {
      this.sequenceImage.src = imagePath;
      this.sequenceImage.onerror = handleImageError;
      this.adjustCanvasSize();
      this.renderAnnotations();
      this.updateFrameDisplay();
      this.updateTimelineSlider();
      return;
    }
    
    // Load image
    this.sequenceImage.onerror = handleImageError;
    this.sequenceImage.src = imagePath;
    this.sequenceImage.onload = () => {
      console.log("Image loaded successfully:", imagePath);
      // Cache the image
      const img = new Image();
      img.src = imagePath;
      this.imageCache.set(imagePath, img);
      
      // Adjust canvas size to match image
      this.adjustCanvasSize();
      
      // Render annotations for this frame
      this.renderAnnotations();
      
      // Update frame display
      this.updateFrameDisplay();
      this.updateTimelineSlider();
    };
  }
  
  // Playback Control
  
  togglePlayback() {
    if (this.state.playing) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }
  
  startPlayback() {
    // Get current playlist
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    // Update UI
    this.state.playing = true;
    this.playPauseBtn.innerHTML = '<span class="material-icons">pause</span>';
    
    // Calculate frame interval based on framerate
    const frameInterval = 1000 / this.state.framerate;
    
    // Start playback timer
    this.playbackTimer = setInterval(() => {
      let nextFrame = this.state.currentFrame + 1;
      
      // Loop back to beginning if at end
      if (nextFrame >= playlist.images.length) {
        nextFrame = 0;
      }
      
      this.loadFrame(nextFrame);
    }, frameInterval);
  }
  
  stopPlayback() {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    
    this.state.playing = false;
    this.playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
  }
  
  previousFrame() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    let prevFrame = this.state.currentFrame - 1;
    if (prevFrame < 0) {
      prevFrame = playlist.images.length - 1;
    }
    
    this.loadFrame(prevFrame);
  }
  
  nextFrame() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    let nextFrame = this.state.currentFrame + 1;
    if (nextFrame >= playlist.images.length) {
      nextFrame = 0;
    }
    
    this.loadFrame(nextFrame);
  }
  
  // Timeline and Scrubbing
  
  scrubToPercentage(percentage) {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    // Calculate frame index from percentage
    const frameIndex = Math.floor(percentage * (playlist.images.length - 1));
    this.loadFrame(frameIndex);
  }
  
  updateTimelineSlider() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    // Calculate percentage of progress
    const percentage = this.state.currentFrame / (playlist.images.length - 1);
    this.timelineSlider.style.left = `${percentage * 100}%`;
  }
  
  showThumbnailAtPercentage(percentage, x, y) {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    // Calculate frame index from percentage
    const frameIndex = Math.floor(percentage * (playlist.images.length - 1));
    const imagePath = playlist.images[frameIndex];
    
    // Set thumbnail image
    this.thumbnailImage.src = imagePath;
    
    // Position thumbnail above cursor
    this.thumbnailPreview.style.left = `${x}px`;
    this.thumbnailPreview.style.top = `${y - 100}px`;
  }
  
  // Annotation Handling
  
  selectAnnotationTool(tool) {
    // Remove active class from all tools
    this.annotationTools.forEach(t => {
      t.classList.remove('active');
    });
    
    // Add active class to selected tool
    const selectedTool = Array.from(this.annotationTools).find(t => t.dataset.tool === tool);
    if (selectedTool) {
      selectedTool.classList.add('active');
    }
    
    // Store current tool
    this.currentTool = tool;
  }
  
  handleCanvasMouseDown(e) {
    if (!this.currentTool) return;
    
    // Get canvas coordinates
    const rect = this.annotationCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.isDragging = true;
    this.dragStart = { x, y };
    
    if (this.currentTool === 'text') {
      this.addTextAnnotation(x, y);
    }
  }
  
  handleCanvasMouseMove(e) {
    if (!this.isDragging) return;
    
    const rect = this.annotationCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.currentTool === 'rectangle') {
      // Preview rectangle
      this.ctx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
      this.renderAnnotations();
      
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        this.dragStart.x, 
        this.dragStart.y, 
        x - this.dragStart.x, 
        y - this.dragStart.y
      );
    }
  }
  
  handleCanvasMouseUp() {
    if (!this.isDragging) return;
    
    if (this.currentTool === 'rectangle') {
      const width = Math.abs(this.ctx.lastX - this.dragStart.x);
      const height = Math.abs(this.ctx.lastY - this.dragStart.y);
      
      // Only add if it has size
      if (width > 5 && height > 5) {
        this.addRectangleAnnotation(
          this.dragStart.x, 
          this.dragStart.y, 
          this.ctx.lastX - this.dragStart.x, 
          this.ctx.lastY - this.dragStart.y
        );
      }
    }
    
    this.isDragging = false;
  }
  
  addRectangleAnnotation(x, y, width, height) {
    const annotation = {
      type: 'rectangle',
      x, y, width, height,
      color: '#ff0000'
    };
    
    this.addAnnotation(annotation);
  }
  
  addTextAnnotation(x, y) {
    const text = prompt('Enter annotation text:');
    if (!text) return;
    
    const annotation = {
      type: 'text',
      x, y,
      text,
      color: '#00ff00',
      font: '16px Arial'
    };
    
    this.addAnnotation(annotation);
  }
  
  addAnnotation(annotation) {
    const frameKey = `frame_${this.state.currentFrame}`;
    
    // Initialize array if needed
    if (!this.state.annotations[frameKey]) {
      this.state.annotations[frameKey] = [];
    }
    
    // Add annotation
    this.state.annotations[frameKey].push(annotation);
    
    // Update UI
    this.renderAnnotations();
    this.updateAnnotationCounter();
  }
  
  renderAnnotations() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
    
    // Get annotations for current frame
    const frameKey = `frame_${this.state.currentFrame}`;
    const annotations = this.state.annotations[frameKey] || [];
    
    // Render each annotation
    annotations.forEach(annotation => {
      switch (annotation.type) {
        case 'rectangle':
          this.ctx.strokeStyle = annotation.color;
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          break;
          
        case 'text':
          this.ctx.fillStyle = annotation.color;
          this.ctx.font = annotation.font;
          this.ctx.fillText(annotation.text, annotation.x, annotation.y);
          break;
      }
    });
  }
  
  updateAnnotationCounter() {
    const frameKey = `frame_${this.state.currentFrame}`;
    const count = (this.state.annotations[frameKey] || []).length;
    this.annotationCounter.textContent = `Annotations: ${count}`;
  }
  
  // Context Menu
  
  showContextMenu(x, y) {
    // Position menu
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = 'block';
    
    // Determine which items to show
    const items = this.contextMenu.querySelectorAll('li');
    items.forEach(item => {
      const action = item.dataset.action;
      
      // Hide delete annotation if no annotation selected
      if (action === 'delete-annotation') {
        const frameKey = `frame_${this.state.currentFrame}`;
        const hasAnnotations = (this.state.annotations[frameKey] || []).length > 0;
        item.style.display = hasAnnotations ? 'block' : 'none';
      }
    });
  }
  
  handleContextMenuAction(action) {
    switch (action) {
      case 'add-annotation':
        this.selectAnnotationTool('rectangle');
        break;
        
      case 'add-playlist':
        this.showAddPlaylistDialog();
        break;
        
      case 'set-thumbnail':
        this.setPlaylistThumbnail();
        break;
        
      case 'export-annotations':
        this.exportAnnotations();
        break;
        
      case 'delete-annotation':
        this.deleteAllAnnotations();
        break;
    }
  }
  
  setPlaylistThumbnail() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist) return;
    
    playlist.thumbnailIndex = this.state.currentFrame;
  }
  
  exportAnnotations() {
    const data = JSON.stringify(this.state.annotations, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  deleteAllAnnotations() {
    const frameKey = `frame_${this.state.currentFrame}`;
    this.state.annotations[frameKey] = [];
    
    this.renderAnnotations();
    this.updateAnnotationCounter();
  }
  
  // UI Updates
  
  updateFrameDisplay() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist) {
      this.frameCounter.textContent = 'Frame: 0 / 0';
      return;
    }
    
    this.frameCounter.textContent = `Frame: ${this.state.currentFrame + 1} / ${playlist.images.length}`;
  }
  
  adjustCanvasSize() {
    if (!this.sequenceImage || !this.annotationCanvas) return;
    
    // Get image size
    const width = this.sequenceImage.naturalWidth || this.sequenceImage.width;
    const height = this.sequenceImage.naturalHeight || this.sequenceImage.height;
    
    if (!width || !height) return;
    
    // Get container size
    const container = this.container.querySelector('.sequence-image-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate aspect ratio
    const imageRatio = width / height;
    const containerRatio = containerWidth / containerHeight;
    
    let newWidth, newHeight;
    
    if (imageRatio > containerRatio) {
      // Image is wider than container
      newWidth = containerWidth;
      newHeight = containerWidth / imageRatio;
    } else {
      // Image is taller than container
      newHeight = containerHeight;
      newWidth = containerHeight * imageRatio;
    }
    
    // Set image size
    this.sequenceImage.style.width = `${newWidth}px`;
    this.sequenceImage.style.height = `${newHeight}px`;
    
    // Set canvas size to match
    this.annotationCanvas.width = newWidth;
    this.annotationCanvas.height = newHeight;
    
    // Re-render annotations
    this.renderAnnotations();
  }
  
  // Plugin methods
  
  render() {
    if (!this.sequenceImage) {
      this.init();
    } else {
      // Refresh display if needed
      this.loadPlaylistsFromState();
      this.loadFrame(this.state.currentFrame);
    }
  }
  
  onResize() {
    this.adjustCanvasSize();
  }
  
  onThemeChange(theme) {
    // Update theme-specific styling if needed
  }
  
  destroy() {
    // Stop playback
    this.stopPlayback();
    
    // Remove event listeners
    window.removeEventListener('resize', this.adjustCanvasSize);
    
    // Clear container
    this.container.innerHTML = '';
  }
  
  /**
   * Update plugin state
   * @param {Object} newState - New state object
   */
  setState(newState) {
    if (newState.playlists !== undefined) {
      this.state.playlists = newState.playlists;
    }
    if (newState.currentPlaylist !== undefined) {
      this.state.currentPlaylist = newState.currentPlaylist;
    }
    if (newState.currentFrame !== undefined) {
      this.state.currentFrame = newState.currentFrame;
    }
    if (newState.playing !== undefined) {
      this.state.playing = newState.playing;
    }
    if (newState.framerate !== undefined) {
      this.state.framerate = newState.framerate;
    }
    if (newState.annotations !== undefined) {
      this.state.annotations = newState.annotations;
    }
  }
}

// Register the plugin
pluginRegistry.register(ImageSequencePlugin);
