/** Admin amenity reads (uncached). */
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { amenities } from "@/db/schema";
import type { LocalizedText } from "@/lib/locales";

export type AdminAmenityListRow = {
  id: number;
  nameEn: string;
  icon: string | null;
  orderValue: number;
};

export async function listAdminAmenities(): Promise<AdminAmenityListRow[]> {
  const rows = await db
    .select({
      id: amenities.id,
      labelI18n: amenities.labelI18n,
      icon: amenities.icon,
      orderValue: amenities.orderValue,
    })
    .from(amenities)
    .orderBy(asc(amenities.orderValue), asc(amenities.id));

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

export type AdminAmenityEditRow = {
  id: number;
  key: string;
  labelI18n: LocalizedText;
  icon: string | null;
  isFilterable: boolean;
  orderValue: number;
};

export async function getAdminAmenityForEdit(
  amenityId: number,
): Promise<AdminAmenityEditRow | null> {
  const [row] = await db
    .select({
      id: amenities.id,
      key: amenities.key,
      labelI18n: amenities.labelI18n,
      icon: amenities.icon,
      isFilterable: amenities.isFilterable,
      orderValue: amenities.orderValue,
    })
    .from(amenities)
    .where(eq(amenities.id, amenityId))
    .limit(1);

  if (row === undefined) return null;

  return {
    id: row.id,
    key: row.key,
    labelI18n: row.labelI18n as LocalizedText,
    icon: row.icon,
    isFilterable: row.isFilterable,
    orderValue: row.orderValue,
  };
}