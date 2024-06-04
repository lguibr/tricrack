// src/utils/DQNAgent.ts

import * as tf from "@tensorflow/tfjs";
import { GameState } from "./types";
import { gameStateToTensor } from "./calculations";

type Memory = {
  state: GameState;
  action: any;
  reward: number;
  nextState: GameState;
  done: boolean;
};

export class DQNAgent {
  private stateSize: number;
  private actionSize: number;
  public memory: Memory[];
  private gamma: number;
  private epsilon: number;
  private epsilonMin: number;
  private epsilonDecay: number;
  private learningRate: number;
  private model: tf.Sequential;

  constructor(stateSize: number, actionSize: number) {
    console.log({ stateSize, actionSize });

    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.memory = [];
    this.gamma = 0.95;
    this.epsilon = 1.0;
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.995;
    this.learningRate = 0.001;
    this.model = this.buildModel();
  }

  buildModel() {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [this.stateSize],
        units: 128,
        activation: "relu",
      })
    );
    model.add(tf.layers.dense({ units: 128, activation: "relu" }));
    model.add(
      tf.layers.dense({ units: this.actionSize, activation: "linear" })
    );
    model.compile({
      loss: "meanSquaredError",
      optimizer: tf.train.adam(this.learningRate),
    });
    return model;
  }

  remember(
    state: GameState,
    action: any,
    reward: number,
    nextState: GameState,
    done: boolean
  ) {
    this.memory.push({ state, action, reward, nextState, done });
  }

  act(state: GameState) {
    if (Math.random() <= this.epsilon) {
      const shapeIndex = Math.floor(Math.random() * 3);
      const target = Math.floor(Math.random() * 96);
      return { shapeIndex, target };
    } else {
      const input = gameStateToTensor(state);
      const qValues = this.model.predict(input) as tf.Tensor;
      const actionIndex = Array.from(qValues.argMax(-1).dataSync())[0];
      const shapeIndex = Math.floor(actionIndex / 96);
      const target = actionIndex % 96;
      return { shapeIndex, target };
    }
  }

  replay(batchSize: number) {
    const minibatch = this.memory.slice(-batchSize);
    minibatch.forEach(({ state, action, reward, nextState, done }) => {
      const target =
        reward +
        (done
          ? 0
          : this.gamma *
            Math.max(
              ...Array.from(
                (this.model.predict(gameStateToTensor(nextState)) as tf.Tensor).dataSync()
              )
            ));
      const targetF = this.model.predict(gameStateToTensor(state)) as tf.Tensor;
      const targetData = Array.from(targetF.dataSync());
      targetData[action.shapeIndex * 96 + action.target] = target;

      this.model.fit(gameStateToTensor(state), tf.tensor2d([targetData]), {
        epochs: 1,
        verbose: 0,
      });
    });

    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }
}
