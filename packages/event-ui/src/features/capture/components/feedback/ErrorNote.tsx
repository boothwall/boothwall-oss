/** An upload problem, in words a visitor can act on. */
export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mb-5 rounded-control border border-primary/40 bg-primary/10 p-3.5 text-sm text-ink"
    >
      {message}
    </p>
  );
}
