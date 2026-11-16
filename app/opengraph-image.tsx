import { ImageResponse } from "next/og";
import { site } from "@/lib/content";
import { drop } from "@/lib/drop";
import { palette } from "@/lib/palette";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// No font file ships with the repository, so the image leans on the drop and
// keeps its text to two quiet lines in the renderer's built-in face.
export default function OpengraphImage() {
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
          <div style={{ fontSize: 112, letterSpacing: -4, lineHeight: 1 }}>{site.name}</div>
          <div style={{ fontSize: 30, lineHeight: 1.35, marginTop: 28, color: palette.graphite }}>{site.story}</div>
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
    size,
  );
}
