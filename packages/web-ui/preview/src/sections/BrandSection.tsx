import { LogoLockup, Polaroid, TvFrame } from "#kit";

import { BOOTH_PHOTOS } from "../fixtures/boothPhotos";
import { PreviewSection } from "./PreviewSection";

const TILTS = [-3, 2, -1.5, 2.5];

export function BrandSection() {
  return (
    <PreviewSection title="Logo and TV">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <LogoLockup alt="BoothWall" size="sm" />
          <LogoLockup alt="BoothWall" size="lg" />
          <LogoLockup alt="BoothWall" variant="self-hosted" />
          <div className="flex items-center gap-6">
            <LogoLockup alt="BoothWall" variant="symbol" size="lg" />
            <LogoLockup alt="BoothWall" variant="symbol" size="sm" />
          </div>
          <div className="flex flex-col items-start gap-5 self-stretch rounded-card bg-paper p-6">
            <LogoLockup alt="BoothWall" tone="on-light" />
            <LogoLockup alt="BoothWall" tone="on-light" variant="self-hosted" size="sm" />
          </div>
        </div>
        <TvFrame>
          <div className="flex size-full items-center justify-center gap-3 lg:gap-6">
            {BOOTH_PHOTOS.slice(0, 4).map((src, index) => (
              <Polaroid
                key={src}
                size="sm"
                src={src}
                alt=""
                tilt={TILTS[index]}
                className="w-1/5"
              />
            ))}
          </div>
        </TvFrame>
      </div>
    </PreviewSection>
  );
}
