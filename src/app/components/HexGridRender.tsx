// File: app/components/HexGridRender.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHexGrid } from "../contexts/HexGridContext";
import {
  buildNewShape,
  calculatePosition,
  isTriangleUp,
} from "../utils/calculations";
import {
  colsPerRowGrid,
  triangleSizeGrid,
  gridSize,
  colsPerRowShape,
  gridPadding,
} from "../utils/constants";
import { TriangleState } from "../utils/types";
import styled from "styled-components";
import { Triangle } from "./Triangle";
import ShapeRenderer from "./ShapeRenderer";

const Container = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  gap: 2rem;
  border: 1px solid white;
  justify-content: center;
  align-items: center;
`;

const GridContainer = styled.div`
  position: relative;
  width: ${gridSize}px;
  height: ${gridSize}px;
  border: 1px solid blue;
`;

const OptionsContainer = styled.div`
  position: relative;
  width: 50%;
  height: 4rem;
  border: 1px solid green;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-content: space-around;
  align-items: center;
`;

const Option = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 2px dotted yellow;
  height: 100%;
  cursor: pointer;
`;

const HexGridRender: React.FC = () => {
  const { triangles, setTriangles } = useHexGrid();
  const [draggedShape, setDraggedShape] = useState<TriangleState[] | null>(
    null
  );
  const hexGridRows = colsPerRowGrid.length;
  const [hoveredTriangles, setHoveredTriangles] = useState<Set<string>>(
    new Set()
  );

  const handleTriangleClick = (triangle: TriangleState) => {
    console.log("Triangle clicked", triangle);

    setTriangles((prevTriangles) =>
      prevTriangles.map((t) =>
        t.row === triangle.row && t.col === triangle.col
          ? { ...t, isActive: !t.isActive }
          : t
      )
    );
  };

  const handleDragStart = (event: React.DragEvent, shape: TriangleState[]) => {
    setDraggedShape(shape);
  };

  const handleDragOver = (
    event: React.DragEvent,
    targetTriangle: TriangleState
  ) => {
    event.preventDefault();
    if (!draggedShape) return;
    const [firstTriangle] = draggedShape;
    const newHoveredTriangles = new Set<string>();
    draggedShape.every((triangle) => {
      const targetRow = targetTriangle.row + triangle.row - firstTriangle.row;
      const targetCol =
        targetTriangle.col +
        triangle.col -
        firstTriangle.col -
        gridPadding[targetRow];

      const targetTriangleUp = isTriangleUp(
        { row: targetRow, col: targetCol },
        colsPerRowGrid
      );

      const shapeTriangleUp = isTriangleUp(triangle, colsPerRowShape);

      console.log({ targetTriangleUp, shapeTriangleUp });

      const validPosition =
        targetRow >= 0 &&
        targetRow < hexGridRows &&
        targetCol >= 0 &&
        targetCol < colsPerRowGrid[targetRow] &&
        !triangles.find(
          (t) => t.row === targetRow && t.col === targetCol && t.isActive
        ) &&
        targetTriangleUp === shapeTriangleUp;

      if (validPosition) {
        newHoveredTriangles.add(`${targetRow}-${targetCol}`);
      }

      return validPosition;
    });

    setHoveredTriangles(newHoveredTriangles);
  };

  const handleDrop = (
    event: React.DragEvent,
    targetTriangle: TriangleState
  ) => {
    event.preventDefault();
    if (!draggedShape) return;
  };

  const handleDragLeave = () => {
    setHoveredTriangles(new Set());
  };

  const shapes = useMemo(
    () => Array.from({ length: 3 }, () => buildNewShape()),
    []
  );

  return (
    <Container>
      <div>Current Score / Best Score</div>
      <GridContainer>
        {triangles.map((triangle) => {
          const { x, y, triangleHeight } = calculatePosition(
            triangle,
            triangleSizeGrid,
            gridPadding
          );
          const isUp = isTriangleUp(triangle, colsPerRowGrid);
          const zIndex = colsPerRowGrid[triangle.row] - triangle.col;
          const isHovered = hoveredTriangles.has(
            `${triangle.row}-${triangle.col}`
          );

          return (
            <Triangle
              key={`grid-triangle-${triangle.row}-${triangle.col}`}
              $x={x}
              $y={y}
              $size={triangleSizeGrid}
              $triangleHeight={triangleHeight}
              $isUp={isUp}
              $isActive={triangle.isActive}
              $zIndex={zIndex}
              $rowIndex={triangle.row}
              $isHovering={isHovered}
              onClick={() => handleTriangleClick(triangle)}
              onDrop={(event) => handleDrop(event, triangle)}
              onDragOver={(event) => handleDragOver(event, triangle)}
              onDragLeave={handleDragLeave}
            />
          );
        })}
      </GridContainer>
      <OptionsContainer>
        {shapes.map((shape, index) => (
          <Option onClick={() => console.log({ index, shape })} key={index}>
            <ShapeRenderer shape={shape} onDragStart={handleDragStart} />
          </Option>
        ))}
      </OptionsContainer>
    </Container>
  );
};

export default HexGridRender;
