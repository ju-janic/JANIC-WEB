import nodemailer from "nodemailer";
import type { Mail } from "nodemailer";
import path from "path";
import fs from "fs";

type Transporter = Mail;
type MailOptions = Parameters<Transporter["sendMail"]>[0];

/**
 * Outbound email system for JANIC.
 *
 * Uses inline CID (Content-ID) attachments so logos and icons render 100% reliably
 * in Gmail, Outlook, Apple Mail, and Yahoo without being blocked or stripped.
 */

const HOST = process.env.SMTP_HOST?.trim();
const USER = process.env.SMTP_USER?.trim();
/** Gmail app passwords are displayed in spaced groups — the spaces are not part of it. */
const PASSWORD = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");
const PORT = Number(process.env.SMTP_PORT?.trim() || 587);
const SECURE = process.env.SMTP_SECURE?.trim() === "true";
const TO = process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || USER;

const FROM_NAME = "JANIC Portal";
const FROM_ADDRESS = USER || "no-reply@localhost";

export type MailResult = { sent: boolean; error?: string; skipped?: boolean };

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(HOST && USER && PASSWORD);
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: SECURE,
    auth: { user: USER, pass: PASSWORD },
    requireTLS: !SECURE,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

/** Wraps a send so callers never need try/catch and never see a rejection. */
async function send(options: MailOptions): Promise<MailResult> {
  const tx = getTransporter();
  if (!tx) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[mail] SMTP not configured — skipping send to", TO);
    }
    return { sent: false, skipped: true };
  }
  try {
    await tx.sendMail({ from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, ...options });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown mail error";
    console.error("[mail] send failed:", message);
    return { sent: false, error: message };
  }
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteUrl(p: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${p}`;
}

const label = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

/* ------------------------------------------------------------------ */
/*  Visual Themes & Styles                                            */
/* ------------------------------------------------------------------ */

export type EmailTheme = {
  headerBg: string;
  accentBorder: string;
  primaryColor: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  pillLabel: string;
  pillIconCid: string;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  iconPrefix: string;
  btnShadow: string;
};

export const EMAIL_THEMES: Record<string, EmailTheme> = {
  // 1. Community Services: Official JANIC Royal Navy & Blue
  community: {
    headerBg: "#08245C",
    accentBorder: "#0875D1",
    primaryColor: "#0875D1",
    pillBg: "#EFF6FF",
    pillBorder: "#BFDBFE",
    pillText: "#0875D1",
    pillLabel: "COMMUNITY SERVICE REQUEST",
    pillIconCid: "pill-bell-blue",
    cardBg: "#F8FAFC",
    cardBorder: "#E2E8F0",
    iconBg: "#EFF6FF",
    iconPrefix: "blue",
    btnShadow: "0 2px 8px rgba(8, 117, 209, 0.25)",
  },
  // 2. Partnership Inquiries: Prestigious Deep Forest Emerald
  partnership: {
    headerBg: "#064E3B",
    accentBorder: "#10B981",
    primaryColor: "#059669",
    pillBg: "#ECFDF5",
    pillBorder: "#A7F3D0",
    pillText: "#065F46",
    pillLabel: "PARTNERSHIP INQUIRY",
    pillIconCid: "pill-handshake-emerald",
    cardBg: "#F0FDF4",
    cardBorder: "#BBF7D0",
    iconBg: "#DCFCE7",
    iconPrefix: "emerald",
    btnShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
  },
  // 3. Contact Messages: Prestigious Deep Royal Indigo
  contact: {
    headerBg: "#312E81",
    accentBorder: "#6366F1",
    primaryColor: "#4F46E5",
    pillBg: "#EEF2FF",
    pillBorder: "#C7D2FE",
    pillText: "#4338CA",
    pillLabel: "NEW CONTACT MESSAGE",
    pillIconCid: "pill-mail-violet",
    cardBg: "#F5F3FF",
    cardBorder: "#DDD6FE",
    iconBg: "#EDE9FE",
    iconPrefix: "violet",
    btnShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
  },
  // 4. Status Update - Approved / Success
  statusSuccess: {
    headerBg: "#064E3B",
    accentBorder: "#10B981",
    primaryColor: "#059669",
    pillBg: "#ECFDF5",
    pillBorder: "#A7F3D0",
    pillText: "#065F46",
    pillLabel: "STATUS UPDATE",
    pillIconCid: "pill-check-emerald",
    cardBg: "#F0FDF4",
    cardBorder: "#BBF7D0",
    iconBg: "#DCFCE7",
    iconPrefix: "emerald",
    btnShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
  },
  // 5. Status Update - In Review / Progress
  statusInfo: {
    headerBg: "#08245C",
    accentBorder: "#0875D1",
    primaryColor: "#0875D1",
    pillBg: "#EFF6FF",
    pillBorder: "#BFDBFE",
    pillText: "#0875D1",
    pillLabel: "STATUS UPDATE",
    pillIconCid: "pill-update-blue",
    cardBg: "#F8FAFC",
    cardBorder: "#E2E8F0",
    iconBg: "#EFF6FF",
    iconPrefix: "blue",
    btnShadow: "0 2px 8px rgba(8, 117, 209, 0.25)",
  },
};

export type DetailField = {
  iconName: string; // e.g. "org", "phone", "email", etc.
  label: string;
  value: string;
};

/** Gathers required inline CID attachments for reliable Gmail rendering */
function buildAttachments(
  refIconName: string,
  pillIconCid: string,
  iconPrefix: string,
  iconNames: string[],
  hasCta: boolean
): Array<{ filename: string; path: string; cid: string }> {
  const cwd = process.cwd();
  const list: Array<{ filename: string; path: string; cid: string }> = [];

  const add = (filename: string, cid: string, subfolder: string = "") => {
    const fullPath = subfolder
      ? path.join(cwd, "public/images", subfolder, filename)
      : path.join(cwd, "public/images", filename);
    if (fs.existsSync(fullPath) && !list.some((x) => x.cid === cid)) {
      list.push({ filename, path: fullPath, cid });
    }
  };

  // 1. Logos
  add("janic-logo-white-badge.png", "janic-logo-white-badge");
  add("janic-logo-blue-badge.png", "janic-logo-blue-badge");

  // 2. Shield icon
  add("shield-gray.png", "shield-gray", "email-icons");

  // 3. Pill icon
  add(`${pillIconCid}.png`, pillIconCid, "email-icons");

  // 4. Section list icon
  add(`${iconPrefix}-list.png`, `${iconPrefix}-list`, "email-icons");

  // 5. Reference icon
  add(`${refIconName}.png`, refIconName, "email-icons");

  // 6. Arrow for CTA
  if (hasCta) {
    add("arrow-right-white.png", "arrow-right-white", "email-icons");
  }

  // 7. Field icons
  for (const name of iconNames) {
    add(`${name}.png`, name, "email-icons");
  }

  return list;
}

/** Renders high-end HTML email layout matching the exact design */
export function renderEmailLayout(opts: {
  theme: EmailTheme;
  title: string;
  preheader: string;
  referenceLabel: string;
  referenceValue: string;
  refIconName: string; // e.g. "ref-doc-white", "ref-mail-white"
  sectionTitle?: string;
  fields: DetailField[];
  descriptionTitle?: string;
  descriptionSubtitle?: string;
  description?: string;
  cta?: { label: string; url: string };
}): { html: string; attachments: Array<{ filename: string; path: string; cid: string }> } {
  const t = opts.theme;
  const cleanBody = (opts.description || "").trim();
  const cleanBodyHtml = escapeHtml(cleanBody).replace(/\r?\n/g, "<br />");

  // Track all icon CIDs used
  const iconCidList: string[] = [];

  // Build 2-column grid rows
  const gridRows: string[] = [];
  for (let i = 0; i < opts.fields.length; i += 2) {
    const left = opts.fields[i];
    const right = opts.fields[i + 1];

    const renderCell = (f?: DetailField) => {
      if (!f) return "";
      const iconCid = `${t.iconPrefix}-${f.iconName}`;
      if (!iconCidList.includes(iconCid)) iconCidList.push(iconCid);
      const isEmail = f.label.toLowerCase() === "email" || f.value.includes("@");

      return `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="42" valign="middle" style="width: 42px; padding-right: 12px; text-align: left;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="38" height="38" style="width: 38px; height: 38px; border-collapse: separate;">
                <tr>
                  <td width="38" height="38" align="center" valign="middle" style="width: 38px; height: 38px; border-radius: 50%; background-color: ${t.iconBg}; text-align: center; vertical-align: middle;">
                    <img src="cid:${iconCid}" width="18" height="18" style="display: block; margin: 0 auto; width: 18px; height: 18px; border: 0;" alt="" />
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle" style="text-align: left;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 500; color: #64748B; margin-bottom: 2px; text-align: left;">
                ${escapeHtml(f.label)}
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #0F172A; line-height: 1.35; word-break: break-word; text-align: left;">
                ${
                  isEmail
                    ? `<a href="mailto:${escapeHtml(f.value)}" style="color: ${t.primaryColor}; text-decoration: underline;">${escapeHtml(f.value)}</a>`
                    : escapeHtml(f.value)
                }
              </div>
            </td>
          </tr>
        </table>`;
    };

    gridRows.push(`
      <tr>
        <td width="50%" align="left" valign="middle" style="padding: 10px 16px 10px 0; text-align: left;">
          ${renderCell(left)}
        </td>
        <td width="50%" align="left" valign="middle" style="padding: 10px 0 10px 16px; text-align: left;">
          ${renderCell(right)}
        </td>
      </tr>
    `);
  }

  const attachments = buildAttachments(
    opts.refIconName,
    t.pillIconCid,
    t.iconPrefix,
    iconCidList,
    Boolean(opts.cta)
  );

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin: 0; padding: 40px 16px; background-color: #EEF2F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0F172A;">
  <span style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #EEF2F6;">${escapeHtml(opts.preheader)}</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- 1. Header Banner (Solid, Prestigious Institutional Theme) -->
          <tr>
            <td align="left" dir="ltr" style="background-color: ${t.headerBg}; padding: 22px 32px; border-top-left-radius: 16px; border-top-right-radius: 16px; border-bottom: 3px solid ${t.accentBorder}; text-align: left;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" align="left" dir="ltr">
                <tr>
                  <!-- Left: Logo & Brand -->
                  <td valign="middle" align="left" dir="ltr" style="text-align: left;">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="left" dir="ltr">
                      <tr>
                        <td valign="middle" align="left" style="padding-right: 14px; line-height: 1;">
                          <img src="cid:janic-logo-white-badge" width="46" height="46" style="display: block; width: 46px; height: 46px; border-radius: 50%; border: 0; outline: none;" alt="JANIC" />
                        </td>
                        <td valign="middle" align="left" dir="ltr" style="text-align: left;">
                          <div align="left" dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; font-size: 19px; font-weight: 800; line-height: 1.1; letter-spacing: -0.01em; text-align: left;">JANIC</div>
                          <div align="left" dir="ltr" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; font-size: 11px; font-weight: 400; margin-top: 3px; letter-spacing: 0.01em; text-align: left;">Jazeera Nexus Innovation Center</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right: Tagline -->
                  <td valign="middle" align="right" style="text-align: right;">
                    <div align="right" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; font-size: 11px; font-weight: 500; letter-spacing: 0.03em; white-space: nowrap; text-align: right;">
                      Innovate &middot; Build &middot; Empower
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Main Body Content (Strictly Left-Aligned) -->
          <tr>
            <td style="padding: 32px 32px 28px; text-align: left;">

              <!-- Pill Badge (Contained in 100% width table so it never floats or collides with heading) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 14px;">
                <tr>
                  <td align="left" style="text-align: left;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: separate;">
                      <tr>
                        <td style="background-color: ${t.pillBg}; border: 1px solid ${t.pillBorder}; border-radius: 9999px; padding: 5px 14px; text-align: left;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="middle" style="padding-right: 6px; line-height: 1;">
                                <img src="cid:${t.pillIconCid}" width="13" height="13" style="display: block; width: 13px; height: 13px; border: 0;" alt="" />
                              </td>
                              <td valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: ${t.pillText}; line-height: 1; text-align: left;">
                                ${t.pillLabel}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Title & Subtitle (Cleanly stacked on separate lines) -->
              <h1 style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; line-height: 1.25; text-align: left; clear: both;">
                ${escapeHtml(opts.title)}
              </h1>
              <p style="margin: 0 0 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.55; color: #64748B; text-align: left; clear: both;">
                ${escapeHtml(opts.preheader)}
              </p>

              <!-- Reference ID Highlight Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${t.cardBg}; border: 1px solid ${t.cardBorder}; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: left;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" valign="middle" style="width: 48px; padding-right: 14px; text-align: left;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="48" height="48" style="width: 48px; height: 48px; border-collapse: separate;">
                            <tr>
                              <td width="48" height="48" align="center" valign="middle" style="width: 48px; height: 48px; border-radius: 12px; background-color: ${t.primaryColor}; text-align: center; vertical-align: middle;">
                                <img src="cid:${opts.refIconName}" width="24" height="24" style="display: block; margin: 0 auto; width: 24px; height: 24px; border: 0;" alt="" />
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="text-align: left;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11.5px; font-weight: 600; color: #64748B; letter-spacing: 0.02em; margin-bottom: 3px; text-align: left;">
                            ${escapeHtml(opts.referenceLabel)}
                          </div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 800; color: ${t.primaryColor}; letter-spacing: -0.01em; line-height: 1.15; text-align: left;">
                            ${escapeHtml(opts.referenceValue)}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section Divider & Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; margin: 22px 0 14px;">
                <tr>
                  <td width="20" valign="middle" style="width: 20px; padding-right: 8px; line-height: 1; text-align: left;">
                    <img src="cid:${t.iconPrefix}-list" width="16" height="16" style="display: block; width: 16px; height: 16px; border: 0;" alt="" />
                  </td>
                  <td width="auto" valign="middle" style="white-space: nowrap; padding-right: 14px; line-height: 1; text-align: left;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; font-weight: 800; color: #0F172A; letter-spacing: -0.01em;">
                      ${escapeHtml(opts.sectionTitle || "Request Details")}
                    </span>
                  </td>
                  <td width="100%" valign="middle">
                    <div style="border-top: 1px solid #E2E8F0; height: 1px; width: 100%;"></div>
                  </td>
                </tr>
              </table>

              <!-- 2-Column Details Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; margin: 6px 0 18px;">
                ${gridRows.join("")}
              </table>

              <!-- Description / Notes Callout Box (Clean Institutional Card with Divider) -->
              ${
                cleanBody || opts.descriptionSubtitle
                  ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${t.cardBg}; border: 1px solid ${t.cardBorder}; border-radius: 14px; margin: 20px 0 24px;">
                <tr>
                  <td style="padding: 18px 20px; text-align: left;">
                    
                    <!-- Header row: Icon on left, Label + Subject stacked beside it -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td width="46" valign="top" style="width: 46px; padding-right: 14px; text-align: left; line-height: 1;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="40" height="40" style="width: 40px; height: 40px; border-collapse: separate;">
                            <tr>
                              <td width="40" height="40" align="center" valign="middle" style="width: 40px; height: 40px; border-radius: 10px; background-color: ${t.primaryColor}; text-align: center; vertical-align: middle;">
                                <img src="cid:${opts.refIconName}" width="20" height="20" style="display: block; margin: 0 auto; width: 20px; height: 20px; border: 0;" alt="" />
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="text-align: left;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: ${t.primaryColor}; text-transform: uppercase; letter-spacing: 0.06em; line-height: 1.2; margin-bottom: 4px; text-align: left;">
                            ${escapeHtml(opts.descriptionTitle || "Request Details")}
                          </div>
                          ${
                            opts.descriptionSubtitle
                              ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #0F172A; line-height: 1.35; text-align: left;">${escapeHtml(opts.descriptionSubtitle)}</div>`
                              : ""
                          }
                        </td>
                      </tr>
                    </table>

                    <!-- Clean Divider & Body Text (Zero-indentation, strictly left-aligned) -->
                    ${
                      cleanBody
                        ? `<div style="border-top: 1px solid ${t.cardBorder}; margin: 14px 0 12px; height: 1px; line-height: 1px; font-size: 1px;"></div><div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.6; color: #334155; text-align: left;">${cleanBodyHtml}</div>`
                        : ""
                    }

                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- Primary CTA Button (Solid, Gradient-Free) -->
              ${
                opts.cta
                  ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" align="center" style="margin: 24px 0 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td align="center" style="border-radius: 9999px; background-color: ${t.primaryColor};">
                          <a href="${opts.cta.url}" target="_blank" style="display: inline-block; background-color: ${t.primaryColor}; color: #ffffff; text-decoration: none; padding: 13px 36px; border-radius: 9999px; box-shadow: ${t.btnShadow}; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                              <tr>
                                <td valign="middle" style="padding-right: 8px; line-height: 1;">
                                  <img src="cid:arrow-right-white" width="14" height="14" style="display: block; width: 14px; height: 14px; border: 0;" alt="" />
                                </td>
                                <td valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #ffffff; line-height: 1; white-space: nowrap;">
                                  ${escapeHtml(opts.cta.label)}
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- 3. Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px; padding-top: 22px; border-top: 1px solid #E2E8F0;">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Left: JANIC Blue Logo Badge -->
                        <td valign="middle" style="padding-right: 12px; line-height: 1;">
                          <img src="cid:janic-logo-blue-badge" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 50%;" alt="JANIC" />
                        </td>
                        <td valign="middle" align="left" style="padding-right: 18px; text-align: left;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #0F172A; line-height: 1.1;">JANIC</div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; color: #64748B; margin-top: 2px;">Jazeera Nexus Innovation Center</div>
                        </td>
                        <!-- Vertical Divider -->
                        <td valign="middle" style="border-left: 1px solid #CBD5E1; height: 32px; padding-left: 18px;"></td>
                        <!-- Right: University Faculty -->
                        <td valign="middle" align="left" style="text-align: left;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: #334155; line-height: 1.35;">
                            Faculty of Computer Science &amp; IT<br>
                            <span style="font-weight: 400; color: #64748B;">Jazeera University</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right: 6px; line-height: 1;">
                          <img src="cid:shield-gray" width="13" height="13" style="display: block; width: 13px; height: 13px; border: 0;" alt="" />
                        </td>
                        <td valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10.5px; line-height: 1.5; color: #94A3B8; text-align: center;">
                          This is an automated notification from JANIC. Please do not reply to this email.<br>
                          For assistance, contact the JANIC team through the portal.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, attachments };
}

