# Context Menu Export/Import Plugin

The Context Menu Export/Import plugin extends the GridUI system with right-click functionality for saving and loading layouts and individual grid items.

## Features

- **Context-sensitive Menu**: Right-click menu with relevant options
- **Layout Export**: Save the entire grid layout as a JSON file
- **Layout Import**: Load a previously saved grid layout
- **Item Export**: Export individual grid items with their configuration
- **Item Import**: Import previously exported grid items
- **Copy/Paste Support**: Copy grid items and paste them elsewhere

## Usage

1. Right-click on the grid background for layout operations
2. Right-click on a grid item for item-specific operations
3. Use "Export Layout" to save your entire workspace
4. Use "Import Layout" to load a previously saved workspace
5. Use "Export Item" to save just one grid item
6. Use "Import Item" to add a previously saved grid item

## Technical Details

- Extends the Grid system with context menu capabilities
- Uses the browser's File API for reading and writing files
- Implements copy/paste using the localStorage as a clipboard
- Maintains compatibility with the Save & Load plugin

## CSS Dependencies

- Includes its own styling for context menu appearance
- Uses Material Icons for menu icons

## Integration Points

- Works with the Grid system's event handling
- Provides context menu API for other plugins to extend
- Compatible with the main Save & Load plugin
