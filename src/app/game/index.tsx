// src/utils/Game.ts
import * as tf from "@tensorflow/tfjs";

import { FixedLengthArray, TriangleState } from "../helpers/types";
import {
  colsPerRowGrid,
  rowsOnGrid,
  colsPerRowShape,
  gridPadding,
} from "../helpers/constants";
import {
  buildNewShape,
  getIndexFromColAndRow,
  removeDuplicatedTrianglesByColAndRow,
} from "../helpers/triangles";

import { checkLineCollapse } from "./../game/collapse";

import { isTriangleUp, initializeTrianglesGrid } from "../helpers/triangles";

class Game {
  private historyTriangles: TriangleState[][] = [];
  private historyShapes: TriangleState[][][] = [];
  private historyScores: number[] = [0];
  private highScore: number;

  constructor() {
    this.highScore = parseInt(
      typeof window !== "undefined"
        ? localStorage.getItem("highScore") || "0"
        : "0",
      10
    );

    // Bind methods to this instance
    this.resetGame = this.resetGame.bind(this);
    this.addToScore = this.addToScore.bind(this);
    this.setShape = this.setShape.bind(this);
    this.setTriangles = this.setTriangles.bind(this);
    this.undo = this.undo.bind(this);
    this.getValidPositionsByShapes = this.getValidPositionsByShapes.bind(this);
    this.calculateHoveredAndValidPositions =
      this.calculateHoveredAndValidPositions.bind(this);
    this.getColRowByIndex = this.getColRowByIndex.bind(this);
    this.getTensorGameState = this.getTensorGameState.bind(this);

    this.resetGame();
  }

  public get triangles() {
    return this.historyTriangles[this.historyTriangles.length - 1];
  }

  public get shapes() {
    return this.historyShapes[this.historyShapes.length - 1];
  }

  public get score() {
    return this.historyScores[this.historyScores.length - 1];
  }

  public get currentHighScore() {
    return this.highScore;
  }

  public resetGame() {
    this.historyScores = [0];

    const initialTriangles: TriangleState[] =
      initializeTrianglesGrid(colsPerRowGrid);

    this.historyTriangles = [[...initialTriangles]];
    this.historyShapes = [Array.from({ length: 3 }, () => buildNewShape())];
  }

  public addToScore(points: number) {
    this.historyScores = [
      ...this.historyScores,
      this.historyScores[this.historyScores.length - 1] + points,
    ];
    this.updateHighScore();
  }

  public setShape(index: number, shape: TriangleState[]) {
    const newShapes = [...this.shapes];
    newShapes[index] = shape;
    this.historyShapes = [...this.historyShapes, newShapes];
    this.checkLineCollapse();
    if (this.shapes.flat().length === 0) {
      this.historyShapes.push([
        buildNewShape(),
        buildNewShape(),
        buildNewShape(),
      ]);

      const newHistoryShapes = this.historyShapes?.filter(
        (shapes) => shapes.flat().length > 0
      );

      this.historyShapes = newHistoryShapes;
    }
  }

  public setTriangles(
    action: (prevTriangles: TriangleState[]) => TriangleState[]
  ) {
    const lastTriangles = this.triangles;
    const newTriangles = action(lastTriangles);
    if (
      JSON.stringify(lastTriangles.map((t) => t.color)) !==
      JSON.stringify(newTriangles.map((t) => t.color))
    ) {
      this.historyTriangles = [...this.historyTriangles, newTriangles];
    }
  }

  public undo() {
    if (this.historyTriangles.length > 1 && this.historyShapes.length > 1) {
      let scoreOffset = 1;

      this.historyTriangles = this.historyTriangles.slice(0, -1);
      const collapsedTriangles = checkLineCollapse(this.triangles);
      if (collapsedTriangles.length > 0) {
        scoreOffset = 2;
        this.historyTriangles = this.historyTriangles.slice(0, -1);
      }

      this.historyShapes = this.historyShapes.slice(0, -1);
      this.historyScores = this.historyScores.slice(0, -scoreOffset);
    }
  }

  private updateHighScore() {
    const localStorageScore = parseInt(
      localStorage.getItem("highScore") || "0",
      10
    );
    const currentScore = this.score;
    if (currentScore > localStorageScore) {
      localStorage.setItem("highScore", currentScore.toString());
      this.highScore = currentScore;
    }
  }

  public getValidPositionsByShapes() {
    const validPositions = this.shapes.map((shape) => {
      const positions: { row: number; col: number }[] = [];
      this.triangles.forEach((triangle) => {
        const { validPositions } =
          this.calculateHoveredAndValidPositions(null, triangle, true, shape) ??
          {};
        if (validPositions) {
          positions.push(...validPositions);
        }
      });
      return removeDuplicatedTrianglesByColAndRow(positions);
    });
    return validPositions;
  }

