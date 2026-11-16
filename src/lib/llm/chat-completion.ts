/**
 * Minimal chat completion over HTTP (no SDK). Supports Anthropic first, then OpenAI.
 */

type ChatMessage = { role: "user" | "system"; content: string };

export type ChatCompletionOptions = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

export class LlmConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmConfigurationError";
  }
}

export class LlmRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LlmRequestError";
  }
}

export async function completeChat(
  options: ChatCompletionOptions,
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return completeWithAnthropic(anthropicKey, options);
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return completeWithOpenAi(openAiKey, options);
  }

  throw new LlmConfigurationError(
    "Set ANTHROPIC_API_KEY or OPENAI_API_KEY for AI search.",
  );
}

async function completeWithAnthropic(
  apiKey: string,
  options: ChatCompletionOptions,
): Promise<string> {
  const model =
    process.env.AI_SEARCH_MODEL?.trim() ?? "claude-3-5-haiku-20241022";

  const system = options.messages.find((message) => message.role === "system");
  const userMessages = options.messages.filter(
    (message) => message.role === "user",
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 300,
      temperature: options.temperature ?? 0,
      system: system?.content,
      messages: userMessages.map((message) => ({
        role: "user" as const,
        content: message.content,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new LlmRequestError(
      `Anthropic request failed: ${response.status} ${body.slice(0, 200)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };

  const text = payload.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new LlmRequestError("Anthropic returned an empty completion.");
  }

  return text;
}

async function completeWithOpenAi(
  apiKey: string,
  options: ChatCompletionOptions,
): Promise<string> {
  const model =
    process.env.AI_SEARCH_MODEL?.trim() ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 300,
      temperature: options.temperature ?? 0,
      messages: options.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new LlmRequestError(
      `OpenAI request failed: ${response.status} ${body.slice(0, 200)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new LlmRequestError("OpenAI returned an empty completion.");
  }

  return text;
}