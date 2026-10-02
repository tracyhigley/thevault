"use client";
// Click-to-edit note title, same pattern as the Today End of Day editor:
// click to edit, Enter or blur saves, Escape cancels. Empty titles aren't saved.

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { renameDocument } from "@/lib/actions";

export function NoteTitleEditor({
  docKey,
  label,
}: {
  docKey: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [shown, setShown] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  // Enter saves and then the input unmounts, which also fires blur — this
  // keeps that from saving twice (or saving after Escape).
  const done = useRef(false);

  useEffect(() => {
    if (editing && inputRef.current) {
      done.current = false;
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function cancel() {
    done.current = true;
    setValue(shown);
    setEditing(false);
  }

  function handleSave() {
    if (done.current) return;
    const next = value.trim();
    if (!next) {
      toast.error("A note needs a title.");
      cancel();
      return;
    }
    if (next === shown) {
      cancel();
      return;
    }
    done.current = true;
    startTransition(async () => {
      try {
        await renameDocument(docKey, next);
        setShown(next);
        setValue(next);
        setEditing(false);
        router.refresh();
        toast.success("Title updated.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Couldn't save.");
        done.current = false;
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  const headingClass =
    "mt-2 font-sans text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[36px]";

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={60}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={pending}
          aria-label="Note title"
          className={`${headingClass} w-full rounded-sm border border-paper-line bg-paper-panel/60 px-2 py-0.5 outline-none focus:border-brass`}
        />
        {pending && <span className="text-[11px] text-ink-mute">Saving…</span>}
      </div>
    );
  }

  return (
    <h1 className={headingClass}>
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Click to edit title"
        className="text-left transition hover:text-brass hover:underline hover:decoration-dotted hover:underline-offset-4"
      >
        {shown}
      </button>
    </h1>
  );
}
