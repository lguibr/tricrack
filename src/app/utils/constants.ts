export const gridSize = 400;
export const colsPerRowGrid = [9, 11, 13, 15, 15, 13, 11, 9];
export const rowsOnGrid = colsPerRowGrid.length;
export const triangleSizeGrid = gridSize / (rowsOnGrid + 1);
export const maxGridCols = Math.max(...colsPerRowGrid);
export const gridPadding = colsPerRowGrid.map(
  (cols) => (maxGridCols - cols) / 2
);

export const shapeSize = 200;
export const colsPerRowShape = [5, 7, 7, 5];
export const trianglesShapeSize = shapeSize / (rowsOnGrid + 1);
export const maxShapeCols = Math.max(...colsPerRowShape);
export const shapePadding = colsPerRowShape.map(
  (cols) => (maxShapeCols - cols) / 2
);
