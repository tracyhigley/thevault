import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// 192×192 PNG for the PWA install icon (manifest). Chrome / Android
// reject SVG manifest icons, so we render to PNG via next/og.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

// The Blueprint mark — rolled plan, sprout, brass ring — cropped from the
// brand art. Replaces the old combination-lock dial.
const brandIconDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "brand-icon.png"),
).toString("base64")}`;

export default function Icon192() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brandIconDataUri}
        width={size.width}
        height={size.height}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ),
    { ...size },
  );
}
