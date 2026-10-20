import { Polaroid } from "#kit";

import { BOOTH_PHOTOS } from "../fixtures/boothPhotos";
import { PreviewSection } from "./PreviewSection";

const [hero, first, second, third, fourth] = BOOTH_PHOTOS;

const GRID = [
  { src: first, caption: "Booth crew!", tilt: -2.5 },
  { src: second, caption: "Demo day", tilt: 1.5 },
  { src: third, caption: "Hi from row 3", tilt: -1.5 },
  { src: fourth, caption: "", tilt: 3 },
];

export function PolaroidSection() {
  return (
    <PreviewSection title="Polaroid" note="Brand geometry: 7 : 31 paper, r4 card, Kalam caption.">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="w-64 shrink-0 self-center lg:self-start">
          <Polaroid
            src={hero}
            alt="Two friends at the booth holding up their badges"
            tilt={-2}
            caption="Best night of the year"
          />
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
          {GRID.map((photo, index) => (
            <li key={photo.src}>
              <Polaroid
                size="sm"
                src={photo.src}
                alt=""
                caption={photo.caption}
                tilt={photo.tilt}
                badge={
                  index === 0 ? (
                    <span className="rounded-pill bg-primary px-2.5 py-1 text-label font-semibold text-on-primary">
                      New
                    </span>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </PreviewSection>
  );
}
