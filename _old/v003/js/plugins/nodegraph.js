/**
 * Node Graph Plugin
 * Provides a canvas for creating and connecting nodes
 */
class NodeGraphPlugin extends GridPlugin {
  static get type() { return 'nodegraph'; }
  static get name() { return 'Node Graph'; }
  
  constructor(container, options = {}) {
    super(container, options);
    this.state = {
      nodes: options.nodes || [],
      connections: options.connections || [],
      selectedNode: null
    };
    this.canvas = null;
    this.ctx = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }
  
  init() {
    // Create container
    this.container.innerHTML = `
      <div class="node-graph">
        <div class="toolbar">
          <button class="add-node">Add Node</button>
          <button class="add-connection">Connect</button>
          <button class="delete-node">Delete</button>
        </div>
        <canvas class="graph-canvas"></canvas>
      </div>
    `;
    
    // Get elements
    this.canvas = this.container.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.toolbar = this.container.querySelector('.toolbar');
    
    // Resize canvas to fit container
    this.resizeCanvas();
    
    // Initialize default nodes if empty
    if (this.state.nodes.length === 0) {
      this.addNode(100, 100, 'Node 1');
      this.addNode(300, 150, 'Node 2');
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initial render
    this.draw();
  }
  
  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height - 40; // Subtract toolbar height
  }
  
  setupEventListeners() {
    // Add node button
    const addNodeBtn = this.container.querySelector('.add-node');
    addNodeBtn.addEventListener('click', () => {
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * (this.canvas.height - 100) + 50;
      const name = `Node ${this.state.nodes.length + 1}`;
      this.addNode(x, y, name);
    });
    
    // Add connection button
    const addConnectionBtn = this.container.querySelector('.add-connection');
    addConnectionBtn.addEventListener('click', () => {
      if (this.state.selectedNode && this.state.nodes.length > 1) {
        // Find a node that isn't the selected one
        const sourceNodeId = this.state.selectedNode;
        const otherNodes = this.state.nodes.filter(n => n.id !== sourceNodeId);
        if (otherNodes.length > 0) {
          const targetNode = otherNodes[Math.floor(Math.random() * otherNodes.length)];
          this.addConnection(sourceNodeId, targetNode.id);
        }
      }
    });
    
    // Delete node button
    const deleteNodeBtn = this.container.querySelector('.delete-node');
    deleteNodeBtn.addEventListener('click', () => {
      if (this.state.selectedNode) {
        this.deleteNode(this.state.selectedNode);
      }
    });
    
    // Canvas event listeners for nodes
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Window resize listener
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.draw();
    });
  }
  
  // Mouse event handlers
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if clicked on a node
    const clickedNode = this.findNodeAt(mouseX, mouseY);
    
    if (clickedNode) {
      this.state.selectedNode = clickedNode.id;
      this.isDragging = true;
      this.dragOffset = {
        x: mouseX - clickedNode.x,
        y: mouseY - clickedNode.y
      };
      this.draw();
    } else {
      this.state.selectedNode = null;
      this.draw();
    }
  }
  
  handleMouseMove(e) {
    if (!this.isDragging || !this.state.selectedNode) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Update node position
    const node = this.state.nodes.find(n => n.id === this.state.selectedNode);
    if (node) {
      node.x = mouseX - this.dragOffset.x;
      node.y = mouseY - this.dragOffset.y;
      this.draw();
    }
  }
  
  handleMouseUp() {
    this.isDragging = false;
  }
  
  // Node operations
  addNode(x, y, label) {
    const id = `node_${Date.now()}`;
    const color = `hsl(${Math.random() * 360}, 70%, 70%)`;
    
    this.state.nodes.push({ id, x, y, label, color });
    this.draw();
  }
  
  deleteNode(nodeId) {
    // Remove the node
    this.state.nodes = this.state.nodes.filter(n => n.id !== nodeId);
    
    // Remove any connections to/from this node
    this.state.connections = this.state.connections.filter(
      c => c.source !== nodeId && c.target !== nodeId
    );
    
    // Clear selection if this was the selected node
    if (this.state.selectedNode === nodeId) {
      this.state.selectedNode = null;
    }
    
    this.draw();
  }
  
  addConnection(sourceId, targetId) {
    // Check if connection already exists
    const exists = this.state.connections.some(
      c => c.source === sourceId && c.target === targetId
    );
    
    if (!exists && sourceId !== targetId) {
      this.state.connections.push({ source: sourceId, target: targetId });
      this.draw();
    }
  }
  
  // Helper methods
  findNodeAt(x, y) {
    return this.state.nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 30; // Node radius
    });
  }
  
  // Rendering
  draw() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections
    this.drawConnections();
    
    // Draw nodes
    this.drawNodes();
  }
  
  drawConnections() {
    this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    this.ctx.lineWidth = 2;
    
    this.state.connections.forEach(conn => {
      const sourceNode = this.state.nodes.find(n => n.id === conn.source);
      const targetNode = this.state.nodes.find(n => n.id === conn.target);
      
      if (sourceNode && targetNode) {
        this.ctx.beginPath();
        this.ctx.moveTo(sourceNode.x, sourceNode.y);
        this.ctx.lineTo(targetNode.x, targetNode.y);
        this.ctx.stroke();
      }
    });
  }
  
  drawNodes() {
    this.state.nodes.forEach(node => {
      // Draw node circle
      this.ctx.fillStyle = node.color;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw selection indicator
      if (node.id === this.state.selectedNode) {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 34, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Draw node label
      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.label, node.x, node.y);
    });
  }
  
  render() {
    if (!this.canvas) {
      this.init();
    } else {
      this.draw();
    }
  }
  
  onResize() {
    if (this.canvas) {
      this.resizeCanvas();
      this.draw();
    }
  }
  
  onThemeChange() {
    this.draw(); // Redraw with new theme colors
  }
}

// Register the plugin
pluginRegistry.register(NodeGraphPlugin);
