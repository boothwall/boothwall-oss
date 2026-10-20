import demo01 from "#assets/demo/demo-01.jpg";
import demo02 from "#assets/demo/demo-02.jpg";
import demo03 from "#assets/demo/demo-03.jpg";
import demo04 from "#assets/demo/demo-04.jpg";
import demo05 from "#assets/demo/demo-05.jpg";
import demo06 from "#assets/demo/demo-06.jpg";
import demo07 from "#assets/demo/demo-07.jpg";
import demo08 from "#assets/demo/demo-08.jpg";
import demo09 from "#assets/demo/demo-09.jpg";
import demo10 from "#assets/demo/demo-10.jpg";
import demo11 from "#assets/demo/demo-11.jpg";
import demo12 from "#assets/demo/demo-12.jpg";
import demo13 from "#assets/demo/demo-13.jpg";
import demo14 from "#assets/demo/demo-14.jpg";
import demo15 from "#assets/demo/demo-15.jpg";
import demo16 from "#assets/demo/demo-16.jpg";
import demo17 from "#assets/demo/demo-17.jpg";
import demo18 from "#assets/demo/demo-18.jpg";
import demo19 from "#assets/demo/demo-19.jpg";
import demo20 from "#assets/demo/demo-20.jpg";
import demo21 from "#assets/demo/demo-21.jpg";
import demo22 from "#assets/demo/demo-22.jpg";
import demo23 from "#assets/demo/demo-23.jpg";
import demo24 from "#assets/demo/demo-24.jpg";
import { type BundledImage, imageUri } from "#platform/assets";

type DemoSource = { source: BundledImage; caption: string; category: string };

/**
 * Demo mode: 24 booth photos with made-up captions, so the wall looks lived-in
 * without showing anyone real. 600 px each; wall cards and the spotlight share one file,
 * because separate 320 px wall copies measured worse (the demo cycles through few enough
 * photos that both sizes end up decoded and cached). They ship inside the app, so the demo
 * needs no network. Metro and Vite only bundle static imports, so each file is listed. A
 * category that isn't in your config falls back to a weighted pick.
 */
const SOURCES: DemoSource[] = [
  { source: demo01, caption: "Two sticks, two smiles", category: "team" },
  { source: demo02, caption: "Up and running in a minute", category: "first-timers" },
  { source: demo03, caption: "Shipping it live", category: "team" },
  { source: demo04, caption: "The whole crew 🎉", category: "team" },
  { source: demo05, caption: "Filming the wall", category: "visiting" },
  { source: demo06, caption: "Live demo on stage", category: "regulars" },
  { source: demo07, caption: "Coffee and a demo ☕", category: "regulars" },
  { source: demo08, caption: "Hackathon crew 🍕", category: "friends" },
  { source: demo09, caption: "Scanning in", category: "first-timers" },
  { source: demo10, caption: "It's on the TV!", category: "first-timers" },
  { source: demo11, caption: "Couch-testing the remote", category: "friends" },
  { source: demo12, caption: "High five, it shipped", category: "team" },
  { source: demo13, caption: "Plugging in the Stick", category: "team" },
  { source: demo14, caption: "Showing off my app", category: "regulars" },
  { source: demo15, caption: "Coffee #3", category: "visiting" },
  { source: demo16, caption: "Couch co-op 🎮", category: "friends" },
  { source: demo17, caption: "Pair programming", category: "regulars" },
  { source: demo18, caption: "In full swing", category: "visiting" },
  { source: demo19, caption: "Thumbs up for D-pad focus", category: "regulars" },
  { source: demo20, caption: "Selfie time 📸", category: "friends" },
  { source: demo21, caption: "Remote in hand", category: "first-timers" },
  { source: demo22, caption: "Ask me anything", category: "team" },
  { source: demo23, caption: "Whiteboard session", category: "regulars" },
  { source: demo24, caption: "Team photo!", category: "team" },
];

/** How many photos demo mode has, one wall pool's worth. */
export const DEMO_PHOTO_COUNT = SOURCES.length;

export type DemoPhoto = { full: string; thumb: string; caption: string; category: string };

let photos: DemoPhoto[] | null = null;

/** Resolved on first use, so a live (non-demo) wall never pays for it at start-up. */
export function demoPhotos(): DemoPhoto[] {
  photos ??= SOURCES.map(({ source, caption, category }) => {
    const uri = imageUri(source);
    return { full: uri, thumb: uri, caption, category };
  });
  return photos;
}
