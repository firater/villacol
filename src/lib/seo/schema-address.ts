/** Shared PostalAddress fields for JSON-LD (Kalkan / Antalya region). */
export const KALKAN_POSTAL_ADDRESS = {
  streetAddress: "Kalkan Mah.",
  postalCode: "07580",
  addressRegion: "Antalya",
  addressCountry: "TR",
} as const;

export function buildKalkanPostalAddress(
  addressLocality: string,
): Record<string, unknown> {
  return {
    "@type": "PostalAddress",
    ...KALKAN_POSTAL_ADDRESS,
    addressLocality,
  };
}
