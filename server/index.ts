import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import mime from "mime-types";
import { z } from "zod";
import OpenAI from "openai";
import { prisma } from "./prisma.js";
import { config } from "./config.js";
import { ensureDirectories, verifyOwnerPin, buildUploadFilename } from "./utils.js";
import { ensureSeedData } from "./seed.js";
import { DEFAULT_AVATAR_PROMPT, FALLBACK_AVATAR_SETS, normalizeAvatarPrompt } from "../shared/avatar-options.js";
import { LEVELS, LEVEL_THEMES } from "../shared/content.js";

const app = Fastify({
  logger: true
});

const avatarPromptSchema = z.object({
  hair: z.string().min(1),
  expression: z.string().min(1),
  style: z.string().min(1),
  palette: z.string().min(1),
  outfit: z.string(),
  notes: z.string().default("")
});

const avatarGenerateSchema = avatarPromptSchema.extend({
  previousCandidates: z.array(z.string()).optional()
});

const cardMediaSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1).max(3)]);

const profileUpdateSchema = z.object({
  name: z.string().min(1),
  bio: z.string().min(1),
  avatarImagePath: z.string().min(1).optional(),
  avatarPromptJson: avatarPromptSchema.optional()
});

const cardCreateSchema = z.object({
  levelId: z.string().min(1),
  themeKey: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  reflection: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  mediaPathOrUrl: cardMediaSchema
});

const cardUpdateSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  reflection: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  mediaPathOrUrl: cardMediaSchema
});

app.register(cookie, {
  secret: config.cookieSecret
});

app.register(multipart, {
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});
app.register(fastifyStatic, {
  root: config.uploadDir,
  prefix: "/uploads/"
});
app.register(fastifyStatic, {
  root: config.referenceDir,
  prefix: "/reference/",
  decorateReply: false
});

function bootstrapLevels() {
  return LEVELS.map((level) => ({
    ...level,
    themes: LEVEL_THEMES[level.id]
  }));
}

function serializeMedia(value: string | string[]) {
  return Array.isArray(value) ? JSON.stringify(value) : value;
}

function parseAvatarPromptJson(value: string) {
  try {
    return normalizeAvatarPrompt(avatarPromptSchema.parse(JSON.parse(value)));
  } catch {
    return DEFAULT_AVATAR_PROMPT;
  }
}

function isAllowedTheme(levelId: string, themeKey: string) {
  return LEVEL_THEMES[levelId]?.includes(themeKey) ?? false;
}

async function getAuthenticated(request: FastifyRequest) {
  const token = request.cookies.owner_session;

  if (!token) {
    return false;
  }

  const session = await prisma.ownerSession.findUnique({
    where: {
      token
    }
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    await prisma.ownerSession.delete({
      where: {
        token
      }
    });
    return false;
  }

  return true;
}

async function requireOwner(request: FastifyRequest, reply: FastifyReply) {
  const authenticated = await getAuthenticated(request);

  if (!authenticated) {
    reply.code(401).send({
      message: "Owner authentication required."
    });
    return false;
  }

  return true;
}

async function loadBootstrap(request: FastifyRequest) {
  const [profile, cards] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { id: "main" } }),
    prisma.storyCard.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  return {
    owner: {
      authenticated: await getAuthenticated(request)
    },
    profile: {
      name: profile.name,
      bio: profile.bio,
      avatarImagePath: profile.avatarImagePath,
      avatarPromptJson: parseAvatarPromptJson(profile.avatarPromptJson),
      updatedAt: profile.updatedAt.toISOString()
    },
    cards: cards.map((card) => ({
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString()
    })),
    levels: bootstrapLevels()
  };
}

