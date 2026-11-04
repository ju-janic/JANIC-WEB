"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Trash2,
  X,
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FileUploadChoice } from "@/components/admin/FileUploadChoice";

export interface SponsorItem {
  id: string;
  organizationName: string;
  organizationType: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  sponsorshipType: string | null;
  whatTheySponsor: string | null;
  sponsorshipLevel: string | null;
  estimatedAmount: string | null;
  description: string | null;
  proposalUrl: string | null;
  logoUrl: string | null;
  status: string;
  isApproved: boolean;
  isRejected: boolean;
  adminNotes: string | null;
  createdAt: string | Date;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending Review",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  REJECTED: {
    label: "Rejected",
    className:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  },
};

export function SponsorManager({ initialSponsors }: { initialSponsors: SponsorItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<SponsorItem[]>(initialSponsors);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<SponsorItem | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateStatus = async (id: string, isApproved: boolean, isRejected: boolean) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved, isRejected }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.map((item) => (item.id === id ? data.item : item)));
        setSelected((prev) => (prev && prev.id === id ? data.item : prev));
        router.refresh();
        toast.success(data.item?.status === "APPROVED" ? "Sponsor approved." : "Sponsor rejected.");
      } else {
        toast.error(data.error || "Error updating sponsor status");
      }
    } catch {
      toast.error("Error updating sponsor status");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sponsor?")) return;
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
        toast.success("Sponsor deleted.");
      } else {
        toast.error("Error deleting sponsor");
      }
    } catch {
      toast.error("Error deleting sponsor");
    }
  };

  const saveLogo = async (id: string, logoUrl: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.map((item) => (item.id === id ? data.item : item)));
        setSelected((prev) => (prev && prev.id === id ? data.item : prev));
        router.refresh();
        toast.success("Sponsor logo updated.");
      } else {
        toast.error(data.error || "Error updating sponsor logo");
      }
    } catch {
      toast.error("Error updating sponsor logo");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = items.filter((s) => {
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.organizationName.toLowerCase().includes(q) ||
      s.contactName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.sponsorshipLevel?.toLowerCase().includes(q) ||
      s.sponsorshipType?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: items.length,
    pending: items.filter((s) => s.status === "PENDING").length,
    approved: items.filter((s) => s.isApproved).length,
    rejected: items.filter((s) => s.isRejected).length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Sponsors</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">all submissions</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.pending}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">awaiting review</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Approved</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.approved}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">visible on sponsors page</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rejected</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.rejected}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">declined</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sponsors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/25"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center shadow-sm">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-base font-semibold text-foreground">No sponsors found</p>
          <p className="text-xs text-muted-foreground mt-1">Sponsorship proposals submitted from the public sponsors page will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((s) => {
            const badge = STATUS_BADGES[s.status] ?? STATUS_BADGES.PENDING;
            return (
              <div key={s.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.logoUrl}
                      alt={s.organizationName}
                      className="h-14 w-14 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-2 py-2"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
                      <Building2 className="w-6 h-6 text-[#0875D1] dark:text-blue-400" />
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-[#08245C] dark:text-white">{s.organizationName}</h3>
                  {s.organizationType && <p className="text-[11px] text-muted-foreground font-medium">{s.organizationType}</p>}
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {s.whatTheySponsor || "General support"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#0875D1] shrink-0" />
                    {s.sponsorshipLevel || "Partner"}
                    {s.estimatedAmount && (
                      <span className="text-slate-500 dark:text-slate-400">
                        · Est. {s.estimatedAmount}
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </p>
                  {s.contactName && (
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{s.contactName}</span>
                    </p>
                  )}
                  {s.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{s.phone}</span>
                    </p>
                  )}
                  {s.website && (
                    <p className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[#0875D1] hover:underline">
                        {s.website}
                      </a>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Submitted {formatDate(s.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {s.isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    ) : s.isRejected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => updateStatus(s.id, true, false)}
                          disabled={savingId === s.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold transition disabled:opacity-60 cursor-pointer"
                        >
                          {savingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(s.id, false, true)}
                          disabled={savingId === s.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold transition disabled:opacity-60 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelected(s)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW DRAWER */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 z-50">
            <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              <div className="px-6 py-5 border-b border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-black text-[#08245C] dark:text-white">Sponsor Details</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Review sponsorship proposal information</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-center gap-3">
                  {selected.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.logoUrl}
                      alt={selected.organizationName}
                      className="h-16 w-16 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-2 py-2"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center border border-blue-100 dark:border-blue-900/60">
                      <Building2 className="w-7 h-7 text-[#0875D1] dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-[#08245C] dark:text-white">{selected.organizationName}</h2>
                    {selected.organizationType && (
                      <p className="text-xs text-muted-foreground font-medium">{selected.organizationType}</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Users className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Contact Person</span>
                      <span className="font-semibold">{selected.contactName || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Email Address</span>
                      <span className="font-mono text-xs">{selected.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Phone Number</span>
                      <span className="font-medium">{selected.phone || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Award className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Sponsorship Level</span>
                      <span className="font-medium">{selected.sponsorshipLevel || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sponsorship Details</h4>
                  <div className="bg-muted/40 p-4 rounded-2xl text-sm text-foreground leading-relaxed space-y-2">
                    <p>
                      <span className="font-semibold">Area:</span> {selected.whatTheySponsor || "General support"}
                    </p>
                    <p>
                      <span className="font-semibold">Type:</span> {selected.sponsorshipType || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Estimated amount:</span>{" "}
                      {selected.estimatedAmount || "Not specified"}
                    </p>
                  </div>
                </div>

                {selected.description && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h4>
                    <div className="bg-muted/40 p-4 rounded-2xl text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {selected.description}
                    </div>
                  </div>
                )}

                {selected.proposalUrl && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proposal</h4>
                    <a
                      href={selected.proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0875D1] hover:underline"
                    >
                      View Sponsorship Proposal ↗
                    </a>
                  </div>
                )}

                {selected.adminNotes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Staff Notes</h4>
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 p-4 rounded-2xl text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {selected.adminNotes}
                    </div>
                  </div>
                )}

                {/* Sponsor Logo Upload */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <FileUploadChoice
                    label="Sponsor Logo"
                    fileType="image"
                    value={selected.logoUrl || ""}
                    onChange={(url) => setSelected({ ...selected, logoUrl: url })}
                    folder="sponsors"
                    placeholder="/uploads/... or https://..."
                    helperText="PNG, JPG, WebP or SVG (max 20MB). Uploaded logos appear for approved sponsors."
                  />
                  {selected.logoUrl && (
                    <button
                      type="button"
                      onClick={() => saveLogo(selected.id, selected.logoUrl || "")}
                      disabled={savingId === selected.id}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-60 cursor-pointer"
                    >
                      {savingId === selected.id ? "Saving..." : "Save Sponsor Logo"}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border bg-card flex justify-end gap-2 shrink-0">
                {!selected.isApproved && !selected.isRejected && (
                  <>
                    <button
                      onClick={() => updateStatus(selected.id, true, false)}
                      disabled={savingId === selected.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
                    >
                      Approve Sponsor
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, false, true)}
                      disabled={savingId === selected.id}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
                    >
                      Reject Sponsor
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
