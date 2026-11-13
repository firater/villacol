import type { GuestPolicy } from "@/db/tables/enums";

/** Villas that need an explicit family/couple attestation on the inquiry form. */
export function requiresGuestPolicyAttestation(policy: GuestPolicy): boolean {
  return policy === "couples_only" || policy === "families_only";
}
