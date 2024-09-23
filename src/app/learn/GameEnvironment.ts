// File: learn/GameEnvironment.ts

import * as tf from "@tensorflow/tfjs";
import Game from "../game";
import { totalShapes, totalPositions, actionSize } from "./configs";
import { getIndexFromColAndRow } from "../helpers/triangles";
import { colsPerRowGridPadded, gridPadding } from "../helpers/constants";

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

  getTensorInputState(): tf.Tensor {
    const state = this.game.getTensorGameState();
    return state.squeeze();
  }

  getValidActionsMask(): tf.Tensor {
    const validPositionsByShapes = this.game.getValidPositionsByShapes();
    const mask = new Array(actionSize).fill(0);

    validPositionsByShapes.forEach((positions, shapeIndex) => {
      positions.forEach(({ col, row }) => {
        const rowPadding = gridPadding[row];
        const paddedCol = col + rowPadding;
        const positionIndex = getIndexFromColAndRow(
          paddedCol,
          row,
          colsPerRowGridPadded
        );
        const actionIndex = shapeIndex * totalPositions + positionIndex;
        mask[actionIndex] = 1;
      });
    });

    return tf.tensor([mask]);
  }

  step(action: number) {
    const shapeIndex = Math.floor(action / totalPositions);
    const positionIndex = action % totalPositions;

    const { col: paddedCol, row } = this.getColRowFromIndex(
      positionIndex,
      colsPerRowGridPadded
    );

    const rowPadding = gridPadding[row];
    const col = paddedCol - rowPadding;

    const validPositions = this.game.getValidPositionsByShapes()[shapeIndex];
    const isValidMove = validPositions?.some(
      (pos) => pos.col === col && pos.row === row
    );
    const score = this.getScore();

    let reward = 0;
    let done = false;

    const currentShape = this.game.shapes[shapeIndex]
    const shapeLength = currentShape.length

    if (isValidMove) {
      const moveSuccess = this.game.moveShapeToTriangle(col, row, shapeIndex);

      if (moveSuccess) {
        const scoreDiff = score - this.previousScore;

        if (scoreDiff > 0) {
          const diffByShapeLeng = Math.sqrt(scoreDiff / (shapeLength))
          reward += scoreDiff * diffByShapeLeng
        } else {
          reward += -2 * shapeLength;
        }

        this.previousScore = score;
      } else {
        reward += -2 * shapeLength;
      }
    } else {
      reward += -2 * shapeLength;
    }


    if (this.game.isGameOver()) {
      done = true;
      reward = -50;
    }



    const nextState = this.getTensorInputState();
    return { nextState, reward, done };
  }

  getColRowFromIndex(
    index: number,
    colsPerRow: number[]
  ): { col: number; row: number } {
    let cumulativeCols = 0;
    for (let row = 0; row < colsPerRow.length; row++) {
      const colsInRow = colsPerRow[row];
      if (index < cumulativeCols + colsInRow) {
        const col = index - cumulativeCols;
        return { col, row };
      }
      cumulativeCols += colsInRow;
    }
    return { col: -1, row: -1 };
  }
}
