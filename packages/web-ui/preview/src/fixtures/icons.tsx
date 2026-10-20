// A few stroke icons for the preview (the kit itself takes icons as props).
const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CameraIcon() {
  return (
    <svg {...stroke} className="size-5">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...stroke}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...stroke}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...stroke}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function InboxIcon() {
  return (
    <svg {...stroke}>
      <path d="M3 13l3-8h12l3 8v6H3z" />
      <path d="M3 13h5l1 2h6l1-2h5" />
    </svg>
  );
}
