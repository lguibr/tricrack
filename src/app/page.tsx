"use client"
import HexGrid from "@/app/components/HexGrid";
import { HexGridProvider } from "./contexts/HexGridContext";

export default function Home() {
  return (
    <main>
      <HexGridProvider>
        <HexGrid />
      </HexGridProvider>
    </main>
  );
}
