"use client";
import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";
import { saveDocument } from "@/lib/actions";

export function DocumentsEditor({
  box,
  initial,
  title,
}: {
  box: string;
  initial: string;
  title: string;
}) {
  const [body, setBody] = useState(initial);
  const [mode, setMode] = useState<"read" | "edit">(
    initial.trim() ? "read" : "edit",
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    startTransition(async () => {
      await saveDocument(box, body, title);
      setSavedAt(Date.now());
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 font-mono text-[11px] tracking-wider">
        <button
          onClick={() => setMode("read")}
          className={clsx(
            "rounded-sm border px-3 py-1",
            mode === "read"
              ? "border-brass bg-brass/10 text-brass"
              : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
          )}
        >
          READ
        </button>
        <button
          onClick={() => setMode("edit")}
          className={clsx(
            "rounded-sm border px-3 py-1",
            mode === "edit"
              ? "border-brass bg-brass/10 text-brass"
              : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
          )}
        >
          EDIT
        </button>
        <span className="ml-auto text-ink-mute">
          {pending && "saving…"}
          {!pending &&
            savedAt &&
            `saved ${new Date(savedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}`}
        </span>
      </div>

      {mode === "read" ? (
        <article
          className={clsx(
            "prose prose-lg max-w-none font-sans text-ink",
            "prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-ink",
            "prose-p:text-[17px] prose-p:leading-[1.75] prose-li:text-[17px] prose-li:leading-[1.75]",
            "prose-blockquote:text-ink-dim prose-blockquote:border-brass/35",
            "prose-code:rounded-sm prose-code:bg-paper-panel prose-code:px-1 prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none",
            "prose-pre:bg-paper-panel/80 prose-pre:border prose-pre:border-paper-line/80 prose-pre:font-mono prose-pre:text-[14px]",
            "prose-table:text-[15px] prose-th:text-[14px] prose-td:text-[15px]",
            "prose-a:text-brass prose-a:underline prose-a:decoration-brass/40 prose-a:underline-offset-2",
          )}
        >
          {body.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="italic text-ink-mute">
              Empty document. Switch to EDIT to start writing.
            </p>
          )}
        </article>
      ) : (
        <div className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={save}
            rows={24}
            spellCheck
            className="w-full rounded-sm border border-paper-line bg-paper-panel/40 p-4 font-sans text-[16px] leading-[1.7] text-ink outline-none focus:border-brass"
            placeholder="# Start writing in markdown…"
          />
          <details className="rounded-sm border border-paper-line bg-paper-panel/30 px-4 py-3">
            <summary className="cursor-pointer font-mono text-[11px] tracking-[0.18em] text-ink-mute hover:text-brass">
              MARKDOWN CHEAT SHEET
            </summary>
            <div className="mt-3 grid gap-4 text-[13px] text-ink-dim md:grid-cols-2">
              <section>
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-mute">
                  HEADINGS
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink">{`# Big heading   ← start of line, space after #
## Section
### Subsection

Not hashtags around text (#word#).
That stays plain text; use **bold** for emphasis.`}</pre>
              </section>
              <section>
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-mute">
                  TEXT EMPHASIS
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink">{`**bold**
*italic*
~~strikethrough~~`}</pre>
              </section>
              <section>
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-mute">
                  LISTS
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink">{`- bullet
1. numbered
- [ ] task
- [x] done task`}</pre>
              </section>
              <section>
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-mute">
                  LINE BREAKS
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink">{`Blank line between paragraphs
End line with two spaces for a soft break`}</pre>
              </section>
              <section className="md:col-span-2">
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-mute">
                  TABLES
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink">{`| Item | Value |
| --- | --- |
| Sleep | 7h |`}</pre>
              </section>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
