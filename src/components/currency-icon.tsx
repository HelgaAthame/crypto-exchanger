const ICON: Record<string, { glyph: string; from: string; to: string }> = {
  BTC: { glyph: "₿", from: "#f7931a", to: "#ffb84d" },
  ETH: { glyph: "Ξ", from: "#627eea", to: "#8fa2f5" },
  USDT: { glyph: "₮", from: "#26a17b", to: "#4ecfa5" },
  USDC: { glyph: "$", from: "#2775ca", to: "#5b9df0" },
  SOL: { glyph: "◎", from: "#9945ff", to: "#14f195" },
  BNB: { glyph: "◆", from: "#f0b90b", to: "#f8d55b" },
  USD: { glyph: "$", from: "#2f7a4d", to: "#5cbf85" },
  EUR: { glyph: "€", from: "#2c5fa8", to: "#5f97e0" },
  GBP: { glyph: "£", from: "#5b3b8a", to: "#9272c9" },
  JPY: { glyph: "¥", from: "#a83c4e", to: "#d97b8c" },
};

const FALLBACK = { glyph: "•", from: "#7a5a17", to: "#f4e2a1" };

export function CurrencyIcon({ code, className = "" }: { code: string; className?: string }) {
  const { glyph, from, to } = ICON[code] ?? FALLBACK;

  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold leading-none text-white shadow-sm ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {glyph}
    </span>
  );
}
