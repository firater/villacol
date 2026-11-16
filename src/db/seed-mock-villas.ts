/**
 * Idempotent bulk fixture: 100 catalogue villas for pagination / filter / sort QA.
 *
 * Upserts on `villas.ref_code` (`MOCK-001` … `MOCK-100`). Re-running updates the
 * same rows and refreshes links, calendar, and search — it does not duplicate.
 *
 * Requires taxonomy from `seed()` first (locations, categories, amenities, features).
 */
import { and, eq, inArray, isNull, ne, or } from "drizzle-orm";

import { dbPool } from "@/db/pool";
import {
  amenities,
  categories,
  categoryTranslations,
  features,
  locationTranslations,
  locations,
  villaAmenities,
  villaCalendar,
  villaCategories,
  villaFeatures,
  villaImages,
  villaTranslations,
  villas,
} from "@/db/schema";
import type { GuestPolicy } from "@/db/tables/enums";
import { addDays, getBusinessToday, type DateString } from "@/lib/dates";
import type { Locale, LocalizedText } from "@/lib/locales";
import { rebuildVillaPriceCache } from "@/lib/cron/jobs/rebuild-villa-price-cache";
import { rebuildVillaSearchDocuments } from "@/lib/search/indexer";

export const MOCK_VILLA_COUNT = 100;
export const MOCK_VILLA_REF_PREFIX = "MOCK-";
/** Open nights written per mock villa (listings + availability smoke tests). */
export const MOCK_CALENDAR_DAYS = 30;

const GUEST_POLICIES: GuestPolicy[] = [
  "everyone",
  "couples_only",
  "families_only",
  "no_friend_groups",
];

