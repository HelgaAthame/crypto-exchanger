"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
};

type Props = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Labels the trigger for assistive tech; the visible label sits outside. */
  ariaLabel: string;
};

/**
 * Listbox-pattern replacement for a native <select>, so the control can be
 * styled like the rest of the form. Focus stays on the trigger and the active
 * option is announced through aria-activedescendant, which keeps the keyboard
 * contract equivalent to the native element.
 */
export function SelectMenu({ value, options, onChange, ariaLabel }: Props) {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    options.findIndex((o) => o.value === value),
    0
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const typeahead = useRef({ query: "", at: 0 });

  const selected = options[selectedIndex];
  const optionId = (i: number) => `${baseId}-option-${i}`;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option in view as the user arrows through the list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
      ?.scrollIntoView({ block: "nearest" });
  });

  function openMenu(startAt = selectedIndex) {
    setActiveIndex(startAt);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const { key } = event;

    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      commit(activeIndex);
      return;
    }
    if (key === "Tab") {
      setOpen(false);
      return;
    }

    const moves: Record<string, number> = {
      ArrowDown: activeIndex + 1,
      ArrowUp: activeIndex - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (key in moves) {
      event.preventDefault();
      setActiveIndex(Math.min(Math.max(moves[key], 0), options.length - 1));
      return;
    }

    // Type-ahead: typing "e" repeatedly cycles matches, as a native select does.
    if (key.length === 1 && /\S/.test(key)) {
      const now = Date.now();
      const state = typeahead.current;
      state.query = now - state.at > 800 ? key : state.query + key;
      state.at = now;

      const q = state.query.toLowerCase();
      const from = state.query.length === 1 ? activeIndex + 1 : activeIndex;
      const order = [
        ...options.slice(from),
        ...options.slice(0, from),
      ];
      const match = order.find(
        (o) => o.value.toLowerCase().startsWith(q) || o.label.toLowerCase().startsWith(q)
      );
      if (match) setActiveIndex(options.indexOf(match));
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="flex w-full items-center gap-2.5 rounded-xl border border-control-border bg-background px-3.5 py-3 text-left text-sm font-medium transition-colors hover:border-accent/50 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        {selected?.icon}
        <span className="min-w-0 flex-1 truncate">
          <span>{selected?.value}</span>
          {selected?.hint && (
            <span className="ml-2 font-normal text-muted">{selected.hint}</span>
          )}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={option.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  isActive ? "bg-accent/10" : ""
                }`}
              >
                {option.icon}
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{option.value}</span>
                  {option.hint && <span className="ml-2 text-muted">{option.hint}</span>}
                </span>
                {isSelected && <Check className="size-3.5 shrink-0 text-accent" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