  public calculateHoveredAndValidPositions(
    event: React.DragEvent | null,
    targetTriangle: TriangleState,
    isDropEvent = false,
    shape: TriangleState[] | null = null
  ) {
    event?.preventDefault();

    if (!shape) return;

    const firstTriangle = shape[0];
    const defaultColOffset = gridPadding[targetTriangle.row];
    const newHoveredTriangles = new Set<string>();
    const validPositions: { row: number; col: number }[] = [];

    const isValid = shape.every((triangle) => {
      const targetRow = targetTriangle.row + triangle.row - firstTriangle.row;
      const targetCol =
        targetTriangle.col +
        triangle.col -
        firstTriangle.col -
        gridPadding[targetRow] +
        defaultColOffset;
      const targetTriangleUp = isTriangleUp(
        { row: targetRow, col: targetCol },
        colsPerRowGrid
      );

      const shapeTriangleUp = isTriangleUp(triangle, colsPerRowShape);

      const validPosition =
        targetRow >= 0 &&
        targetRow < rowsOnGrid &&
        targetCol >= 0 &&
        targetCol < colsPerRowGrid[targetRow] &&
        !this.triangles.find(
          (t) => t.row === targetRow && t.col === targetCol && t.color != null
        ) &&
        targetTriangleUp === shapeTriangleUp;

      if (validPosition) {
        if (isDropEvent) {
          validPositions.push({ row: targetRow, col: targetCol });
        } else {
          newHoveredTriangles.add(`${targetRow}-${targetCol}`);
        }
      }

      return validPosition;
    });

    return { newHoveredTriangles, validPositions, isValid };
  }

  public getColRowByIndex(index: number): [number?, number?] {
    const triangle = this.triangles.find((triangle, i) => i === index);
    return [triangle?.col, triangle?.row];
  }

  private getEmptyGrid(): FixedLengthArray<FixedLengthArray<number, 15>, 8> {
    const emptyGrid = Array.from({ length: 8 }, () =>
      Array.from({ length: 15 }, () => -1)
    ) as FixedLengthArray<FixedLengthArray<number, 15>, 8>;

    return emptyGrid;
  }

  getEmptyShapeGrid(): FixedLengthArray<FixedLengthArray<number, 3>, 2> {
    return [
      [-1, -1, -1],
      [-1, -1, -1],
    ];
  }

  private getShapesGrid(): FixedLengthArray<
    FixedLengthArray<FixedLengthArray<number, 3>, 2>,
    3
  > {
    const shapesGrid: FixedLengthArray<
      FixedLengthArray<FixedLengthArray<number, 3>, 2>,
      3
    > = [
      this.getEmptyShapeGrid(),
      this.getEmptyShapeGrid(),
      this.getEmptyShapeGrid(),
    ];

    this.shapes.forEach((shape, shapeIndex) => {
      shape.forEach((triangle) => {
        const { row, col } = triangle;
        if (row < 8 && col < 15) {
          shapesGrid[shapeIndex][row][col] = 1;
        }
      });
    });

    return shapesGrid;
  }

  private getGrid(): FixedLengthArray<FixedLengthArray<number, 15>, 8> {
    const grid = this.getEmptyGrid();
    this.triangles.forEach((triangle) => {
      const { row, col: paddedCol, color } = triangle;
      const rowOffset = gridPadding[row];
      const realCol = paddedCol + rowOffset;
      grid[row][realCol] = 1;
    });

    return grid;
  }
  private getGridAvailability(): FixedLengthArray<
    FixedLengthArray<number, 15>,
    8
  > {
    const grid = this.getEmptyGrid();
    this.triangles.forEach((triangle) => {
      const { row, col: paddedCol, color } = triangle;
      const active = color != null;
      const rowOffset = gridPadding[row];
      const realCol = paddedCol + rowOffset;

      grid[row][realCol] = active ? 0 : 1;
    });

    return grid;
  }

  private getGriDownwards(): FixedLengthArray<FixedLengthArray<number, 15>, 8> {
    const grid = this.getEmptyGrid();
    this.triangles.forEach((triangle) => {
      const { row, col: paddedCol } = triangle;
      const isUp = isTriangleUp(triangle, colsPerRowGrid);

      const rowOffset = gridPadding[row];
      const realCol = paddedCol + rowOffset;

      grid[row][realCol] = !isUp ? 1 : 0;
    });

    return grid;
  }
  private getGridUpwards(): FixedLengthArray<FixedLengthArray<number, 15>, 8> {
    const grid = this.getEmptyGrid();
    this.triangles.forEach((triangle) => {
      const { row, col: paddedCol } = triangle;
      const isUp = isTriangleUp(triangle, colsPerRowGrid);

      const rowOffset = gridPadding[row];
      const realCol = paddedCol + rowOffset;

      grid[row][realCol] = isUp ? 1 : 0;
    });

    return grid;
  }

