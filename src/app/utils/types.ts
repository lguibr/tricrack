export interface TriangleState {
  row: number;
  col: number;
  isActive: boolean;
  neighborhoodX: TriangleState | null;
  neighborhoodY: TriangleState | null;
  neighborhoodZ: TriangleState | null;
}

export interface IntermediateTriangleState {
  isUp: boolean;
  isActive: boolean;
  neighborhoodX: IntermediateTriangleState | null;
  neighborhoodY: IntermediateTriangleState | null;
  neighborhoodZ: IntermediateTriangleState | null;
}
