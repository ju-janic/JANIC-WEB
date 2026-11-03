"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestModerationActionsProps {
  registrationId: string;
  status: string;
  guestId?: string | null;
  guestName?: string;
  compact?: boolean;
}

/**
 * Approve / reject controls shared by the guest list and guest detail views.
 * The backend re-checks permissions; this component only drives the request.
 */
export function GuestModerationActions({
  registrationId,
  status,
  guestId,
  guestName,
  compact = false,
}: GuestModerationActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const approve = async () => {
    setPending("approve");
    try {
      const res = await fetch(`/api/admin/guests/${registrationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not approve this registration.");
      }
      toast.success(data.data?.message ?? "Registration approved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve this registration.");
    } finally {
      setPending(null);
    }
  };

  const reject = async () => {
    setPending("reject");
    try {
      const res = await fetch(`/api/admin/guests/${registrationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not reject this registration.");
      }
      toast.success(data.data?.message ?? "Registration rejected.");
      setRejectOpen(false);
      setReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reject this registration.");
    } finally {
      setPending(null);
    }
  };

  const isApproved = status === "APPROVED";

  return (
    <div className={cn("flex items-center gap-1.5", compact ? "justify-end" : "flex-wrap")}>
      {isApproved && guestId ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Check className="h-3 w-3" />
          {guestId}
        </span>
      ) : (
        <button
          type="button"
          onClick={approve}
          disabled={pending !== null}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
            compact ? "" : "px-3 py-2"
          )}
        >
          {pending === "approve" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Approve
        </button>
      )}

      {status !== "REJECTED" && (
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={pending !== null}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
            compact ? "" : "px-3 py-2"
          )}
        >
          <X className="h-3 w-3" />
          Reject
        </button>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-sm font-bold text-foreground">
              Reject {guestName ? guestName : "this registration"}?
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The applicant is emailed immediately. Any issued invitation is revoked.
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Optional reason shared with the applicant…"
              className="mt-3 w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(false);
                  setReason("");
                }}
                disabled={pending !== null}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={pending !== null}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {pending === "reject" && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
