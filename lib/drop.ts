// The resting drop as vector paths in a 400x300 box. Shared by the fallback
// drawing, the social image and the icon.
export const drop = {
  viewBox: "0 0 400 300",
  shadow: { cx: 210, cy: 262, rx: 186, ry: 26 },
  body: "M200 28c98 0 172 62 172 136 0 62-70 98-172 98S28 226 28 164C28 90 102 28 200 28z",
  softBox: "M128 82c44-18 100-20 146-8l-10 44c-36-8-78-6-112 6z",
  strip: "M70 118c-12 18-18 38-18 58",
  fieldStrip: "M296 176c22-6 42-18 58-34",
} as const;
