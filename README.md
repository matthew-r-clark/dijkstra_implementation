# Help Matt Get Home - Shortest Path Demo
This simulation implements Dijkstra's algorithm to find the shortest path from "Matt" to his house through a maze of randomly generated trees. Inspired by [a coding challenge](https://edabit.com/challenge/qTmbTWqHNTtDMKD4G) from Edabit.com. My [original solution](https://github.com/matthew-r-clark/python-projects/blob/master/shortest_path_dijkstra.py) was written in Python when I was first learning to code.

Before clicking the button to have Matt find his way home, you can toggle the trees on and off to create a custom maze.

You can also choose one of three grid sizes.

Both start (Matt) and end (home) nodes can be moved by dragging and dropping onto another square.

Watch a [demo](https://youtu.be/skIDMW3XNm4).

# Improvements
- Currently the algorithm will look at all nodes even if the there is clearly no complete path from start node to end node. The algorithm could be improved by stopping the process earlier on a failed attempt.
- Small bug when dragging and dropping start/end sprites: works fine the first time you move the sprite, but every other movement of the same sprite will freeze within the current box as long as the mouse button is down. When the mouse button is released, you can move the sprite to another box and place it by clicking again.