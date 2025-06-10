/**
 * Image Sequence Player Plugin
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
      framerate: options.framerate || 24
    };
    
    this.playbackTimer = null;
    this.imageCache = new Map();
    this.elements = {};
  }
  
  init() {
    // Initial setup - will be called once
    this.render();
  }
  
  render() {
    // Create the UI structure
    this.container.innerHTML = `
      <div class="image-sequence-player">
        <div class="seq-sidebar">
          <div class="seq-header">
            <span>Sequences</span>
            <button class="add-seq-btn"><span class="material-icons">add</span></button>
          </div>
          <div class="seq-list"></div>
        </div>
        
        <div class="seq-content">
          <div class="seq-display">
            <img class="seq-image" src="" alt="Frame">
            <div class="empty-state">
              <span class="material-icons">movie</span>
              <p>No sequence loaded</p>
            </div>
          </div>
          
          <div class="seq-controls">
            <div class="timeline">
              <div class="timeline-track"></div>
              <div class="timeline-slider"></div>
            </div>
            
            <div class="controls-bar">
              <button class="play-btn"><span class="material-icons">play_arrow</span></button>
              <button class="prev-btn"><span class="material-icons">skip_previous</span></button>
              <button class="next-btn"><span class="material-icons">skip_next</span></button>
              <div class="framerate-control">
                <input type="number" class="fps-input" min="1" max="60" value="${this.state.framerate}">
                <span>FPS</span>
              </div>
              <span class="frame-counter">Frame: 0 / 0</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Cache DOM elements
    this.elements = {
      seqList: this.container.querySelector('.seq-list'),
      addSeqBtn: this.container.querySelector('.add-seq-btn'),
      seqImage: this.container.querySelector('.seq-image'),
      emptyState: this.container.querySelector('.empty-state'),
      playBtn: this.container.querySelector('.play-btn'),
      prevBtn: this.container.querySelector('.prev-btn'),
      nextBtn: this.container.querySelector('.next-btn'),
      fpsInput: this.container.querySelector('.fps-input'),
      frameCounter: this.container.querySelector('.frame-counter'),
      timelineTrack: this.container.querySelector('.timeline-track'),
      timelineSlider: this.container.querySelector('.timeline-slider')
    };
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Load sequences from state if available
    this.loadState();
  }
  
  setupEventHandlers() {
    // Playback controls
    this.elements.playBtn.addEventListener('click', () => this.togglePlayback());
    this.elements.prevBtn.addEventListener('click', () => this.previousFrame());
    this.elements.nextBtn.addEventListener('click', () => this.nextFrame());
    
    // Framerate control
    this.elements.fpsInput.addEventListener('change', () => {
      const framerate = parseInt(this.elements.fpsInput.value);
      if (!isNaN(framerate) && framerate > 0 && framerate <= 60) {
        this.state.framerate = framerate;
        if (this.state.playing) {
          this.stopPlayback();
          this.startPlayback();
        }
      } else {
        this.elements.fpsInput.value = this.state.framerate;
      }
    });
    
    // Timeline scrubbing
    this.elements.timelineTrack.addEventListener('click', (e) => {
      const rect = this.elements.timelineTrack.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      this.scrubToPercentage(percentage);
    });
    
    // Add sequence button
    this.elements.addSeqBtn.addEventListener('click', () => this.showAddSequenceDialog());
    
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
    
    // Handle sequence selection events from other plugins
    document.addEventListener('sequence-selected', (e) => {
      this.addSequenceFromFiletree(e.detail);
    });
  }
  
  loadState() {
    // Load sequences from state
    if (this.state.playlists && this.state.playlists.length > 0) {
      this.refreshSequenceList();
      this.selectPlaylist(this.state.currentPlaylist);
    } else {
      this.showEmptyState();
    }
  }
  
  refreshSequenceList() {
    // Clear existing items
    this.elements.seqList.innerHTML = '';
    
    // Add each playlist
    this.state.playlists.forEach((playlist, index) => {
      const item = document.createElement('div');
      item.className = 'seq-item';
      if (index === this.state.currentPlaylist) {
        item.classList.add('active');
      }
      item.dataset.index = index;
      item.innerHTML = `
        <span class="material-icons">movie</span>
        <span>${playlist.name}</span>
      `;
      item.addEventListener('click', () => this.selectPlaylist(index));
      this.elements.seqList.appendChild(item);
    });
  }
  
  showEmptyState() {
    this.elements.emptyState.style.display = 'flex';
    this.elements.seqImage.style.display = 'none';
  }
  
  hideEmptyState() {
    this.elements.emptyState.style.display = 'none';
    this.elements.seqImage.style.display = 'block';
  }
  
  showAddSequenceDialog() {
    // Create a simple dialog
    const dialog = document.createElement('div');
    dialog.className = 'seq-dialog';
    dialog.innerHTML = `
      <h2>Add Sequence</h2>
      <ul class="folder-list">
        <li data-folder="media/seq/sq001">sq001 (test sequence)</li>
        <li data-folder="media/seq/sq002">sq002 (horses sequence)</li>
      </ul>
      <button class="cancel-btn">Cancel</button>
    `;
    
    this.container.appendChild(dialog);
    
    // Handle dialog actions
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      this.container.removeChild(dialog);
    });
    
    dialog.querySelectorAll('.folder-list li').forEach(item => {
      item.addEventListener('click', () => {
        const folderPath = item.dataset.folder;
        const folderName = folderPath.split('/').pop();
        this.addSequence(folderName, folderPath);
        this.container.removeChild(dialog);
      });
    });
  }
  
  async addSequence(name, folderPath) {
    const images = await this.loadImageSequence(folderPath);
    
    const playlist = {
      name,
      folderPath,
      images,
      thumbnailIndex: 0
    };
    
    this.state.playlists.push(playlist);
    this.refreshSequenceList();
    this.selectPlaylist(this.state.playlists.length - 1);
  }
  
  addSequenceFromFiletree(sequenceData) {
    // Check if already exists
    const existingIndex = this.state.playlists.findIndex(playlist => 
      playlist.name === sequenceData.name && 
      playlist.folderPath === sequenceData.folderPath
    );
    
    if (existingIndex >= 0) {
      this.selectPlaylist(existingIndex);
      return;
    }
    
    // Add new playlist
    const playlist = {
      name: sequenceData.name,
      folderPath: sequenceData.folderPath,
      images: sequenceData.files,
      thumbnailIndex: 0
    };
    
    this.state.playlists.push(playlist);
    this.refreshSequenceList();
    this.selectPlaylist(this.state.playlists.length - 1);
  }
  
  async loadImageSequence(folderPath) {
    const images = [];
    
    if (folderPath === 'media/seq/sq001') {
      // Load test sequence
      for (let i = 1; i <= 167; i++) {
        images.push(`${folderPath}/test_${i.toString().padStart(4, '0')}.jpg`);
      }
    } else if (folderPath === 'media/seq/sq002') {
      // Load horses sequence
      for (let i = 1; i <= 28; i++) {
        images.push(`${folderPath}/horses_${i.toString().padStart(4, '0')}.jpg`);
      }
    }
    
    return images;
  }
  
  selectPlaylist(index) {
    if (index < 0 || index >= this.state.playlists.length) return;
    
    // Stop playback
    this.stopPlayback();
    
    // Update state
    this.state.currentPlaylist = index;
    this.state.currentFrame = 0;
    
    // Update UI
    this.elements.seqList.querySelectorAll('.seq-item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.index) === index);
    });
    
    this.loadFrame(0);
    this.preloadImages(0, 5);
    this.updateFrameCounter();
    this.updateTimelineSlider();
    this.hideEmptyState();
  }
  
  preloadImages(startIndex, count) {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist) return;
    
    const end = Math.min(startIndex + count, playlist.images.length);
    
    for (let i = startIndex; i < end; i++) {
      const imagePath = playlist.images[i];
      
      // Skip if already cached
      if (this.imageCache.has(imagePath)) continue;
      
      // Load and cache
      const img = new Image();
      img.src = imagePath;
      img.onload = () => this.imageCache.set(imagePath, img);
    }
  }
  
  loadFrame(frameIndex) {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) {
      this.showEmptyState();
      return;
    }
    
    // Ensure frame index is valid
    frameIndex = Math.max(0, Math.min(frameIndex, playlist.images.length - 1));
    this.state.currentFrame = frameIndex;
    
    const imagePath = playlist.images[frameIndex];
    this.elements.seqImage.src = imagePath;
    this.elements.seqImage.onerror = () => {
      console.error("Failed to load image:", imagePath);
      this.elements.seqImage.src = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23ddd" width="200" height="150"/><text fill="%23666" font-family="sans-serif" font-size="15" dy="10.5" font-weight="bold" x="100" y="75" text-anchor="middle">Image Load Error</text></svg>';
    };
    
    this.updateFrameCounter();
    this.updateTimelineSlider();
    
    // Cache the image if not already cached
    if (!this.imageCache.has(imagePath)) {
      const img = new Image();
      img.src = imagePath;
      this.imageCache.set(imagePath, img);
    }
  }
  
  togglePlayback() {
    if (this.state.playing) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }
  
  startPlayback() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    this.state.playing = true;
    this.elements.playBtn.innerHTML = '<span class="material-icons">pause</span>';
    
    const frameInterval = 1000 / this.state.framerate;
    this.playbackTimer = setInterval(() => {
      let nextFrame = this.state.currentFrame + 1;
      if (nextFrame >= playlist.images.length) nextFrame = 0;
      this.loadFrame(nextFrame);
    }, frameInterval);
  }
  
  stopPlayback() {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    
    this.state.playing = false;
    this.elements.playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
  }
  
  previousFrame() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    let prevFrame = this.state.currentFrame - 1;
    if (prevFrame < 0) prevFrame = playlist.images.length - 1;
    this.loadFrame(prevFrame);
  }
  
  nextFrame() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    let nextFrame = this.state.currentFrame + 1;
    if (nextFrame >= playlist.images.length) nextFrame = 0;
    this.loadFrame(nextFrame);
  }
  
  scrubToPercentage(percentage) {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    const frameIndex = Math.floor(percentage * (playlist.images.length - 1));
    this.loadFrame(frameIndex);
  }
  
  updateTimelineSlider() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) return;
    
    const percentage = this.state.currentFrame / (playlist.images.length - 1);
    this.elements.timelineSlider.style.left = `${percentage * 100}%`;
  }
  
  updateFrameCounter() {
    const playlist = this.state.playlists[this.state.currentPlaylist];
    if (!playlist || !playlist.images.length) {
      this.elements.frameCounter.textContent = 'Frame: 0 / 0';
      return;
    }
    
    const currentFrame = this.state.currentFrame + 1;
    const totalFrames = playlist.images.length;
    this.elements.frameCounter.textContent = `Frame: ${currentFrame} / ${totalFrames}`;
  }
  
  onResize() {
    // Handle resize events
    this.updateTimelineSlider();
  }
  
  destroy() {
    // Clean up resources
    this.stopPlayback();
    this.container.innerHTML = '';
  }
}

// Register the plugin with the registry
pluginRegistry.register(ImageSequencePlugin);
