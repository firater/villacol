import { env } from "@/env";

/** Canonical HTTPS origin for sitemaps, JSON-LD `@id`, and absolute image URLs. */
export function getSiteOrigin(): string {
  return env.BETTER_AUTH_URL.replace(/\/$/, "");
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteOrigin()}${path}`;
}
