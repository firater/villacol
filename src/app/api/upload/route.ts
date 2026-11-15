import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth-guard";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await getCurrentUser();
  if (
    auth === null ||
    (auth.user.role !== "admin" && auth.user.role !== "editor")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (env.BLOB_READ_WRITE_TOKEN === undefined) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const villaIdRaw = formData.get("villaId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const villaPart =
    typeof villaIdRaw === "string" && villaIdRaw.length > 0
      ? `villa-${villaIdRaw}`
      : "villa-misc";

  const pathname = `villas/${villaPart}/${nanoid()}-${sanitizeFilename(file.name)}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}