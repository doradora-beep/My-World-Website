import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const rootDir = process.cwd();

export const config = {
  rootDir,
  clientDistDir: path.join(rootDir, "dist"),
  uploadDir: path.join(rootDir, "storage", "uploads"),
  referenceDir: path.join(rootDir, "reference"),
  databaseUrl: process.env.DATABASE_URL ?? "file:/tmp/the-explorer-dev.db",
  cookieSecret: process.env.COOKIE_SECRET ?? "the-explorer-dev-cookie-secret",
  ownerPinHash: process.env.OWNER_PIN_HASH ?? "",
  ownerPinFallback: process.env.OWNER_PIN ?? "2468",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
  appPort: Number(process.env.PORT ?? 3001)
};
