"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Send, Sparkles, Mail } from "lucide-react";

// Crisp Brand SVG Icons
function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface FormErrors {
  title?: string;
  category?: string;
  description?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  prototypeUrl?: string;
  videoUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
}

interface ToggleProps {
  active: boolean;
  onChange: (val: boolean) => void;
  label: string;
}

function Toggle({ active, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? "bg-[#0875D1]" : "bg-slate-200 dark:bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

export function InnovationSubmissionForm() {
  const [formData, setFormData] = useState({
    title: "",
    category: "Web Platform",
    description: "",
    technologyStack: "",
    submitterName: "",
    submitterEmail: "",
    submitterPhone: "",
    studentId: "",
    teamMembers: "",
    prototypeUrl: "",
    videoUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
  });

  const [activeFields, setActiveFields] = useState({
    email: true,
    github: true,
    linkedin: true,
    facebook: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Project Title
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Project title is required";
    } else if (trimmedTitle.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    // 2. Project Description
    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      newErrors.description = "Project description is required";
    } else if (trimmedDesc.length < 15) {
      newErrors.description = "Please describe your project (at least 15 characters)";
    }

    // 4. Submitter Name
    const trimmedName = formData.submitterName.trim();
    if (!trimmedName) {
      newErrors.submitterName = "Lead submitter name is required";
    } else if (trimmedName.length < 2) {
      newErrors.submitterName = "Submitter name must be at least 2 characters";
    }

    // 5. Submitter Email
    if (activeFields.email) {
      const trimmedEmail = formData.submitterEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail) {
        newErrors.submitterEmail = "Email address is required";
      } else if (!emailRegex.test(trimmedEmail)) {
        newErrors.submitterEmail = "Please enter a valid email address (e.g. student@jazeera.edu.so)";
      }
    }

    // 6. Submitter Phone
    const trimmedPhone = formData.submitterPhone.trim();
    if (!trimmedPhone) {
      newErrors.submitterPhone = "Phone number is required";
    } else {
      const phoneDigits = trimmedPhone.replace(/[\s\-()]/g, "");
      if (phoneDigits.length < 6 || !/^\+?[0-9]{6,15}$/.test(phoneDigits)) {
        newErrors.submitterPhone = "Please enter a valid phone number (at least 6 digits)";
      }
    }

    // 7. URLs (optional, but validated if provided and active)
    const trimmedProto = formData.prototypeUrl.trim();
    if (trimmedProto && !isValidUrl(trimmedProto)) {
      newErrors.prototypeUrl = "Please provide a valid web URL (e.g. https://github.com/...)";
    }

    const trimmedVideo = formData.videoUrl.trim();
    if (trimmedVideo && !isValidUrl(trimmedVideo)) {
      newErrors.videoUrl = "Please provide a valid URL (e.g. https://youtube.com/...)";
    }

    if (activeFields.github) {
      const trimmedGithub = formData.githubUrl.trim();
      if (trimmedGithub && !isValidUrl(trimmedGithub)) {
        newErrors.githubUrl = "Please provide a valid GitHub URL";
      }
    }

    if (activeFields.linkedin) {
      const trimmedLinkedin = formData.linkedinUrl.trim();
      if (trimmedLinkedin && !isValidUrl(trimmedLinkedin)) {
        newErrors.linkedinUrl = "Please provide a valid LinkedIn URL";
      }
    }

    if (activeFields.facebook) {
      const trimmedFacebook = formData.facebookUrl.trim();
      if (trimmedFacebook && !isValidUrl(trimmedFacebook)) {
        newErrors.facebookUrl = "Please provide a valid Facebook URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setError("Please correct the errors in the form before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        submitterEmail: activeFields.email ? formData.submitterEmail : null,
        githubUrl: activeFields.github ? formData.githubUrl : null,
        linkedinUrl: activeFields.linkedin ? formData.linkedinUrl : null,
        facebookUrl: activeFields.facebook ? formData.facebookUrl : null,
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit innovation proposal.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error submitting proposal.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">Innovation Proposal Received!</h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-400 max-w-lg mx-auto leading-relaxed">
          Your project proposal has been successfully submitted to the JANIC Review Committee. Our faculty mentors review submissions weekly and will notify you by email for the interview and prototype demonstration stage.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setFormData({
              title: "",
              category: "Web Platform",
              description: "",
              technologyStack: "",
              submitterName: "",
              submitterEmail: "",
              submitterPhone: "",
              studentId: "",
              teamMembers: "",
              prototypeUrl: "",
              videoUrl: "",
              githubUrl: "",
              linkedinUrl: "",
              facebookUrl: "",
            });
            setActiveFields({
              email: true,
              github: true,
              linkedin: true,
              facebook: true,
            });
            setErrors({});
          }}
          className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition cursor-pointer"
        >
          Submit Another Proposal
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Part 1: Project Information */}
      <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-bold text-[#08245C] dark:text-sky-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0875D1] dark:text-sky-400" />
          1. Project Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project / System Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g. Robot Car Cleaner, Autonomous Solar Irrigation"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                errors.title
                  ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                  : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Web Platform</option>
              <option>Robotics / Arduino</option>
              <option>IoT / Automation</option>
              <option>HealthTech / API</option>
              <option>AI / Machine Learning</option>
              <option>Information Systems</option>
              <option>Cybersecurity</option>
              <option>Branding & Design</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Project Description *
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe your project, the problem it solves, and the technical solution or system architecture..."
            className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
              errors.description
                ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.description}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Technologies & Tools Used (Optional)
          </label>
          <input
            type="text"
            value={formData.technologyStack}
            onChange={(e) => handleInputChange("technologyStack", e.target.value)}
            placeholder="e.g. Arduino Mega, Next.js, ESP32, Python, Ultrasonic Sensors"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Part 2: Submitter & Team Information */}
      <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-bold text-[#08245C] dark:text-sky-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0875D1] dark:text-sky-400" />
          2. Team & Submitter Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Lead Submitter Name *
            </label>
            <input
              type="text"
              value={formData.submitterName}
              onChange={(e) => handleInputChange("submitterName", e.target.value)}
              placeholder="Your Full Name"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                errors.submitterName
                  ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                  : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.submitterName && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.submitterName}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address *
              </label>
              <Toggle
                active={activeFields.email}
                onChange={(val) => setActiveFields((prev) => ({ ...prev, email: val }))}
                label={activeFields.email ? "Required" : "Hidden"}
              />
            </div>
            {activeFields.email && (
              <>
                <input
                  type="email"
                  value={formData.submitterEmail}
                  onChange={(e) => handleInputChange("submitterEmail", e.target.value)}
                  placeholder="student@jazeera.edu.so"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                    errors.submitterEmail
                      ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                      : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  }`}
                />
                {errors.submitterEmail && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.submitterEmail}</span>
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.submitterPhone}
              onChange={(e) => handleInputChange("submitterPhone", e.target.value)}
              placeholder="+252 61..."
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                errors.submitterPhone
                  ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                  : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.submitterPhone && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.submitterPhone}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Student ID / Registration No. (Optional)
          </label>
          <input
            type="text"
            value={formData.studentId}
            onChange={(e) => handleInputChange("studentId", e.target.value)}
            placeholder="e.g. JU/CS/2023/..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Team Members (Names & Roles, Optional)
          </label>
          <input
            type="text"
            value={formData.teamMembers}
            onChange={(e) => handleInputChange("teamMembers", e.target.value)}
            placeholder="e.g. Ahmed Ali (Hardware), Hafsa Omar (Firmware), Bilal Hassan (Software)"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Part 3: Links / Demos */}
      <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-sm font-bold text-[#08245C] dark:text-sky-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0875D1] dark:text-sky-400" />
          3. Demos & Repository Links (Optional)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Live Demo / System URL
            </label>
            <input
              type="url"
              value={formData.prototypeUrl}
              onChange={(e) => handleInputChange("prototypeUrl", e.target.value)}
              placeholder="https://myproject.com"
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                errors.prototypeUrl
                  ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                  : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.prototypeUrl && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.prototypeUrl}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Video Demonstration URL (YouTube / Drive)
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => handleInputChange("videoUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                errors.videoUrl
                  ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                  : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              }`}
            />
            {errors.videoUrl && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.videoUrl}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Part 4: Social & Professional Links */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-[#08245C] dark:text-sky-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0875D1] dark:text-sky-400" />
          4. Social & Professional Links
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* GitHub */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <GitHubIcon className="w-3.5 h-3.5" />
                GitHub
              </label>
              <Toggle
                active={activeFields.github}
                onChange={(val) => setActiveFields((prev) => ({ ...prev, github: val }))}
                label={activeFields.github ? "On" : "Off"}
              />
            </div>
            {activeFields.github && (
              <>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => handleInputChange("githubUrl", e.target.value)}
                  placeholder="https://github.com/username"
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                    errors.githubUrl
                      ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                      : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  }`}
                />
                {errors.githubUrl && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.githubUrl}</span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <LinkedInIcon className="w-3.5 h-3.5" />
                LinkedIn
              </label>
              <Toggle
                active={activeFields.linkedin}
                onChange={(val) => setActiveFields((prev) => ({ ...prev, linkedin: val }))}
                label={activeFields.linkedin ? "On" : "Off"}
              />
            </div>
            {activeFields.linkedin && (
              <>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                    errors.linkedinUrl
                      ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                      : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  }`}
                />
                {errors.linkedinUrl && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.linkedinUrl}</span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Facebook */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <FacebookIcon className="w-3.5 h-3.5" />
                Facebook
              </label>
              <Toggle
                active={activeFields.facebook}
                onChange={(val) => setActiveFields((prev) => ({ ...prev, facebook: val }))}
                label={activeFields.facebook ? "On" : "Off"}
              />
            </div>
            {activeFields.facebook && (
              <>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => handleInputChange("facebookUrl", e.target.value)}
                  placeholder="https://facebook.com/..."
                  className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition ${
                    errors.facebookUrl
                      ? "border border-red-500 focus:ring-2 focus:ring-red-400/30"
                      : "border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  }`}
                />
                {errors.facebookUrl && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.facebookUrl}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 bg-[#0875D1] hover:bg-[#065ea8] text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Transmitting Proposal to Review Board...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Innovation to JANIC Hub
          </>
        )}
      </button>
    </form>
  );
}
