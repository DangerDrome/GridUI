# Node Graph Plugin

The Node Graph plugin provides a visual programming interface for creating and editing node-based workflows within the GridUI system.

## Features

- **Interactive Nodes**: Draggable nodes with input and output connectors
- **Visual Connections**: Connect nodes with intuitive drag-and-drop lines
- **Node Library**: Multiple node types for different operations
- **Live Preview**: See results of node operations in real-time
- **Data Flow Visualization**: Track how data moves through your graph
- **Context Menu**: Right-click options for node operations

## Usage

1. Add the plugin to your grid layout
2. Click the "Add Node" button to insert nodes from the library
3. Drag from output ports to input ports to create connections
4. Configure node parameters using the properties panel
5. Use the context menu for additional operations like deleting nodes

## Technical Details

- Built on the GridPlugin base class
- Uses SVG for rendering connections
- Implements a data propagation system for node evaluation
- Maintains graph state for persistence between sessions

## CSS Dependencies

- Includes its own styling for nodes and connections
- Uses Material Icons for node icons and actions

## Events

- Can integrate with other plugins through custom events
- Supports import/export of graph configurations
