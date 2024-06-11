import {
  canPlaceShape,
  initializeTrianglesGrid,
  getIndexesWhereShapeCanBePlaced,
} from "./triangles";
import { TriangleState } from "./types";
import { colors, colsPerRowGrid } from "./constants";
import { expect, it } from "@jest/globals";
import { describe } from "node:test";

const upDownTriangles: TriangleState[] = [
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

const upDownUpDownUpDownUpTriangles: TriangleState[] = [
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
  {
    row: 0,
    col: 2,
    color: colors[0],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
  {
    row: 0,
    col: 3,
    color: colors[1],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
  {
    row: 0,
    col: 4,
    color: colors[0],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
  {
    row: 0,
    col: 5,
    color: colors[1],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
  {
    row: 0,
    col: 6,
    color: colors[0],
    neighborhoodX: null,
    neighborhoodY: null,
    neighborhoodZ: null,
  },
]; // Shape[7] /\/\/\/\

const downTriangle: TriangleState[] = [
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
  for (let i = 0; i < shape.length; i++) {
    triangles = activateTriangle(
      { row: shape[i].row, col: shape[i].col },
      triangles
    );
  }
  return triangles;
};
describe("Test canPlaceShape function", () => {
  interface CanPlaceShapeTestCase {
    description: string;
    triangles: TriangleState[];
    shape: TriangleState[];
    targetTriangle: TriangleState;
    expectToFit: boolean;
  }

  const testCases: CanPlaceShapeTestCase[] = [
    {
      description: "Valid placement without overlap or bounds issue",
      triangles: emptyGrid,
      shape: upDownTriangles,
      targetTriangle: {
        row: 0,
        col: 0,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: true,
    },
    {
      description: "Invalid placement with overlap of already placed triangle",
      triangles: activateShape(upDownTriangles, emptyGrid),
      shape: upDownTriangles,
      targetTriangle: {
        row: 0,
        col: 1,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: false,
    },
    {
      description:
        "Invalid placement of triangle downwards on grid's triangle upwards",
      triangles: emptyGrid,
      shape: downTriangle,
      targetTriangle: {
        row: 0,
        col: 0,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: false,
    },
    {
      description:
        "Valid placement of triangle downwards on grid's triangle downwards",
      triangles: emptyGrid,
      shape: downTriangle,
      targetTriangle: {
        row: 0,
        col: 1,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: true,
    },
    {
      description: "Valid placement of triangle shape",
      triangles: emptyGrid,
      shape: upDownUpDownUpDownUpTriangles,
      targetTriangle: {
        row: 0,
        col: 0,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: true,
    },
    {
      description: "Invalid placement of triangle shape overflow row",
      triangles: emptyGrid,
      shape: upDownUpDownUpDownUpTriangles,
      targetTriangle: {
        row: 0,
        col: 6,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: false,
    },
    {
      description: "Invalid placement of triangle shape upwardness",
      triangles: emptyGrid,
      shape: upDownUpDownUpDownUpTriangles,
      targetTriangle: {
        row: 0,
        col: 1,
        color: null,
        neighborhoodX: null,
        neighborhoodY: null,
        neighborhoodZ: null,
      },
      expectToFit: false,
    },
  ];

  // Run test cases
  testCases.forEach((testCase) => {
    it(`Test: ${testCase.description}`, () => {
      const result = canPlaceShape(
        testCase.targetTriangle,
        testCase.shape,
        testCase.triangles
      );
      console.log(
        `Test: ${testCase.description} - Expected: ${testCase.expectToFit}, Got: ${result}`
      );

      // adding assertion using jest for it
      expect(result).toBe(testCase.expectToFit);
    });
  });
});
