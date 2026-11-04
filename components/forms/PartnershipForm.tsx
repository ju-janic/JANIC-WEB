"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ORGANIZATION_TYPES = [
  "Technology Company",
  "Private Company",
  "NGO",
  "Government Institution",
  "University / Educational Institution",
  "Startup",
  "Individual",
  "Other",
];

const COLLABORATION_AREAS = [
  "Student Incubation & Mentorship",
  "Joint Research & Academic Exchange",
  "Hardware Lab Sponsorship",
  "Graduate Hiring & Internships",
  "Event Sponsorship / Hackathons",
];

interface FormErrors {
  organizationName?: string;
  organizationType?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  collaborationArea?: string;
  proposalDetails?: string;
  accuracyConfirmed?: string;
  contactConsent?: string;
}

const STEPS = [
  { n: 1, label: "Organization" },
  { n: 2, label: "Partnership Details" },
  { n: 3, label: "Confirmation" },
];

const INITIAL_FORM = {
  organizationName: "",
  organizationType: "Technology Company",
  contactName: "",
  email: "",
  phone: "",
  collaborationArea: "Student Incubation & Mentorship",
  proposalDetails: "",
  accuracyConfirmed: "",
  contactConsent: "",
};

export function PartnershipForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /** Validates one step and returns whether it passed. */
  const validateStep = (targetStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (targetStep === 1) {
      const trimmedOrg = formData.organizationName.trim();
      if (!trimmedOrg) {
        newErrors.organizationName = "Organization or Entity name is required";
      } else if (trimmedOrg.length < 2) {
        newErrors.organizationName = "Organization name must be at least 2 characters";
      }

      if (!formData.organizationType) {
        newErrors.organizationType = "Organization type is required";
      }
    }

    if (targetStep === 2) {
      const trimmedContact = formData.contactName.trim();
      if (!trimmedContact) {
        newErrors.contactName = "Primary contact person name is required";
      } else if (trimmedContact.length < 2) {
        newErrors.contactName = "Contact person name must be at least 2 characters";
      }

      const trimmedEmail = formData.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail) {
        newErrors.email = "Official email address is required";
      } else if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = "Please enter a valid email address (e.g. partner@organization.com)";
      }

      const trimmedPhone = formData.phone.trim();
      if (trimmedPhone) {
        const phoneDigits = trimmedPhone.replace(/[\s\-()]/g, "");
        if (phoneDigits.length < 6 || !/^\+?[0-9]{6,15}$/.test(phoneDigits)) {
          newErrors.phone = "Please enter a valid contact phone number (at least 6 digits)";
        }
      }

      if (!formData.collaborationArea) {
        newErrors.collaborationArea = "Please select a collaboration area";
      }

      const trimmedProposal = formData.proposalDetails.trim();
      if (!trimmedProposal) {
        newErrors.proposalDetails = "Proposal overview and objectives are required";
      } else if (trimmedProposal.length < 15) {
        newErrors.proposalDetails = "Please provide more details about your proposal (at least 15 characters)";
      }
    }

    if (targetStep === 3) {
      if (!formData.accuracyConfirmed) {
        newErrors.accuracyConfirmed = "Please confirm that the information is accurate";
      }
      if (!formData.contactConsent) {
        newErrors.contactConsent = "Please agree to be contacted by JANIC regarding your proposal";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      setError("Please fix the highlighted fields before continuing.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate every step; jump back to the first one that fails.
    for (const s of STEPS) {
      if (!validateStep(s.n)) {
        setStep(s.n);
        setError("Please fix the highlighted fields before submitting.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          collaborationArea: formData.collaborationArea,
          proposalDetails: formData.proposalDetails,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit partnership inquiry.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setStep(1);
    setFormData(INITIAL_FORM);
    setErrors({});
    setError(null);
  };

  if (success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">Partnership Proposal Received</h3>
        <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
          Thank you for reaching out. The JANIC External Relations & Faculty Advisory Board will review your proposal and respond within 2-3 business days.
        </p>
        <button
          onClick={resetForm}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
        >
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  const inputClass = (hasError?: string) =>
    `w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
      hasError
        ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
        : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
    }`;

  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const errorText = (message?: string) =>
    message ? (
      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{message}</span>
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* STEP PROGRESS */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition",
                  step > s.n && "bg-emerald-500 border-emerald-500 text-white",
                  step === s.n && "bg-[#0875D1] border-[#0875D1] text-white",
                  step < s.n && "bg-transparent border-slate-300 dark:border-slate-700 text-slate-400"
                )}
              >
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </span>
              <span
                className={cn(
                  "text-[11px] sm:text-xs font-bold hidden sm:block",
                  step >= s.n ? "text-foreground" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 sm:mx-3 rounded-full transition",
                  step > s.n ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1 — ORGANIZATION INFORMATION */}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-[#08245C] dark:text-white uppercase tracking-wide">
            1. Organization Information
          </h4>

          <div>
            <label className={labelClass}>
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.organizationName}
              onChange={(e) => handleInputChange("organizationName", e.target.value)}
              placeholder="e.g. Hormuud Telecom, UNDP, Tech Lab"
              className={inputClass(errors.organizationName)}
            />
            {errorText(errors.organizationName)}
          </div>

          <div>
            <label className={labelClass}>
              Organization Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.organizationType}
              onChange={(e) => handleInputChange("organizationType", e.target.value)}
              className={inputClass(errors.organizationType)}
            >
              {ORGANIZATION_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errorText(errors.organizationType)}
          </div>
        </div>
      )}

      {/* STEP 2 — PARTNERSHIP DETAILS */}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-[#08245C] dark:text-white uppercase tracking-wide">
            2. Partnership Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Primary Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange("contactName", e.target.value)}
                placeholder="Full Name & Title"
                className={inputClass(errors.contactName)}
              />
              {errorText(errors.contactName)}
            </div>

            <div>
              <label className={labelClass}>
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="partner@organization.com"
                className={inputClass(errors.email)}
              />
              {errorText(errors.email)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+252 61..."
                className={inputClass(errors.phone)}
              />
              {errorText(errors.phone)}
            </div>

            <div>
              <label className={labelClass}>
                Primary Area of Collaboration <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.collaborationArea}
                onChange={(e) => handleInputChange("collaborationArea", e.target.value)}
                className={inputClass(errors.collaborationArea)}
              >
                {COLLABORATION_AREAS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errorText(errors.collaborationArea)}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Proposal Overview & Objectives <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.proposalDetails}
              onChange={(e) => handleInputChange("proposalDetails", e.target.value)}
              placeholder="Briefly describe the potential synergy, project scope, or goals of collaboration..."
              className={`${inputClass(errors.proposalDetails)} resize-none`}
            />
            {errorText(errors.proposalDetails)}
          </div>
        </div>
      )}

      {/* STEP 3 — CONFIRMATION */}
      {step === 3 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-[#08245C] dark:text-white uppercase tracking-wide">
            3. Confirmation
          </h4>

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(formData.accuracyConfirmed)}
              onChange={(e) => handleInputChange("accuracyConfirmed", e.target.checked ? "Yes, I agree" : "")}
              className="mt-0.5 w-4 h-4 text-[#0875D1] rounded"
            />
            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              I confirm that the information provided is accurate. <span className="text-red-500">*</span>
            </span>
          </label>
          {errorText(errors.accuracyConfirmed)}

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(formData.contactConsent)}
              onChange={(e) => handleInputChange("contactConsent", e.target.checked ? "Yes, I agree" : "")}
              className="mt-0.5 w-4 h-4 text-[#0875D1] rounded"
            />
            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              I agree to be contacted by JANIC regarding this partnership proposal. <span className="text-red-500">*</span>
            </span>
          </label>
          {errorText(errors.contactConsent)}
        </div>
      )}

      {/* STEP NAVIGATION */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <span />
        )}

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#0875D1] hover:bg-[#065ea8] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0875D1] hover:bg-[#065ea8] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Partnership Proposal
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
