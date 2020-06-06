export function Node(x, y) {
  if (!(this instanceof Node)) {
    return new Node(x, y);
  }

  this.x = x;
  this.y = y;
  this.neighbors = [];
  this.distanceValue = 0;
}