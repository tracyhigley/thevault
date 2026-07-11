"use client";
import { useEffect, useState } from "react";

// "Lights Out at the Drafting Table" — the ceremonial centerpiece for
// /sealed. A top-down blueprint sheet sits under a desk lamp. Filing
// (sealing) switches the lamp off with a quick flicker; reopening
// switches it back on. The title block in the corner reads the state,
// same way an architect's sheet reads REV/STATUS.

type Phase = "open" | "sealing" | "sealed";

const ANIM_MS = 900;

export function DraftingLamp({
  sealed,
  animate = false,
  size = 420,
}: {
  sealed: boolean;
  animate?: boolean;
  size?: number;
}) {
  const [phase, setPhase] = useState<Phase>(
    sealed ? (animate ? "sealing" : "sealed") : animate ? "sealing" : "open",
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!animate) {
      setPhase(sealed ? "sealed" : "open");
      return;
    }
    setPhase("sealing");
    const t = setTimeout(
      () => setPhase(sealed ? "sealed" : "open"),
      ANIM_MS,
    );
    return () => clearTimeout(t);
  }, [animate, sealed]);

  const isSealed = sealed && phase !== "open";
  const animating = phase === "sealing";
  const lampFlicker = animating
    ? sealed
      ? "lamp-flicker-off"
      : "lamp-flicker-on"
    : undefined;

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      aria-label={sealed ? "Lights out — plans filed" : "Lamp on — drafting"}
    >
      <style>{`
        @keyframes lamp-flicker-off {
          0% { opacity: 1; }
          30% { opacity: 0.15; }
          45% { opacity: 0.75; }
          60% { opacity: 0.08; }
          100% { opacity: 0; }
        }
        @keyframes lamp-flicker-on {
          0% { opacity: 0; }
          40% { opacity: 0.45; }
          55% { opacity: 0.1; }
          70% { opacity: 0.85; }
          100% { opacity: 1; }
        }
        @keyframes leaf-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>

      <svg
        viewBox="0 0 440 440"
        width={size}
        height={size}
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="lamp-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(240,236,224,0.32)" />
            <stop offset="100%" stopColor="rgba(240,236,224,0)" />
          </radialGradient>
          <pattern
            id="blueprint-grid"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 22 0 L 0 0 0 22"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* desk vignette */}
        <circle cx="220" cy="220" r="205" fill="rgba(0,0,0,0.16)" />

        {/* lamp glow — the light actually falling on the sheet */}
        <ellipse
          cx="230"
          cy="165"
          rx="200"
          ry="180"
          fill="url(#lamp-glow)"
          style={{
            opacity: isSealed ? 0 : 0.95,
            transition: "opacity 700ms ease",
            animation: lampFlicker
              ? `${lampFlicker} ${ANIM_MS}ms ease-out`
              : undefined,
          }}
        />

        {/* blueprint sheet */}
        <rect
          x="70"
          y="88"
          width="300"
          height="230"
          rx="6"
          fill="#1f3155"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1.5"
        />
        <rect
          x="70"
          y="88"
          width="300"
          height="230"
          rx="6"
          fill="url(#blueprint-grid)"
        />

        {/* simple floor-plan linework */}
        <g
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.3"
          fill="none"
          style={{ opacity: isSealed ? 0.3 : 0.8, transition: "opacity 700ms ease" }}
        >
          <rect x="108" y="126" width="220" height="150" />
          <line x1="108" y1="198" x2="216" y2="198" />
          <line x1="216" y1="126" x2="216" y2="276" />
          <line x1="216" y1="228" x2="328" y2="228" />
          <path d="M 216 198 A 20 20 0 0 1 236 218" />
        </g>

        {/* title block — corner legend, echoes a real architect's sheet */}
        <g transform="translate(248 250)">
          <rect
            x="0"
            y="0"
            width="106"
            height="52"
            fill="rgba(15,22,38,0.35)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="20"
            x2="106"
            y2="20"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="36"
            x2="106"
            y2="36"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          <text
            x="8"
            y="14"
            fill="rgba(255,255,255,0.78)"
            fontSize="7.5"
            letterSpacing="1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            THE BLUEPRINT
          </text>
          <text
            x="8"
            y="31"
            fill={isSealed ? "#a8c17d" : "rgba(255,255,255,0.6)"}
            fontSize="7.5"
            letterSpacing="1"
            style={{ fontFamily: "var(--font-mono)", transition: "fill 700ms ease" }}
          >
            {isSealed ? "STATUS: FILED" : "STATUS: DRAFTING"}
          </text>
          <text
            x="8"
            y="47"
            fill="rgba(255,255,255,0.4)"
            fontSize="6.5"
            letterSpacing="0.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SHEET A-01 · TODAY
          </text>
        </g>

        {/* soil + sprout, lower-left — the mark's growth motif, always alive */}
        <g transform="translate(102 272)">
          <ellipse cx="0" cy="10" rx="18" ry="7" fill="#3c2c1c" opacity="0.9" />
          <g
            style={{
              transformOrigin: "0px 10px",
              animation: !isSealed
                ? "leaf-sway 3.5s ease-in-out infinite"
                : undefined,
            }}
          >
            <path
              d="M0 10 C -2 -4, -2 -18, 4 -34"
              stroke="#7c8f52"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M2 -10 C -8 -14, -14 -8, -16 -2"
              stroke="#7c8f52"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M3 -20 C 10 -24, 15 -18, 17 -12"
              stroke="#8fa563"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M4 -30 C -3 -36, -8 -32, -10 -26"
              stroke="#8fa563"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* desk lamp — arm folds toward the sheet, head dims when filed */}
        <g>
          <line
            x1="362"
            y1="52"
            x2="326"
            y2="104"
            stroke="#9aa3b4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="326"
            y1="104"
            x2="292"
            y2="90"
            stroke="#9aa3b4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="362" cy="52" r="5" fill="#9aa3b4" />
          <circle cx="326" cy="104" r="4" fill="#9aa3b4" />
          <path
            d="M 292 90 L 272 72 L 272 96 Z"
            fill={isSealed ? "#3a4152" : "#e0b963"}
            style={{ transition: "fill 700ms ease" }}
          />
          <circle
            cx="280"
            cy="84"
            r={isSealed ? 2 : 5}
            fill={isSealed ? "#5a6272" : "#f5e6b8"}
            style={{ transition: "all 700ms ease" }}
          />
        </g>
      </svg>
    </div>
  );
}
