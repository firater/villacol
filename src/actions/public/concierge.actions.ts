"use server";

import { z } from "zod";

import {
  findCuratedEditorVillas,
  type ConciergeAnswers,
} from "@/db/queries/concierge.queries";
import { getExchangeRates } from "@/db/queries/rates.queries";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import type { VillaCardProps } from "@/components/villa/VillaCard";
import {
  buildExchangeRateMap,
  mapVillaCardRowToProps,
} from "@/lib/villa-listing-cards";
import { resolvePreferences } from "@/lib/preferences";
import { localeSchema } from "@/lib/validation";
import { getTranslations } from "next-intl/server";

const answersSchema = z.object({
  groupType: z.enum(["couple", "family", "friends"]),
  vibe: z.enum(["secluded_luxury", "close_to_town", "beachfront"]),
  budget: z.enum(["up_to_200", "nightly_200_500", "above_500"]),
  locale: localeSchema.optional(),
});

export type FindCuratedVillasResult = {
  villas: VillaCardProps[];
};

/**
 * Rules-based concierge until an LLM ranks the final three.
 * Only `is_editors_choice` villas are eligible.
 */
export async function findCuratedVillas(
  input: z.input<typeof answersSchema>,
): Promise<ActionResult<FindCuratedVillasResult>> {
  try {
    const parsed = answersSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const answers: ConciergeAnswers = {
      groupType: parsed.data.groupType,
      vibe: parsed.data.vibe,
      budget: parsed.data.budget,
    };

    const [preferences, ratesRows, tCard] = await Promise.all([
      resolvePreferences(),
      getExchangeRates(),
      getTranslations("layout.villaCard"),
    ]);
    const locale = parsed.data.locale ?? preferences.locale;

    const rows = await findCuratedEditorVillas(locale, answers);

    const rates = buildExchangeRateMap(ratesRows);
    const cardCopy = {
      wasPrice: (values: { price: string }) =>
        tCard("wasPrice", { price: values.price }),
      perStay: (values: { nights: number }) =>
        tCard("perStay", { nights: values.nights }),
      nextAvailable: (values: { range: string }) =>
        tCard("nextAvailable", { range: values.range }),
      firstAvailability: tCard("firstAvailability"),
      priceStartingAt: tCard("priceStartingAt"),
      perNight: tCard("perNight"),
      specialOffer: tCard("specialOffer"),
      editorsChoice: tCard("editorsChoice"),
    };

    const villas = rows.map((row) =>
      mapVillaCardRowToProps(
        row,
        locale,
        preferences.currency,
        rates,
        cardCopy,
      ),
    );

    return ok({ villas });
  } catch (error) {
    return toActionError(error);
  }
}
