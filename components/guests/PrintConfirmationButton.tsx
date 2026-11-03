"use client";

import { Printer } from "lucide-react";

export function PrintConfirmationButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition print:hidden"
    >
      <Printer className="w-4 h-4" />
      Print Confirmation
    </button>
  );
}