function buildAvatarPrompt(prompt: z.infer<typeof avatarPromptSchema>) {
  return `Create three premium portrait variations for a personal story website.
Character details:
- hairstyle: ${prompt.hair}
- expression: ${prompt.expression}
- visual style: ${prompt.style}
- palette: ${prompt.palette}
- outfit: ${prompt.outfit}
- notes: ${prompt.notes}
Requirements:
- attractive believable human portrait, not abstract
- head-and-shoulders composition, centered for circular crop
- refined facial symmetry, natural skin texture, realistic hair detail
- cinematic lighting with a subtle sci-fi atmosphere
- premium wardrobe styling that matches the selected outfit
- no text, no collage, no helmets unless explicitly requested, no distortion, no extra limbs
- return three distinct but cohesive candidates`;
}

function reorderCandidateSet(items: readonly string[], order: number[]) {
  return order.map((index) => items[index]).filter(Boolean);
}

function shuffleCandidates<T>(items: readonly T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function selectFallbackAvatarCandidates(prompt: z.infer<typeof avatarPromptSchema>, previousCandidates: string[] = []) {
  const normalized = normalizeAvatarPrompt(prompt);
  const primarySet =
    normalized.style === "游戏角色写实" || normalized.hair === "披散长发" || normalized.hair === "清爽束发"
      ? FALLBACK_AVATAR_SETS.character
      : FALLBACK_AVATAR_SETS.cinematic;
  const secondarySet = primarySet === FALLBACK_AVATAR_SETS.character ? FALLBACK_AVATAR_SETS.cinematic : FALLBACK_AVATAR_SETS.character;

  const orderByExpression: Record<string, number[]> = {
    冷静注视: [1, 2, 0],
    温柔微笑: [0, 1, 2],
    坚定沉着: [2, 1, 0],
    若有所思: [1, 0, 2],
    自信挑眉: [2, 0, 1]
  };

  const orderedPrimary = reorderCandidateSet(primarySet, orderByExpression[normalized.expression] ?? [0, 1, 2]);
  const uniqueCandidates = [...new Set([...orderedPrimary, ...secondarySet])];
  const regeneratedCandidates = uniqueCandidates.filter((candidate) => !previousCandidates.includes(candidate));

  if (regeneratedCandidates.length >= 3) {
    return shuffleCandidates(regeneratedCandidates).slice(0, 3);
  }

  const featured = orderedPrimary[0];
  const sideCandidates = shuffleCandidates([...orderedPrimary.slice(1), ...secondarySet]).slice(0, 2);

  return [sideCandidates[0], featured, sideCandidates[1]].filter(Boolean);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const integer = Number.parseInt(normalized, 16);

  return {
    r: (integer >> 16) & 255,
    g: (integer >> 8) & 255,
    b: integer & 255
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));

  return `#${[clamp(r + amount), clamp(g + amount), clamp(b + amount)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function avatarPaletteTokens(palette: string, variantIndex: number) {
  const palettes: Record<
    string,
    {
      glow: string;
      accent: string;
      accentSecondary: string;
      hair: string;
      outfit: string;
      skin: string;
      background: string;
    }
  > = {
    lavender: {
      glow: "#e08efe",
      accent: "#d180ef",
      accentSecondary: "#81ecff",
      hair: "#d8d0e9",
      outfit: "#313449",
      skin: "#d9c9b5",
      background: "#18131f"
    },
    cyan: {
      glow: "#81ecff",
      accent: "#5ed7ea",
      accentSecondary: "#e08efe",
      hair: "#c6eff6",
      outfit: "#223848",
      skin: "#d9cbbf",
      background: "#111820"
    },
    sage: {
      glow: "#b6ccb8",
      accent: "#93b19a",
      accentSecondary: "#e08efe",
      hair: "#dfe7d8",
      outfit: "#304437",
      skin: "#d5cab8",
      background: "#151916"
    },
    rose: {
      glow: "#fd6f85",
      accent: "#e85a72",
      accentSecondary: "#f0a0ad",
      hair: "#ead6da",
      outfit: "#462536",
      skin: "#dcc6b8",
      background: "#1b1317"
    }
  };

  const base = palettes[palette] ?? palettes.lavender;
  const shifts = [0, -18, 14];
  const shift = shifts[variantIndex] ?? 0;

  return {
    glow: adjustHex(base.glow, shift),
    accent: adjustHex(base.accent, shift / 2),
    accentSecondary: adjustHex(base.accentSecondary, shift / 3),
    hair: adjustHex(base.hair, shift / 2),
    outfit: adjustHex(base.outfit, shift / 2),
    skin: adjustHex(base.skin, shift / 3),
    background: base.background
  };
}

function buildHairPath(style: string, headX: number, headY: number, variantIndex: number) {
  if (style.includes("编")) {
    return `
      <path d="M ${headX - 122} ${headY - 18} C ${headX - 130} ${headY - 132}, ${headX - 42} ${headY - 202}, ${headX + 32} ${headY - 190}
      C ${headX + 126} ${headY - 174}, ${headX + 138} ${headY - 78}, ${headX + 120} ${headY + 14}
      C ${headX + 94} ${headY - 10}, ${headX + 70} ${headY - 32}, ${headX + 48} ${headY - 12}
      C ${headX + 20} ${headY + 14}, ${headX - 30} ${headY + 18}, ${headX - 58} ${headY + 6}
      C ${headX - 90} ${headY - 8}, ${headX - 104} ${headY + 10}, ${headX - 122} ${headY - 18} Z" />
      <path d="M ${headX - 116} ${headY + 16} C ${headX - 140} ${headY + 54}, ${headX - 132} ${headY + 122}, ${headX - 92} ${headY + 158}" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round"/>
      <path d="M ${headX + 112} ${headY + 18} C ${headX + 138} ${headY + 58}, ${headX + 132} ${headY + 118}, ${headX + 88} ${headY + 152}" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round"/>
    `;
  }

  if (style.includes("碎")) {
    return `
      <path d="M ${headX - 128} ${headY - 10} L ${headX - 110} ${headY - 126} L ${headX - 34} ${headY - 198}
      L ${headX + 26} ${headY - 188} L ${headX + 96} ${headY - 152} L ${headX + 136} ${headY - 56}
      L ${headX + 128} ${headY + 24} L ${headX + 80} ${headY + 8} L ${headX + 26} ${headY - 8}
      L ${headX - 30} ${headY + 10} L ${headX - 86} ${headY + 2} Z" />
    `;
  }

  if (style.includes("轨道")) {
    return `
      <path d="M ${headX - 118} ${headY + 4} C ${headX - 152} ${headY - 112}, ${headX - 56} ${headY - 214}, ${headX + 42} ${headY - 194}
      C ${headX + 134} ${headY - 176}, ${headX + 160} ${headY - 62}, ${headX + 112} ${headY + 24}
      C ${headX + 72} ${headY + 8}, ${headX + 42} ${headY - 10}, ${headX - 12} ${headY - 4}
      C ${headX - 58} ${headY + 0}, ${headX - 92} ${headY + 16}, ${headX - 118} ${headY + 4} Z" />
      <path d="M ${headX - 98} ${headY - 124} C ${headX + 30} ${headY - 252}, ${headX + 186} ${headY - 130}, ${headX + 118} ${headY + 14}" fill="none" stroke="currentColor" stroke-width="${10 + variantIndex * 2}" stroke-linecap="round" opacity="0.35"/>
    `;
  }

  return `
    <path d="M ${headX - 124} ${headY - 8} C ${headX - 136} ${headY - 116}, ${headX - 64} ${headY - 212}, ${headX + 18} ${headY - 204}
    C ${headX + 106} ${headY - 196}, ${headX + 150} ${headY - 84}, ${headX + 124} ${headY + 20}
    C ${headX + 78} ${headY - 4}, ${headX + 34} ${headY - 24}, ${headX - 10} ${headY - 10}
    C ${headX - 44} ${headY + 0}, ${headX - 84} ${headY + 10}, ${headX - 124} ${headY - 8} Z" />
  `;
}

function buildFallbackAvatarSvg(prompt: z.infer<typeof avatarPromptSchema>, variantIndex: number) {
  const palette = avatarPaletteTokens(prompt.palette, variantIndex);
  const headX = 512 + [-20, 0, 18][variantIndex];
  const headY = 378 + [4, -6, 8][variantIndex];
  const shoulderWidth = 246 + variantIndex * 8;
  const chinY = headY + 126;
  const eyeTilt = variantIndex - 1;
  const expressionShift = prompt.expression.includes("冷") ? -4 : prompt.expression.includes("璀璨") ? 4 : 0;
  const noteGlow = prompt.notes.includes("发光") ? 0.3 : 0.18;
  const hairPath = buildHairPath(prompt.hair, headX, headY, variantIndex);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Generated avatar candidate ${variantIndex + 1}">
      <defs>
        <radialGradient id="bg-${variantIndex}" cx="45%" cy="38%" r="72%">
          <stop offset="0%" stop-color="${rgba(palette.glow, 0.32)}"/>
          <stop offset="58%" stop-color="${rgba(palette.accentSecondary, 0.12)}"/>
          <stop offset="100%" stop-color="${palette.background}"/>
        </radialGradient>
        <radialGradient id="halo-${variantIndex}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${rgba(palette.glow, 0.42 + noteGlow)}"/>
          <stop offset="100%" stop-color="${rgba(palette.glow, 0)}"/>
        </radialGradient>
        <linearGradient id="coat-${variantIndex}" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${adjustHex(palette.outfit, 24)}"/>
          <stop offset="100%" stop-color="${adjustHex(palette.outfit, -22)}"/>
        </linearGradient>
        <linearGradient id="face-${variantIndex}" x1="30%" x2="70%" y1="20%" y2="85%">
          <stop offset="0%" stop-color="${adjustHex(palette.skin, 18)}"/>
          <stop offset="100%" stop-color="${adjustHex(palette.skin, -18)}"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="${palette.background}"/>
      <circle cx="512" cy="512" r="414" fill="url(#bg-${variantIndex})"/>
      <circle cx="512" cy="512" r="280" fill="url(#halo-${variantIndex})" opacity="0.88"/>
      <circle cx="512" cy="512" r="432" fill="none" stroke="${rgba(palette.glow, 0.14)}" stroke-width="2"/>
      <ellipse cx="512" cy="810" rx="${shoulderWidth}" ry="128" fill="${rgba(palette.accentSecondary, 0.18)}"/>
      <path d="M ${512 - shoulderWidth} 864 C 328 722, 380 610, 512 610 C 644 610, 696 722, ${512 + shoulderWidth} 864 Z" fill="url(#coat-${variantIndex})"/>
      <path d="M 446 642 C 470 620, 498 608, 512 606 C 526 608, 554 620, 578 642 L 542 702 H 482 Z" fill="${rgba(palette.accentSecondary, 0.16)}"/>
      <ellipse cx="${headX}" cy="${headY}" rx="114" ry="138" fill="url(#face-${variantIndex})"/>
      <path d="M ${headX - 54} ${chinY - 24} C ${headX - 14} ${chinY + 10}, ${headX + 34} ${chinY + 6}, ${headX + 58} ${chinY - 30}" fill="${rgba("#000000", 0.12)}"/>
      <g fill="${adjustHex(palette.skin, -20)}" opacity="0.96">
        <ellipse cx="${headX - 42}" cy="${headY - 18 + eyeTilt + expressionShift}" rx="12" ry="6"/>
        <ellipse cx="${headX + 30}" cy="${headY - 14 - eyeTilt + expressionShift}" rx="11" ry="6"/>
      </g>
      <path d="M ${headX - 24} ${headY + 34} C ${headX - 6} ${headY + 46}, ${headX + 14} ${headY + 44}, ${headX + 28} ${headY + 28}" fill="none" stroke="${adjustHex(palette.skin, -46)}" stroke-width="8" stroke-linecap="round"/>
      <path d="M ${headX - 6} ${headY - 6} C ${headX - 6} ${headY + 24}, ${headX + 4} ${headY + 42}, ${headX + 10} ${headY + 74}" fill="none" stroke="${adjustHex(palette.skin, -34)}" stroke-width="6" stroke-linecap="round"/>
      <g fill="${palette.hair}" stroke="${adjustHex(palette.hair, -20)}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        ${hairPath}
      </g>
      <path d="M ${headX - 82} ${headY + 28} C ${headX - 94} ${headY + 90}, ${headX - 60} ${headY + 142}, ${headX - 8} ${headY + 152}" fill="${rgba("#000000", 0.08)}"/>
      <circle cx="${812 - variantIndex * 42}" cy="${226 + variantIndex * 24}" r="${14 + variantIndex * 2}" fill="${rgba(palette.glow, 0.42)}"/>
      <circle cx="${244 + variantIndex * 36}" cy="${236 + variantIndex * 14}" r="8" fill="${rgba(palette.accentSecondary, 0.44)}"/>
    </svg>
  `.trim();
}

