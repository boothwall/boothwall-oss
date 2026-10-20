import { UnlockBackdrop } from "./UnlockBackdrop";
import { UnlockForm } from "./UnlockForm";

/** The locked desk: its shape blurred behind, the passcode card in front. Nothing loads before. */
export function UnlockScreen({
  onUnlock,
  error,
  checking = false,
}: {
  onUnlock: (passcode: string) => void;
  error: string | null;
  checking?: boolean;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <UnlockBackdrop />
      <UnlockForm onUnlock={onUnlock} error={error} checking={checking} />
    </main>
  );
}
