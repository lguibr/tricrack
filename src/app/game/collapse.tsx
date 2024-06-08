import { colsPerRowGrid } from "../helpers/constants";
import { removeDuplicatedTrianglesByColAndRow } from "../helpers/triangles";
import { TriangleState } from "../helpers/types";

const getHorizontalLineActive = (
  triangle: TriangleState,
  triangles: TriangleState[]
): TriangleState[] => {
  if (!isTriangleActivish(triangle)) return [];

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
    const tailActive = isTriangleActivish(tail);
    const headActive = isTriangleActivish(head);

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
  if (!isTriangleActivish(triangle)) return [];
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

    const tailActive = isTriangleActivish(tail);
    const headActive = isTriangleActivish(head);

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
const isTriangleActivish = (triangle: TriangleState | null) =>
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
