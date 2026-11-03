import { SignJWT, jwtVerify } from "jose";

/**
 * Short-lived, signed proof that the holder just completed a registration.
 * It only carries internal ids — never guest personal data — so the
 * confirmation URL can be shared or reloaded without exposing the record.
 */
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "janic_super_secret_session_jwt_key_2026_xYz987!@"
);

const ISSUER = "janic-guest-registration";
const AUDIENCE = "guest-registration-confirmation";
const EXPIRY = "7d";

export interface GuestConfirmationClaims {
  registrationId: string;
  eventSlug: string;
}

export async function createGuestConfirmationToken(
  claims: GuestConfirmationClaims
): Promise<string> {
  return new SignJWT({ reg: claims.registrationId, slug: claims.eventSlug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(SECRET_KEY);
}

export async function verifyGuestConfirmationToken(
  token: string | null | undefined
): Promise<GuestConfirmationClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.reg !== "string" || typeof payload.slug !== "string") {
      return null;
    }
    return { registrationId: payload.reg, eventSlug: payload.slug };
  } catch {
    return null;
  }
}
