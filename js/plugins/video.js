/**
 * Video Player Plugin
 * Provides a video player with basic controls
 */
class VideoPlugin extends GridPlugin {
  static get type() { return 'video'; }
  static get name() { return 'Video Player'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      src: options.src || '',
      currentTime: 0,
      volume: 1,
      playing: false
    };
  }
  
  init() {
    this.container.innerHTML = `
      <div class="video-player">
        <video src="${this.state.src || ''}" ${this.options.controls ? 'controls' : ''}>
          Your browser doesn't support HTML5 video.
        </video>
        <div class="video-controls">
          <button class="play-pause"><span class="material-icons">play_arrow</span></button>
          <input type="range" class="timeline" min="0" max="100" value="0">
          <div class="volume-control">
            <button class="volume-button"><span class="material-icons">volume_up</span></button>
            <input type="range" class="volume" min="0" max="1" step="0.1" value="1">
          </div>
          <div class="time-display">0:00 / 0:00</div>
        </div>
      </div>
    `;
    
    this.video = this.container.querySelector('video');
    this.playPauseBtn = this.container.querySelector('.play-pause');
    this.timeline = this.container.querySelector('.timeline');
    this.volumeBtn = this.container.querySelector('.volume-button');
    this.volumeSlider = this.container.querySelector('.volume');
    this.timeDisplay = this.container.querySelector('.time-display');
    
    // Video events
    this.video.addEventListener('loadedmetadata', () => {
      this.timeline.max = this.video.duration;
      this.updateTimeDisplay();
    });
    
    this.video.addEventListener('timeupdate', () => {
      this.state.currentTime = this.video.currentTime;
      this.timeline.value = this.video.currentTime;
      this.updateTimeDisplay();
    });
    
    this.video.addEventListener('ended', () => {
      this.playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
      this.state.playing = false;
    });
    
    // Control events
    this.playPauseBtn.addEventListener('click', () => {
      if (this.video.paused) {
        this.video.play().then(() => {
          this.playPauseBtn.innerHTML = '<span class="material-icons">pause</span>';
          this.state.playing = true;
        }).catch(err => {
          console.error('Error playing video:', err);
        });
      } else {
        this.video.pause();
        this.playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        this.state.playing = false;
      }
    });
    
    this.timeline.addEventListener('input', () => {
      this.video.currentTime = this.timeline.value;
      this.state.currentTime = this.video.currentTime;
    });
    
    this.volumeSlider.addEventListener('input', () => {
      this.video.volume = this.volumeSlider.value;
      this.state.volume = this.video.volume;
      this.updateVolumeIcon();
    });
    
    this.volumeBtn.addEventListener('click', () => {
      if (this.video.muted) {
        this.video.muted = false;
        this.volumeSlider.value = this.state.volume;
      } else {
        this.video.muted = true;
        this.volumeSlider.value = 0;
      }
      this.updateVolumeIcon();
    });
    
    // Set initial state
    if (this.state.src) {
      this.video.src = this.state.src;
      if (this.state.currentTime > 0) {
        this.video.currentTime = this.state.currentTime;
      }
    }
    
    this.volumeSlider.value = this.state.volume;
    this.updateVolumeIcon();
  }
  
  updateTimeDisplay() {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    const current = formatTime(this.video.currentTime);
    const duration = formatTime(this.video.duration || 0);
    this.timeDisplay.textContent = `${current} / ${duration}`;
  }
  
  updateVolumeIcon() {
    if (this.video.muted || this.video.volume === 0) {
      this.volumeBtn.innerHTML = '<span class="material-icons">volume_off</span>';
    } else if (this.video.volume < 0.5) {
      this.volumeBtn.innerHTML = '<span class="material-icons">volume_down</span>';
    } else {
      this.volumeBtn.innerHTML = '<span class="material-icons">volume_up</span>';
    }
  }
  
  render() {
    if (!this.video) {
      this.init();
    } else {
      if (this.state.src !== this.video.src) {
        this.video.src = this.state.src;
      }
      
      // Only set currentTime if it's a valid number
      if (!isNaN(this.state.currentTime) && isFinite(this.state.currentTime)) {
        this.video.currentTime = this.state.currentTime;
      }
      
      // Only set volume if it's a valid number
      if (!isNaN(this.state.volume) && isFinite(this.state.volume)) {
        this.video.volume = this.state.volume;
      }
      
      if (this.state.playing && this.video.paused) {
        this.video.play().catch((err) => {
          console.error('Error playing video:', err);
          this.state.playing = false;
          this.playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        });
      }
    }
  }
  
  /**
   * Update plugin state
   * @param {Object} newState - New state object
   */
  setState(newState) {
    if (newState.src !== undefined) {
      this.state.src = newState.src;
    }
    if (newState.currentTime !== undefined) {
      this.state.currentTime = newState.currentTime;
    }
    if (newState.volume !== undefined) {
      this.state.volume = newState.volume;
    }
    if (newState.playing !== undefined) {
      this.state.playing = newState.playing;
    }
  }
  
  destroy() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
    this.container.innerHTML = '';
  }
}

// Register the plugin
pluginRegistry.register(VideoPlugin);
