import { useCallback, useState } from "react";

const PASSCODE_KEY = "boothwall:passcode";
function readPasscode() {
  try {
    return sessionStorage.getItem(PASSCODE_KEY) ?? "";
  } catch {
    return "";
  }
}
/** Keep the operator credential in this tab, with an in-memory fallback. */
export function useControlSession() {
  const [passcode, setValue] = useState(readPasscode);
  const [error, setError] = useState<string | null>(null);
  const setPasscode = useCallback((value: string) => {
    try {
      if (value) sessionStorage.setItem(PASSCODE_KEY, value);
      else sessionStorage.removeItem(PASSCODE_KEY);
    } catch {
      /* Storage is optional; the mounted session still works. */
    }
    setValue(value);
    if (value) setError(null);
  }, []);
  return { passcode, setPasscode, error, setError };
}
