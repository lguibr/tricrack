// File: learn/configs.ts
export const totalShapes = 3;
export const totalPositions = 120; // Adjust based on your grid size
export const actionSize = totalShapes * totalPositions;

export const batchSize = 32;
export const trainingEpisodes = 10000;
export const learningRate = 0.001;
export const explorationDecay = 0.9990;
export const updateTargetNetworkEveryNSteps = 1000;
export const intervalToForceUpdate = 200;
export const replayEveryNSteps = 200;
