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
  const [episode, setEpisode] = React.useState(0);
  const agentRef = useRef<DQNAgent | null>(null);
  const gameEnvironmentRef = useRef<GameEnvironment | null>(null);
  const haveInstanciated = useRef(false);

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
      const stateSize = game.getTensorGameState()[0].shape[1]!;

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
          setEpisode(episode + 1);
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

      lossValues.current.push({ x: episode, y: currentAverageLoss });
      explorationRateValues.current.push({
        x: episode,
        y: currentExplorationRate,
      });
      scoreValues.current.push({ x: episode, y: currentScore });
      actionTimeValues.current.push({ x: episode, y: currentActionTime });
      replayTimeValues.current.push({ x: episode, y: currentReplayTime });

      tfvis.render.linechart(
        { name: "Loss Over Time" },
        { values: [lossValues.current] },
        {
          xLabel: "Episode",
          yLabel: "Loss",
          width: 400,
          height: 300,
        }
      );

      tfvis.render.linechart(
        { name: "Exploration Rate Over Time" },
        { values: [explorationRateValues.current] },
        {
          xLabel: "Episode",
          yLabel: "Exploration Rate",
          width: 400,
          height: 300,
        }
      );

      tfvis.render.linechart(
        { name: "Score Over Time" },
        { values: [scoreValues.current] },
        {
          xLabel: "Episode",
          yLabel: "Score",
          width: 400,
          height: 300,
        }
      );

      tfvis.render.linechart(
        { name: "Action Time Over Time" },
        { values: [actionTimeValues.current] },
        {
          xLabel: "Episode",
          yLabel: "Action Time (ms)",
          width: 400,
          height: 300,
        }
      );

      tfvis.render.linechart(
        { name: "Replay Time Over Time" },
        { values: [replayTimeValues.current] },
        {
          xLabel: "Episode",
          yLabel: "Replay Time (ms)",
          width: 400,
          height: 300,
        }
      );
    }, 100); // Update the charts every second

    return () => clearInterval(interval);
  }, [episode, game.score]);

  return (
    <FloatingContent>
      Training the agent game {episode} of {trainingEpisodes} ...
      <div
        id="loss-chart"
        style={{ position: "absolute", top: "10px", right: "10px" }}
      ></div>
      <div
        id="exploration-chart"
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
`;
