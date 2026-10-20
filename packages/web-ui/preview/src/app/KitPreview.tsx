import { LogoLockup, PageShell } from "#kit";

import { BrandSection } from "../sections/BrandSection";
import { ButtonsSection } from "../sections/ButtonsSection";
import { DialogSection } from "../sections/DialogSection";
import { EmptyStateSection } from "../sections/EmptyStateSection";
import { PolaroidSection } from "../sections/PolaroidSection";
import { TypeSection } from "../sections/TypeSection";

/** Every kit component on one page, in the brand theme. */
export function KitPreview() {
  return (
    <PageShell
      layout="wide"
      header={
        <header className="flex items-center justify-between py-2">
          <LogoLockup alt="BoothWall web kit" variant="self-hosted" size="sm" />
        </header>
      }
      source={{ href: "https://github.com/boothwall/boothwall-oss", handle: "ddedic" }}
    >
      <TypeSection />
      <ButtonsSection />
      <DialogSection />
      <PolaroidSection />
      <BrandSection />
      <EmptyStateSection />
    </PageShell>
  );
}
