"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { TriangleState } from "../utils/types";
import {
  colsPerRowGrid,
  rowsOnGrid,
  triangleSizeGrid,
} from "../utils/constants";
import { checkLineCollapse, getNeighbors } from "../utils/calculations";

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

  useEffect(() => {
    const initializeTriangles = () => {
      const triangleStates: TriangleState[] = [];

      for (let row = 0; row < rowsOnGrid; row++) {
        const cols = colsPerRowGrid[row];
        for (let col = 0; col < cols; col++) {
          const triangle: TriangleState = {
            row,
            col,
            isActive: false,
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
    triangles.map(({ isActive }) => isActive)
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
          ? { ...t, isActive: false }
          : t
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        score,
        highScore,
        triangles,
        setTriangles,
        hoveredTriangle,
        setHoveredTriangle,
        colsPerRow: colsPerRowGrid,
        size: triangleSizeGrid,
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
