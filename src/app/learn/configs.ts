// File: learn/configs.ts
export const totalShapes = 3;
export const totalPositions = 128; // Adjust based on your grid size
export const actionSize = totalShapes * totalPositions;

export const batchSize = 256;
export const trainingEpisodes = 10000;
export const learningRate = 0.0002;
export const explorationDecay = 0.9994;
export const updateTargetNetworkEveryNSteps = 1024;
export const intervalToForceUpdate = 1;
export const replayEveryNSteps = 512;
