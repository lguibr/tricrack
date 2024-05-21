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

export const getTriangleAtPosition = (
  x: number,
  y: number,
  triangles: TriangleState[],
  size: number,
  padding: number[]
): TriangleState | null => {
  for (const triangle of triangles) {
    const {
      x: triangleX,
      y: triangleY,
      triangleHeight,
    } = calculatePosition(triangle, size, padding);

    // Check if the point (x, y) is inside the current triangle
    if (
      x >= triangleX - size / 2 &&
      x <= triangleX + size / 2 &&
      y >= triangleY - triangleHeight / 2 &&
      y <= triangleY + triangleHeight / 2
    ) {
      return triangle;
    }
  }
  return null;
};
