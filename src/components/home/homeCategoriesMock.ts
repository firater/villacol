/** Temporary mock categories — replace with API facets when wiring real data. */
export const HOME_CATEGORY_OF_THE_DAY_INDEX = 1;

export const HOME_EDITORS_CHOICE_LEAD = {
  image: "/smr2.webp",
  villaCount: 26,
  /** EUR cents per night — display converted in `HomeCategoriesSection`. */
  startingFromEurCents: 265_00,
  isGoodDeal: true,
} as const;

export const HOME_CATEGORIES_MOCK = [
  { slug: "sea-view", label: "Sea view", image: "/smr2.webp", villaCount: 48, startingFromEurCents: 415_00, isGoodDeal: false },
  { slug: "family", label: "Family", image: "/smr2.webp", villaCount: 62, startingFromEurCents: 238_00, isGoodDeal: true },
  { slug: "honeymoon", label: "Honeymoon", image: "/smr2.webp", villaCount: 31, startingFromEurCents: 520_00, isGoodDeal: false },
  { slug: "luxury", label: "Luxury", image: "/smr2.webp", villaCount: 19, startingFromEurCents: 890_00, isGoodDeal: false },
  { slug: "pet-friendly", label: "Pet friendly", image: "/smr2.webp", villaCount: 24, startingFromEurCents: 195_00, isGoodDeal: true },
  { slug: "pool", label: "Private pool", image: "/smr2.webp", villaCount: 57, startingFromEurCents: 372_00, isGoodDeal: false },
  { slug: "island", label: "Island", image: "/smr2.webp", villaCount: 14, startingFromEurCents: 645_00, isGoodDeal: false },
  { slug: "rustic", label: "Rustic", image: "/smr2.webp", villaCount: 22, startingFromEurCents: 212_00, isGoodDeal: true },
  { slug: "design", label: "Design", image: "/smr2.webp", villaCount: 17, startingFromEurCents: 485_00, isGoodDeal: false },
  { slug: "wellness", label: "Wellness", image: "/smr2.webp", villaCount: 11, startingFromEurCents: 558_00, isGoodDeal: false },
  { slug: "eco", label: "Eco", image: "/smr2.webp", villaCount: 9, startingFromEurCents: 178_00, isGoodDeal: true },
  { slug: "golf", label: "Near golf", image: "/smr2.webp", villaCount: 8, startingFromEurCents: 328_00, isGoodDeal: false },
] as const;
