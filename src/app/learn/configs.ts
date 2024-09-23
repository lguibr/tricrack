export const totalShapes = 3;
export const totalPositions = 128;

export const actionSize = totalShapes * totalPositions;
export const intervalToForceUpdate = 0;

export const trainingEpisodes = 1000;
export const learningRate = 0.0005;
export const explorationDecay = 0.995;

export const updateTargetNetworkEveryNSteps = 64;
export const replayEveryNSteps = 32;
export const sequenceLength = 16;
export const batchSize = 16;
