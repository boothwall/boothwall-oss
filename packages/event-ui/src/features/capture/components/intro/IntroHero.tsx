export type IntroHeroProps = {
  title: string;
  body: string;
};

/** The upload page's headline and one line under it; the photos above do the explaining. */
export function IntroHero({ title, body }: IntroHeroProps) {
  return (
    <section className="text-center lg:text-left">
      <h1 className="text-display font-bold tracking-tight text-balance">{title}</h1>
      <p className="mt-2 text-body text-ink-muted">{body}</p>
    </section>
  );
}
