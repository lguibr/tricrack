"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { TriangleState } from "../utils/types";
import {
  colsPerRowGrid,
  rowsOnGrid,
  triangleSizeGrid,
} from "../utils/constants";
import {
  buildNewShape,
  checkLineCollapse,
  getNeighbors,
} from "../utils/calculations";

interface HexGridContextProps {
  triangles: TriangleState[];
  setTriangles: React.Dispatch<React.SetStateAction<TriangleState[]>>;
  hoveredTriangle: TriangleState | null;
  colsPerRow: number[];
  size: number;
  score: number;
  highScore: number;
  setHoveredTriangle: React.Dispatch<
    React.SetStateAction<TriangleState | null>
  >;
  shapes: TriangleState[][];
  setShape: (index: number, shape: TriangleState[]) => void;
  resetGame: () => void;
  addToScore: (points: number) => void;
}

const HexGridContext = createContext<HexGridContextProps | undefined>(
  undefined
);

export const HexGridProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [triangles, setTriangles] = useState<TriangleState[]>([]);
  const [hoveredTriangle, setHoveredTriangle] = useState<TriangleState | null>(
    null
  );

  const initialHighScore = parseInt(
    typeof window !== "undefined"
      ? localStorage.getItem("highScore") || "0"
      : "0",
    10
  );
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(initialHighScore);
  const [shapes, setShapes] = useState<TriangleState[][]>(
    Array.from({ length: 3 }, () => buildNewShape())
  );
  const addToScore = (points: number) => setScore((prev) => prev + points);
  const resetGame = () => {
    // Reset score
    setScore(0);

    // Reset triangles to initial state
    const initialTriangles: TriangleState[] = [];
    for (let row = 0; row < rowsOnGrid; row++) {
      const cols = colsPerRowGrid[row];
      for (let col = 0; col < cols; col++) {
        const triangle = {
          row,
          col,
          color: null,
          neighborhoodX: null,
          neighborhoodY: null,
          neighborhoodZ: null,
        };
        initialTriangles.push(triangle);
      }
    }

    // Assign neighbors to the reset triangles
    initialTriangles.forEach((triangle) => {
      const neighbors = getNeighbors(
        triangle,
        initialTriangles,
        colsPerRowGrid
      );
      triangle.neighborhoodX = neighbors.X;
      triangle.neighborhoodY = neighbors.Y;
      triangle.neighborhoodZ = neighbors.Z;
    });

    setTriangles(initialTriangles);

    // Reset shapes
    setShapes(Array.from({ length: 3 }, () => buildNewShape()));

    // Optionally, reset hoveredTriangle if applicable
    setHoveredTriangle(null);
  };

  useEffect(() => {
    const flattedShapes = shapes.flat();
    const emptyShapes = flattedShapes.length === 0;
    if (emptyShapes) {
      setShapes(Array.from({ length: 3 }, () => buildNewShape()));
    }
  }, [shapes]);

  const setShape = (index: number, shape: TriangleState[]) => {
    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];
      newShapes[index] = shape;
      return newShapes;
    });
  };

  useEffect(() => {
    const initializeTriangles = () => {
      const triangleStates: TriangleState[] = [];

      for (let row = 0; row < rowsOnGrid; row++) {
        const cols = colsPerRowGrid[row];
        for (let col = 0; col < cols; col++) {
          const triangle: TriangleState = {
            row,
            col,
            color: null,
            neighborhoodX: null,
            neighborhoodY: null,
            neighborhoodZ: null,
          };
          triangleStates.push(triangle);
        }
      }

      triangleStates.forEach((triangle) => {
        const neighbors = getNeighbors(
          triangle,
          triangleStates,
          colsPerRowGrid
        );

        triangle.neighborhoodX = neighbors.X;
        triangle.neighborhoodY = neighbors.Y;
        triangle.neighborhoodZ = neighbors.Z;
      });

      setTriangles(triangleStates);
    };

    initializeTriangles();
  }, []);

  const triangleActivations = JSON.stringify(
    triangles.map(({ color }) => color != null)
  );

  useEffect(() => {
    const lineTriangles = checkLineCollapse(triangles);

    setScore((prev) => prev + lineTriangles.length * 2);
    setTriangles((prevTriangles) =>
      prevTriangles.map((t) =>
        lineTriangles.find(
          (lineTriangle) =>
            lineTriangle?.row === t?.row && lineTriangle?.col === t?.col
        )
          ? { ...t, color: null }
          : t
      )
    );
  }, [triangleActivations]);

  useEffect(() => {
    const localStorageScore = parseInt(
      localStorage.getItem("highScore") || "0",
      10
    );
    if (score > localStorageScore) {
      localStorage.setItem("highScore", score.toString());
      setHighScore(score);
    }
  }, [score]);

  return (
    <HexGridContext.Provider
      value={{
        shapes,
        setShape,
        score,
        highScore,
        triangles,
        setTriangles,
        hoveredTriangle,
        setHoveredTriangle,
        colsPerRow: colsPerRowGrid,
        size: triangleSizeGrid,
        resetGame,
        addToScore,
      }}
    >
      {children}
    </HexGridContext.Provider>
  );
};

export const useHexGrid = () => {
  const context = useContext(HexGridContext);
  if (!context) {
    throw new Error("useHexGrid must be used within a HexGridProvider");
  }
  return context;
};
