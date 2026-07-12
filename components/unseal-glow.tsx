"use client";
import { useEffect, useState } from "react";

// Brief brass-glow pulse over the page when arriving with ?just=unsealed.
// Mirrors the close-animation on the sealed page: a quick "the door is open"
// flourish before the Docket settles.

export function UnsealGlow() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("just") !== "unsealed") return;
    setShow(true);
    // Strip the query param so a refresh doesn't re-trigger.
    const url = new URL(window.location.href);
    url.searchParams.delete("just");
    window.history.replaceState({}, "", url.toString());
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 animate-[unseal_1400ms_ease-out_forwards]">
      <style>{`
        @keyframes unseal {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      {/* Warm lamp-relight flare — no expanding ring (that read as a vault
          door iris opening); just a soft wash of light, like the drafting
          lamp clicking back on. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(201,161,74,0.22),_transparent_60%)]" />
    </div>
  );
}
