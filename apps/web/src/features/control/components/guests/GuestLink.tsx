import { Button, cn, QrCode } from "@boothwall/web-ui";
import { Copy } from "lucide-react";
import { useState } from "react";

import { deskCopy, FOCUS_LIFT } from "@/features/control/constants";
import { guestLink } from "@/features/control/utils";

import { DeskCard } from "../primitives";

const copy = deskCopy.guests;

/** The guest page as a QR code, a link and a copy button; an unsafe address shows none of them. */
export function GuestLink({ path }: { path: string }) {
  const url = guestLink(path, window.location.origin);
  const [message, setMessage] = useState("");
  const share = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(copy.copied);
    } catch {
      setMessage(copy.copyFailed);
    }
  };
  return (
    <DeskCard title={copy.title}>
      {url ? (
        <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
          <div className="size-48 rounded-control bg-paper p-3 text-paper-ink max-sm:mx-auto sm:size-28 sm:p-2">
            <QrCode value={url} label={copy.qr(url)} />
          </div>
          <div className="flex min-w-0 flex-col gap-2.5">
            <a
              className="self-start text-ui break-all text-ink-muted underline-offset-3 hover:underline focus-visible:scale-102 focus-visible:rounded-tile focus-visible:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink"
              href={url}
            >
              {url}
            </a>
            <Button size="sm" className={cn("self-start", FOCUS_LIFT)} onClick={() => void share()}>
              <Copy aria-hidden className="size-4" strokeWidth={1.8} />
              {copy.copy}
            </Button>
            <p role="status" className="text-label text-ink-subtle empty:hidden">
              {message}
            </p>
          </div>
        </div>
      ) : (
        <p role="alert">{copy.unavailable}</p>
      )}
    </DeskCard>
  );
}
