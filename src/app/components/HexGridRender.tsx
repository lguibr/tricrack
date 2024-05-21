"use client";

import React, { useRef, useEffect } from "react";
import p5 from "p5";
import { TriangleState, useHexGrid } from "../contexts/HexGridContext";
import { drawTriangleUp, drawTriangleDown } from "@/app/utils/draw";
const canvasSize = 300;

const HexGridRender: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { triangles, setTriangles, size, colsPerRow } = useHexGrid();
  const p5Instance = useRef<p5 | null>(null);

  useEffect(() => {
    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(canvasSize, canvasSize);
        p.noLoop();
      };

      p.draw = () => {
        p.background(0);
        p.stroke(255);
        p.strokeWeight(1);
        p.noFill();

        // Draw the triangles
        triangles.forEach((triangle) => {
          drawTriangle(p, triangle, size);
        });
      };

      const drawTriangle = (p: p5, triangle: TriangleState, size: number) => {
        const triangleHeight = (size * Math.sqrt(3)) / 2;

        const halfSize = size / 2;
        const xSize = triangle.col * halfSize;
        const ySize = triangle.row * triangleHeight;
        const x = xSize + halfSize;
        const y = ySize + halfSize;

        if (triangle.isActive) {
          p.fill(0, 255, 0); // Active triangle
        } else {
          p.fill(255, 0, 0); // Inactive triangle
        }
        // Adjust orientation based on row and column
        if (triangle.row <= (colsPerRow.length - 1) / 2) {
          if (triangle.col % 2 === 0) {
            drawTriangleUp(p, x, y, size, triangleHeight);
          } else {
            drawTriangleDown(p, x, y, size, triangleHeight);
          }
        } else {
          if (triangle.col % 2 === 0) {
            drawTriangleDown(p, x, y, size, triangleHeight);
          } else {
            drawTriangleUp(p, x, y, size, triangleHeight);
          }
        }
      };
    };

    new p5(sketch, canvasRef.current!);
    return () => {
      p5Instance.current?.remove();
    };
  }, [triangles, setTriangles, size, colsPerRow]);

  return <div ref={canvasRef} />;
};

export default HexGridRender;