type CatalogLocation = {
  id: number;
  slug: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

type CatalogCategory = { id: number; slug: string };
type CatalogAmenity = { id: number; key: string };
type CatalogFeature = { id: number; key: string };

type TextTemplate = Record<
  Locale,
  { title: string; summary: string; description: string }
>;

const TEXT_TEMPLATES: TextTemplate[] = [
  {
    en: {
      title: "Villa {adj} {noun}",
      summary:
        "A {bedrooms}-bedroom retreat near {location} for up to {capacity} guests.",
      description:
        "Set above {location}, this {bedrooms}-bedroom home sleeps {capacity} with shaded terraces and a calm, unhurried rhythm. Mornings are for coffee on the terrace; evenings for the bay breeze rolling in from the hills.",
    },
    de: {
      title: "Villa {adj} {noun}",
      summary:
        "Ein Rückzugsort mit {bedrooms} Schlafzimmern nahe {location} für bis zu {capacity} Gäste.",
      description:
        "Oberhalb von {location} bietet dieses Haus mit {bedrooms} Schlafzimmern Platz für {capacity} Gäste — beschattete Terrassen und ein ruhiger Tagesablauf. Morgens Kaffee draußen, abends die Brise vom Meer.",
    },
    ru: {
      title: "Вилла {adj} {noun}",
      summary:
        "Дом с {bedrooms} спальнями рядом с {location} для компании до {capacity} гостей.",
      description:
        "Над {location} — {bedrooms} спальни на {capacity} гостей, тенистые террасы и размеренный ритм дня. Утро начинается с кофе на террасе, вечером с гор дует морской воздух.",
    },
  },
  {
    en: {
      title: "The {noun} House",
      summary:
        "{capacity} guests · {bedrooms} bedrooms · minutes from {location}.",
      description:
        "The {noun} House is laid out for families and friends who want space without fuss. {bedrooms} bedrooms, generous living areas, and a short drive down to {location} for dinner by the water.",
    },
    de: {
      title: "Haus {noun}",
      summary:
        "{capacity} Gäste · {bedrooms} Schlafzimmer · wenige Minuten von {location}.",
      description:
        "Haus {noun} ist für Familien und Freunde gedacht, die Raum ohne Schnickschnack suchen. {bedrooms} Schlafzimmer, großzügige Wohnbereiche und eine kurze Fahrt nach {location}.",
    },
    ru: {
      title: "Дом {noun}",
      summary:
        "До {capacity} гостей · {bedrooms} спальни · недалеко от {location}.",
      description:
        "Дом {noun} для семьи и друзей, которым нужно пространство без лишней суеты. {bedrooms} спальни, просторные гостиные и короткая дорога до {location}.",
    },
  },
  {
    en: {
      title: "{location} {noun} Villa",
      summary:
        "Pool-level comfort in {location}, sleeping {capacity} across {bedrooms} bedrooms.",
      description:
        "Designed around long afternoons by the pool, this villa in {location} spreads {bedrooms} bedrooms across two levels so everyone has a quiet corner. The coast is close; the pace is slow.",
    },
    de: {
      title: "Villa {noun} {location}",
      summary:
        "Komfort am Pool in {location}, Platz für {capacity} Gäste in {bedrooms} Schlafzimmern.",
      description:
        "Für lange Nachmittäge am Pool konzipiert: {bedrooms} Schlafzimmer auf zwei Ebenen in {location}. Küste nah, Tempo langsam.",
    },
    ru: {
      title: "Вилла {noun} · {location}",
      summary:
        "Комфорт у бассейна в {location}, до {capacity} гостей в {bedrooms} спальнях.",
      description:
        "Длинные дни у бассейна: {bedrooms} спальни на двух уровнях в {location}. Море рядом, темп спокойный.",
    },
  },
  {
    en: {
      title: "Casa {noun}",
      summary:
        "A {capacity}-guest casa near {location} with {bedrooms} ensuite bedrooms.",
      description:
        "Casa {noun} trades hotel polish for stone, timber, and honest light. {bedrooms} bedrooms each with their own bath — ideal for two families sharing a week in {location}.",
    },
    de: {
      title: "Casa {noun}",
      summary:
        "Casa für {capacity} Gäste nahe {location} mit {bedrooms} Schlafzimmern mit Bad.",
      description:
        "Casa {noun}: Stein, Holz, klares Licht statt Hotelglanz. {bedrooms} Schlafzimmer mit eigenem Bad — ideal für zwei Familien in {location}.",
    },
    ru: {
      title: "Casa {noun}",
      summary:
        "Casa на {capacity} гостей рядом с {location}, {bedrooms} спальни с ванной.",
      description:
        "Casa {noun} — камень, дерево и честный свет вместо отельного лоска. {bedrooms} спальни с ванной: удобно двум семьям в {location}.",
    },
  },
  {
    en: {
      title: "Villa {noun} · {adj} Wing",
      summary:
        "{bedrooms} bedrooms and sea-country air above {location} ({capacity} guests).",
      description:
        "The {adj} wing of Villa {noun} looks across pine and olive toward {location}. Inside: {bedrooms} calm bedrooms; outside: space for {capacity} guests to spread out without crowding the pool.",
    },
    de: {
      title: "Villa {noun} · {adj} Flügel",
      summary:
        "{bedrooms} Schlafzimmer und Küstenluft oberhalb {location} ({capacity} Gäste).",
      description:
        "Der {adj} Flügel der Villa {noun} blickt über Pinien und Oliven Richtung {location}. Drinnen {bedrooms} ruhige Zimmer, draußen Platz für {capacity} Gäste am Pool.",
    },
    ru: {
      title: "Вилла {noun} · крыло {adj}",
      summary:
        "{bedrooms} спальни и морской воздух над {location} (до {capacity} гостей).",
      description:
        "Крыло {adj} виллы {noun} смотрит через сосны и оливы к {location}. Внутри {bedrooms} спальни, снаружи место для {capacity} гостей у бассейна.",
    },
  },
  {
    en: {
      title: "{adj} Point",
      summary:
        "Elevated {bedrooms}-bedroom villa near {location} for parties of {capacity}.",
      description:
        "{adj} Point sits high enough to catch the breeze yet close enough to {location} for evening strolls. {bedrooms} bedrooms, a shaded dining terrace, and room for {capacity} without compromise.",
    },
    de: {
      title: "{adj} Point",
      summary:
        "Erhöhte Villa mit {bedrooms} Schlafzimmern nahe {location} für {capacity} Gäste.",
      description:
        "{adj} Point fängt die Brise ein und liegt dennoch nah an {location}. {bedrooms} Schlafzimmer, schattige Essterrasse, Platz für {capacity}.",
    },
    ru: {
      title: "Мыс {adj}",
      summary:
        "Вилла на возвышенности, {bedrooms} спальни рядом с {location}, до {capacity} гостей.",
      description:
        "Мыс {adj} ловит ветер и остаётся близко к {location}. {bedrooms} спальни, тенистая терраса, комфорт для {capacity} гостей.",
    },
  },
  {
    en: {
      title: "Residence {noun}",
      summary:
        "Contemporary lines in {location}: {bedrooms} beds, {capacity} guests.",
      description:
        "Residence {noun} is contemporary without being cold — wide glass, pale stone, and {bedrooms} bedrooms that open to the garden. {location} is your anchor; the house is your pause.",
    },
    de: {
      title: "Residence {noun}",
      summary:
        "Zeitgenössische Linien in {location}: {bedrooms} Betten, {capacity} Gäste.",
      description:
        "Residence {noun} ist modern ohne kühl zu wirken — Glas, helles Stein, {bedrooms} Schlafzimmer zum Garten. {location} als Anker, das Haus als Pause.",
    },
    ru: {
      title: "Резиденция {noun}",
      summary:
        "Современная линия в {location}: {bedrooms} спален, {capacity} гостей.",
      description:
        "Резиденция {noun} — стекло, светлый камень, {bedrooms} спальни к саду. {location} рядом, дом — ваш передыш.",
    },
  },
  {
    en: {
      title: "Villa {noun} Gardens",
      summary:
        "Garden villa in {location} — {capacity} guests, {bedrooms} bedrooms.",
      description:
        "Villa {noun} Gardens is wrapped in lavender and citrus. {bedrooms} bedrooms open to shaded paths; {capacity} guests can dine outside most nights. {location} supplies the backdrop.",
    },
    de: {
      title: "Villa {noun} Gardens",
      summary:
        "Gartenvilla in {location} — {capacity} Gäste, {bedrooms} Schlafzimmer.",
      description:
        "Villa {noun} Gardens liegt zwischen Lavendel und Zitrus. {bedrooms} Schlafzimmer zu schattigen Wegen; {capacity} Gäste essen draußen. {location} als Kulisse.",
    },
    ru: {
      title: "Вилла {noun} Gardens",
      summary:
        "Садовая вилла в {location} — {capacity} гостей, {bedrooms} спальни.",
      description:
        "Вилла {noun} Gardens среди лаванды и цитрусов. {bedrooms} спальни к тенистым дорожкам; {capacity} гостей ужинают на воздухе. Фон — {location}.",
    },
  },
  {
    en: {
      title: "The {adj} Retreat",
      summary:
        "Private retreat near {location} with {bedrooms} suites for {capacity}.",
      description:
        "The {adj} Retreat keeps the guest list small and the spaces large. Near {location}, with {bedrooms} suite-style bedrooms and honest Mediterranean cooking on the terrace.",
    },
    de: {
      title: "Retreat {adj}",
      summary:
        "Privates Refugium nahe {location} mit {bedrooms} Suiten für {capacity} Gäste.",
      description:
        "Retreat {adj}: wenige Gäste, große Räume. Nahe {location}, {bedrooms} Schlafzimmer im Suite-Stil und einfache mediterrane Küche auf der Terrasse.",
    },
    ru: {
      title: "Ретрит {adj}",
      summary:
        "Уединённый дом рядом с {location}: {bedrooms} номера для {capacity} гостей.",
      description:
        "Ретрит {adj} — мало гостей, много пространства. Рядом с {location}, {bedrooms} спальни в духе сьюта и ужины на террасе.",
    },
  },
  {
    en: {
      title: "House of {noun}",
      summary:
        "{capacity}-guest house in {location} · {bedrooms} bedrooms · unhurried.",
      description:
        "House of {noun} is for travellers who want a week, not a weekend. {bedrooms} bedrooms, generous storage, and a kitchen built for long lunches. {location} is a short drive; the house encourages you to stay in.",
    },
    de: {
      title: "Haus {noun}",
      summary:
        "Haus für {capacity} Gäste in {location} · {bedrooms} Schlafzimmer · ohne Eile.",
      description:
        "Haus {noun} ist für eine ganze Woche gedacht. {bedrooms} Schlafzimmer, viel Stauraum, Küche für lange Mittagessen. {location} ist nah — das Haus lädt zum Bleiben ein.",
    },
    ru: {
      title: "Дом {noun}",
      summary:
        "Дом на {capacity} гостей в {location} · {bedrooms} спальни · без спешки.",
      description:
        "Дом {noun} — на неделю, а не на выходные. {bedrooms} спальни, много места, кухня для долгих обедов. {location} недалеко, но дом зовёт остаться.",
    },
  },
];

const ADJECTIVES_EN = [
  "Azure",
  "Olive",
  "Stone",
  "Cypress",
  "Lemon",
  "Moonlit",
  "Terrace",
  "Horizon",
  "Pine",
  "Coastal",
];
const NOUNS_EN = [
  "Sol",
  "Mare",
  "Selene",
  "Luna",
  "Aurora",
  "Thalassa",
  "Helios",
  "Zephyr",
  "Onda",
  "Alba",
];

const ADJECTIVES_DE = [
  "Azur",
  "Oliven",
  "Stein",
  "Zypressen",
  "Zitronen",
  "Mond",
  "Terrassen",
  "Horizont",
  "Kiefern",
  "Küsten",
];
const NOUNS_DE = [
  "Sonne",
  "Meer",
  "Mondlicht",
  "Aurora",
  "Thalassa",
  "Helios",
  "Brise",
  "Welle",
  "Morgen",
  "Licht",
];

const ADJECTIVES_RU = [
  "Лазурная",
  "Оливковая",
  "Каменная",
  "Кипарисовая",
  "Лимонная",
  "Лунная",
  "Террасная",
  "Горизонт",
  "Сосновая",
  "Прибрежная",
];
const NOUNS_RU = [
  "Соль",
  "Маре",
  "Селена",
  "Луна",
  "Аврора",
  "Таласса",
  "Гелиос",
  "Бриз",
  "Волна",
  "Альба",
];

/** Deterministic pseudo-random in [0, 1) from a numeric seed. */
function unitRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function intInRange(seed: number, min: number, max: number): number {
  return min + Math.floor(unitRandom(seed) * (max - min + 1));
}

function pickIndices(seed: number, count: number, poolSize: number): number[] {
  const picked = new Set<number>();
  let attempt = 0;
  while (picked.size < count && attempt < poolSize * 3) {
    picked.add(intInRange(seed + attempt * 17, 0, poolSize - 1));
    attempt += 1;
  }
  return [...picked];
}

function fillCopy(
  template: TextTemplate,
  locale: Locale,
  vars: {
    location: string;
    capacity: number;
    bedrooms: number;
    adj: string;
    noun: string;
  },
): { title: string; summary: string; description: string } {
  const block = template[locale];
  const replace = (s: string) =>
    s
      .replace(/\{location\}/g, vars.location)
      .replace(/\{capacity\}/g, String(vars.capacity))
      .replace(/\{bedrooms\}/g, String(vars.bedrooms))
      .replace(/\{adj\}/g, vars.adj)
      .replace(/\{noun\}/g, vars.noun);

  return {
    title: replace(block.title),
    summary: replace(block.summary),
    description: replace(block.description),
  };
}

function mockRefCode(index: number): string {
  return `${MOCK_VILLA_REF_PREFIX}${String(index).padStart(3, "0")}`;
}

function brandSlug(index: number): string {
  return `villa-mock-${String(index).padStart(3, "0")}`;
}

function translationSlug(index: number, locationSlug: string): string {
  return `mock-${String(index).padStart(3, "0")}-${locationSlug}`;
}

type MockVillaSpec = {
  index: number;
  refCode: string;
  slug: string;
  location: CatalogLocation;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  defaultMinStay: number;
  defaultNightlyPriceCents: number;
  cleaningFeeCents: number;
  depositCents: number;
  allowsPets: boolean;
  allowsSmoking: boolean;
  allowsParties: boolean;
  guestPolicy: GuestPolicy;
  orderValue: number;
  isFeatured: boolean;
  isEditorsChoice: boolean;
  isBestValue: boolean;
  latitude: number;
  longitude: number;
  categoryIds: number[];
  amenityIds: number[];
  featureIds: number[];
  translations: Record<
    Locale,
    { slug: string; title: string; summary: string; description: string }
  >;
};

function buildMockVillaSpec(
  index: number,
  locations: CatalogLocation[],
  categories: CatalogCategory[],
  amenitiesList: CatalogAmenity[],
  featuresList: CatalogFeature[],
): MockVillaSpec {
  const seed = index * 1_009;
  const location = locations[intInRange(seed, 0, locations.length - 1)]!;

  const capacity = intInRange(seed + 1, 2, 14);
  const bedrooms = Math.min(
    Math.max(1, Math.round(capacity / 2 + unitRandom(seed + 2) * 2)),
    8,
  );
  const bathrooms = Math.min(
    Math.max(1, bedrooms - intInRange(seed + 3, 0, 1)),
    6,
  );

  const nightlyEur = intInRange(seed + 4, 100, 2_000);
  const defaultNightlyPriceCents = nightlyEur * 100;
  const defaultMinStay = intInRange(seed + 5, 2, 10);

  const allowsPets = unitRandom(seed + 6) > 0.7;
  const allowsSmoking = unitRandom(seed + 7) > 0.85;
  const allowsParties = unitRandom(seed + 8) > 0.8;

  const guestPolicy =
    GUEST_POLICIES[intInRange(seed + 9, 0, GUEST_POLICIES.length - 1)]!;

  const categoryCount = intInRange(seed + 10, 1, Math.min(3, categories.length));
  const categoryIds = pickIndices(seed + 11, categoryCount, categories.length).map(
    (i) => categories[i]!.id,
  );

  const amenityCount = intInRange(
    seed + 12,
    3,
    Math.min(8, amenitiesList.length),
  );
  const amenityIds = pickIndices(seed + 13, amenityCount, amenitiesList.length).map(
    (i) => amenitiesList[i]!.id,
  );

  const featureCount = intInRange(
    seed + 14,
    1,
    Math.min(4, featuresList.length),
  );
  const featureIds = pickIndices(seed + 15, featureCount, featuresList.length).map(
    (i) => featuresList[i]!.id,
  );

  const template = TEXT_TEMPLATES[(index - 1) % TEXT_TEMPLATES.length]!;
  const adjEn = ADJECTIVES_EN[(index + seed) % ADJECTIVES_EN.length]!;
  const nounEn = NOUNS_EN[(index * 3 + seed) % NOUNS_EN.length]!;
  const adjDe = ADJECTIVES_DE[(index + seed) % ADJECTIVES_DE.length]!;
  const nounDe = NOUNS_DE[(index * 3 + seed) % NOUNS_DE.length]!;
  const adjRu = ADJECTIVES_RU[(index + seed) % ADJECTIVES_RU.length]!;
  const nounRu = NOUNS_RU[(index * 3 + seed) % NOUNS_RU.length]!;

  const slugBase = translationSlug(index, location.slug);
  const varsEn = {
    location: location.name,
    capacity,
    bedrooms,
    adj: adjEn,
    noun: nounEn,
  };
  const varsDe = {
    location: location.name,
    capacity,
    bedrooms,
    adj: adjDe,
    noun: nounDe,
  };
  const varsRu = {
    location: location.name,
    capacity,
    bedrooms,
    adj: adjRu,
    noun: nounRu,
  };

  const en = fillCopy(template, "en", varsEn);
  const de = fillCopy(template, "de", varsDe);
  const ru = fillCopy(template, "ru", varsRu);

  const jitter = (unitRandom(seed + 20) - 0.5) * 0.04;
  const latitude = (location.latitude ?? 36.25) + jitter;
  const longitude = (location.longitude ?? 29.4) + jitter;

  return {
    index,
    refCode: mockRefCode(index),
    slug: brandSlug(index),
    location,
    capacity,
    bedrooms,
    bathrooms,
    defaultMinStay,
    defaultNightlyPriceCents,
    cleaningFeeCents: intInRange(seed + 21, 8_000, 15_000),
    depositCents: intInRange(seed + 22, 20_000, 50_000),
    allowsPets,
    allowsSmoking,
    allowsParties,
    guestPolicy,
    orderValue: 1_000 + index,
    isFeatured: unitRandom(seed + 23) > 0.88,
    isEditorsChoice: unitRandom(seed + 24) > 0.92,
    isBestValue: unitRandom(seed + 25) > 0.9,
    latitude,
    longitude,
    categoryIds,
    amenityIds,
    featureIds,
    translations: {
      en: { slug: slugBase, ...en },
      de: { slug: slugBase, ...de },
      ru: { slug: slugBase, ...ru },
    },
  };
}

type CalendarRow = typeof villaCalendar.$inferInsert;

function buildOpenCalendarRows(
  villaId: number,
  from: DateString,
  priceCents: number,
  days: number,
): CalendarRow[] {
  const rows: CalendarRow[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    rows.push({
      villaId,
      date: addDays(from, offset),
      priceCents,
      minStay: null,
      isBlocked: false,
      blockSource: null,
      bookingId: null,
      note: null,
      updatedAt: new Date(),
    });
  }
  return rows;
}

async function insertInChunks<T>(
  rows: T[],
  chunkSize: number,
  insertBatch: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await insertBatch(rows.slice(i, i + chunkSize));
  }
}

