import { PreviewSection } from "./PreviewSection";

export function TypeSection() {
  return (
    <PreviewSection
      title="Type"
      note="Phone 32 / 22 / 17 / 15 / 13, desktop 48 / 28 / 17 / 15 / 13."
    >
      <div className="flex flex-col gap-3">
        <p className="text-display font-extrabold tracking-tight">Your moment on the big screen.</p>
        <p className="text-title font-bold">Waiting for approval</p>
        <p className="text-body text-ink-muted">Take a photo. Get approved. See it land here.</p>
        <p className="text-ui font-medium">Approve all</p>
        <p className="text-label text-ink-subtle">Sent 2 minutes ago</p>
        <p className="font-hand text-hand text-primary-text">Best night of the year</p>
      </div>
    </PreviewSection>
  );
}
