/**
 * Development seed: enough real data that every branch of the pricing engine,
 * the availability scan, the search index, and the cache rebuild can be
 * exercised by hand.
 *
 * Idempotent. Every insert upserts on a natural key — `amenities.key`,
 * `villas.ref_code`, an English translation slug, a promotion name — so running
 * it twice leaves the same rows rather than a second copy of the catalogue.
 * That matters because this is also the fixture the price-cache drift check
 * builds on.
 *
 * Exported rather than self-running: `scripts/seed.ts` is the `npm run db:seed`
 * entry point, and the integration test calls `seed()` directly so it owns its
 * own fixture.
 */
import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { dbPool } from "@/db/pool";
import {
  amenities,
  categories,
  categoryTranslations,
  deals,
  exchangeRates,
  features,
  locations,
  locationTranslations,
  promotions,
  searchSynonyms,
  user,
  villaAmenities,
  villaCalendar,
  villaCategories,
  villaFeatures,
  villaImages,
  villaPromotions,
  villaRuleLinks,
  villaRules,
  villas,
  villaTranslations,
} from "@/db/schema";
import type { DiscountType, PromotionTrigger } from "@/db/tables/enums";
import { addDays, getBusinessToday, type DateString } from "@/lib/dates";
import type { Locale, LocalizedText } from "@/lib/locales";

export const SEED_ADMIN_EMAIL = "admin@example.com";
export const SEED_ADMIN_PASSWORD = "Admin123!";
export const SEED_ADMIN_NAME = "Admin";

/** Nights of calendar written per villa, per the plan. */
export const SEED_CALENDAR_DAYS = 180;

/* -------------------------------------------------------------------------- */
/* Admin user                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates the admin through Better Auth's own sign-up endpoint rather than
 * inserting a row directly, so the password hash and the linked `account` row
 * are produced by exactly the code path the HTTP API uses. A hand-written hash
 * here would let the seed drift from however Better Auth hashes next version.
 */
export async function ensureAdminUser(): Promise<{ id: string; email: string }> {
  const { isAPIError } = await import("better-auth/api");
  const { auth } = await import("@/lib/auth");
  const { env } = await import("@/env");

  const baseURL = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const signUpUrl = `${baseURL}/api/auth/sign-up/email`;

  // `request` and `origin` are supplied for the CSRF check; `asResponse: false`
  // is explicit because passing `request` otherwise makes Better Auth return a
  // `Response` instead of the parsed body.
  const request = new Request(signUpUrl, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseURL },
    body: JSON.stringify({
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
    }),
  });

  try {
    await auth.api.signUpEmail({
      asResponse: false,
      body: {
        name: SEED_ADMIN_NAME,
        email: SEED_ADMIN_EMAIL,
        password: SEED_ADMIN_PASSWORD,
      },
      request,
      headers: request.headers,
    });
  } catch (error) {
    if (!isAPIError(error)) throw error;

    const code =
      typeof error.body === "object" &&
      error.body !== null &&
      "code" in error.body
        ? String((error.body as { code?: string }).code)
        : "";

    const status = typeof error.status === "string" ? error.status : "";
    const isDuplicate =
      status === "UNPROCESSABLE_ENTITY" ||
      error.statusCode === 422 ||
      code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";

    // Re-running the seed must not fail just because the admin already exists.
    if (!isDuplicate) throw error;
  }

  const normalizedEmail = SEED_ADMIN_EMAIL.toLowerCase();

  const [row] = await dbPool
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (row === undefined) {
    throw new Error(
      `No user row for ${normalizedEmail} after sign-up — check DATABASE_URL and the Better Auth tables.`,
    );
  }

  await dbPool.update(user).set({ role: "admin" }).where(eq(user.id, row.id));

  return { id: row.id, email: normalizedEmail };
}

/* -------------------------------------------------------------------------- */
/* Taxonomy data                                                              */
/* -------------------------------------------------------------------------- */

type TranslationSet = Record<Locale, { slug: string; name: string; description?: string }>;

type SeedLocation = {
  type: string;
  isFeatured: boolean;
  orderValue: number;
  latitude: number;
  longitude: number;
  translations: TranslationSet;
  children?: SeedLocation[];
};

/** Kas > Kalkan > Islamlar, the hierarchy the plan calls for. */
const LOCATION_TREE: SeedLocation[] = [
  {
    type: "region",
    isFeatured: true,
    orderValue: 10,
    latitude: 36.2021,
    longitude: 29.6417,
    translations: {
      en: { slug: "kas", name: "Kas", description: "A quiet stretch of the Turkish Mediterranean coast." },
      de: { slug: "kas", name: "Kaş", description: "Ein ruhiger Abschnitt der türkischen Mittelmeerküste." },
      ru: { slug: "kash", name: "Каш", description: "Тихий участок турецкого побережья Средиземного моря." },
    },
    children: [
      {
        type: "district",
        isFeatured: true,
        orderValue: 10,
        latitude: 36.2655,
        longitude: 29.4139,
        translations: {
          en: { slug: "kalkan", name: "Kalkan", description: "A hillside town above a deep blue bay." },
          de: { slug: "kalkan", name: "Kalkan", description: "Eine Stadt am Hang über einer tiefblauen Bucht." },
          ru: { slug: "kalkan", name: "Калкан", description: "Городок на склоне над глубокой синей бухтой." },
        },
        children: [
          {
            type: "village",
            isFeatured: false,
            orderValue: 10,
            latitude: 36.3186,
            longitude: 29.3711,
            translations: {
              en: { slug: "islamlar", name: "Islamlar", description: "A mountain village of trout restaurants and pine air." },
              de: { slug: "islamlar", name: "Islamlar", description: "Ein Bergdorf mit Forellenrestaurants und Kiefernluft." },
              ru: { slug: "islamlar", name: "Исламлар", description: "Горная деревня с ресторанами и сосновым воздухом." },
            },
          },
        ],
      },
    ],
  },
];

const CATEGORY_DATA: TranslationSet[] = [
  {
    en: { slug: "honeymoon-villas", name: "Honeymoon villas" },
    de: { slug: "honeymoon-villen", name: "Honeymoon-Villen" },
    ru: { slug: "villy-dlya-medovogo-mesyaca", name: "Виллы для медового месяца" },
  },
  {
    en: { slug: "family-villas", name: "Family villas" },
    de: { slug: "familienvillen", name: "Familienvillen" },
    ru: { slug: "semeynye-villy", name: "Семейные виллы" },
  },
  {
    en: { slug: "sea-view-villas", name: "Sea view villas" },
    de: { slug: "villen-mit-meerblick", name: "Villen mit Meerblick" },
    ru: { slug: "villy-s-vidom-na-more", name: "Виллы с видом на море" },
  },
];

type KeyedLabel = {
  key: string;
  labelI18n: LocalizedText;
  icon: string;
  group: string;
  orderValue: number;
};

