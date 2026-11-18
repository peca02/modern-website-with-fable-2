import { ImageResponse } from "next/og";
import { site } from "@/lib/content";
import { drop } from "@/lib/drop";
import { palette } from "@/lib/palette";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];

// No font file ships with the repository: Archivo (wide, black) for the
// wordmark and Instrument Sans for the line are fetched while building, each
// subset to its letters. Satori needs TTF, OTF or WOFF, which Google serves to
// a request without a browser user agent. If either fetch fails, both lines
// use the renderer's built-in face, so the build never breaks.
async function loadFont(family: string, text: string) {
  try {
    const query = `family=${family}&text=${encodeURIComponent(text)}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?${query}`).then((response) => response.text());
    const source = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype|woff)'\)/)?.[1];
    if (!source) return null;
    const response = await fetch(source);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [wordmark, line] = await Promise.all([
    loadFont("Archivo:wdth,wght@125,900", site.name),
    loadFont("Instrument+Sans:wght@400", site.story),
  ]);
  const fonts =
    wordmark && line
      ? [
          { name: "Archivo", data: wordmark, weight: 900, style: "normal" },
          { name: "Instrument Sans", data: line, weight: 400, style: "normal" },
        ] satisfies Fonts
      : undefined;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: 72,
          background: palette.page,
          color: palette.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 420, paddingBottom: 12 }}>
          <div
            style={
              fonts
                ? { fontFamily: "Archivo", fontSize: 128, letterSpacing: -4, lineHeight: 1 }
                : { fontSize: 112, letterSpacing: -4, lineHeight: 1 }
            }
          >
            {site.name}
          </div>
          <div
            style={{
              fontFamily: fonts ? "Instrument Sans" : undefined,
              fontSize: 30,
              lineHeight: 1.35,
              marginTop: 28,
              color: palette.graphite,
            }}
          >{site.story}</div>
        </div>
        <svg viewBox={drop.viewBox} width={640} height={480}>
          <ellipse {...drop.shadow} fill={palette.mineral} />
          <path d={drop.body} fill={palette.ink} />
          <path d={drop.softBox} fill={palette.chalk} />
          <path d={drop.strip} fill="none" stroke={palette.chalk} strokeWidth={9} strokeLinecap="round" />
          <path d={drop.fieldStrip} fill="none" stroke={palette.field} strokeWidth={4} strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
