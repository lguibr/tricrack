import * as tfType from "@tensorflow/tfjs";
import {
  explorationDecay,
  learningRate,
  updateTargetNetworkEveryNSteps,
} from "./configs";
import { Memory, TensorGameState, TriangleState } from "../helpers/types";
import {
  getIndexFromColAndRow,
  getRandomNotEmptyShapeElementIndex,
} from "../helpers/triangles";
import {
  buildUnitByDepthCustom,
  getRandomNumber,
} from "../helpers/calculations";
import { colsPerRowGridPadded, gridPadding } from "../helpers/constants";

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
  private model: tfType.LayersModel;
  private targetModel: tfType.LayersModel;
  private updateTargetNetworkFrequency: number;
  private trainStep: number;
  private totalLoss: number;
  private batchCount: number;
  private tf: typeof tfType;
  private modelName: string;
  public averageLoss: number;
  private unistByDepth: (index: number) => number;
  private layersDepth: number;
  private layersUnitsByDepths: number[];
  private inputSize: number;
  private dropoutRate: number;
  constructor(actionSize: number, tf: typeof tfType) {
    this.modelName = "indexeddb://DQNAgentModel";
    this.layersDepth = 36;
    this.actionSize = actionSize;
    this.dropoutRate = 0.01;
    this.inputSize = 4 * 8 * 15 + 3 * 2 * 3;
    this.layersUnitsByDepths = buildUnitByDepthCustom(
      Math.floor((this.inputSize * 3) / 2),
      this.actionSize * 2,
      this.inputSize * 3,
      this.layersDepth
    );
    this.unistByDepth = (index) => this.layersUnitsByDepths[index];
    this.tf = tf;
    this.actionSize = actionSize;
    this.memory = [];
    this.discountFactor = 0.95;
    this.explorationRate = 1.0;
    this.explorationMin = 0.02;
    this.replayBufferSize = 200_000_000;
    this.explorationDecay = explorationDecay;
    this.learningRate = learningRate;
    this.model = this.buildModel(this.layersDepth, this.unistByDepth);
    this.targetModel = this.buildModel(this.layersDepth, this.unistByDepth);
    this.updateTargetNetworkFrequency = updateTargetNetworkEveryNSteps;
    this.trainStep = 0;
    this.totalLoss = 0;
    this.batchCount = 0;
    this.averageLoss = 0;

    this.loadModelWeights().catch((err) => {
      console.log("No saved model found, starting with a new model.");
    });
  }

  buildModel(layerDepth: number, unitsFunction: (index: number) => number) {
    const gridInputs = [];
    for (let i = 0; i < 4; i++) {
      gridInputs.push(this.tf.input({ shape: [8, 15, 3] }));
    }

    const shapeInputs = [];
    for (let i = 0; i < 3; i++) {
      shapeInputs.push(this.tf.input({ shape: [2, 3, 3] }));
    }

    const flatGridInputs = gridInputs.map(
      (input) => this.tf.layers.flatten().apply(input) as tfType.SymbolicTensor
    );

    const flatShapeInputs = shapeInputs.map(
      (input) => this.tf.layers.flatten().apply(input) as tfType.SymbolicTensor
    );

    const concat = this.tf.layers
      .concatenate()
      .apply([...flatGridInputs, ...flatShapeInputs]) as tfType.SymbolicTensor;

    let x: tfType.SymbolicTensor = concat;

    // Dynamically create dense layers based on layerDepth
    for (let i = 0; i < layerDepth; i++) {
      const units = unitsFunction(i);
      x = this.tf.layers
        .dense({
          units: units,
          activation: "relu",
        })
        .apply(x) as tfType.SymbolicTensor;

      // x = this.tf.layers.batchNormalization().apply(x) as tfType.SymbolicTensor;
      x = this.tf.layers
        .dropout({ rate: this.dropoutRate })
        .apply(x) as tfType.SymbolicTensor;
    }

    // Output layer
    const output = this.tf.layers
      .dense({ units: this.actionSize, activation: "linear" })
      .apply(x) as tfType.SymbolicTensor;

    const model = this.tf.model({
      inputs: [...gridInputs, ...shapeInputs],
      outputs: output,
    });
    model.summary();

    model.compile({
      loss: "meanSquaredError",
      optimizer: this.tf.train.adam(this.learningRate),
    });

    return model;
  }

  remember(
    state: TensorGameState,
    action: tfType.Tensor,
    reward: number,
    nextState: TensorGameState,
    done: boolean
  ) {
    this.memory = this.memory.filter((memory, index) => memory.reward != 0);
    if (this.memory.length >= this.replayBufferSize) this.memory.shift();
    this.memory.push({ state, action, reward, nextState, done });
  }

  act(
    state: TensorGameState,
    triangles: TriangleState[],
    shapes: TriangleState[][],
    optionsByShape: { row: number; col: number }[][]
  ): tfType.Tensor {
    const start = Date.now(); // Start timing
    const [gridInputs, shapeInputs] = state;

    const reshapedGridInputs = gridInputs.map((input) =>
      input.reshape([1, 8, 15, 3])
    );

    const reshapedShapeInputs = shapeInputs.map((input) =>
      input.reshape([1, 2, 3, 3])
    );

    let action;
    if (Math.random() <= this.explorationRate) {
      // Exploration: Randomly select a shape and a valid position
      const shapeIndex = getRandomNotEmptyShapeElementIndex(optionsByShape);
      const shapeAvailablePositions = optionsByShape[shapeIndex];
      const randomPositionIndex = getRandomNumber(
        0,
        shapeAvailablePositions.length - 1
      );
      const randomAvailablePosition =
        shapeAvailablePositions[randomPositionIndex];

      const { col: unPaddedCol, row } = randomAvailablePosition;
      const rowPadding = gridPadding[row];
      const col = unPaddedCol + rowPadding;
      const positionIndex = getIndexFromColAndRow(
        col,
        row,
        colsPerRowGridPadded
      );

      action = this.tf.tensor([shapeIndex, positionIndex], [1, 2]);
    } else {
      // Exploitation: Predict the best shape and position
      const predictedQualityValues = this.model.predict([
        ...reshapedGridInputs,
        ...reshapedShapeInputs,
      ]) as tfType.Tensor;

      // Extract shape and position predictions
      const shapeProbabilities = predictedQualityValues.slice([0, 0], [1, 3]);
      const shapeIndex = shapeProbabilities.argMax(1).dataSync()[0]; // Select the shape with the highest predicted quality

      const positionProbabilities = predictedQualityValues.slice(
        [0, 3],
        [1, 120]
      );
      const positionIndex = positionProbabilities.argMax(1).dataSync()[0]; // Select the position with the highest predicted quality

      action = this.tf.tensor([shapeIndex, positionIndex], [1, 2]);
    }

    const end = Date.now(); // End timing
    this.actionTimes.push(end - start); // Store action time
    return action;
  }

  async replay(batchSize: number) {
    const start = Date.now();
    const rewardFulMemories = this.memory.filter(
      (memory, index) => memory.reward != 0
    );
    const maxIndex = rewardFulMemories.length - 1 - batchSize;
    const randomIndex = Math.floor(Math.random() * maxIndex);
    const minibatch = rewardFulMemories.slice(
      randomIndex,
      randomIndex + batchSize
    );
    let batchLoss = 0;

    for (const { state, action, reward, nextState, done } of minibatch) {
      // Reshape the state and nextState tensors to include batch and channels dimensions
      const [nextState1, nextState2] = nextState;
      const [state1, state2] = state;

      const reshapedNextStateGrid = nextState1.map((input) =>
        input.reshape([1, 8, 15, 3])
      );
      const reshapedNextStateShape = nextState2.map((input) =>
        input.reshape([1, 2, 3, 3])
      );

      const reshapedStateGrid = state1.map((input) =>
        input.reshape([1, 8, 15, 3])
      );
      const reshapedStateShape = state2.map((input) =>
        input.reshape([1, 2, 3, 3])
      );

      const targetQ =
        reward +
        this.discountFactor *
          (done
            ? 0
            : Math.max(
                ...Array.from(
                  (
                    this.targetModel.predict([
                      ...reshapedNextStateGrid,
                      ...reshapedNextStateShape,
                    ]) as tfType.Tensor<tfType.Rank.R2>
                  ).dataSync()
                )
              ));
      const qValues = this.model.predict([
        ...reshapedStateGrid,
        ...reshapedStateShape,
      ]) as tfType.Tensor<tfType.Rank.R2>;

      const qValuesCopy = qValues.arraySync() as number[][];

      const [shapeIndex, targetIndex] = Array.from(
        action.dataSync() as unknown as number[]
      );

      const actionIndex = 3 + targetIndex;
      qValuesCopy[0][actionIndex] = targetQ;

      const targetTensor = this.tf.tensor(qValuesCopy);

      await this.model.fit(
        [...reshapedStateGrid, ...reshapedStateShape],
        targetTensor,
        {
          epochs: 1,
          verbose: 0,
          batchSize: batchSize,
          callbacks: {
            onBatchEnd: async (batch, logs) => {
              batchLoss += logs?.loss || 0;
              this.trainStep++;
              if (this.trainStep % this.updateTargetNetworkFrequency === 0) {
                this.updateTargetNetwork();
                this.saveModelWeights();
              }
            },
          },
        }
      );

      this.tf.dispose([qValues, targetTensor, targetTensor]);
    }

    this.totalLoss += batchLoss;
    this.batchCount++;
    const currentAverageLoss = this.totalLoss / this.batchCount;

    this.averageLoss = currentAverageLoss;
    if (this.explorationRate > this.explorationMin) {
      this.explorationRate *= this.explorationDecay;
    }
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
      const loadedModel = await this.tf.loadLayersModel(this.modelName);
      this.model.setWeights(loadedModel.getWeights());
      console.log(`Model weights loaded from ${this.modelName}`);
    } catch (error) {
      console.error("Failed to load model weights:", error);
      throw error;
    }
  }

  updateTargetNetwork() {
    this.targetModel.setWeights(this.model.getWeights());
  }
}
