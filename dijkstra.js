const BOX_SIZE = 25;
const BOX_MARGIN = 1;
let loggingEnabled = false;
var appState;

function report() {
  console.log(appState);
}

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
  success: false,

  generateGrid: function() {
    this.$grid.empty();
    this.size = Number(this.$gridSize.val());
    this.createBoxesAndNodes(this.size);
    this.setCssGridSize(this.size);
  },

  createBoxesAndNodes: function(size) {
    this.purgeNodes();
    for (let y = 1; y <= size; y += 1) {
      for (let x = 1; x <= size; x += 1) {
        let $box = $(document.createElement('div'));
        $box.toggleClass('box');
        this.$grid.append($box);
        this.createNode(x, y, $box);
      }
    }
  },

  purgeNodes: function() {
    this.nodes = {};
  },

  setCssGridSize: function(size) {
    let pixelWidth = this.calculateGridWidth(size);
    this.$grid.css('width', pixelWidth);
    this.$grid.css('grid-template-columns', `repeat(${size}, 1fr)`)
  },

  createNode: function(x, y, htmlElement) {
    let nodeName = `${x}:${y}`;
    let node = new Node(x, y, htmlElement);
    this.nodes[nodeName] = node;
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

  generateRandomTree: function($element) {
    if (Math.random() > 0.7) {
      $element.toggleClass('tree');
    }
  },

  solve: function() {
    this.hideSolveButton();
    this.hideResultMessage();
    this.generateNeighborLists();
    this.findPath();
    this.handleSuccessOrFail();
    this.debuggingLog();
    this.unbindDynamicEvents();
  },

  hideSolveButton: function() {
    $('#solve').toggle(false);
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

  handleSuccessOrFail: function() {
    if (this.success) {
      this.showPath();
      this.displaySuccessMessage();
    } else {
      this.displayFailMessage();
    }
  },

  debuggingLog: function() {
    if (loggingEnabled) {
      console.log('Path:', this.path);
      console.log('Nodes:', this.nodes);
    }
  },

  backtraceRoute: function(node) {
    this.path.unshift(node);
    let previousNode = node.getPreviousNode();

    if (previousNode) {
      this.backtraceRoute(previousNode);
    } else {
      this.success = node.isStart();
    }
  },

  showPath: function() {
    let pause = 400;
    this.path.forEach((node, index, nodes) => {
      setTimeout(function () {
        node.$element.removeClass('matt');
        if (!node.$element.hasClass('home')) {
          node.$element.addClass('visited');
        }

        let nextNode = nodes[index + 1];
        if (nextNode && !nextNode.$element.hasClass('home')) {
          nextNode.$element.addClass('matt');
        }
      }, pause);
      pause += 400;
    });
    
    let finishNode = this.getFinishNode();
    setTimeout(function() {
      finishNode.$element.removeClass('visited');
    }, pause - 400);
  },

  findNodeAtPosition: function(x, y) {
    let nodeName = `${x}:${y}`;
    return this.nodes[nodeName];
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

  processNodeNeighbors: function(node) {
    node.neighbors.forEach(neighbor => {
      let cost = this.evaluateCost(node, neighbor) + node.cost;
      if (neighbor.cost > cost) {
        neighbor.cost = cost;
        neighbor.setPreviousNode(node);
      }
    });
  },

  removeNodeFromArray: function(node, array) {
    let i = array.indexOf(node);
    array.splice(i, 1);
  },

  getFinishNode: function() {
    for (let nodeName in this.nodes) {
      let node = this.nodes[nodeName];
      if (node.isFinish()) {
        return node;
      }
    }
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

  bindDynamicEvents: function() {
    this.$grid.click(this.toggleTrees);
    $('.matt').mousedown(this.handleMousedownOnMatt.bind(this));
    $('.home').mousedown(this.handleMousedownOnHome.bind(this));
    $(document.body).mousemove(this.handleMousemove.bind(this));
    this.$grid.mouseup(this.handleMouseupOnGrid.bind(this));
    $(document.body).mouseup(this.handleMouseupOffGrid.bind(this));
  },

  unbindDynamicEvents: function() {
    this.$grid.off();
    $(document.body).off();
    $('.box').off();
  },

  toggleTrees: function(event) {
    let $box = $(event.target);
    if ($box.hasClass('box') && !$box.hasClass('matt') && !$box.hasClass('home')) {
      $box.toggleClass('tree');
    }
  },

  handleMousedownOnMatt: function(event) {
    if (!this.mousedownHome) {
      this.mousedownMatt = true;
      let $target = $(event.target);
      $target.off('mousedown');
      $target.removeClass('matt');
      this.$previouslyOccupiedByMatt = $target;
      this.moveSprite(event.clientX, event.clientY);
    }
  },

  handleMousedownOnHome: function(event) {
    if (!this.mousedownMatt) {
      this.mousedownHome = true;
      let $target = $(event.target);
      $target.off('mousedown');
      $target.removeClass('home');
      this.$previouslyOccupiedByHome = $target;
      this.moveSprite(event.clientX, event.clientY);
    }
  },

  handleMousemove: function(event) {
    this.moveSprite(event.clientX, event.clientY);
  },

  handleMouseupOnGrid: function(event) {
    this.placeSprite(event);
  },

  handleMouseupOffGrid: function(event) {
    this.replaceSprite(event);
  },

  moveSprite: function(x, y) {
    if (this.isMousedown()) {
      let $cursor = $('#cursor');
      $cursor.toggle(true);
      $cursor.css({
        'left': String(x - 12.5) + 'px',
        'top': String(y - 12.5) + 'px',
      });

      if (this.mousedownMatt) {
        $cursor.removeClass('home').addClass('matt');
      } else if (this.mousedownHome) {
        $cursor.removeClass('matt').addClass('home');
      } else {
        $cursor.removeClass('matt home');
      }
    }
  },

  placeSprite: function(event) {
    event.stopPropagation();
    let $target = $(event.target);
    
    if ($target.hasClass('matt') || $target.hasClass('home') || !$target.hasClass('.box')) {
      this.replaceSprite();
    } else if (this.isMousedown()) {
      this.handleSpritePlacement($target);
    }
  },

  replaceSprite: function(event) {
    let $target;
    if (event && event.target) {
      $target = $(event.target);
    }

    if (!$target || (!$target.hasClass('.box') && (this.isMousedown()))) {
      let $box;
      let $cursor = $('#cursor');
      if ($cursor.hasClass('matt')) {
        $box = this.$previouslyOccupiedByMatt;
      } else if ($cursor.hasClass('home')) {
        $box = this.$previouslyOccupiedByHome;
      }

      if ($box) {
        this.handleSpritePlacement($box);
      }
    }
  },

  handleSpritePlacement: function($box) {
    this.resetCursor();

    if (this.mousedownMatt) {
      $box.removeClass('tree').addClass('matt');
      $('.matt').mousedown(this.handleMousedownOnMatt.bind(this));
    } else if (this.mousedownHome) {
      $box.removeClass('tree').addClass('home');
      $('.home').mousedown(this.handleMousedownOnHome.bind(this));
    }
    this.mousedownMatt = false;
    this.mousedownHome = false;
    this.$previouslyOccupiedByMatt = undefined;
    this.$previouslyOccupiedByHome = undefined;
  },

  isMousedown: function() {
    return this.mousedownMatt || this.mousedownHome;
  },

  resetCursor: function() {
    let $cursor = $('#cursor');
    $cursor.removeClass('matt home');
    $cursor.css({
      'left': '0px',
      'top': '0px',
    });
    $cursor.toggle(false);
  },

  displaySuccessMessage: function() {
    let moves = this.path.length - 1;
    $('#message').text(`Matt only needed ${moves} moves to get home!`);
  },

  displayFailMessage: function() {
    $('#message').text('Matt was unable to get home :(');
  },

  hideResultMessage: function() {
    $('#message').text('');
  },

  reset: function() {
    this.showSolveButton();
    this.hideResultMessage();
    this.generateGrid();
    this.generateSprites();
    this.bindDynamicEvents();
  },

  showSolveButton: function () {
    $('#solve').toggle(true);
  },

  bindElements: function() {
    this.$grid = $('#grid');
    this.$gridSize = $('#grid-size');
  },

  bindEvents: function() {
    this.$gridSize.change(this.reset.bind(this));
  },

  init: function() {
    appState = this;
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