import { Node } from "./node";

$(function() {
  let $grid = $('#grid');
  let $gridSize = $('#grid-size');
  
  $gridSize.change(function() {
    $grid.empty();
    generateGrid();
  });

  function generateGrid() {
    let size = $gridSize.val();

    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        let $box = $(document.createElement('div'));
        $box.toggleClass('box');
        if (i === 0 && j === 0) {
          $box.toggleClass('matt');
        } else if (i === size - 1 && j === size - 1) {
          $box.toggleClass('home');
        }

        if (isFreeSpace($box)) {
          randomSelect($box);
        }

        $grid.append($box);
      }
    }

    let width = size * 27;
    $grid.css('width', width);
    $grid.css('grid-template-columns', `repeat(${size}, 1fr)`)

    let $boxes = $('.box');
    $boxes.click(function(event) {
      let $box = $(event.target);
      $box.toggleClass('tree');
    });
  }

  function randomSelect($box) {
    if (Math.random() > 0.7) {
      $box.toggleClass('tree');
    }
  }

  function isFreeSpace($box) {
    return !$box.hasClass('matt') && !$box.hasClass('home');
  }

  generateGrid();


});

function Node(x, y) {
  if (!(this instanceof Node)) {
    return new Node(x, y);
  }

  this.x = x;
  this.y = y;
  this.neighbors = [];
  this.distanceFromStart = undefined;
  this.element = undefined;
}

Node.prototype.addNeighbor = function(neighbor) {
  this.neighbors.push(neighbor);
}

Node.prototype.setDistance = function(value) {
  this.distanceFromStart = value;
}

Node.prototype.setHtmlElement = function(element) {
  this.element = element;
}

let Graph = {

};

console.log(Graph);
console.log(new Node(5, 10));