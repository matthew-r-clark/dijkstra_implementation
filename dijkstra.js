const BOX_SIZE = 25;
const BOX_MARGIN = 1;

$(function() {
  let graph = Object.create(Graph);
  graph.init();

  $('#solve').click(function() {
    graph.solve();
  });

  $('#reload').click(function() {
    graph.reset();
  });
});

let potentialNeighborPositions = [
  {x: -1, y: -1}, // top left
  {x:  0, y: -1}, // top
  {x:  1, y: -1}, // top right
  {x: -1, y:  1}, // bottom left
  {x:  0, y:  1}, // bottom
  {x:  1, y:  1}, // bottom right
  {x: -1, y:  0}, // left
  {x:  1, y:  0}, // right
];

let Graph = {
  nodes: {},
  size: undefined,

  generateGrid: function() {
    this.$grid.empty();
    this.size = Number(this.$gridSize.val());
    this.createBoxesAndNodes(this.size);
    this.setCssGridSize(this.size);
    this.bindClickEventOnBoxes();
  },

  createBoxesAndNodes: function(size) {
    for (let y = 1; y <= size; y += 1) {
      for (let x = 1; x <= size; x += 1) {
        let $box = $(document.createElement('div'));
        $box.toggleClass('box');
        this.$grid.append($box);
        this.createNode(x, y, $box);
      }
    }
  },

  createNode: function(x, y, htmlElement) {
    let nodeName = `${x}:${y}`;
    let node = new Node(x, y, htmlElement);
    this.nodes[nodeName] = node;
  },

  generateRandomTree: function($element) {
    if (Math.random() > 0.7) {
      $element.toggleClass('tree');
    }
  },

  setCssGridSize: function(size) {
    let pixelWidth = this.calculateGridWidth(size);
    this.$grid.css('width', pixelWidth);
    this.$grid.css('grid-template-columns', `repeat(${size}, 1fr)`)
  },

  bindClickEventOnBoxes: function() {
    let $boxes = $('.box');
    $boxes.click(function(event) {
      let $box = $(event.target);
      $box.toggleClass('tree');
    });
  },

  unbindClickEventOnBoxes: function() {
    let $boxes = $('.box');
    $boxes.off();
  },

  calculateGridWidth: function(size) {
    return size * (BOX_SIZE + (BOX_MARGIN * 2))
  },

  generateSprites: function() {
    for (let nodeName in this.nodes) {
      let node = this.nodes[nodeName];
      let $element = node.$element;
      if (node.isAtPosition(1, 1)) {
        $element.toggleClass('matt');
      } else if (node.isAtPosition(this.size, this.size)) {
        $element.toggleClass('home');
      }
  
      if (node.isFreeSpace()) {
        this.generateRandomTree($element);
      }
    }
  },

  generateNeighborLists: function() {
    for (let nodeName in this.nodes) {
      let node = this.nodes[nodeName];
      node.emptyNeighbors();
      potentialNeighborPositions.forEach(neighborPosition => {
        let x = neighborPosition.x + node.x;
        let y = neighborPosition.y + node.y;
        let neighbor = this.findNodeAtPosition(x, y);
        if (neighbor && !neighbor.isTree()) {
          node.addNeighbor(neighbor);
        }
      });
    }
  },

  findNodeAtPosition: function(x, y) {
    let nodeName = `${x}:${y}`;
    return this.nodes[nodeName];
  },

  solve: function() {
    this.hideFail();
    this.generateNeighborLists();
    try {
      this.findPath();
      this.showPath();
      this.displaySuccess();
    } catch (e) {
      this.displayFail();
      console.log(e);
    }
    this.unbindClickEventOnBoxes();
  },

  findPath: function() {
    this.path = [];
    this.setStartNodeCostToZero();
    let nodesArray = this.getNodesArray();

    while (nodesArray.length > 0) {
      let currentNode = this.sortNodesByCost(nodesArray)[0];
      this.processNodeNeighbors(currentNode);
      this.removeNodeFromArray(currentNode, nodesArray);
    }

    let finish = this.getFinishNode();
    this.backtraceRoute(finish);
  },

  showPath: function() {
    let pause = 500;
    this.path.forEach((node, index, nodes) => {
      setTimeout(function () {
        node.$element.removeClass('matt');
        node.$element.addClass('visited');

        let nextNode = nodes[index + 1];
        if (nextNode && !nextNode.$element.hasClass('home')) {
          nextNode.$element.addClass('matt');
        }
      }, pause);
      pause += 500;
    });
    
    let finishNode = this.getFinishNode();
    setTimeout(function() {
      finishNode.$element.removeClass('visited');
    }, pause - 500);
  },

  displaySuccess: function() {
    let moves = this.path.length - 1;
    $('#message').text(`Matt only needed ${moves} moves to get home!`);
  },

  displayFail: function() {
    $('#message').text('Matt was unable to get home :(');
  },

  hideFail: function() {
    $('#message').text('');
  },

  getNodesArray: function() {
    let array = [];
    for (let nodeName in this.nodes) {
      let node = this.nodes[nodeName];
      if (!node.isTree()) {
        array.push(node);
      }
    }
    return array;
  },

  sortNodesByCost: function(nodes) {
    return nodes.sort((a, b) => {
      if (a.cost < b.cost) {
        return -1;
      } else if (a.cost > b.cost) {
        return 1;
      } else {
        return 0;
      }
    });
  },

  removeNodeFromArray: function(node, array) {
    let i = array.indexOf(node);
    array.splice(i, 1);
  },

  processNodeNeighbors: function(node) {
    node.neighbors.forEach(neighbor => {
      let cost = this.evaluateCost(node, neighbor) + node.cost;
      if (neighbor.cost > cost) {
        neighbor.cost = cost;
        neighbor.setPreviousNode(node);
      }
    });
  },

  backtraceRoute: function(node) {
    this.path.unshift(node);

    if (node.isStart()) {
      return;
    }

    this.backtraceRoute(node.getPreviousNode());
  },

  evaluateCost: function(node, neighbor) {
    let xOffset = Math.abs(node.x - neighbor.x);
    let yOffset = Math.abs(node.y - neighbor.y);

    if (xOffset === 1 && yOffset === 1) {
      return 1.5;
    } else {
      return 1;
    }
  },

  setStartNodeCostToZero: function() {
    for (let nodeName in this.nodes) {
      let node = this.nodes[nodeName];
      if (node.isStart()) {
        node.cost = 0;
        return;
      }
    }
  },

  getFinishNode: function() {
    for (let nodeName in this.nodes) {
      let node = this.nodes[nodeName];
      if (node.isFinish()) {
        return node;
      }
    }
  },

  reset: function() {
    this.hideFail();
    this.generateGrid();
    this.generateSprites();
  },

  bindElements: function() {
    this.$grid = $('#grid');
    this.$gridSize = $('#grid-size');
  },

  bindEvents: function() {
    this.$gridSize.change(this.reset.bind(this));
  },

  init: function() {
    this.bindElements();
    this.bindEvents();
    this.reset();
  },
};


