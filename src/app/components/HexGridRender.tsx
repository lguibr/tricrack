"use client";

import React, { useRef, useEffect } from "react";
import p5 from "p5";
import { useHexGrid } from "../contexts/HexGridContext";
import { drawTriangle } from "@/app/utils/draw";
import {
  calculatePosition,
  getTriangleAtPosition,
} from "../utils/calculations";
import { canvasSize } from "../utils/constants";

const HexGridRender: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { triangles, setTriangles, size, colsPerRow, padding } = useHexGrid();
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
          const { x, y, triangleHeight } = calculatePosition(
            triangle,
            size,
            padding
          );
          drawTriangle(p, triangle, x, y, size, triangleHeight);
        });
      };

      p.mousePressed = () => {
        const triangle = getTriangleAtPosition(
          p.mouseX,
          p.mouseY,
          triangles,
          size,
          padding
        );
        if (triangle) {
          console.log("Triangle clicked:", triangle);

          // Update the triangle's state to active
          setTriangles((prevTriangles) =>
            prevTriangles.map((t) =>
              t.row === triangle.row && t.col === triangle.col
                ? { ...t, isActive: true }
                : t
            )
          );

          // Redraw the canvas to reflect the state change
          p.redraw();
        } else {
          console.log("No triangle at this position.");
        }
      };
    };

    p5Instance.current = new p5(sketch, canvasRef.current!);
    return () => {
      p5Instance.current?.remove();
    };
  }, [triangles, size, colsPerRow, padding, setTriangles]);

  return <div ref={canvasRef} />;
};

export default HexGridRender;
