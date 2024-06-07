// src/app/components/GameTrainer.tsx

import React, { useEffect, useRef } from "react";
import { GameEnvironment } from "../utils/GameEnvironment";
import { DQNAgent } from "../utils/DQNAgent";
import Game from "../utils/Game";
import { movementsBatchSize, trainingEpisodes } from "../utils/constants";
import * as tfType from "@tensorflow/tfjs";

const GameTrainer: React.FC<{ game: Game; tf: typeof tfType }> = ({
  game,
  tf,
}) => {
  const agentRef = useRef<DQNAgent | null>(null);
  const gameEnvironmentRef = useRef<GameEnvironment | null>(null);
  const haveInstanciated = useRef(false);
  useEffect(() => {
    // Ensure GameEnvironment is created only once
    if (!gameEnvironmentRef.current) {
      gameEnvironmentRef.current = new GameEnvironment(game);
    }

    // Create and configure DQNAgent only once
    if (!agentRef.current) {
      const stateSize = game.getTensorGameState().shape[1]!;

      const actionSize = 96 * 3; // 96 targets * 3 shapes
      if (tf != null) {
        agentRef.current = new DQNAgent(stateSize, actionSize, tf);
      }
    }

    const trainAgent = async () => {
      if (haveInstanciated.current) return;
      haveInstanciated.current = true;
      const dqnAgent = agentRef.current;
      const gameEnvironment = gameEnvironmentRef.current;
      if (dqnAgent && gameEnvironment) {
        for (let episode = 0; episode < trainingEpisodes; episode++) {
          console.group(`Episode ${episode + 1}`);
          let state = gameEnvironment.reset();
          let done = false;

          while (!done) {
            const currentMemoryLength = dqnAgent.memory.length;
            const action = dqnAgent.act(state);
            const {
              nextState,
              reward,
              done: isDone,
            } = gameEnvironment.step(action);
            done = isDone;
            dqnAgent.remember(state, action, reward, nextState, isDone);
            state = nextState;

            if ((currentMemoryLength % movementsBatchSize) / 4 === 0) {
              const lastMemory = dqnAgent.memory[dqnAgent.memory.length - 1];
              const lastMemoryState = lastMemory.state.dataSync();
              const lastMemoryAction = lastMemory.action.dataSync();
              const lastMemoryReward = lastMemory.reward;
              const lastMemoryNextState = lastMemory.nextState.dataSync();
              const lastMemoryDone = lastMemory.done;
              console.log("memory snapshot", {
                state: Array.from(lastMemoryState),
                action: Array.from(lastMemoryAction),
                reward: lastMemoryReward,
                nextState: Array.from(lastMemoryNextState),
                done: lastMemoryDone,
              });

              await dqnAgent.replay(movementsBatchSize);
            }
          }

          await dqnAgent.replay(movementsBatchSize);
          gameEnvironment.reset();

          console.groupEnd();
        }
      }
    };

    trainAgent();
  }, [game, tf]);

  return <div>Training the agent...</div>;
};

export default GameTrainer;
