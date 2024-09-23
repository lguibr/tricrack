export const totalShapes = 3;
export const totalPositions = 128;
export const actionSize = totalShapes * totalPositions;

export const batchSize = 32;
export const trainingEpisodes = 1000;
export const learningRate = 0.001;
export const explorationDecay = 0.990;
export const updateTargetNetworkEveryNSteps = 128;
export const intervalToForceUpdate = 1;
export const replayEveryNSteps = 64;

export const sequenceLength = 16; 
