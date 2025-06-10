# Markdown Editor Plugin

The Markdown Editor plugin provides a rich editing and preview experience for Markdown documents within the GridUI system.

## Features

- **Split View**: Dual-pane interface with editor and live preview
- **Syntax Highlighting**: Code coloring for easier editing
- **WYSIWYG Toolbar**: Common formatting options with single-click access
- **Auto-save**: Content is automatically saved as you type
- **Markdown Rendering**: Real-time conversion to formatted HTML
- **Image Support**: Display images referenced in Markdown

## Usage

1. Add the plugin to your grid layout
2. Use the left pane to edit Markdown text
3. See the rendered preview in the right pane
4. Use the toolbar for common formatting options
5. Click "Toggle View" to switch between edit/preview and full preview modes

## Technical Details

- Built on the GridPlugin base class
- Uses a third-party Markdown parser for rendering
- Automatically saves content to plugin state
- Can load Markdown files from the file system

## CSS Dependencies

- Includes its own styling for editor and preview
- Uses Material Icons for toolbar actions

## Events

- Responds to the `file-selected` event to open Markdown files
- Automatically updates preview as content changes
