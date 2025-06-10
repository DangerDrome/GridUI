# Image Sequence Player Plugin

The Image Sequence Player plugin provides a powerful interface for viewing and controlling sequences of images (frame sequences). It's particularly useful for animations, video previews, and reviewing image sequences.

## Features

- **Sequence Organization**: Manage multiple image sequences in a sidebar panel
- **Playback Controls**: Play, pause, step forward/backward through frames
- **Timeline Scrubbing**: Visually navigate through frames using a timeline slider
- **Framerate Control**: Adjust playback speed on the fly
- **Frame Counter**: Track current position in the sequence
- **Image Preloading**: Smooth playback through background loading

## Usage

1. Add the plugin to your grid layout
2. Click the "Add" button in the Sequences panel to load a sequence
3. Select a sequence from the list to view and control it
4. Use the playback controls to navigate through frames

## Technical Details

- Built on the GridPlugin base class
- Uses a caching mechanism for improved performance
- Automatically handles sequence organization
- Responsive design adapts to different grid item sizes

## CSS Dependencies

- Requires `imagesequence.css` for styling
- Uses Material Icons for UI elements

## Events

- Listens for `sequence-selected` events from other plugins
- Supports keyboard shortcuts for playback (Space, Arrow keys)
