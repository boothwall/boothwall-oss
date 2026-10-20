import { useState } from "react";

import { Button, type ButtonVariant, IconButton, SegmentedControl } from "#kit";

import { CameraIcon, CloseIcon, MoreIcon, TrashIcon } from "../fixtures/icons";
import { PreviewSection } from "./PreviewSection";

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
  { variant: "primary", label: "Take a photo" },
  { variant: "secondary", label: "Approve" },
  { variant: "ghost", label: "Skip" },
  { variant: "destructive", label: "Remove" },
];

const SIZES = ["sm", "md", "lg"] as const;

/** The two surface themes: public (navy, guest pages) and host (graphite, host tools). */
const CANVASES = [
  { id: "public", label: "Public (navy)" },
  { id: "host", label: "Host (graphite)" },
] as const;

/** Enabled and disabled side by side on each canvas, so the disabled primary is judged in place. */
function DisabledOnCanvases() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CANVASES.map((canvas) => (
        <div
          key={canvas.id}
          data-surface={canvas.id}
          className="flex flex-col gap-3 rounded-card border border-line bg-canvas p-5"
        >
          <p className="text-label text-ink-subtle">{canvas.label}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Unlock</Button>
            <Button variant="primary" disabled>
              Unlock
            </Button>
            <Button variant="secondary" disabled>
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ButtonsSection() {
  const [view, setView] = useState<"queue" | "photos" | "settings">("queue");
  return (
    <PreviewSection title="Buttons" note="One primary per screen. Sizes 36 / 44 / 56.">
      <div className="flex flex-col gap-6">
        {SIZES.map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-3">
            {VARIANTS.map(({ variant, label }) => (
              <Button key={variant} variant={variant} size={size}>
                {label}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">
            <CameraIcon />
            Add your photo
          </Button>
          <Button variant="primary" loading>
            Sending
          </Button>
          <Button variant="primary" disabled>
            Send
          </Button>
          <Button variant="secondary" disabled>
            Approve
          </Button>
          <IconButton icon={<CloseIcon />} label="Close" />
          <IconButton icon={<MoreIcon />} label="More" variant="secondary" />
          <IconButton icon={<TrashIcon />} label="Delete" variant="destructive" />
          <IconButton icon={<CameraIcon />} label="Take a photo" variant="primary" size="lg" />
          <IconButton icon={<CloseIcon />} label="Busy" variant="secondary" loading />
        </div>
        <DisabledOnCanvases />
        <div className="max-w-sm">
          <Button variant="primary" size="lg" fullWidth>
            Add your photo
          </Button>
        </div>
        <SegmentedControl
          legend="Show"
          hideLegend
          name="preview-view"
          value={view}
          onChange={setView}
          className="max-w-sm"
          options={[
            { value: "queue", label: "Queue" },
            { value: "photos", label: "Photos" },
            { value: "settings", label: "Settings" },
          ]}
        />
      </div>
    </PreviewSection>
  );
}
