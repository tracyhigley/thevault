"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { markPreferTodayOverDropLanding } from "@/lib/nav-client";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  match: (p: string) => boolean;
  title?: string;
  /** Two-word rebrand links render as a pill/button instead of plain text. */
  button?: boolean;
};

function buildItems(fiftyFdHref: string): NavItem[] {
  return [
    {
      href: "/",
      label: "Today",
      hint: "g d",
      match: (p) => p === "/" || p.startsWith("/build"),
    },
    {
      href: "/field-notes",
      label: "FIELD NOTES",
      hint: "g r",
      match: (p) => p.startsWith("/field-notes"),
      button: true,
    },
    {
      href: "/admin-tasks",
      label: "ADMIN TASKS",
      hint: "g c",
      match: (p) => p.startsWith("/admin-tasks"),
      button: true,
    },
    {
      href: "/project-tasks",
      label: "PROJECT TASKS",
      hint: "g a",
      match: (p) => p.startsWith("/project-tasks"),
      button: true,
    },
    {
      href: "/project-plans",
      label: "PROJECT PLANS",
      hint: "g p",
      match: (p) =>
        p.startsWith("/project-plans") &&
        !p.startsWith("/project-plans/under-construction") &&
        !p.startsWith("/project-plans/completed"),
      button: true,
    },
    {
      href: "/project-plans/under-construction",
      label: "UNDER CONSTRUCTION",
      hint: "g u",
      match: (p) => p.startsWith("/project-plans/under-construction"),
      button: true,
    },
    {
      href: "/project-plans/completed",
      label: "COMPLETED PROJECTS",
      hint: "g f",
      match: (p) => p.startsWith("/project-plans/completed"),
      button: true,
    },
    {
      href: "/done",
      label: "DONE",
      hint: "g o",
      match: (p) => p.startsWith("/done"),
      button: true,
    },
    {
      href: "/documents",
      label: "NOTES",
      hint: "g e",
      match: (p) =>
        p === "/documents" ||
        (p.startsWith("/documents/") && !p.startsWith(fiftyFdHref)),
      button: true,
    },
    {
      href: "/calendar",
      label: "CALENDAR",
      hint: "g k",
      match: (p) => p.startsWith("/calendar"),
      button: true,
    },
    {
      href: "/settings",
      label: "SETTINGS",
      hint: "g s",
      match: (p) => p.startsWith("/settings"),
      button: true,
    },
  ];
}

export function TopBarNav({ fiftyFdHref }: { fiftyFdHref: string }) {
  const path = usePathname();
  const items = buildItems(fiftyFdHref);

  return (
    <nav className="flex min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto eyebrow md:gap-7">
      {items.map((item) => {
        const active = item.match(path);
        const title =
          item.title ?? (item.hint ? `Press ${item.hint}` : undefined);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={title}
            className={
              item.button
                ? clsx(
                    "shrink-0 rounded-sm border px-2.5 py-1 text-center font-mono text-[10px] leading-tight tracking-[0.14em] transition md:px-3 md:text-[11px]",
                    active
                      ? "border-brass bg-brass/10 text-brass"
                      : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
                  )
                : clsx(
                    "group shrink-0 whitespace-nowrap pb-3 -mb-3 transition",
                    active
                      ? "border-b-2 border-brass text-brass-bright"
                      : "text-ink-mute hover:text-ink",
                  )
            }
            onClick={
              item.href === "/"
                ? () => markPreferTodayOverDropLanding()
                : undefined
            }
          >
            {item.button
              ? item.label.split(" ").map((word, i) => (
                  <span key={i} className="block">
                    {word}
                  </span>
                ))
              : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
