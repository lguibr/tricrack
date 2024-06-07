import * as tfType from "@tensorflow/tfjs";
import { movementsBatchSize } from "./constants";

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

  constructor(stateSize: number, actionSize: number, tf: typeof tfType) {
    this.tf = tf;
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.memory = [];
    this.discountFactor = 0.95;
    this.explorationRate = 1.0;
    this.explorationMin = 0.01;
    this.explorationDecay = 0.995;
    this.learningRate = 0.00001;
    this.model = this.buildModel();
    this.targetModel = this.buildModel();
    this.updateTargetNetworkFrequency = movementsBatchSize / 4; // Update target network every 100 steps
    this.trainStep = 0;
    this.totalLoss = 0;
    this.batchCount = 0;
  }

  buildModel() {
    const model = this.tf.sequential();

    model.add(
      this.tf.layers.dense({
        inputShape: [this.stateSize],
        units: this.stateSize * 3,
        activation: "relu",
      })
    );

    model.add(
      this.tf.layers.dense({ units: this.actionSize, activation: "linear" })
    );
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

  act(state: tfType.Tensor): tfType.Tensor {
    const input = this.ensureInputShape(state).div(255.0); // Normalize input

    if (Math.random() <= this.explorationRate) {
      const randomShapeIndex = Math.floor(Math.random() * 3); // 0 to 2
      const randomTarget = Math.floor(Math.random() * 96); // 0 to 95
      return this.tf.tensor([randomShapeIndex, randomTarget], [1, 2]);
    } else {
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
    console.group("Replaying");
    const start = Date.now();
    const maxIndex = this.memory.length - 1 - batchSize;
    const randomIndex = Math.floor(Math.random() * maxIndex);
    const minibatch = this.memory.slice(randomIndex, randomIndex + batchSize);

    let batchLoss = 0;

    for (const { state, action, reward, nextState, done } of minibatch) {
      const reshapedNextState = this.ensureInputShape(nextState).div(255.0); // Normalize input
      const reshapedState = this.ensureInputShape(state).div(255.0); // Normalize input

      const predictedNextStateValues = this.targetModel.predict(
        reshapedNextState
      ) as tfType.Tensor;

      const maxPredictedFutureQualityValue = Math.max(
        ...Array.from(predictedNextStateValues.dataSync())
      );
      const computedTargetQualityValue =
        reward +
        (done ? 0 : this.discountFactor * maxPredictedFutureQualityValue);

      const predictedStateValues = this.model.predict(
        reshapedState
      ) as tfType.Tensor;

      const updatedQualityValues = Array.from(predictedStateValues.dataSync());
      const [shapeIndex, targetTriangleIndex] = Array.from(action.dataSync());
      const actionIndex = shapeIndex * 96 + targetTriangleIndex;

      updatedQualityValues[actionIndex] = computedTargetQualityValue;

      const targetTensor = this.tf.tensor(updatedQualityValues, [
        1,
        this.actionSize,
      ]);

      await this.model.fit(reshapedState, targetTensor, {
        epochs: 1,
        verbose: 0,
        batchSize: batchSize / 2,
        callbacks: {
          onBatchEnd: async (batch, logs) => {
            batchLoss += logs?.loss || 0;
            this.trainStep++;
            if (this.trainStep % this.updateTargetNetworkFrequency === 0) {
              this.updateTargetNetwork();
            }
          },
        },
      });

      this.tf.dispose([
        predictedNextStateValues,
        predictedStateValues,
        targetTensor,
      ]);
    }

    this.totalLoss += batchLoss;
    this.batchCount++;
    const averageLoss = this.totalLoss / this.batchCount;
    console.log(`Average Loss: ${averageLoss}`);

    if (this.explorationRate > this.explorationMin) {
      this.explorationRate *= this.explorationDecay;
    }
    console.log();
    const end = Date.now();
    const duration = end - start;
    console.log(duration, "ms");

    console.groupEnd();
  }

  updateTargetNetwork() {
    this.targetModel.setWeights(this.model.getWeights());
  }
}
