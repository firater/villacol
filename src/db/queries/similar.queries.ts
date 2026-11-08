/**
 * Precomputed similar villas (`similar_villas` table).
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { similarVillas, villas } from "@/db/schema";

export type SimilarVillaRow = {
  id: number;
  score: number;
  isManual: boolean;
};

export async function getSimilarVillas(villaId: number): Promise<SimilarVillaRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("villas", `villa-${villaId}`, "similar-villas");

  return db
    .select({
      id: similarVillas.similarVillaId,
      score: similarVillas.score,
      isManual: similarVillas.isManual,
    })
    .from(similarVillas)
    .innerJoin(villas, eq(villas.id, similarVillas.similarVillaId))
    .where(and(eq(similarVillas.villaId, villaId), eq(villas.isActive, true)))
    .orderBy(desc(similarVillas.score), asc(similarVillas.similarVillaId));
}
