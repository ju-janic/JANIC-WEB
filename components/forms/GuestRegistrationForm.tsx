"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notify } from "@/lib/toast";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  RotateCcw,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AREAS_OF_INTEREST,
  ATTENDANCE_OPTIONS,
  COMPANION_OPTIONS,
  REFERRAL_SOURCES,
  STAKEHOLDER_CATEGORIES,
  type PublicGuestEvent,
} from "@/lib/guests/constants";

type FormErrors = Record<string, string | undefined>;

interface FormState {
  fullName: string;
  organization: string;
  position: string;
  phone: string;
  email: string;
  stakeholderCategory: string;
  attendanceIntent: string;
  companionCount: string;
  areasOfInterest: string[];
  hasAccessibilityNeeds: "yes" | "no" | "";
  accessibilityDetails: string;
  mediaConsent: "yes" | "no" | "";
  referralSource: string;
  additionalComments: string;
  accuracyConfirmed: boolean;
  privacyConsent: boolean;
  website: string;
}

const INITIAL_STATE: FormState = {
  fullName: "",
  organization: "",
  position: "",
  phone: "",
  email: "",
  stakeholderCategory: "",
  attendanceIntent: "",
  companionCount: "",
  areasOfInterest: [],
  hasAccessibilityNeeds: "",
  accessibilityDetails: "",
  mediaConsent: "",
  referralSource: "",
  additionalComments: "",
  accuracyConfirmed: false,
  privacyConsent: false,
  website: "",
};

