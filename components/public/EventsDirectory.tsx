"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Search,
  Filter,
  PlayCircle,
  Camera,
  Sparkles,
  History,
  Clock,
  ChevronDown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface EventItemData {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  eventDate: string | Date;
  endDate?: string | Date | null;
  location: string;
  capacity?: number | null;
  attendeesCount?: number | null;
  registrationUrl?: string | null;
  coverImage?: string | null;
  videoUrl?: string | null;
  gallery?: any;
  guests?: any;
  agenda?: any;
  keyHighlights?: any;
  status: string;
  isFeatured?: boolean;
}

interface EventsDirectoryProps {
  events: EventItemData[];
}

export function EventsDirectory({ events }: EventsDirectoryProps) {
  // CRITICAL REQUIREMENT: Initial state defaults to "past" (Past Events Hosted by JANIC)
  // when past events exist; otherwise "all" so the page is never empty on first render.
  const [timeFilter, setTimeFilter] = useState<"past" | "upcoming" | "all">(() => {
    const nowDate = new Date();
    return events.some((e) => new Date(e.eventDate) < nowDate) ? "past" : "all";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 9;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, selectedCategory, selectedYear, searchQuery]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [events]);

  // Extract unique years
  const years = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      const y = new Date(e.eventDate).getFullYear();
      if (!isNaN(y)) set.add(y.toString());
    });
    return ["ALL", ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [events]);

  // Current system date for comparison
  const now = useMemo(() => new Date(), []);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const eventDate = new Date(e.eventDate);
      const isPast = eventDate < now;

      // 1. Time filter
      if (timeFilter === "past" && !isPast) return false;
      if (timeFilter === "upcoming" && isPast) return false;

      // 2. Category filter
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) {
        return false;
      }

      // 3. Year filter
      if (selectedYear !== "ALL") {
        const eventYear = new Date(e.eventDate).getFullYear().toString();
        if (eventYear !== selectedYear) return false;
      }

      // 4. Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesSummary = e.summary?.toLowerCase().includes(query);
        const matchesLocation = e.location?.toLowerCase().includes(query);
        const matchesCategory = e.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSummary && !matchesLocation && !matchesCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Past events sorted most recent first; upcoming sorted closest first
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      if (timeFilter === "past") {
        return dateB - dateA; // Descending (most recent past event first)
      } else if (timeFilter === "upcoming") {
        return dateA - dateB; // Ascending (next upcoming event first)
      }
      return dateB - dateA;
    });
  }, [events, timeFilter, selectedCategory, selectedYear, searchQuery, now]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage, ITEMS_PER_PAGE]);

  // Count past and upcoming for badges
  const counts = useMemo(() => {
    let pastCount = 0;
    let upcomingCount = 0;
    events.forEach((e) => {
      if (new Date(e.eventDate) < now) pastCount++;
      else upcomingCount++;
    });
    return { past: pastCount, upcoming: upcomingCount, all: events.length };
  }, [events, now]);

  return (
    <div className="space-y-8">
      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6">
          {/* Main Dropdown Filter for Past vs Upcoming */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <label htmlFor="timeFilterSelect" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Filter Events
              </label>
              <div className="relative min-w-[280px]">
                <select
                  id="timeFilterSelect"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as "past" | "upcoming" | "all")}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 dark:border-blue-500/40 hover:border-blue-500 dark:hover:border-blue-400 focus:border-blue-600 rounded-2xl px-4 py-3 pr-10 text-xs sm:text-sm font-bold text-[#08245C] dark:text-white cursor-pointer shadow-xs transition"
                >
                  <option value="past">Past Events Hosted by JANIC ({counts.past})</option>
                  <option value="upcoming">Upcoming Events ({counts.upcoming})</option>
                  <option value="all">All Events ({counts.all})</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none" />
              </div>
            </div>

            {/* Quick Segmented Toggle for 1-Click Access */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 self-end sm:self-auto mt-auto">
              <button
                type="button"
                onClick={() => setTimeFilter("past")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  timeFilter === "past"
                    ? "bg-[#08245C] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Past ({counts.past})</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("upcoming")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  timeFilter === "upcoming"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Upcoming ({counts.upcoming})</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("all")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  timeFilter === "all"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>All ({counts.all})</span>
              </button>
            </div>
          </div>

          {/* Search, Year & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Year Dropdown */}
            <div className="min-w-[130px]">
              <label htmlFor="yearSelect" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Year
              </label>
              <div className="relative">
                <select
                  id="yearSelect"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500 appearance-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === "ALL" ? "All Years" : `Year ${y}`}
                    </option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="min-w-[160px]">
              <label htmlFor="categorySelect" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                id="categorySelect"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-60">
              <label htmlFor="eventSearchInput" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="eventSearchInput"
                  type="text"
                  placeholder="Search events, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Year Selection Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Filter by Year:
            </span>
            {years.map((y) => {
              const isActive = selectedYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{y === "ALL" ? "All Years" : y}</span>
                </button>
              );
            })}
          </div>

          {(selectedYear !== "ALL" || selectedCategory !== "ALL" || searchQuery.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setSelectedYear("ALL");
                setSelectedCategory("ALL");
                setSearchQuery("");
              }}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Dynamic Context Header */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold text-[#08245C] dark:text-white">
              {timeFilter === "past" && "Displaying Past Events Hosted by JANIC"}
              {timeFilter === "upcoming" && "Displaying Upcoming JANIC Events"}
              {timeFilter === "all" && "Displaying All JANIC Events"}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found)
            </span>

            {/* Active Year Badge */}
            {selectedYear !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                Year: {selectedYear}
                <button
                  type="button"
                  onClick={() => setSelectedYear("ALL")}
                  className="hover:text-blue-950 dark:hover:text-white ml-0.5 text-xs cursor-pointer"
                  title="Clear year filter"
                >
                  &times;
                </button>
              </span>
            )}
          </div>

          {timeFilter === "past" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              Includes photo galleries &amp; video recaps
            </div>
          )}
        </div>
      </div>

      {/* EVENTS GRID */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#08245C] dark:text-white">
            No events found matching your filter
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search query, selecting another category or year, or toggling between past and upcoming events.
          </p>
          <button
            onClick={() => {
              setTimeFilter("past");
              setSelectedCategory("ALL");
              setSelectedYear("ALL");
              setSearchQuery("");
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedEvents.map((event) => {
              const eventDateObj = new Date(event.eventDate);
              const isPast = eventDateObj < now;

              const dayStr = isNaN(eventDateObj.getDate())
                ? "15"
                : String(eventDateObj.getDate()).padStart(2, "0");
              const monthStr = isNaN(eventDateObj.getMonth())
                ? "DEC"
                : eventDateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
              const yearStr = isNaN(eventDateObj.getFullYear())
                ? "2025"
                : eventDateObj.getFullYear();

              // Parse gallery count & guest avatars
              let galleryCount = 0;
              try {
                if (typeof event.gallery === "string") {
                  galleryCount = JSON.parse(event.gallery).length;
                } else if (Array.isArray(event.gallery)) {
                  galleryCount = event.gallery.length;
                }
              } catch {}

              let guestsList: any[] = [];
              try {
                if (typeof event.guests === "string") {
                  guestsList = JSON.parse(event.guests);
                } else if (Array.isArray(event.guests)) {
                  guestsList = event.guests;
                }
              } catch {}

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/90 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-2xl dark:hover:shadow-slate-950/80 transition-all duration-300 group hover:-translate-y-1.5 cursor-pointer no-underline"
                >
                  <div>
                    {/* Event Cover Image with Badges */}
                    <div className="aspect-[16/9] relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <Image
                        src={event.coverImage || "/images/event-summit.jpg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Gradient shade */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                      {/* Top-Left Date Badge */}
                      <div className="absolute top-3.5 left-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-center shadow-lg border border-white/60 dark:border-slate-700/60 min-w-[52px]">
                        <div className="text-base sm:text-lg font-black text-[#08245C] dark:text-white leading-none">
                          {dayStr}
                        </div>
                        <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-0.5">
                          {monthStr}
                        </div>
                        <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                          {yearStr}
                        </div>
                      </div>

                      {/* Top-Right Status Badge */}
                      <div className="absolute top-3.5 right-3.5 flex flex-col items-end gap-1">
                        {isPast ? (
                          <span className="bg-slate-950/85 backdrop-blur-md text-emerald-400 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Hosted by JANIC
                          </span>
                        ) : (
                          <span className="bg-blue-600/95 backdrop-blur-md text-white border border-blue-400/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Upcoming
                          </span>
                        )}
                        <span className="bg-white/90 dark:bg-slate-800/90 text-[#08245C] dark:text-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
                          {event.category}
                        </span>
                      </div>

                      {/* Bottom Media Badges (Video & Photo count) */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        {event.videoUrl && (
                          <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/20">
                            <PlayCircle className="w-3 h-3 text-red-400 fill-red-400/20" />
                            Video Recap
                          </span>
                        )}
                        {galleryCount > 0 && (
                          <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/20">
                            <Camera className="w-3 h-3 text-cyan-400" />
                            {galleryCount} Photos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 sm:p-7">
                      <h3 className="text-lg font-bold text-[#08245C] dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                        {event.summary}
                      </p>

                      {/* Metadata Strip */}
                      <div className="space-y-2 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>
                              {isPast
                                ? `${event.attendeesCount || event.capacity || 250}+ Attendees`
                                : `Capacity: ${event.capacity || 100} Seats`}
                            </span>
                          </div>

                          {/* Guest Avatars Stack */}
                          {guestsList.length > 0 && (
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              {guestsList.slice(0, 3).map((g, gIdx) => (
                                <div
                                  key={gIdx}
                                  className="relative w-6 h-6 rounded-full border border-white dark:border-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-700"
                                  title={g.name}
                                >
                                  {g.avatar ? (
                                    <Image src={g.avatar} alt={g.name} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-blue-600">
                                      {g.name?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {guestsList.length > 3 && (
                                <span className="text-[10px] font-bold text-slate-400 pl-2">
                                  +{guestsList.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </Link>
              );
            })}
          </div>

          {/* NUMBERS UNDER: PAGINATION CONTROLS */}
          {(totalPages > 1 || filteredEvents.length >= 9) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}</span> of{" "}
                <span className="font-bold text-slate-900 dark:text-white">{filteredEvents.length}</span> events
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(p - 1, 1));
                    window.scrollTo({ top: 380, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(p + 1, totalPages));
                    window.scrollTo({ top: 380, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages || totalPages <= 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
