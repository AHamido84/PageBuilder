export const RESOURCES = [
  "users",
  "roles",
  "pages",
  "products",
  "categories",
  "brands",
  "media",
  "menus",
  "blog",
  "forms",
  "leads",
  "settings",
  "activityLogs",
  "certifications",
  "industries",
  "faqs",
] as const;

export const ACTIONS = ["create", "read", "update", "delete", "publish"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

/** Every (resource, action) pair that gets seeded as a Permission row. */
export const ALL_PERMISSIONS: { resource: Resource; action: Action }[] = RESOURCES.flatMap(
  (resource) => ACTIONS.map((action) => ({ resource, action }))
);

export const ROLE_SLUGS = {
  SUPER_ADMIN: "super-admin",
  CONTENT_MANAGER: "content-manager",
  MARKETING_MANAGER: "marketing-manager",
  SALES: "sales",
  VIEWER: "viewer",
} as const;

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];

const contentResources: Resource[] = ["pages", "products", "categories", "brands", "media", "menus", "blog"];
const readAllResources: Resource[] = [...RESOURCES];

/**
 * Default permission grants per role, used by the seed script.
 * Super Admin is granted every permission programmatically (not listed here)
 * so it always stays in sync with ALL_PERMISSIONS.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Exclude<RoleSlug, "super-admin">, { resource: Resource; action: Action }[]> = {
  [ROLE_SLUGS.CONTENT_MANAGER]: [
    ...contentResources.flatMap((resource) => [
      { resource, action: "create" as Action },
      { resource, action: "read" as Action },
      { resource, action: "update" as Action },
      { resource, action: "publish" as Action },
    ]),
    { resource: "certifications", action: "create" },
    { resource: "certifications", action: "read" },
    { resource: "certifications", action: "update" },
    { resource: "certifications", action: "publish" },
    { resource: "faqs", action: "create" },
    { resource: "faqs", action: "read" },
    { resource: "faqs", action: "update" },
    { resource: "faqs", action: "publish" },
    { resource: "industries", action: "read" },
  ],
  [ROLE_SLUGS.MARKETING_MANAGER]: [
    { resource: "leads", action: "read" },
    { resource: "leads", action: "update" },
    { resource: "forms", action: "read" },
    { resource: "forms", action: "update" },
    { resource: "blog", action: "create" },
    { resource: "blog", action: "read" },
    { resource: "blog", action: "update" },
    { resource: "blog", action: "publish" },
    { resource: "media", action: "create" },
    { resource: "media", action: "read" },
    { resource: "industries", action: "read" },
    { resource: "industries", action: "update" },
  ],
  [ROLE_SLUGS.SALES]: [
    { resource: "leads", action: "read" },
    { resource: "leads", action: "update" },
    { resource: "products", action: "read" },
    { resource: "categories", action: "read" },
    { resource: "brands", action: "read" },
  ],
  [ROLE_SLUGS.VIEWER]: readAllResources
    .filter((resource) => resource !== "users" && resource !== "roles" && resource !== "settings" && resource !== "activityLogs")
    .map((resource) => ({ resource, action: "read" as Action })),
};
