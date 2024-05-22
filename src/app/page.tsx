"use client";
import { HexGridProvider } from "./contexts/HexGridContext";
import dynamic from "next/dynamic";
const HexGrid = dynamic(() => import("@/app/components/HexGrid"), {
  ssr: false,
});
export default function Home() {
  return (
    <main>
      <HexGridProvider>
        <HexGrid />
      </HexGridProvider>
    </main>
  );
}