/** Keys are universal English: they are also the `?amenities=` query values. */
const AMENITY_DATA: KeyedLabel[] = [
  { key: "private_pool", labelI18n: { en: "Private pool", de: "Privater Pool", ru: "Частный бассейн" }, icon: "pool", group: "outdoor", orderValue: 10 },
  { key: "jacuzzi", labelI18n: { en: "Jacuzzi", de: "Whirlpool", ru: "Джакузи" }, icon: "hot-tub", group: "outdoor", orderValue: 20 },
  { key: "wifi", labelI18n: { en: "Wi-Fi", de: "WLAN", ru: "Wi-Fi" }, icon: "wifi", group: "indoor", orderValue: 30 },
  { key: "air_conditioning", labelI18n: { en: "Air conditioning", de: "Klimaanlage", ru: "Кондиционер" }, icon: "ac", group: "indoor", orderValue: 40 },
  { key: "bbq", labelI18n: { en: "Barbecue", de: "Grill", ru: "Барбекю" }, icon: "bbq", group: "outdoor", orderValue: 50 },
  { key: "parking", labelI18n: { en: "Private parking", de: "Privatparkplatz", ru: "Частная парковка" }, icon: "parking", group: "practical", orderValue: 60 },
  { key: "washing_machine", labelI18n: { en: "Washing machine", de: "Waschmaschine", ru: "Стиральная машина" }, icon: "washer", group: "practical", orderValue: 70 },
];

const FEATURE_DATA: KeyedLabel[] = [
  { key: "sea_view", labelI18n: { en: "Sea view", de: "Meerblick", ru: "Вид на море" }, icon: "waves", group: "outlook", orderValue: 10 },
  { key: "secluded", labelI18n: { en: "Secluded", de: "Abgeschieden", ru: "Уединённая" }, icon: "lock", group: "privacy", orderValue: 20 },
  { key: "walk_to_beach", labelI18n: { en: "Walk to the beach", de: "Zu Fuß zum Strand", ru: "Пешком до пляжа" }, icon: "footprints", group: "location", orderValue: 30 },
  { key: "pet_friendly", labelI18n: { en: "Pet friendly", de: "Haustierfreundlich", ru: "Можно с питомцами" }, icon: "paw", group: "policy", orderValue: 40 },
];

const RULE_DATA: {
  key: string;
  labelI18n: LocalizedText;
  descriptionI18n: LocalizedText;
  icon: string;
  orderValue: number;
}[] = [
  {
    key: "no_smoking",
    labelI18n: { en: "No smoking indoors", de: "Rauchen im Haus verboten", ru: "Не курить внутри" },
    descriptionI18n: { en: "Smoking is permitted on terraces only.", de: "Rauchen ist nur auf den Terrassen erlaubt.", ru: "Курение разрешено только на террасах." },
    icon: "no-smoking",
    orderValue: 10,
  },
  {
    key: "no_parties",
    labelI18n: { en: "No parties or events", de: "Keine Partys oder Veranstaltungen", ru: "Без вечеринок и мероприятий" },
    descriptionI18n: { en: "The villa is in a residential area with quiet hours after 23:00.", de: "Die Villa liegt in einem Wohngebiet mit Ruhezeit ab 23:00.", ru: "Вилла находится в жилом районе, тишина после 23:00." },
    icon: "volume-off",
    orderValue: 20,
  },
  {
    key: "quiet_hours",
    labelI18n: { en: "Quiet hours 23:00–08:00", de: "Ruhezeit 23:00–08:00", ru: "Тишина с 23:00 до 08:00" },
    descriptionI18n: { en: "Please keep noise down outside during these hours.", de: "Bitte vermeiden Sie in dieser Zeit Lärm im Außenbereich.", ru: "Пожалуйста, соблюдайте тишину на улице в это время." },
    icon: "moon",
    orderValue: 30,
  },
  {
    key: "check_in_window",
    labelI18n: { en: "Check-in 16:00, check-out 10:00", de: "Anreise 16:00, Abreise 10:00", ru: "Заезд 16:00, выезд 10:00" },
    descriptionI18n: { en: "Earlier check-in can sometimes be arranged on request.", de: "Eine frühere Anreise ist auf Anfrage manchmal möglich.", ru: "Ранний заезд иногда возможен по запросу." },
    icon: "clock",
    orderValue: 40,
  },
];

/* -------------------------------------------------------------------------- */
/* Villas                                                                     */
/* -------------------------------------------------------------------------- */

type SeedVillaTranslation = {
  slug: string;
  title: string;
  summary: string;
  description: string;
};

type SeedVilla = {
  refCode: string;
  slug: string;
  /** English slug of the location this villa sits in. */
  locationSlug: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  defaultMinStay: number;
  /** Used for any night past the seeded 180-day calendar. */
  defaultNightlyPriceCents: number;
  /** Low-season weekday rate; the calendar scales it by month and weekday. */
  baseNightlyCents: number;
  cleaningFeeCents: number;
  depositCents: number;
  isFeatured: boolean;
  isEditorsChoice: boolean;
  isBestValue: boolean;
  orderValue: number;
  latitude: number;
  longitude: number;
  categorySlugs: string[];
  amenityKeys: string[];
  featureKeys: string[];
  ruleKeys: string[];
  /**
   * Day offsets from today to block, as an admin hold. Villa Sunset has an
   * early block on purpose: it forces the availability scan to abandon the run
   * starting today and resume after the blocker, which is the branch a seed
   * with a wide-open calendar would never reach.
   */
  blockedDayOffsets: number[];
  /** `{ offset, minStay }` overrides, to exercise the check-in night's own min stay. */
  minStayOverrides: { offset: number; minStay: number }[];
  translations: Record<Locale, SeedVillaTranslation>;
};

