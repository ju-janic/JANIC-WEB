"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle, Loader2, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import {
  MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CAPABILITIES,
  hasLegacyCapabilities,
  isPermissionCapability,
} from "@/lib/permissions/capabilities";

interface SettingItem {
  id: string;
  key: string;
  value: string;
  group: string;
}

export function PermissionsMatrix({ settings }: { settings: SettingItem[] }) {
  const router = useRouter();
  const raw = settings.find((s) => s.key === "role_permissions")?.value;

  const [matrix, setMatrix] = useState<Record<string, string[]>>(() => {
    try {
      if (raw) {
        const parsed = JSON.parse(raw);
        const clean = (caps: unknown) =>
          Array.isArray(caps) &&
          !hasLegacyCapabilities(caps) &&
          caps.every(isPermissionCapability);
        const result: Record<string, string[]> = {};
        if (clean(parsed.ADMIN)) result.ADMIN = parsed.ADMIN;
        if (clean(parsed.STAFF)) result.STAFF = parsed.STAFF;
        if (Object.keys(result).length > 0) {
          return {
            ADMIN: result.ADMIN ?? DEFAULT_ROLE_PERMISSIONS.ADMIN,
            STAFF: result.STAFF ?? DEFAULT_ROLE_PERMISSIONS.STAFF,
          };
        }
      }
    } catch {
    }
    return { ADMIN: DEFAULT_ROLE_PERMISSIONS.ADMIN, STAFF: DEFAULT_ROLE_PERMISSIONS.STAFF };
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const toggleExpanded = (mod: string) => setExpanded(prev => ({ ...prev, [mod]: !prev[mod] }));

  const toggle = (role: string, cap: string) => {
    setMatrix((prev) => {
      const has = prev[role].includes(cap);
      return {
        ...prev,
        [role]: has ? prev[role].filter((c) => c !== cap) : [...prev[role], cap],
      };
    });
    setSaved(false);
  };

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [{ key: "role_permissions", value: JSON.stringify(matrix), group: "permissions" }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving permissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-border/80 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-foreground">Role Permissions Matrix</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Controls which roles can perform each capability. Enforced on admin and staff APIs,
        including QR guest check-in.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 font-semibold text-foreground">Capability</th>
              {Object.keys(matrix).filter(r => r !== "ADMIN").map((role) => (
                <th key={role} className="text-center py-2 px-2 font-semibold text-foreground">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <React.Fragment key={mod}>
                <tr className="border-t border-border hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpanded(mod)}>
                  <td className="py-2.5 pr-4 font-semibold text-foreground flex items-center gap-1.5">
                    {expanded[mod] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="capitalize">{mod.replace('_', ' ')}</span>
                  </td>
                  {Object.keys(matrix).filter(r => r !== "ADMIN").map((role) => (
                    <td key={role} className="text-center py-2 px-2 text-muted-foreground text-[10px]">
                      {/* Optional: Summary of checked */}
                    </td>
                  ))}
                </tr>
                {expanded[mod] &&
                  PERMISSION_CAPABILITIES.filter((capability) =>
                    capability.startsWith(`${mod}:`)
                  ).map((cap) => {
                    const action = cap.slice(cap.indexOf(":") + 1);
                    return (
                      <tr key={cap} className="border-t border-border/40 bg-slate-50/30">
                        <td className="py-1.5 pr-4 pl-8 font-mono text-[11px] text-muted-foreground capitalize">
                          {action === "checkin" ? "check in" : action}
                        </td>
                        {Object.keys(matrix).filter(r => r !== "ADMIN").map((role) => (
                          <td key={role} className="text-center py-1.5 px-2">
                            <input
                              type="checkbox"
                              checked={matrix[role].includes(cap)}
                              onChange={() => toggle(role, cap)}
                              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle className="w-4 h-4" /> Saved!
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Permissions
        </button>
      </div>
    </div>
  );
}
