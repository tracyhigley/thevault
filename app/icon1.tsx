import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// 512×512 PNG for the PWA install icon (manifest). Same design as
// icon0 at higher resolution.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const brandIconDataUri = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "brand-icon.png"),
).toString("base64")}`;

export default function Icon512() {
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
