import { cn } from "@boothwall/web-ui";
import { type ReactNode, useId } from "react";

export type DeskCardProps = {
  title: string;
  /** Quiet words on the right of the title, or an action such as "See all". */
  note?: string;
  action?: ReactNode;
  /**
   * How a phone shows it: "card" as on a laptop; "bare" without the card around it and with
   * the title as an eyebrow; "untitled" bare with the title read out only.
   */
  phone?: "card" | "bare" | "untitled";
  className?: string;
  children: ReactNode;
};

/** One block of the desk: a titled card on a laptop. */
export function DeskCard({
  title,
  note,
  action,
  phone = "card",
  className,
  children,
}: DeskCardProps) {
  const titleId = useId();
  const bare = phone !== "card";
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-3.5 lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-5",
        !bare && "rounded-card border border-line bg-surface p-3.5",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          phone === "untitled" && "max-lg:sr-only",
        )}
      >
        <h2
          id={titleId}
          className={cn(
            "text-ui font-bold lg:text-lg",
            phone === "bare" &&
              "max-lg:text-label max-lg:font-semibold max-lg:tracking-eyebrow max-lg:text-ink-subtle max-lg:uppercase",
          )}
        >
          {title}
        </h2>
        {note && <span className="text-label text-ink-subtle max-lg:hidden">{note}</span>}
        {action}
      </div>
      {children}
    </section>
  );
}
