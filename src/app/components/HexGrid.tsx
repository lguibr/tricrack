"use client";
import React from "react";
import HexGridRender from "./HexGridRender";

const HexGrid: React.FC = () => {
  return (
    <div style={{ position: "relative" }}>
      <HexGridRender />
    </div>
  );
};

export default HexGrid;