  private getShapesUpwardness(): FixedLengthArray<
    FixedLengthArray<number, 3>,
    2
  > {
    const shapeOrientation = this.getEmptyShapeGrid();
    const placeHolderShape = [
      { row: 0, col: 0, color: 0 },
      { row: 0, col: 1, color: 0 },
      { row: 0, col: 2, color: 0 },
      { row: 1, col: 0, color: 0 },
      { row: 1, col: 1, color: 0 },
      { row: 1, col: 2, color: 0 },
    ];

    placeHolderShape.forEach((triangle) => {
      const { row, col } = triangle;
      if (row < 8 && col < 15) {
        const isUp = isTriangleUp(triangle, colsPerRowShape);
        shapeOrientation[row][col] = isUp ? 1 : 0;
      }
    });

    return shapeOrientation;
  }
  private getShapesDownwards(): FixedLengthArray<
    FixedLengthArray<number, 3>,
    2
  > {
    const shapeOrientation = this.getEmptyShapeGrid();
    const placeHolderShape = [
      { row: 0, col: 0, color: 0 },
      { row: 0, col: 1, color: 0 },
      { row: 0, col: 2, color: 0 },
      { row: 1, col: 0, color: 0 },
      { row: 1, col: 1, color: 0 },
      { row: 1, col: 2, color: 0 },
    ];

    placeHolderShape.forEach((triangle) => {
      const { row, col } = triangle;
      if (row < 8 && col < 15) {
        const isUp = isTriangleUp(triangle, colsPerRowShape);
        shapeOrientation[row][col] = !isUp ? 1 : 0;
      }
    });

    return shapeOrientation;
  }

  private getTensorGridShape(): number[] {
    return [7, 8, 15];
  }
  private getTensorShapeShape(): number[] {
    return [5, 2, 3];
  }

  private getFittableByShapeGrid(): FixedLengthArray<
    FixedLengthArray<FixedLengthArray<number, 15>, 8>,
    3
  > {
    const emptyGrids: FixedLengthArray<
      FixedLengthArray<FixedLengthArray<number, 15>, 8>,
      3
    > = [this.getEmptyGrid(), this.getEmptyGrid(), this.getEmptyGrid()];

    const validPositionsByShapes = this.getValidPositionsByShapes();

    validPositionsByShapes.forEach((positions, positionIndex) =>
      positions.forEach(({ row, col }) => {
        const rowOffset = gridPadding[row];
        const realCol = col + rowOffset;
        emptyGrids[positionIndex][row][realCol] = 1;
      })
    );

    return emptyGrids;
  }

  public getTensorGameState(): [tf.Tensor, tf.Tensor] {
    const gridFormat = this.getGrid();
    const gridDownwards = this.getGriDownwards();
    const gridUpwards = this.getGridUpwards();
    const gridAvailability = this.getGridAvailability();

    const shapesGrid = this.getShapesGrid();
    const shapesUpwardness = this.getShapesUpwardness();
    const shapesDownwards = this.getShapesDownwards();
    const fittableByShapeGrid = this.getFittableByShapeGrid();

    const gridsFeatures = [
      gridFormat,
      gridAvailability,
      gridDownwards,
      gridUpwards,
      ...fittableByShapeGrid,
    ];

    const shapesFeatures = [...shapesGrid, shapesUpwardness, shapesDownwards];

    const girdTensorShape = this.getTensorGridShape();
    const gridTensor = tf.tensor(gridsFeatures, girdTensorShape);

    const shapeTensorShape = this.getTensorShapeShape();
    const shapeTensor = tf.tensor(shapesFeatures, shapeTensorShape);

    return [gridTensor, shapeTensor];
  }

  public isGameOver() {
    return (
      this.shapes &&
      this.shapes.flat().length !== 0 &&
      this.shapes
        .filter((shape) => shape.length > 0)
        .every((shape) => !this.canPlaceAnyShape(shape))
    );
  }

  public canPlaceAnyShape(shape: TriangleState[]) {
    return this.triangles.some((triangle) => {
      const { isValid } =
        this.calculateHoveredAndValidPositions(null, triangle, true, shape) ??
        {};
      return isValid;
    });
  }

  public checkLineCollapse() {
    const collapsedTriangles = checkLineCollapse(this.triangles);

    if (collapsedTriangles.length > 0) {
      this.setTriangles((prevTriangles) =>
        prevTriangles.map((triangle) => {
          if (collapsedTriangles.find((t) => t.row === triangle.row)) {
            return {
              ...triangle,
              color: null,
            };
          }
          return triangle;
        })
      );
      this.addToScore(collapsedTriangles.length);
    }
  }

  public moveShapeToTriangle(col: number, row: number, shapeIndex: number) {
    const haveShapes = this.shapes && this.shapes.flat(5).length > 0;
    if (!haveShapes) return;
    const shape = this.shapes[shapeIndex];

    const targetTriangle = this.triangles.find(
      (t) => t.row === row && t.col === col
    );

    if (targetTriangle) {
      const { validPositions, isValid } =
        this.calculateHoveredAndValidPositions(
          null,
          targetTriangle,
          true,
          shape
        ) ?? {};

      if (isValid && shape != null && shape.length > 0) {
        const color = shape[0].color;
        this.addToScore(shape.length);
        this.setTriangles((prevTriangles) =>
          prevTriangles.map((triangle) =>
            validPositions?.some(
              (pos) => pos.row === triangle.row && pos.col === triangle.col
            )
              ? {
                  ...triangle,
                  color,
                }
              : triangle
          )
        );
        this.setShape(shapeIndex, []);
      }
    }
  }
}

export default Game;
