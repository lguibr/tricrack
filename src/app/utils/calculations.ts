import {
  colors,
  colsPerRowGrid,
  colsPerRowShape,
  rowsOnGrid,
} from "./constants";
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

export const calculateRowCol = (
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

export const isTriangleUp = (
  triangle: { row: number; col: number },
  colsPerRow: number[]
) => {
  return triangle.row < colsPerRow.length / 2
    ? triangle.col % 2 === 0
    : triangle.col % 2 !== 0;
};

export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

const getHorizontalLineActive = (
  triangle: TriangleState,
  triangles: TriangleState[]
): TriangleState[] => {
  if (!isTriangleActive(triangle)) return [];

  let index = 0;
  let neighborTail = triangle ? triangle.neighborhoodX : null;
  let tail =
    triangles.find(
      (triangle) =>
        triangle.row === neighborTail?.row && triangle.col === neighborTail?.col
    ) ?? null;

  let neighborHead = triangle ? triangle.neighborhoodY : null;

  let head =
    triangles.find(
      (triangle) =>
        triangle.row === neighborHead?.row && triangle.col === neighborHead?.col
    ) ?? null;

  const line = [triangle];

  while ((!!tail || !!head) && index < 100) {
    if (!tail && !head) return line;
    const tailActive = isTriangleActive(tail);
    const headActive = isTriangleActive(head);

    if (!tailActive || !headActive) {
      return [];
    }

    if (tail) line.push(tail);
    if (head) line.push(head);

    index += 1;
    neighborTail = tail ? tail.neighborhoodX : null;
    tail =
      triangles.find(
        (triangle) =>
          triangle.row === neighborTail?.row &&
          triangle.col === neighborTail?.col
      ) ?? null;

    neighborHead = head ? head.neighborhoodY : null;

    head =
      triangles.find(
        (triangle) =>
          triangle.row === neighborHead?.row &&
          triangle.col === neighborHead?.col
      ) ?? null;
  }

  return line;
};

const getDiagonalLineActive = (
  triangle: TriangleState,
  triangles: TriangleState[],
  directions: ("neighborhoodX" | "neighborhoodY" | "neighborhoodZ")[]
): TriangleState[] => {
  if (!isTriangleActive(triangle)) return [];
  let index = 0;
  let neighborTail = triangle ? triangle[directions[index % 2]] : null;
  let tail =
    triangles.find(
      (triangle) =>
        triangle.row === neighborTail?.row && triangle.col === neighborTail?.col
    ) ?? null;

  let neighborHead = triangle ? triangle[directions[(index + 1) % 2]] : null;

  let head =
    triangles.find(
      (triangle) =>
        triangle.row === neighborHead?.row && triangle.col === neighborHead?.col
    ) ?? null;

  let line = [triangle];

  while (!!tail || !!head) {
    if (!tail && !head) return line;

    const tailActive = isTriangleActive(tail);
    const headActive = isTriangleActive(head);

    if (!tailActive || !headActive) return [];

    if (tail) line.push(tail);
    if (head) line.push(head);

    index += 1;
    neighborTail = tail ? tail[directions[index % 2]] : null;
    tail =
      triangles.find(
        (triangle) =>
          triangle.row === neighborTail?.row &&
          triangle.col === neighborTail?.col
      ) ?? null;

    neighborHead = head ? head[directions[(index + 1) % 2]] : null;

    head =
      triangles.find(
        (triangle) =>
          triangle.row === neighborHead?.row &&
          triangle.col === neighborHead?.col
      ) ?? null;
  }

  return line;
};
const isTriangleActive = (triangle: TriangleState | null) =>
  triangle == null || triangle?.color != null;

export const checkLineCollapse = (
  triangles: TriangleState[]
): TriangleState[] => {
  const isFirstRow = (triangle: TriangleState) => triangle.row === 0;
  const isFirstCol = (triangle: TriangleState) => triangle.col === 0;
  const isColOdd = (triangle: TriangleState) => triangle.col % 2 !== 0;

  const isLastRow = (triangle: TriangleState) =>
    triangle.row === colsPerRowGrid.length - 1;

  const trianglesToCheckDiagonal = triangles?.filter(
    (triangle) =>
      (isFirstRow(triangle) && isColOdd(triangle)) ||
      (isLastRow(triangle) && isColOdd(triangle))
  );

  const trianglesToCheckHorizontal = triangles?.filter((triangle) =>
    isFirstCol(triangle)
  );

  const yzLineTriangles = trianglesToCheckDiagonal?.map((triangle) => {
    return getDiagonalLineActive(triangle, triangles, [
      "neighborhoodY",
      "neighborhoodZ",
    ]);
  });

  const zxLineTriangles = trianglesToCheckDiagonal?.map((triangle) =>
    getDiagonalLineActive(triangle, triangles, [
      "neighborhoodZ",
      "neighborhoodX",
    ])
  );

  const horizontalLineTriangles = trianglesToCheckHorizontal?.map((triangle) =>
    getHorizontalLineActive(triangle, triangles)
  );

  const lines = [
    ...(yzLineTriangles ?? []),
    ...(zxLineTriangles ?? []),
    ...(horizontalLineTriangles ?? []),
  ]
    .flat()
    .filter((_) => _ != null);

  const collapsedUniqueTriangles = removeDuplicatedTrianglesByColAndRow(lines);

  return collapsedUniqueTriangles;
};

const removeDuplicatedTrianglesByColAndRow = (triangles: TriangleState[]) => {
  const triangleMap = new Map<string, TriangleState>();

  triangles.forEach((triangle) => {
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
    .filter((neighbor) => neighbor !== null) as TriangleState[];

  return {
    X: neighbors[0] || null,
    Y: neighbors[1] || null,
    Z: neighbors[2] || null,
  };
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

export const getRandomColor = () => {
  const colorIndex = getRandomNumber(0, colors.length - 1);
  return colors[colorIndex];
};
