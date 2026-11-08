import { relations } from "drizzle-orm";

import { account, session, user } from "./tables/auth";
import {
  bookingPromotions,
  bookings,
  exitIntentCodes,
} from "./tables/bookings";
import { similarVillas, villaPriceCache } from "./tables/caches";
import {
  bookingAccessSessions,
  bookingOtpChallenges,
} from "./tables/guest-access";
import { villaCalendar } from "./tables/calendar";
import { dealReads, deals } from "./tables/engagement";
import { promotions, villaPromotions } from "./tables/promotions";
import { villaSearchDocuments } from "./tables/search";
import {
  amenities,
  categories,
  categoryTranslations,
  features,
  locationTranslations,
  locations,
  villaRules,
} from "./tables/taxonomy";
import {
  villaAmenities,
  villaCategories,
  villaFeatures,
  villaImages,
  villaRuleLinks,
  villaTranslations,
  villas,
} from "./tables/villas";

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  bookings: many(bookings),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Taxonomy                                                                   */
/* -------------------------------------------------------------------------- */

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "location_hierarchy",
  }),
  children: many(locations, { relationName: "location_hierarchy" }),
  translations: many(locationTranslations),
  villas: many(villas),
}));

export const locationTranslationsRelations = relations(
  locationTranslations,
  ({ one }) => ({
    location: one(locations, {
      fields: [locationTranslations.locationId],
      references: [locations.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
  villas: many(villaCategories),
}));

export const categoryTranslationsRelations = relations(
  categoryTranslations,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryTranslations.categoryId],
      references: [categories.id],
    }),
  }),
);

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  villas: many(villaAmenities),
}));

export const featuresRelations = relations(features, ({ many }) => ({
  villas: many(villaFeatures),
}));

export const villaRulesRelations = relations(villaRules, ({ many }) => ({
  villas: many(villaRuleLinks),
}));

/* -------------------------------------------------------------------------- */
/* Villas                                                                     */
/* -------------------------------------------------------------------------- */

export const villasRelations = relations(villas, ({ one, many }) => ({
  location: one(locations, {
    fields: [villas.locationId],
    references: [locations.id],
  }),
  translations: many(villaTranslations),
  images: many(villaImages),
  amenities: many(villaAmenities),
  features: many(villaFeatures),
  categories: many(villaCategories),
  rules: many(villaRuleLinks),
  calendar: many(villaCalendar),
  promotions: many(villaPromotions),
  priceCache: many(villaPriceCache),
  searchDocuments: many(villaSearchDocuments),
  bookings: many(bookings),
  // Villas this one is an alternative *for*, and the alternatives *of* it.
  similarTo: many(similarVillas, { relationName: "similar_source" }),
  similarFrom: many(similarVillas, { relationName: "similar_target" }),
}));

export const villaTranslationsRelations = relations(
  villaTranslations,
  ({ one }) => ({
    villa: one(villas, {
      fields: [villaTranslations.villaId],
      references: [villas.id],
    }),
  }),
);

export const villaImagesRelations = relations(villaImages, ({ one }) => ({
  villa: one(villas, {
    fields: [villaImages.villaId],
    references: [villas.id],
  }),
}));

export const villaAmenitiesRelations = relations(villaAmenities, ({ one }) => ({
  villa: one(villas, {
    fields: [villaAmenities.villaId],
    references: [villas.id],
  }),
  amenity: one(amenities, {
    fields: [villaAmenities.amenityId],
    references: [amenities.id],
  }),
}));

export const villaFeaturesRelations = relations(villaFeatures, ({ one }) => ({
  villa: one(villas, {
    fields: [villaFeatures.villaId],
    references: [villas.id],
  }),
  feature: one(features, {
    fields: [villaFeatures.featureId],
    references: [features.id],
  }),
}));

