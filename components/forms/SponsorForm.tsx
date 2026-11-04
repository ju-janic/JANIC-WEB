"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  FileText,
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

const WHAT_TO_SPONSOR_OPTIONS = [
  "Student Technology Projects",
  "Innovation Challenges",
  "Training & Workshops",
  "Technology Events & Exhibitions",
  "Research & Prototypes",
  "Equipment & Laboratory Resources",
  "Student Competitions",
  "General JANIC Activities",
  "Other",
];

const SPONSORSHIP_TYPE_OPTIONS = [
  "Financial Sponsorship",
  "Equipment / Hardware",
  "Software / Technology Licenses",
  "Cloud Credits / Digital Services",
  "Training & Technical Support",
  "Venue / Event Support",
  "Other / In-kind Support",
];

const SPONSORSHIP_LEVEL_OPTIONS = [
  "Gold Sponsor",
  "Silver Sponsor",
  "Supporting Sponsor",
  "In-kind Sponsor",
  "Not Sure / Open to Discussion",
];

interface FormErrors {
  organizationName?: string;
  organizationType?: string;
  contactName?: string;
  email?: string;
  whatTheySponsor?: string;
  sponsorshipType?: string;
  sponsorshipLevel?: string;
  estimatedAmount?: string;
  description?: string;
  accuracyConfirmed?: string;
  privacyConsent?: string;
}

const STEPS = [
  { n: 1, label: "Organization" },
  { n: 2, label: "Sponsorship Details" },
  { n: 3, label: "Confirmation" },
];

const INITIAL_FORM = {
  organizationName: "",
  organizationType: "Technology Company",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  whatTheySponsor: "",
  sponsorshipType: "",
  sponsorshipLevel: "Not Sure / Open to Discussion",
  estimatedAmount: "",
  description: "",
  proposalUrl: "",
  proposalFileName: "",
  accuracyConfirmed: "",
  privacyConsent: "",
};

