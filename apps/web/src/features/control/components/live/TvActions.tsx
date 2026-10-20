import { cn } from "@boothwall/web-ui";
import { Camera, Check, CircleHelp, Palette } from "lucide-react";
import { type ReactNode, useId } from "react";

import { deskCopy } from "@/features/control/constants";
import type { TvRequestState } from "@/features/control/hooks";

const copy = deskCopy.tv;

export type TvRequest = { state: TvRequestState; send: () => Promise<void> };

/** Photo call, remote help and the next theme, each confirming for 4 s once the API took it. */
export function TvActions({
  photoCall,
  hints,
  theme,
}: {
  photoCall: TvRequest;
  hints: TvRequest;
  theme: TvRequest;
}) {
  return (
    <div className="grid gap-2.5 lg:grid-cols-3 lg:gap-3">
      <TvAction request={photoCall} words={copy.photoCall} icon={<Camera />} hero />
      <TvAction request={hints} words={copy.hints} icon={<CircleHelp />} />
      <TvAction request={theme} words={copy.theme} icon={<Palette />} />
    </div>
  );
}

function TvAction({
  request,
  words,
  icon,
  hero = false,
}: {
  request: TvRequest;
  words: { title: string; hint: string; short: string };
  icon: ReactNode;
  hero?: boolean;
}) {
  const hintId = useId();
  const sent = request.state === "sent";
  return (
    <div className="flex">
      <button
        type="button"
        aria-label={words.title}
        aria-describedby={hintId}
        disabled={request.state === "sending"}
        onClick={() => void request.send()}
        className={cn(
          "flex h-14 flex-1 items-center gap-3 rounded-control border px-3.5 text-left transition focus-visible:scale-102 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink active:scale-98 disabled:cursor-progress lg:h-auto lg:min-h-32 lg:flex-col lg:items-start lg:gap-2.5 lg:rounded-card lg:p-4",
          hero
            ? "border-transparent bg-primary text-on-primary hover:brightness-105 focus-visible:brightness-110 lg:border-line lg:bg-surface lg:text-ink lg:hover:bg-surface-strong lg:focus-visible:bg-surface-strong"
            : "border-line bg-surface hover:bg-surface-strong focus-visible:bg-surface-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid size-8.5 shrink-0 place-items-center rounded-tile [&_svg]:size-4 lg:size-11 lg:rounded-control lg:[&_svg]:size-5",
            hero ? "bg-on-primary/20 lg:bg-primary lg:text-on-primary" : "bg-surface-strong",
          )}
        >
          {icon}
        </span>
        <span className="text-ui font-bold">{words.title}</span>
        <span id={hintId} className="text-label text-ink-subtle max-lg:hidden">
          {sent ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-success">
              <Check aria-hidden className="size-4" strokeWidth={2.2} />
              {copy.sent}
            </span>
          ) : (
            words.hint
          )}
        </span>
        <span
          aria-hidden
          className={cn(
            "ml-auto inline-flex items-center gap-1 text-xs font-medium lg:hidden",
            sent ? "text-success" : "opacity-80",
            sent && hero && "text-on-primary",
          )}
        >
          {sent ? copy.sentShort : words.short}
          {sent && <Check className="size-3.5" strokeWidth={2.2} />}
        </span>
      </button>
      <span role="status" className="sr-only">
        {sent ? copy.announce(words.title) : ""}
      </span>
    </div>
  );
}
