import React, { useEffect } from "react";
import { useHexGrid } from "../contexts/HexGridContext";
import { calculatePosition, isTriangleUp } from "../utils/calculations";
import { colsPerRow, size, canvasSize } from "../utils/constants";
import { TriangleState } from "../utils/types";
import styled from "styled-components";
import { Triangle } from "./Triangle";

const Container = styled.div`
  display: flex;
  position: relative;
  width: 100vw;
  height: 100vh;
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

  return (
    <Container>
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
              x={x}
              y={y}
              size={size}
              triangleHeight={triangleHeight}
              isUp={isUp}
              isActive={triangle.isActive}
              zIndex={zIndex}
              rowIndex={triangle.row}
              onClick={() => handleTriangleClick(triangle)}
            />
          );
        })}
      </GridContainer>
    </Container>
  );
};

export default HexGridRender;
