// src/app/contexts/HexGridContext.tsx
"use client";

import React, { createContext, useContext, useRef, useEffect } from "react";
import Game from "../utils/Game";

interface HexGridContextProps {
  game: Game;
}

const HexGridContext = createContext<HexGridContextProps | undefined>(
  undefined
);

export const HexGridProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const gameRef = useRef<Game>(new Game());

  return (
    <HexGridContext.Provider value={{ game: gameRef.current }}>
      {children}
    </HexGridContext.Provider>
  );
};

export const useHexGrid = () => {
  const context = useContext(HexGridContext);
  if (!context) {
    throw new Error("useHexGrid must be used within a HexGridProvider");
  }
  return context;
};
