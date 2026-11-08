/**
 * Schema barrel. This is the path `drizzle.config.ts` points at and the object
 * both DB clients are constructed with, so anything not re-exported here is
 * invisible to migrations and to the relational query API.
 *
 * Table definitions live in `./tables/*` and relations in `./relations`.
 */

export * from "./tables/enums";
export * from "./tables/auth";
export * from "./tables/taxonomy";
export * from "./tables/villas";
export * from "./tables/promotions";
export * from "./tables/bookings";
export * from "./tables/guest-access";
export * from "./tables/calendar";
export * from "./tables/caches";
export * from "./tables/search";
export * from "./tables/engagement";
export * from "./tables/system";
export * from "./relations";
