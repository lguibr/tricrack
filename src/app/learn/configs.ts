export const movementsBatchSize = 1;
export const trainingEpisodes = 1000;
export const intervalToForceUpdate = 250;
export const learningRate = 0.0004;

export const replayEveryNSteps = movementsBatchSize * 4;
export const updateTargetNetworkEveryNSteps = movementsBatchSize * 10;
export const explorationDecay = 1 - learningRate;
