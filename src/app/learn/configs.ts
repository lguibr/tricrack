export const movementsBatchSize = 256;
export const trainingEpisodes = 100;
export const intervalToForceUpdate = 100;
export const learningRate = 0.00001;
export const normalizeUnitDivisor = 96 / 2;
export const replayEveryNSteps = movementsBatchSize / 4;
export const updateTargetNetworkEveryNSteps = movementsBatchSize;
