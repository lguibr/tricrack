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
  stateSequence: tf.Tensor;
  nextStateSequence: tf.Tensor;
  done: boolean;
};

export interface Transition {
  state: tf.Tensor;       // Current state
  action: number;         // Action taken
  reward: number;         // Reward received
  nextState: tf.Tensor;   // Next state after the action
  done: boolean;          // Whether the episode has ended
}