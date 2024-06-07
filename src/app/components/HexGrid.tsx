import "@tensorflow/tfjs-backend-webgpu";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";

import React, { useEffect, useState } from "react";
import HexGridRender from "./HexGridRender";
import { useHexGrid } from "../contexts/HexGridContext";
import GameTrainer from "./GameTrainer";
import { intervalToForceUpdate } from "../utils/constants";

import * as tf from "@tensorflow/tfjs";

const HexGrid: React.FC = () => {
  const { game } = useHexGrid();
  const [forceUpdate, setForceUpdate] = useState(0);
  const tfRef = React.useRef<typeof tf | null>(null);
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
      <GameTrainer tf={tfRef.current} game={game} />
    </div>
  );
};

export default HexGrid;
