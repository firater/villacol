/**
 * `next/cache` stand-in for the integration suite.
 *
 * The modules under test reach for Next's cache primitives — `rebuildVillaPriceCache`
 * ends with `revalidateTag`, `loadVillaPricingContext` opens with `cacheLife` —
 * and those only work inside a Next request or build. Aliasing them to no-ops
 * lets the real database code run under plain Node without the production
 * modules growing a test-only branch.
 *
 * Making them no-ops is also what we want semantically: the drift check needs
 * `loadVillaPricingContext` to hit Postgres on every call, not serve the first
 * villa's answer back for the next one.
 */
export function cacheTag(..._tags: string[]): void {}

export function cacheLife(..._profile: unknown[]): void {}

export function revalidateTag(..._args: unknown[]): void {}

export function updateTag(..._args: unknown[]): void {}

export function revalidatePath(..._args: unknown[]): void {}

export function unstable_noStore(): void {}
