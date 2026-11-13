import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CRON_SECRET: z.string().min(16),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  FX_API_URL: z.string().url().default("https://api.frankfurter.app/latest"),
  FX_API_KEY: z.string().optional(),
  /**
   * Optional so a local checkout boots and builds without mail credentials.
   * `sendEmail` throws a named error when it is missing rather than silently
   * dropping a one-time code.
   */
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().default("Villa Bookings <bookings@example.com>"),
  /** Stripe test keys — optional until checkout / webhooks are enabled. */
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env: Env = parsed.data;
