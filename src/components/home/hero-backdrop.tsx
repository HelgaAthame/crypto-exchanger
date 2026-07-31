/**
 * The hero's background layer.
 *
 * Deliberately CSS-only: a photo of people or a video loop would suit the brand,
 * but stock footage needs a licence and attribution, and shipping an unlicensed
 * image in a portfolio piece is not a trade worth making. This composition —
 * drifting gold aurora over a fading grid — carries the same weight at a few
 * hundred bytes and no network cost.
 *
 * To swap in real media later: drop the file in `public/hero/`, render it as an
 * absolutely positioned <video muted loop playsInline> or <Image fill> directly
 * above this element, and keep the scrim below so text contrast survives
 * whatever the media looks like.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-aurora absolute -left-1/4 top-[-20%] size-[46rem] rounded-full opacity-70" />
      <div className="hero-aurora hero-aurora-slow absolute -right-1/4 top-[10%] size-[38rem] rounded-full opacity-60" />
      <div className="hero-grid absolute inset-0" />
      {/* Scrim: keeps text contrast independent of whatever sits behind it. */}
      <div className="absolute inset-0 bg-linear-to-b from-background/40 via-background/70 to-background" />
    </div>
  );
}
