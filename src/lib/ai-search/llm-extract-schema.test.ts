import { describe, expect, it } from "vitest";

import { parseLlmJsonObject } from "./llm-extract-schema";

describe("parseLlmJsonObject", () => {
  it("parses JSON inside markdown fences", () => {
    const raw = '```json\n{"location":"kalkan","guests":4}\n```';
    expect(parseLlmJsonObject(raw)).toEqual({
      location: "kalkan",
      guests: 4,
    });
  });

  it("extracts a JSON object from surrounding prose", () => {
    const raw = 'Here you go:\n{"category":"honeymoon"}\nThanks!';
    expect(parseLlmJsonObject(raw)).toEqual({ category: "honeymoon" });
  });
});