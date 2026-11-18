import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from "three";

const width = 1024;
const height = 336;

// The wordmark as a studio light: white letters on black, sampled by the
// environment function so the name reads in the liquid's reflection.
export async function createWordmarkTexture(text: string): Promise<CanvasTexture | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() || "sans-serif";
  const font = `900 expanded 250px ${family}`;
  await document.fonts.load(font, text).catch(() => undefined);

  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "white";
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, width / 2, height / 2 + 12, width * 0.94);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  return texture;
}