async function generateFallbackAvatarCandidates(prompt: z.infer<typeof avatarPromptSchema>, previousCandidates: string[] = []) {
  return selectFallbackAvatarCandidates(prompt, previousCandidates);
}

async function saveGeneratedImage(base64: string, filename: string) {
  await fs.writeFile(path.join(config.uploadDir, filename), Buffer.from(base64, "base64"));
  return `/uploads/${filename}`;
}

async function clientIndexExists() {
  try {
    await fs.access(path.join(config.clientDistDir, "index.html"));
    return true;
  } catch {
    return false;
  }
}

app.get("/api/bootstrap", async (request) => loadBootstrap(request));

app.post("/api/owner/session", async (request, reply) => {
  const body = z.object({ pin: z.string().min(4).max(6) }).parse(request.body);
  const valid = await verifyOwnerPin(body.pin);

  if (!valid) {
    reply.code(401).send({ message: "PIN 不正确，请重试。" });
    return;
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 4);

  await prisma.ownerSession.create({
    data: {
      token,
      expiresAt
    }
  });

  reply.setCookie("owner_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });

  return { authenticated: true };
});

app.delete("/api/owner/session", async (request, reply) => {
  const token = request.cookies.owner_session;

  if (token) {
    await prisma.ownerSession.deleteMany({
      where: {
        token
      }
    });
  }

  reply.clearCookie("owner_session", { path: "/" });
  return { authenticated: false };
});

app.put("/api/profile", async (request, reply) => {
  if (!(await requireOwner(request, reply))) {
    return;
  }

  const body = profileUpdateSchema.parse(request.body);

  const profile = await prisma.profile.update({
    where: { id: "main" },
    data: {
      name: body.name,
      bio: body.bio,
      ...(body.avatarImagePath ? { avatarImagePath: body.avatarImagePath } : {}),
      ...(body.avatarPromptJson ? { avatarPromptJson: JSON.stringify(body.avatarPromptJson) } : {})
    }
  });

  return {
    name: profile.name,
    bio: profile.bio,
    avatarImagePath: profile.avatarImagePath,
    avatarPromptJson: parseAvatarPromptJson(profile.avatarPromptJson),
    updatedAt: profile.updatedAt.toISOString()
  };
});

app.post("/api/profile/avatar/generate", async (request, reply) => {
  if (!(await requireOwner(request, reply))) {
    return;
  }

  const requestBody = avatarGenerateSchema.parse(request.body);
  const body = normalizeAvatarPrompt(requestBody);

  let candidates: string[] = [];

  if (config.openAiApiKey) {
    try {
      const openai = new OpenAI({
        apiKey: config.openAiApiKey
      });

      const result = await openai.images.generate({
        model: config.openAiImageModel,
        prompt: buildAvatarPrompt(body),
        size: "1024x1024",
        n: 3
      });

      candidates = await Promise.all(
        (result.data ?? [])
          .filter((item) => item.b64_json)
          .map((item, index) => saveGeneratedImage(item.b64_json as string, buildUploadFilename(`avatar-${index + 1}.png`)))
      );
    } catch (error) {
      request.log.warn({ error }, "OpenAI avatar generation failed, falling back to local candidates");
    }
  }

  if (!candidates.length) {
    candidates = await generateFallbackAvatarCandidates(body, requestBody.previousCandidates ?? []);
  }

  if (!candidates.length) {
    reply.code(502).send({ message: "头像生成失败，请重试。" });
    return;
  }

  return {
    candidates,
    prompt: body
  };
});

app.post("/api/upload", async (request, reply) => {
  if (!(await requireOwner(request, reply))) {
    return;
  }

  const file = await request.file();

  if (!file) {
    reply.code(400).send({ message: "请先选择文件。" });
    return;
  }

  const filename = buildUploadFilename(file.filename);
  await fs.writeFile(path.join(config.uploadDir, filename), await file.toBuffer());

  return {
    path: `/uploads/${filename}`,
    mimeType: file.mimetype
  };
});

app.post("/api/cards", async (request, reply) => {
  if (!(await requireOwner(request, reply))) {
    return;
  }

  const body = cardCreateSchema.parse(request.body);

  if (!LEVELS.some((level) => level.id === body.levelId)) {
    reply.code(400).send({ message: "无效的关卡。" });
    return;
  }

  if (!isAllowedTheme(body.levelId, body.themeKey)) {
    reply.code(400).send({ message: "所选主题不属于当前关卡。" });
    return;
  }

  const card = await prisma.storyCard.create({
    data: {
      ...body,
      mediaPathOrUrl: serializeMedia(body.mediaPathOrUrl)
    }
  });

  return {
    ...card,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString()
  };
});

app.put<{ Params: { id: string } }>("/api/cards/:id", async (request, reply) => {
  if (!(await requireOwner(request, reply))) {
    return;
  }

  const body = cardUpdateSchema.parse(request.body);

  const card = await prisma.storyCard.update({
    where: {
      id: request.params.id
    },
    data: {
      ...body,
      mediaPathOrUrl: serializeMedia(body.mediaPathOrUrl)
    }
  });

  return {
    ...card,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString()
  };
});

app.delete<{ Params: { id: string } }>("/api/cards/:id", async (request, reply) => {
  if (!(await requireOwner(request, reply))) {
    return;
  }

  await prisma.storyCard.delete({
    where: {
      id: request.params.id
    }
  });

  return { ok: true };
});

app.get("/api/health", async () => ({ ok: true }));

app.get("/assets/*", async (request, reply) => {
  const assetPath = request.url.replace(/^\/assets\//, "");
  const absolutePath = path.join(config.clientDistDir, "assets", assetPath);

  try {
    const buffer = await fs.readFile(absolutePath);
    const contentType = mime.lookup(absolutePath);

    if (contentType) {
      reply.type(contentType);
    }

    reply.send(buffer);
  } catch {
    reply.code(404).send({ message: "Asset not found." });
  }
});

app.get("/*", async (request: FastifyRequest, reply: FastifyReply) => {
  if (
    request.url.startsWith("/api/") ||
    request.url.startsWith("/uploads/") ||
    request.url.startsWith("/reference/") ||
    request.url.startsWith("/assets/")
  ) {
    reply.code(404).send({ message: "Not found." });
    return;
  }

  if (!(await clientIndexExists())) {
    reply.code(404).send({ message: "Client build not found." });
    return;
  }

  const html = await fs.readFile(path.join(config.clientDistDir, "index.html"), "utf8");
  reply.type("text/html").send(html);
});

const start = async () => {
  await ensureDirectories();
  await prisma.$connect();
  await ensureSeedData();
  await app.listen({ port: config.appPort, host: "0.0.0.0" });
};

start().catch(async (error) => {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
