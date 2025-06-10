# Save & Load Plugin

The Save & Load plugin provides functionality for persisting and retrieving grid layouts and plugin states within the GridUI system.

## Features

- **State Persistence**: Save grid layouts and plugin data
- **Local Storage**: Uses browser storage for offline functionality
- **Import/Export**: Save layouts as JSON files for sharing and backup
- **Layout Snapshots**: Create and switch between multiple saved layouts
- **Auto-save**: Optional automatic saving of changes

## Usage

1. Use auto-save functionality for automatic persistence
2. Click "Export" to save the current layout as a JSON file
3. Click "Import" to load a previously saved layout
4. Use "Reset" to clear the current layout

## Technical Details

- Built on the GridPlugin base class
- Serializes grid item positions, sizes, and plugin states
- Uses browser's localStorage API for persistence
- Maintains backward compatibility with layout format changes

## CSS Dependencies

- Uses minimal styling for interface elements
- Uses Material Icons for action buttons

## Integration Points

- Works with the Grid system's save and load methods
- Provides utility functions for other plugins to use for state management
- Collaborates with the context menu export/import functionality
