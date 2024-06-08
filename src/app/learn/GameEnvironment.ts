import * as tfType from "@tensorflow/tfjs";
import Game from "../game";

export class GameEnvironment {
  private game: Game;
  private previousScore = 0;

  constructor(game: Game) {
    this.game = game;
  }

  reset() {
    this.previousScore = 0;
    this.game.resetGame();
    return this.getTensorInputState();
  }

  getScore() {
    return this.game.score;
  }

  getTriangles() {
    return this.game.triangles;
  }

  getShapes() {
    return this.game.shapes;
  }

  getTensorInputState() {
    return this.game.getTensorGameState();
  }

  step(action: tfType.Tensor) {
    const [actionList] = action.toInt().arraySync() as number[][];
    const [shapeIndex, target] = actionList;

    const [col, row] = this.game.getColRowByIndex(target);

    this.game.moveShapeToTriangle(col ?? 0, row ?? 0, shapeIndex);
    const nextState = this.getTensorInputState();

    const score = this.getScore();
    const isScoreBiggest = score > this.previousScore;
    const pointsDiff = score - this.previousScore;
    const reward = isScoreBiggest ? (pointsDiff > 6 ? 2 : 1) : -1;

    const done = this.game.isGameOver();
    this.previousScore = score;
    return { nextState, reward, done };
  }
}