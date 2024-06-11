import { getRandomColor, getRandomNumber } from "./calculations";
import {
  colsPerRowGrid,
  colsPerRowShape,
  gridPadding,
  rowsOnGrid,
} from "./constants";
import { TriangleState } from "./types";

export const initializeTrianglesGrid = (
  colsPerRowGrid: number[]
): TriangleState[] => {
  const rowsOnGrid = colsPerRowGrid.length;
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
    const neighbors = getNeighbors(triangle, initialTriangles, colsPerRowGrid);
    triangle.neighborhoodX = neighbors.X;
    triangle.neighborhoodY = neighbors.Y;
    triangle.neighborhoodZ = neighbors.Z;
  });
  return initialTriangles;
};

export const validateShapePosition = (
  targetTriangle: TriangleState,
  triangles: TriangleState[],
  shape: TriangleState[]
) => {
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

    const triangleUpMatch = targetTriangleUp === shapeTriangleUp;

    const isInBorderConstrains =
      targetRow >= 0 &&
      targetRow < rowsOnGrid &&
      targetCol >= 0 &&
      targetCol < colsPerRowGrid[targetRow];

    const isTrianglesGridOccupied = triangles.find(
      (t) => t.row === targetRow && t.col === targetCol && t.color != null
    );

    const validPosition =
      isInBorderConstrains && !isTrianglesGridOccupied && triangleUpMatch;

    return validPosition;
  });

  return { newHoveredTriangles, validPositions, isValid };
};

export const isTriangleUp = (
  triangle: { row: number; col: number },
  colsPerRow: number[]
) => {
  return triangle.row < colsPerRow.length / 2
    ? triangle.col % 2 === 0
    : triangle.col % 2 !== 0;
};

export const getIndexFromColAndRow = (
  col: number,
  row: number,
  colsPerRow: number[]
): number => {
  let index = 0;
  for (let i = 0; i < row; i++) {
    index += colsPerRow[i];
  }
  return index + col;
};

// DEV Add unit tests and fix.
export const canPlaceShape = (
  targetTriangle: TriangleState,
  shape: TriangleState[],
  triangles: TriangleState[]
) => {
  const firstTriangle = shape[0];
  const defaultColOffset = colsPerRowGrid[targetTriangle.row];
  const isValid = shape.every((triangle) => {
    const targetRow = targetTriangle.row + triangle.row - firstTriangle.row;
    const targetCol =
      targetTriangle.col +
      triangle.col -
      firstTriangle.col -
      colsPerRowGrid[targetRow] +
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
      !triangles.find(
        (t) => t.row === targetRow && t.col === targetCol && t.color != null
      ) &&
      targetTriangleUp === shapeTriangleUp;

    return validPosition;
  });

  return isValid;
};
// DEV Its bugged need unit tests and fix.
export const getIndexesWhereShapeCanBePlaced = (
  shape: TriangleState[],
  triangles: TriangleState[]
): number[] => {
  if (shape.length === 0) return [];
  return triangles
    .map((triangle, index) => {
      if (canPlaceShape(triangle, shape, triangles)) {
        return index;
      }
      return -1;
    })
    .filter((index) => index !== -1);
};

export const getRandomNotEmptyShapeElementIndex = (
  shapes: TriangleState[][]
): number => {
  const shapeIndex = getRandomNumber(0, shapes.length - 1);
  const selectedShape = shapes[shapeIndex];

  if (selectedShape.length === 0)
    return getRandomNotEmptyShapeElementIndex(shapes);
  return shapeIndex;
};

export const removeDuplicatedTrianglesByColAndRow = <
  T extends { col: number; row: number }
>(
  triangles: T[]
): T[] => {
  const triangleMap = new Map<string, T>();

  triangles.forEach((triangle: T) => {
    const key = `${triangle?.row}-${triangle?.col}`;
    triangleMap.set(key, triangle);
  });

  return Array.from(triangleMap.values());
};

export const getNeighbors = (
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

      return triangles.find(
        (triangle) =>
          triangle.row === neighborRow && triangle.col === neighborCol
      );
    })
    .filter((neighbor) => neighbor !== null);

  return {
    X: neighbors[0] || null,
    Y: neighbors[1] || null,
    Z: neighbors[2] || null,
  };
};

export const getNeighborOffsets = (
  row: number,
  col: number,
  colsPerRow: number[]
) => {
  const maxCols = Math.max(...colsPerRow);
  const padding = colsPerRow.map((cols) => (maxCols - cols) / 2);
  const currentTowColpadding = padding[row];

  const upperRowColpadding = padding[row - 1] - currentTowColpadding || 0;
  const downRowColpadding = padding[row + 1] - currentTowColpadding || 0;

  const isUp = isTriangleUp({ row, col }, colsPerRow);
  return isUp
    ? [
        [0, -1], // left
        [0, 1], // right
        [1, 0 - downRowColpadding], // bottom
      ]
    : [
        [0, -1], // left
        [0, 1], // right
        [-1, 0 - upperRowColpadding], // top
      ];
};

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

export const calculateRowColFromPosition = (
  x: number,
  y: number,
  size: number,
  padding: number[]
) => {
  const triangleHeight = (size * Math.sqrt(3)) / 2;
  const halfSize = size / 2;

  const row = Math.floor(y / triangleHeight);
  const rowPadding = padding[row] * halfSize;
  const col = Math.floor((x - halfSize - rowPadding) / halfSize);

  return { row, col };
};

export const buildNewShape = (): TriangleState[] => {
  const shapeSize = getRandomNumber(1, 6);
  const color = getRandomColor();
  const newShape: TriangleState[] = [];
  const visited = new Set<string>();

  const initialRow = 1;
  const initialCol = getRandomNumber(0, 1);

  const initialTriangle: TriangleState = {
    row: initialRow,
    col: initialCol,
    color,
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  };

  newShape.push(initialTriangle);
  visited.add(`${initialRow}-${initialCol}`);

  const maxIterations = 50;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (newShape.length >= shapeSize) {
      break;
    }

    let currentTriangle = newShape[newShape.length - 1];
    const neighbors = getNeighbors(currentTriangle, newShape, colsPerRowShape);
    const availableNeighbors = Object.entries(neighbors)
      .filter(([key, value]) => value === null)
      .map(([key]) => key);

    if (availableNeighbors.length > 0) {
      const randomNeighbor =
        availableNeighbors[getRandomNumber(0, availableNeighbors.length - 1)];

      const neighborOffsets = getNeighborOffsets(
        currentTriangle.row,
        currentTriangle.col,
        colsPerRowShape
      );
      const [offsetX, offsetY] =
        neighborOffsets[["X", "Y", "Z"].indexOf(randomNeighbor)];

      const newRow = currentTriangle.row + offsetX;
      const newCol = currentTriangle.col + offsetY;

      if (
        newRow >= 0 &&
        newRow < rowsOnGrid &&
        newCol >= 0 &&
        newCol < colsPerRowShape[newRow]
      ) {
        const newTriangle: TriangleState = {
          row: newRow,
          col: newCol,
          color,
          neighborhoodX: null,
          neighborhoodY: null,
          neighborhoodZ: null,
        };

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
