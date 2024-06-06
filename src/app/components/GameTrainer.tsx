// src/app/components/GameTrainer.tsx

import React, { useEffect, useState } from "react";
import { GameEnvironment } from "../utils/GameEnvironment";
import { DQNAgent } from "../utils/DQNAgent";
import { Game } from "../utils/types";
import { gameStateToTensor } from "../utils/calculations";

const GameTrainer: React.FC<Game> = ({
  resetGame,
  getState,
  handleSetShapeOnTriangle,
  isGameOver,
  getColRowByIndex,
}) => {
  const [agent, setAgent] = useState<DQNAgent | null>(null);

  useEffect(() => {
    const environment = new GameEnvironment({
      resetGame,
      getState,
      handleSetShapeOnTriangle,
      isGameOver,
      getColRowByIndex,
    });

    const stateSize = gameStateToTensor(getState()).size;
    const actionSize = 2;
    const dqnAgent = new DQNAgent(stateSize, actionSize);
    setAgent(dqnAgent);

    const trainAgent = async () => {
      debugger;
      for (let episode = 0; episode < 1000; episode++) {
        let state = environment.reset();
        let done = false;
        console.log(`Episode ${episode + 1}: Start`);

        while (!done) {
          const currentMemoryLength = dqnAgent.memory.length;
          console.log({ currentMemoryLength });

          const action = dqnAgent.act(state);
          const { nextState, reward, done } = environment.step(action);
          
          dqnAgent.remember(state, action, reward, nextState, done);
          state = nextState;

          if (currentMemoryLength > 150) {
            dqnAgent.replay(32);
          }
        }

        console.log(`Episode ${episode + 1}: Done`);
      }
    };

    trainAgent();
  }, [
    resetGame,
    getState,
    handleSetShapeOnTriangle,
    isGameOver,
    getColRowByIndex,
  ]);

  return <div>Training the agent...</div>;
};

export default GameTrainer;
