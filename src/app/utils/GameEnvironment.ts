// src/utils/GameEnvironment.ts

import { Game, GameState } from "./types";

export class GameEnvironment {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  reset() {
    this.game.resetGame();
    return this.getState();
  }

  getScore() {
    return this.game.getState().score;
  }

  getState() {
    return this.game.getState();
  }

  step(action: { shapeIndex: number; target: number }) {
    console.log({ shapeIndex: action.shapeIndex, target: action.target });

    const { shapeIndex, target } = action;
    const [col, row] = this.game.getColRowByIndex(target);
    console.log({ col, row });

    this.game.handleSetShapeOnTriangle(col ?? 0, row ?? 0, shapeIndex);
    const nextState = this.getState();
    console.log("nextState");
    console.log(nextState);

    const reward = this.getScore();
    console.log({ reward });
    const done = this.game.isGameOver();
    console.log({ done });
    return { nextState, reward, done };
  }
}
