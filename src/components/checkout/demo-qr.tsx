/**
 * A QR-shaped placeholder, not a real QR code: it is deliberately not
 * scannable, so no wallet can ever read a payment target from this screen.
 * The pattern is derived from the request id so it stays stable per request.
 */
export function DemoQr({ seed, size = 21 }: { seed: string; size?: number }) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const cells: boolean[] = [];
  let state = hash >>> 0;
  for (let i = 0; i < size * size; i++) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    cells.push(state % 100 < 46);
  }

  const isFinder = (row: number, col: number) => {
    const inBox = (r0: number, c0: number) =>
      row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };

  const finderFilled = (row: number, col: number) => {
    const r = row < 7 ? row : row - (size - 7);
    const c = col < 7 ? col : col - (size - 7);
    const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
    return ring !== 2;
  };

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Decorative QR placeholder — not scannable"
      className="size-40 rounded-xl bg-white p-2 shadow-sm"
    >
      {Array.from({ length: size * size }, (_, i) => {
        const row = Math.floor(i / size);
        const col = i % size;
        const filled = isFinder(row, col) ? finderFilled(row, col) : cells[i];
        if (!filled) return null;
        return <rect key={i} x={col} y={row} width={1} height={1} fill="#111" />;
      })}
    </svg>
  );
}
