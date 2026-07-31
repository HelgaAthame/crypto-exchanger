"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades and lifts its children in the first time they scroll into view.
 *
 * Reveal-on-scroll has one classic failure: if the observer never fires — a
 * reduced-motion preference, an old browser, JS disabled mid-hydration — the
 * content is stranded at `opacity: 0`. So the hidden state is only ever applied
 * once we know the observer is running, and reduced motion skips it entirely.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Milliseconds, for staggering items within a group. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Already on screen at mount: show it without animating in.
    if (node.getBoundingClientRect().top < window.innerHeight) {
      setState("shown");
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setState("shown");
          observer.disconnect(); // Once only — never replays on scroll back up.
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${
        state === "static"
          ? ""
          : state === "hidden"
            ? "translate-y-6 opacity-0"
            : "translate-y-0 opacity-100"
      } transition-[opacity,transform] duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
