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
            key={`shape-triangle-${triangle.row}-${
              triangle.col
            }-${index}-shape-${Date.now()}`}
            $x={x}
            $y={y}
            $size={trianglesShapeSize}
            $triangleHeight={triangleHeight}
            $isUp={isUp}
            $color={triangle.color}
            $zIndex={zIndex}
            $rowIndex={triangle.row}
            $isHovering={triangle.color || null}
            onClick={() => {}}
          />
        );
      })}
    </ShapeContainer>
  );
};

export default ShapeRenderer;
