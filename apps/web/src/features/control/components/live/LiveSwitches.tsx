import type { RuntimeSettingsPatch, WallSettings } from "@boothwall/shared";
import { cn } from "@boothwall/web-ui";
import { Pause, Play, Upload } from "lucide-react";
import type { ReactNode } from "react";

import { deskCopy } from "@/features/control/constants";

const copy = deskCopy.live;

/** Pause or resume the slideshow and open or close guest uploads, each on its own. */
export function LiveSwitches({
  settings,
  busy,
  onSave,
}: {
  settings: WallSettings | null;
  busy: boolean;
  onSave: (patch: RuntimeSettingsPatch) => Promise<void>;
}) {
  if (!settings) return <p role="status">{copy.loading}</p>;
  const playing = !settings.playbackPaused;
  return (
    <div className="grid gap-3 lg:grid-cols-2" aria-busy={busy}>
      <LiveSwitch
        label={copy.slideshow}
        state={playing ? copy.playing : copy.paused}
        icon={playing ? <Pause /> : <Play />}
        on={playing}
        busy={busy}
        onToggle={() => void onSave({ playbackPaused: playing })}
      />
      <LiveSwitch
        label={copy.uploads}
        state={settings.uploadsOpen ? copy.open : copy.closed}
        icon={<Upload />}
        on={settings.uploadsOpen}
        busy={busy}
        onToggle={() => void onSave({ uploadsOpen: !settings.uploadsOpen })}
      />
    </div>
  );
}

/** The whole row is the switch: easy to hit on a phone, and its state is said in words too. */
function LiveSwitch(props: {
  label: string;
  state: string;
  icon: ReactNode;
  on: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.on}
      aria-label={props.label}
      disabled={props.busy}
      onClick={props.onToggle}
      className="flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 text-left transition hover:bg-surface-strong focus-visible:scale-102 focus-visible:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink active:scale-98 disabled:cursor-progress"
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-strong [&_svg]:size-5"
      >
        {props.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-ui font-bold">{props.label}</span>
        <span className="text-label text-ink-subtle">{props.state}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-pill transition",
          props.on ? "bg-success" : "bg-surface-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-pill bg-paper transition-[left]",
            props.on ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}
