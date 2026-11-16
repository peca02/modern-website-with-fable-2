import { ImageResponse } from "next/og";
import { drop } from "@/lib/drop";
import { palette } from "@/lib/palette";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: palette.page }}>
        <svg viewBox="20 20 360 250" width={60} height={42}>
          <path d={drop.body} fill={palette.ink} />
          <path d={drop.softBox} fill={palette.chalk} />
          <path d={drop.fieldStrip} fill="none" stroke={palette.field} strokeWidth={14} strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
