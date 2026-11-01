"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Search,
  FolderGit2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryWithCount {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: (
    categoryNames: string[],
    renamedInfo?: { oldName: string; newName: string }
  ) => void;
}

export function ProjectCategoryModal({
  isOpen,
  onClose,
  onCategoriesUpdated,
}: ProjectCategoryModalProps) {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Form State
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Fetch categories when modal opens
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/categories");
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        if (Array.isArray(data.names)) {
          onCategoriesUpdated(data.names);
        }
      } else {
        setError(data.error || "Failed to load categories");
      }
    } catch {
      setError("Network error while loading categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setEditingCategory(null);
      setNameInput("");
      setDescriptionInput("");
      setError(null);
      setSuccessMessage(null);
      setDeletingId(null);
    }
  }, [isOpen]);

  // Handle Edit Click
  const handleStartEdit = (cat: CategoryWithCount) => {
    setEditingCategory(cat);
    setNameInput(cat.name);
    setDescriptionInput(cat.description || "");
    setError(null);
    setSuccessMessage(null);
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNameInput("");
    setDescriptionInput("");
    setError(null);
    setSuccessMessage(null);
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (editingCategory) {
        // UPDATE
        const res = await fetch("/api/projects/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: trimmedName,
            description: descriptionInput.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update category");
        }

        const oldName = editingCategory.name;
        setCategories(data.categories);
        onCategoriesUpdated(data.names, { oldName, newName: trimmedName });
        setSuccessMessage(
          `Category "${trimmedName}" updated successfully${
            data.affectedProjects > 0 ? ` (${data.affectedProjects} project(s) updated)` : ""
          }`
        );
        handleCancelEdit();
      } else {
        // CREATE
        const res = await fetch("/api/projects/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description: descriptionInput.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to create category");
        }

        setCategories(data.categories);
        onCategoriesUpdated(data.names);
        setSuccessMessage(`Category "${trimmedName}" created successfully!`);
        setNameInput("");
        setDescriptionInput("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (cat: CategoryWithCount) => {
    if (cat.projectCount > 0) {
      setError(
        `Cannot delete "${cat.name}": ${cat.projectCount} project(s) are currently assigned to it. Please reassign those projects first.`
      );
      return;
    }

    setDeletingLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/projects/categories?id=${encodeURIComponent(cat.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete category");
      }

      setCategories(data.categories);
      onCategoriesUpdated(data.names);
      setSuccessMessage(`Category "${cat.name}" deleted successfully.`);
      setDeletingId(null);
      if (editingCategory?.id === cat.id) {
        handleCancelEdit();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0c1a2e] border border-border dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-[#0875D1] dark:text-sky-400 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                Project Categories
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-[#0875D1] dark:text-sky-400 border border-blue-200 dark:border-blue-900">
                  {categories.length}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create, update, and manage project categories. Changes apply directly to project creation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="flex-1">{successMessage}</div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Create / Edit Form Card */}
          <div
            className={cn(
              "p-4 sm:p-5 rounded-2xl border transition-all",
              editingCategory
                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60"
                : "bg-slate-50 dark:bg-slate-900/50 border-border dark:border-slate-800"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                {editingCategory ? (
                  <>
                    <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Edit Category: {editingCategory.name}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-[#0875D1] dark:text-sky-400" />
                    <span>Add New Category</span>
                  </>
                )}
              </h3>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {editingCategory && editingCategory.projectCount > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 p-2 rounded-xl mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Renaming will automatically update <strong>{editingCategory.projectCount} project(s)</strong> currently assigned to this category.
                </span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI & Robotics, FinTech, GreenTech..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={60}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0875D1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of this field..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    maxLength={300}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0875D1]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !nameInput.trim()}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    editingCategory
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-[#0875D1] hover:bg-blue-600 dark:bg-sky-500 dark:hover:bg-sky-600"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{editingCategory ? "Saving..." : "Creating..."}</span>
                    </>
                  ) : editingCategory ? (
                    <>
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Update Category</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Categories List Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Existing Categories ({categories.length})
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-[#0875D1]"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs font-medium">Loading categories...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border rounded-2xl text-muted-foreground text-xs">
                No categories match your search.
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isEditingThis = editingCategory?.id === cat.id;
                  const isConfirmingDelete = deletingId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                        isEditingThis
                          ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                          : "bg-white dark:bg-slate-950/60 border-border dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#deedff] dark:bg-[#152e4f] text-[#0875D1] dark:text-sky-300">
                            {cat.name}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md",
                              cat.projectCount > 0
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                            )}
                          >
                            <FolderGit2 className="w-3 h-3" />
                            <span>
                              {cat.projectCount} {cat.projectCount === 1 ? "project" : "projects"}
                            </span>
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/80 p-1 rounded-xl border border-red-200 dark:border-red-900 animate-in fade-in">
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-300 px-1">
                              Delete?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              disabled={deletingLoading}
                              className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold cursor-pointer"
                            >
                              {deletingLoading ? "..." : "Yes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-foreground text-[10px] font-bold cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#0875D1] flex items-center justify-center transition cursor-pointer"
                              title="Edit Category Name & Description"
                              aria-label={`Edit ${cat.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (cat.projectCount > 0) {
                                  setError(
                                    `Cannot delete "${cat.name}": ${cat.projectCount} project(s) are currently assigned to it. Please reassign those projects first.`
                                  );
                                } else {
                                  setDeletingId(cat.id);
                                }
                              }}
                              className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer",
                                cat.projectCount > 0
                                  ? "text-slate-300 dark:text-slate-700 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30"
                                  : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60"
                              )}
                              title={
                                cat.projectCount > 0
                                  ? `In use by ${cat.projectCount} project(s)`
                                  : "Delete Category"
                              }
                              aria-label={`Delete ${cat.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <p className="text-[11px] text-muted-foreground">
            Categories apply immediately across JANIC project filters & showcase forms.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-foreground transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