/* ------------------------------------------------------------------ */
/*  Notification Handlers with Distinct Theming                       */
/* ------------------------------------------------------------------ */

/**
 * 1. Community Service Request Notification (Theme: Royal Tech Blue)
 */
export function notifyNewServiceRequest(d: {
  id: string;
  requestNumber: string;
  organizationName: string;
  organizationType: string;
  organizationCategory: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  serviceCategoryName?: string | null;
  serviceName?: string | null;
  requestTitle: string;
  description: string;
  budget?: string | null;
}): Promise<MailResult> {
  const fields: DetailField[] = [
    { iconName: "org", label: "Organization", value: d.organizationName },
    { iconName: "phone", label: "Phone", value: d.phone },
    {
      iconName: "orgType",
      label: "Organization Type",
      value: d.organizationType === "FOR_PROFIT" ? "For-Profit" : "Nonprofit",
    },
    { iconName: "location", label: "Location", value: `${d.city}, ${d.country}` },
    {
      iconName: "category",
      label: "Category",
      value: d.organizationCategory.replace(/_/g, " "),
    },
    {
      iconName: "service",
      label: "Service",
      value: label(d.serviceName ?? d.serviceCategoryName ?? "Technical Service"),
    },
    { iconName: "contact", label: "Contact", value: d.contactPerson },
    { iconName: "budget", label: "Budget", value: label(d.budget) },
    { iconName: "email", label: "Email", value: d.email },
  ];

  const rendered = renderEmailLayout({
    theme: EMAIL_THEMES.community,
    title: "New Community Service Request",
    preheader: `A new community service request has been submitted by ${d.organizationName} and is ready for review.`,
    referenceLabel: "Reference ID",
    referenceValue: d.requestNumber,
    refIconName: "ref-doc-white",
    sectionTitle: "Request Details",
    fields,
    descriptionTitle: "Request Details",
    descriptionSubtitle: d.requestTitle,
    description: d.description,
    cta: {
      label: "REVIEW REQUEST",
      url: siteUrl("/admin/community-services"),
    },
  });

  return send({
    to: TO,
    subject: `New service request ${d.requestNumber} — ${d.organizationName}`,
    text: [
      `New community service request ${d.requestNumber}`,
      `Organization: ${d.organizationName} (${d.organizationType})`,
      `Contact: ${d.contactPerson} <${d.email}>`,
      `Phone: ${d.phone}`,
      `Location: ${d.city}, ${d.country}`,
      `Service: ${d.serviceCategoryName ?? "—"} / ${d.serviceName ?? "—"}`,
      d.budget ? `Budget: ${d.budget}` : null,
      "",
      d.requestTitle,
      "",
      d.description,
    ]
      .filter(Boolean)
      .join("\n"),
    html: rendered.html,
    attachments: rendered.attachments,
  });
}

