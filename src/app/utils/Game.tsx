// src/utils/Game.ts
import * as tf from "@tensorflow/tfjs";

import { TriangleState } from "./types";
import {
  colsPerRowGrid,
  rowsOnGrid,
  colsPerRowShape,
  gridPadding,
} from "./constants";
import {
  buildNewShape,
  checkLineCollapse,
  getNeighbors,
  getTriangleMinimalData,
  removeDuplicatedTrianglesByColAndRow,
  isTriangleUp,
  gameStateToTensor,
  encodeShape,
} from "./calculations";

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

    const initialTriangles: TriangleState[] = [];
    for (let row = 0; row < rowsOnGrid; row++) {
      const cols = colsPerRowGrid[row];
      for (let col = 0; col < cols; col++) {
        const triangle = {
          row,
          col,
          color: null,
          neighborhoodX: null,
          neighborhoodY: null,
          neighborhoodZ: null,
        };
        initialTriangles.push(triangle);
      }
    }

    initialTriangles.forEach((triangle) => {
      const neighbors = getNeighbors(
        triangle,
        initialTriangles,
        colsPerRowGrid
      );
      triangle.neighborhoodX = neighbors.X;
      triangle.neighborhoodY = neighbors.Y;
      triangle.neighborhoodZ = neighbors.Z;
    });

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

  // Add a method to compute adjacency features
  private computeAdjacency(triangle: TriangleState): number {
    const neighbors = getNeighbors(triangle, this.triangles, colsPerRowGrid);
    return [neighbors.X, neighbors.Y, neighbors.Z].reduce(
      (acc, curr) => acc + (curr?.color ? 1 : 0),
      0
    );
  }

  // Modify the gameStateToTensor method to use new features
  public getTensorGameState(): tf.Tensor {
    const occupancy = this.triangles.map((tri) => (tri.color ? 1 : 0));
    const adjacency = this.triangles.map((tri) => this.computeAdjacency(tri));

    // Encode shapes with comprehensive neighborhood information
    const maxShapeSize = 6; // Maximum number of triangles in any shape
    const encodedShapes = this.shapes
      .map((shape) => {
        const paddedShape = shape.slice(); // Copy the shape
        while (paddedShape.length < maxShapeSize) {
          // Pad with a default inactive triangle
          paddedShape.push({
            row: -1,
            col: -1,
            color: null,
            neighborhoodX: null,
            neighborhoodY: null,
            neighborhoodZ: null,
          });
        }
        const encodedShape = encodeShape(paddedShape, colsPerRowGrid); // Encode with rows for orientation

        return encodedShape;
      })
      .flat();

    const inputFeatures = [...occupancy, ...adjacency, ...encodedShapes];

    return tf.tensor(inputFeatures, [1, inputFeatures.length]);
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
