"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Ticket, Users, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RegistrationEventConfig {
  id: string;
  eventName: string;
  slug: string;
  isActive: boolean;
  capacity: number | null;
  registrationClosesAt: string | Date | null;
  waitingListEnabled: boolean;
  approvedCount: number;
}

/**
 * Lets an administrator close or re-open the guest registration link for an
 * event. Closing sets the event config inactive, which immediately makes the
 * public registration endpoint reject new submissions. When the approved guest
 * count reaches the event capacity the control surfaces the "capacity reached"
 * state so the team can close the link.
 */
export function RegistrationControl({ configs }: { configs: RegistrationEventConfig[] }) {
  const router = useRouter();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  const closeRegistration = async (config: RegistrationEventConfig) => {
    setClosingId(config.id);
    try {
      const res = await fetch(`/api/admin/guests/${config.id}/registration/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not close registration.");
      }
      toast.success(`Registration closed for ${config.eventName}.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not close registration.");
    } finally {
      setClosingId(null);
    }
  };

  const reopenRegistration = async (config: RegistrationEventConfig) => {
    setReopeningId(config.id);
    try {
      const res = await fetch(`/api/admin/guests/${config.id}/registration/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not reopen registration.");
      }
      toast.success(`Registration reopened for ${config.eventName}.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reopen registration.");
    } finally {
      setReopeningId(null);
    }
  };

  if (configs.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-[#0875D1]" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Event Registration Links
        </h2>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Close an event registration link to stop new guest submissions instantly, or reopen it when
        the event team is ready again.
      </p>

      <div className="space-y-3">
        {configs.map((config) => {
          const isClosed = !config.isActive;
          const capacityReached =
            config.capacity != null && config.approvedCount >= config.capacity;
          const busyClosing = closingId === config.id;
          const busyReopening = reopeningId === config.id;

          return (
            <div
              key={config.id}
              className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">{config.eventName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{config.slug}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                    isClosed
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60"
                  )}
                >
                  {isClosed ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {isClosed ? "Registration Closed" : "Registration Open"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <Users className="h-3 w-3 text-[#0875D1]" />
                  Capacity: {config.capacity ?? "Unbounded"}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="h-3 w-3 text-[#0875D1]" />
                  Approved guests: {config.approvedCount}
                </span>
                {config.waitingListEnabled && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <Users className="h-3 w-3 text-[#0875D1]" />
                    Waiting list: enabled
                  </span>
                )}
              </div>

              {capacityReached && !isClosed && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  Capacity reached ({config.approvedCount}
                  {config.capacity != null ? ` of ${config.capacity}` : ""}). The registration link
                  is still open — close it now to stop new submissions.
                </div>
              )}

              <div className="flex items-center gap-2">
                {isClosed ? (
                  <button
                    type="button"
                    disabled={busyReopening}
                    onClick={() => reopenRegistration(config)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-60 cursor-pointer",
                      "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    )}
                  >
                    {busyReopening ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Reopen Registration
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyClosing}
                    onClick={() => closeRegistration(config)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-60 cursor-pointer",
                      "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
                    )}
                  >
                    {busyClosing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    Close Registration
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
