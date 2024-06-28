import * as tfType from "@tensorflow/tfjs";
import Game from "../game";
import { gridPadding } from "../helpers/constants";

export class GameEnvironment {
  private game: Game;
  private previousScore = 0;
  private howLongStaticScore = 0;

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

  getValidPositions() {
    return this.game.getValidPositionsByShapes();
  }
  step(action: tfType.Tensor) {
    const [actionList] = action.toInt().arraySync() as number[][];
    const [shapeIndex, paddedIndexTarget] = actionList;

    const unPaddingRowCol = (paddedIndex: number) => {
      const row = Math.floor(paddedIndex / 15);
      const padding = gridPadding[row];
      const col = (paddedIndex % 15) + padding;
      return [col, row];
    };

    const [col, row] = unPaddingRowCol(paddedIndexTarget);

    this.game.moveShapeToTriangle(col ?? 0, row ?? 0, shapeIndex);
    const nextState = this.getTensorInputState();

    const score = this.getScore();
    const pointsDiff = score - this.previousScore;
    if (pointsDiff !== 0) {
      this.howLongStaticScore = 0;
    } else {
      this.howLongStaticScore += 1;
    }
    const shapeSelectedLength = this.game.shapes[shapeIndex].length;
    const done = this.game.isGameOver();
    const reward = done
      ? -2
      : pointsDiff > 0
      ? (pointsDiff - (shapeSelectedLength - 2)) / 6
      : Math.max(-0.1 * this.howLongStaticScore, -1);

    if (done) {
      console.log(
        "%c GAME OVER! ",
        "background: #222; color: #f00;  font-weight: bold; font-size: 16px;"
      );
    }

    this.previousScore = score;
    return { nextState, reward, done };
  }
}
