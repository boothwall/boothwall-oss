import { Button, EmptyState } from "#kit";

import { InboxIcon } from "../fixtures/icons";
import { PreviewSection } from "./PreviewSection";

export function EmptyStateSection() {
  return (
    <PreviewSection title="Empty state">
      <div className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          className="rounded-card border border-line bg-surface"
          title="No photos yet"
          description="Scan the code on the TV and yours is the first."
          action={<Button variant="primary">Add your photo</Button>}
        />
        <EmptyState
          className="rounded-card border border-line bg-surface"
          icon={<InboxIcon />}
          title="Queue's clear"
          description="New photos show up here for you to approve."
        />
      </div>
    </PreviewSection>
  );
}
