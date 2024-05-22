import { colsPerRowSmallShape, rows } from "./constants";
import { TriangleState } from "./types";

export const calculatePosition = (
  triangle: TriangleState,
  size: number,
  padding: number[]
) => {
  const triangleHeight = (size * Math.sqrt(3)) / 2;
  const halfSize = size / 2;
  const rowPadding = padding[triangle.row] * halfSize;
  const xSize = triangle.col * halfSize + rowPadding;
  const ySize = triangle.row * triangleHeight;
  const x = xSize + halfSize;
  const y = ySize + halfSize;
  return { x, y, triangleHeight };
};

export const isTriangleUp = (
  triangle: { row: number; col: number },
  colsPerRow: number[]
) => {
  return triangle.row <= (colsPerRow.length - 1) / 2
    ? triangle.col % 2 === 0
    : triangle.col % 2 !== 0;
};

export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getNeighborOffsets = (row: number, col: number, colsPerRow: number[]) => {
  const maxCols = Math.max(...colsPerRow);
  const padding = colsPerRow.map((cols) => (maxCols - cols) / 2);
  const paddedCol = col + padding[row];
  const isUp = isTriangleUp({ row, col: paddedCol }, colsPerRow);
  return isUp
    ? [
        [0, -1], // left
        [0, 1], // right
        [1, 0], // bottom
      ]
    : [
        [0, -1], // left
        [0, 1], // right
        [-1, 0], // top
      ];
};

const getNeighbors = (
  triangle: TriangleState,
  triangles: TriangleState[],
  colsPerRow: number[]
) => {
  const { row, col } = triangle;
  const neighborOffsets = getNeighborOffsets(row, col, colsPerRow);

  const neighbors = neighborOffsets
    .map(([rowOffset, colOffset]) => {
      const neighborRow = row + rowOffset;
      const neighborCol = col + colOffset;
      if (
        neighborRow >= 0 &&
        neighborRow < rows &&
        neighborCol >= 0 &&
        neighborCol < colsPerRowSmallShape[neighborRow]
      ) {
        return triangles.find(
          (t) => t.row === neighborRow && t.col === neighborCol
        );
      }
      return null;
    })
    .filter((neighbor) => neighbor !== null) as TriangleState[];

  return {
    X: neighbors[0] || null,
    Y: neighbors[1] || null,
    Z: neighbors[2] || null,
  };
};

export const buildNewShape = (): TriangleState[] => {
  const shapeSize = getRandomNumber(1, 5);
  const newShape: TriangleState[] = [];
  const visited = new Set<string>();

  const initialRow = getRandomNumber(1, 2);
  const initialCol = getRandomNumber(2, 3);

  const initialTriangle: TriangleState = {
    row: initialRow,
    col: initialCol,
    isActive: true,
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  };

  newShape.push(initialTriangle);
  visited.add(`${initialRow}-${initialCol}`);

  while (newShape.length < shapeSize) {
    console.log("tryng allocate a triangle");

    let currentTriangle = newShape[newShape.length - 1];
    const neighbors = getNeighbors(
      currentTriangle,
      newShape,
      colsPerRowSmallShape
    );
    const availableNeighbors = Object.entries(neighbors)
      .filter(([key, value]) => value === null)
      .map(([key]) => key);

    if (availableNeighbors.length > 0) {
      const randomNeighbor =
        availableNeighbors[getRandomNumber(0, availableNeighbors.length - 1)];

      const neighborOffsets = getNeighborOffsets(
        currentTriangle.row,
        currentTriangle.col,
        colsPerRowSmallShape
      );
      const [offsetX, offsetY] =
        neighborOffsets[["X", "Y", "Z"].indexOf(randomNeighbor)];

      const newRow = currentTriangle.row + offsetX;
      const newCol = currentTriangle.col + offsetY;

      if (
        newRow >= 0 &&
        newRow < rows &&
        newCol >= 0 &&
        newCol < colsPerRowSmallShape[newRow]
      ) {
        const newTriangle: TriangleState = {
          row: newRow,
          col: newCol,
          isActive: true,
          neighborhoodX: null,
          neighborhoodY: null,
          neighborhoodZ: null,
        };

        // Update the neighbor references
        if (randomNeighbor === "X") {
          currentTriangle.neighborhoodX = newTriangle;
          newTriangle.neighborhoodX = currentTriangle;
        } else if (randomNeighbor === "Y") {
          currentTriangle.neighborhoodY = newTriangle;
          newTriangle.neighborhoodY = currentTriangle;
        } else if (randomNeighbor === "Z") {
          currentTriangle.neighborhoodZ = newTriangle;
          newTriangle.neighborhoodZ = currentTriangle;
        }

        newShape.push(newTriangle);
        visited.add(`${newRow}-${newCol}`);
      }
    } else {
      break;
    }
  }

  return newShape;
};
