# TriCrack

## Overview

TriCrack is an engaging puzzle game where players place shapes made of triangles onto a hexagonal grid. The objective is to form complete lines with these triangles, similar to the mechanics of Tetris but with triangles. Players earn points for every triangle placed and additional points for each triangle in a completed line. The game ends when the player can no longer fit any shapes onto the grid.

In addition to the core gameplay, TriCrack featu a machine learning component where an AI can be trained to play the game. This allows players to watch the AI in action and learn from its strategies.

## Features

- **Hexagonal Grid**: Unique grid layout with triangles forming hexagonal patterns.
- **Scoring System**: Points awarded for placing triangles and completing lines.
- **Game Over**: The game ends when no more shapes can be placed.
- **Machine Learning**: AI layer to train and observe an AI playing the game.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/tricrack.git
   ```

2. Navigate to the project directory:
   ```bash
   cd tricrack
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- Drag and drop shapes made of triangles onto the grid.
- Form complete lines to clear them and earn points.
- When you can no longer fit any shapes, the game is over.

## Machine Learning Integration

TriCrack includes a machine learning training layer using TensorFlow.js. The AI can learn to play the game by observing its state and making moves to maximize the score.

### Training the AI

1. Start the game and click "Start Training" to begin training the AI.
2. Observe the AI as it learns and improves its gameplay over time.
3. Stop the training by clicking "Stop Training".

## TODO List

- [x] Implement saving and loading AI models in browser's indexDB.
- [  ] Improve the AI's decision-making algorithm.
- [ ] Fix column distortion when iterating over rows for shape placement when colPerGridShape have more than 2 rows.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to discuss potential changes.

## License

This project is licensed under the MIT License.

_Enjoy playing and watching the AI master the game!_
