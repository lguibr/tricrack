// src/app/components/HexGridRender.tsx

"use client";
import React, {
  MouseEventHandler,
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
  ensureMinimumLength,
  getCoordinates,
  getTriangleMinimalData,
  isTriangleUp,
  removeDuplicatedTrianglesByColAndRow,
} from "../utils/calculations";
import {
  colsPerRowGrid,
  triangleSizeGrid,
  gridSize,
  colsPerRowShape,
  gridPadding,
  colors,
} from "../utils/constants";
import { GameState, TriangleState } from "../utils/types";
import styled from "styled-components";
import { Triangle } from "./Triangle";
import ShapeRenderer from "./ShapeRenderer";
import Modal from "./Modal";
import Image from "next/image";
import GameTrainer from "./GameTrainer";

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
    undo,
  } = useHexGrid();
  const [draggedShape, setDraggedShape] = useState<{
    shape: TriangleState[] | null;
    index: number | null;
  }>({ shape: null, index: null });
  const hexGridRows = colsPerRowGrid.length;
  const gridRef = useRef<HTMLDivElement>(null);
  const gridPosition = gridRef.current?.getBoundingClientRect();

  const motionOffset = triangleSizeGrid / 5;

  const offsets = useMemo(
    () => [
      [0, 0],
      [0, -motionOffset],
      [0, motionOffset],
      [-motionOffset, 0],
      [motionOffset, 0],
      [-motionOffset, -motionOffset],
      [-motionOffset, motionOffset],
      [motionOffset, -motionOffset],
      [motionOffset, motionOffset],
      [2 * motionOffset, 0],
      [-2 * motionOffset, 0],
      [0, 2 * motionOffset],
      [0, -2 * motionOffset],
      [motionOffset, 2 * motionOffset],
      [motionOffset, -2 * motionOffset],
      [-motionOffset, 2 * motionOffset],
      [-motionOffset, -2 * motionOffset],
      [2 * motionOffset, motionOffset],
      [2 * motionOffset, -motionOffset],
      [-2 * motionOffset, motionOffset],
      [-2 * motionOffset, -motionOffset],
      [2 * motionOffset, 2 * motionOffset],
      [2 * motionOffset, -2 * motionOffset],
      [-2 * -motionOffset, 2 * motionOffset],
      [-2 * -motionOffset, -2 * motionOffset],
    ],
    [motionOffset]
  );
  const [showModal, setShowModal] = useState(false);
  const [hoveredTriangles, setHoveredTriangles] = useState<Set<string>>(
    new Set()
  );

  const [touchHandled, setTouchHandled] = useState(false);

  const handleTouchStart = () => {
    setTouchHandled(true);
  };

  const handleClick =
    (callback: (e: MouseEvent) => void) => (e: MouseEvent) => {
      if (touchHandled) {
        setTouchHandled(false);
        return;
      }
      callback(e);
    };

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

  const getValidPositionsByShapes = useCallback(() => {
    const validPositions = shapes?.map((shape) => {
      const positions: { row: number; col: number }[] = [];
      triangles.forEach((triangle) => {
        const { validPositions } =
          calculateHoveredAndValidPositions(null, triangle, true, shape) ?? {};
        if (validPositions) {
          positions.push(...validPositions);
        }
      });
      return removeDuplicatedTrianglesByColAndRow(positions);
    });
    return validPositions;
  }, [calculateHoveredAndValidPositions, shapes, triangles]);

  const gameState = {
    validPositionByShape: getValidPositionsByShapes(),
    shapes,
    triangles,
    score,
  };

  const getColRowByIndex = (index: number): [number?, number?] => {
    const triangle = triangles.find((triangle, i) => i === index);
    return [triangle?.col, triangle?.row];
  };

  const getFlattedGameState = (state: typeof gameState): GameState => {
    const flattedShapes: [number, number][][] = state.shapes
      ? state.shapes?.map((shape) =>
          shape.map((triangle) => getCoordinates(triangle))
        )
      : [];

    return {
      triangles: state.triangles.map(getTriangleMinimalData),
      shapes: flattedShapes,
      score,
    };
  };

  useEffect(() => {
    if (
      shapes &&
      shapes.flat().length !== 0 &&
      shapes
        .filter((shape) => shape.length > 0)
        .every((shape) => !canPlaceAnyShape(shape))
    ) {
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

  const handleSetShapeOnTriangle = useCallback(
    (col: number, row: number, shapeIndex: number) => {
      const haveShapes = shapes && shapes.flat(5).length > 0;
      if (!haveShapes) return;
      const shape = shapes[shapeIndex];

      const targetTriangle = triangles.find(
        (t) => t.row === row && t.col === col
      );

      if (targetTriangle) {
        const { validPositions, isValid } =
          calculateHoveredAndValidPositions(
            null,
            targetTriangle,
            true,
            shape
          ) ?? {};

        if (isValid && shape != null && shape.length > 0) {
          const color = shape[0].color;
          addToScore(shape.length);
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
          setShape(shapeIndex, []);
        }
      }
    },
    [
      shapes,
      triangles,
      calculateHoveredAndValidPositions,
      addToScore,
      setTriangles,
      setShape,
    ]
  );

  const handleDragLeave = useCallback(() => {
    setHoveredTriangles(new Set());
  }, []);

  const reset = useCallback(() => {
    setShowModal(false);
    resetGame();
  }, [resetGame]);

  const undoLastMove = useCallback(() => {
    setShowModal(false);
    undo();
  }, [undo]);

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
          <ModalButtons>
            <Image
              src="/restart.png"
              alt="restart game"
              width={50}
              height={50}
              onClick={
                handleClick((e) => {
                  e.preventDefault();
                  reset();
                }) as unknown as MouseEventHandler
              }
              onTouchStart={handleTouchStart}
              style={{ cursor: "pointer" }}
            />

            <Image
              src="/undo.png"
              alt="undo movement"
              width={50}
              height={50}
              style={{ cursor: "pointer" }}
              onClick={
                handleClick((e) => {
                  e.preventDefault();
                  undoLastMove();
                }) as unknown as MouseEventHandler
              }
              onTouchStart={handleTouchStart}
            />
          </ModalButtons>
        </ModalContent>
      </Modal>
      <Content>
        <Header>
          <Image
            src="/restart.png"
            alt="restart game"
            width={50}
            height={50}
            onClick={
              handleClick((e) => {
                e.preventDefault();
                reset();
              }) as unknown as MouseEventHandler
            }
            onTouchStart={handleTouchStart}
            style={{ cursor: "pointer" }}
          />
          <Image
            src="/favicon.png"
            alt="Logo Tricrack"
            width={100}
            height={100}
          />
          <Image
            src="/undo.png"
            alt="undo movement"
            width={50}
            height={50}
            style={{ cursor: "pointer" }}
            onClick={
              handleClick((e) => {
                e.preventDefault();
                undo();
              }) as unknown as MouseEventHandler
            }
            onTouchStart={handleTouchStart}
          />
        </Header>

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
        {shapes?.map((shape, index) => (
          <Option key={index}>
            <ShapeRenderer
              shape={shape}
              onDragStart={(event) => handleDragStart(index, event, shape)}
            />
          </Option>
        ))}
      </OptionsContainer>
      <button
        onClick={() => {
          handleSetShapeOnTriangle(3, 3, 0);
        }}
      >
        add shape
      </button>
      <GameTrainer
        resetGame={resetGame}
        getState={() => getFlattedGameState(gameState)}
        handleSetShapeOnTriangle={handleSetShapeOnTriangle}
        getColRowByIndex={getColRowByIndex}
        isGameOver={() => showModal}
      />
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

const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
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
  width: 100%;
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
  width: 100%;
`;

const CurrentScore = styled.h1`
  color: ${colors[colors.length - 1]};
`;
const BestScore = styled.h1`
  color: ${colors[0]};
`;

const ModalButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;