const VILLA_DATA: SeedVilla[] = [
  {
    refCode: "VS-001",
    slug: "villa-sunset",
    locationSlug: "kalkan",
    capacity: 8,
    bedrooms: 4,
    bathrooms: 3,
    // Lower than the pay-6-stay-7 threshold on purpose, so the cache writes
    // both a `min_stay` and a `promo_free_days` window instead of one row.
    defaultMinStay: 5,
    defaultNightlyPriceCents: 32_000,
    baseNightlyCents: 30_000,
    cleaningFeeCents: 12_000,
    depositCents: 50_000,
    isFeatured: true,
    isEditorsChoice: true,
    isBestValue: false,
    orderValue: 10,
    latitude: 36.2661,
    longitude: 29.4082,
    categorySlugs: ["sea-view-villas", "honeymoon-villas"],
    amenityKeys: ["private_pool", "jacuzzi", "wifi", "air_conditioning", "bbq", "parking"],
    featureKeys: ["sea_view", "secluded"],
    ruleKeys: ["no_smoking", "no_parties", "quiet_hours", "check_in_window"],
    blockedDayOffsets: [2, 3, 4, 5, 6, 7, 8],
    minStayOverrides: [],
    translations: {
      en: {
        slug: "villa-sunset-kalkan",
        title: "Villa Sunset",
        summary: "A four-bedroom villa above Kalkan bay with an infinity pool facing west.",
        description:
          "Villa Sunset sits on the hillside above Kalkan, angled so that the pool terrace catches the whole of the evening light. Four bedrooms, three bathrooms, and a shaded dining terrace for eight. The bay is a seven-minute drive down the hill, and the old town is walkable if you do not mind the climb back up.",
      },
      de: {
        slug: "villa-sunset-kalkan",
        title: "Villa Sunset",
        summary: "Villa mit vier Schlafzimmern über der Bucht von Kalkan und nach Westen gerichtetem Infinity-Pool.",
        description:
          "Die Villa Sunset liegt am Hang über Kalkan, so ausgerichtet, dass die Poolterrasse das gesamte Abendlicht einfängt. Vier Schlafzimmer, drei Badezimmer und eine schattige Essterrasse für acht Personen. Zur Bucht sind es sieben Autominuten, in die Altstadt kann man laufen, wenn der Rückweg bergauf nicht stört.",
      },
      ru: {
        slug: "villa-sunset-kalkan",
        title: "Вилла Sunset",
        summary: "Вилла с четырьмя спальнями над бухтой Калкана и бассейном, обращённым на запад.",
        description:
          "Вилла Sunset расположена на склоне над Калканом так, что терраса с бассейном освещена весь вечер. Четыре спальни, три ванные комнаты и затенённая терраса для восьми человек. До бухты семь минут на машине, до старого города можно дойти пешком, если не смущает подъём обратно.",
      },
    },
  },
  {
    refCode: "VS-002",
    slug: "villa-olive-grove",
    locationSlug: "islamlar",
    capacity: 6,
    bedrooms: 3,
    bathrooms: 2,
    defaultMinStay: 3,
    defaultNightlyPriceCents: 21_000,
    baseNightlyCents: 19_000,
    cleaningFeeCents: 9_000,
    depositCents: 35_000,
    isFeatured: true,
    isEditorsChoice: true,
    isBestValue: true,
    orderValue: 20,
    latitude: 36.3190,
    longitude: 29.3702,
    categorySlugs: ["family-villas"],
    amenityKeys: ["private_pool", "wifi", "air_conditioning", "bbq", "parking", "washing_machine"],
    featureKeys: ["secluded", "pet_friendly"],
    ruleKeys: ["no_smoking", "quiet_hours", "check_in_window"],
    blockedDayOffsets: [60, 61, 62],
    // A longer minimum over the peak-season weekend, which is what makes the
    // "check-in night's own min_stay wins" rule visible in the cached window.
    minStayOverrides: [{ offset: 90, minStay: 7 }],
    translations: {
      en: {
        slug: "villa-olive-grove-islamlar",
        title: "Villa Olive Grove",
        summary: "A three-bedroom stone villa in the mountain village of Islamlar, surrounded by olive trees.",
        description:
          "Built from local stone and set among working olive terraces, Villa Olive Grove is ten degrees cooler than the coast in August. Three bedrooms, two bathrooms, a long covered terrace, and a pool that gets sun from mid-morning. The trout restaurants of Islamlar are a short walk away; Kalkan and the sea are twenty minutes down the mountain road.",
      },
      de: {
        slug: "villa-olive-grove-islamlar",
        title: "Villa Olive Grove",
        summary: "Steinvilla mit drei Schlafzimmern im Bergdorf Islamlar, umgeben von Olivenbäumen.",
        description:
          "Aus heimischem Stein erbaut und zwischen bewirtschafteten Oliventerrassen gelegen, ist die Villa Olive Grove im August zehn Grad kühler als die Küste. Drei Schlafzimmer, zwei Badezimmer, eine lange überdachte Terrasse und ein Pool, der ab dem späten Morgen Sonne bekommt. Die Forellenrestaurants von Islamlar sind zu Fuß erreichbar, Kalkan und das Meer liegen zwanzig Minuten die Bergstraße hinunter.",
      },
      ru: {
        slug: "villa-olive-grove-islamlar",
        title: "Вилла Olive Grove",
        summary: "Каменная вилла с тремя спальнями в горной деревне Исламлар, в окружении оливковых деревьев.",
        description:
          "Построенная из местного камня среди действующих оливковых террас, вилла Olive Grove в августе на десять градусов прохладнее побережья. Три спальни, две ванные комнаты, длинная крытая терраса и бассейн, освещённый солнцем с позднего утра. До рыбных ресторанов Исламлара можно дойти пешком, а до Калкана и моря — двадцать минут по горной дороге.",
      },
    },
  },
  {
    refCode: "VS-003",
    slug: "villa-lykia",
    locationSlug: "kas",
    capacity: 4,
    bedrooms: 2,
    bathrooms: 2,
    defaultMinStay: 4,
    defaultNightlyPriceCents: 17_500,
    baseNightlyCents: 16_000,
    cleaningFeeCents: 7_500,
    depositCents: 25_000,
    isFeatured: true,
    isEditorsChoice: true,
    isBestValue: true,
    orderValue: 30,
    latitude: 36.2015,
    longitude: 29.6392,
    categorySlugs: ["honeymoon-villas", "sea-view-villas"],
    amenityKeys: ["private_pool", "wifi", "air_conditioning"],
    featureKeys: ["sea_view", "walk_to_beach"],
    ruleKeys: ["no_smoking", "no_parties", "check_in_window"],
    blockedDayOffsets: [],
    minStayOverrides: [],
    translations: {
      en: {
        slug: "villa-lykia-kas",
        title: "Villa Lykia",
        summary: "A two-bedroom villa for couples, a short walk from the water in Kas.",
        description:
          "Villa Lykia is the smallest house in the collection and the closest to the sea. Two bedrooms, two bathrooms, and a plunge pool on a terrace that looks across to the Greek island of Meis. The harbour, the Monday market, and the Lycian rock tombs are all within walking distance.",
      },
      de: {
        slug: "villa-lykia-kas",
        title: "Villa Lykia",
        summary: "Villa mit zwei Schlafzimmern für Paare, wenige Schritte vom Wasser in Kaş.",
        description:
          "Die Villa Lykia ist das kleinste Haus der Kollektion und das am nächsten zum Meer. Zwei Schlafzimmer, zwei Badezimmer und ein Tauchbecken auf einer Terrasse mit Blick auf die griechische Insel Meis. Der Hafen, der Montagsmarkt und die lykischen Felsengräber sind zu Fuß erreichbar.",
      },
      ru: {
        slug: "villa-lykia-kas",
        title: "Вилла Lykia",
        summary: "Вилла с двумя спальнями для пар, в нескольких минутах ходьбы от воды в Каше.",
        description:
          "Вилла Lykia — самый маленький дом в коллекции и самый близкий к морю. Две спальни, две ванные комнаты и небольшой бассейн на террасе с видом на греческий остров Мейс. Порт, понедельничный рынок и ликийские скальные усыпальницы — всё в пешей доступности.",
      },
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Promotions                                                                 */
/* -------------------------------------------------------------------------- */

type SeedPromotion = {
  name: string;
  displayNameI18n: LocalizedText;
  discountType: DiscountType;
  triggerType: PromotionTrigger;
  percentBp?: number;
  fixedAmountCents?: number;
  freeNights?: number;
  freeNightsThreshold?: number;
  minNights?: number;
  maxNights?: number;
  lastMinuteWithinDays?: number;
  earlyBirdMinDays?: number;
  code?: string;
  priorityOrder: number;
  isStackable: boolean;
  isActive: boolean;
};

/**
 * One promotion for every `discount_type` x `trigger_type` pair: 3 x 6 = 18.
 *
 * Only the eight attached below are `is_active`. If all eighteen were live and
 * attached to every villa, the stackable ones would compound a stay down to
 * almost nothing and the seed would show prices nobody would ever charge. The
 * inactive rows exist so an admin can flip `is_active`, attach, and exercise
 * any combination by hand — which is what the plan asks for — without the
 * default dataset being nonsense.
 */
const PROMOTION_MATRIX: SeedPromotion[] = [
  // ---- percentage ----
  {
    name: "Percentage · always · direct booking 5%",
    displayNameI18n: { en: "Direct booking saving", de: "Direktbuchungsrabatt", ru: "Скидка за прямое бронирование" },
    discountType: "percentage",
    triggerType: "always",
    percentBp: 500,
    priorityOrder: 30,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Percentage · long stay · 10% from 7 nights",
    displayNameI18n: { en: "Long-stay saving", de: "Langzeitrabatt", ru: "Скидка за длительное проживание" },
    discountType: "percentage",
    triggerType: "long_stay",
    percentBp: 1_000,
    minNights: 7,
    priorityOrder: 10,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Percentage · last minute · 15% within 21 days",
    displayNameI18n: { en: "Last-minute saving", de: "Last-Minute-Rabatt", ru: "Скидка в последнюю минуту" },
    discountType: "percentage",
    triggerType: "last_minute",
    percentBp: 1_500,
    lastMinuteWithinDays: 21,
    priorityOrder: 10,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Percentage · early bird · 12% from 90 days",
    displayNameI18n: { en: "Early-booking saving", de: "Frühbucherrabatt", ru: "Скидка за раннее бронирование" },
    discountType: "percentage",
    triggerType: "early_bird",
    percentBp: 1_200,
    earlyBirdMinDays: 90,
    priorityOrder: 10,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Percentage · coupon · WELCOME8",
    displayNameI18n: { en: "Welcome code", de: "Willkommenscode", ru: "Приветственный код" },
    discountType: "percentage",
    triggerType: "coupon",
    percentBp: 800,
    code: "WELCOME8",
    priorityOrder: 20,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Percentage · exit intent · STAY7",
    displayNameI18n: { en: "Exclusive web offer", de: "Exklusives Online-Angebot", ru: "Эксклюзивное онлайн-предложение" },
    discountType: "percentage",
    triggerType: "exit_intent",
    percentBp: 700,
    code: "STAY7",
    priorityOrder: 25,
    isStackable: true,
    isActive: true,
  },

  // ---- fixed_amount ----
  {
    name: "Fixed · always · EUR 50 off",
    displayNameI18n: { en: "€50 off your stay", de: "50 € Rabatt", ru: "Скидка 50 €" },
    discountType: "fixed_amount",
    triggerType: "always",
    fixedAmountCents: 5_000,
    priorityOrder: 40,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Fixed · long stay · EUR 150 off from 10 nights",
    displayNameI18n: { en: "€150 off long stays", de: "150 € Rabatt bei Langzeitaufenthalt", ru: "Скидка 150 € за длительное проживание" },
    discountType: "fixed_amount",
    triggerType: "long_stay",
    fixedAmountCents: 15_000,
    minNights: 10,
    // Exclusive: when it applies, nothing else does. Attached to Villa Olive
    // Grove so a 10-night quote there demonstrates exclusivity against the two
    // stackable percentages that otherwise apply.
    priorityOrder: 1,
    isStackable: false,
    isActive: true,
  },
  {
    name: "Fixed · last minute · EUR 100 off within 14 days",
    displayNameI18n: { en: "€100 off late bookings", de: "100 € Rabatt bei Last-Minute", ru: "Скидка 100 € при позднем бронировании" },
    discountType: "fixed_amount",
    triggerType: "last_minute",
    fixedAmountCents: 10_000,
    lastMinuteWithinDays: 14,
    priorityOrder: 15,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Fixed · early bird · EUR 200 off from 120 days",
    displayNameI18n: { en: "€200 off early bookings", de: "200 € Frühbucherrabatt", ru: "Скидка 200 € за раннее бронирование" },
    discountType: "fixed_amount",
    triggerType: "early_bird",
    fixedAmountCents: 20_000,
    earlyBirdMinDays: 120,
    priorityOrder: 15,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Fixed · coupon · SAVE75",
    displayNameI18n: { en: "€75 promo code", de: "75 € Aktionscode", ru: "Промокод на 75 €" },
    discountType: "fixed_amount",
    triggerType: "coupon",
    fixedAmountCents: 7_500,
    code: "SAVE75",
    priorityOrder: 20,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Fixed · exit intent · DONTGO120",
    displayNameI18n: { en: "€120 parting offer", de: "120 € Abschiedsangebot", ru: "Предложение на 120 € при уходе" },
    discountType: "fixed_amount",
    triggerType: "exit_intent",
    fixedAmountCents: 12_000,
    code: "DONTGO120",
    priorityOrder: 25,
    isStackable: true,
    isActive: false,
  },

  // ---- free_days ----
  {
    name: "Free days · always · pay 6 stay 7",
    displayNameI18n: { en: "Pay 6, stay 7", de: "6 zahlen, 7 bleiben", ru: "Платите за 6, живите 7" },
    discountType: "free_days",
    triggerType: "always",
    freeNights: 1,
    freeNightsThreshold: 7,
    priorityOrder: 20,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Free days · long stay · 2 free of 14",
    displayNameI18n: { en: "2 nights free on 14", de: "2 Nächte gratis bei 14", ru: "2 ночи бесплатно при 14" },
    discountType: "free_days",
    triggerType: "long_stay",
    freeNights: 2,
    freeNightsThreshold: 14,
    minNights: 14,
    priorityOrder: 20,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Free days · last minute · 1 free of 5 within 10 days",
    displayNameI18n: { en: "1 night free, late booking", de: "1 Nacht gratis, Last-Minute", ru: "1 ночь бесплатно при позднем бронировании" },
    discountType: "free_days",
    triggerType: "last_minute",
    freeNights: 1,
    freeNightsThreshold: 5,
    lastMinuteWithinDays: 10,
    priorityOrder: 20,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Free days · early bird · 2 free of 10 from 100 days",
    displayNameI18n: { en: "2 nights free, book early", de: "2 Nächte gratis bei Frühbuchung", ru: "2 ночи бесплатно при раннем бронировании" },
    discountType: "free_days",
    triggerType: "early_bird",
    freeNights: 2,
    freeNightsThreshold: 10,
    earlyBirdMinDays: 100,
    priorityOrder: 20,
    isStackable: true,
    isActive: false,
  },
  {
    name: "Free days · coupon · FREENIGHT",
    displayNameI18n: { en: "A night on us", de: "Eine Nacht geschenkt", ru: "Ночь в подарок" },
    discountType: "free_days",
    triggerType: "coupon",
    freeNights: 1,
    freeNightsThreshold: 7,
    code: "FREENIGHT",
    priorityOrder: 30,
    isStackable: true,
    isActive: true,
  },
  {
    name: "Free days · exit intent · LASTCHANCE",
    displayNameI18n: { en: "Last-chance free night", de: "Letzte Chance: Gratisnacht", ru: "Последний шанс: бесплатная ночь" },
    discountType: "free_days",
    triggerType: "exit_intent",
    freeNights: 1,
    freeNightsThreshold: 6,
    code: "LASTCHANCE",
    priorityOrder: 30,
    isStackable: true,
    isActive: false,
  },
];

/**
 * Which promotions each villa carries, by promotion name.
 *
 * Chosen so the three villas cover three different outcomes once the cache is
 * rebuilt: two windows with different discounts, a compounded pair of
 * percentages, and no discount at all.
 */
const VILLA_PROMOTION_LINKS: Record<string, string[]> = {
  // Two cache windows: the 5-night min-stay window qualifies for neither
  // promotion, while the 7-night pay-6-stay-7 window qualifies for both.
  "VS-001": [
    "Percentage · long stay · 10% from 7 nights",
    "Free days · always · pay 6 stay 7",
  ],
  // Two stackable percentages compound on the near window; the exclusive fixed
  // amount only enters on a 10-night stay.
  "VS-002": [
    "Percentage · last minute · 15% within 21 days",
    "Percentage · always · direct booking 5%",
    "Fixed · long stay · EUR 150 off from 10 nights",
  ],
  // Nothing fires without a coupon or a 90-day lead, so this villa is the
  // control case: a cached row with `has_active_discount = false`. It is also
  // where the coupon and exit-intent paths are testable by hand.
  "VS-003": [
    "Percentage · early bird · 12% from 90 days",
    "Percentage · coupon · WELCOME8",
    "Free days · coupon · FREENIGHT",
    "Percentage · exit intent · STAY7",
  ],
};

/* -------------------------------------------------------------------------- */
/* Search synonyms, deals, rates                                              */
/* -------------------------------------------------------------------------- */

/**
 * Feeds the pure `parseSearchIntent`. Canonical terms are the values the filter
 * contract expects: a location or category canonical term is that taxonomy's
 * **English slug**, and an amenity canonical term is the `amenities.key`.
 */
const SYNONYM_DATA: {
  locale: Locale;
  term: string;
  canonicalTerm: string;
  kind: "location" | "category" | "amenity" | "misc";
}[] = [
  // Locations.
  { locale: "en", term: "kalkan", canonicalTerm: "kalkan", kind: "location" },
  { locale: "en", term: "islamlar", canonicalTerm: "islamlar", kind: "location" },
  { locale: "en", term: "kas", canonicalTerm: "kas", kind: "location" },
  { locale: "de", term: "kalkan", canonicalTerm: "kalkan", kind: "location" },
  { locale: "de", term: "islamlar", canonicalTerm: "islamlar", kind: "location" },
  { locale: "de", term: "kas", canonicalTerm: "kas", kind: "location" },
  { locale: "ru", term: "калкан", canonicalTerm: "kalkan", kind: "location" },
  { locale: "ru", term: "исламлар", canonicalTerm: "islamlar", kind: "location" },
  { locale: "ru", term: "каш", canonicalTerm: "kas", kind: "location" },

  // Categories.
  { locale: "en", term: "honeymoon", canonicalTerm: "honeymoon-villas", kind: "category" },
  { locale: "en", term: "family", canonicalTerm: "family-villas", kind: "category" },
  { locale: "en", term: "sea view", canonicalTerm: "sea-view-villas", kind: "category" },
  { locale: "de", term: "honeymoon", canonicalTerm: "honeymoon-villen", kind: "category" },
  { locale: "de", term: "familie", canonicalTerm: "familienvillen", kind: "category" },
  { locale: "de", term: "meerblick", canonicalTerm: "villen-mit-meerblick", kind: "category" },
  { locale: "ru", term: "медовый месяц", canonicalTerm: "villy-dlya-medovogo-mesyaca", kind: "category" },
  { locale: "ru", term: "семейная", canonicalTerm: "semeynye-villy", kind: "category" },

  // Amenities.
  { locale: "en", term: "pool", canonicalTerm: "private_pool", kind: "amenity" },
  { locale: "en", term: "private pool", canonicalTerm: "private_pool", kind: "amenity" },
  { locale: "en", term: "jacuzzi", canonicalTerm: "jacuzzi", kind: "amenity" },
  { locale: "en", term: "wifi", canonicalTerm: "wifi", kind: "amenity" },
  { locale: "de", term: "pool", canonicalTerm: "private_pool", kind: "amenity" },
  { locale: "de", term: "whirlpool", canonicalTerm: "jacuzzi", kind: "amenity" },
  { locale: "de", term: "wlan", canonicalTerm: "wifi", kind: "amenity" },
  { locale: "ru", term: "бассейн", canonicalTerm: "private_pool", kind: "amenity" },
  { locale: "ru", term: "джакузи", canonicalTerm: "jacuzzi", kind: "amenity" },

  // Typo corrections, consumed from the residual query without adding a filter.
  { locale: "en", term: "honeymun", canonicalTerm: "honeymoon-villas", kind: "misc" },
  { locale: "en", term: "villa", canonicalTerm: "villa", kind: "misc" },
  { locale: "en", term: "luxury", canonicalTerm: "luxury", kind: "misc" },
];

const DEAL_DATA: {
  titleI18n: LocalizedText;
  bodyI18n: LocalizedText;
  link: string | null;
  orderValue: number;
  /** Days from today; null means no bound. */
  endsInDays: number | null;
}[] = [
  {
    titleI18n: { en: "Pay 6, stay 7 at Villa Sunset", de: "6 zahlen, 7 bleiben in der Villa Sunset", ru: "Платите за 6, живите 7 на вилле Sunset" },
    bodyI18n: { en: "Book seven nights or more and the seventh is on us.", de: "Buchen Sie sieben Nächte oder mehr und die siebte geht auf uns.", ru: "Забронируйте семь ночей или больше — седьмая за наш счёт." },
    link: "/villas/villa-sunset-kalkan",
    orderValue: 30,
    endsInDays: 120,
  },
  {
    titleI18n: { en: "15% off last-minute stays", de: "15 % Rabatt auf Last-Minute-Aufenthalte", ru: "15% скидка на поздние бронирования" },
    bodyI18n: { en: "Arriving within three weeks? Villa Olive Grove is discounted.", de: "Anreise innerhalb von drei Wochen? Die Villa Olive Grove ist reduziert.", ru: "Заезд в течение трёх недель? Вилла Olive Grove со скидкой." },
    link: "/villa-offers",
    orderValue: 20,
    endsInDays: 60,
  },
  {
    titleI18n: { en: "New: Villa Lykia in Kas", de: "Neu: Villa Lykia in Kaş", ru: "Новинка: вилла Lykia в Каше" },
    bodyI18n: { en: "A two-bedroom villa for couples, a short walk from the water.", de: "Eine Villa mit zwei Schlafzimmern für Paare, wenige Schritte vom Wasser.", ru: "Вилла с двумя спальнями для пар, в нескольких минутах от воды." },
    link: "/villas/villa-lykia-kas",
    orderValue: 10,
    endsInDays: null,
  },
];

/** Plausible placeholders so `refreshExchangeRates` has something to replace. */
const EXCHANGE_RATE_DATA: { quoteCurrency: "GBP" | "RUB"; rate: string }[] = [
  { quoteCurrency: "GBP", rate: "0.85000000" },
  { quoteCurrency: "RUB", rate: "98.50000000" },
];

/* -------------------------------------------------------------------------- */
/* Calendar generation                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic seasonal pricing: one multiplier per night, rounded once.
 *
 * Deterministic rather than random so the price-cache drift check produces the
 * same numbers on every run and a failure means a real regression.
 */
function nightlyPriceCents(villa: SeedVilla, date: DateString): number {
  const month = Number(date.slice(5, 7));
  // `parseDate` semantics: dates are UTC midnight, so `getUTCDay` is the
  // calendar weekday rather than the server's local one.
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  const seasonMultiplier =
    month === 7 || month === 8
      ? 1.6
      : month === 6 || month === 9
        ? 1.25
        : month === 1 || month === 2
          ? 0.8
          : 1;

  // Friday and Saturday nights.
  const weekendMultiplier = weekday === 5 || weekday === 6 ? 1.1 : 1;

  return Math.round(villa.baseNightlyCents * seasonMultiplier * weekendMultiplier);
}

type CalendarRow = typeof villaCalendar.$inferInsert;

function buildCalendarRows(
  villa: SeedVilla,
  villaId: number,
  from: DateString,
): CalendarRow[] {
  const blocked = new Set(villa.blockedDayOffsets);
  const minStayByOffset = new Map(
    villa.minStayOverrides.map((override) => [override.offset, override.minStay]),
  );

  const rows: CalendarRow[] = [];

  for (let offset = 0; offset < SEED_CALENDAR_DAYS; offset += 1) {
    const date = addDays(from, offset);
    const isBlocked = blocked.has(offset);

    rows.push({
      villaId,
      date,
      priceCents: nightlyPriceCents(villa, date),
      minStay: minStayByOffset.get(offset) ?? null,
      isBlocked,
      // The CHECK constraint requires a source whenever a night is blocked, so
      // an admin can tell a manual hold from a booked night.
      blockSource: isBlocked ? "admin" : null,
      bookingId: null,
      note: isBlocked ? "Seeded owner stay" : null,
      updatedAt: new Date(),
    });
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Upsert helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Postgres caps a statement's bind parameters, so wide inserts go in chunks. */
async function insertInChunks<T>(
  rows: T[],
  size: number,
  write: (batch: [T, ...T[]]) => Promise<unknown>,
): Promise<void> {
  for (let index = 0; index < rows.length; index += size) {
    const batch = rows.slice(index, index + size);
    if (batch.length === 0) continue;
    await write(batch as [T, ...T[]]);
  }
}

async function findLocationIdByEnglishSlug(slug: string): Promise<number | null> {
  const [row] = await dbPool
    .select({ id: locationTranslations.locationId })
    .from(locationTranslations)
    .where(
      and(
        eq(locationTranslations.locale, "en"),
        eq(locationTranslations.slug, slug),
      ),
    )
    .limit(1);

  return row?.id ?? null;
}

async function findCategoryIdByEnglishSlug(slug: string): Promise<number | null> {
  const [row] = await dbPool
    .select({ id: categoryTranslations.categoryId })
    .from(categoryTranslations)
    .where(
      and(
        eq(categoryTranslations.locale, "en"),
        eq(categoryTranslations.slug, slug),
      ),
    )
    .limit(1);

  return row?.id ?? null;
}

async function upsertLocationTree(
  tree: readonly SeedLocation[],
  parentId: number | null,
): Promise<number> {
  let count = 0;

  for (const node of tree) {
    const existingId = await findLocationIdByEnglishSlug(node.translations.en.slug);

    const values = {
      parentId,
      type: node.type,
      isFeatured: node.isFeatured,
      orderValue: node.orderValue,
      latitude: node.latitude,
      longitude: node.longitude,
      updatedAt: new Date(),
    };

    let locationId: number;

    if (existingId === null) {
      const [created] = await dbPool
        .insert(locations)
        .values(values)
        .returning({ id: locations.id });
      locationId = created.id;
    } else {
      await dbPool.update(locations).set(values).where(eq(locations.id, existingId));
      locationId = existingId;
    }

    for (const [locale, translation] of Object.entries(node.translations)) {
      await dbPool
        .insert(locationTranslations)
        .values({
          locationId,
          locale: locale as Locale,
          slug: translation.slug,
          name: translation.name,
          description: translation.description ?? null,
        })
        .onConflictDoUpdate({
          target: [locationTranslations.locationId, locationTranslations.locale],
          set: {
            slug: translation.slug,
            name: translation.name,
            description: translation.description ?? null,
          },
        });
    }

    count += 1;

    if (node.children !== undefined) {
      count += await upsertLocationTree(node.children, locationId);
    }
  }

  return count;
}

/* -------------------------------------------------------------------------- */
/* Seed                                                                       */
/* -------------------------------------------------------------------------- */

export type SeedResult = {
  today: DateString;
  adminEmail: string;
  locationCount: number;
  categoryCount: number;
  amenityCount: number;
  featureCount: number;
  ruleCount: number;
  villaCount: number;
  calendarRowCount: number;
  promotionCount: number;
  activePromotionCount: number;
  villaPromotionLinkCount: number;
  synonymCount: number;
  dealCount: number;
  /** `ref_code` to database id, so a caller can target the seeded villas. */
  villaIdsByRefCode: Record<string, number>;
};

export async function seed(
  options: { today?: DateString; withAdmin?: boolean } = {},
): Promise<SeedResult> {
  const today = options.today ?? getBusinessToday();

  /* -- Admin -------------------------------------------------------------- */
  // Skippable: the drift check does not need an admin, and sign-up is the
  // slowest step in the seed by a wide margin.
  const adminEmail =
    options.withAdmin === false
      ? "(skipped)"
      : (await ensureAdminUser()).email;

  /* -- Taxonomy ----------------------------------------------------------- */
  const locationCount = await upsertLocationTree(LOCATION_TREE, null);

  for (const [index, translations] of CATEGORY_DATA.entries()) {
    const existingId = await findCategoryIdByEnglishSlug(translations.en.slug);
    const values = {
      isFeatured: index < 2,
      orderValue: (index + 1) * 10,
      updatedAt: new Date(),
    };

    let categoryId: number;
    if (existingId === null) {
      const [created] = await dbPool
        .insert(categories)
        .values(values)
        .returning({ id: categories.id });
      categoryId = created.id;
    } else {
      await dbPool.update(categories).set(values).where(eq(categories.id, existingId));
      categoryId = existingId;
    }

    for (const [locale, translation] of Object.entries(translations)) {
      await dbPool
        .insert(categoryTranslations)
        .values({
          categoryId,
          locale: locale as Locale,
          slug: translation.slug,
          name: translation.name,
          description: translation.description ?? null,
        })
        .onConflictDoUpdate({
          target: [categoryTranslations.categoryId, categoryTranslations.locale],
          set: {
            slug: translation.slug,
            name: translation.name,
            description: translation.description ?? null,
          },
        });
    }
  }

  const amenityIdsByKey = new Map<string, number>();
  for (const amenity of AMENITY_DATA) {
    const [row] = await dbPool
      .insert(amenities)
      .values(amenity)
      .onConflictDoUpdate({
        target: amenities.key,
        set: {
          labelI18n: amenity.labelI18n,
          icon: amenity.icon,
          group: amenity.group,
          orderValue: amenity.orderValue,
        },
      })
      .returning({ id: amenities.id });
    amenityIdsByKey.set(amenity.key, row.id);
  }

  const featureIdsByKey = new Map<string, number>();
  for (const feature of FEATURE_DATA) {
    const [row] = await dbPool
      .insert(features)
      .values(feature)
      .onConflictDoUpdate({
        target: features.key,
        set: {
          labelI18n: feature.labelI18n,
          icon: feature.icon,
          group: feature.group,
          orderValue: feature.orderValue,
        },
      })
      .returning({ id: features.id });
    featureIdsByKey.set(feature.key, row.id);
  }

  const ruleIdsByKey = new Map<string, number>();
  for (const rule of RULE_DATA) {
    const [row] = await dbPool
      .insert(villaRules)
      .values(rule)
      .onConflictDoUpdate({
        target: villaRules.key,
        set: {
          labelI18n: rule.labelI18n,
          descriptionI18n: rule.descriptionI18n,
          icon: rule.icon,
          orderValue: rule.orderValue,
        },
      })
      .returning({ id: villaRules.id });
    ruleIdsByKey.set(rule.key, row.id);
  }

  /* -- Promotions --------------------------------------------------------- */
  // Keyed by `name`: it is not a unique column, but every name in the matrix is
  // distinct, which is enough to make the seed re-runnable.
  const promotionIdsByName = new Map<string, number>();

  for (const promotion of PROMOTION_MATRIX) {
    const values = {
      name: promotion.name,
      displayNameI18n: promotion.displayNameI18n,
      discountType: promotion.discountType,
      triggerType: promotion.triggerType,
      percentBp: promotion.percentBp ?? null,
      fixedAmountCents: promotion.fixedAmountCents ?? null,
      freeNights: promotion.freeNights ?? null,
      freeNightsThreshold: promotion.freeNightsThreshold ?? null,
      minNights: promotion.minNights ?? null,
      maxNights: promotion.maxNights ?? null,
      lastMinuteWithinDays: promotion.lastMinuteWithinDays ?? null,
      earlyBirdMinDays: promotion.earlyBirdMinDays ?? null,
      code: promotion.code ?? null,
      priorityOrder: promotion.priorityOrder,
      isStackable: promotion.isStackable,
      isActive: promotion.isActive,
      updatedAt: new Date(),
    };

    const [existing] = await dbPool
      .select({ id: promotions.id })
      .from(promotions)
      .where(eq(promotions.name, promotion.name))
      .limit(1);

    if (existing === undefined) {
      const [created] = await dbPool
        .insert(promotions)
        .values(values)
        .returning({ id: promotions.id });
      promotionIdsByName.set(promotion.name, created.id);
    } else {
      // `redemption_count` is deliberately not reset: it is a real counter that
      // bookings increment, not seed data.
      await dbPool.update(promotions).set(values).where(eq(promotions.id, existing.id));
      promotionIdsByName.set(promotion.name, existing.id);
    }
  }

  /* -- Villas ------------------------------------------------------------- */
  const villaIdsByRefCode: Record<string, number> = {};
  let calendarRowCount = 0;
  let villaPromotionLinkCount = 0;

  for (const villa of VILLA_DATA) {
    const locationId = await findLocationIdByEnglishSlug(villa.locationSlug);

    const [villaRow] = await dbPool
      .insert(villas)
      .values({
        locationId,
        refCode: villa.refCode,
        slug: villa.slug,
        capacity: villa.capacity,
        bedrooms: villa.bedrooms,
        bathrooms: villa.bathrooms,
        defaultMinStay: villa.defaultMinStay,
        defaultNightlyPriceCents: villa.defaultNightlyPriceCents,
        cleaningFeeCents: villa.cleaningFeeCents,
        depositCents: villa.depositCents,
        latitude: villa.latitude,
        longitude: villa.longitude,
        isActive: true,
        isFeatured: villa.isFeatured,
        isEditorsChoice: villa.isEditorsChoice,
        isBestValue: villa.isBestValue,
        orderValue: villa.orderValue,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: villas.refCode,
        set: {
          locationId,
          slug: villa.slug,
          capacity: villa.capacity,
          bedrooms: villa.bedrooms,
          bathrooms: villa.bathrooms,
          defaultMinStay: villa.defaultMinStay,
          defaultNightlyPriceCents: villa.defaultNightlyPriceCents,
          cleaningFeeCents: villa.cleaningFeeCents,
          depositCents: villa.depositCents,
          latitude: villa.latitude,
          longitude: villa.longitude,
          isActive: true,
          isFeatured: villa.isFeatured,
          isEditorsChoice: villa.isEditorsChoice,
          isBestValue: villa.isBestValue,
          orderValue: villa.orderValue,
          updatedAt: new Date(),
        },
      })
      .returning({ id: villas.id });

    const villaId = villaRow.id;
    villaIdsByRefCode[villa.refCode] = villaId;

    for (const [locale, translation] of Object.entries(villa.translations)) {
      await dbPool
        .insert(villaTranslations)
        .values({
          villaId,
          locale: locale as Locale,
          slug: translation.slug,
          title: translation.title,
          summary: translation.summary,
          description: translation.description,
          metaTitle: `${translation.title} | Villa Collection`,
          metaDescription: translation.summary,
        })
        .onConflictDoUpdate({
          target: [villaTranslations.villaId, villaTranslations.locale],
          set: {
            slug: translation.slug,
            title: translation.title,
            summary: translation.summary,
            description: translation.description,
            metaTitle: `${translation.title} | Villa Collection`,
            metaDescription: translation.summary,
          },
        });
    }

    // Images are replaced wholesale: they have a uuid primary key and no
    // natural key, so upserting them would accumulate duplicates.
    await dbPool.delete(villaImages).where(eq(villaImages.villaId, villaId));
    await dbPool.insert(villaImages).values(
      [1, 2, 3].map((index) => ({
        villaId,
        url: `https://placehold.co/1600x1000/png?text=${encodeURIComponent(villa.translations.en.title)}+${index}`,
        altI18n: {
          en: `${villa.translations.en.title}, photo ${index}`,
          de: `${villa.translations.de.title}, Foto ${index}`,
          ru: `${villa.translations.ru.title}, фото ${index}`,
        } satisfies LocalizedText,
        orderValue: index * 10,
        isMain: index === 1,
      })),
    );

    // Link tables are composite-keyed, so a plain conflict-do-nothing is enough
    // to make re-running a no-op.
    const categoryIds = (
      await Promise.all(villa.categorySlugs.map(findCategoryIdByEnglishSlug))
    ).filter((id): id is number => id !== null);

    if (categoryIds.length > 0) {
      await dbPool
        .insert(villaCategories)
        .values(categoryIds.map((categoryId) => ({ villaId, categoryId })))
        .onConflictDoNothing();
    }

    await dbPool
      .insert(villaAmenities)
      .values(
        villa.amenityKeys.map((key, index) => ({
          villaId,
          amenityId: amenityIdsByKey.get(key)!,
          isHighlighted: index < 3,
        })),
      )
      .onConflictDoNothing();

    await dbPool
      .insert(villaFeatures)
      .values(
        villa.featureKeys.map((key, index) => ({
          villaId,
          featureId: featureIdsByKey.get(key)!,
          isHighlighted: index < 2,
        })),
      )
      .onConflictDoNothing();

    await dbPool
      .insert(villaRuleLinks)
      .values(
        villa.ruleKeys.map((key) => ({
          villaId,
          ruleId: ruleIdsByKey.get(key)!,
        })),
      )
      .onConflictDoNothing();

    const linkNames = VILLA_PROMOTION_LINKS[villa.refCode] ?? [];
    if (linkNames.length > 0) {
      await dbPool
        .insert(villaPromotions)
        .values(
          linkNames.map((name) => ({
            villaId,
            promotionId: promotionIdsByName.get(name)!,
            priorityOverride: null,
          })),
        )
        .onConflictDoNothing();
      villaPromotionLinkCount += linkNames.length;
    }

    /* -- Calendar --------------------------------------------------------- */
    // Rewritten from scratch rather than upserted: the horizon moves with
    // `today`, so yesterday's rows are no longer part of the seeded window and
    // leaving them behind would make the fixture depend on when it last ran.
    //
    // Nights held by a booking are left alone — deleting those rows would
    // silently resell a reserved night — so the insert tolerates the conflict
    // those survivors cause.
    await dbPool
      .delete(villaCalendar)
      .where(
        and(
          eq(villaCalendar.villaId, villaId),
          or(
            isNull(villaCalendar.blockSource),
            ne(villaCalendar.blockSource, "booking"),
          ),
        ),
      );

    const calendarRows = buildCalendarRows(villa, villaId, today);
    await insertInChunks(calendarRows, 60, (batch) =>
      dbPool.insert(villaCalendar).values(batch).onConflictDoNothing(),
    );
    calendarRowCount += calendarRows.length;
  }

  /* -- Search synonyms ---------------------------------------------------- */
  for (const synonym of SYNONYM_DATA) {
    await dbPool
      .insert(searchSynonyms)
      .values(synonym)
      .onConflictDoUpdate({
        target: [searchSynonyms.locale, searchSynonyms.term],
        set: {
          canonicalTerm: synonym.canonicalTerm,
          kind: synonym.kind,
        },
      });
  }

  /* -- Deals -------------------------------------------------------------- */
  // No natural key, so the seeded set is replaced. Scoped by title so a deal an
  // admin created by hand is not collateral damage.
  const seededDealTitles = DEAL_DATA.map((deal) => deal.titleI18n.en);
  await dbPool
    .delete(deals)
    .where(inArray(sql`${deals.titleI18n}->>'en'`, seededDealTitles));

  await dbPool.insert(deals).values(
    DEAL_DATA.map((deal) => ({
      titleI18n: deal.titleI18n,
      bodyI18n: deal.bodyI18n,
      link: deal.link,
      startsAt: null,
      endsAt:
        deal.endsInDays === null
          ? null
          : new Date(`${addDays(today, deal.endsInDays)}T23:59:59.000Z`),
      isActive: true,
      orderValue: deal.orderValue,
    })),
  );

  /* -- Exchange rates ----------------------------------------------------- */
  for (const rate of EXCHANGE_RATE_DATA) {
    await dbPool
      .insert(exchangeRates)
      .values({
        baseCurrency: "EUR",
        quoteCurrency: rate.quoteCurrency,
        rate: rate.rate,
        fetchedAt: new Date(),
        source: "seed",
      })
      .onConflictDoUpdate({
        target: [exchangeRates.baseCurrency, exchangeRates.quoteCurrency],
        set: { rate: rate.rate, fetchedAt: new Date(), source: "seed" },
      });
  }

  return {
    today,
    adminEmail,
    locationCount,
    categoryCount: CATEGORY_DATA.length,
    amenityCount: AMENITY_DATA.length,
    featureCount: FEATURE_DATA.length,
    ruleCount: RULE_DATA.length,
    villaCount: VILLA_DATA.length,
    calendarRowCount,
    promotionCount: PROMOTION_MATRIX.length,
    activePromotionCount: PROMOTION_MATRIX.filter((p) => p.isActive).length,
    villaPromotionLinkCount,
    synonymCount: SYNONYM_DATA.length,
    dealCount: DEAL_DATA.length,
    villaIdsByRefCode,
  };
}
