/**
 * Transactional email through Resend.
 *
 * The client is created lazily. Constructing it at module scope would make
 * every module that transitively imports this one fail to load without mail
 * credentials, including the cron route and the pricing path, neither of which
 * sends anything.
 */
import { Resend } from "resend";

import { env } from "@/env";

/** Resend onboarding sender until a custom domain is verified. */
export const RESEND_ONBOARDING_FROM =
  "Villa Collection <onboarding@resend.dev>";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "RESEND_API_KEY is not set, so transactional email cannot be sent. Set it in .env.local.",
    );
    this.name = "EmailNotConfiguredError";
  }
}

let client: Resend | null = null;

function getClient(): Resend {
  const apiKey = env.RESEND_API_KEY;
  if (apiKey === undefined) throw new EmailNotConfiguredError();
  client ??= new Resend(apiKey);
  return client;
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  if (env.RESEND_API_KEY === undefined) {
    console.log("[email mock]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { id: "mock-dev" };
  }

  const resend = getClient();

  const { data, error } = await resend.emails.send({
    from: RESEND_ONBOARDING_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });

  if (error !== null) {
    throw new Error(`Resend rejected the message: ${error.message}`);
  }

  if (data === null) {
    throw new Error("Resend returned no message id");
  }

  return { id: data.id };
}
