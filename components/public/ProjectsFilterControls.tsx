"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  ChevronDown,
  Check,
  Calendar,
  Sparkles,
  X,
} from "lucide-react";

interface ProjectsFilterControlsProps {
  categories: string[];
  currentCategory: string;
  currentYear: string;
  searchQuery: string;
  totalProjectsCount: number;
}

export function ProjectsFilterControls({
  categories,
  currentCategory,
  currentYear,
  searchQuery,
  totalProjectsCount,
}: ProjectsFilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateFilters = (updates: {
    category?: string;
    year?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category === "all") {
        params.delete("category");
      } else {
        params.set("category", updates.category);
      }
    }

    if (updates.year !== undefined) {
      if (updates.year === "all") {
        params.delete("year");
      } else {
        params.set("year", updates.year);
      }
    }

    if (updates.q !== undefined) {
      if (!updates.q.trim()) {
        params.delete("q");
      } else {
        params.set("q", updates.q.trim());
      }
    }

    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchTerm });
  };

  const years = [
    { id: "all", label: "All Years" },
    { id: "2026", label: "2026", isCurrent: true },
    { id: "2027", label: "2027" },
    { id: "2028", label: "2028" },
  ];

  const selectedCategoryLabel =
    currentCategory === "all" ? "All Categories" : currentCategory;

  const hasActiveFilters =
    currentCategory !== "all" || currentYear !== "all" || !!searchQuery;

  return (
    <div className="relative z-30 space-y-5 mb-10 sm:mb-12">
      {/* Top Search & Category Dropdown Bar */}
      <div className="relative z-30 flex flex-col md:flex-row items-center gap-3">
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 w-full"
        >
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#0075ff] dark:text-[#80c2ff]" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by title, problem, or technology (e.g. Next.js, Arduino, AI)..."
            className="w-full pl-12 pr-28 py-4 bg-white dark:bg-[#0f1e35] border border-white dark:border-[#273b56] rounded-full text-sm text-[#08245C] dark:text-white placeholder:text-[#8a9bbd] shadow-[0_10px_28px_rgb(46_114_187/8%)] focus:outline-none focus:ring-2 focus:ring-[#0075ff]/60 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                updateFilters({ q: "" });
              }}
              className="absolute inset-y-0 right-24 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-6 bg-[#0075ff] hover:bg-[#0064dd] dark:bg-[#0869db] dark:hover:bg-[#1478ed] text-white font-bold text-sm rounded-full transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Custom Category Dropdown */}
        <div className="relative z-40 w-full md:w-72 shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setCategoryOpen(!categoryOpen)}
            aria-expanded={categoryOpen}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-[#0f1e35] hover:bg-[#f7fbff] dark:hover:bg-[#13253f] border border-white dark:border-[#273b56] rounded-full text-sm font-semibold text-[#08245C] dark:text-white shadow-[0_10px_28px_rgb(46_114_187/8%)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Filter className="w-4 h-4 text-[#0075ff] dark:text-[#80c2ff] shrink-0" />
              <span className="truncate">{selectedCategoryLabel}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                categoryOpen ? "rotate-180 text-[#0075ff]" : ""
              }`}
            />
          </button>

          {/* Animated Dropdown Menu */}
          {categoryOpen && (
            <div className="absolute right-0 top-full mt-2 w-full sm:w-80 bg-white dark:bg-[#0f1e35] rounded-2xl shadow-[0_20px_45px_rgb(28_94_165/18%)] border border-[#e2edf8] dark:border-[#273b56] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 dark:border-[#273b56] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Innovation Field
              </div>

              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => {
                  updateFilters({ category: "all" });
                  setCategoryOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  currentCategory === "all"
                    ? "bg-[#0075ff] text-white font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-[#f0f6fe] dark:hover:bg-[#152e4f]"
                }`}
              >
                <span>All Categories</span>
                {currentCategory === "all" && <Check className="w-3.5 h-3.5" />}
              </button>

              {/* Individual Categories */}
              {categories.map((cat) => {
                const isSelected = currentCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      updateFilters({ category: cat });
                      setCategoryOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-[#0075ff] text-white font-bold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-[#f0f6fe] dark:hover:bg-[#152e4f]"
                    }`}
                  >
                    <span className="truncate pr-2">{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Year Filter Bar with 2026 (green dot), 2027, 2028 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#6b7fa6] dark:text-slate-400 uppercase tracking-[0.08em] mr-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0075ff] dark:text-[#80c2ff]" /> Cohort Year:
          </span>

          {years.map((y) => {
            const isSelected = currentYear === y.id;
            return (
              <button
                key={y.id}
                type="button"
                onClick={() => updateFilters({ year: y.id })}
                aria-pressed={isSelected}
                className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-[#0075ff] text-white shadow-[0_6px_16px_rgb(0_117_255/25%)] dark:bg-[#0869db]"
                    : "bg-white dark:bg-[#0f1e35] text-[#4a5f86] dark:text-slate-300 hover:text-[#0075ff] dark:hover:text-[#80c2ff] border border-[#e2edf8] dark:border-[#273b56] hover:border-[#b9d9ff]"
                }`}
              >
                <span>{y.label}</span>

                {/* Current year green dot */}
                {y.isCurrent && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"
                    title="Current Cohort"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Reset Filters / Project Count Pill */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6b7fa6] dark:text-slate-400 font-medium">
            Showing <strong className="text-[#08245C] dark:text-white">{totalProjectsCount}</strong> {totalProjectsCount === 1 ? "project" : "projects"}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                router.push(pathname);
              }}
              className="text-sm font-bold text-[#0075ff] dark:text-[#80c2ff] hover:underline underline-offset-4 cursor-pointer"
            >
              Reset all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
