import { invalidTriangle } from "../helpers/constants";
import {
  canPlaceShape,
  getIndexFromColAndRow,
  isTriangleUp,
} from "../helpers/triangles";
import { FixedLengthArray, TriangleState } from "../helpers/types";

export const encodeTriangle = (
  triangle: TriangleState,
  triangleIndex: number,
  rows: number[]
): FixedLengthArray<number, 5> => {
  const isUp = isTriangleUp(triangle, rows);
  const { col: xCol, row: xRow } = triangle.neighborhoodX ?? invalidTriangle;
  const xIndex =
    xCol !== -1 && xRow !== -1 ? getIndexFromColAndRow(xCol, xRow, rows) : -1;

  const { col: yCol, row: yRow } = triangle.neighborhoodY ?? invalidTriangle;
  const yIndex =
    yCol !== -1 && yRow !== -1 ? getIndexFromColAndRow(yCol, yRow, rows) : -1;

  const { col: zCol, row: zRow } = triangle.neighborhoodZ ?? invalidTriangle;

  const zIndex =
    zCol !== -1 && zRow !== -1 ? getIndexFromColAndRow(zCol, zRow, rows) : -1;

  return [triangleIndex, isUp ? 1 : -1, xIndex, yIndex, zIndex];
};

export const encodeShape = (
  shape: TriangleState[],
  rows: number[]
): number[] => {
  return shape.flatMap((triangle, idx) => {
    return encodeTriangle(triangle, idx, rows);
  });
};

export const encodeAvailability = (
  triangles: TriangleState[],
  shapes: TriangleState[][]
): number[] => {
  const availability = triangles.map((triangle) => {
    const availability = shapes.reduce((acc, shape, index) => {
      if (canPlaceShape(triangle, shape, triangles)) {
        return acc + 1 * index;
      }
      return acc;
    }, 0);
    return availability;
  });
  return availability;
};
