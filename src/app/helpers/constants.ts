import { TriangleState } from "./types";

export const gridSize =
  typeof window === "undefined"
    ? 500
    : Math.min(window.innerWidth, window.innerHeight, 600) * 0.7;
export const colsPerRowGrid = [9, 11, 13, 15, 15, 13, 11, 9];
export const rowsOnGrid = colsPerRowGrid.length;
export const triangleSizeGrid = gridSize / (rowsOnGrid + 1);
export const maxGridCols = Math.max(...colsPerRowGrid);
export const gridPadding = colsPerRowGrid.map(
  (cols) => (maxGridCols - cols) / 2
);

export const shapeSize = triangleSizeGrid * 3;
export const colsPerRowShape = [3, 3];
export const trianglesShapeSize = triangleSizeGrid;
export const maxShapeCols = Math.max(...colsPerRowShape);
export const shapePadding = colsPerRowShape.map(
  (cols) => (maxShapeCols - cols) / 2
);

export const colors = [
  "#ff006e",
  "#ffbe0b",
  "#fb5607",
  "#8338ec",
  "#3a86ff",
] as const;

export const invalidTriangle: TriangleState = {
  row: -1,
  col: -1,
  color: null,
  neighborhoodX: null,
  neighborhoodY: null,
  neighborhoodZ: null,
};

export const horizontalLines = [
  [3, 4, 5, 6, 7, 8, 9, 10, 11],
  [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
  [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
  [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74],
  [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88],
  [92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102],
  [108, 109, 110, 111, 112, 113, 114, 115, 116],
];

export const diagonalXLines = [
  [3, 4, 17, 18, 31, 32, 45, 46, 60],
  [5, 6, 19, 20, 33, 34, 47, 48, 51, 52, 76],
  [7, 8, 21, 22, 35, 36, 49, 50, 63, 64, 77, 78, 92],
  [9, 10, 23, 24, 37, 38, 51, 52, 56, 66, 79, 80, 93, 94, 108],
  [11, 25, 26, 39, 40, 53, 54, 67, 68, 81, 82, 95, 96, 109],
  [27, 41, 42, 55, 56, 69, 70, 83, 84, 97, 98, 111, 112],
  [43, 57, 58, 71, 72, 85, 86, 99, 100, 113, 114],
  [59, 73, 74, 87, 88, 101, 102, 115, 116],
];

export const diagonalYLines = [
  [45, 60, 61, 76, 77, 82, 93, 108, 109],
  [31, 46, 47, 62, 63, 78, 79, 94, 95, 110, 111],
  [17, 32, 33, 48, 49, 64, 65, 80, 81, 96, 97, 112, 113],
  [3, 18, 19, 34, 35, 50, 51, 66, 67, 82, 83, 98, 99, 114, 115],
  [4, 5, 20, 21, 36, 37, 52, 53, 68, 69, 84, 85, 100, 101, 116],
  [6, 7, 22, 23, 38, 39, 54, 55, 70, 71, 86, 87, 102],
  [8, 9, 24, 25, 40, 41, 56, 57, 72, 73, 88],
  [10, 11, 26, 27, 42, 43, 58, 59, 74],
];

export const allLines = [
  ...diagonalXLines,
  ...diagonalYLines,
  ...horizontalLines,
  ...diagonalXLines.map((line) => line.map((i) => i * 2)),
  ...diagonalYLines.map((line) => line.map((i) => i * 2)),
  ...horizontalLines.map((line) => line.map((i) => i * 2)),
];
