import React from "react";
import Link from "next/link";
import { hasPermission, requireAuth } from "@/lib/permissions/roles";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { KpiRow } from "@/components/admin/KpiRow";
import { GuestStatusBadge } from "@/components/admin/GuestStatusBadge";
import { GuestModerationActions } from "@/components/admin/GuestModerationActions";
import { AutomationControl } from "@/components/admin/AutomationControl";
import { RegistrationControl } from "@/components/admin/RegistrationControl";
import {
  ATTENDANCE_LABELS,
  COMPANION_LABELS,
  STAKEHOLDER_CATEGORY_LABELS,
} from "@/lib/guests/constants";
import { ArrowRight, Search, Ticket, UserCheck, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "WAITLISTED"] as const;
type GuestStatus = (typeof STATUSES)[number];

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function formatDateTime(date: Date, timeZone?: string | null): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || "Africa/Mogadishu",
  }).format(date);
}

export default async function AdminGuestRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; status?: string | string[] }>;
}) {
  const user = await requireAuth(null, "events:read");
  const canModerate = await hasPermission(user.role, "events:update");

  const query = await searchParams;
  const search = single(query.q);
  const rawStatus = single(query.status).toUpperCase();
  const status = (STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as GuestStatus)
    : undefined;

  const [registrations, stats, configs] = await Promise.all([
    GuestRegistrationRepository.listForAdmin({ search: search || undefined, status }),
    GuestRegistrationRepository.statsForAdmin(),
    GuestRegistrationRepository.listConfigsForAdmin(),
  ]);

  const registrationConfigs = await Promise.all(
    configs.map(async (config) => ({
      ...config,
      approvedCount: await GuestRegistrationRepository.countApprovedForEvent(config.id),
    }))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Guest Registrations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review every registration, approve or reject guests, and issue their digital
            invitations and QR codes from here.
          </p>
        </div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
        >
          <Ticket className="w-3.5 h-3.5" />
          Manage Events
        </Link>
      </div>

      <KpiRow
        items={[
          { title: "Total Guests", value: stats.total, sub: "all registrations" },
          { title: "Pending", value: stats.pending, sub: "awaiting review" },
          { title: "Approved", value: stats.approved, sub: "confirmed" },
          {
            title: "Waitlisted",
            value: stats.waitlisted,
            sub: stats.rejected > 0 ? `${stats.rejected} rejected` : "capacity overflow",
          },
        ]}
      />

      {canModerate && configs.length > 0 && (
        <AutomationControl
          configs={configs.map((config) => ({
            id: config.id,
            eventName: config.eventName,
            slug: config.slug,
            automationEnabled: config.automationEnabled,
            approvalMode: config.approvalMode,
          }))}
        />
      )}

      {canModerate && registrationConfigs.length > 0 && (
        <RegistrationControl configs={registrationConfigs} />
      )}

      {/* Filters */}
      <form
        action="/admin/guests"
        method="get"
        className="flex flex-col sm:flex-row sm:items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search name, organization, email, phone or reference…"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="WAITLISTED">Waitlisted</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0875D1] hover:bg-[#0668bb] px-4 py-2.5 text-xs font-bold text-white transition"
        >
          Apply Filters
        </button>
        {(search || status) && (
          <Link
            href="/admin/guests"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs sm:text-sm">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                {canModerate && <th className="px-4 py-3">Decision</th>}
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={canModerate ? 8 : 7} className="px-4 py-16 text-center">
                    <UserCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="font-semibold text-foreground">No guest registrations found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {search || status
                        ? "Try clearing the filters."
                        : "Registrations submitted from the public event page will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-semibold text-foreground truncate">
                        {registration.fullName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {registration.organization}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-[#0875D1]">
                        {registration.registrationRef}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="truncate text-foreground">{registration.email}</p>
                      <p className="text-[11px] text-muted-foreground">{registration.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">
                        {STAKEHOLDER_CATEGORY_LABELS[registration.stakeholderCategory] ??
                          registration.stakeholderCategory}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{registration.position}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">
                        {ATTENDANCE_LABELS[registration.attendanceIntent] ??
                          registration.attendanceIntent}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {COMPANION_LABELS[registration.companionCount] ?? registration.companionCount}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(registration.submittedAt, registration.eventConfig.timezone)}
                    </td>
                    <td className="px-4 py-3">
                      <GuestStatusBadge status={registration.status} />
                    </td>
                    {canModerate && (
                      <td className="px-4 py-3">
                        <GuestModerationActions
                          registrationId={registration.id}
                          status={registration.status}
                          guestId={registration.guestId}
                          guestName={registration.fullName}
                          compact
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/guests/${registration.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-[#0875D1] hover:underline"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {registrations.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
            Showing {registrations.length} registration{registrations.length === 1 ? "" : "s"}
            {registrations.length >= 200 ? " (most recent 200)" : ""}.
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          New registrations always start as <strong>Pending</strong>. Approving a guest assigns a
          unique Guest ID, issues a branded digital invitation with a QR code, and emails the guest.
          In <strong>Automatic</strong> mode this happens the moment they register.
        </p>
      </div>
    </div>
  );
}
