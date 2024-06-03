"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHexGrid } from "../contexts/HexGridContext";
import {
  calculatePosition,
  calculateRowCol,
  getRandomColor,
  isTriangleUp,
} from "../utils/calculations";
import {
  colsPerRowGrid,
  triangleSizeGrid,
  gridSize,
  colsPerRowShape,
  gridPadding,
  colors,
} from "../utils/constants";
import { TriangleState } from "../utils/types";
import styled from "styled-components";
import { Triangle } from "./Triangle";
import ShapeRenderer from "./ShapeRenderer";
import Modal from "./Modal";
import Image from "next/image";

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

  const motionOffset = triangleSizeGrid / 4;

  const offsets = useMemo(
    () => [
      [0, 0],
      [0, -motionOffset],
      [0, motionOffset],
      // [-motionOffset, 0],
      // [motionOffset, 0],
      // [-motionOffset, -motionOffset],
      // [-motionOffset, motionOffset],
      // [motionOffset, -motionOffset],
      // [motionOffset, motionOffset],
    ],
    [motionOffset]
  );
  const [showModal, setShowModal] = useState(false);

  const [hoveredTriangles, setHoveredTriangles] = useState<Set<string>>(
    new Set()
  );

  // const handleTriangleClick = useCallback(
  //   (triangle: TriangleState) => {
  //     const color = getRandomColor();
  //     setTriangles((prevTriangles) =>
  //       prevTriangles.map((t) =>
  //         t.row === triangle.row && t.col === triangle.col
  //           ? { ...t, color: t.color ? null : color }
  //           : t
  //       )
  //     );
  //   },
  //   [setTriangles]
  // );

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
            (t) => t.row === targetRow && t.col === targetCol && t.color != null
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
      offsets.forEach(([ox, oy]) => {
        const x = event.clientX - (gridPosition?.left || 0) + ox;
        const y = event.clientY - (gridPosition?.top || 0) - offSetY + oy;

        const { col, row } = calculateRowCol(
          x,
          y,
          triangleSizeGrid,
          gridPadding
        );

        const targetTriangle = triangles.find(
          (t) => t.row === row && t.col === col
        );

        if (targetTriangle) {
          const { newHoveredTriangles, isValid } =
            calculateHoveredAndValidPositions(event, targetTriangle) ?? {};
          if (isValid && newHoveredTriangles) {
            setHoveredTriangles(newHoveredTriangles);
            return;
          }
        }
      });
    },
    [
      calculateHoveredAndValidPositions,
      gridPosition?.left,
      gridPosition?.top,
      offsets,
      triangles,
    ]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      console.log("drop");
      let placed = false;
      offsets.forEach(([ox, oy]) => {
        if (placed) return;
        const x = event.clientX - (gridPosition?.left || 0) + ox;
        const y = event.clientY - (gridPosition?.top || 0) - offSetY + oy;

        const { col, row } = calculateRowCol(
          x,
          y,
          triangleSizeGrid,
          gridPadding
        );

        const targetTriangle = triangles.find(
          (t) => t.row === row && t.col === col
        );

        if (targetTriangle) {
          const { validPositions, isValid } =
            calculateHoveredAndValidPositions(event, targetTriangle, true) ??
            {};
          if (
            isValid &&
            draggedShape.index !== null &&
            draggedShape.shape != null &&
            draggedShape.shape.length > 0
          ) {
            const color = draggedShape.shape[0].color;
            placed = true;
            addToScore(draggedShape.shape.length);
            setTriangles((prevTriangles) =>
              prevTriangles.map((triangle) =>
                validPositions?.some(
                  (pos) => pos.row === triangle.row && pos.col === triangle.col
                )
                  ? {
                      ...triangle,
                      color,
                    }
                  : triangle
              )
            );
            setShape(draggedShape.index, []);
          }
        }
        setDraggedShape({ shape: null, index: null });
        setHoveredTriangles(new Set());
      });
    },
    [
      offsets,
      gridPosition?.left,
      gridPosition?.top,
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
      onMouseUp={() => {
        setDraggedShape({ shape: null, index: null });
        setHoveredTriangles(new Set());
      }}
      onDragLeave={handleDragLeave}
    >
      <Modal open={showModal} setOpen={setShowModal}>
        <ModalContent>
          <Image
            src="/favicon.png"
            alt="Logo Tricrack"
            width={150}
            height={150}
          />
          <h1>Game Over</h1>
          <Button onClick={() => reset()}>Restart</Button>
        </ModalContent>
      </Modal>
      <Content>
        <Image src="/favicon.png" alt="Logo Tricrack" width={75} height={75} />

        <Score>
          <h2>▶️</h2>
          <CurrentScore>{score}</CurrentScore>
          <h2>⭐</h2>
          <BestScore>{highScore}</BestScore>
        </Score>
      </Content>
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
              $color={triangle.color || null}
              $zIndex={zIndex}
              $rowIndex={triangle.row}
              // onClick={() => handleTriangleClick(triangle)}
              $isHovering={isHovered ? draggedShape.shape?.[0].color : null}
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

const Container = styled.div`
  display: grid;
  position: relative;
  width: 100vw;
  max-width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  justify-items: center;
`;

const GridContainer = styled.div`
  position: relative;
  height: ${gridSize}px;
  width: ${gridSize}px;
`;

const OptionsContainer = styled.div`
  position: relative;
  width: 100%;
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

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled(Content)`
  border-radius: 8px;
  border: 1px solid #222;
  gap: 1rem;
  padding: 1rem;
  padding-top: 0rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #222;
  color: #fff;
  border: none;
  cursor: pointer;
`;

const Score = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 0.5rem;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const CurrentScore = styled.h1`
  color: ${colors[colors.length - 1]};
`;
const BestScore = styled.h1`
  color: ${colors[0]};
`;
