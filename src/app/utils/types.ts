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
