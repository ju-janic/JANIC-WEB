import type { GuestEmailType } from "@prisma/client";
import { EMAIL_THEMES, renderEmailLayout, sendEmail, siteUrl, type DetailField } from "@/lib/mailer";
import { GuestRegistrationRepository } from "@/lib/repositories/guest-registration.repository";

/**
 * Branded guest notification emails (registration received, approved,
 * rejected). Every send is recorded in GuestEmailLog so the admin dashboard
 * can show real delivery status and support a resend action.
 */

export interface GuestEmailContext {
  registrationId: string;
  fullName: string;
  email: string;
  organization: string;
  phone: string;
  registrationRef: string;
  guestId?: string | null;
  eventName: string;
  eventDateLabel: string;
  eventTimeLabel: string;
  venueLabel: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rejectionReason?: string | null;
}

const ACCOUNT_URL = () => siteUrl("/account/registrations");

function guestDashboardFields(ctx: GuestEmailContext): DetailField[] {
  return [
    { iconName: "org", label: "Organization", value: ctx.organization },
    { iconName: "phone", label: "Phone", value: ctx.phone },
    { iconName: "email", label: "Email", value: ctx.email },
    {
      iconName: "status",
      label: "Event",
      value: `${ctx.eventName} · ${ctx.eventDateLabel}`,
    },
  ];
}

async function deliver(opts: {
  registrationId: string;
  type: GuestEmailType;
  recipient: string;
  subject: string;
  text: string;
  html: string;
  attachments: Array<{ filename: string; path: string; cid: string }>;
}): Promise<void> {
  const log = await GuestRegistrationRepository.logEmailStart({
    registrationId: opts.registrationId,
    type: opts.type,
    recipient: opts.recipient,
  });

  try {
    const result = await sendEmail({
      to: opts.recipient,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });

    if (result.sent) {
      await GuestRegistrationRepository.logEmailResult(log.id, "SENT", {});
    } else {
      await GuestRegistrationRepository.logEmailResult(log.id, "FAILED", {
        error: result.error ?? "Email service is not configured",
      });
    }
  } catch (error) {
    await GuestRegistrationRepository.logEmailResult(log.id, "FAILED", {
      error: error instanceof Error ? error.message : "Unknown email error",
    });
  }
}

export class GuestEmailService {
  /** Sent immediately after a guest submits a registration. */
  static async sendRegistrationReceived(ctx: GuestEmailContext): Promise<void> {
    const rendered = renderEmailLayout({
      theme: EMAIL_THEMES.statusInfo,
      title: "Registration received",
      preheader: `Thank you, ${ctx.fullName}. Your registration for ${ctx.eventName} has been received and is awaiting review.`,
      referenceLabel: "Registration Reference",
      referenceValue: ctx.registrationRef,
      refIconName: "ref-doc-white",
      sectionTitle: "Your Registration",
      fields: guestDashboardFields(ctx),
      descriptionTitle: "What happens next",
      description:
        "Our team is currently reviewing your application. You will receive another email as soon as a decision has been made. You can track your status at any time from your JANIC account.",
      cta: { label: "VIEW MY REGISTRATION", url: ACCOUNT_URL() },
    });

    await deliver({
      registrationId: ctx.registrationId,
      type: "REGISTRATION_RECEIVED",
      recipient: ctx.email,
      subject: `Registration received — ${ctx.eventName}`,
      text: [
        `Dear ${ctx.fullName},`,
        "",
        `Your registration for ${ctx.eventName} has been received.`,
        `Reference: ${ctx.registrationRef}`,
        "",
        "Our team is reviewing your application and will contact you with the outcome.",
      ].join("\n"),
      html: rendered.html,
      attachments: rendered.attachments,
    });
  }

  /** Sent when an administrator (or automation) approves a registration. */
  static async sendApproval(
    ctx: GuestEmailContext,
    type: Extract<GuestEmailType, "APPROVAL" | "AUTOMATED_APPROVAL"> = "APPROVAL"
  ): Promise<void> {
    const guestId = ctx.guestId ?? ctx.registrationRef;
    const rendered = renderEmailLayout({
      theme: EMAIL_THEMES.statusSuccess,
      title: "Your registration is approved",
      preheader: `Congratulations ${ctx.fullName}! Your invitation to ${ctx.eventName} is ready.`,
      referenceLabel: "Guest ID",
      referenceValue: guestId,
      refIconName: "ref-check-white",
      sectionTitle: "Your Invitation",
      fields: guestDashboardFields(ctx),
      descriptionTitle: "Event details",
      descriptionSubtitle: `${ctx.eventDateLabel} · ${ctx.eventTimeLabel}${ctx.venueLabel ? ` · ${ctx.venueLabel}` : ""}`,
      description:
        "Please present your QR code at the event entrance. You can view, download and print your personalized invitation from your JANIC account.",
      cta: { label: "VIEW MY INVITATION", url: ACCOUNT_URL() },
    });

    await deliver({
      registrationId: ctx.registrationId,
      type,
      recipient: ctx.email,
      subject: `You're invited — ${ctx.eventName} (${guestId})`,
      text: [
        `Dear ${ctx.fullName},`,
        "",
        `Your registration for ${ctx.eventName} has been approved.`,
        `Guest ID: ${guestId}`,
        `Date: ${ctx.eventDateLabel} · ${ctx.eventTimeLabel}`,
        ctx.venueLabel ? `Venue: ${ctx.venueLabel}` : null,
        "",
        "View your invitation and QR code:",
        ACCOUNT_URL(),
      ]
        .filter(Boolean)
        .join("\n"),
      html: rendered.html,
      attachments: rendered.attachments,
    });
  }

  /** Sent when an administrator rejects a registration. */
  static async sendRejection(ctx: GuestEmailContext): Promise<void> {
    const reason = ctx.rejectionReason?.trim();
    const rendered = renderEmailLayout({
      theme: EMAIL_THEMES.contact,
      title: "Registration update",
      preheader: `Thank you for your interest in ${ctx.eventName}. Unfortunately your registration was not approved.`,
      referenceLabel: "Registration Reference",
      referenceValue: ctx.registrationRef,
      refIconName: "ref-doc-white",
      sectionTitle: "Registration Details",
      fields: [
        { iconName: "contact", label: "Applicant", value: ctx.fullName },
        { iconName: "email", label: "Email", value: ctx.email },
        { iconName: "phone", label: "Phone", value: ctx.phone },
        { iconName: "subject", label: "Status", value: "Not approved" },
      ],
      descriptionTitle: "Reason",
      description:
        reason ||
        "If you believe this decision was made in error, please contact the JANIC events team.",
    });

    await deliver({
      registrationId: ctx.registrationId,
      type: "REJECTION",
      recipient: ctx.email,
      subject: `Registration update — ${ctx.eventName}`,
      text: [
        `Dear ${ctx.fullName},`,
        "",
        `Thank you for your interest in ${ctx.eventName}. Unfortunately, your registration was not approved.`,
        reason ? `Reason: ${reason}` : null,
        "",
        ctx.contactEmail ? `Contact: ${ctx.contactEmail}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      html: rendered.html,
      attachments: rendered.attachments,
    });
  }
}
