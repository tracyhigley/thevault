import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { TopBar } from "@/components/top-bar";
import { TopBarShell } from "@/components/top-bar-shell";
import { CmdK } from "@/components/cmd-k";
import { ShortcutsProvider } from "@/lib/shortcuts";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { ShortcutCheatSheet } from "@/components/shortcut-cheat-sheet";
import { ShortcutsHintBar } from "@/components/shortcuts-hint-bar";
import { UnhandledRejectionGuard } from "@/components/unhandled-rejection-guard";
import { RegisterServiceWorker } from "@/components/register-service-worker";

export const metadata: Metadata = {
  title: "The Blueprint",
  description: "A place for everything.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=JetBrains+Mono:wght@400;600&family=Carlito:wght@400;700&display=swap"
        />
      </head>
      <body className="bg-vault-bg text-ink min-h-screen">
        <RegisterServiceWorker />
        <div className="absolute inset-0 lamp-glow pointer-events-none" />
        <ShortcutsProvider>
          <TopBarShell>
            <TopBar />
          </TopBarShell>
          <main className="relative">{children}</main>
          <CmdK />
          <GlobalShortcuts />
          <ShortcutCheatSheet />
          <ShortcutsHintBar />
          <UnhandledRejectionGuard />
        </ShortcutsProvider>
        <Toaster
          theme="light"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--vault-panel)",
              border: "1px solid var(--vault-line)",
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
            },
          }}
        />
      </body>
    </html>
  );
}
