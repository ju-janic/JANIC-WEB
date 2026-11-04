"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Edit3, Trash2, X, Plus, Building2, Users, GraduationCap, HeartHandshake, Landmark, Cpu, Microscope, LayoutGrid, Table, Briefcase, Calendar, Mail, Phone, AlertCircle, ShieldCheck, Inbox, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FileUploadChoice } from "./FileUploadChoice";

interface Partnership {
  id: string;
  organizationName: string;
  organizationType: string;
  contactName: string;
  email: string;
  phone?: string | null;
  collaborationArea: string;
  proposalDetails: string;
  logoUrl?: string | null;
  isApproved: boolean;
  isRejected: boolean;
  adminNotes?: string | null;
  createdAt: string | Date;
}

const SECTORS = [
  { label: "All", icon: LayoutGrid },
  { label: "SMEs & Startups", icon: Building2 },
  { label: "Women-Owned Businesses", icon: Users },
  { label: "Universities & Education", icon: GraduationCap },
  { label: "NGOs & Development Organizations", icon: HeartHandshake },
  { label: "Government Institutions", icon: Landmark },
  { label: "Technology Companies", icon: Cpu },
  { label: "Researchers & Professionals", icon: Microscope },
];

const CORE_NAMES = [
  "SMEs & Startups",
  "Women-Owned Businesses",
  "Universities & Education",
  "NGOs & Development Organizations",
  "Government Institutions",
  "Technology Companies",
  "Researchers & Professionals",
];

