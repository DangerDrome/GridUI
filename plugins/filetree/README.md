# File Tree Plugin

The File Tree plugin provides a hierarchical file and directory browser for accessing and managing content within the GridUI system.

## Features

- **Directory Navigation**: Browse through folder structures
- **File Selection**: Open files in appropriate plugins
- **Context Menu**: Right-click options for file operations
- **File Icons**: Visual indicators of file types
- **File Filtering**: Optional filtering by file extension
- **Workspace Support**: Focus on specific workspace folders

## Usage

1. Add the plugin to your grid layout
2. Navigate through directories by clicking on folders
3. Select files to open them in the appropriate plugin
4. Use right-click context menu for additional operations
5. Drag and drop files to reorganize (where supported)

## Technical Details

- Built on the GridPlugin base class
- Uses a recursive rendering approach for directory structures
- Dispatches custom events when files are selected
- Can work with both local file system and virtual file systems

## CSS Dependencies

- Includes its own styling for tree structure
- Uses Material Icons for folder and file icons

## Events

- Dispatches `file-selected` events when a file is clicked
- Integrates with other plugins like Markdown Editor and Video Player
- Can send `sequence-selected` events for image sequences
