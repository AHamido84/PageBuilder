import { safeRichMap } from "./rich-text";

/**
 * Page-builder `__rich` maps can sit on ANY object inside a block's data (top level, list items,
 * nested objects). Block zod schemas strip unknown keys, so validation goes:
 *   liftRich(data) -> schema.parse(withoutRich) -> restoreRich(parsed, lifted)
 * Restored maps are re-validated (safeRichMap) and only kept for keys that are still strings on
 * their object -- a deleted item or field drops its styling with it.
 */

type Lifted = { path: (string | number)[]; map: unknown }[];

function walk(value: unknown, path: (string | number)[], lifted: Lifted): unknown {
  if (Array.isArray(value)) return value.map((v, i) => walk(v, [...path, i], lifted));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "__rich") lifted.push({ path, map: v });
    else out[k] = walk(v, [...path, k], lifted);
  }
  return out;
}

export function liftRich(data: unknown): { data: unknown; lifted: Lifted } {
  const lifted: Lifted = [];
  return { data: walk(data, [], lifted), lifted };
}

export function restoreRich<T>(parsed: T, lifted: Lifted): T {
  for (const { path, map } of lifted) {
    let target: unknown = parsed;
    for (const key of path) target = target && typeof target === "object" ? (target as Record<string | number, unknown>)[key] : undefined;
    if (!target || typeof target !== "object" || Array.isArray(target)) continue;
    const safe = safeRichMap(map);
    if (!safe) continue;
    const obj = target as Record<string, unknown>;
    const kept = Object.fromEntries(Object.entries(safe).filter(([k]) => typeof obj[k] === "string"));
    if (Object.keys(kept).length) obj.__rich = kept;
  }
  return parsed;
}

/** Validates block data while keeping its `__rich` maps. */
export function parseWithRich<T>(schema: { safeParse: (d: unknown) => { success: true; data: T } | { success: false; error: unknown } }, data: unknown) {
  const { data: plain, lifted } = liftRich(data);
  const result = schema.safeParse(plain);
  if (!result.success) return result;
  return { success: true as const, data: restoreRich(result.data, lifted) };
}

/** Removes every `__rich` map (public rendering while text styles are switched off). */
export function stripRich<T>(data: T): T {
  return liftRich(data).data as T;
}
