import { buttonVariants, cn } from "@boothwall/web-ui";
import { ExternalLink } from "lucide-react";

import { appPath, WALL_PATH } from "@/config";
import { controlCopy, FOCUS_LIFT } from "@/features/control/constants";

/** The wall in a new tab, for the display; an icon alone on a phone, still named in words. */
export function OpenWallLink() {
  return (
    <a
      href={appPath(WALL_PATH)}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({ variant: "secondary", size: "sm" }),
        FOCUS_LIFT,
        "max-lg:w-9 max-lg:px-0",
      )}
    >
      <ExternalLink aria-hidden className="size-4" strokeWidth={1.8} />
      <span className="max-lg:sr-only">{controlCopy.openWall}</span>
    </a>
  );
}
