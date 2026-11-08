"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { dbPool } from "@/db/pool";
import { contactMessages } from "@/db/schema";
import {
  invalid,
  ok,
  toActionError,
  type ActionResult,
} from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guard";
import { idSchema } from "@/lib/validation";

/**
 * No cache tags here: the inbox is an admin-only, uncached read. Tagging it
 * would invalidate nothing, and calling `updateTag` for a tag no query claims
 * is the kind of dead code that later reads as a bug.
 */

const markContactReadSchema = z.object({ messageId: idSchema });

const archiveContactMessageSchema = z.object({ messageId: idSchema });

const addContactNoteSchema = z.object({
  messageId: idSchema,
  adminNote: z.string().trim().min(1).max(5_000),
});

export async function markContactRead(
  input: z.input<typeof markContactReadSchema>,
): Promise<ActionResult<{ messageId: number; readAt: string }>> {
  try {
    await requireAdmin();

    const parsed = markContactReadSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const readAt = new Date();

    const [updated] = await dbPool
      .update(contactMessages)
      .set({ status: "read", readAt })
      .where(eq(contactMessages.id, parsed.data.messageId))
      .returning({ id: contactMessages.id });

    if (updated === undefined) {
      return { ok: false, error: "That message does not exist." };
    }

    return ok({ messageId: updated.id, readAt: readAt.toISOString() });
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveContactMessage(
  input: z.input<typeof archiveContactMessageSchema>,
): Promise<ActionResult<{ messageId: number }>> {
  try {
    await requireAdmin();

    const parsed = archiveContactMessageSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [updated] = await dbPool
      .update(contactMessages)
      .set({ status: "archived" })
      .where(eq(contactMessages.id, parsed.data.messageId))
      .returning({ id: contactMessages.id });

    if (updated === undefined) {
      return { ok: false, error: "That message does not exist." };
    }

    return ok({ messageId: updated.id });
  } catch (error) {
    return toActionError(error);
  }
}

export async function addContactNote(
  input: z.input<typeof addContactNoteSchema>,
): Promise<ActionResult<{ messageId: number }>> {
  try {
    await requireAdmin();

    const parsed = addContactNoteSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const [updated] = await dbPool
      .update(contactMessages)
      .set({ adminNote: parsed.data.adminNote })
      .where(eq(contactMessages.id, parsed.data.messageId))
      .returning({ id: contactMessages.id });

    if (updated === undefined) {
      return { ok: false, error: "That message does not exist." };
    }

    return ok({ messageId: updated.id });
  } catch (error) {
    return toActionError(error);
  }
}
