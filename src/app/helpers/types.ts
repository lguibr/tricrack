import * as tf from "@tensorflow/tfjs";

export interface TriangleState {
  row: number;
  col: number;
  color: Colors | null;
  neighborhoodX: TriangleState | null;
  neighborhoodY: TriangleState | null;
  neighborhoodZ: TriangleState | null;
}

type Colors = string; // Update this based on your actual color type

export type TensorGameState = tf.Tensor;

export type Memory = {
  state: TensorGameState;
  action: number;
  reward: number;
  nextState: TensorGameState;
  done: boolean;
};
