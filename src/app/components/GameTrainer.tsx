import React, { useEffect, useRef } from "react";
import { GameEnvironment } from "../learn/GameEnvironment";
import { DQNAgent } from "../learn/DQNAgent";
import Game from "../game";
import {
  movementsBatchSize,
  replayEveryNSteps,
  trainingEpisodes,
} from "../learn/configs";
import * as tfType from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis"; // Import tfjs-vis
import { styled } from "styled-components";

const GameTrainer: React.FC<{ game: Game; tf: typeof tfType }> = ({
  game,
  tf,
}) => {
  const [iteration, setIteration] = React.useState(0);
  const agentRef = useRef<DQNAgent | null>(null);
  const gameEnvironmentRef = useRef<GameEnvironment | null>(null);
  const haveInstantiated = useRef(false);

  const lossValues = useRef<{ x: number; y: number }[]>([]);
  const explorationRateValues = useRef<{ x: number; y: number }[]>([]);
  const scoreValues = useRef<{ x: number; y: number }[]>([]);
  const actionTimeValues = useRef<{ x: number; y: number }[]>([]);
  const replayTimeValues = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Ensure GameEnvironment is created only once
    if (!gameEnvironmentRef.current) {
      gameEnvironmentRef.current = new GameEnvironment(game);
    }

    // Create and configure DQNAgent only once
    if (!agentRef.current) {
      const actionSize = 8 * 15 + 3;
      if (tf != null) {
        agentRef.current = new DQNAgent(actionSize, tf);
      }
    }

    const trainAgent = async () => {
      if (haveInstantiated.current) return;
      haveInstantiated.current = true;
      const dqnAgent = agentRef.current;
      const gameEnvironment = gameEnvironmentRef.current;
      if (dqnAgent && gameEnvironment) {
        for (let iteration = 0; iteration < trainingEpisodes; iteration++) {
          setIteration(iteration + 1);
          let state = gameEnvironment.reset();
          let done = false;
          while (!done) {
            const currentMemoryLength = dqnAgent.memory.length;
            const action = dqnAgent.act(
              state,
              gameEnvironment.getTriangles(),
              gameEnvironment.getShapes(),
              gameEnvironment.getValidPositions()
            );
            const {
              nextState,
              reward,
              done: isDone,
            } = gameEnvironment.step(action);
            done = isDone;
            dqnAgent.remember(state, action, reward, nextState, isDone);
            state = nextState;

            if (currentMemoryLength % replayEveryNSteps === 0) {
              await dqnAgent.replay(movementsBatchSize);
            }
          }

          await dqnAgent.replay(movementsBatchSize);
          gameEnvironment.reset();
        }
      }
    };

    trainAgent();
  }, [game, tf]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentAverageLoss = agentRef.current?.averageLoss || 0;
      const currentExplorationRate = agentRef.current?.explorationRate || 0;
      const currentScore = game.score || 0;
      const currentActionTime = agentRef.current?.actionTimes.slice(-1)[0] || 0;
      const currentReplayTime = agentRef.current?.replayTimes.slice(-1)[0] || 0;

      lossValues.current.push({ x: iteration, y: currentAverageLoss });
      explorationRateValues.current.push({
        x: iteration,
        y: currentExplorationRate,
      });
      scoreValues.current.push({ x: iteration, y: currentScore });
      actionTimeValues.current.push({ x: iteration, y: currentActionTime });
      replayTimeValues.current.push({ x: iteration, y: currentReplayTime });

      tfvis.render.linechart(
        { name: "Loss Over Time" },
        { values: [lossValues.current] },
        {
          xLabel: "Iteration",
          yLabel: "Loss",
          width: 500,
          height: 100,
        }
      );

      tfvis.render.linechart(
        { name: "Exploration Rate Over Time" },
        { values: [explorationRateValues.current] },
        {
          xLabel: "Iteration",
          yLabel: "Exploration Rate",
          width: 500,
          height: 100,
        }
      );

      tfvis.render.linechart(
        { name: "Score Over Time" },
        { values: [scoreValues.current] },
        {
          xLabel: "Iteration",
          yLabel: "Score",
          width: 500,
          height: 100,
        }
      );

      tfvis.render.linechart(
        { name: "Action Time Over Time" },
        { values: [actionTimeValues.current] },
        {
          xLabel: "Iteration",
          yLabel: "Action Time (ms)",
          width: 500,
          height: 100,
        }
      );

      tfvis.render.linechart(
        { name: "Replay Time Over Time" },
        { values: [replayTimeValues.current] },
        {
          xLabel: "Iteration",
          yLabel: "Replay Time (ms)",
          width: 500,
          height: 100,
        }
      );
    }, 100); // Update the charts every second

    return () => clearInterval(interval);
  }, [iteration, game.score]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: "20px",
          zIndex: 9999,
          color: "red",
        }}
      >
        <h2>
          Training the agent game {iteration} of {trainingEpisodes} ...
        </h2>
      </div>
      <FloatingContent>
        <div
          id="loss-chart"
          style={{ position: "absolute", top: "10px", right: "10px" }}
        ></div>
        <div
          style={{ position: "absolute", top: "320px", right: "10px" }}
        ></div>
        <div
          id="score-chart"
          style={{ position: "absolute", top: "630px", right: "10px" }}
        ></div>
        <div
          id="action-time-chart"
          style={{ position: "absolute", top: "940px", right: "10px" }}
        ></div>
        <div
          id="replay-time-chart"
          style={{ position: "absolute", top: "1250px", right: "10px" }}
        ></div>
      </FloatingContent>
    </>
  );
};

export default GameTrainer;

const FloatingContent = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  color: black;
`;
