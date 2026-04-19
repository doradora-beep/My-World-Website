import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { config } from "./config.js";

export function normalizePublicAssetPath(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/uploads/")) {
    return value;
  }

  return value;
}

export async function ensureDirectories() {
  await fs.mkdir(config.uploadDir, { recursive: true });
}

export async function verifyOwnerPin(pin: string) {
  if (config.ownerPinHash) {
    return bcrypt.compare(pin, config.ownerPinHash);
  }

  return pin === config.ownerPinFallback;
}

export function buildUploadFilename(filename: string) {
  const ext = path.extname(filename) || ".bin";
  return `${Date.now()}-${crypto.randomUUID()}${ext}`;
}