/**
 * 2. Partnership Inquiry Notification (Theme: Emerald Forest Green)
 */
export function notifyNewPartnershipInquiry(d: {
  id: string;
  organizationName: string;
  organizationType: string;
  contactName: string;
  email: string;
  phone?: string | null;
  collaborationArea: string;
  proposalDetails: string;
}): Promise<MailResult> {
  const fields: DetailField[] = [
    { iconName: "org", label: "Organization", value: d.organizationName },
    { iconName: "phone", label: "Phone", value: label(d.phone) },
    { iconName: "orgType", label: "Organization Type", value: d.organizationType },
    { iconName: "collab", label: "Collaboration Area", value: d.collaborationArea },
    { iconName: "contact", label: "Contact Person", value: d.contactName },
    { iconName: "email", label: "Email", value: d.email },
  ];

  const rendered = renderEmailLayout({
    theme: EMAIL_THEMES.partnership,
    title: "New Partnership Inquiry",
    preheader: `${d.organizationName} submitted a partnership proposal to collaborate on ${d.collaborationArea}.`,
    referenceLabel: "Organization",
    referenceValue: d.organizationName,
    refIconName: "ref-handshake-white",
    sectionTitle: "Partnership Details",
    fields,
    descriptionTitle: "Proposal Summary",
    descriptionSubtitle: d.collaborationArea,
    description: d.proposalDetails,
    cta: {
      label: "REVIEW PARTNERSHIP",
      url: siteUrl("/admin/partnerships"),
    },
  });

  return send({
    to: TO,
    subject: `New partnership inquiry — ${d.organizationName}`,
    text: [
      `New partnership inquiry from ${d.organizationName}`,
      `Type: ${d.organizationType}`,
      `Contact: ${d.contactName} <${d.email}>`,
      d.phone ? `Phone: ${d.phone}` : null,
      `Area: ${d.collaborationArea}`,
      "",
      d.proposalDetails,
    ]
      .filter(Boolean)
      .join("\n"),
    html: rendered.html,
    attachments: rendered.attachments,
  });
}

