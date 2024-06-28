import * as tfType from "@tensorflow/tfjs";
import {
  explorationDecay,
  learningRate,
  updateTargetNetworkEveryNSteps,
} from "./../learn/configs";
import { Memory, TriangleState } from "../helpers/types";
import {
  getIndexFromColAndRow,
  getRandomNotEmptyShapeElementIndex,
} from "../helpers/triangles";
import { getRandomNumber } from "../helpers/calculations";
import { colsPerRowGrid } from "../helpers/constants";

export class DQNAgent {
  public actionTimes: number[] = [];
  public replayTimes: number[] = [];
  private stateSize: number;
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

  constructor(stateSize: number, actionSize: number, tf: typeof tfType) {
    this.modelName = "indexeddb://DQNAgentModel";

    this.tf = tf;
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.memory = [];
    this.discountFactor = 0.95;
    this.explorationRate = 1.0;
    this.explorationMin = 0.02;
    this.replayBufferSize = 200;
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
    console.log(
      `Building model ${this.modelName} : ${this.stateSize} / ${this.actionSize}`
    );

    const inputGrid = this.tf.input({ shape: [7, 8, 15] });
    const inputShapes = this.tf.input({ shape: [5, 2, 3] });

    const inputGridFlatted = this.tf.layers
      .flatten()
      .apply(inputGrid) as tfType.SymbolicTensor;
    const inputShapesFlatted = this.tf.layers
      .flatten()
      .apply(inputShapes) as tfType.SymbolicTensor;
    // Process first input
    const convGrid = this.tf.layers
      .conv2d({
        filters: 120,
        kernelSize: [3, 3],
        activation: "relu",
        padding: "same",
      })
      .apply(inputGrid) as tfType.SymbolicTensor;

    const flatGrid = this.tf.layers
      .flatten()
      .apply(convGrid) as tfType.SymbolicTensor;

    const convShape = this.tf.layers
      .conv2d({
        filters: 6 * 6,
        kernelSize: [2, 2],
        activation: "relu",
        padding: "same",
      })
      .apply(inputShapes) as tfType.SymbolicTensor;

    const flatShapes = this.tf.layers
      .flatten()
      .apply(convShape) as tfType.SymbolicTensor;

    // Concatenate the flattened inputs
    const concat = this.tf.layers
      .concatenate()
      .apply([
        flatGrid,
        inputGridFlatted,
        inputShapesFlatted,
        flatShapes,
      ]) as tfType.SymbolicTensor;

    // Dense layers
    const dense1 = this.tf.layers
      .dense({ units: 1024, activation: "relu" })
      .apply(concat) as tfType.SymbolicTensor;
    const dense2 = this.tf.layers
      .dense({ units: 512, activation: "relu" })
      .apply(dense1) as tfType.SymbolicTensor;

    const output = this.tf.layers
      .dense({ units: this.actionSize, activation: "linear" })
      .apply(dense2) as tfType.SymbolicTensor;

    const model = this.tf.model({
      inputs: [inputGrid, inputShapes],
      outputs: output,
    });
    model.summary();

    // Compile the model
    model.compile({
      loss: "meanSquaredError",
      optimizer: this.tf.train.adam(this.learningRate),
    });

    return model;
  }

  remember(
    state: [tfType.Tensor, tfType.Tensor],
    action: tfType.Tensor,
    reward: number,
    nextState: [tfType.Tensor, tfType.Tensor],
    done: boolean
  ) {
    this.memory = this.memory.filter((memory, index) => memory.reward != 0);
    if (this.memory.length >= this.replayBufferSize) this.memory.shift();
    this.memory.push({ state, action, reward, nextState, done });
  }

  act(
    state: [tfType.Tensor, tfType.Tensor],
    triangles: TriangleState[],
    _shapes: TriangleState[][],
    optionsByShape: { row: number; col: number }[][]
  ): tfType.Tensor {
    const start = Date.now(); // Start timing
    const [input1, input2] = state;
    const input1Reshaped = input1.reshape([1, 7, 8, 15]);
    const input2Reshaped = input2.reshape([1, 5, 2, 3]);
    let action;
    if (Math.random() <= this.explorationRate) {
      const availableShapeIndex =
        getRandomNotEmptyShapeElementIndex(optionsByShape);

      const currentOptions = optionsByShape[availableShapeIndex];

      const { col, row } =
        currentOptions[getRandomNumber(0, currentOptions.length - 1)];
      const randomIndex = Math.floor(Math.random() * triangles.length);
      const indexFromColAndRow = getIndexFromColAndRow(
        col,
        row,
        colsPerRowGrid
      );

      action = this.tf.tensor(
        [availableShapeIndex, indexFromColAndRow ?? randomIndex],
        [1, 2]
      );
    } else {
      const predictedQualityValues = this.model.predict([
        input1Reshaped,
        input2Reshaped,
      ]) as tfType.Tensor;
      const actionIndex = Array.from(
        predictedQualityValues.argMax(-1).dataSync()
      )[0];

      const shapeIndex = Math.floor(actionIndex / 96); // 0 to 2
      const target = actionIndex % 96; // 0 to 95
      action = this.tf.tensor([shapeIndex, target], [1, 2]);
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
      const reshapedNextState1 = nextState1.reshape([1, 7, 8, 15]);
      const reshapedNextState2 = nextState2.reshape([1, 5, 2, 3]);
      const reshapedState1 = state1.reshape([1, 7, 8, 15]);
      const reshapedState2 = state2.reshape([1, 5, 2, 3]);

      const targetQ =
        reward +
        this.discountFactor *
          (done
            ? 0
            : Math.max(
                ...Array.from(
                  (
                    this.targetModel.predict([
                      reshapedNextState1,
                      reshapedNextState2,
                    ]) as tfType.Tensor<tfType.Rank.R2>
                  ).dataSync()
                )
              ));
      const qValues = this.model.predict([
        reshapedState1,
        reshapedState2,
      ]) as tfType.Tensor<tfType.Rank.R2>;

      const qValuesCopy = qValues.arraySync() as number[][];

      const [shapeIndex, targetTriangleIndex] = Array.from(
        action.dataSync() as unknown as number[]
      );
      const actionIndex = shapeIndex * 96 + targetTriangleIndex;
      qValuesCopy[0][actionIndex] = targetQ;

      const targetTensor = this.tf.tensor(qValuesCopy);

      await this.model.fit([reshapedState1, reshapedState2], targetTensor, {
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
      });

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
