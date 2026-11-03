import { z } from "zod";
import {
  AREA_OF_INTEREST_VALUES,
  ATTENDANCE_VALUES,
  COMPANION_VALUES,
  GUEST_FIELD_LIMITS,
  REFERRAL_SOURCE_VALUES,
  STAKEHOLDER_CATEGORY_VALUES,
} from "./constants";

/** Digits-only canonical value used for duplicate detection. */
export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function textField(min: number, max: number, label: string) {
  return z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)
    .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value), {
      message: `${label} contains invalid characters`,
    });
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .or(z.literal(""));

export const guestRegistrationSchema = z
  .object({
    fullName: textField(2, GUEST_FIELD_LIMITS.fullName, "Full name"),
    organization: textField(2, GUEST_FIELD_LIMITS.organization, "Organization / Institution"),
    position: textField(2, GUEST_FIELD_LIMITS.position, "Position / Role"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .max(GUEST_FIELD_LIMITS.email, "Email address is too long")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .max(GUEST_FIELD_LIMITS.phone, "Phone number is too long")
      .refine((value) => {
        const digits = normalizePhone(value);
        return digits.length >= 7 && digits.length <= 15;
      }, "Enter a valid phone number, including the country code where possible"),
    stakeholderCategory: z.enum(STAKEHOLDER_CATEGORY_VALUES, {
      errorMap: () => ({ message: "Select your stakeholder category" }),
    }),
    attendanceIntent: z.enum(ATTENDANCE_VALUES, {
      errorMap: () => ({ message: "Tell us whether you will attend" }),
    }),
    companionCount: z.enum(COMPANION_VALUES, {
      errorMap: () => ({ message: "Select the number of accompanying guests" }),
    }),
    areasOfInterest: z
      .array(z.enum(AREA_OF_INTEREST_VALUES))
      .min(1, "Select at least one area of interest")
      .max(AREA_OF_INTEREST_VALUES.length)
      .refine((values) => new Set(values).size === values.length, {
        message: "Duplicate areas of interest are not allowed",
      }),
    hasAccessibilityNeeds: z.boolean({
      errorMap: () => ({ message: "Tell us if you have accessibility requirements" }),
    }),
    accessibilityDetails: optionalText(GUEST_FIELD_LIMITS.accessibilityDetails),
    mediaConsent: z.boolean({
      errorMap: () => ({ message: "Select a photography and media consent option" }),
    }),
    referralSource: z.enum(REFERRAL_SOURCE_VALUES, {
      errorMap: () => ({ message: "Tell us how you heard about JANIC 2026" }),
    }),
    additionalComments: optionalText(GUEST_FIELD_LIMITS.additionalComments),
    accuracyConfirmed: z.boolean().refine((value) => value === true, {
      message: "Please confirm that the information provided is accurate",
    }),
    privacyConsent: z.boolean().refine((value) => value === true, {
      message: "Please accept the privacy notice to continue",
    }),
    // Honeypot: real guests never see or fill this field.
    website: z.string().max(0, "Invalid submission").optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.hasAccessibilityNeeds && !data.accessibilityDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accessibilityDetails"],
        message: "Please specify your accessibility or special requirements",
      });
    }
  });

export type GuestRegistrationInput = z.infer<typeof guestRegistrationSchema>;

export type GuestFormErrors = Partial<Record<keyof GuestRegistrationInput, string>>;

export const GUEST_FORM_STEPS = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Tell us who you are and how we can reach you.",
    fields: ["fullName", "organization", "position", "phone", "email"] as const,
  },
  {
    id: "attendance",
    title: "Attendance & Interests",
    description: "Confirm your attendance and what you would like to explore.",
    fields: [
      "stakeholderCategory",
      "attendanceIntent",
      "companionCount",
      "areasOfInterest",
    ] as const,
  },
  {
    id: "requirements",
    title: "Requirements & Consent",
    description: "Help us prepare an accessible and well-documented event.",
    fields: [
      "hasAccessibilityNeeds",
      "accessibilityDetails",
      "mediaConsent",
      "referralSource",
      "additionalComments",
    ] as const,
  },
  {
    id: "confirm",
    title: "Review & Confirm",
    description: "Check your details and submit your registration.",
    fields: ["accuracyConfirmed", "privacyConsent"] as const,
  },
] as const;

/** Converts Zod issues into a flat field -> first message map. */
export function toFieldErrors(error: z.ZodError): GuestFormErrors {
  const errors: GuestFormErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof GuestFormErrors] = issue.message;
    }
  }
  return errors;
}