export function SponsorForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [proposalFile, setProposalFile] = useState<File | null>(null);

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
      if (!trimmedOrg) newErrors.organizationName = "Organization / Company name is required";
      else if (trimmedOrg.length < 2) newErrors.organizationName = "Organization name must be at least 2 characters";

      if (!formData.organizationType) newErrors.organizationType = "Organization type is required";

      const trimmedContact = formData.contactName.trim();
      if (!trimmedContact) newErrors.contactName = "Contact person name is required";
      else if (trimmedContact.length < 2) newErrors.contactName = "Contact person name must be at least 2 characters";

      const trimmedEmail = formData.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail) newErrors.email = "Official email address is required";
      else if (!emailRegex.test(trimmedEmail)) newErrors.email = "Please enter a valid email address";
    }

    if (targetStep === 2) {
      if (!formData.whatTheySponsor) newErrors.whatTheySponsor = "Please select what you would like to sponsor";
      if (!formData.sponsorshipType) newErrors.sponsorshipType = "Sponsorship type is required";
      if (!formData.sponsorshipLevel) newErrors.sponsorshipLevel = "Sponsorship level is required";
      if (!formData.estimatedAmount.trim()) newErrors.estimatedAmount = "Estimated sponsorship amount is required";

      const trimmedDescription = formData.description.trim();
      if (!trimmedDescription) newErrors.description = "Sponsorship description is required";
      else if (trimmedDescription.length < 10) newErrors.description = "Please describe your sponsorship (at least 10 characters)";
    }

    if (targetStep === 3) {
      if (!formData.accuracyConfirmed) newErrors.accuracyConfirmed = "Please confirm that the information is accurate";
      if (!formData.privacyConsent) newErrors.privacyConsent = "Please agree to be contacted by JANIC regarding your proposal";
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
      const payload: Record<string, string> = { ...formData };
      if (proposalFile) {
        const formDataToSend = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) formDataToSend.append(key, value);
        });
        formDataToSend.append("proposal", proposalFile);

        const res = await fetch("/api/sponsors", { method: "POST", body: formDataToSend });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit sponsorship proposal.");
      } else {
        const res = await fetch("/api/sponsors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit sponsorship proposal.");
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
    setProposalFile(null);
    setErrors({});
    setError(null);
  };

  if (success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">Sponsorship Proposal Received</h3>
        <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
          Thank you for your interest in sponsoring JANIC. The External Relations team will review your
          proposal and get back to you within 2-3 business days.
        </p>
        <button
          onClick={resetForm}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
        >
          Submit Another Sponsorship
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
      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
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
              Organization / Company Name <span className="text-red-500">*</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className={labelClass}>
                Contact Name <span className="text-red-500">*</span>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contact@organization.com"
                className={inputClass(errors.email)}
              />
              {errorText(errors.email)}
            </div>

            <div>
              <label className={labelClass}>Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+252 6..."
                className={inputClass()}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Organization Website (Optional)</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://..."
              className={inputClass()}
            />
          </div>
        </div>
      )}

      {/* STEP 2 — SPONSORSHIP DETAILS */}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-[#08245C] dark:text-white uppercase tracking-wide">
            2. Sponsorship Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                What would you like to Sponsor? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.whatTheySponsor}
                onChange={(e) => handleInputChange("whatTheySponsor", e.target.value)}
                className={inputClass(errors.whatTheySponsor)}
              >
                <option value="">Select a sponsorship area…</option>
                {WHAT_TO_SPONSOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errorText(errors.whatTheySponsor)}
            </div>

            <div>
              <label className={labelClass}>
                Sponsorship Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sponsorshipType}
                onChange={(e) => handleInputChange("sponsorshipType", e.target.value)}
                className={inputClass(errors.sponsorshipType)}
              >
                <option value="">Select a sponsorship type…</option>
                {SPONSORSHIP_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errorText(errors.sponsorshipType)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Sponsorship Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sponsorshipLevel}
                onChange={(e) => handleInputChange("sponsorshipLevel", e.target.value)}
                className={inputClass(errors.sponsorshipLevel)}
              >
                {SPONSORSHIP_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errorText(errors.sponsorshipLevel)}
            </div>

            <div>
              <label className={labelClass}>
                Estimated Sponsorship Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.estimatedAmount}
                onChange={(e) => handleInputChange("estimatedAmount", e.target.value)}
                placeholder="e.g. 2500 USD / 5,000 USD / In-kind value"
                className={inputClass(errors.estimatedAmount)}
              />
              {errorText(errors.estimatedAmount)}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Sponsorship Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the sponsorship scope, objectives, and what the contribution should support…"
              className={`${inputClass(errors.description)} resize-none`}
            />
            {errorText(errors.description)}
          </div>

          <div>
            <label className={labelClass}>Upload Sponsorship Proposal (Optional)</label>
            <div
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition"
              onClick={() => document.getElementById("sponsor-proposal-file")?.click()}
            >
              <input
                id="sponsor-proposal-file"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    if (file.size > 1024 * 1024 * 1024) {
                      setError("Sponsorship proposal exceeds the 1 GB upload limit.");
                      return;
                    }
                    setProposalFile(file);
                    setFormData((prev) => ({ ...prev, proposalFileName: file.name }));
                  }
                }}
              />
              <div className="flex flex-col items-center gap-1.5">
                <FileText className="w-6 h-6 text-[#0875D1]" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {proposalFile ? proposalFile.name : "Click to upload or drag & drop your proposal"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  PDF, DOC, DOCX, PPT, PPTX or TXT · Max 1 GB
                </p>
              </div>
            </div>

            <div className="mt-3">
              <label className={labelClass}>Proposal URL (Optional)</label>
              <input
                type="url"
                value={formData.proposalUrl}
                onChange={(e) => handleInputChange("proposalUrl", e.target.value)}
                placeholder="https://..."
                className={inputClass()}
              />
              <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                You can also paste a link to your proposal document.
              </p>
            </div>
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
              onChange={(e) => handleInputChange("accuracyConfirmed", e.target.checked ? "Yes, I confirm" : "")}
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
              checked={Boolean(formData.privacyConsent)}
              onChange={(e) => handleInputChange("privacyConsent", e.target.checked ? "Yes, I agree" : "")}
              className="mt-0.5 w-4 h-4 text-[#0875D1] rounded"
            />
            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              I agree to be contacted by JANIC regarding this sponsorship proposal. <span className="text-red-500">*</span>
            </span>
          </label>
          {errorText(errors.privacyConsent)}
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
                Submit Sponsorship Proposal
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
