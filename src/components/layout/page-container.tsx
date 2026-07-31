/**
 * Every screen — including the header and the landing page — shares one
 * container width, so nothing shifts as the user moves between pages.
 *
 * The width is the app's, not a text column's: an earlier pass capped content
 * at 42rem, which read as a narrow ribbon stranded in the middle of a wide
 * display. Pages fill this width by laying out in columns rather than by
 * stretching prose, and paragraphs get `max-w-prose` where they need it.
 */
export function PageContainer({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
