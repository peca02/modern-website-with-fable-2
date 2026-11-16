import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { SceneMount } from "@/components/SceneMount";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ChapterNav } from "@/components/ChapterNav";
import { PointerInput } from "@/components/PointerInput";
import { site } from "@/lib/content";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000"),
  title: site.title,
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#edeff1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${instrument.variable}`}>
      <body className="type-body bg-page text-ink">
        <SceneMount />
        <PointerInput />
        <ChapterNav />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
