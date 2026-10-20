import { usePolling } from "@boothwall/event-ui/browser-hooks";
import { useEventLease, useEventRuntime } from "@boothwall/event-ui/runtime";
import type { PhotoDTO } from "@boothwall/shared";
import { useCallback, useMemo, useRef, useState } from "react";

import { createBasicPhotoClient } from "../data";

export function useControlPhotos(onFailure: (error: unknown) => void, onSuccess: () => void) {
  const { transport } = useEventRuntime();
  const client = useMemo(() => createBasicPhotoClient(transport), [transport]);
  const capture = useEventLease();
  const revision = useRef(0);
  const pageCount = useRef(1);
  const activeMutation = useRef(false);
  const [pending, setPending] = useState<PhotoDTO[]>([]);
  const [approved, setApproved] = useState<PhotoDTO[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (activeMutation.current) return;
    const current = ++revision.current;
    const active = capture();
    try {
      const [waiting, page] = await Promise.all([
        client.fetchPending(),
        client.fetchApprovedPages(pageCount.current),
      ]);
      if (!active() || current !== revision.current) return;
      setPending(waiting);
      setApproved(page.photos);
      setCursor(page.nextCursor);
      setLoaded(true);
    } catch (error) {
      if (active() && current === revision.current) onFailure(error);
    }
  }, [capture, client, onFailure]);
  usePolling(refresh, 5000, true);
  const act = useCallback(
    async (photo: PhotoDTO, action: "approve" | "remove") => {
      if (activeMutation.current) return false;
      activeMutation.current = true;
      revision.current++;
      const active = capture();
      setBusy(photo.id);
      try {
        if (action === "approve") {
          const next = await client.approvePhoto(photo.id);
          if (active()) setApproved((rows) => [next, ...rows.filter((row) => row.id !== photo.id)]);
        } else await client.removePhoto(photo.id);
        if (active()) {
          setPending((rows) => rows.filter((row) => row.id !== photo.id));
          if (action === "remove") setApproved((rows) => rows.filter((row) => row.id !== photo.id));
          onSuccess();
        }
        return active();
      } catch (error) {
        if (active()) onFailure(error);
        return false;
      } finally {
        activeMutation.current = false;
        if (active()) setBusy(null);
      }
    },
    [capture, client, onFailure, onSuccess],
  );
  const more = useCallback(async () => {
    if (!cursor || activeMutation.current) return;
    activeMutation.current = true;
    const current = ++revision.current;
    const active = capture();
    setBusy("more");
    try {
      const page = await client.fetchApproved(cursor);
      if (active() && current === revision.current) {
        setApproved((rows) => [
          ...rows,
          ...page.photos.filter((p) => !rows.some((r) => r.id === p.id)),
        ]);
        setCursor(page.nextCursor);
        pageCount.current++;
      }
    } catch (error) {
      if (active()) onFailure(error);
    } finally {
      activeMutation.current = false;
      if (active()) setBusy(null);
    }
  }, [capture, client, cursor, onFailure]);
  return { pending, approved, loaded, busy, cursor, refresh, act, more };
}

export type ControlPhotos = ReturnType<typeof useControlPhotos>;
