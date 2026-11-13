import { describe, expect, it } from "vitest";

import { formatAppliedPromotionLabel } from "@/lib/applied-promotion-display";

const labels = {
  commissionWaiver: (percent: string) => `No Commission (${percent}% off)`,
};

describe("formatAppliedPromotionLabel", () => {
  it("appends percent to percentage promos without a % in the name", () => {
    expect(
      formatAppliedPromotionLabel(
        {
          displayName: "Last-minute saving",
          discountType: "percentage",
          percentBp: 1_500,
        },
        labels,
      ),
    ).toBe("Last-minute saving (15%)");
  });

  it("leaves fixed-amount promos unchanged", () => {
    expect(
      formatAppliedPromotionLabel(
        {
          displayName: "€50 off your stay",
          discountType: "fixed_amount",
          percentBp: null,
        },
        labels,
      ),
    ).toBe("€50 off your stay");
  });

  it("relabels commission waivers instead of direct-booking copy", () => {
    expect(
      formatAppliedPromotionLabel(
        {
          displayName: "Direct booking saving",
          discountType: "commission_waiver",
          percentBp: null,
        },
        labels,
      ),
    ).toBe("No Commission (20% off)");
  });
});
