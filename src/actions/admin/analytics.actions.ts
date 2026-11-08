"use server";

import {
  loadDashboardMetrics,
  type DashboardMetrics,
} from "@/db/queries/admin.analytics.queries";
import { requireAdmin } from "@/lib/auth-guard";
import { DEFAULT_LOCALE, type Locale } from "@/lib/locales";

/**
 * Single entry point for the admin dashboard — guarded and parallelized in the
 * query layer via `loadDashboardMetrics`.
 */
export async function getDashboardMetrics(
  locale: Locale = DEFAULT_LOCALE,
): Promise<DashboardMetrics> {
  await requireAdmin();
  return loadDashboardMetrics(locale);
}