async function loadCatalog() {
  const locationRows = await dbPool
    .select({
      id: locations.id,
      slug: locationTranslations.slug,
      name: locationTranslations.name,
      latitude: locations.latitude,
      longitude: locations.longitude,
    })
    .from(locations)
    .innerJoin(
      locationTranslations,
      and(
        eq(locationTranslations.locationId, locations.id),
        eq(locationTranslations.locale, "en"),
      ),
    );

  if (locationRows.length === 0) {
    throw new Error(
      "No locations in the database. Run `npm run db:seed` before seeding mock villas.",
    );
  }

  const categoryRows = await dbPool
    .select({
      id: categories.id,
      slug: categoryTranslations.slug,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, "en"),
      ),
    );

  if (categoryRows.length === 0) {
    throw new Error(
      "No categories in the database. Run `npm run db:seed` before seeding mock villas.",
    );
  }

  const amenityRows = await dbPool
    .select({ id: amenities.id, key: amenities.key })
    .from(amenities);

  const featureRows = await dbPool
    .select({ id: features.id, key: features.key })
    .from(features);

  if (amenityRows.length === 0 || featureRows.length === 0) {
    throw new Error(
      "Amenities or features missing. Run `npm run db:seed` before seeding mock villas.",
    );
  }

  return {
    locations: locationRows as CatalogLocation[],
    categories: categoryRows as CatalogCategory[],
    amenitiesList: amenityRows as CatalogAmenity[],
    featuresList: featureRows as CatalogFeature[],
  };
}