export function PartnershipManager({
  initialPartnerships,
}: {
  initialPartnerships: Partnership[];
  initialOrgTypes?: any[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Partnership[]>(initialPartnerships);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [viewMode, setViewMode] = useState<"registered" | "inquiries">("registered");
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");

  // Drawers state
  const [selected, setSelected] = useState<Partnership | null>(null); // View Drawer
  const [editing, setEditing] = useState<Partnership | null>(null);   // Edit Drawer
  const [showCreate, setShowCreate] = useState(false);                 // Create Drawer

  // Create form state & validation errors
  const [createForm, setCreateForm] = useState({
    organizationName: "",
    organizationType: "SMEs & Startups",
    contactName: "",
    email: "",
    phone: "",
    collaborationArea: "",
    proposalDetails: "",
    isApproved: true,
    isRejected: false,
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    organizationName: "",
    organizationType: "",
    contactName: "",
    email: "",
    phone: "",
    collaborationArea: "",
    proposalDetails: "",
    isApproved: false,
    isRejected: false,
    adminNotes: "",
    logoUrl: "",
  });
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = (p: Partnership) => {
    setEditing(p);
    setEditForm({
      organizationName: p.organizationName,
      organizationType: p.organizationType,
      contactName: p.contactName,
      email: p.email,
      phone: p.phone || "",
      collaborationArea: p.collaborationArea,
      proposalDetails: p.proposalDetails,
      isApproved: p.isApproved,
      isRejected: p.isRejected,
      adminNotes: p.adminNotes || "",
      logoUrl: p.logoUrl || "",
    });
  };

  const handleUpdateApproval = async (id: string, isApproved: boolean, isRejected: boolean) => {
    try {
      const target = items.find((i) => i.id === id);
      if (!target) return;
      const res = await fetch(`/api/partnerships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved, isRejected, adminNotes: target.adminNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.item : item))
        );
        router.refresh();
      } else {
        alert(data.error || "Error updating approval status");
      }
    } catch (err: unknown) {
      alert("Error updating approval status: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/partnerships/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === editing.id ? data.item : item))
        );
        setEditing(null);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Error updating partnership");
      }
    } catch {
      alert("Error updating partnership");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/partnerships/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        router.refresh();
      } else {
        alert("Error deleting item");
      }
    } catch {
      alert("Error deleting item");
    }
  };

  const validateCreate = () => {
    const errs: Record<string, string> = {};
    if (!createForm.organizationName.trim()) {
      errs.organizationName = "Organization name is required";
    } else if (createForm.organizationName.trim().length < 2) {
      errs.organizationName = "Organization name must be at least 2 characters";
    }

    if (!createForm.organizationType) {
      errs.organizationType = "Organization type is required";
    }

    if (!createForm.contactName.trim()) {
      errs.contactName = "Contact name is required";
    } else if (createForm.contactName.trim().length < 2) {
      errs.contactName = "Contact name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createForm.email.trim()) {
      errs.email = "Email address is required";
    } else if (!emailRegex.test(createForm.email.trim())) {
      errs.email = "Please enter a valid email address (e.g. name@org.com)";
    }

    if (!createForm.collaborationArea.trim()) {
      errs.collaborationArea = "Collaboration area is required";
    }

    if (!createForm.proposalDetails.trim()) {
      errs.proposalDetails = "Proposal details are required";
    } else if (createForm.proposalDetails.trim().length < 10) {
      errs.proposalDetails = "Proposal details must be at least 10 characters";
    }

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [data.item, ...prev]);
        setShowCreate(false);
        setCreateErrors({});
        setCreateForm({
          organizationName: "",
          organizationType: SECTORS[1].label,
          contactName: "",
          email: "",
          phone: "",
          collaborationArea: "",
          proposalDetails: "",
          isApproved: true,
          isRejected: false,
        });
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Error creating partnership");
      }
    } catch {
      alert("Error creating partnership");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInputChange = (field: string, value: any) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (createErrors[field]) {
      setCreateErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Separate into 2 distinct sections
  const registeredPartners = items.filter((p) => CORE_NAMES.includes(p.organizationName));
  const incomingInquiries = items.filter((p) => !CORE_NAMES.includes(p.organizationName));

  const currentDataset = viewMode === "registered" ? registeredPartners : incomingInquiries;

  const filtered = currentDataset.filter((p) => {
    const matchesTab = activeTab === "All" || p.organizationType === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      p.organizationName.toLowerCase().includes(q) ||
      p.contactName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.organizationType.toLowerCase().includes(q) ||
      p.collaborationArea.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const approvalBadge = (p: Partnership) =>
    p.isApproved
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
      : p.isRejected
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";

  const approvalText = (p: Partnership) =>
    p.isApproved ? "APPROVED" : p.isRejected ? "REJECTED" : "PENDING";

  return (
    <div className="space-y-6">
      {/* SECTION TABS TOGGLE & DISPLAY MODE TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setViewMode("registered");
              setActiveTab("All");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              viewMode === "registered"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Registered Partners ({registeredPartners.length})
          </button>
          <button
            onClick={() => {
              setViewMode("inquiries");
              setActiveTab("All");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
              viewMode === "inquiries"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Inbox className="w-4 h-4" />
            Partnership Inquiries &amp; Requesters ({incomingInquiries.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* CARDS VS TABLE TOGGLE */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setDisplayMode("cards")}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                displayMode === "cards" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" /> Cards
            </button>
            <button
              onClick={() => setDisplayMode("table")}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                displayMode === "table" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" /> Table
            </button>
          </div>

          <button
            onClick={() => {
              setCreateErrors({});
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> New Partnership
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              viewMode === "registered"
                ? "Search registered partners..."
                : "Search partnership inquiries & requesters..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition"
          />
        </div>
      </div>

      {viewMode === "registered" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const count =
              sector.label === "All"
                ? registeredPartners.length
                : registeredPartners.filter((p) => p.organizationType === sector.label).length;
            const isActive = activeTab === sector.label;
            return (
              <button
                key={sector.label}
                onClick={() => setActiveTab(sector.label)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition cursor-pointer ${
                  isActive
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-sm"
                    : "bg-card border-border hover:bg-muted/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-[#0875D1]"}`} />
                <span className="text-[10px] font-semibold text-muted-foreground leading-tight line-clamp-1">{sector.label}</span>
                <span className={`text-lg font-black ${isActive ? "text-blue-600 dark:text-blue-400" : "text-[#08245C] dark:text-white"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FILTERED DISPLAY (CARDS OR TABLE) */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center shadow-sm">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-base font-semibold text-foreground">
            {viewMode === "registered" ? "No registered partners found" : "No partnership inquiries or requesters found"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Try searching or submitting a form via the public partnerships page</p>
        </div>
      ) : displayMode === "cards" ? (
        // CARD VIEW
        <div className={viewMode === "registered" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}>
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 truncate max-w-[60%]">
                    {p.organizationType}
                  </span>
                  {viewMode === "inquiries" && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap ${approvalBadge(p)}`}>
                      {approvalText(p)}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#08245C] dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                    {p.organizationName}
                  </h3>
                  {viewMode === "inquiries" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">{p.contactName}</span>
                      <span>•</span>
                      <span className="font-mono">{p.email}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{p.collaborationArea}</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed text-xs">
                    {p.proposalDetails}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs gap-2">
                {/* APPROVAL & REJECTION BUTTONS ONLY FOR INQUIRIES & REQUESTERS */}
                {viewMode === "inquiries" ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateApproval(p.id, true, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold transition cursor-pointer"
                      title="Approve Inquiry"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateApproval(p.id, false, true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-bold transition cursor-pointer"
                      title="Reject Inquiry"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Official Partner</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelected(p)}
                    title="View Details"
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    title="Edit"
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // TABLE VIEW
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Organization</th>
                  {viewMode === "inquiries" && <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contact</th>}
                  <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Collaboration Area</th>
                  {viewMode === "inquiries" && <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Approval Status</th>}
                  <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-foreground text-sm">{p.organizationName}</span>
                      <span className="block text-[11px] text-muted-foreground font-medium mt-0.5">{p.organizationType}</span>
                    </td>
                    {viewMode === "inquiries" && (
                      <td className="py-3.5 px-5">
                        <span className="text-foreground text-sm">{p.contactName}</span>
                        <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">{p.email}</span>
                      </td>
                    )}
                    <td className="py-3.5 px-5 text-sm text-slate-600 dark:text-slate-400">{p.collaborationArea}</td>
                    {viewMode === "inquiries" && (
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${approvalBadge(p)}`}>
                          {approvalText(p)}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-5 text-muted-foreground text-xs whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {viewMode === "inquiries" && (
                          <>
                            <button
                              onClick={() => handleUpdateApproval(p.id, true, false)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateApproval(p.id, false, true)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelected(p)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  <h3 className="text-lg font-black text-[#08245C] dark:text-white">Partnership Details</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Review full proposal and communication history</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {selected.organizationType}
                    </span>
                    {!CORE_NAMES.includes(selected.organizationName) && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${approvalBadge(selected)}`}>
                        {approvalText(selected)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-[#08245C] dark:text-white">{selected.organizationName}</h2>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Users className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Contact Person</span>
                      <span className="font-semibold">{selected.contactName}</span>
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
                    <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Collaboration Area</span>
                      <span className="font-medium">{selected.collaborationArea}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proposal Details</h4>
                  <div className="bg-muted/40 p-4 rounded-2xl text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {selected.proposalDetails}
                  </div>
                </div>

                {selected.adminNotes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Staff Notes</h4>
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 p-4 rounded-2xl text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {selected.adminNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-card flex justify-end gap-2 shrink-0">
                {!CORE_NAMES.includes(selected.organizationName) && (
                  <>
                    <button
                      onClick={() => handleUpdateApproval(selected.id, true, false)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                      Approve Inquiry
                    </button>
                    <button
                      onClick={() => handleUpdateApproval(selected.id, false, true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                      Reject Inquiry
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

      {/* EDIT DRAWER */}
      {editing && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setEditing(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 z-50">
            <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              <div className="px-6 py-5 border-b border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#08245C] dark:text-white">Edit Partnership</h3>
                    <p className="text-xs text-muted-foreground">Modify organization details and status</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Organization Name *</label>
                  <input
                    type="text"
                    value={editForm.organizationName}
                    onChange={(e) => setEditForm({ ...editForm, organizationName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Organization Type *</label>
                  <select
                    value={editForm.organizationType}
                    onChange={(e) => setEditForm({ ...editForm, organizationType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {SECTORS.filter((s) => s.label !== "All").map((s) => (
                      <option key={s.label} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Contact Name *</label>
                    <input
                      type="text"
                      value={editForm.contactName}
                      onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Collaboration Area *</label>
                    <input
                      type="text"
                      value={editForm.collaborationArea}
                      onChange={(e) => setEditForm({ ...editForm, collaborationArea: e.target.value })}
                      className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Proposal Details *</label>
                  <textarea
                    rows={4}
                    value={editForm.proposalDetails}
                    onChange={(e) => setEditForm({ ...editForm, proposalDetails: e.target.value })}
                    className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {!CORE_NAMES.includes(editForm.organizationName) && (
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isApproved}
                        onChange={(e) => setEditForm({ ...editForm, isApproved: e.target.checked, isRejected: e.target.checked ? false : editForm.isRejected })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm font-bold text-foreground">Approved</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isRejected}
                        onChange={(e) => setEditForm({ ...editForm, isRejected: e.target.checked, isApproved: e.target.checked ? false : editForm.isApproved })}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                      <span className="text-sm font-bold text-foreground">Rejected</span>
                    </label>
                  </div>
                )}

                {/* Partner Logo */}
                <div>
                  <FileUploadChoice
                    label="Partner Logo"
                    fileType="image"
                    value={editForm.logoUrl}
                    onChange={(url) => setEditForm({ ...editForm, logoUrl: url })}
                    folder="partners"
                    placeholder="/uploads/... or https://..."
                    helperText="PNG, JPG, WebP or SVG. Shown next to the partner name on the public partners showcase."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Staff Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.adminNotes}
                    onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                    placeholder="Record follow-up notes..."
                    className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border bg-card flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-muted rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DRAWER */}
      {showCreate && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setShowCreate(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10 z-50">
            <div className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              <div className="px-6 py-5 border-b border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#08245C] dark:text-white">New Partnership</h3>
                    <p className="text-xs text-muted-foreground">Add a new organization to the network</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Organization Name *</label>
                  <input
                    type="text"
                    value={createForm.organizationName}
                    onChange={(e) => handleCreateInputChange("organizationName", e.target.value)}
                    className={`w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                      createErrors.organizationName
                        ? "border border-red-500 focus:ring-red-400/30"
                        : "border border-slate-300 dark:border-slate-600 focus:ring-blue-500/20"
                    }`}
                    placeholder="e.g. TechVentures Ltd"
                  />
                  {createErrors.organizationName && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{createErrors.organizationName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Organization Type *</label>
                  <select
                    value={createForm.organizationType}
                    onChange={(e) => handleCreateInputChange("organizationType", e.target.value)}
                    className={`w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition ${
                      createErrors.organizationType
                        ? "border border-red-500 focus:ring-red-400/30"
                        : "border border-slate-300 dark:border-slate-600 focus:ring-blue-500/20"
                    }`}
                  >
                    {SECTORS.filter((s) => s.label !== "All").map((s) => (
                      <option key={s.label} value={s.label}>{s.label}</option>
                    ))}
                  </select>
                  {createErrors.organizationType && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{createErrors.organizationType}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Contact Name *</label>
                    <input
                      type="text"
                      value={createForm.contactName}
                      onChange={(e) => handleCreateInputChange("contactName", e.target.value)}
                      className={`w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                        createErrors.contactName
                          ? "border border-red-500 focus:ring-red-400/30"
                          : "border border-slate-300 dark:border-slate-600 focus:ring-blue-500/20"
                      }`}
                      placeholder="Full name"
                    />
                    {createErrors.contactName && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{createErrors.contactName}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => handleCreateInputChange("email", e.target.value)}
                      className={`w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                        createErrors.email
                          ? "border border-red-500 focus:ring-red-400/30"
                          : "border border-slate-300 dark:border-slate-600 focus:ring-blue-500/20"
                      }`}
                      placeholder="email@org.com"
                    />
                    {createErrors.email && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{createErrors.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={(e) => handleCreateInputChange("phone", e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/50 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="+252 ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Collaboration Area *</label>
                    <input
                      type="text"
                      value={createForm.collaborationArea}
                      onChange={(e) => handleCreateInputChange("collaborationArea", e.target.value)}
                      className={`w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                        createErrors.collaborationArea
                          ? "border border-red-500 focus:ring-red-400/30"
                          : "border border-slate-300 dark:border-slate-600 focus:ring-blue-500/20"
                      }`}
                      placeholder="e.g. Research, Incubation"
                    />
                    {createErrors.collaborationArea && (
                      <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{createErrors.collaborationArea}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Proposal Details *</label>
                  <textarea
                    rows={4}
                    value={createForm.proposalDetails}
                    onChange={(e) => handleCreateInputChange("proposalDetails", e.target.value)}
                    className={`w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                      createErrors.proposalDetails
                        ? "border border-red-500 focus:ring-red-400/30"
                        : "border border-slate-300 dark:border-slate-600 focus:ring-blue-500/20"
                    }`}
                    placeholder="Describe the partnership proposal..."
                  />
                  {createErrors.proposalDetails && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{createErrors.proposalDetails}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border bg-card flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-muted rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Partnership"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
