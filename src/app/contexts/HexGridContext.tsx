"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { TriangleState } from "../utils/types";
import {
  colsPerRowGrid,
  rowsOnGrid,
  triangleSizeGrid,
} from "../utils/constants";

interface HexGridContextProps {
  triangles: TriangleState[];
  setTriangles: React.Dispatch<React.SetStateAction<TriangleState[]>>;
  hoveredTriangle: TriangleState | null;
  colsPerRow: number[];
  size: number;
  setHoveredTriangle: React.Dispatch<
    React.SetStateAction<TriangleState | null>
  >;
  padding: number[];
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

      // Assign neighbors after triangles are initialized
      triangleStates.forEach((triangle) => {
        const neighbors = getNeighbors(triangle, triangleStates);
        triangle.neighborhoodX = neighbors.X;
        triangle.neighborhoodY = neighbors.Y;
        triangle.neighborhoodZ = neighbors.Z;
      });

      setTriangles(triangleStates);
    };

    initializeTriangles();
  }, []);

  const getNeighbors = (
    triangle: TriangleState,
    triangles: TriangleState[]
  ) => {
    const { row, col } = triangle;

    const isUp = (row + col) % 2 === 0;

    const neighbors = {
      X: null as TriangleState | null,
      Y: null as TriangleState | null,
      Z: null as TriangleState | null,
    };

    const neighborOffsets = isUp
      ? [
          [0, -1],
          [0, 1],
          [1, 0],
        ]
      : [
          [0, -1],
          [0, 1],
          [-1, 0],
        ];

    neighborOffsets.forEach(([rowOffset, colOffset], index) => {
      const neighborRow = row + rowOffset;
      const neighborCol = col + colOffset;

      if (neighborRow >= 0 && neighborRow < rowsOnGrid) {
        const neighborCols = colsPerRowGrid[neighborRow];
        if (neighborCol >= 0 && neighborCol < neighborCols) {
          const neighborIndex = triangles.findIndex(
            (triangle) =>
              triangle.row === neighborRow && triangle.col === neighborCol
          );
          neighbors[Object.keys(neighbors)[index] as keyof typeof neighbors] =
            triangles[neighborIndex];
        }
      }
    });

    return neighbors;
  };

  return (
    <HexGridContext.Provider
      value={{
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
