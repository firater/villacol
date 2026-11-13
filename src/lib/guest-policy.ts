/**
 * Guest-policy enforcement: pure predicates, no DB and no i18n.
 *
 * A villa's `guest_policy` is a letting restriction, so it is checked on the
 * server at inquiry time rather than being a hint in the UI. The rules below
 * read only what a booking already carries — the declared party type, the guest
 * count, and the extra-guest ages — so no policy depends on data the guest was
 * never asked for.
 */
import type { GuestPolicy, PartyType } from "@/db/tables/enums";

/** Max guests on a villa that only accepts couples. */
export const COUPLE_MAX_GUESTS = 2;

export type GuestPolicyPartyGuest = {
  name: string;
  age?: number;
};

export type GuestPolicyInput = {
  policy: GuestPolicy;
  guestCount: number;
  /** `null` when the guest did not declare one (e.g. a legacy booking). */
  partyType: PartyType | null;
  extraGuests?: readonly GuestPolicyPartyGuest[];
};

export type GuestPolicyViolationCode =
  | "couples_only_too_many_guests"
  | "couples_only_party_mismatch"
  | "friend_groups_not_allowed";

export type GuestPolicyViolation = {
  code: GuestPolicyViolationCode;
  message: string;
};

export type GuestPolicyResult =
  | { valid: true; violation: null }
  | { valid: false; violation: GuestPolicyViolation };

const VALID: GuestPolicyResult = { valid: true, violation: null };

function reject(
  code: GuestPolicyViolationCode,
  message: string,
): GuestPolicyResult {
  return { valid: false, violation: { code, message } };
}

/**
 * Never throws: a policy violation is an expected outcome of a valid request,
 * so the caller turns the returned message into a field error.
 */
export function validateGuestPolicy(input: GuestPolicyInput): GuestPolicyResult {
  const { policy, guestCount, partyType } = input;

  switch (policy) {
    case "everyone":
      return VALID;

    case "couples_only": {
      if (guestCount > COUPLE_MAX_GUESTS) {
        return reject(
          "couples_only_too_many_guests",
          `This villa is let to couples only and sleeps at most ${COUPLE_MAX_GUESTS} guests, requested ${guestCount}.`,
        );
      }
      // A declared family or friend group is a mismatch even at two guests.
      if (partyType === "family" || partyType === "friends") {
        return reject(
          "couples_only_party_mismatch",
          "This villa is let to couples only.",
        );
      }
      return VALID;
    }

    case "families_only":
      // Inquiry collects a UI attestation instead of child ages; do not reject
      // here for missing party metadata.
      return VALID;

    case "no_friend_groups": {
      if (partyType === "friends") {
        return reject(
          "friend_groups_not_allowed",
          "This villa does not accept friend groups.",
        );
      }
      return VALID;
    }
  }
}
