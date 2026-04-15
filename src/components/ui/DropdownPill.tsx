"use client";

import { useEffect, useRef, useState } from "react";

interface DropdownPillProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  highlight?: boolean;
}

export default function DropdownPill({ label, value, options, onChange, highlight }: DropdownPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
          highlight ? "bg-yellow text-navy" : "text-navy hover:bg-black/5"
        }`}
      >
        <span className="text-muted font-semibold">{label}:</span>
        <span>{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[170px] bg-white rounded-xl shadow-xl border border-border py-2 z-20">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-1.5 text-[13px] transition-colors cursor-pointer ${
                opt === value ? "font-extrabold text-navy bg-black/[0.04]" : "font-medium text-muted hover:bg-black/[0.03] hover:text-navy"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
