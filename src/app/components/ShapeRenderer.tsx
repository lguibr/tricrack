"use client";
import React from "react";
import { TriangleState } from "../utils/types";
import { calculatePosition, isTriangleUp } from "../utils/calculations";
import styled from "styled-components";
import { Triangle } from "./Triangle";
import {
  colsPerRowShape,
  shapePadding,
  shapeSize,
  trianglesShapeSize,
} from "../utils/constants";

const ShapeContainer = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: ${shapeSize}px;
  height: ${shapeSize}px;
  justify-content: center;
  align-items: center;
  border: 2px dotted white;
`;

// TODO translate the shape being dragged so it follows the cursor in perspective to the
// first triangle created used to set the shape

interface ShapeRendererProps {
  shape: TriangleState[];
  onDragStart: (event: React.DragEvent, shape: TriangleState[]) => void;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  onDragStart,
}) => {
  return (
    <ShapeContainer
      draggable
      onDragStart={(event) => onDragStart(event, shape)}
    >
      {shape.map((triangle, index) => {
        const { x, y, triangleHeight } = calculatePosition(
          triangle,
          trianglesShapeSize,
          shapePadding
        );
        const isUp = isTriangleUp(triangle, colsPerRowShape);
        const zIndex = colsPerRowShape[triangle.row] - triangle.col;

        return (
          <Triangle
            key={`shape-triangle-${triangle.row}-${triangle.col}-${index}`}
            $x={x}
            $y={y}
            $size={trianglesShapeSize}
            $triangleHeight={triangleHeight}
            $isUp={isUp}
            $isActive={triangle.isActive}
            $zIndex={zIndex}
            $rowIndex={triangle.row}
            $isHovering={true}
            onClick={() => {}}
          />
        );
      })}
    </ShapeContainer>
  );
};

export default ShapeRenderer;
