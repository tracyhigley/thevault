"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";

/** Same as `<Link href="/">` but marks intent so Field-Notes-first routing doesn’t bounce you away from Today. */
export function VaultHomeLink({
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href="/"
      {...props}
      onClick={(e) => {
        markPreferTodayOverDropLanding();
        onClick?.(e);
      }}
    />
  );
}
