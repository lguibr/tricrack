"use client";

import React, { useRef, useEffect } from "react";
import p5 from "p5";
import { TriangleState, useHexGrid } from "../contexts/HexGridContext";

const canvasSize = 300;

const HexGridRender: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { triangles, setTriangles, size } = useHexGrid();
  const height = (size * Math.sqrt(3)) / 2; // Height of an equilateral triangle
  const p5Instance = useRef<p5 | null>(null);

  useEffect(() => {
    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(canvasSize, canvasSize);
        p.noLoop();
        p.canvas.addEventListener("click", handleClick);
      };

      p.draw = () => {
        p.background(0);
        p.stroke(255);
        p.strokeWeight(1);
        p.noFill();

        // Draw the triangles
        triangles.forEach((triangle) => {
          drawTriangle(p, triangle, size, height);
        });
      };

      const drawTriangle = (
        p: p5,
        triangle: TriangleState,
        size: number,
        height: number
      ) => {
        const halfSize = size / 2;
        const xSize = triangle.col * halfSize;
        const ySize = triangle.row * height;
        const x = xSize + halfSize;
        const y = ySize + halfSize;

        if (triangle.isActive) {
          p.fill(0, 255, 0); // Green for active
        } else {
          p.fill(255, 0, 0); // Red for inactive
        }

        if ((triangle.row + triangle.col) % 2 === 0) {
          drawTriangleUp(p, x, y, size);
        } else {
          drawTriangleDown(p, x, y, size);
        }
      };

      const drawTriangleUp = (p: p5, x: number, y: number, size: number) => {
        const height = (size * Math.sqrt(3)) / 2;
        p.beginShape();
        p.vertex(x, y - height / 2);
        p.vertex(x - size / 2, y + height / 2);
        p.vertex(x + size / 2, y + height / 2);
        p.endShape(p.CLOSE);
      };

      const drawTriangleDown = (p: p5, x: number, y: number, size: number) => {
        const height = (size * Math.sqrt(3)) / 2;
        p.beginShape();
        p.vertex(x, y + height / 2);
        p.vertex(x - size / 2, y - height / 2);
        p.vertex(x + size / 2, y - height / 2);
        p.endShape(p.CLOSE);
      };

      const handleClick = (event: MouseEvent) => {
        const { offsetX, offsetY } = event;
        const clickedTriangle = getClickedTriangle(
          offsetX,
          offsetY,
          size,
          height,
          triangles
        );

        if (clickedTriangle) {
          setTriangles((prevTriangles) =>
            prevTriangles.map((triangle) =>
              triangle === clickedTriangle
                ? { ...triangle, isActive: !triangle.isActive }
                : triangle
            )
          );

          p.redraw(); // Redraw the canvas to update the triangle colors
        }
      };

      const getClickedTriangle = (
        mouseX: number,
        mouseY: number,
        size: number,
        height: number,
        triangles: TriangleState[]
      ) => {
        const halfSize = size / 2;

        // Adjust the column and row detection based on the triangle type
        return triangles.find((triangle) => {
          const xSize = triangle.col * halfSize;
          const ySize = triangle.row * height;
          const x = xSize + halfSize;
          const y = ySize + halfSize;
          const isUpward = (triangle.row - triangle.col) % 2 === 0;

          if (isUpward) {
            return (
              mouseX > x - size / 2 &&
              mouseX < x + size / 2 &&
              mouseY > y - height / 2 &&
              mouseY < y + height / 2
            );
          } else {
            return (
              mouseX > x - size / 2 &&
              mouseX < x + size / 2 &&
              mouseY > y - height / 2 &&
              mouseY < y + height / 2
            );
          }
        });
      };
    };

    p5Instance.current = new p5(sketch, canvasRef.current!);
    return () => {
      p5Instance.current?.remove();
    };
  }, [height, size, triangles, setTriangles]);

  return <div ref={canvasRef} />;
};

export default HexGridRender;
