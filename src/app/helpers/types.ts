import { colors } from "./constants";
import * as tfType from "@tensorflow/tfjs";

export interface TriangleState {
  row: number;
  col: number;
  color: Colors | null;
  neighborhoodX: TriangleState | null;
  neighborhoodY: TriangleState | null;
  neighborhoodZ: TriangleState | null;
}

type Colors = (typeof colors)[number];

export type FixedLengthArray<T, L extends number> = L extends L
  ? number extends L
    ? T[]
    : _FixedLengthArray<T, L, []>
  : never;

type _FixedLengthArray<
  T,
  L extends number,
  R extends unknown[]
> = R["length"] extends L ? R : _FixedLengthArray<T, L, [T, ...R]>;

export type Memory = {
  state: [tfType.Tensor, tfType.Tensor];
  action: tfType.Tensor;
  reward: number;
  nextState: [tfType.Tensor, tfType.Tensor];
  done: boolean;
};
