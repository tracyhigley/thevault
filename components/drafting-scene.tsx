"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

// "Lights Out at the Drafting Table" — photographic version. Two matched
// flat-lay shots of the same desk (lamp-on.jpg / lamp-off.jpg) crossfade
// on top of each other. During the seal/unseal transition the "on" layer
// flickers a few times like a dying bulb before settling, instead of a
// plain fade, so the change actually reads as something happening.

type Phase = "open" | "sealing" | "sealed";

const ANIM_MS = 1200;

export function DraftingScene({
  sealed,
  animate = false,
  maxWidth = 560,
}: {
  sealed: boolean;
  animate?: boolean;
  maxWidth?: number;
}) {
  const [phase, setPhase] = useState<Phase>(
    sealed ? (animate ? "sealing" : "sealed") : animate ? "sealing" : "open",
  );

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
  const flickerClass = animating
    ? sealed
      ? "animate-[lamp-flicker-off_1200ms_ease-out_1]"
      : "animate-[lamp-flicker-on_1200ms_ease-out_1]"
    : undefined;

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-lg border border-paper-line/40 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
      style={{ maxWidth, aspectRatio: "1402 / 1122" }}
      aria-label={sealed ? "Lights out — plans filed" : "Lamp on — drafting"}
    >
      <style>{`
        @keyframes lamp-flicker-off {
          0% { opacity: 1; }
          15% { opacity: 0.25; }
          25% { opacity: 1; }
          40% { opacity: 0.15; }
          52% { opacity: 0.8; }
          65% { opacity: 0.05; }
          100% { opacity: 0; }
        }
        @keyframes lamp-flicker-on {
          0% { opacity: 0; }
          30% { opacity: 0.1; }
          42% { opacity: 0.7; }
          55% { opacity: 0.1; }
          70% { opacity: 0.9; }
          85% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* lights-off base layer — always present underneath */}
      <Image
        src="/sealed/lamp-off.jpg"
        alt=""
        fill
        priority
        sizes={`(max-width: 640px) 100vw, ${maxWidth}px`}
        className="object-cover"
      />

      {/* lights-on layer — crossfades / flickers on top */}
      <Image
        src="/sealed/lamp-on.jpg"
        alt=""
        fill
        priority
        sizes={`(max-width: 640px) 100vw, ${maxWidth}px`}
        className={clsx(
          "object-cover transition-opacity duration-700 ease-out",
          flickerClass,
        )}
        style={{ opacity: animating ? undefined : isSealed ? 0 : 1 }}
      />
    </div>
  );
}
