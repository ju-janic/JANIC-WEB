/**
 * Shared guest-registration domain constants.
 *
 * This file is deliberately free of server-only imports so the exact same
 * option values and labels are used by the public form and the backend
 * validator. Google Form wording is preserved for every option.
 */

export const GUEST_EVENT_TIMEZONE = "Africa/Mogadishu";
export const GUEST_DEFAULT_START_TIME = "09:00";
export const GUEST_DEFAULT_END_TIME = "17:00";
export const GUEST_REGISTRATION_COUNTER_KEY = "registration";

export const GUEST_FIELD_LIMITS = {
  fullName: 160,
  organization: 200,
  position: 160,
  email: 254,
  phone: 40,
  accessibilityDetails: 500,
  additionalComments: 1000,
} as const;

export interface GuestOption<T extends string = string> {
  value: T;
  label: string;
}

export const STAKEHOLDER_CATEGORIES = [
  { value: "GOVERNMENT", label: "Government" },
  { value: "PRIVATE_SECTOR", label: "Private Sector / Company" },
  { value: "UNIVERSITY_ACADEMIC", label: "University / Academic" },
  { value: "NGO_DEVELOPMENT", label: "NGO / Development Organization" },
  { value: "ENTREPRENEUR_STARTUP", label: "Entrepreneur / Startup" },
  { value: "PARENT_COMMUNITY", label: "Parent / Community" },
  { value: "STUDENT", label: "Student" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "MEDIA", label: "Media" },
  { value: "VIP_GUEST", label: "VIP / Guest" },
] as const satisfies readonly GuestOption[];

export const ATTENDANCE_OPTIONS = [
  { value: "ATTENDING", label: "Yes, I will attend" },
  { value: "NOT_ATTENDING", label: "No, I will not attend" },
  { value: "NOT_SURE", label: "I am not sure yet" },
] as const satisfies readonly GuestOption[];

export const COMPANION_OPTIONS = [
  { value: "NONE", label: "0 - No accompanying guests" },
  { value: "ONE", label: "1" },
  { value: "TWO", label: "2" },
  { value: "THREE", label: "3" },
  { value: "FOUR", label: "4" },
  { value: "FIVE_PLUS", label: "5 or more" },
] as const satisfies readonly GuestOption[];

export const AREAS_OF_INTEREST = [
  { value: "STUDENT_PROJECTS", label: "Student Projects" },
  { value: "PARTNERSHIP_OPPORTUNITIES", label: "Partnership Opportunities" },
  { value: "INTERNSHIP_OPPORTUNITIES", label: "Internship Opportunities" },
  { value: "EMPLOYMENT_OPPORTUNITIES", label: "Employment Opportunities" },
  { value: "RESEARCH_COLLABORATION", label: "Research Collaboration" },
  { value: "ENTREPRENEURSHIP_STARTUP", label: "Entrepreneurship / Startup Opportunities" },
  { value: "NETWORKING", label: "Networking" },
  { value: "MENTORSHIP_OPPORTUNITIES", label: "Mentorship Opportunities" },
  { value: "TECHNOLOGY_INNOVATION", label: "Technology and Innovation" },
  { value: "OTHER", label: "Other" },
] as const satisfies readonly GuestOption[];

export const ACCESSIBILITY_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
] as const;

export const MEDIA_CONSENT_OPTIONS = [
  { value: "YES", label: "Yes, I consent to photography and media coverage." },
  { value: "NO", label: "No, I do not consent to photography and media coverage." },
] as const;

export const REFERRAL_SOURCES = [
  { value: "UNIVERSITY_INSTITUTION", label: "University / Institution" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "EMAIL", label: "Email" },
  { value: "FRIEND_COLLEAGUE", label: "Friend / Colleague" },
  { value: "EVENT_ORGANIZER", label: "Event Organizer" },
  { value: "WEBSITE", label: "Website" },
  { value: "MEDIA", label: "Media" },
  { value: "OTHER", label: "Other" },
] as const satisfies readonly GuestOption[];

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WAITLISTED: "Waiting list",
};

export const STAKEHOLDER_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  STAKEHOLDER_CATEGORIES.map((option) => [option.value, option.label])
);

export const ATTENDANCE_LABELS: Record<string, string> = Object.fromEntries(
  ATTENDANCE_OPTIONS.map((option) => [option.value, option.label])
);

export const COMPANION_LABELS: Record<string, string> = Object.fromEntries(
  COMPANION_OPTIONS.map((option) => [option.value, option.label])
);

export const AREA_OF_INTEREST_LABELS: Record<string, string> = Object.fromEntries(
  AREAS_OF_INTEREST.map((option) => [option.value, option.label])
);

export const REFERRAL_SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  REFERRAL_SOURCES.map((option) => [option.value, option.label])
);

export const STAKEHOLDER_CATEGORY_VALUES = STAKEHOLDER_CATEGORIES.map(
  (o) => o.value
) as [StakeholderCategoryValue, ...StakeholderCategoryValue[]];
export const ATTENDANCE_VALUES = ATTENDANCE_OPTIONS.map(
  (o) => o.value
) as [AttendanceIntentValue, ...AttendanceIntentValue[]];
export const COMPANION_VALUES = COMPANION_OPTIONS.map(
  (o) => o.value
) as [CompanionCountValue, ...CompanionCountValue[]];
export const AREA_OF_INTEREST_VALUES = AREAS_OF_INTEREST.map(
  (o) => o.value
) as [AreaOfInterestValue, ...AreaOfInterestValue[]];
export const REFERRAL_SOURCE_VALUES = REFERRAL_SOURCES.map(
  (o) => o.value
) as [ReferralSourceValue, ...ReferralSourceValue[]];

export type StakeholderCategoryValue = (typeof STAKEHOLDER_CATEGORIES)[number]["value"];
export type AttendanceIntentValue = (typeof ATTENDANCE_OPTIONS)[number]["value"];
export type CompanionCountValue = (typeof COMPANION_OPTIONS)[number]["value"];
export type ReferralSourceValue = (typeof REFERRAL_SOURCES)[number]["value"];
export type AreaOfInterestValue = (typeof AREAS_OF_INTEREST)[number]["value"];

/** Shape passed from the server page to the client form. */
export interface PublicGuestEvent {
  slug: string;
  eventName: string;
  eventDate: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  venue: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  capacity: number | null;
  registrationClosesAt: string | null;
}

/** Shape returned to the browser after a successful registration. */
export interface GuestRegistrationReceipt {
  reference: string;
  status: string;
  submittedAt: string;
  fullName: string;
  email: string;
  eventName: string;
  eventDate: string | null;
  startTime: string;
  endTime: string;
  timezone: string;
  venue: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}