/**
 * 3. Contact Message Notification (Theme: Royal Indigo / Violet)
 */
export function notifyNewContactMessage(d: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}): Promise<MailResult> {
  const fields: DetailField[] = [
    { iconName: "contact", label: "From", value: d.name },
    { iconName: "phone", label: "Phone", value: label(d.phone) },
    { iconName: "email", label: "Email", value: d.email },
    { iconName: "subject", label: "Subject", value: d.subject },
  ];

  const rendered = renderEmailLayout({
    theme: EMAIL_THEMES.contact,
    title: "New Contact Message",
    preheader: `${d.name} sent "${d.subject}" through the website contact form.`,
    referenceLabel: "Message From",
    referenceValue: d.name,
    refIconName: "ref-mail-white",
    sectionTitle: "Message Details",
    fields,
    descriptionTitle: "Message Content",
    descriptionSubtitle: d.subject,
    description: d.message,
    cta: {
      label: "VIEW INBOX MESSAGE",
      url: siteUrl("/admin/messages"),
    },
  });

  return send({
    to: TO,
    subject: `New contact message — ${d.subject}`,
    text: [
      `New message from ${d.name}`,
      `Email: ${d.email}`,
      d.phone ? `Phone: ${d.phone}` : null,
      `Subject: ${d.subject}`,
      "",
      d.message,
    ]
      .filter(Boolean)
      .join("\n"),
    html: rendered.html,
    attachments: rendered.attachments,
  });
}

