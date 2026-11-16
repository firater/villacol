import { z } from "zod";

export const llmFilterExtractSchema = z.object({
  location: z.union([z.string(), z.null()]).optional(),
  category: z.union([z.string(), z.null()]).optional(),
  amenities: z.union([z.array(z.string()), z.null()]).optional(),
  guests: z.union([z.number(), z.null()]).optional(),
  bedrooms: z.union([z.number(), z.null()]).optional(),
  bathrooms: z.union([z.number(), z.null()]).optional(),
});

export type LlmFilterExtract = z.infer<typeof llmFilterExtractSchema>;

/** Strips markdown fences and isolates the first JSON object when models add prose. */
export function parseLlmJsonObject(raw: string): unknown {
  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced !== null) {
    text = fenced[1].trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  }

  if (!text.startsWith("{")) {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch !== null) {
      text = objectMatch[0];
    }
  }

  return JSON.parse(text) as unknown;
}