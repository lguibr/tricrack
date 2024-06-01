export const gridSize =
  typeof window === "undefined"
    ? 500
    : Math.min(window.innerWidth, window.innerHeight) * 0.7;
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
