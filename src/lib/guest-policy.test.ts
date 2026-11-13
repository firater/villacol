import { describe, expect, it } from "vitest";

import { validateGuestPolicy, type GuestPolicyInput } from "@/lib/guest-policy";

function check(overrides: Partial<GuestPolicyInput> = {}) {
  return validateGuestPolicy({
    policy: "everyone",
    guestCount: 2,
    partyType: null,
    ...overrides,
  });
}

describe("validateGuestPolicy", () => {
  it("accepts anyone on the default policy", () => {
    expect(check({ policy: "everyone", guestCount: 12, partyType: "friends" }))
      .toEqual({ valid: true, violation: null });
  });

  describe("couples_only", () => {
    it("accepts two undeclared guests", () => {
      expect(check({ policy: "couples_only", guestCount: 2 }).valid).toBe(true);
    });

    it("accepts a declared couple", () => {
      expect(
        check({ policy: "couples_only", guestCount: 2, partyType: "couple" })
          .valid,
      ).toBe(true);
    });

    it("rejects a third guest", () => {
      const result = check({ policy: "couples_only", guestCount: 3 });
      expect(result.valid).toBe(false);
      expect(result.violation?.code).toBe("couples_only_too_many_guests");
    });

    it("rejects a family of two", () => {
      const result = check({
        policy: "couples_only",
        guestCount: 2,
        partyType: "family",
      });
      expect(result.violation?.code).toBe("couples_only_party_mismatch");
    });
  });

  describe("families_only", () => {
    it("accepts any party size without child metadata", () => {
      expect(
        check({ policy: "families_only", guestCount: 4, partyType: "friends" })
          .valid,
      ).toBe(true);
      expect(
        check({
          policy: "families_only",
          guestCount: 3,
          extraGuests: [{ name: "Unknown" }],
        }).valid,
      ).toBe(true);
    });
  });

  describe("no_friend_groups", () => {
    it("rejects a declared friend group", () => {
      const result = check({
        policy: "no_friend_groups",
        guestCount: 6,
        partyType: "friends",
      });
      expect(result.violation?.code).toBe("friend_groups_not_allowed");
    });

    it("accepts every other party type, declared or not", () => {
      for (const partyType of ["couple", "family", "solo", "other", null] as const) {
        expect(
          check({ policy: "no_friend_groups", guestCount: 6, partyType }).valid,
        ).toBe(true);
      }
    });
  });
});
