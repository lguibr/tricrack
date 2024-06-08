"use client";

import { createContext, useContext, useRef, ReactNode } from "react";
import Game from "../game";

interface HexGridContextProps {
  game: Game;
}

const HexGridContext = createContext<HexGridContextProps | undefined>(
  undefined
);

export const HexGridProvider: React.FC<{ children: ReactNode }> = ({
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
