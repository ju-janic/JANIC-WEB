import { randomBytes } from "crypto";
import QRCode from "qrcode";

/**
 * Secure QR/verification token helpers for guest invitations.
 *
 * The QR code never carries the guest's personal data — it only carries an
 * opaque, unguessable token that the backend resolves against the invitation
 * record. This keeps a stolen QR image from leaking personal information and
 * lets the backend revoke or re-verify any invitation.
 */

/** 32 random bytes → 43 url-safe characters. Fits the VarChar(128) column. */
export function generateQrToken(): string {
  return randomBytes(32).toString("base64url");
}

function appBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

/** The public URL that the QR code resolves to when scanned. */
export function buildVerificationUrl(qrToken: string): string {
  return `${appBaseUrl()}/verify/${qrToken}`;
}

/** Renders the QR code as a PNG data URL for inline delivery and downloads. */
export async function renderQrDataUrl(text: string, size = 480): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: { dark: "#08245CFF", light: "#FFFFFFFF" },
  });
}
