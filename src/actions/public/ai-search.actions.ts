"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { getVillaFilterFacets } from "@/db/queries/filter-facets.queries";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { buildAiSearchSystemPrompt } from "@/lib/ai-search/build-prompt";
import {
  llmFilterExtractSchema,
  parseLlmJsonObject,
} from "@/lib/ai-search/llm-extract-schema";
import {
  hasStructuredFilters,
  validateLlmFilters,
} from "@/lib/ai-search/validate-llm-filters";
import {
  LlmConfigurationError,
  LlmRequestError,
} from "@/lib/llm/chat-completion";
import type { Locale } from "@/lib/locales";
import {
  buildVillaFilterQuery,
  LISTING_SEARCH_QUERY_KEY,
  normalizeVillaFilters,
  type VillaFilters,
} from "@/lib/search-params";
import { localeSchema } from "@/lib/validation";

const translateSchema = z.object({
  query: z.string().trim().min(1).max(200),
  locale: localeSchema,
});

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

/** Current Haiku model for filter extraction (pinned id). */
const AI_SEARCH_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

async function requestAiSearchCompletion(
  system: string,
  userQuery: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new LlmConfigurationError(
      "Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI search.",
    );
  }

  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  const requestBody: Anthropic.MessageCreateParams = {
    model: AI_SEARCH_ANTHROPIC_MODEL,
    max_tokens: 280,
    system,
    messages: [{ role: "user", content: userQuery }],
  };

  const requestHeaders: Record<string, string> = {
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
    "x-api-key": "[redacted]",
  };
  if (workspaceId !== undefined && workspaceId.length > 0) {
    requestHeaders["anthropic-workspace-id"] = workspaceId;
  }

  console.log("[ai-search] anthropic HTTP request", {
    url: ANTHROPIC_MESSAGES_URL,
    headers: requestHeaders,
    body: requestBody,
  });

  const client = new Anthropic({
    apiKey,
    baseURL: "https://api.anthropic.com",
    defaultHeaders:
      workspaceId !== undefined && workspaceId.length > 0
        ? { "anthropic-workspace-id": workspaceId }
        : undefined,
  });

  try {
    const response = await client.messages.create(requestBody);

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (text.length === 0) {
      throw new LlmRequestError("Anthropic returned an empty completion.");
    }

    return text;
  } catch (error) {
    if (
      error instanceof LlmRequestError ||
      error instanceof LlmConfigurationError
    ) {
      throw error;
    }
    if (error instanceof Anthropic.APIError) {
      throw new LlmRequestError(
        `Anthropic request failed: ${error.status} ${error.message}`,
        error.status,
      );
    }
    throw error;
  }
}

export type AiSearchNavigateResult =
  | {
      mode: "filters";
      query: Record<string, string>;
    }
  | {
      mode: "fallback";
      query: Record<string, string>;
    };

function filtersToQueryRecord(filters: VillaFilters): Record<string, string> {
  const params = buildVillaFilterQuery(normalizeVillaFilters(filters));
  return Object.fromEntries(params.entries());
}

function fallbackQueryRecord(query: string): Record<string, string> {
  return { [LISTING_SEARCH_QUERY_KEY]: query };
}

export async function translateAiSearchQuery(
  input: z.input<typeof translateSchema>,
): Promise<ActionResult<AiSearchNavigateResult>> {
  try {
    const parsed = translateSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const { query, locale } = parsed.data;
    const facets = await getVillaFilterFacets(locale as Locale);

    try {
      const system = buildAiSearchSystemPrompt(facets, locale as Locale);
      const completion = await requestAiSearchCompletion(system, query);

      console.log("[ai-search] raw LLM completion:", completion);

      const json = parseLlmJsonObject(completion);
      console.log("[ai-search] parsed JSON object:", json);

      const extracted = llmFilterExtractSchema.safeParse(json);
      if (!extracted.success) {
        console.log("[ai-search] zod rejection:", extracted.error.flatten());
        return ok({ mode: "fallback", query: fallbackQueryRecord(query) });
      }

      const filters = validateLlmFilters(extracted.data, facets);
      console.log("[ai-search] validated filters:", filters);
      console.log(
        "[ai-search] hasStructuredFilters:",
        hasStructuredFilters(filters),
      );

      if (!hasStructuredFilters(filters)) {
        console.log("[ai-search] fallback: no valid structured filters");
        return ok({ mode: "fallback", query: fallbackQueryRecord(query) });
      }

      const queryRecord = filtersToQueryRecord(filters);
      console.log("[ai-search] redirect filters query:", queryRecord);
      return ok({ mode: "filters", query: queryRecord });
    } catch (error) {
      if (error instanceof LlmConfigurationError) {
        console.log("[ai-search] fallback: LLM not configured", error.message);
        return ok({ mode: "fallback", query: fallbackQueryRecord(query) });
      }
      if (error instanceof LlmRequestError) {
        console.log("[ai-search] fallback: LLM request error", error.message);
        return ok({ mode: "fallback", query: fallbackQueryRecord(query) });
      }
      if (error instanceof SyntaxError) {
        console.log("[ai-search] fallback: JSON parse error", error.message);
        return ok({ mode: "fallback", query: fallbackQueryRecord(query) });
      }
      throw error;
    }
  } catch (error) {
    return toActionError(error);
  }
}