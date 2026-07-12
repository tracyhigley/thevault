import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Apple home-screen / Mac-dock icon. iOS Safari ignores SVG, so render
// a 180×180 PNG. Apple applies its own rounded-corner mask, so this is
// a full-bleed crop of the navy square with no baked-in corner rounding.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const brandIconDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "brand-icon-edge.png"),
).toString("base64")}`;

export default function AppleIcon() {
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
