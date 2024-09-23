// File: learn/DQNAgent.ts

import * as tf from "@tensorflow/tfjs";
import {
  explorationDecay,
  learningRate,
  updateTargetNetworkEveryNSteps,
  actionSize,
  batchSize,
  sequenceLength,
} from "./configs";
import { Transition } from "../helpers/types";

export class DQNAgent {
  public actionTimes: number[] = [];
  public replayTimes: number[] = [];
  private actionSize: number;
  public memory: Transition[][];
  private replayBufferSize: number;

  private discountFactor: number;
  public explorationRate: number;
  private explorationMin: number;
  private explorationDecay: number;
  private learningRate: number;
  private model: tf.LayersModel;
  private targetModel: tf.LayersModel;
  private updateTargetNetworkFrequency: number;
  public trainStep: number;
  private totalLoss: number;
  private batchCount: number;
  public averageLoss: number;
  public averageReward: number = 0;
  public maxQValue: number = 0;

  private sequenceLength: number;
  private stateSequence: tf.Tensor[];
  private currentSequence: Transition[];

  constructor(actionSize: number) {
    this.actionSize = actionSize;
    this.memory = [];
    this.replayBufferSize = 200_000;
    this.discountFactor = 0.99;
    this.explorationRate = 1;
    this.explorationMin = 0.05;
    this.explorationDecay = explorationDecay;
    this.learningRate = learningRate;
    this.sequenceLength = sequenceLength;
    this.stateSequence = [];
    this.currentSequence = [];
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

  buildModel(): tf.LayersModel {
    const gridInputs = tf.input({
      shape: [this.sequenceLength, 8, 15, 3],
      name: "grid_input",
    });

    let x = gridInputs;
    // **GlobalAveragePooling2D Layer with TimeDistributed**
    const globalAvgPoolLayer = tf.layers.globalAveragePooling2d(x);
    x = tf.layers
      .timeDistributed({ layer: globalAvgPoolLayer })
      .apply(x) as tf.SymbolicTensor;

    // **LSTM Layer**
    x = tf.layers
      .lstm({ units: 256, returnSequences: false, activation: "tanh" })
      .apply(x) as tf.SymbolicTensor;

    // **Fully Connected Layer with ReLU and Dropout**
    x = tf.layers
      .dense({ units: 2048, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;
    x = tf.layers
      .dropout({ rate: 0.5 })
      .apply(x) as tf.SymbolicTensor;

    x = tf.layers
      .dense({ units: 1024, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;
    x = tf.layers
      .dropout({ rate: 0.5 })
      .apply(x) as tf.SymbolicTensor;
    // **Output Layer**
    const output = tf.layers
      .dense({ units: this.actionSize, activation: "linear", name: "output" })
      .apply(x) as tf.SymbolicTensor;

    const model = tf.model({ inputs: gridInputs, outputs: output });

    const optimizer = tf.train.adam(this.learningRate);
    model.compile({
      loss: "meanSquaredError",
      optimizer: optimizer,
      metrics: ["mse"],
    });

    model.summary()
    return model;
  }

  // **Remember function to store experiences in memory**
  remember(
    state: tf.Tensor,
    action: number,
    reward: number,
    nextState: tf.Tensor,
    done: boolean
  ) {
    // Clip reward to [-1, 1]
    const clippedReward = Math.max(-1, Math.min(1, reward));

    // Ensure states have correct shape
    state = state.squeeze();
    nextState = nextState.squeeze();

    const transition: Transition = { state, action, reward: clippedReward, nextState, done };
    this.currentSequence.push(transition);

    if (this.currentSequence.length >= this.sequenceLength) {
      this.memory.push([...this.currentSequence]);
      this.currentSequence.shift();

      if (this.memory.length > this.replayBufferSize) {
        const removedSequence = this.memory.shift();
        removedSequence?.forEach((trans) => {
          trans.state.dispose();
          trans.nextState.dispose();
        });
      }
    }
  }

  // **Act method to select an action based on epsilon-greedy policy**
  act(validActionsMask: tf.Tensor): number {
    return tf.tidy(() => {
      if (Math.random() <= this.explorationRate) {
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
        const stateSequence = this.getCurrentStateSequence();
        const reshapedStateSequence = stateSequence.reshape([
          1,
          this.sequenceLength,
          8,
          15,
          3,
        ]);
        const predictedQValues = this.model.predict(
          reshapedStateSequence
        ) as tf.Tensor;
        const maskedQValues = predictedQValues.add(validActionsMask.mul(-1e9));
        const actionIndex = maskedQValues.argMax(1).dataSync()[0];
        reshapedStateSequence.dispose();
        stateSequence.dispose();
        predictedQValues.dispose();
        maskedQValues.dispose();
        return actionIndex;
      }
    });
  }

  // **Replay method to train the model from past experiences**
  async replay() {
    if (this.memory.length < batchSize) return;

    try {
      const start = Date.now();
      const minibatchSize = Math.min(batchSize, this.memory.length);
      const minibatch = [];

      for (let i = 0; i < minibatchSize; i++) {
        const index = Math.floor(Math.random() * this.memory.length);
        minibatch.push(this.memory[index]);
      }

      // Prepare data
      const stateSequences = minibatch.map((seq) =>
        seq.map((t) => t.state.clone())
      );
      const nextStateSequences = minibatch.map((seq) =>
        seq.map((t) => t.nextState.clone())
      );
      const actions = minibatch.map((seq) => seq[seq.length - 1].action);
      const rewards = minibatch.map((seq) => seq[seq.length - 1].reward);
      const dones = minibatch.map((seq) => (seq[seq.length - 1].done ? 0 : 1));

      // Stack sequences
      const statesTensor = tf.stack(
        stateSequences.map((seq) => tf.stack(seq))
      );
      const nextStatesTensor = tf.stack(
        nextStateSequences.map((seq) => tf.stack(seq))
      );



      // Compute target Q-values using Double DQN
      const targetQValues = this.targetModel.predict(nextStatesTensor) as tf.Tensor;
      const onlineQValues = this.model.predict(nextStatesTensor) as tf.Tensor;
      const bestActions = onlineQValues.argMax(-1);
      const bestActionsArray = bestActions.dataSync();
      const targetQValuesArray = targetQValues.arraySync() as number[][];

      const selectedTargetQ = bestActionsArray.map((action, idx) => {
        return targetQValuesArray[idx][action];
      });

      const targetQ = tf.tensor1d(rewards).add(
        tf.tensor1d(selectedTargetQ).mul(this.discountFactor)
      );

      const masks = tf.oneHot(actions, this.actionSize);

      // **Optimization Step**
      const optimizer = tf.train.adam(this.learningRate);

      // **Compute and minimize the loss inside the minimize function**
      optimizer.minimize(() => {
        const qValues = this.model.predict(statesTensor) as tf.Tensor;
        const actionQValues = tf.sum(tf.mul(qValues, masks), -1);
        const loss = tf.losses.meanSquaredError(targetQ, actionQValues);
        this.totalLoss += loss.dataSync()[0];
        this.batchCount += 1;
        loss.dispose();
        qValues.dispose();
        actionQValues.dispose();
        return loss;
      }, /* returnUnusedTensors */ false);

      // **Update metrics**
      const avgLoss = this.totalLoss / this.batchCount;
      this.averageLoss = avgLoss;

      // **Dispose tensors to free memory**
      statesTensor.dispose();
      nextStatesTensor.dispose();
      targetQ.dispose();
      masks.dispose();

      this.trainStep++;
      if (this.trainStep % this.updateTargetNetworkFrequency === 0) {
        this.updateTargetNetwork();
        await this.saveModelWeights();
      }

      if (this.explorationRate > this.explorationMin) {
        this.explorationRate *= this.explorationDecay;
      }

      const end = Date.now();
      const duration = end - start;
      this.replayTimes.push(duration);
    } catch (error) {
      console.error("Error during replay:", error);
    }
  }

  // **Save model weights to IndexedDB**
  async saveModelWeights() {
    await this.model.save("indexeddb://DQNAgentModel");
    console.log(`Model saved to IndexedDB`);
  }

  // **Load model weights from IndexedDB**
  async loadModelWeights() {
    try {
      const loadedModel = await tf.loadLayersModel(
        "indexeddb://DQNAgentModel"
      );
      this.model.setWeights(loadedModel.getWeights());
      console.log(`Model weights loaded from IndexedDB`);
    } catch (error) {
      console.error("Failed to load model weights:", error);
    }
  }

  // **Update target network to match the primary network**
  updateTargetNetwork() {
    this.targetModel.setWeights(this.model.getWeights());
    console.log("Target network updated.");
  }

  // **State sequence management**

  // Reset state sequence at the start of an episode
  resetStateSequence(initialState: tf.Tensor) {
    initialState = initialState.squeeze();
    this.stateSequence = [];
    for (let i = 0; i < this.sequenceLength; i++) {
      this.stateSequence.push(initialState.clone());
    }
    console.log("State sequence reset.");
  }

  // Update state sequence with a new state
  updateStateSequence(newState: tf.Tensor) {
    newState = newState.squeeze();
    if (this.stateSequence.length >= this.sequenceLength) {
      const oldState = this.stateSequence.shift();
      oldState?.dispose();
    }
    this.stateSequence.push(newState.clone());
  }

  // Get the current state sequence as a tensor
  getCurrentStateSequence(): tf.Tensor {
    const correctedSequence = this.stateSequence.map((state) =>
      state.squeeze()
    );
    const sequence = tf.stack(correctedSequence);
    return sequence;
  }
}
