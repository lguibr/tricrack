import p5 from "p5";

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
