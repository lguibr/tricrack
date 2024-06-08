import * as tfType from "@tensorflow/tfjs";
import {
  learningRate,
  movementsBatchSize,
  normalizeUnitDivisor,
} from "./constants";
import { TriangleState } from "./types";
import { getRandomNotEmptyShapeElementIndex } from "./calculations";

type Memory = {
  state: tfType.Tensor;
  action: tfType.Tensor;
  reward: number;
  nextState: tfType.Tensor;
  done: boolean;
};

export class DQNAgent {
  private stateSize: number;
  private actionSize: number;
  public memory: Memory[];
  private discountFactor: number;
  private explorationRate: number;
  private explorationMin: number;
  private explorationDecay: number;
  private learningRate: number;
  private model: tfType.Sequential;
  private targetModel: tfType.Sequential;
  private updateTargetNetworkFrequency: number;
  private trainStep: number;
  private totalLoss: number;
  private batchCount: number;
  private tf: typeof tfType;
  private modelName: string;
  public averageLoss: number;

  constructor(stateSize: number, actionSize: number, tf: typeof tfType) {
    this.modelName = "localstorage://DQNAgentModel";

    this.tf = tf;
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.memory = [];
    this.discountFactor = 0.95;
    this.explorationRate = 1.0;
    this.explorationMin = 0.01;
    this.explorationDecay = 0.995;
    this.learningRate = learningRate;
    this.model = this.buildModel();
    this.targetModel = this.buildModel();
    this.updateTargetNetworkFrequency = movementsBatchSize; // Update target network every 100 steps
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
      `Building mode ${this.modelName} : ${this.stateSize} / ${this.actionSize}`
    );

    const model = this.tf.sequential();
    // Input Layer
    model.add(
      this.tf.layers.dense({
        inputShape: [this.stateSize],
        units: this.stateSize,

        activation: "relu",
      })
    );
    model.add(
      this.tf.layers.dense({
        units: Math.floor(this.stateSize / 5),
        activation: "relu",
      })
    );
    model.add(
      this.tf.layers.dense({
        units: 96,
        activation: "relu",
      })
    );

    model.add(
      this.tf.layers.dense({ units: this.actionSize, activation: "linear" })
    );
    // Compile the model
    model.compile({
      loss: "meanSquaredError",
      optimizer: this.tf.train.adam(this.learningRate),
    });

    return model;
  }
  remember(
    state: tfType.Tensor,
    action: tfType.Tensor,
    reward: number,
    nextState: tfType.Tensor,
    done: boolean
  ) {
    this.memory.push({ state, action, reward, nextState, done });
  }

  act(
    state: tfType.Tensor,
    triangles: TriangleState[],
    shapes: TriangleState[][]
  ): tfType.Tensor {
    const input = this.ensureInputShape(state).div(normalizeUnitDivisor);

    if (Math.random() <= this.explorationRate) {
      // debugger
      const availableShapeIndex = getRandomNotEmptyShapeElementIndex(shapes);
      // const availableShape = shapes[availableShapeIndex];
      // const validPositionsForAvailableShape = getIndexesWhereShapeCanBePlaced(
      //   availableShape,
      //   triangles
      // );

      const randomIndex = Math.floor(Math.random() * triangles.length);

      // const randomValidPositionIndex = Math.floor(
      //   Math.random() * validPositionsForAvailableShape.length
      // );

      // const validTarget =
      //   validPositionsForAvailableShape[randomValidPositionIndex];

      // console.log({
      //   validPositionsForAvailableShape,
      //   validTarget,
      //   randomIndex,
      //   availableShapeIndex,
      // });

      return this.tf.tensor(
        [availableShapeIndex, randomIndex ?? randomIndex],
        [1, 2]
      );
    } else {
      console.log("%c predicted action! ", "background: #222; color: #bada55");

      const predictedQualityValues = this.model.predict(input) as tfType.Tensor;
      const actionIndex = Array.from(
        predictedQualityValues.argMax(-1).dataSync()
      )[0];

      const shapeIndex = Math.floor(actionIndex / 96); // 0 to 2
      const target = actionIndex % 96; // 0 to 95
      return this.tf.tensor([shapeIndex, target], [1, 2]);
    }
  }

  private ensureInputShape(tensor: tfType.Tensor): tfType.Tensor {
    const expectedShape = [1, this.stateSize];
    if (!this.tf.util.arraysEqual(tensor.shape, expectedShape)) {
      return tensor.reshape(expectedShape);
    }
    return tensor;
  }

  async replay(batchSize: number) {
    const start = Date.now();
    const maxIndex = this.memory.length - 1 - batchSize;
    const randomIndex = Math.floor(Math.random() * maxIndex);
    const minibatch = this.memory.slice(randomIndex, randomIndex + batchSize);
    let batchLoss = 0;

    for (const { state, action, reward, nextState, done } of minibatch) {
      const reshapedNextState = nextState.div(normalizeUnitDivisor);
      const reshapedState = state.div(normalizeUnitDivisor);

      const targetQ =
        reward +
        this.discountFactor *
          (done
            ? 0
            : Math.max(
                ...Array.from(
                  (
                    this.targetModel.predict(
                      reshapedNextState
                    ) as tfType.Tensor<tfType.Rank.R2>
                  ).dataSync()
                )
              ));
      const qValues = this.model.predict(
        reshapedState
      ) as tfType.Tensor<tfType.Rank.R2>;

      const qValuesCopy = qValues.arraySync() as number[][];

      const [shapeIndex, targetTriangleIndex] = Array.from(
        action.dataSync() as unknown as number[]
      );
      const actionIndex = shapeIndex * 96 + targetTriangleIndex;
      qValuesCopy[0][actionIndex] = targetQ;

      const targetTensor = this.tf.tensor(qValuesCopy);

      await this.model.fit(reshapedState, targetTensor, {
        epochs: 1,
        verbose: 0,
        batchSize: batchSize / 2,
        callbacks: {
          onBatchEnd: async (batch, logs) => {
            batchLoss += logs?.loss || 0;
            this.trainStep++;
            if (this.trainStep % this.updateTargetNetworkFrequency === 0) {
              console.log("Updating target network");
              this.updateTargetNetwork();
              // this.saveModelWeights();
            }
          },
        },
      });

      this.tf.dispose([qValues, targetTensor, targetTensor]);
    }

    this.totalLoss += batchLoss;
    this.batchCount++;
    const currentAverageLoss = this.totalLoss / this.batchCount;
    const diffOfAverageLoss = this.averageLoss - currentAverageLoss;
    console.log(
      `%cAverage Loss: ${currentAverageLoss} \nDiffAverageLoss: ${diffOfAverageLoss} \nPreviousAverageLoss: ${this.averageLoss} \nExplorationRate ${this.explorationRate}`,
      "background: #222; color: #ff006e"
    );

    this.averageLoss = currentAverageLoss;
    if (this.explorationRate > this.explorationMin) {
      console.log("Decaining the exploration rate");
      this.explorationRate *= this.explorationDecay;
    } else {
      console.log("exploration reaches the min value");
    }

    const end = Date.now();
    const duration = end - start;
    console.log(`Replay duration: ${duration / 1000}s`);

    console.groupEnd();
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
