import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/utils/constants";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #fff8ee 0%, #f5f5dc 45%, #e4ead2 100%)",
          color: "#483C32",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(72, 60, 50, 0.14)",
            borderRadius: "999px",
            padding: "12px 20px",
            fontSize: 24,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8A9A5B",
            background: "rgba(255,255,255,0.55)",
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ fontSize: 82, lineHeight: 1.02, fontWeight: 700 }}>Dobierz komputer albo sprawdź ofertę.</div>
          <div style={{ fontSize: 34, lineHeight: 1.3, color: "#6e655e" }}>{SITE_TAGLINE}</div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 28,
            color: "#483C32",
          }}
        >
          <div style={{ padding: "14px 22px", borderRadius: 999, background: "rgba(138, 154, 91, 0.18)" }}>Builder PC</div>
          <div style={{ padding: "14px 22px", borderRadius: 999, background: "rgba(194, 126, 96, 0.18)" }}>Checker ofert</div>
          <div style={{ padding: "14px 22px", borderRadius: 999, background: "rgba(72, 60, 50, 0.10)" }}>Handpicked buildy</div>
        </div>
      </div>
    ),
    size,
  );
}
