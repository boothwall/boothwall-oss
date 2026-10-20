import { catchAllOf, type Category, type PhotoDTO, type Tribe } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createCaptureClient } from "#features/capture/data";
import { resizeImage } from "#lib/image";
import { EventApiError, useEventLease, useEventRuntime } from "#runtime";

import { captureCopy, type CaptureErrorKey } from "./useCaptureCopy";

type Draft = { image: Blob; thumb: Blob; previewUrl: string };
type Posted = { photo: PhotoDTO; deleteToken: string; previewUrl: string };

/** What the guest still has to do before sending: tick the consent box, pick a category, or both. */
export type MissingStep = "consent" | "category" | "both";

const missingStep = (hasCategory: boolean, consent: boolean): MissingStep =>
  hasCategory ? "consent" : consent ? "category" : "both";

export type CaptureStep = "pick" | "compose" | "sending" | "done" | "removed";

/** Which message explains an upload problem; the page puts it in the visitor's language. */
const errorKeyFor = (error: unknown): CaptureErrorKey =>
  error instanceof EventApiError && error.code in captureCopy("en").errors
    ? (error.code as CaptureErrorKey)
    : "generic";

/**
 * `categories` is the live list: a pick that has since been removed counts as no pick. Until
 * the guest picks one, the photo goes to the catch-all, so picking is optional when there is one.
 */
export function useCapture(categories: readonly Category[]) {
  const { transport } = useEventRuntime();
  const client = useMemo(() => createCaptureClient(transport), [transport]);
  const capture = useEventLease();
  const operation = useRef(0);
  const sending = useRef(false);
  const [step, setStep] = useState<CaptureStep>("pick");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [posted, setPosted] = useState<Posted | null>(null);
  const [caption, setCaption] = useState("");
  const [picked, setTribe] = useState<Tribe | null>(null);
  const tribe =
    picked !== null && categories.some((category) => category.id === picked)
      ? picked
      : (catchAllOf(categories) ?? null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<CaptureErrorKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!draft) return;
    return () => URL.revokeObjectURL(draft.previewUrl);
  }, [draft]);

  const pickFile = useCallback(
    async (file: File) => {
      const lease = capture();
      const current = ++operation.current;
      const active = () => lease() && current === operation.current;
      if (!active() || sending.current) return;
      setError(null);
      setBusy(true);
      try {
        const { image, thumb } = await resizeImage(file);
        if (!active()) return;
        setDraft({ image, thumb, previewUrl: URL.createObjectURL(image) });
        setStep("compose");
      } catch {
        if (active()) setError("DECODE");
      } finally {
        if (active()) setBusy(false);
      }
    },
    [capture],
  );

  const submit = useCallback(async () => {
    const active = capture();
    if (!active() || sending.current || !draft || !tribe || !consent) return;
    sending.current = true;
    setError(null);
    setStep("sending");
    try {
      const { photo, deleteToken } = await client.uploadPhoto({
        image: draft.image,
        thumb: draft.thumb,
        caption,
        tribe,
      });
      if (!active()) return;
      setPosted({ photo, deleteToken, previewUrl: draft.previewUrl });
      setStep("done");
    } catch (err) {
      if (active()) {
        setError(errorKeyFor(err));
        setStep("compose");
      }
    } finally {
      sending.current = false;
    }
  }, [caption, consent, draft, tribe, client, capture]);

  const removePosted = useCallback(async () => {
    const active = capture();
    if (!active() || !posted) return;
    setBusy(true);
    try {
      await client.removeOwnPhoto(posted.photo.id, posted.deleteToken);
      if (active()) setStep("removed");
    } catch (err) {
      if (active()) setError(errorKeyFor(err));
    } finally {
      if (active()) setBusy(false);
    }
  }, [posted, client, capture]);

  /** Back to the picker for another photo; the caption, category and consent stay. */
  const retake = useCallback(() => {
    operation.current++;
    setDraft(null);
    setError(null);
    setStep("pick");
  }, []);

  const reset = useCallback(() => {
    operation.current++;
    setDraft(null);
    setPosted(null);
    setCaption("");
    setError(null);
    setStep("pick");
  }, []);

  return {
    step,
    draft,
    posted,
    caption,
    setCaption,
    tribe,
    setTribe,
    consent,
    setConsent,
    error,
    busy,
    canSubmit: Boolean(draft && tribe && consent),
    /** What still stops the guest sending (once there's a photo). */
    missing: missingStep(tribe !== null, consent),
    pickFile,
    submit,
    removePosted,
    retake,
    reset,
  };
}
