// File: app/components/HexGridRender.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useHexGrid } from "../contexts/HexGridContext";
import {
  buildNewShape,
  calculatePosition,
  isTriangleUp,
} from "../utils/calculations";
import { colsPerRow, size, canvasSize } from "../utils/constants";
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
  width: ${canvasSize}px;
  height: ${canvasSize}px;
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
  const { triangles, setTriangles, padding } = useHexGrid();

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
            size,
            padding
          );
          const isUp = isTriangleUp(triangle, colsPerRow);
          const zIndex = colsPerRow[triangle.row] - triangle.col;
          return (
            <Triangle
              key={`${triangle.row}-${triangle.col}`}
              $x={x}
              $y={y}
              $size={size}
              $triangleHeight={triangleHeight}
              $isUp={isUp}
              $isActive={triangle.isActive}
              $zIndex={zIndex}
              $rowIndex={triangle.row}
              onClick={() => handleTriangleClick(triangle)}
            />
          );
        })}
      </GridContainer>
      <OptionsContainer>
        {shapes.map((shape, index) => (
          <Option onClick={() => console.log({ index, shape })} key={index}>
            <ShapeRenderer shape={shape} />
          </Option>
        ))}
      </OptionsContainer>
    </Container>
  );
};

export default HexGridRender;
