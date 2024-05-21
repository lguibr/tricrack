import p5 from "p5";
import { TriangleState } from "./types";
import { isTriangleUp } from "./calculations";
import { colsPerRow } from "./constants";

export const drawTriangleUp = (
  p: p5,
  x: number,
  y: number,
  size: number,
  triangleHeight: number
) => {
  p.beginShape();
  p.vertex(x, y - triangleHeight / 2);
  p.vertex(x - size / 2, y + triangleHeight / 2);
  p.vertex(x + size / 2, y + triangleHeight / 2);
  p.endShape(p.CLOSE);
};

export const drawTriangleDown = (
  p: p5,
  x: number,
  y: number,
  size: number,

  triangleHeight: number
) => {
  p.beginShape();
  p.vertex(x, y + triangleHeight / 2);
  p.vertex(x - size / 2, y - triangleHeight / 2);
  p.vertex(x + size / 2, y - triangleHeight / 2);
  p.endShape(p.CLOSE);
};

export const drawTriangle = (
  p: p5,
  triangle: TriangleState,
  x: number,
  y: number,
  size: number,
  triangleHeight: number
) => {
  if (triangle.isActive) {
    p.fill(0, 255, 0); // Active triangle
  } else {
    p.fill(255, 0, 0); // Inactive triangle
  }

  if (isTriangleUp(triangle, colsPerRow)) {
    drawTriangleUp(p, x, y, size, triangleHeight);
  } else {
    drawTriangleDown(p, x, y, size, triangleHeight);
  }
};
