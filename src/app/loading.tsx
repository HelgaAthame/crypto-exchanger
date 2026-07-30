import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-xl items-center justify-center gap-2 px-5 py-24 text-sm text-muted">
      <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
      Loading…
    </div>
  );
}
