import "@tensorflow/tfjs-backend-webgpu";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";

import React, { useEffect, useState } from "react";
import HexGridRender from "./HexGridRender";
import { useHexGrid } from "../contexts/HexGridContext";
import GameTrainer from "./GameTrainer";
import { intervalToForceUpdate } from "../learn/configs";

import * as tf from "@tensorflow/tfjs";
import { styled } from "styled-components";

const HexGrid: React.FC = () => {
  const { game } = useHexGrid();
  const [forceUpdate, setForceUpdate] = useState(0);
  const tfRef = React.useRef<typeof tf | null>(null);
  const [training, setTraining] = useState(false);

  const clearStorage = async () => {
    // Clear localStorage
    localStorage.clear();
    // Clear indexedDB
    const databases = await indexedDB.databases();
    databases.forEach((db) => {
      indexedDB.deleteDatabase(db.name!);
    });
    console.log("Cleared indexDB and localStorage");
  };

  useEffect(() => {
    const debounced = setTimeout(() => {
      const loadTf = async () => {
        if (tfRef.current) return;
        console.group("Loading TensorFlow");

        await tfjsWasm.setWasmPaths(
          `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`
        );

        await tf.setBackend("webgpu");

        await tf.ready();
        const currentBackend = await tf.getBackend();
        console.log(`TensorFlow is ready with backend: ${currentBackend}`);
        console.groupEnd();
        tfRef.current = tf;
      };

      if (tfRef.current == null) loadTf();
    }, 1);
    const interval = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, intervalToForceUpdate);

    return () => {
      clearInterval(interval);
      clearTimeout(debounced);
    };
  }, []);

  if (!game || tfRef.current == null) return null;

  return (
    <div style={{ position: "relative" }}>
      <HexGridRender frame={forceUpdate} game={game} />
      <Button onClick={() => setTraining((p) => !p)}>
        {training ? "Stop Training" : "Start Training"}
      </Button>
      <ClearButton onClick={clearStorage}>Clear Storage</ClearButton>

      {training && <GameTrainer tf={tfRef.current} game={game} />}
    </div>
  );
};

export default HexGrid;

const Button = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px;
  border-radius: 5px;
  background-color: #ff006e;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #ff0055;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  bottom: 50px;
  right: 10px;
  padding: 10px;
  border-radius: 5px;
  background-color: #ff006e;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #ff0055;
  }
`;
