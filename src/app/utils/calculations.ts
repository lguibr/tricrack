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

export const isTriangleUp = (triangle: TriangleState, colsPerRow: number[]) => {
  return triangle.row <= (colsPerRow.length - 1) / 2
    ? triangle.col % 2 === 0
    : triangle.col % 2 !== 0;
};
