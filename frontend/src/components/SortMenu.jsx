// src/components/SortMenu.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronDownIcon,
  StarIcon,
  FireIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

/**
 * useOnClickOutside - calls handler when a click/touch happens outside the ref
 */
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    function listener(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/**
 * SortMenu component
 * Props:
 *  - value: "best" | "hot" | "new" | "top" | "rising"
 *  - onChange: (newValue) => void
 */
export default function SortMenu({ value = "best", onChange = () => {} }) {
  const OPTIONS = [
    { key: "best", label: "Best", Icon: StarIcon },
    { key: "hot", label: "Hot", Icon: FireIcon },
    { key: "new", label: "New", Icon: ClockIcon },
    { key: "top", label: "Top", Icon: ArrowUpIcon },
    { key: "rising", label: "Rising", Icon: ArrowTrendingUpIcon },
  ];

  const containerRef = useRef(null);
  const itemsRef = useRef([]);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useOnClickOutside(containerRef, () => setOpen(false));

  // open -> focus the selected item
  useEffect(() => {
    if (open) {
      const idx = OPTIONS.findIndex((o) => o.key === value);
      const toFocus = idx >= 0 ? idx : 0;
      setFocusedIndex(toFocus);
      // small timeout so the menu finishes its enter animation
      setTimeout(() => {
        itemsRef.current[toFocus]?.focus();
      }, 80);
    } else {
      setFocusedIndex(-1);
    }
  }, [open, value]);

  // keyboard navigation when menu is open
  const onKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i < OPTIONS.length - 1 ? i + 1 : 0;
          itemsRef.current[next]?.focus();
          return next;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i > 0 ? i - 1 : OPTIONS.length - 1;
          itemsRef.current[next]?.focus();
          return next;
        });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < OPTIONS.length) {
          const selected = OPTIONS[focusedIndex];
          onChange(selected.key);
          setOpen(false);
        }
      }
    },
    [open, focusedIndex, onChange, OPTIONS]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  const current = OPTIONS.find((o) => o.key === value) || OPTIONS[0];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger button (pill) */}
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-full border border-reddit-border dark:border-reddit-dark_divider bg-white dark:bg-reddit-dark_card px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-reddit-blue hover:bg-gray-100 dark:hover:bg-reddit-dark_hover transition"
      >
        <span className="flex items-center gap-2">
          <current.Icon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
          <span className="text-reddit-text dark:text-reddit-dark_text font-medium">{current.label}</span>
        </span>
        <ChevronDownIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
      </button>

      {/* Dropdown */}
      <div
        role="menu"
        aria-orientation="vertical"
        className={`origin-top-left absolute left-0 mt-2 z-50 w-44 rounded-md shadow-lg bg-reddit-card dark:bg-reddit-dark_card border border-reddit-border dark:border-reddit-dark_divider transform transition-all duration-150 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="py-2">
          <div className="px-3 py-1 text-xs text-reddit-text_secondary dark:text-reddit-dark_text_secondary font-medium">
            Sort by
          </div>

          {OPTIONS.map((opt, idx) => {
            const active = opt.key === value;
            return (
              <button
                key={opt.key}
                ref={(el) => (itemsRef.current[idx] = el)}
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onChange(opt.key);
                    setOpen(false);
                  }
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm focus:outline-none ${
                  active
                    ? "bg-reddit-hover dark:bg-reddit-dark_hover font-semibold text-reddit-text dark:text-reddit-dark_text"
                    : "text-reddit-text_secondary dark:text-reddit-dark_text_secondary hover:bg-reddit-hover dark:hover:bg-reddit-dark_hover"
                }`}
              >
                <opt.Icon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />
                <span className="flex-1">{opt.label}</span>
                {active && <ChevronDownIcon className="h-4 w-4 text-reddit-icon dark:text-reddit-dark_icon" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
