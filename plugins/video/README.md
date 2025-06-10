# Video Player Plugin

The Video Player plugin provides a versatile interface for playing video content within the GridUI system.

## Features

- **Video Playback**: Play, pause, and control video content
- **Timeline Scrubbing**: Navigate through video using an interactive timeline
- **Volume Control**: Adjust audio levels with a volume slider
- **Playback Rate**: Change playback speed (0.5x to 2x)
- **Fullscreen Support**: Expand video to fill the entire view
- **Format Support**: Compatible with MP4, WebM, Ogg, and other HTML5 formats

## Usage

1. Add the plugin to your grid layout
2. Load a video by selecting a file from the file tree
3. Use the playback controls to manage video playback
4. Drag the timeline slider to navigate to specific points in the video

## Technical Details

- Built on the GridPlugin base class
- Uses the HTML5 Video API for playback
- Supports URL-based videos and local file access
- Handles various video formats supported by the browser

## CSS Dependencies

- Includes its own styling for player controls
- Uses Material Icons for control buttons

## Events

- Responds to the `file-selected` event to open video files
- Maintains playback state when resizing or moving the grid item
