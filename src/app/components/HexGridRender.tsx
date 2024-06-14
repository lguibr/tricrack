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
import {
  calculatePosition,
  calculateRowColFromPosition,
  isTriangleUp,
} from "../helpers/triangles";
import {
  colsPerRowGrid,
  triangleSizeGrid,
  gridSize,
  gridPadding,
  colors,
  trianglesShapeSize,
} from "../helpers/constants";
import { TriangleState } from "../helpers/types";
import styled from "styled-components";
import { Triangle } from "./Triangle";
import ShapeRenderer from "./ShapeRenderer";
import Modal from "./Modal";
import Image from "next/image";
import Game from "../game";

const offSetY = 0;

const HexGridRender: React.FC<{ game: Game; frame: number }> = ({
  game,
}) => {
  const [draggedShape, setDraggedShape] = useState<{
    shape: TriangleState[] | null;
    index: number | null;
  }>({ shape: null, index: null });
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
  const [gameOver, setGameOver] = useState(false);
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

  useEffect(() => {
    const isGameOver = game.isGameOver();
    if (isGameOver) {
      setGameOver(true);
    }
  }, [game]);

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

        const { col, row } = calculateRowColFromPosition(
          x,
          y,
          triangleSizeGrid,
          gridPadding
        );

        const targetTriangle = game.triangles.find(
          (t) => t.row === row && t.col === col
        );

        if (targetTriangle) {
          const { newHoveredTriangles, isValid } =
            game.calculateHoveredAndValidPositions(
              event,
              targetTriangle,
              false,
              draggedShape.shape
            ) ?? {};

          if (isValid && newHoveredTriangles) {
            setHoveredTriangles(newHoveredTriangles);
            return;
          }
        }
      });
    },
    [draggedShape.shape, game, gridPosition?.left, gridPosition?.top, offsets]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      let placed = false;
      offsets.forEach(([ox, oy]) => {
        if (placed) return;
        const x = event.clientX - (gridPosition?.left || 0) + ox;
        const y = event.clientY - (gridPosition?.top || 0) - offSetY + oy;

        const { col, row } = calculateRowColFromPosition(
          x,
          y,
          triangleSizeGrid,
          gridPadding
        );

        const targetTriangle = game.triangles.find(
          (t) => t.row === row && t.col === col
        );

        if (targetTriangle) {
          const { validPositions, isValid } =
            game.calculateHoveredAndValidPositions(
              event,
              targetTriangle,
              true,
              draggedShape.shape
            ) ?? {};
          if (
            isValid &&
            draggedShape.index !== null &&
            draggedShape.shape != null &&
            draggedShape.shape.length > 0
          ) {
            const color = draggedShape.shape[0].color;
            placed = true;
            game.addToScore(draggedShape.shape.length);
            game.setTriangles((prevTriangles) =>
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
            game.setShape(draggedShape.index, []);
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
      game,
      draggedShape.index,
      draggedShape.shape,
    ]
  );

  const handleDragLeave = useCallback(() => {
    setHoveredTriangles(new Set());
  }, []);

  const reset = useCallback(() => {
    setGameOver(false);
    game.resetGame();
  }, [game]);

  const undoLastMove = useCallback(() => {
    setGameOver(false);
    game.undo();
  }, [game]);

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
      <Modal open={gameOver} setOpen={setGameOver}>
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
                undoLastMove();
              }) as unknown as MouseEventHandler
            }
            onTouchStart={handleTouchStart}
          />
        </Header>

        <Score>
          <h2>▶️</h2>
          <CurrentScore>{game.score}</CurrentScore>
          <h2>⭐</h2>
          <BestScore>{game.currentHighScore}</BestScore>
        </Score>
      </Content>
      <GridContainer ref={gridRef}>
        {game.triangles.map((triangle, index) => {
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
            <>
              <Triangle
                key={`grid-triangle-${triangle.row}-${
                  triangle.col
                }-grid-${Date.now()}`}
                $x={x}
                $y={y}
                $size={triangleSizeGrid}
                $triangleHeight={triangleHeight}
                $isUp={isUp}
                $color={triangle.color || null}
                $zIndex={zIndex}
                $rowIndex={triangle.row}
                $isHovering={isHovered ? draggedShape.shape?.[0].color : null}
              ></Triangle>
              <div
                style={{
                  zIndex: 9999999999,
                  color: "white",
                  position: "absolute",
                  top: `${
                    y + ((trianglesShapeSize / 2) * (triangle.row + 1)) / 4
                  }px`,
                  left: `${x + trianglesShapeSize / 4}px`,
                }}
              >
                {index}
              </div>
            </>
          );
        })}
      </GridContainer>
      <OptionsContainer>
        {game.shapes?.map((shape, index) => (
          <Option
            key={index}
            onClick={() => {
              console.log(
                JSON.stringify({
                  shape: shape.map(({ col, color, row }) => ({
                    col,
                    row,
                    color,
                  })),
                })
              );
            }}
          >
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
