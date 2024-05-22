// File: app/components/ShapeRendere.tsx

"use client";
import React from "react";
import { TriangleState } from "../utils/types";
import { calculatePosition, isTriangleUp } from "../utils/calculations";
import styled from "styled-components";
import { Triangle } from "./Triangle";

const smallColsPerRow = [5, 7, 7, 5];
const smallGridSize = 20;
const smallPadding = smallColsPerRow.map((cols) => (smallGridSize - cols) / 2);

const ShapeContainer = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: ${smallGridSize * 10}px;
  height: ${smallGridSize * 10}px;
  justify-content: center;
  align-items: center;
  border: 2px dotted white;
`;

interface ShapeRendererProps {
  shape: TriangleState[];
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shape }) => {
  return (
    <ShapeContainer>
      {shape.map((triangle) => {
        const { x, y, triangleHeight } = calculatePosition(
          triangle,
          smallGridSize,
          smallPadding
        );
        const isUp = isTriangleUp(triangle, smallColsPerRow);
        const zIndex = smallColsPerRow[triangle.row] - triangle.col;

        return (
          <Triangle
            key={`${triangle.row}-${triangle.col}`}
            $x={x}
            $y={y}
            $size={smallGridSize}
            $triangleHeight={triangleHeight}
            $isUp={isUp}
            $isActive={triangle.isActive}
            $zIndex={zIndex}
            $rowIndex={triangle.row}
            onClick={() => {}}
          />
        );
      })}
    </ShapeContainer>
  );
};

export default ShapeRenderer;
