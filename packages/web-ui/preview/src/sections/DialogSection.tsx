import { useState } from "react";

import { Button, Dialog } from "#kit";

import { PreviewSection } from "./PreviewSection";

/** Exercise native focus restoration, scrolling, and backdrop dismissal in both layouts. */
export function DialogSection() {
  const [variant, setVariant] = useState<"sheet" | "center" | null>(null);
  return (
    <PreviewSection
      title="Dialogs"
      note="Tab stays inside. Escape or the backdrop closes; padding does not."
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setVariant("sheet")}>
          Open sheet
        </Button>
        <Button variant="secondary" onClick={() => setVariant("center")}>
          Open confirmation
        </Button>
      </div>
      <Dialog
        open={variant !== null}
        onClose={() => setVariant(null)}
        variant={variant ?? "sheet"}
        labelledBy="dialog-preview-title"
        className="p-6"
      >
        <h3 id="dialog-preview-title" className="text-title font-bold">
          Ready for the big screen?
        </h3>
        <p className="mt-3 text-ink-muted">
          Your photos stay in the library. You can change what appears on the wall at any time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setVariant(null)}>
            Keep editing
          </Button>
          <Button variant="primary" onClick={() => setVariant(null)}>
            Show on wall
          </Button>
        </div>
      </Dialog>
    </PreviewSection>
  );
}
