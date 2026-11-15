/** Admin feature reads (uncached). */
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { features } from "@/db/schema";
import type { LocalizedText } from "@/lib/locales";

export type AdminFeatureListRow = {
  id: number;
  nameEn: string;
  icon: string | null;
  orderValue: number;
};

export async function listAdminFeatures(): Promise<AdminFeatureListRow[]> {
  const rows = await db
    .select({
      id: features.id,
      labelI18n: features.labelI18n,
      icon: features.icon,
      orderValue: features.orderValue,
    })
    .from(features)
    .orderBy(asc(features.orderValue), asc(features.id));

  return rows.map((row) => {
    const labels = row.labelI18n as LocalizedText;
    return {
      id: row.id,
      nameEn: labels.en ?? `#${row.id}`,
      icon: row.icon,
      orderValue: row.orderValue,
    };
  });
}

export type AdminFeatureEditRow = {
  id: number;
  key: string;
  labelI18n: LocalizedText;
  icon: string | null;
  orderValue: number;
};

export async function getAdminFeatureForEdit(
  featureId: number,
): Promise<AdminFeatureEditRow | null> {
  const [row] = await db
    .select({
      id: features.id,
      key: features.key,
      labelI18n: features.labelI18n,
      icon: features.icon,
      orderValue: features.orderValue,
    })
    .from(features)
    .where(eq(features.id, featureId))
    .limit(1);

  if (row === undefined) return null;

  return {
    id: row.id,
    key: row.key,
    labelI18n: row.labelI18n as LocalizedText,
    icon: row.icon,
    orderValue: row.orderValue,
  };
}