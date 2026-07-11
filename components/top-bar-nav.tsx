"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  match: (p: string) => boolean;
  title?: string;
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
      href: "/drop",
      label: "Drop",
      hint: "g r",
      match: (p) => p.startsWith("/drop"),
    },
    {
      href: "/counter",
      label: "Counter",
      hint: "g c",
      match: (p) => p.startsWith("/counter"),
    },
    {
      href: "/atm",
      label: "ATM",
      hint: "g a",
      match: (p) => p.startsWith("/atm"),
    },
    {
      href: "/documents",
      label: "DOCUMENTS",
      hint: "g e",
      match: (p) =>
        p === "/documents" ||
        (p.startsWith("/documents/") && !p.startsWith(fiftyFdHref)),
    },
    {
      href: "/calendar",
      label: "Calendar",
      hint: "g k",
      match: (p) => p.startsWith("/calendar"),
    },
    {
      href: "/plan",
      label: "Plan",
      hint: "g p",
      match: (p) => p.startsWith("/plan"),
    },
    {
      href: "/settings",
      label: "Settings",
      hint: "g s",
      match: (p) => p.startsWith("/settings"),
    },
    {
      href: fiftyFdHref,
      label: "50FD",
      hint: "",
      title: "Next Steps in all areas: 50 First Dates Tape",
      match: (p) => p === fiftyFdHref || p.startsWith(`${fiftyFdHref}/`),
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
            className={clsx(
              "group shrink-0 whitespace-nowrap pb-3 -mb-3 transition",
              active
                ? "border-b-2 border-brass text-brass-bright"
                : "text-ink-mute hover:text-ink",
            )}
            onClick={
              item.href === "/"
                ? () => markPreferTodayOverDropLanding()
                : undefined
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
