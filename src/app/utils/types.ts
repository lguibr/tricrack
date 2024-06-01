export interface TriangleState {
  row: number;
  col: number;
  isActive: boolean;
  neighborhoodX: TriangleState | null;
  neighborhoodY: TriangleState | null;
  neighborhoodZ: TriangleState | null;
}
