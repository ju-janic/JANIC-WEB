"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Undo2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckInScanResult, CheckInState } from "@/lib/services/guest-check-in.service";

export interface RecentCheckInItem {
  id: string;
  registrationId: string;
  checkedInAt: string;
  method: string;
  notes: string | null;
  checkedInBy: string | null;
  guest: {
    id: string;
    fullName: string;
    guestId: string | null;
    registrationRef: string;
    organization: string;
    status: string;
  };
}

interface GuestCheckInScannerProps {
  recent: RecentCheckInItem[];
  operatorName: string;
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector ??
    null
  );
}

const STATE_LABELS: Record<CheckInState, string> = {
  VALID: "Valid invitation",
  CHECKED_IN: "Checked in",
  ALREADY_CHECKED_IN: "Already checked in",
  REVOKED: "Invitation revoked",
  NOT_APPROVED: "Not approved",
  EXPIRED: "Invitation expired",
  NOT_FOUND: "Not found",
  DELETED: "Registration deleted",
};

function formatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone || "Africa/Mogadishu",
  });
}

export function GuestCheckInScanner({ recent, operatorName }: GuestCheckInScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [confirmUndoId, setConfirmUndoId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  function stopCamera() {
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectorRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => {
    return () => {
      if (scanTimerRef.current !== null) {
        window.clearTimeout(scanTimerRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function detectLoop(video: HTMLVideoElement, stream: MediaStream, detector: BarcodeDetectorLike) {
    if (streamRef.current !== stream) return;

    try {
      const codes = await detector.detect(video);
      const raw = codes[0]?.rawValue;
      if (raw) {
        stopCamera();
        setCode(raw);
        void verify(raw);
        return;
      }
    } catch {
      // A frame can fail while the camera warms up; keep scanning.
    }

    scanTimerRef.current = window.setTimeout(
      () => void detectLoop(video, stream, detector),
      250
    );
  }

  async function startCamera() {
    setCameraError(null);

    const Detector = getBarcodeDetector();
    if (!Detector) {
      setCameraError(
        "This browser does not support in-page QR scanning. Use Chrome or Edge, or type the guest ID / reference below."
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is unavailable here. Type the guest ID or registration reference below."
      );
      return;
    }

    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const detector = new Detector({ formats: ["qr_code"] });
      detectorRef.current = detector;
      setCameraOn(true);
      void detectLoop(video, stream, detector);
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access or type the code below."
          : "Could not start the camera. Type the guest ID or registration reference below."
      );
    } finally {
      setCameraStarting(false);
    }
  }

  async function verify(value: string) {
    const trimmed = value.trim();
    if (!trimmed || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/guests/check-in/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not verify this code.");
      }
      setResult(data.data as CheckInScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify this code.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function confirmCheckIn() {
    if (!code.trim() || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not check in this guest.");
      }
      setResult(data.data as CheckInScanResult);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in this guest.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function undoCheckIn(id: string) {
    setUndoingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/guests/check-in/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Could not undo this check-in.");
      }
      setConfirmUndoId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not undo this check-in.");
    } finally {
      setUndoingId(null);
    }
  }

  function reset() {
    setResult(null);
    setCode("");
    setError(null);
  }

  const timeZone = result?.event?.timezone ?? "Africa/Mogadishu";
  const stateTone = useMemo(() => {
    if (!result) return "idle";
    if (result.state === "VALID") return "valid";
    if (result.state === "CHECKED_IN") return "ok";
    if (result.state === "ALREADY_CHECKED_IN") return "warn";
    return "bad";
  }, [result]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0875D1]/10 text-[#0875D1]">
                <QrCode className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Scan invitation QR</h2>
                <p className="text-[11px] text-muted-foreground">
                  Point the camera at the guest&apos;s QR code.
                </p>
              </div>
            </div>
            {cameraOn ? (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <CameraOff className="h-3.5 w-3.5" />
                Stop camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startCamera()}
                disabled={cameraStarting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0875D1] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0668bb] transition disabled:opacity-60"
              >
                {cameraStarting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                {cameraStarting ? "Starting…" : "Start camera"}
              </button>
            )}
          </div>

          <div className="relative aspect-video w-full bg-slate-950">
            <video
              ref={videoRef}
              className={cn("h-full w-full object-cover", cameraOn ? "block" : "hidden")}
              playsInline
              muted
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <Camera className="h-8 w-8 text-slate-500" />
                <p className="text-xs font-semibold text-slate-300">
                  Camera preview is off
                </p>
                <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
                  Start the camera to scan, or use the manual field below. The QR code only
                  contains an opaque invitation token.
                </p>
              </div>
            )}
            {cameraOn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48 max-h-[70%] max-w-[70%]">
                  <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-emerald-400" />
                  <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-emerald-400" />
                  <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-emerald-400" />
                  <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-border p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void verify(code);
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Paste QR link, token, guest ID (JANIC-2026-0001) or reference"
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Verify
              </button>
            </form>
            {cameraError && (
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {cameraError}
              </p>
            )}
            {error && (
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        {result && (
          <ResultCard
            result={result}
            tone={stateTone}
            timeZone={timeZone}
            busy={busy}
            onConfirm={() => void confirmCheckIn()}
            onReset={reset}
          />
        )}
      </div>

      <aside className="space-y-3">
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#0875D1]" />
              <h2 className="text-sm font-bold text-foreground">Recent check-ins</h2>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {recent.length}
            </span>
          </div>

          {recent.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <UserCheck className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs font-semibold text-foreground">No check-ins yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Successfully scanned guests will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        {item.guest.fullName}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[#0875D1]">
                        {item.guest.guestId ?? item.guest.registrationRef}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatter(timeZone).format(new Date(item.checkedInAt))}
                        {item.checkedInBy ? ` · ${item.checkedInBy}` : ""}
                      </p>
                    </div>
                    {confirmUndoId === item.id ? (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => void undoCheckIn(item.id)}
                          disabled={undoingId === item.id}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {undoingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Undo2 className="h-3 w-3" />
                          )}
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmUndoId(null)}
                          className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmUndoId(item.id)}
                        title="Undo this check-in"
                        className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0875D1]" />
            <p className="text-[11px] font-bold text-foreground">Entry rules enforced</p>
          </div>
          <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
            <li>• Registration must be approved.</li>
            <li>• Invitation must be issued and not revoked or expired.</li>
            <li>• Each guest can be checked in only once.</li>
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Signed in as {operatorName}.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ResultCard({
  result,
  tone,
  timeZone,
  busy,
  onConfirm,
  onReset,
}: {
  result: CheckInScanResult;
  tone: "idle" | "valid" | "ok" | "warn" | "bad";
  timeZone: string;
  busy: boolean;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const Icon =
    tone === "ok" || tone === "valid"
      ? CheckCircle2
      : tone === "warn"
        ? AlertTriangle
        : XCircle;

  const styles = {
    valid: {
      border: "border-emerald-200 dark:border-emerald-900/60",
      header: "bg-emerald-50 dark:bg-emerald-950/30",
      icon: "bg-emerald-600 text-white",
      title: "text-emerald-800 dark:text-emerald-200",
    },
    ok: {
      border: "border-emerald-300 dark:border-emerald-800",
      header: "bg-emerald-600",
      icon: "bg-white/20 text-white",
      title: "text-white",
    },
    warn: {
      border: "border-amber-200 dark:border-amber-900/60",
      header: "bg-amber-50 dark:bg-amber-950/30",
      icon: "bg-amber-500 text-white",
      title: "text-amber-800 dark:text-amber-200",
    },
    bad: {
      border: "border-rose-200 dark:border-rose-900/60",
      header: "bg-rose-50 dark:bg-rose-950/30",
      icon: "bg-rose-600 text-white",
      title: "text-rose-800 dark:text-rose-200",
    },
    idle: {
      border: "border-border",
      header: "bg-muted",
      icon: "bg-slate-500 text-white",
      title: "text-foreground",
    },
  }[tone];

  const guest = result.guest;
  const isSuccess = result.state === "CHECKED_IN";
  const isAlready = result.state === "ALREADY_CHECKED_IN";

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card shadow-sm", styles.border)}>
      <div className={cn("flex items-center gap-3 px-4 py-3.5", styles.header)}>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[10px] font-black uppercase tracking-[0.16em]", isSuccess ? "text-white/80" : "text-muted-foreground")}>
            {STATE_LABELS[result.state]}
          </p>
          <p className={cn("truncate text-base font-black", styles.title)}>
            {guest?.fullName ?? "Unknown invitation"}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition",
            isSuccess
              ? "bg-white/15 text-white hover:bg-white/25"
              : "border border-border bg-card text-foreground hover:bg-muted"
          )}
        >
          <RotateCcw className="h-3 w-3" />
          Scan next
        </button>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">{result.message}</p>

        {guest && (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="Guest ID" value={guest.guestId || "—"} mono />
              <Field label="Reference" value={guest.registrationRef} mono />
              <Field label="Organization" value={guest.organization} icon={Building2} />
              <Field label="Position" value={guest.position} />
              <Field label="Category" value={guest.category} />
              <Field label="Party size" value={guest.companions} icon={UserCheck} />
            </div>

            {result.event && (
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                <p className="font-bold text-foreground">{result.event.name}</p>
                {result.event.dateLabel && (
                  <span className="flex items-start gap-1.5">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                    {result.event.dateLabel}
                  </span>
                )}
                <span className="flex items-start gap-1.5">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                  {result.event.timeLabel}
                </span>
                {result.event.venueLabel && (
                  <span className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0875D1]" />
                    {result.event.venueLabel}
                  </span>
                )}
              </div>
            )}

            {guest.checkedIn && guest.checkedInAt && (
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Checked in at{" "}
                {formatter(timeZone).format(new Date(guest.checkedInAt))}
                {guest.invitationNumber ? ` · Invitation ${guest.invitationNumber}` : ""}
              </p>
            )}
          </>
        )}

        {result.canCheckIn && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
            Confirm check-in
          </button>
        )}

        {isAlready && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            Do not admit this guest again. If this was a mistake, undo the check-in in the
            recent list.
          </p>
        )}

        {isSuccess && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            Entry recorded. You can scan the next guest.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 flex items-center gap-1 font-bold text-foreground",
          mono && "font-mono"
        )}
      >
        {Icon ? <Icon className="h-3 w-3 shrink-0 text-muted-foreground" /> : null}
        <span className="truncate">{value || "—"}</span>
      </p>
    </div>
  );
}