const STEPS = [
  { id: 1, title: "Personal", hint: "Who you are and how to reach you" },
  { id: 2, title: "Attendance", hint: "Your role and what you want to explore" },
  { id: 3, title: "Requirements", hint: "Accessibility, consent and comments" },
  { id: 4, title: "Confirm", hint: "Review your details and submit" },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputBase =
  "w-full rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0875D1]/40 transition";
const inputOk = "border-slate-200 dark:border-slate-700 focus:border-[#0875D1]";
const inputErr = "border-rose-400 dark:border-rose-500 focus:border-rose-500";

function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-[#08245C] dark:text-slate-200 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition text-left",
        checked
          ? "border-[#0875D1] bg-blue-50/70 dark:bg-[#0875D1]/10"
          : "border-slate-200 dark:border-slate-700 hover:border-[#0875D1]/40"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-0.5 h-4 w-4 accent-[#0875D1] shrink-0"
      />
      <span className="min-w-0">
        <span
          className={cn(
            "block text-xs font-bold",
            checked ? "text-[#0875D1]" : "text-[#08245C] dark:text-white"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function GuestRegistrationForm({ event }: { event: PublicGuestEvent }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedAreaLabels = useMemo(
    () =>
      AREAS_OF_INTEREST.filter((area) => formData.areasOfInterest.includes(area.value)).map(
        (area) => area.label
      ),
    [formData.areasOfInterest]
  );

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    setSubmitError(null);
  };

  const toggleArea = (value: string) => {
    const next = formData.areasOfInterest.includes(value)
      ? formData.areasOfInterest.filter((item) => item !== value)
      : [...formData.areasOfInterest, value];
    set("areasOfInterest", next);
  };

  function validateStep(current: number): FormErrors {
    const e: FormErrors = {};

    if (current === 1) {
      if (formData.fullName.trim().length < 2) e.fullName = "Full name is required";
      if (formData.organization.trim().length < 2) {
        e.organization = "Organization / Institution is required";
      }
      if (formData.position.trim().length < 2) e.position = "Position / Role is required";

      if (!formData.email.trim()) e.email = "Email address is required";
      else if (!EMAIL_PATTERN.test(formData.email.trim())) e.email = "Enter a valid email address";

      const digits = formData.phone.replace(/\D/g, "");
      if (!digits) e.phone = "Phone number is required";
      else if (digits.length < 7 || digits.length > 15) {
        e.phone = "Enter a valid phone number, including the country code";
      }
    }

    if (current === 2) {
      if (!formData.stakeholderCategory) e.stakeholderCategory = "Select your stakeholder category";
      if (!formData.attendanceIntent) e.attendanceIntent = "Tell us whether you will attend";
      if (!formData.companionCount) e.companionCount = "Select the number of accompanying guests";
      if (formData.areasOfInterest.length === 0) {
        e.areasOfInterest = "Select at least one area of interest";
      }
    }

    if (current === 3) {
      if (formData.hasAccessibilityNeeds === "") {
        e.hasAccessibilityNeeds = "Tell us if you have accessibility requirements";
      }
      if (formData.hasAccessibilityNeeds === "yes" && !formData.accessibilityDetails.trim()) {
        e.accessibilityDetails = "Please specify your accessibility or special requirements";
      }
      if (formData.mediaConsent === "") {
        e.mediaConsent = "Select a photography and media consent option";
      }
      if (!formData.referralSource) {
        e.referralSource = "Tell us how you heard about JANIC 2026";
      }
    }

    if (current === 4) {
      if (!formData.accuracyConfirmed) {
        e.accuracyConfirmed = "Please confirm that the information provided is accurate";
      }
      if (!formData.privacyConsent) {
        e.privacyConsent = "Please accept the privacy notice to continue";
      }
    }

    return e;
  }

  const scrollToFormTop = () => {
    requestAnimationFrame(() => {
      const el = formRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.min(Math.max(top, 0), max), behavior: "smooth" });
    });
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      notify.warning("Please resolve the highlighted fields before continuing.");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    scrollToFormTop();
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
    scrollToFormTop();
  };

  const handleReset = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setSubmitError(null);
    setStep(1);
    notify.info("Form cleared. You can start a new registration.");
    scrollToFormTop();
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    // Enter inside a field should advance the wizard, not submit early.
    if (step < 4) {
      handleNext();
      return;
    }

    const stepErrors = validateStep(4);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      notify.warning("Please confirm both statements before submitting.");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        organization: formData.organization.trim(),
        position: formData.position.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        stakeholderCategory: formData.stakeholderCategory,
        attendanceIntent: formData.attendanceIntent,
        companionCount: formData.companionCount,
        areasOfInterest: formData.areasOfInterest,
        hasAccessibilityNeeds: formData.hasAccessibilityNeeds === "yes",
        accessibilityDetails: formData.accessibilityDetails.trim(),
        mediaConsent: formData.mediaConsent === "yes",
        referralSource: formData.referralSource,
        additionalComments: formData.additionalComments.trim(),
        accuracyConfirmed: formData.accuracyConfirmed,
        privacyConsent: formData.privacyConsent,
        website: formData.website,
      };

      const res = await fetch(`/api/events/${encodeURIComponent(event.slug)}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        if (data?.fieldErrors) {
          setErrors((prev) => ({ ...prev, ...data.fieldErrors }));
          // Return the guest to the first step that owns an error.
          const fieldsByStep: Record<number, string[]> = {
            1: ["fullName", "organization", "position", "email", "phone"],
            2: ["stakeholderCategory", "attendanceIntent", "companionCount", "areasOfInterest"],
            3: ["hasAccessibilityNeeds", "accessibilityDetails", "mediaConsent", "referralSource"],
            4: ["accuracyConfirmed", "privacyConsent"],
          };
          const target = Object.entries(fieldsByStep).find(([, fields]) =>
            fields.some((field) => data.fieldErrors[field])
          );
          if (target) {
            setStep(Number(target[0]));
            scrollToFormTop();
          }
        }
        setSubmitError(
          data?.message || "We could not submit your registration. Please try again."
        );
        if (data?.error === "RATE_LIMITED" || data?.error === "REGISTRATION_CLOSED") {
          notify.error(data.message);
        }
        return;
      }

      const confirmationUrl: string =
        data.data?.confirmationUrl ||
        `/events/${event.slug}/register/confirmation?token=${encodeURIComponent(
          data.data?.confirmationToken ?? ""
        )}`;

      notify.success("Registration received. Redirecting to your confirmation…");
      router.push(confirmationUrl);
    } catch {
      setSubmitError(
        "A network error stopped your registration from being sent. Please check your connection and try again."
      );
      notify.error("Could not reach the registration service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Event summary strip */}
      <div className="rounded-2xl border border-blue-100 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-900/60 p-4 sm:p-5">
        <h2 className="text-sm sm:text-base font-black text-[#08245C] dark:text-white">
          {event.eventName}
        </h2>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
          {event.eventDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#0875D1] shrink-0" />
              {new Date(event.eventDate).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: event.timezone,
              })}
              , {event.startTime}–{event.endTime}
            </span>
          )}
          {event.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0875D1] shrink-0" />
              {event.venue}
            </span>
          )}
          {event.contactEmail && (
            <span className="flex items-center gap-1.5 min-w-0">
              <Mail className="w-3.5 h-3.5 text-[#0875D1] shrink-0" />
              <a href={`mailto:${event.contactEmail}`} className="truncate hover:underline">
                {event.contactEmail}
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-colors",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-[#0875D1] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                </span>
                <span
                  className={cn(
                    "hidden sm:block text-[11px] font-bold truncate",
                    isActive
                      ? "text-[#08245C] dark:text-white"
                      : isDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "flex-1 h-px min-w-4 transition-colors",
                    isDone ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-[#0875D1]">
          Step {step} of 4
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">· {STEPS[step - 1].hint}</span>
      </div>

      {submitError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">{submitError}</p>
        </div>
      )}

      {/* STEP 1 — PERSONAL INFORMATION */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.fullName}>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                maxLength={160}
                className={cn(inputBase, errors.fullName ? inputErr : inputOk)}
              />
            </Field>

            <Field label="Organization / Institution" required error={errors.organization}>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => set("organization", e.target.value)}
                placeholder="Company, university, ministry or community"
                autoComplete="organization"
                maxLength={200}
                className={cn(inputBase, errors.organization ? inputErr : inputOk)}
              />
            </Field>

            <Field label="Position / Role" required error={errors.position}>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="e.g. Student, Developer, Director"
                autoComplete="organization-title"
                maxLength={160}
                className={cn(inputBase, errors.position ? inputErr : inputOk)}
              />
            </Field>

            <Field label="Phone Number" required error={errors.phone} hint="Include your country code, e.g. +252 61 234 5678.">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+252 61 234 5678"
                autoComplete="tel"
                maxLength={40}
                className={cn(inputBase, errors.phone ? inputErr : inputOk)}
              />
            </Field>

            <Field
              label="Email Address"
              required
              error={errors.email}
              hint="We will use this email for all event updates."
              className="sm:col-span-2"
            >
              <input
                type="email"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                className={cn(inputBase, errors.email ? inputErr : inputOk)}
              />
            </Field>
          </div>

          {/* Honeypot — hidden from people, visible to naive bots. */}
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={formData.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2 — ATTENDANCE & INTERESTS */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <Field label="Stakeholder Category" required error={errors.stakeholderCategory}>
            <select
              value={formData.stakeholderCategory}
              onChange={(e) => set("stakeholderCategory", e.target.value)}
              className={cn(inputBase, errors.stakeholderCategory ? inputErr : inputOk)}
            >
              <option value="">Select your category</option>
              {STAKEHOLDER_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Will you attend?" required error={errors.attendanceIntent}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ATTENDANCE_OPTIONS.map((option) => (
                <ChoiceCard
                  key={option.value}
                  name="attendanceIntent"
                  value={option.value}
                  checked={formData.attendanceIntent === option.value}
                  onChange={(value) => set("attendanceIntent", value)}
                  label={option.label}
                />
              ))}
            </div>
          </Field>

          <Field
            label="Number of Accompanying Guests"
            required
            error={errors.companionCount}
            hint="Select 0 if you are attending alone."
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {COMPANION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition text-xs font-semibold",
                    formData.companionCount === option.value
                      ? "border-[#0875D1] bg-blue-50/70 dark:bg-[#0875D1]/10 text-[#0875D1]"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0875D1]/40"
                  )}
                >
                  <input
                    type="radio"
                    name="companionCount"
                    value={option.value}
                    checked={formData.companionCount === option.value}
                    onChange={() => set("companionCount", option.value)}
                    className="h-4 w-4 accent-[#0875D1]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>

          <Field
            label="Areas of Interest"
            required
            error={errors.areasOfInterest}
            hint="Select all that apply."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AREAS_OF_INTEREST.map((area) => {
                const checked = formData.areasOfInterest.includes(area.value);
                return (
                  <label
                    key={area.value}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition text-xs font-semibold",
                      checked
                        ? "border-[#0875D1] bg-blue-50/70 dark:bg-[#0875D1]/10 text-[#0875D1]"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#0875D1]/40"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArea(area.value)}
                      className="h-4 w-4 rounded accent-[#0875D1]"
                    />
                    {area.label}
                  </label>
                );
              })}
            </div>
          </Field>
        </div>
      )}

      {/* STEP 3 — REQUIREMENTS & CONSENT */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <Field label="Accessibility & Special Requirements" required error={errors.hasAccessibilityNeeds}>
            <div className="grid grid-cols-2 gap-2.5">
              <ChoiceCard
                name="hasAccessibilityNeeds"
                value="yes"
                checked={formData.hasAccessibilityNeeds === "yes"}
                onChange={() => set("hasAccessibilityNeeds", "yes")}
                label="Yes"
                description="I need assistance or an accommodation"
              />
              <ChoiceCard
                name="hasAccessibilityNeeds"
                value="no"
                checked={formData.hasAccessibilityNeeds === "no"}
                onChange={() => {
                  set("hasAccessibilityNeeds", "no");
                  set("accessibilityDetails", "");
                }}
                label="No"
                description="I do not need special arrangements"
              />
            </div>
          </Field>

          {formData.hasAccessibilityNeeds === "yes" && (
            <Field
              label="Accessibility Details"
              required
              error={errors.accessibilityDetails}
              hint="Tell us what would make the event accessible for you."
            >
              <textarea
                rows={3}
                value={formData.accessibilityDetails}
                onChange={(e) => set("accessibilityDetails", e.target.value)}
                maxLength={500}
                placeholder="e.g. wheelchair access, sign language interpretation, reserved seating…"
                className={cn(inputBase, "resize-y", errors.accessibilityDetails ? inputErr : inputOk)}
              />
            </Field>
          )}

          <Field label="Photography & Media Consent" required error={errors.mediaConsent}>
            <div className="space-y-2.5">
              <ChoiceCard
                name="mediaConsent"
                value="yes"
                checked={formData.mediaConsent === "yes"}
                onChange={() => set("mediaConsent", "yes")}
                label="Yes, I consent to photography and media coverage."
              />
              <ChoiceCard
                name="mediaConsent"
                value="no"
                checked={formData.mediaConsent === "no"}
                onChange={() => set("mediaConsent", "no")}
                label="No, I do not consent to photography and media coverage."
              />
            </div>
          </Field>

          <Field label="How did you hear about JANIC 2026?" required error={errors.referralSource}>
            <select
              value={formData.referralSource}
              onChange={(e) => set("referralSource", e.target.value)}
              className={cn(inputBase, errors.referralSource ? inputErr : inputOk)}
            >
              <option value="">Select a source</option>
              {REFERRAL_SOURCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Additional Comments or Questions"
            error={errors.additionalComments}
            hint="Optional — anything else we should know?"
          >
            <textarea
              rows={4}
              value={formData.additionalComments}
              onChange={(e) => set("additionalComments", e.target.value)}
              maxLength={1000}
              placeholder="Share any questions, dietary needs, or notes for the organising team."
              className={cn(inputBase, "resize-y", errors.additionalComments ? inputErr : inputOk)}
            />
          </Field>
        </div>
      )}

      {/* STEP 4 — REVIEW & CONFIRM */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            <ReviewRow label="Full Name" value={formData.fullName} />
            <ReviewRow label="Organization / Institution" value={formData.organization} />
            <ReviewRow label="Position / Role" value={formData.position} />
            <ReviewRow label="Phone Number" value={formData.phone} />
            <ReviewRow label="Email Address" value={formData.email} />
            <ReviewRow
              label="Stakeholder Category"
              value={
                STAKEHOLDER_CATEGORIES.find((o) => o.value === formData.stakeholderCategory)?.label ?? "—"
              }
            />
            <ReviewRow
              label="Attendance"
              value={ATTENDANCE_OPTIONS.find((o) => o.value === formData.attendanceIntent)?.label ?? "—"}
            />
            <ReviewRow
              label="Accompanying Guests"
              value={COMPANION_OPTIONS.find((o) => o.value === formData.companionCount)?.label ?? "—"}
            />
            <ReviewRow
              label="Areas of Interest"
              value={selectedAreaLabels.length ? selectedAreaLabels.join(", ") : "—"}
            />
            <ReviewRow
              label="Accessibility Needs"
              value={
                formData.hasAccessibilityNeeds === "yes"
                  ? formData.accessibilityDetails || "Yes"
                  : formData.hasAccessibilityNeeds === "no"
                    ? "No"
                    : "—"
              }
            />
            <ReviewRow
              label="Media Consent"
              value={formData.mediaConsent === "yes" ? "Consented" : formData.mediaConsent === "no" ? "Not consented" : "—"}
            />
            <ReviewRow
              label="Referral Source"
              value={REFERRAL_SOURCES.find((o) => o.value === formData.referralSource)?.label ?? "—"}
            />
            {formData.additionalComments.trim() && (
              <ReviewRow label="Additional Comments" value={formData.additionalComments.trim()} />
            )}
          </div>

          <div className="space-y-3">
            <label
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition",
                formData.accuracyConfirmed
                  ? "border-[#0875D1] bg-blue-50/60 dark:bg-[#0875D1]/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-[#0875D1]/40"
              )}
            >
              <input
                type="checkbox"
                checked={formData.accuracyConfirmed}
                onChange={(e) => set("accuracyConfirmed", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#0875D1] shrink-0"
              />
              <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                I confirm that the information provided above is accurate and complete.
                {errors.accuracyConfirmed && (
                  <span className="block mt-1 font-semibold text-rose-600 dark:text-rose-400">
                    {errors.accuracyConfirmed}
                  </span>
                )}
              </span>
            </label>

            <label
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition",
                formData.privacyConsent
                  ? "border-[#0875D1] bg-blue-50/60 dark:bg-[#0875D1]/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-[#0875D1]/40"
              )}
            >
              <input
                type="checkbox"
                checked={formData.privacyConsent}
                onChange={(e) => set("privacyConsent", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#0875D1] shrink-0"
              />
              <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                I agree that JANIC may store and use my details to manage my event registration, in
                line with the{" "}
                <Link href="/privacy" className="font-bold text-[#0875D1] hover:underline">
                  privacy policy
                </Link>
                .
                {errors.privacyConsent && (
                  <span className="block mt-1 font-semibold text-rose-600 dark:text-rose-400">
                    {errors.privacyConsent}
                  </span>
                )}
              </span>
            </label>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Your registration will be submitted as <strong>Pending</strong>. The JANIC events team
              reviews every registration and will contact you with the outcome.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Form
        </button>

        <div className="flex items-center gap-2 sm:ml-auto">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition"
            >
              Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0875D1] hover:bg-[#0668bb] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Registration
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {(event.contactEmail || event.contactPhone) && (
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          Need help?
          {event.contactEmail && (
            <a
              href={`mailto:${event.contactEmail}`}
              className="inline-flex items-center gap-1 font-semibold text-[#0875D1] hover:underline"
            >
              <Mail className="w-3 h-3" />
              {event.contactEmail}
            </a>
          )}
          {event.contactPhone && (
            <a
              href={`tel:${event.contactPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1 font-semibold text-[#0875D1] hover:underline"
            >
              <Phone className="w-3 h-3" />
              {event.contactPhone}
            </a>
          )}
        </p>
      )}
    </form>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 px-4 py-2.5 bg-white dark:bg-slate-900">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="sm:col-span-2 text-xs text-slate-800 dark:text-slate-100 break-words">
        {value || "—"}
      </span>
    </div>
  );
}
