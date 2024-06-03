"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let sw: ServiceWorkerContainer | undefined;

  if (typeof window !== "undefined") {
    sw = window?.navigator?.serviceWorker;
  }
  useEffect(() => {
    if (sw) {
      sw.register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log(
            "Service Worker registration successful with scope: ",
            registration.scope
          );
        })
        .catch((err) => {
          console.log("Service Worker registration failed: ", err);
        });
    }
  }, [sw]);

  return (
    <StyledComponentsRegistry>
      <html lang="en">
        <script src="DragDropTouch.js" async></script>
        <body className={inter.className}>
          <Analytics />
          {children}
        </body>
      </html>
    </StyledComponentsRegistry>
  );
}
