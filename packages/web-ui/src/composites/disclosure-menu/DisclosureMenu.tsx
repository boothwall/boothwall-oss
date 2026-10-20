import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "#foundations";
import { buttonVariants } from "#primitives";

export type DisclosureMenuItem = {
  id: string;
  label: string;
  /** Decorative; the label names the item. */
  icon?: ReactNode;
  /** Something quiet on the right, e.g. a check on the current item. */
  trailing?: ReactNode;
  /** Marks the page you're on (`aria-current`). */
  current?: boolean;
  /** Draws a hairline above the item, to start a new group. */
  separated?: boolean;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** A link item that opens in a new tab, e.g. a page to keep beside this one. */
  external?: boolean;
} & ({ href: string; onSelect?: () => void } | { href?: undefined; onSelect: () => void });

/** What a link item needs to render, for apps that route without full page loads. */
export type DisclosureMenuLinkProps = {
  href: string;
  className: string;
  "aria-current"?: "page";
  target?: "_blank";
  rel?: "noreferrer";
  onClick: (event: MouseEvent) => void;
  children: ReactNode;
};

export type DisclosureMenuProps = {
  /** Names the button and the list; shown as the button's text unless `trigger` is given. */
  label: string;
  /** Decorative, before the label. */
  icon?: ReactNode;
  /** Replaces the button's content and look, e.g. an avatar or the current item's name. */
  trigger?: { content: ReactNode; className?: string };
  /** Shown above the items, e.g. a short title. */
  header?: ReactNode;
  items: readonly DisclosureMenuItem[];
  /** Which edge of the button the list lines up with. */
  align?: "start" | "end";
  width?: "sm" | "md";
  /** On a phone, the list rises from the bottom of the screen, where a thumb can reach it. */
  sheetOnPhone?: boolean;
  /** Renders link items, e.g. with a router's link; a plain `<a>` otherwise. */
  renderLink?: (props: DisclosureMenuLinkProps) => ReactNode;
};

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-sm font-medium text-ink transition hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-40";

const plainLink = ({ children, ...props }: DisclosureMenuLinkProps) => <a {...props}>{children}</a>;

/**
 * A few occasional actions behind one button, as a disclosure (a button and a list of links and
 * buttons), so it reads out plainly and Tab walks through it. Escape closes it and puts focus
 * back on the button; a tap outside or tabbing away closes it too.
 */
export function DisclosureMenu({
  label,
  icon,
  trigger,
  header,
  items,
  align = "end",
  width = "sm",
  sheetOnPhone,
  renderLink = plainLink,
}: DisclosureMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    setOpen(false);
    button.current?.focus();
  };

  const onBlur = (event: FocusEvent) => {
    if (!root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={trigger ? label : undefined}
        onClick={() => setOpen((current) => !current)}
        className={
          trigger
            ? trigger.className
            : cn(buttonVariants({ variant: "secondary" }), "px-3", open && "bg-surface-strong")
        }
      >
        {trigger ? (
          trigger.content
        ) : (
          <>
            {icon}
            {label}
          </>
        )}
      </button>
      {sheetOnPhone && open && (
        <div aria-hidden className="fixed inset-0 z-40 bg-canvas/70 backdrop-blur-sm sm:hidden" />
      )}
      <div
        id={listId}
        hidden={!open}
        className={cn(
          "absolute top-full z-50 mt-2 flex flex-col gap-0.5 rounded-card border border-line bg-surface-solid p-1.5 shadow-paper animate-pop-in",
          width === "sm" ? "w-64" : "w-80",
          align === "end" ? "right-0" : "left-0",
          sheetOnPhone &&
            "max-sm:fixed max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:mt-0 max-sm:w-auto max-sm:rounded-b-none max-sm:border-b-0 max-sm:p-3 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:animate-sheet-in",
        )}
      >
        {header}
        <ul aria-label={label} className="flex flex-col gap-0.5">
          {items.map((item) => {
            const select = () => {
              setOpen(false);
              item.onSelect?.();
            };
            const className = cn(
              itemClass,
              item.current && "bg-surface",
              item.tone === "danger" && "text-danger",
            );
            const content = (
              <>
                {item.icon && (
                  <span className="flex size-5 shrink-0 items-center justify-center text-ink-muted">
                    {item.icon}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.trailing}
              </>
            );
            return (
              <li
                key={item.id}
                className={cn(item.separated && "mt-1.5 border-t border-line pt-1.5")}
              >
                {item.href ? (
                  renderLink({
                    href: item.href,
                    className,
                    "aria-current": item.current ? "page" : undefined,
                    ...(item.external && { target: "_blank", rel: "noreferrer" }),
                    onClick: select,
                    children: content,
                  })
                ) : (
                  <button
                    type="button"
                    onClick={select}
                    disabled={item.disabled}
                    className={className}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