function Node(x, y, htmlElement) {
  if (!(this instanceof Node)) {
    return new Node(x, y);
  }

  this.x = x;
  this.y = y;
  this.neighbors = [];
  this.cost = Infinity;
  this.previous = undefined;
  this.$element = htmlElement;
}

Node.prototype.addNeighbor = function(neighbor) {
  this.neighbors.push(neighbor);
}

Node.prototype.emptyNeighbors = function() {
  this.neighbors = [];
}

Node.prototype.setCost = function(value) {
  this.cost = value;
}

Node.prototype.isTree = function() {
  return this.$element.hasClass('tree');
}

Node.prototype.isMatt = function() {
  return this.$element.hasClass('matt');
}

Node.prototype.isStart = function() {
  return this.isMatt();
}

Node.prototype.isHome = function() {
  return this.$element.hasClass('home');
}

Node.prototype.isFinish = function() {
  return this.isHome();
}

Node.prototype.isFreeSpace = function() {
  return (!this.isMatt() && !this.isHome() && !this.isTree());
}

Node.prototype.isAtPosition = function(x, y) {
  return this.x === x && this.y === y;
}

Node.prototype.setPreviousNode = function(previousNode) {
  this.previous = previousNode;
}

Node.prototype.getPreviousNode = function() {
  return this.previous;
}