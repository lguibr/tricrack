// src/utils/GameEnvironment.ts

import { Game, GameState } from "./types";

export class GameEnvironment {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  reset() {
    this.game.resetGame();
    return this.getState() as GameState;
  }

  getScore() {
    return this.game.getState().score;
  }

  getState() {
    return this.game.getState();
  }

  step(action: { shapeIndex: number; target: number }) {
    const { shapeIndex, target } = action;
    const [col, row] = this.game.getColRowByIndex(target);

    this.game.handleSetShapeOnTriangle(col ?? 0, row ?? 0, shapeIndex);
    const nextState = this.getState();
    const reward = this.getScore();
    const done = this.game.isGameOver();
    return { nextState, reward, done };
  }
}
