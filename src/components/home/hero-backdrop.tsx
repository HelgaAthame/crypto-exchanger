import Image from "next/image";

/**
 * The hero's background layer: a photograph under a heavy scrim, with the CSS
 * aurora and grid kept on top of it.
 *
 * The photo is desaturated and gold-tinted rather than shown as-is — most
 * crypto stock photography is blue, which would fight the gold identity
 * everywhere else on the page. Two scrims sit above it so the headline keeps
 * its contrast no matter how bright the image is behind any given word.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src="/photos/coins-in-hands.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-photo object-cover object-center"
      />
      {/* Tint pass: pushes the photo towards the brand's gold. */}
      <div className="absolute inset-0 bg-accent/25 mix-blend-color" />

      <div className="hero-aurora absolute -left-1/4 top-[-20%] size-[46rem] rounded-full opacity-70" />
      <div className="hero-aurora hero-aurora-slow absolute -right-1/4 top-[10%] size-[38rem] rounded-full opacity-60" />
      <div className="hero-grid absolute inset-0" />
      {/* Scrim: keeps text contrast independent of whatever sits behind it. */}
      <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/85 to-background" />
    </div>
  );
}
