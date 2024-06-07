import React, { useEffect, useState, useMemo } from "react";
import HexGridRender from "./HexGridRender";
import { useHexGrid } from "../contexts/HexGridContext";
import GameTrainer from "./GameTrainer";
import { intervalToForceUpdate } from "../utils/constants";

const HexGrid: React.FC = () => {
  const { game } = useHexGrid();
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, intervalToForceUpdate);
    return () => clearInterval(interval);
  }, []);

  if (!game) return null;

  return (
    <div style={{ position: "relative" }}>
      <HexGridRender frame={forceUpdate} game={game} />
      <GameTrainer game={game} />
    </div>
  );
};

export default HexGrid;
