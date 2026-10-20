import { EmptyState } from "@boothwall/web-ui";
import { PauseCircle } from "lucide-react";
import type * as React from "react";

import { ComposeForm } from "#features/capture/components/compose";
import { PhotoPicker } from "#features/capture/components/compose";
import { ErrorNote } from "#features/capture/components/feedback";
import { IntroHero } from "#features/capture/components/intro";
import { LiveWallPreview } from "#features/capture/components/intro";
import { SuccessView } from "#features/capture/components/success";
import { useCapture } from "#features/capture/hooks";
import { useCaptureCopy } from "#features/capture/hooks";
import { useUploadSettings } from "#features/capture/hooks";
import { EventShell } from "#features/guest-shell";
import { usePhotoApproval } from "#features/photo-approval";

/**
 * /snap, behind the TV's QR code. Built for a phone: the newest photos on the wall, one line and
 * the two ways to pick a photo. On a laptop the photos and the buttons sit side by side.
 */
export function CaptureExperience({ introNotice }: { introNotice?: React.ReactNode } = {}) {
  const copy = useCaptureCopy();
  const uploads = useUploadSettings();
  const capture = useCapture(uploads.categories);
  const { step, draft, posted, error } = capture;
  // A sent photo is watched until it's on the wall, so the success screen can say "look up",
  // or until the host declines it; its delete token lets the watch ask.
  const approval = usePhotoApproval(
    step === "done" ? (posted?.photo ?? null) : null,
    posted?.deleteToken,
  );

  if (!uploads.open && step === "pick") {
    return (
      <EventShell layout="wide" eventName={uploads.eventName} presentation={uploads.presentation}>
        <EmptyState
          icon={<PauseCircle strokeWidth={1.8} />}
          title={copy.closedTitle}
          description={uploads.closedMessage}
          headingLevel={2}
          className="my-auto"
        />
      </EventShell>
    );
  }

  return (
    <EventShell layout="wide" eventName={uploads.eventName} presentation={uploads.presentation}>
      {step === "pick" ? (
        // On a phone the photos sit centred in the room above, and the headline and buttons at
        // the foot of the screen, in reach of a thumb; side by side on a wide screen.
        <div className="flex flex-1 flex-col gap-8 lg:grid lg:flex-none lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="flex flex-1 flex-col justify-center gap-4 lg:flex-none">
            {introNotice}
            {/* Room around the tilted cards, so their corners stay inside the gutter and the header gap. */}
            <div className="px-2 pt-2">
              <LiveWallPreview captionStyle={uploads.captionStyle} />
            </div>
          </div>
          <div className="flex flex-col pb-2 lg:pb-0">
            <IntroHero title={copy.title} body={copy.intro} />
            <div className="pt-6">
              {error && <ErrorNote message={copy.errors[error]} />}
              <PhotoPicker onPick={capture.pickFile} busy={capture.busy} />
            </div>
          </div>
        </div>
      ) : (
        error && (
          <div className="mt-6">
            <ErrorNote message={copy.errors[error]} />
          </div>
        )
      )}

      {(step === "compose" || step === "sending") && draft && (
        <ComposeForm
          previewUrl={draft.previewUrl}
          caption={capture.caption}
          onCaptionChange={capture.setCaption}
          categories={uploads.categories}
          captionStyle={uploads.captionStyle}
          tribe={capture.tribe}
          onTribeChange={capture.setTribe}
          consent={capture.consent}
          onConsentChange={capture.setConsent}
          canSubmit={capture.canSubmit}
          missing={capture.missing}
          sending={step === "sending"}
          onSubmit={capture.submit}
          onRetake={capture.retake}
        />
      )}

      {(step === "done" || step === "removed") && posted && (
        <SuccessView
          previewUrl={posted.previewUrl}
          caption={posted.photo.caption}
          captionStyle={uploads.captionStyle}
          hashtag={uploads.hashtag}
          live={approval.live}
          slow={approval.slow}
          declined={approval.state === "declined"}
          removed={step === "removed"}
          busy={capture.busy}
          onAnother={capture.reset}
          onRemove={capture.removePosted}
        />
      )}
    </EventShell>
  );
}
