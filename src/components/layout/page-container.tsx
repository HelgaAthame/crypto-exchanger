/**
 * The app has exactly two content widths. Screens use this instead of setting
 * their own max-width, so pages line up with the header instead of shifting
 * as the user moves between them.
 *
 * - `frame`   — the app frame: header, banner, ticker, the landing hero grid.
 * - `content` — every interior page.
 *
 * Horizontal padding is identical in both, so the left edge of the content
 * always aligns with the logo.
 */
export function PageContainer({
  variant = "content",
  className = "",
  children,
}: {
  variant?: "frame" | "content";
  className?: string;
  children: React.ReactNode;
}) {
  const width = variant === "frame" ? "max-w-5xl" : "max-w-2xl";
  return <div className={`mx-auto w-full ${width} px-4 sm:px-5 ${className}`}>{children}</div>;
}
