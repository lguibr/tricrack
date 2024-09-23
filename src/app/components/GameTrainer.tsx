// File: GameTrainer.tsx

import React, { useEffect, useRef } from "react";
import { GameEnvironment } from "../learn/GameEnvironment";
import { DQNAgent } from "../learn/DQNAgent";
import Game from "../game";
import {
  replayEveryNSteps,
  trainingEpisodes,
  actionSize,
  sequenceLength,
} from "../learn/configs";
import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import { styled } from "styled-components";

const GameTrainer: React.FC<{ game: Game }> = ({ game }) => {
  const [iteration, setIteration] = React.useState(0);
  const agentRef = useRef<DQNAgent | null>(null);
  const gameEnvironmentRef = useRef<GameEnvironment | null>(null);
  const haveInstantiated = useRef(false);

  const lossValues = useRef<{ x: number; y: number }[]>([]);
  const explorationRateValues = useRef<{ x: number; y: number }[]>([]);
  const scoreValues = useRef<{ x: number; y: number }[]>([]);
  const totalRewardValues = useRef<{ x: number; y: number }[]>([]);
  const actionTimeValues = useRef<{ x: number; y: number }[]>([]);
  const replayTimeValues = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!gameEnvironmentRef.current) {
      gameEnvironmentRef.current = new GameEnvironment(game);
    }

    if (!agentRef.current) {
      agentRef.current = new DQNAgent(actionSize, game);
    }

    const trainAgent = async () => {
      if (haveInstantiated.current) return;
      haveInstantiated.current = true;
      const dqnAgent = agentRef.current!;
      const gameEnvironment = gameEnvironmentRef.current!;

      for (let episode = 0; episode < trainingEpisodes; episode++) {
        console.log(`Starting Episode ${episode + 1}`);
        setIteration(episode + 1);
        let state = gameEnvironment.reset();

        // Initialize the state sequence
        dqnAgent.resetStateSequence(state);

        let done = false;
        let totalReward = 0;

        while (!done) {
          const validActionsMask = gameEnvironment.getValidActionsMask();
          const action = dqnAgent.act(validActionsMask);
          const { nextState, reward, done: isDone } = gameEnvironment.step(action);
          totalReward += reward;

          // Store the transition
          dqnAgent.remember(state, action, reward, nextState, isDone);

          // Update the state sequence
          dqnAgent.updateStateSequence(nextState);

          state = nextState;
          done = isDone;

          if (dqnAgent.memory.length % replayEveryNSteps === 0) {
            console.log(`Replaying at Episode ${episode + 1}, Step ${dqnAgent.trainStep}`);
            await dqnAgent.replay();
            await tf.nextFrame();
          }

          validActionsMask.dispose();
        }

        console.log(`Final Replay for Episode ${episode + 1}`);
        await dqnAgent.replay();
        await tf.nextFrame();

        // Update charts
        const currentAverageLoss = dqnAgent.averageLoss || 0;
        const currentExplorationRate = dqnAgent.explorationRate || 0;
        const currentScore = game.score || 0;
        const currentActionTime = dqnAgent.actionTimes.slice(-1)[0] || 0;
        const currentReplayTime = dqnAgent.replayTimes.slice(-1)[0] || 0;

        lossValues.current.push({ x: episode, y: currentAverageLoss });
        explorationRateValues.current.push({
          x: episode,
          y: currentExplorationRate,
        });
        scoreValues.current.push({ x: episode, y: currentScore });
        totalRewardValues.current.push({ x: episode, y: totalReward });
        actionTimeValues.current.push({
          x: episode,
          y: currentActionTime,
        });
        replayTimeValues.current.push({
          x: episode,
          y: currentReplayTime,
        });

        // Render charts
        tfvis.render.linechart(
          { name: "Loss Over Time", tab: "Training Metrics" },
          { values: [lossValues.current] },
          {
            xLabel: "Episode",
            yLabel: "Loss",
            width: 500,
            height: 300,
          }
        );

        tfvis.render.linechart(
          { name: "Exploration Rate Over Time", tab: "Training Metrics" },
          { values: [explorationRateValues.current] },
          {
            xLabel: "Episode",
            yLabel: "Exploration Rate",
            width: 500,
            height: 300,
          }
        );

        tfvis.render.linechart(
          { name: "Score Over Time", tab: "Training Metrics" },
          { values: [scoreValues.current] },
          {
            xLabel: "Episode",
            yLabel: "Score",
            width: 500,
            height: 300,
          }
        );

        tfvis.render.linechart(
          { name: "Total Reward Over Time", tab: "Training Metrics" },
          { values: [totalRewardValues.current] },
          {
            xLabel: "Episode",
            yLabel: "Total Reward",
            width: 500,
            height: 300,
          }
        );

        tfvis.render.linechart(
          { name: "Action Time Over Time", tab: "Performance Metrics" },
          { values: [actionTimeValues.current] },
          {
            xLabel: "Episode",
            yLabel: "Action Time (ms)",
            width: 500,
            height: 300,
          }
        );

        tfvis.render.linechart(
          { name: "Replay Time Over Time", tab: "Performance Metrics" },
          { values: [replayTimeValues.current] },
          {
            xLabel: "Episode",
            yLabel: "Replay Time (ms)",
            width: 500,
            height: 300,
          }
        );

        console.log(`Episode ${episode + 1} completed. Resetting game.`);
        gameEnvironment.reset();
        await tf.nextFrame();
      }
    };

    trainAgent();
  }, [game]);

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
          Training the agent: episode {iteration} of {trainingEpisodes}...
        </h2>
      </div>
      <FloatingContent>
        <div id="loss-chart"></div>
        <div id="exploration-rate-chart"></div>
        <div id="score-chart"></div>
        <div id="total-reward-chart"></div>
        <div id="action-time-chart"></div>
        <div id="replay-time-chart"></div>
      </FloatingContent>
    </>
  );
};

export default GameTrainer;

const FloatingContent = styled.div`
  position: absolute;
  top: 60px;
  right: 10px;
  padding: 10px;
  border-radius: 5px;
  max-height: 90vh;
  overflow-y: auto;
  color: black;
  z-index: 1000;
`;
