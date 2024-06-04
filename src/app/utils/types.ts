import { colors } from "./constants";
export interface TriangleState {
  row: number;
  col: number;
  color: Colors | null;
  neighborhoodX: TriangleState | null;
  neighborhoodY: TriangleState | null;
  neighborhoodZ: TriangleState | null;
}

type Colors = (typeof colors)[number];

export type GameState = {
  triangles: number[];
  shapes: [number, number][][];
  score: number;
};

export type Game = {
  resetGame: () => void;
  getState: () => GameState;
  handleSetShapeOnTriangle: (
    col: number,
    row: number,
    shapeIndex: number
  ) => void;
  isGameOver: () => boolean;
  getColRowByIndex: (index: number) => [number?, number?];
};
