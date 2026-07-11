"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/settings", label: "GENERAL" },
  { href: "/settings/members", label: "MEMBERS" },
  { href: "/settings/boxes", label: "BOXES" },
  { href: "/settings/buildings", label: "BUILDINGS" },
  { href: "/settings/documents", label: "DOCUMENTS" },
  { href: "/settings/energies", label: "ENERGIES" },
  { href: "/settings/calendar", label: "CALENDAR" },
  { href: "/settings/connect", label: "CONNECT" },
] as const;

function linkActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === "/settings";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SettingsSubnav() {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-wider">
      {LINKS.map(({ href, label }) => {
        const on = linkActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "rounded-sm border px-3 py-1.5 transition",
              on
                ? "border-brass bg-brass/10 text-brass"
                : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
