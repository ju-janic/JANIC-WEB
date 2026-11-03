import { Role } from "@prisma/client";

export const MODULES = [
  "projects",
  "project_members",
  "training",
  "research",
  "events",
  "submissions",
  "partnerships",
  "messages",
  "team",
  "media",
  "community_services",
  "settings",
  "users"
] as const;

export type PermissionModule = (typeof MODULES)[number];

export const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const;
export type CrudAction = (typeof CRUD_ACTIONS)[number];

/**
 * Module-specific actions that are real permissions but do not fit the CRUD
 * grid. Keeping them here (instead of inventing a new database Role) lets the
 * existing permission matrix grant or revoke them per role.
 */
export const MODULE_ACTIONS = {
  events: ["checkin"],
} as const satisfies Partial<Record<PermissionModule, readonly string[]>>;

export type PermissionAction =
  | CrudAction
  | (typeof MODULE_ACTIONS)[keyof typeof MODULE_ACTIONS][number];

export type PermissionCapability = `${PermissionModule}:${PermissionAction}`;

export const PERMISSION_CAPABILITIES: PermissionCapability[] = MODULES.flatMap((mod) => {
  const extra =
    MODULE_ACTIONS[mod as keyof typeof MODULE_ACTIONS] ?? ([] as readonly string[]);
  return [...CRUD_ACTIONS, ...extra].map(
    (action) => `${mod}:${action}` as PermissionCapability
  );
});

export const DEFAULT_ROLE_PERMISSIONS: Record<Role | "USER" | string, PermissionCapability[]> = {
  ADMIN: [...PERMISSION_CAPABILITIES],
  EDITOR: [
    "projects:create", "projects:read", "projects:update", "projects:delete",
    "training:create", "training:read", "training:update", "training:delete",
    "research:create", "research:read", "research:update", "research:delete",
    "events:create", "events:read", "events:update", "events:delete", "events:checkin",
    "media:create", "media:read", "media:update", "media:delete",
    "submissions:read", "submissions:update",
    "partnerships:create", "partnerships:read", "partnerships:update", "partnerships:delete",
    "community_services:read", "community_services:create", "community_services:update", "community_services:delete"
  ],
  STAFF: [
    "projects:read", "training:read", "research:read", "events:read", "events:checkin",
    "media:read", "submissions:read",
    "partnerships:read", "partnerships:update",
    "community_services:read"
  ],
  USER: [],
};

const CAPABILITY_SET = new Set<string>(PERMISSION_CAPABILITIES);

export function isPermissionCapability(value: unknown): value is PermissionCapability {
  return typeof value === "string" && CAPABILITY_SET.has(value);
}

/**
 * Older installations stored free-form strings such as "manage_users" before
 * the CRUD capability model existed. Those values must not shadow the defaults,
 * otherwise every new capability (including events:checkin) would be invisible.
 */
export function hasLegacyCapabilities(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.some((entry) => typeof entry === "string" && !CAPABILITY_SET.has(entry))
  );
}
