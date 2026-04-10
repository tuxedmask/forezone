"use client";

import { useState } from "react";
import AliasCard from "./AliasCard";

export default function AliasModalTrigger({
  currentAlias,
  fallbackName,
}: {
  currentAlias: string | null;
  fallbackName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
  type="button"
  onClick={() => setOpen(true)}
  aria-label="Edit display name"
  className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#31294c] bg-[#141122] text-[#c7c3da] transition-all duration-200 hover:bg-[#1b1730] hover:text-white hover:border-indigo-400/40 hover:shadow-[0_0_12px_rgba(99,102,241,0.4)]"
>
<span className="rotate-[90deg] transition-transform duration-200 group-hover:scale-110">
  ✎
</span>
</button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[28px] border border-[#31294c] bg-[linear-gradient(180deg,#151125,#0d0a17)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9f96c7]">
                  Edit Alias
                </div>
                <div className="mt-1 text-sm text-[#c7c3da]">
                  Choose the name shown on your profile, picks, and leaderboard.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close alias editor"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#31294c] bg-[#141122] text-[#c7c3da] transition hover:bg-[#1b1730] hover:text-white"
              >
                ×
              </button>
            </div>

            <AliasCard
              currentAlias={currentAlias}
              fallbackName={fallbackName}
              compact
              onSaved={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}