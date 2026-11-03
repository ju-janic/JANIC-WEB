import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/permissions/roles";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";
import { GuestStatusBadge } from "@/components/admin/GuestStatusBadge";
import {
  AREA_OF_INTEREST_LABELS,
  ATTENDANCE_LABELS,
  COMPANION_LABELS,
  REFERRAL_SOURCE_LABELS,
  STAKEHOLDER_CATEGORY_LABELS,
} from "@/lib/guests/constants";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Ticket,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatDateTime(date: Date, timeZone?: string | null): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || "Africa/Mogadishu",
  }).format(date);
}

export default async function AdminGuestRegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth(null, "events:read");
  const { id } = await params;
  const registration = await GuestRegistrationRepository.findByIdForAdmin(id);
  if (!registration) notFound();

  const config = registration.eventConfig;
  const areas = asStringArray(registration.areasOfInterest);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/admin/guests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Guest Registrations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {registration.fullName}
            </h1>
            <GuestStatusBadge status={registration.status} />
          </div>
          <p className="font-mono text-xs font-bold text-[#0875D1]">
            {registration.registrationRef}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Submitted
          </p>
          <p className="mt-0.5 text-xs font-semibold text-foreground">
            {formatDateTime(registration.submittedAt, config.timezone)}
          </p>
          <p className="text-[10px] text-muted-foreground">{config.timezone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: guest answers */}
        <div className="lg:col-span-2 space-y-4">
          <Section title="Personal Information" icon={User}>
            <Grid>
              <Item label="Full Name" value={registration.fullName} />
              <Item label="Organization / Institution" value={registration.organization} />
              <Item label="Position / Role" value={registration.position} />
              <Item label="Email Address" value={registration.email} />
              <Item label="Phone Number" value={registration.phone} />
              <Item label="Referral Source" value={REFERRAL_SOURCE_LABELS[registration.referralSource] ?? registration.referralSource} />
            </Grid>
          </Section>

          <Section title="Attendance & Interests" icon={CalendarDays}>
            <Grid>
              <Item
                label="Stakeholder Category"
                value={STAKEHOLDER_CATEGORY_LABELS[registration.stakeholderCategory] ?? registration.stakeholderCategory}
              />
              <Item
                label="Attendance Intent"
                value={ATTENDANCE_LABELS[registration.attendanceIntent] ?? registration.attendanceIntent}
              />
              <Item
                label="Accompanying Guests"
                value={COMPANION_LABELS[registration.companionCount] ?? registration.companionCount}
              />
              <Item
                label="Areas of Interest"
                value={
                  areas.length
                    ? areas.map((area) => AREA_OF_INTEREST_LABELS[area] ?? area).join(", ")
                    : "None selected"
                }
                full
              />
            </Grid>
          </Section>

          <Section title="Accessibility, Consent & Comments" icon={ShieldCheck}>
            <Grid>
              <Item label="Accessibility Needs" value={yesNo(registration.hasAccessibilityNeeds)} />
              <Item label="Media Consent" value={yesNo(registration.mediaConsent)} />
              <Item
                label="Accessibility Details"
                value={registration.accessibilityDetails || "None provided"}
                full
              />
              <Item
                label="Additional Comments"
                value={registration.additionalComments || "None provided"}
                full
              />
              <Item label="Accuracy Confirmed" value={yesNo(registration.accuracyConfirmed)} />
              <Item label="Privacy Consent" value={yesNo(registration.privacyConsent)} />
            </Grid>
          </Section>

          <Section title="Activity Log" icon={Clock}>
            {registration.activityLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {registration.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-foreground">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateTime(log.createdAt, config.timezone)}
                      </span>
                    </div>
                    {log.actorLabel && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Actor: {log.actorLabel}
                      </p>
                    )}
                    {log.details != null && (
                      <pre className="mt-1.5 overflow-x-auto rounded bg-card p-2 text-[10px] text-muted-foreground">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right: event + record */}
        <div className="space-y-4">
          <Section title="Event" icon={Ticket}>
            <div className="space-y-3 text-xs">
              <p className="font-bold text-foreground">{config.eventName}</p>
              {config.eventDate && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: config.timezone,
                  }).format(config.eventDate)}
                </p>
              )}
              <p className="flex items-start gap-2 text-muted-foreground">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                {config.startTime} – {config.endTime}
              </p>
              {(config.venue || config.location) && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                  {[config.venue, config.location].filter(Boolean).join(", ")}
                </p>
              )}
              {config.contactEmail && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                  <a href={`mailto:${config.contactEmail}`} className="hover:underline">
                    {config.contactEmail}
                  </a>
                </p>
              )}
              {config.contactPhone && (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                  <a href={`tel:${config.contactPhone.replace(/\s+/g, "")}`} className="hover:underline">
                    {config.contactPhone}
                  </a>
                </p>
              )}
            </div>
          </Section>

          <Section title="Registration Record" icon={CheckCircle2}>
            <dl className="space-y-2 text-[11px]">
              <Record label="Reference" value={registration.registrationRef} mono />
              <Record label="Status" value={registration.status} />
              <Record label="Guest ID" value={registration.guestId || "Not issued (Phase 2)"} />
              <Record label="Source" value={registration.source} />
              <Record label="Approval mode at submit" value={registration.approvalModeAtSubmit || "—"} />
              <Record
                label="Config version at submit"
                value={registration.configVersionAtSubmit != null ? String(registration.configVersionAtSubmit) : "—"}
              />
              <Record
                label="Applied rules version"
                value={registration.appliedRulesVersion != null ? String(registration.appliedRulesVersion) : "—"}
              />
              <Record label="Eligibility verdict" value={registration.eligibilityVerdict || "—"} />
              <Record label="IP address" value={registration.ipAddress || "Not recorded"} />
              <Record label="Reviewed at" value={registration.reviewedAt ? formatDateTime(registration.reviewedAt, config.timezone) : "Not reviewed"} />
            </dl>
          </Section>

          <Section title="Invitation, Check-in & Email" icon={Mail}>
            <dl className="space-y-2 text-[11px]">
              <Record
                label="Invitation"
                value={registration.invitations.length ? registration.invitations[0].status : "Not issued (Phase 2)"}
              />
              <Record
                label="Check-in"
                value={
                  registration.checkIns.length
                    ? formatDateTime(registration.checkIns[0].checkedInAt, config.timezone)
                    : "Not checked in"
                }
              />
              <Record
                label="Emails sent"
                value={`${registration.emailLogs.filter((log) => log.status === "SENT").length} sent / ${registration.emailLogs.length} logged`}
              />
            </dl>
            <p className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
              Invitation, QR check-in and guest email delivery are Phase 2 features. Their data
              tables already exist and will attach to this registration record.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#0875D1]" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

function Item({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-foreground break-words whitespace-pre-line">{value}</p>
    </div>
  );
}

function Record({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
