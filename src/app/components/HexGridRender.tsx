"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHexGrid } from "../contexts/HexGridContext";
import {
  calculatePosition,
  calculateRowCol,
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
import Modal from "./Modal";

const Container = styled.div`
  display: grid;
  position: relative;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
`;

const GridContainer = styled.div`
  position: relative;
  width: ${gridSize}px;
  height: ${gridSize}px;
`;

const OptionsContainer = styled.div`
  position: relative;
  width: 50%;
  height: 100%;
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
  height: 100%;
  cursor: pointer;
`;

const offSetY = 0;

const HexGridRender: React.FC = () => {
  const {
    triangles,
    setTriangles,
    score,
    highScore,
    shapes,
    setShape,
    resetGame,
    addToScore,
  } = useHexGrid();
  const [draggedShape, setDraggedShape] = useState<{
    shape: TriangleState[] | null;
    index: number | null;
  }>({ shape: null, index: null });
  const hexGridRows = colsPerRowGrid.length;
  const gridRef = useRef<HTMLDivElement>(null);
  const gridPosition = gridRef.current?.getBoundingClientRect();
  console.log({ gridRef });
  console.log({ gridPosition });

  const [showModal, setShowModal] = useState(false);

  const [hoveredTriangles, setHoveredTriangles] = useState<Set<string>>(
    new Set()
  );

  const handleTriangleClick = useCallback(
    (triangle: TriangleState) => {
      setTriangles((prevTriangles) =>
        prevTriangles.map((t) =>
          t.row === triangle.row && t.col === triangle.col
            ? { ...t, isActive: !t.isActive }
            : t
        )
      );
    },
    [setTriangles]
  );

  const calculateHoveredAndValidPositions = useCallback(
    (
      event: React.DragEvent | null,
      targetTriangle: TriangleState,
      isDropEvent = false,
      shape: TriangleState[] | null = draggedShape.shape
    ) => {
      event?.preventDefault();
      if (!shape) return;

      const firstTriangle = shape[0];
      const defaultColOffset = gridPadding[targetTriangle.row];
      const newHoveredTriangles = new Set<string>();
      const validPositions: { row: number; col: number }[] = [];

      const isValid = shape.every((triangle) => {
        const targetRow = targetTriangle.row + triangle.row - firstTriangle.row;
        const targetCol =
          targetTriangle.col +
          triangle.col -
          firstTriangle.col -
          gridPadding[targetRow] +
          defaultColOffset;
        const targetTriangleUp = isTriangleUp(
          { row: targetRow, col: targetCol },
          colsPerRowGrid
        );
        const shapeTriangleUp = isTriangleUp(triangle, colsPerRowShape);

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
          if (isDropEvent) {
            validPositions.push({ row: targetRow, col: targetCol });
          } else {
            newHoveredTriangles.add(`${targetRow}-${targetCol}`);
          }
        }

        return validPosition;
      });

      return { newHoveredTriangles, validPositions, isValid };
    },
    [draggedShape, triangles, hexGridRows]
  );

  const canPlaceAnyShape = useCallback(
    (shape: TriangleState[]) => {
      return triangles.some((triangle) => {
        const { isValid } =
          calculateHoveredAndValidPositions(null, triangle, true, shape) ?? {};
        return isValid;
      });
    },
    [calculateHoveredAndValidPositions, triangles]
  );

  useEffect(() => {
    if (
      shapes.flat().length !== 0 &&
      shapes
        .filter((shape) => shape.length > 0)
        .every((shape) => !canPlaceAnyShape(shape))
    ) {
      console.log("game over");
      setShowModal(true);
    }
  }, [canPlaceAnyShape, shapes]); // This effect checks whenever shapes array changes

  const handleDragStart = useCallback(
    (index: number, _: React.DragEvent, shape: TriangleState[]) => {
      setDraggedShape({ shape, index });
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      const x = event.clientX - (gridPosition?.left || 0);
      const y = event.clientY - (gridPosition?.top || 0) - offSetY;
      const { col, row } = calculateRowCol(x, y, triangleSizeGrid, gridPadding);

      const targetTriangle = triangles.find(
        (t) => t.row === row && t.col === col
      );

      if (targetTriangle) {
        const { newHoveredTriangles, isValid } =
          calculateHoveredAndValidPositions(event, targetTriangle) ?? {};
        isValid &&
          newHoveredTriangles &&
          setHoveredTriangles(newHoveredTriangles);
      }
    },
    [calculateHoveredAndValidPositions, gridPosition, triangles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      const x = event.clientX - (gridPosition?.left || 0);
      const y = event.clientY - (gridPosition?.top || 0) - offSetY;
      const { col, row } = calculateRowCol(x, y, triangleSizeGrid, gridPadding);

      const targetTriangle = triangles.find(
        (t) => t.row === row && t.col === col
      );
      if (targetTriangle) {
        const { validPositions, isValid } =
          calculateHoveredAndValidPositions(event, targetTriangle, true) ?? {};
        if (isValid && draggedShape.index !== null) {
          draggedShape?.shape && addToScore(draggedShape.shape.length);
          setShape(draggedShape.index, []);
          setTriangles((prevTriangles) =>
            prevTriangles.map((triangle) =>
              validPositions?.some(
                (pos) => pos.row === triangle.row && pos.col === triangle.col
              )
                ? { ...triangle, isActive: true }
                : triangle
            )
          );
        }
        setDraggedShape({ shape: null, index: null });
        setHoveredTriangles(new Set());
      }
    },
    [
      gridPosition,
      triangles,
      calculateHoveredAndValidPositions,
      draggedShape.index,
      draggedShape.shape,
      addToScore,
      setShape,
      setTriangles,
    ]
  );

  const handleDragLeave = useCallback(() => {
    setHoveredTriangles(new Set());
  }, []);

  const reset = useCallback(() => {
    setShowModal(false);
    resetGame();
  }, [resetGame]);

  return (
    <Container
      onDrop={(event) => handleDrop(event)}
      onDragOver={(event) => handleDragOver(event)}
    >
      <Modal open={showModal} setOpen={setShowModal}>
        <ModalContent>
          <h1>Game Over</h1>
          <Button onClick={() => reset()}>Restart</Button>
        </ModalContent>
      </Modal>
      <ModalContent>
        <h3>
          Score: {score} / Best: {highScore}
        </h3>
      </ModalContent>
      <GridContainer ref={gridRef}>
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
              onDragLeave={handleDragLeave}
            />
          );
        })}
      </GridContainer>
      <OptionsContainer>
        {shapes.map((shape, index) => (
          <Option key={index}>
            <ShapeRenderer
              shape={shape}
              onDragStart={(event) => handleDragStart(index, event, shape)}
            />
          </Option>
        ))}
      </OptionsContainer>
    </Container>
  );
};

export default HexGridRender;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #222;
  color: #fff;
  border: none;
  cursor: pointer;
`;
