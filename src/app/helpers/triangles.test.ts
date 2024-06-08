import { canPlaceShape, initializeTrianglesGrid } from "./triangles";
import { TriangleState } from "./types";
import { colors, colsPerRowGrid } from "./constants";

interface TestCase {
  description: string;
  triangles: TriangleState[];
  shape: TriangleState[];
  targetTriangle: TriangleState;
  expected: boolean;
}

// Define the colors, assume they are imported from constants

// Mock some shapes and triangles based on your game's logic
const shape1: TriangleState[] = [
  {
    row: 0,
    col: 0,
    color: colors[0],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
  {
    row: 0,
    col: 1,
    color: colors[1],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
]; // Shape /\/

const shape2: TriangleState[] = [
  {
    row: 0,
    col: 1,
    color: colors[2],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
]; // Shape \/

const emptyGrid: TriangleState[] = initializeTrianglesGrid(colsPerRowGrid);

const activateTriangle = (
  triangle: { col: number; row: number },
  triangles: TriangleState[]
): TriangleState[] =>
  triangles.map((t) =>
    t.row === triangle.row && t.col === triangle.col
      ? { ...t, color: colors[0] }
      : t
  );

const activateShape = (
  shape: TriangleState[],
  triangles: TriangleState[]
): TriangleState[] => {
  const newTriangles = [...triangles];
  for (let i = 0; i < shape.length; i++) {
    triangles = activateTriangle(
      { row: shape[i].row, col: shape[i].col },
      triangles
    );
  }
  return triangles;
};

// Define test cases
const testCases: TestCase[] = [
  {
    description: "Valid placement without overlap or bounds issue",
    triangles: emptyGrid,
    shape: shape1,
    targetTriangle: {
      row: 0,
      col: 0,
      color: null,
      neighborhoodX: null,
      neighborhoodY: null,
      neighborhoodZ: null,
    },
    expected: true,
  },
  {
    description: "Invalid placement with overlap",
    triangles: activateShape(shape1, emptyGrid),
    shape: shape1,
    targetTriangle: {
      row: 0,
      col: 1,
      color: null,
      neighborhoodX: null,
      neighborhoodY: null,
      neighborhoodZ: null,
    },
    expected: false,
  },
  {
    description: "Invalid placement out of bounds",
    triangles: emptyGrid,
    shape: shape2,
    targetTriangle: {
      row: 0,
      col: 0,
      color: null,
      neighborhoodX: null,
      neighborhoodY: null,
      neighborhoodZ: null,
    },
    expected: false,
  },
];

// Run test cases
testCases.forEach((testCase) => {
  const result = canPlaceShape(
    testCase.targetTriangle,
    testCase.shape,
    testCase.triangles
  );
  console.log(
    `Test: ${testCase.description} - Expected: ${testCase.expected}, Got: ${result}`
  );
});
