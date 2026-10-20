import { Button, cn } from "@boothwall/web-ui";
import { ArrowRight, Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";

import { appPath, WALL_PATH, WIDE_QUERY } from "@/config";
import { controlCopy, FOCUS_LIFT_PRIMARY } from "@/features/control/constants";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

import { ControlNotice, DeskBrand } from "../primitives";

const copy = controlCopy.unlockScreen;

export type UnlockFormProps = {
  onUnlock: (passcode: string) => void;
  /** Wrong passcode or a lockout, from the last try. */
  error: string | null;
  /** The passcode is being checked: the button waits instead of taking another try. */
  checking?: boolean;
  className?: string;
};

/**
 * The passcode card: what Control can do, a labelled field with show/hide, and an Unlock button
 * that always looks pressable: an empty try says what is missing instead of greying it out.
 */
export function UnlockForm({ onUnlock, error, checking = false, className }: UnlockFormProps) {
  const [draft, setDraft] = useState("");
  const [visible, setVisible] = useState(false);
  const [empty, setEmpty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wide = useMediaQuery(WIDE_QUERY);
  const inputId = useId();
  const messageId = useId();
  const message = empty ? copy.empty : error;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (checking) return;
    const passcode = draft.trim();
    if (!passcode) {
      setEmpty(true);
      inputRef.current?.focus();
      return;
    }
    onUnlock(passcode);
    setDraft("");
  };

  return (
    <form
      noValidate
      onSubmit={submit}
      className={cn(
        "relative flex w-full max-w-110 flex-col gap-4 rounded-card border border-line bg-surface-solid/90 p-7 shadow-paper",
        className,
      )}
    >
      <span className="self-start">
        <DeskBrand className="h-7 w-auto" />
      </span>
      <p className="text-label font-semibold tracking-eyebrow text-ink-subtle uppercase">
        {copy.eyebrow}
      </p>
      <h1 className="text-title font-bold">{copy.formTitle}</h1>
      <ul className="grid gap-2 text-ui text-ink-muted">
        {copy.can.map((line) => (
          <li key={line} className="flex items-center gap-2.5">
            <Check aria-hidden className="size-4 shrink-0 text-primary-text" strokeWidth={2} />
            {line}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="sr-only">
          {controlCopy.passcodeLabel}
        </label>
        <div className="relative">
          <KeyRound
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-subtle"
            strokeWidth={1.8}
          />
          <input
            ref={inputRef}
            id={inputId}
            type={visible ? "text" : "password"}
            inputMode="numeric"
            autoComplete="one-time-code"
            // Not on a phone: the keyboard would cover the card and its button.
            autoFocus={wide}
            value={draft}
            aria-invalid={message !== null}
            aria-describedby={message ? messageId : undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setEmpty(false);
            }}
            placeholder={copy.placeholder}
            className="h-13 w-full rounded-pill border border-line bg-surface pr-14 pl-11 text-body tracking-code text-ink transition placeholder:tracking-normal placeholder:text-ink-subtle hover:border-ink-subtle/70 focus:border-ink focus:bg-surface-strong focus:outline-2 focus:outline-offset-2 focus:outline-ink aria-invalid:border-danger"
          />
          <button
            type="button"
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? copy.hide : copy.show}
            className="absolute top-1/2 right-2.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-pill text-ink-subtle transition hover:text-ink focus-visible:scale-110 focus-visible:bg-surface-strong focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            {visible ? (
              <EyeOff aria-hidden className="size-4" strokeWidth={1.8} />
            ) : (
              <Eye aria-hidden className="size-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
        {message && (
          <p id={messageId} role="alert" className="text-label text-danger">
            {message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        aria-busy={checking || undefined}
        className={FOCUS_LIFT_PRIMARY}
      >
        {checking ? controlCopy.checking : controlCopy.unlock}
        <ArrowRight aria-hidden className="size-5" strokeWidth={2} />
      </Button>
      <div className="flex items-start justify-between gap-4 text-label text-ink-subtle">
        <span>{copy.hint}</span>
        <a
          href={appPath(WALL_PATH)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-tile text-ink-muted underline underline-offset-3 transition hover:text-ink focus-visible:scale-102 focus-visible:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {controlCopy.openWall}
        </a>
      </div>
      <ControlNotice />
    </form>
  );
}
