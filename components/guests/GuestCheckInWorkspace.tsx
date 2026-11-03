import React from "react";
import { QrCode, ShieldCheck, UserCheck } from "lucide-react";
import { requireAuth } from "@/lib/permissions/roles";
import { GuestCheckInService } from "@/lib/services/guest-check-in.service";
import { GuestCheckInScanner } from "@/components/staff/GuestCheckInScanner";
import { KpiRow } from "@/components/admin/KpiRow";

/**
 * Shared check-in workspace.
 *
 * Rendered by both /staff/check-in (STAFF + ADMIN) and /admin/check-in
 * (ADMIN + EDITOR) so the scanner UI and access rules stay identical.
 */
export async function GuestCheckInWorkspace() {
  const user = await requireAuth(null, "events:checkin");

  const [stats, recent] = await Promise.all([
    GuestCheckInService.stats(),
    GuestCheckInService.recent(25),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0875D1]/10 text-[#0875D1]">
              <QrCode className="h-5 w-5" />
            </span>
            Guest Check-in
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
            Scan a guest&apos;s invitation QR code to verify it is genuine, approved and
            unused before admitting them. Check-ins are recorded against the guest&apos;s
            registration.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Scanner access granted
        </span>
      </div>

      <KpiRow
        items={[
          {
            title: "Checked In Today",
            value: stats.checkedInToday,
            sub: "successful scans",
          },
          {
            title: "Total Check-ins",
            value: stats.checkedInTotal,
            sub: "all time",
          },
          {
            title: "Approved Guests",
            value: stats.approved,
            sub: "eligible to enter",
          },
          {
            title: "Awaiting Approval",
            value: stats.pending,
            sub: "not yet eligible",
          },
        ]}
      />

      <GuestCheckInScanner recent={recent} operatorName={user.name} />

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5">
        <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          A guest is admitted only when their registration is <strong>Approved</strong>,
          their invitation is <strong>Issued</strong> and not revoked or expired, and they
          have not already been checked in. If a scan is wrong, use the undo action next to
          the guest in the recent list.
        </p>
      </div>
    </div>
  );
}
