// File: learn/DQNAgent.ts

import * as tf from "@tensorflow/tfjs";
import {
  explorationDecay,
  learningRate,
  updateTargetNetworkEveryNSteps,
  totalShapes,
  totalPositions,
  actionSize,
  batchSize,
} from "./configs";
import { Memory, TensorGameState } from "../helpers/types";

export class DQNAgent {
  public actionTimes: number[] = [];
  public replayTimes: number[] = [];
  private actionSize: number;
  public memory: Memory[];
  private replayBufferSize: number;

  private discountFactor: number;
  public explorationRate: number;
  private explorationMin: number;
  private explorationDecay: number;
  private learningRate: number;
  private model: tf.LayersModel;
  private targetModel: tf.LayersModel;
  private updateTargetNetworkFrequency: number;
  private trainStep: number;
  private totalLoss: number;
  private batchCount: number;
  private modelName: string;
  public averageLoss: number;

  constructor(actionSize: number) {
    this.modelName = "indexeddb://DQNAgentModel";
    this.actionSize = actionSize;
    this.memory = [];
    this.discountFactor = 0.99;
    this.explorationRate = 1.0;
    this.explorationMin = 0.02;
    this.replayBufferSize = 200_000;
    this.explorationDecay = explorationDecay;
    this.learningRate = learningRate;
    this.model = this.buildModel();
    this.targetModel = this.buildModel();
    this.updateTargetNetworkFrequency = updateTargetNetworkEveryNSteps;
    this.trainStep = 0;
    this.totalLoss = 0;
    this.batchCount = 0;
    this.averageLoss = 0;

    this.loadModelWeights().catch((err) => {
      console.log("No saved model found, starting with a new model.");
    });
  }

  buildModel() {
    const gridInputs = tf.input({ shape: [8, 15, 3], name: "grid_input" });

    // Convolutional layers for grid input
    let x = tf.layers
      .conv2d({ filters: 32, kernelSize: 3, activation: "relu" })
      .apply(gridInputs) as tf.SymbolicTensor;
    x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers
      .conv2d({ filters: 64, kernelSize: 3, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;
    x = tf.layers.flatten().apply(x) as tf.SymbolicTensor;

    // Fully connected layers
    x = tf.layers
      .dense({ units: 512, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers
      .dense({ units: 256, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;

    // Output layer
    const output = tf.layers
      .dense({ units: this.actionSize, activation: "linear", name: "output" })
      .apply(x) as tf.SymbolicTensor;

    const model = tf.model({ inputs: gridInputs, outputs: output });
    model.compile({
      loss: "meanSquaredError",
      optimizer: tf.train.adam(this.learningRate),
    });

    return model;
  }

  remember(
    state: TensorGameState,
    action: number,
    reward: number,
    nextState: TensorGameState,
    done: boolean
  ) {
    if (this.memory.length >= this.replayBufferSize) this.memory.shift();
    this.memory.push({ state, action, reward, nextState, done });
  }

  act(state: TensorGameState, validActionsMask: tf.Tensor): number {
    const start = Date.now(); // Start timing
    const gridInput = state;

    if (Math.random() <= this.explorationRate) {
      // Exploration: Randomly select a valid action
      const validActionsIndices = validActionsMask
        .dataSync()
        .map((value, index) => (value === 1 ? index : -1))
        .filter((index) => index !== -1);
      const randomIndex =
        validActionsIndices[
          Math.floor(Math.random() * validActionsIndices.length)
        ];
      return randomIndex;
    } else {
      // Exploitation: Predict the best action
      const predictedQValues = this.model.predict(
        gridInput.reshape([1, 8, 15, 3])
      ) as tf.Tensor;
      const maskedQValues = predictedQValues.add(validActionsMask.mul(-1e9));
      const actionIndex = maskedQValues.argMax(1).dataSync()[0];
      return actionIndex;
    }
  }

  async replay() {
    const start = Date.now();
    const minibatchSize = Math.min(batchSize, this.memory.length);
    const minibatch = this.memory.slice(-minibatchSize);
    let batchLoss = 0;

    const states = minibatch.map((m) => m.state.reshape([8, 15, 3]));
    const nextStates = minibatch.map((m) => m.nextState.reshape([8, 15, 3]));
    const actions = minibatch.map((m) => m.action);
    const rewards = minibatch.map((m) => m.reward);
    const dones = minibatch.map((m) => (m.done ? 0 : 1));

    const statesTensor = tf.stack(states);
    const nextStatesTensor = tf.stack(nextStates);

    const targetQs = tf.tidy(() => {
      const targetQValues = this.targetModel.predict(
        nextStatesTensor
      ) as tf.Tensor;
      const maxTargetQValues = targetQValues.max(1).mul(tf.tensor1d(dones));
      return tf
        .tensor1d(rewards)
        .add(maxTargetQValues.mul(this.discountFactor));
    });

    const masks = tf.oneHot(actions, this.actionSize);

    const optimizer = tf.train.adam(this.learningRate);
    const lossFunction = () => {
      const qValues = this.model.predict(statesTensor) as tf.Tensor;
      const qValuesWithMasks = qValues.mul(masks);
      const actionQValues = tf.sum(qValuesWithMasks, 1);
      const loss = tf.losses.meanSquaredError(targetQs, actionQValues);
      return loss;
    };

    const grads = tf.variableGrads(lossFunction);
    optimizer.applyGradients(grads.grads);

    batchLoss = grads.value.dataSync()[0];
    this.totalLoss += batchLoss;
    this.batchCount++;

    tf.dispose([
      statesTensor,
      nextStatesTensor,
      targetQs,
      masks,
      grads.value,
      ...Object.values(grads.grads),
    ]);

    this.trainStep++;
    if (this.trainStep % this.updateTargetNetworkFrequency === 0) {
      this.updateTargetNetwork();
      await this.saveModelWeights();
    }

    if (this.explorationRate > this.explorationMin) {
      this.explorationRate *= this.explorationDecay;
    }

    this.averageLoss = this.totalLoss / this.batchCount;

    const end = Date.now();
    const duration = end - start;
    this.replayTimes.push(duration);
  }

  async saveModelWeights() {
    await this.model.save(this.modelName);
    console.log(`Model saved to ${this.modelName}`);
  }

  async loadModelWeights() {
    try {
      const loadedModel = await tf.loadLayersModel(this.modelName);
      this.model.setWeights(loadedModel.getWeights());
      console.log(`Model weights loaded from ${this.modelName}`);
    } catch (error) {
      console.error("Failed to load model weights:", error);
      // Continue without throwing an error
    }
  }

  updateTargetNetwork() {
    this.targetModel.setWeights(this.model.getWeights());
  }
}