export const villaCategoriesRelations = relations(
  villaCategories,
  ({ one }) => ({
    villa: one(villas, {
      fields: [villaCategories.villaId],
      references: [villas.id],
    }),
    category: one(categories, {
      fields: [villaCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const villaRuleLinksRelations = relations(villaRuleLinks, ({ one }) => ({
  villa: one(villas, {
    fields: [villaRuleLinks.villaId],
    references: [villas.id],
  }),
  rule: one(villaRules, {
    fields: [villaRuleLinks.ruleId],
    references: [villaRules.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Calendar                                                                   */
/* -------------------------------------------------------------------------- */

export const villaCalendarRelations = relations(villaCalendar, ({ one }) => ({
  villa: one(villas, {
    fields: [villaCalendar.villaId],
    references: [villas.id],
  }),
  booking: one(bookings, {
    fields: [villaCalendar.bookingId],
    references: [bookings.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Promotions                                                                 */
/* -------------------------------------------------------------------------- */

export const promotionsRelations = relations(promotions, ({ many }) => ({
  villas: many(villaPromotions),
  bookings: many(bookingPromotions),
  exitIntentCodes: many(exitIntentCodes),
}));

export const villaPromotionsRelations = relations(
  villaPromotions,
  ({ one }) => ({
    villa: one(villas, {
      fields: [villaPromotions.villaId],
      references: [villas.id],
    }),
    promotion: one(promotions, {
      fields: [villaPromotions.promotionId],
      references: [promotions.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  villa: one(villas, {
    fields: [bookings.villaId],
    references: [villas.id],
  }),
  user: one(user, { fields: [bookings.userId], references: [user.id] }),
  promotions: many(bookingPromotions),
  blockedNights: many(villaCalendar),
  otpChallenges: many(bookingOtpChallenges),
  accessSessions: many(bookingAccessSessions),
}));

export const bookingOtpChallengesRelations = relations(
  bookingOtpChallenges,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingOtpChallenges.bookingId],
      references: [bookings.id],
    }),
  }),
);

export const bookingAccessSessionsRelations = relations(
  bookingAccessSessions,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingAccessSessions.bookingId],
      references: [bookings.id],
    }),
  }),
);

export const bookingPromotionsRelations = relations(
  bookingPromotions,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingPromotions.bookingId],
      references: [bookings.id],
    }),
    promotion: one(promotions, {
      fields: [bookingPromotions.promotionId],
      references: [promotions.id],
    }),
  }),
);

export const exitIntentCodesRelations = relations(
  exitIntentCodes,
  ({ one }) => ({
    promotion: one(promotions, {
      fields: [exitIntentCodes.promotionId],
      references: [promotions.id],
    }),
    booking: one(bookings, {
      fields: [exitIntentCodes.bookingId],
      references: [bookings.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Caches                                                                     */
/* -------------------------------------------------------------------------- */

export const villaPriceCacheRelations = relations(
  villaPriceCache,
  ({ one }) => ({
    villa: one(villas, {
      fields: [villaPriceCache.villaId],
      references: [villas.id],
    }),
  }),
);

export const similarVillasRelations = relations(similarVillas, ({ one }) => ({
  villa: one(villas, {
    fields: [similarVillas.villaId],
    references: [villas.id],
    relationName: "similar_source",
  }),
  similarVilla: one(villas, {
    fields: [similarVillas.similarVillaId],
    references: [villas.id],
    relationName: "similar_target",
  }),
}));

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export const villaSearchDocumentsRelations = relations(
  villaSearchDocuments,
  ({ one }) => ({
    villa: one(villas, {
      fields: [villaSearchDocuments.villaId],
      references: [villas.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/* Engagement                                                                 */
/* -------------------------------------------------------------------------- */

export const dealsRelations = relations(deals, ({ many }) => ({
  reads: many(dealReads),
}));

export const dealReadsRelations = relations(dealReads, ({ one }) => ({
  deal: one(deals, { fields: [dealReads.dealId], references: [deals.id] }),
}));