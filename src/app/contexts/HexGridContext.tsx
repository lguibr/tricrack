"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
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
  setTriangles: (
    action: (prevTriangles: TriangleState[]) => TriangleState[]
  ) => void;
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
  undo: () => void;
}

const HexGridContext = createContext<HexGridContextProps | undefined>(
  undefined
);

export const HexGridProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [historyTriangles, setHistoryTriangles] = useState<TriangleState[][]>(
    []
  );
  const [historyShapes, setHistoryShapes] = useState<TriangleState[][][]>([]);
  const [historyScores, setHistoryScores] = useState<number[]>([0]);
  const [hoveredTriangle, setHoveredTriangle] = useState<TriangleState | null>(
    null
  );

  const initialHighScore = parseInt(
    typeof window !== "undefined"
      ? localStorage.getItem("highScore") || "0"
      : "0",
    10
  );
  const [highScore, setHighScore] = useState<number>(initialHighScore);

  const addToScore = (points: number) => {
    setHistoryScores((prevScores) => [
      ...prevScores,
      prevScores[prevScores.length - 1] + points,
    ]);
  };

  const resetGame = () => {
    setHistoryScores([0]);

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

    setHistoryTriangles([initialTriangles]);
    setHistoryShapes([Array.from({ length: 3 }, () => buildNewShape())]);
    setHoveredTriangle(null);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      const flattedShapes = historyShapes[historyShapes.length - 1]?.flat();
      const emptyShapes = !flattedShapes || flattedShapes?.length === 0;
      if (emptyShapes) {
        const newShapes = Array.from({ length: 3 }, () => buildNewShape());

        setHistoryShapes((prev) => {
          const newPrev = prev.filter(
            (snapShopShapes) => snapShopShapes.flat(5).length > 0
          );

          return [...newPrev, newShapes];
        });
      }
    }, 100);
    return () => clearTimeout(debounce);
  }, [historyShapes]);

  const setShape = (index: number, shape: TriangleState[]) => {
    setHistoryShapes((prevShapes) => {
      const newShapes = [...prevShapes[prevShapes.length - 1]];
      newShapes[index] = shape;
      return [...prevShapes, newShapes];
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

      setHistoryTriangles([triangleStates]);
    };

    initializeTriangles();
  }, []);

  const getColorString = (triangles: TriangleState[]) =>
    triangles ? JSON.stringify(triangles?.map((t) => t.color)) : [];

  const triangleActivations = getColorString(
    historyTriangles[historyTriangles.length - 1]
  );

  useEffect(() => {
    const lineTriangles = checkLineCollapse(
      historyTriangles[historyTriangles.length - 1]
    );
    if (lineTriangles.length > 0) {
      setHistoryScores((prevScores) => [
        ...prevScores,
        prevScores[prevScores.length - 1] + lineTriangles.length * 2,
      ]);
      setHistoryTriangles((prevTriangles) => {
        const newTriangles = prevTriangles[prevTriangles.length - 1].map((t) =>
          lineTriangles.find(
            (lineTriangle) =>
              lineTriangle?.row === t?.row && lineTriangle?.col === t?.col
          )
            ? { ...t, color: null }
            : t
        );
        return [...prevTriangles, newTriangles];
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triangleActivations]);

  useEffect(() => {
    const localStorageScore = parseInt(
      localStorage.getItem("highScore") || "0",
      10
    );
    const currentScore = historyScores[historyScores.length - 1];
    if (currentScore > localStorageScore) {
      localStorage.setItem("highScore", currentScore.toString());
      setHighScore(currentScore);
    }
  }, [historyScores]);

  const setTriangles = (
    action: (prevTriangles: TriangleState[]) => TriangleState[]
  ) => {
    setHistoryTriangles((prev) => {
      const lastTriangles = prev[prev.length - 1];
      const newTriangles = action(lastTriangles);
      if (getColorString(lastTriangles) !== getColorString(newTriangles)) {
        return [...prev, newTriangles];
      }
      return prev;
    });
  };

  const undo = useCallback(() => {
    if (historyTriangles.length > 1 && historyShapes.length > 1) {
      let scoreOffset = 1;

      setHistoryTriangles((prev) => {
        const previousLastTriangles = prev[prev.length - 2];
        const collapsedTriangles = checkLineCollapse(previousLastTriangles);

        if (collapsedTriangles.length > 0) {
          scoreOffset = 2;
          return prev.slice(0, -2);
        }
        return prev.slice(0, -1);
      });

      setHistoryShapes((prev) => {
        const newPrev = prev.filter(
          (snapShopShapes) => snapShopShapes.flat(5).length > 0
        );

        return newPrev.slice(0, -1);
      });

      setHistoryScores((prev) => prev.slice(0, -scoreOffset));
    }
  }, [historyShapes, historyTriangles]);

  return (
    <HexGridContext.Provider
      value={{
        shapes: historyShapes[historyShapes.length - 1],
        setShape,
        score: historyScores[historyScores.length - 1],
        highScore,
        triangles: historyTriangles[historyTriangles.length - 1],
        setTriangles,
        hoveredTriangle,
        setHoveredTriangle,
        colsPerRow: colsPerRowGrid,
        size: triangleSizeGrid,
        resetGame,
        addToScore,
        undo,
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
