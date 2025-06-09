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
          <button class="play-pause">▶</button>
          <input type="range" class="timeline" min="0" max="100" value="0">
          <div class="volume-control">
            <button class="volume-button">🔊</button>
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
      this.playPauseBtn.textContent = '▶';
      this.state.playing = false;
    });
    
    // Control events
    this.playPauseBtn.addEventListener('click', () => {
      if (this.video.paused) {
        this.video.play().then(() => {
          this.playPauseBtn.textContent = '❚❚';
          this.state.playing = true;
        }).catch(err => {
          console.error('Error playing video:', err);
        });
      } else {
        this.video.pause();
        this.playPauseBtn.textContent = '▶';
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
      this.volumeBtn.textContent = '🔇';
    } else if (this.video.volume < 0.5) {
      this.volumeBtn.textContent = '🔉';
    } else {
      this.volumeBtn.textContent = '🔊';
    }
  }
  
  render() {
    if (!this.video) {
      this.init();
    } else {
      if (this.state.src !== this.video.src) {
        this.video.src = this.state.src;
      }
      
      this.video.currentTime = this.state.currentTime;
      this.video.volume = this.state.volume;
      
      if (this.state.playing && this.video.paused) {
        this.video.play().catch(() => {
          this.state.playing = false;
          this.playPauseBtn.textContent = '▶';
        });
      }
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