/**
 * 4. Staff/Requester Notification When Request Status Changes
 */
export function notifyServiceRequestStatusChange(d: {
  requestNumber: string;
  toStatus: string;
  toEmail?: string | null;
  notes?: string | null;
}): Promise<MailResult> {
  const pretty = d.toStatus.replace(/_/g, " ").toLowerCase();
  const isApproved = d.toStatus === "APPROVED" || d.toStatus === "COMPLETED";
  const theme = isApproved ? EMAIL_THEMES.statusSuccess : EMAIL_THEMES.statusInfo;

  const fields: DetailField[] = [
    { iconName: "service", label: "Reference ID", value: d.requestNumber },
    { iconName: "status", label: "Updated Status", value: pretty.toUpperCase() },
  ];

  const rendered = renderEmailLayout({
    theme,
    title: "Service Request Update",
    preheader: `Your service request ${d.requestNumber} is now ${pretty}.`,
    referenceLabel: "Reference ID",
    referenceValue: d.requestNumber,
    refIconName: isApproved ? "ref-check-white" : "ref-doc-white",
    sectionTitle: "Update Details",
    fields,
    descriptionTitle: "Message from JANIC Team",
    description: d.notes || undefined,
    cta: {
      label: "VIEW REQUEST STATUS",
      url: siteUrl("/community-services"),
    },
  });

  return send({
    to: d.toEmail && d.toEmail.includes("@") ? d.toEmail : TO,
    subject: `Your JANIC service request ${d.requestNumber} is now ${pretty}`,
    text: [
      `Your service request ${d.requestNumber} has been updated.`,
      `Status: ${pretty}`,
      d.notes ? `Notes: ${d.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    html: rendered.html,
    attachments: rendered.attachments,
  });
}

/**
 * Sends a fully-formed email to an explicit recipient.
 * Used by the guest notification service; the shared wrapper guarantees the
 * caller never sees a thrown rejection.
 */
export async function sendEmail(options: MailOptions): Promise<MailResult> {
  return send(options);
}

/** Verifies SMTP connectivity without sending anything. */
export async function verifyMailTransport(): Promise<{ ok: boolean; message: string }> {
  const tx = getTransporter();
  if (!tx) {
    return {
      ok: false,
      message: "SMTP is not configured (missing SMTP_HOST / SMTP_USER / SMTP_PASSWORD).",
    };
  }
  try {
    await tx.verify();
    return { ok: true, message: `SMTP connection verified for ${USER}.` };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : "Verification failed" };
  }
}