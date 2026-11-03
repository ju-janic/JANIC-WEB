import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/jwt";
import { SettingService } from "@/services/settings/setting.service";
import {
  PERMISSION_CAPABILITIES,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionCapability,
  hasLegacyCapabilities,
} from "./capabilities";

export { PERMISSION_CAPABILITIES, DEFAULT_ROLE_PERMISSIONS };
export type { PermissionCapability };

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canManageUsers(role: Role): boolean {
  return role === Role.ADMIN;
}

export function canPublishContent(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR;
}

export function canEditContent(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR;
}

export function canReviewSubmissions(role: Role): boolean {
  return role === Role.ADMIN || role === Role.EDITOR || role === Role.STAFF;
}

export async function getRolePermissions(): Promise<Record<Role, string[]>> {
  try {
    const raw = await SettingService.getByKey("role_permissions");
    if (raw?.value) {
      const parsed = JSON.parse(raw.value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const entries = Object.entries(parsed);
        const validShape = entries.every(([, caps]) => Array.isArray(caps));
        const legacy = entries.some(([, caps]) => hasLegacyCapabilities(caps));
        if (!validShape) return DEFAULT_ROLE_PERMISSIONS;
        // Ignore pre-CRUD permission names so new capabilities stay available.
        if (legacy) return DEFAULT_ROLE_PERMISSIONS;
        return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
      }
      return DEFAULT_ROLE_PERMISSIONS;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export async function hasPermission(role: Role, capability: PermissionCapability): Promise<boolean> {
  if (role === Role.ADMIN) return true;
  const permissions = await getRolePermissions();
  return (permissions[role] || []).includes(capability);
}

export async function requireAuth(allowedRoles?: Role[] | null, capability?: PermissionCapability) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  // ADMIN has all capabilities automatically
  if (user.role === Role.ADMIN) {
    return user;
  }

  // If a capability is required, check it directly
  if (capability) {
    const allowed = await hasPermission(user.role, capability);
    if (!allowed) {
      throw new Error("FORBIDDEN");
    }
    // Capability explicitly granted access
    return user;
  }

  // Fallback to role-based check if no capability specified
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(user.role, allowedRoles)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
