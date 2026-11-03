"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutomationConfig {
  id: string;
  eventName: string;
  slug: string;
  automationEnabled: boolean;
  approvalMode: string;
}

/**
 * Lets an administrator switch an event between manual review and automatic
 * approval. Automatic mode approves every new registration instantly.
 */
export function AutomationControl({ configs }: { configs: AutomationConfig[] }) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(configs.map((config) => [config.id, config.automationEnabled]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  if (configs.length === 0) return null;

  const update = async (config: AutomationConfig, automatic: boolean) => {
    if (state[config.id] === automatic && (config.approvalMode !== "MANUAL") === automatic) {
      return;
    }
    setSaving(config.id);
    setState((prev) => ({ ...prev, [config.id]: automatic }));
    try {
      const res = await fetch("/api/admin/guests/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventConfigId: config.id, automatic }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not update the approval flow.");
      }
      toast.success(data.data?.message ?? "Approval flow updated.");
      router.refresh();
    } catch (error) {
      setState((prev) => ({ ...prev, [config.id]: !automatic }));
      toast.error(error instanceof Error ? error.message : "Could not update the approval flow.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-[#0875D1]" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Approval Flow
        </h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Choose how new registrations are processed for each event.
      </p>

      <div className="mt-3 space-y-3">
        {configs.map((config) => {
          const automatic = state[config.id];
          const busy = saving === config.id;
          return (
            <div
              key={config.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">{config.eventName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {automatic
                    ? "New registrations are approved instantly."
                    : "New registrations wait for a reviewer."}
                </p>
              </div>
              <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => update(config, false)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-60",
                    !automatic
                      ? "bg-[#08245C] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="h-3 w-3" />
                  Manual
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => update(config, true)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-60",
                    automatic
                      ? "bg-emerald-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Automatic
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
