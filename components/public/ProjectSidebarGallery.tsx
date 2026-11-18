"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Images,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";

export interface GalleryItem {
  id?: string;
  imageUrl: string;
  caption?: string | null;
  alt?: string | null;
  order?: number;
}

interface ProjectSidebarGalleryProps {
  gallery: GalleryItem[];
  projectTitle: string;
  studentInnovators?: Array<{
    id?: string;
    name: string;
    role?: string | null;
    avatar?: string | null;
  }>;
}

export function ProjectSidebarGallery({
  gallery,
  projectTitle,
  studentInnovators = [],
}: ProjectSidebarGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setActiveModalIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (activeModalIndex === null) return;
    setActiveModalIndex((prev) =>
      prev! > 0 ? prev! - 1 : gallery.length - 1
    );
  }, [activeModalIndex, gallery.length]);

  const handleNext = useCallback(() => {
    if (activeModalIndex === null) return;
    setActiveModalIndex((prev) =>
      prev! < gallery.length - 1 ? prev! + 1 : 0
    );
  }, [activeModalIndex, gallery.length]);

  useEffect(() => {
    if (activeModalIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeModalIndex, handleClose, handleNext, handlePrev]);

  useEffect(() => {
    if (activeModalIndex === null || !thumbnailsRef.current) return;

    const container = thumbnailsRef.current;
    const activeThumbnail = container.querySelector<HTMLElement>(
      `[data-gallery-index="${activeModalIndex}"]`,
    );

    if (activeThumbnail) {
      const containerWidth = container.offsetWidth;
      const left =
        activeThumbnail.offsetLeft -
        containerWidth / 2 +
        activeThumbnail.offsetWidth / 2;

      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeModalIndex]);

  if (!gallery || gallery.length === 0) {
    return null;
  }

  const initialLimit = 6;
  const visibleItems = isExpanded ? gallery : gallery.slice(0, initialLimit);
  const hasMore = gallery.length > initialLimit;
  const remainingCount = gallery.length - initialLimit;

  return (
    <>
      {/* Sidebar Gallery Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#0875D1] flex items-center justify-center">
              <Images className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#08245C] dark:text-white">
                Project Gallery
              </h3>
              <p className="text-[10px] text-slate-400">
                Prototypes &amp; Screenshots
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {gallery.length} {gallery.length === 1 ? "photo" : "photos"}
          </span>
        </div>

        {/* Thumbnail Grid (2 or 3 cols) */}
        <div className="grid grid-cols-3 gap-2.5">
          {visibleItems.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              onClick={() => setActiveModalIndex(idx)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 hover:ring-2 hover:ring-[#0875D1] transition-all hover:scale-[1.03] cursor-pointer"
            >
              <Image
                src={item.imageUrl}
                alt={item.alt || `${projectTitle} gallery item ${idx + 1}`}
                fill
                className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>

        {/* Load More / Load Less Button */}
        {hasMore && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 hover:from-blue-100 hover:to-indigo-100 dark:hover:bg-slate-700/80 text-[#0875D1] dark:text-sky-400 font-bold text-xs flex items-center justify-center gap-2 border border-blue-200/60 dark:border-slate-700 transition-all shadow-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Load Less (Show 6)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                  <span>Load More (+{remainingCount} more)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeModalIndex !== null && (
        typeof document !== "undefined"
          ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${projectTitle} project gallery`}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-2xl sm:p-6"
          onClick={handleClose}
        >
          <div
            className="flex w-full max-w-3xl flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex w-full items-center justify-between gap-3 px-1 text-white">
              <div className="min-w-0 pr-2">
                <p className="truncate text-lg font-bold sm:text-xl">
                  {projectTitle}
                </p>
                <p className="mt-0.5 text-xs font-medium text-white/65 sm:text-sm">
                  Project Gallery
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {studentInnovators.length > 0 && (
                  <div className="flex items-center" aria-label="Student Innovators">
                    {studentInnovators.slice(0, 4).map((student, index) => {
                      const initials =
                        student.name
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "SI";

                      return (
                        <div
                          key={student.id || `${student.name}-${index}`}
                          className="relative -ml-2 first:ml-0 h-9 w-9 overflow-hidden rounded-full border-2 border-slate-950 bg-slate-700 sm:h-10 sm:w-10"
                          title={`${student.name}${student.role ? ` - ${student.role}` : ""}`}
                        >
                          {student.avatar ? (
                            <Image
                              src={student.avatar}
                              alt={student.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                              {initials}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {studentInnovators.length > 4 && (
                      <div className="ml-1 rounded-full border border-white/20 bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-white">
                        +{studentInnovators.length - 4}
                      </div>
                    )}
                  </div>
                )}
                {gallery.length > 1 && (
                  <p className="shrink-0 rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-xs font-bold text-white/90 backdrop-blur-md sm:text-sm">
                    {activeModalIndex + 1} / {gallery.length}
                  </p>
                )}
              </div>
            </div>
            <div className="relative flex h-[62vh] w-full items-center justify-center overflow-hidden sm:h-[68vh]">
              <Image
                src={gallery[activeModalIndex].imageUrl}
                alt={gallery[activeModalIndex].alt || `${projectTitle} preview`}
                width={1600}
                height={1600}
                sizes="(max-width: 640px) calc(100vw - 24px), calc(100vw - 48px)"
                className="h-full w-full object-contain"
                priority
              />
            </div>

            {gallery.length > 1 && (
              <div
                ref={thumbnailsRef}
                className="max-w-full overflow-x-auto py-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="flex h-16 w-fit gap-0.5 pb-1 sm:h-20">
                  {gallery.map((item, index) => (
                    <motion.button
                      key={item.id || index}
                      type="button"
                      data-gallery-index={index}
                      onClick={() => setActiveModalIndex(index)}
                      initial={false}
                      animate={index === activeModalIndex ? "active" : "inactive"}
                      variants={{
                        active: { width: 120, marginLeft: 2, marginRight: 2 },
                        inactive: { width: 35, marginLeft: 0, marginRight: 0 },
                      }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="relative h-full shrink-0 overflow-hidden rounded-md"
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleClose();
            }}
            className="fixed right-3 top-3 z-[110] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-slate-950/80 text-white shadow-xl backdrop-blur-md transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white sm:right-5 sm:top-5"
            title="Close preview (Esc)"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handlePrev();
                }}
                className="fixed left-3 top-1/2 z-[110] inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white shadow-xl backdrop-blur-md transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-white sm:left-5"
                title="Previous photo"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleNext();
                }}
                className="fixed right-3 top-1/2 z-[110] inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white shadow-xl backdrop-blur-md transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-white sm:right-5"
                title="Next photo"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>,
        document.body
          )
          : null
      )}
    </>
  );
}