const DEFAULT_CANCELLATION: LocalizedText = {
  en: "Standard terms apply. Contact us for the current cancellation policy.",
  de: "Es gelten die Standardbedingungen. Kontaktieren Sie uns für die aktuelle Stornierungsregelung.",
  ru: "Действуют стандартные условия. Свяжитесь с нами для актуальных правил отмены.",
};

export type SeedMockVillasResult = {
  today: DateString;
  villaCount: number;
  calendarRowCount: number;
  villaIds: number[];
};

/**
 * Upserts {@link MOCK_VILLA_COUNT} villas keyed by `MOCK-###` ref codes.
 */
export async function seedMockVillas(): Promise<SeedMockVillasResult> {
  const today = getBusinessToday();
  const catalog = await loadCatalog();

  const specs = Array.from({ length: MOCK_VILLA_COUNT }, (_, i) =>
    buildMockVillaSpec(
      i + 1,
      catalog.locations,
      catalog.categories,
      catalog.amenitiesList,
      catalog.featuresList,
    ),
  );

  const villaIds: number[] = [];
  let calendarRowCount = 0;

  for (const spec of specs) {
    const [villaRow] = await dbPool
      .insert(villas)
      .values({
        locationId: spec.location.id,
        refCode: spec.refCode,
        slug: spec.slug,
        capacity: spec.capacity,
        bedrooms: spec.bedrooms,
        bathrooms: spec.bathrooms,
        defaultMinStay: spec.defaultMinStay,
        defaultNightlyPriceCents: spec.defaultNightlyPriceCents,
        cleaningFeeCents: spec.cleaningFeeCents,
        depositCents: spec.depositCents,
        latitude: spec.latitude,
        longitude: spec.longitude,
        isActive: true,
        isFeatured: spec.isFeatured,
        isEditorsChoice: spec.isEditorsChoice,
        isBestValue: spec.isBestValue,
        orderValue: spec.orderValue,
        guestPolicy: spec.guestPolicy,
        editorRating: null,
        cancellationPolicyI18n: DEFAULT_CANCELLATION,
        allowsPets: spec.allowsPets,
        allowsSmoking: spec.allowsSmoking,
        allowsParties: spec.allowsParties,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: villas.refCode,
        set: {
          locationId: spec.location.id,
          slug: spec.slug,
          capacity: spec.capacity,
          bedrooms: spec.bedrooms,
          bathrooms: spec.bathrooms,
          defaultMinStay: spec.defaultMinStay,
          defaultNightlyPriceCents: spec.defaultNightlyPriceCents,
          cleaningFeeCents: spec.cleaningFeeCents,
          depositCents: spec.depositCents,
          latitude: spec.latitude,
          longitude: spec.longitude,
          isActive: true,
          isFeatured: spec.isFeatured,
          isEditorsChoice: spec.isEditorsChoice,
          isBestValue: spec.isBestValue,
          orderValue: spec.orderValue,
          guestPolicy: spec.guestPolicy,
          editorRating: null,
          cancellationPolicyI18n: DEFAULT_CANCELLATION,
          allowsPets: spec.allowsPets,
          allowsSmoking: spec.allowsSmoking,
          allowsParties: spec.allowsParties,
          updatedAt: new Date(),
        },
      })
      .returning({ id: villas.id });

    const villaId = villaRow.id;
    villaIds.push(villaId);

    for (const [locale, translation] of Object.entries(spec.translations)) {
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

    await dbPool.delete(villaImages).where(eq(villaImages.villaId, villaId));

    await dbPool
      .delete(villaCategories)
      .where(eq(villaCategories.villaId, villaId));
    if (spec.categoryIds.length > 0) {
      await dbPool.insert(villaCategories).values(
        spec.categoryIds.map((categoryId) => ({ villaId, categoryId })),
      );
    }

    await dbPool
      .delete(villaAmenities)
      .where(eq(villaAmenities.villaId, villaId));
    if (spec.amenityIds.length > 0) {
      await dbPool.insert(villaAmenities).values(
        spec.amenityIds.map((amenityId, index) => ({
          villaId,
          amenityId,
          isHighlighted: index < 2,
        })),
      );
    }

    await dbPool
      .delete(villaFeatures)
      .where(eq(villaFeatures.villaId, villaId));
    if (spec.featureIds.length > 0) {
      await dbPool.insert(villaFeatures).values(
        spec.featureIds.map((featureId, index) => ({
          villaId,
          featureId,
          isHighlighted: index === 0,
        })),
      );
    }

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

    const calendarRows = buildOpenCalendarRows(
      villaId,
      today,
      spec.defaultNightlyPriceCents,
      MOCK_CALENDAR_DAYS,
    );
    await insertInChunks(calendarRows, 60, (batch) =>
      dbPool.insert(villaCalendar).values(batch).onConflictDoNothing(),
    );
    calendarRowCount += calendarRows.length;
  }

  await rebuildVillaPriceCache(villaIds, { today, skipRevalidate: true });
  await rebuildVillaSearchDocuments();

  return {
    today,
    villaCount: specs.length,
    calendarRowCount,
    villaIds,
  };
}