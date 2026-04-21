import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import stitchManifest from "../reference/stitch-manifest.json";
import {
  DEFAULT_AVATAR_PROMPT,
  EXPRESSION_OPTIONS,
  HAIRSTYLE_OPTIONS,
  STYLE_OPTIONS,
  normalizeAvatarPrompt
} from "../shared/avatar-options";
import { LEVELS, LEVEL_THEMES, type LevelDefinition } from "../shared/content";
import type {
  AvatarCandidatesDto,
  AvatarPromptDto,
  BootstrapDto,
  MediaType,
  ProfileDto,
  StoryCardDto
} from "../shared/types";

type OverlayState =
  | null
  | "profile"
  | "pin"
  | "profile-edit"
  | "avatar"
  | "card-detail"
  | "card-editor"
  | "delete";

type Notice = {
  tone: "success" | "error";
  message: string;
} | null;

type ProfileDraft = {
  name: string;
  bio: string;
  avatarImagePath: string;
  avatarPromptJson: AvatarPromptDto;
};

type CardEditorMode = "create" | "edit";
type CardEditorReturnTarget = "level" | "detail" | null;

type CardDraft = {
  mode: CardEditorMode;
  levelId: string;
  cardId?: string;
  themeKey: string;
  title: string;
  summary: string;
  reflection: string;
  mediaType: MediaType;
  imagePaths: string[];
  videoPath: string;
};

const HOMEPAGE_HERO_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q";

const LEGACY_PROFILE_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAmIOYajnms4qZUKkIjyOSsVmlyCPUZ9yShp5WlVuygu0GHzgZKaWoUFP3rAygJpHHa8YIRgvjlkN0zSh5cYcOupC-XpHSfBvAOgs3bHVm7U41CwBIOa8iiC8f_7Eu532lZx7vkhwahNOc4XGp2bhZDUw-3b6O_oyACs_ChhbQGTD6HKuUMHds1fCUIKEQyrtUUz1UbgDUXuk7hi02s_qftJNE4CQhAHKMJWQi2RPlf9alCfwRMY3DG_PW-b0UVgsuiwOLjDlSP1DQ";

const AVATAR_FORM_DEFAULTS: AvatarPromptDto = {
  ...DEFAULT_AVATAR_PROMPT,
  outfit: "",
  notes: ""
};

const manifestEntries = stitchManifest as Array<{
  key: string;
  title: string;
  htmlUrl: string;
  screenshotUrl: string;
}>;

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload ? String(payload.message) : "请求失败，请稍后重试。";
    throw new Error(message);
  }

  return payload as T;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function formatEpochDate(value: string | Date) {
  return formatDate(value).replace(/\//g, ".");
}

function splitReflectionParagraphs(value: string) {
  return value
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function resolveProfileAvatar(value: string) {
  return value === LEGACY_PROFILE_AVATAR ? HOMEPAGE_HERO_AVATAR : value;
}

function parseImagePaths(card: StoryCardDto) {
  if (card.mediaType !== "image") {
    return [];
  }

  try {
    const parsed = JSON.parse(card.mediaPathOrUrl);
    return Array.isArray(parsed) ? parsed : [card.mediaPathOrUrl];
  } catch {
    return [card.mediaPathOrUrl];
  }
}

function getCardCover(card: StoryCardDto) {
  if (card.mediaType === "image") {
    return parseImagePaths(card)[0] ?? "";
  }

  return getVideoPosterUrl(card.mediaPathOrUrl, card.title);
}

function extractYouTubeId(urlString: string) {
  try {
    const url = new URL(urlString);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1) || null;
    }

    if (url.searchParams.get("v")) {
      return url.searchParams.get("v");
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/").pop() || null;
    }
  } catch {
    return null;
  }

  return null;
}

function extractVimeoId(urlString: string) {
  try {
    const url = new URL(urlString);
    if (!url.hostname.includes("vimeo.com")) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? null;
  } catch {
    return null;
  }
}

function toEmbeddableVideoUrl(value: string) {
  const youtubeId = extractYouTubeId(value);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const vimeoId = extractVimeoId(value);

  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  if (value.startsWith("/uploads/") || value.endsWith(".mp4") || value.endsWith(".mov") || value.endsWith(".webm")) {
    return value;
  }

  return null;
}

function withAutoplayVideoUrl(value: string) {
  try {
    const url = new URL(value, "http://localhost");

    if (url.pathname.startsWith("/uploads/")) {
      return value;
    }

    if (url.hostname.includes("youtube.com")) {
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("rel", "0");
      url.searchParams.set("modestbranding", "1");
      url.searchParams.set("playsinline", "1");
      return url.toString();
    }

    if (url.hostname.includes("vimeo.com")) {
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("title", "0");
      url.searchParams.set("byline", "0");
      url.searchParams.set("portrait", "0");
      return url.toString();
    }

    return value;
  } catch {
    return value;
  }
}

function getVideoPosterUrl(urlString: string, label: string) {
  const id = extractYouTubeId(urlString);
  if (id) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6d4788"/>
          <stop offset="100%" stop-color="#17353d"/>
        </linearGradient>
      </defs>
      <rect width="900" height="620" fill="#0e0e0e"/>
      <circle cx="250" cy="180" r="220" fill="url(#bg)" opacity="0.35"/>
      <circle cx="610" cy="240" r="180" fill="rgba(255,255,255,0.09)"/>
      <path d="M70 460c120-70 280-72 390 16 90 72 190 96 368 8V620H70z" fill="#81ecff" opacity="0.15"/>
      <text x="74" y="88" fill="rgba(255,255,255,0.72)" font-size="42" font-family="Plus Jakarta Sans, sans-serif" font-weight="700">${label}</text>
    </svg>
  `)}`;
}

export function splitProfileDisplayName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return {
      lead: "",
      accent: ""
    };
  }

  const marker = "The Explorer";
  const markerIndex = trimmed.indexOf(marker);

  if (markerIndex !== -1) {
    return {
      lead: trimmed.slice(0, markerIndex).trim(),
      accent: marker
    };
  }

  const hasLatin = /[A-Za-z]/.test(trimmed);

  if (hasLatin) {
    const words = trimmed.split(/\s+/).filter(Boolean);

    if (words.length <= 1) {
      return {
        lead: "",
        accent: trimmed
      };
    }

    return {
      lead: words.slice(0, -1).join(" "),
      accent: words.at(-1) ?? ""
    };
  }

  const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("zh-Hans", { granularity: "word" }) : null;
  const rawSegments = segmenter
    ? Array.from(segmenter.segment(trimmed))
        .filter((segment) => segment.segment.trim().length > 0 && ("isWordLike" in segment ? segment.isWordLike !== false : true))
        .map((segment) => segment.segment)
    : [];

  const segments = rawSegments.length ? rawSegments : Array.from(trimmed);

  if (segments.length <= 1) {
    return {
      lead: "",
      accent: trimmed
    };
  }

  const boundaryTokens = new Set(["我", "你", "他", "她", "它", "我们", "你们", "他们", "她们", "它们", "是", "叫", "叫做", "名叫", "就是", "的", "了", "和", "与", "及", "在"]);
  const modifierPattern =
    /^(?:[一二三四五六七八九十百千万两几半多整个对双大小老阿第前后高低胖瘦黑白蓝红金银紫粉]?)(?:个|只|条|匹|头|位|名|朵|颗|棵|张|本|台|件|份|辆|艘|把|座|封|间|类|种)?$/u;

  const accentSegments = [segments.at(-1) ?? trimmed];
  let index = segments.length - 2;

  while (index >= 0) {
    const current = segments[index];
    const accentText = accentSegments.join("");
    const currentIsBoundary = boundaryTokens.has(current);
    const currentIsModifier = modifierPattern.test(current) || ["一只", "一头", "一匹", "一位", "一名", "小", "大", "老", "阿"].includes(current);

    if (currentIsBoundary) {
      break;
    }

    if (currentIsModifier || accentText.length < 2) {
      accentSegments.unshift(current);
      index -= 1;
      continue;
    }

    break;
  }

  const accent = accentSegments.join("");
  const lead = trimmed.slice(0, trimmed.length - accent.length).trim();

  if (!lead) {
    return {
      lead: "",
      accent
    };
  }

  return {
    lead,
    accent
  };
}

function levelById(levelId: string) {
  return LEVELS.find((item) => item.id === levelId);
}

function emptyCardDraft(levelId: string): CardDraft {
  return {
    mode: "create",
    levelId,
    themeKey: LEVEL_THEMES[levelId]?.[0] ?? "",
    title: "",
    summary: "",
    reflection: "",
    mediaType: "image",
    imagePaths: [],
    videoPath: ""
  };
}

const TIMELINE_MARKERS = ["T-MINUS 12,000Y", "T-MINUS 8,400Y", "T-MINUS 2,100Y"];

function SiteFooter({ label = "© 2026 THE CELESTIAL ARCHITECT." }: { label?: string }) {
  return (
    <footer className="w-full py-8 flex flex-col items-center justify-center border-t border-white/5 bg-black mt-auto">
      <div className="text-neutral-500 text-[10px] tracking-widest uppercase opacity-60">{label}</div>
    </footer>
  );
}

function draftFromCard(card: StoryCardDto): CardDraft {
  return {
    mode: "edit",
    levelId: card.levelId,
    cardId: card.id,
    themeKey: card.themeKey,
    title: card.title,
    summary: card.summary,
    reflection: card.reflection,
    mediaType: card.mediaType,
    imagePaths: parseImagePaths(card),
    videoPath: card.mediaType === "video" ? card.mediaPathOrUrl : ""
  };
}

function homepagePlanetVisuals(levelId: string) {
  switch (levelId) {
    case "family":
      return {
        shellClass: "shadow-[0_0_60px_rgba(224,142,254,0.4)] border border-white/20 planet-glow-primary",
        fillClass: "bg-gradient-to-br from-black via-black/40 to-[#e08efe] opacity-90",
        overlayClass: "mix-blend-overlay opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]",
        ringClass: "text-primary",
        codeClass: "text-primary-fixed",
        labelClass: "text-primary"
      };
    case "favorites":
      return {
        shellClass: "shadow-[0_0_40px_rgba(129,236,255,0.4)] border border-white/20 planet-glow-tertiary",
        fillClass: "bg-gradient-to-bl from-black via-surface-container-low to-tertiary opacity-90",
        overlayClass: "",
        ringClass: "text-tertiary",
        codeClass: "text-tertiary-fixed-dim",
        labelClass: "text-tertiary"
      };
    case "school":
      return {
        shellClass: "shadow-[0_0_50px_rgba(255,255,255,0.2)] border border-white/15 planet-glow-white",
        fillClass: "bg-gradient-to-tr from-black via-surface-container-highest to-neutral-600 opacity-95",
        overlayClass: "",
        ringClass: "text-white",
        codeClass: "text-on-surface-variant",
        labelClass: "text-on-surface"
      };
    case "dreams":
      return {
        shellClass: "shadow-[0_0_70px_rgba(224,142,254,0.5)] border border-white/30 planet-glow-primary",
        fillClass: "bg-gradient-to-l from-black via-[#e08efe]/50 to-[#81ecff] opacity-50 animate-pulse",
        overlayClass: "bg-black/50",
        ringClass: "text-[#e08efe]",
        codeClass: "text-primary-fixed",
        labelClass: "text-primary-fixed"
      };
    case "memories":
      return {
        shellClass: "shadow-[0_0_40px_rgba(169,190,171,0.3)] border border-white/15 planet-glow-primary",
        fillClass: "bg-gradient-to-r from-black via-surface-container to-secondary opacity-90",
        overlayClass: "",
        ringClass: "text-secondary",
        codeClass: "text-secondary-dim",
        labelClass: "text-secondary"
      };
    case "milestones":
      return {
        shellClass: "shadow-[0_0_40px_rgba(253,111,133,0.4)] border border-white/15 planet-glow-error",
        fillClass: "bg-gradient-to-tl from-black via-surface-container-low to-error opacity-90",
        overlayClass: "",
        ringClass: "text-error",
        codeClass: "text-error-dim",
        labelClass: "text-error"
      };
    default:
      return {
        shellClass: "shadow-[0_0_60px_rgba(224,142,254,0.2)] border border-white/20 planet-glow-primary",
        fillClass: "bg-gradient-to-br from-black via-black/40 to-[#e08efe] opacity-90",
        overlayClass: "",
        ringClass: "text-primary",
        codeClass: "text-primary-fixed",
        labelClass: "text-primary"
      };
  }
}

export default function App() {
  const [data, setData] = useState<BootstrapDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pin, setPin] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState<CardDraft | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [avatarCandidates, setAvatarCandidates] = useState<string[]>([]);
  const [viewedCardIds, setViewedCardIds] = useState<string[]>([]);
  const [deleteReturnsToDetail, setDeleteReturnsToDetail] = useState(false);
  const [cardEditorReturnTarget, setCardEditorReturnTarget] = useState<CardEditorReturnTarget>(null);

  const navigate = useNavigate();

  useEffect(() => {
    void initializeApp();
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (overlay) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [overlay]);

  useEffect(() => {
    if (overlay === "avatar") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [overlay]);

  async function initializeApp() {
    try {
      await api<{ authenticated: boolean }>("/api/owner/session", {
        method: "DELETE"
      });
    } catch {
      // Ignore initial cleanup errors so the site can still load.
    }

    await refreshBootstrap();
  }

  async function refreshBootstrap() {
    setLoading(true);

    try {
      const payload = await api<BootstrapDto>("/api/bootstrap");
      setData(payload);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "加载失败。"
      });
    } finally {
      setLoading(false);
    }
  }

  function openProfileEditor() {
    if (!data) {
      return;
    }

    setProfileDraft({
      name: data.profile.name,
      bio: data.profile.bio,
      avatarImagePath: data.profile.avatarImagePath,
      avatarPromptJson: normalizeAvatarPrompt(data.profile.avatarPromptJson ?? DEFAULT_AVATAR_PROMPT)
    });
    setAvatarCandidates([]);
    setOverlay("profile-edit");
  }

  function openAvatarGenerator() {
    if (!data && !profileDraft) {
      return;
    }

    setProfileDraft((current) => {
      if (current) {
        return {
          ...current,
          avatarPromptJson: {
            ...AVATAR_FORM_DEFAULTS
          }
        };
      }

      if (data) {
        return {
          name: data.profile.name,
          bio: data.profile.bio,
          avatarImagePath: data.profile.avatarImagePath,
          avatarPromptJson: {
            ...AVATAR_FORM_DEFAULTS
          }
        };
      }

      return current;
    });

    setAvatarCandidates([]);
    setOverlay("avatar");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openCardDetail(cardId: string) {
    setSelectedCardId(cardId);
    setViewedCardIds((current) => (current.includes(cardId) ? current : [...current, cardId]));
    setOverlay("card-detail");
  }

  function openCreateCard(levelId: string) {
    setCardDraft(emptyCardDraft(levelId));
    setCardEditorReturnTarget(null);
    setOverlay("card-editor");
  }

  function openEditCard(card: StoryCardDto, returnTarget: CardEditorReturnTarget = "level") {
    setSelectedCardId(card.id);
    setCardDraft(draftFromCard(card));
    setCardEditorReturnTarget(returnTarget);
    setOverlay("card-editor");
  }

  function closeOverlay() {
    setOverlay(null);
  }

  async function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking("pin");

    try {
      await api<{ authenticated: boolean }>("/api/owner/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pin })
      });
      setPin("");
      setOverlay(null);
      await refreshBootstrap();
      setNotice({
        tone: "success",
        message: "编辑模式已开启"
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "PIN 校验失败。"
      });
    } finally {
      setWorking(null);
    }
  }

  async function handleExitEditMode() {
    setWorking("logout");

    try {
      await api<{ authenticated: boolean }>("/api/owner/session", {
        method: "DELETE"
      });
      await refreshBootstrap();
      setNotice({
        tone: "success",
        message: "已退出编辑模式"
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "退出失败。"
      });
    } finally {
      setWorking(null);
    }
  }

  async function handleSaveProfile() {
    if (!profileDraft) {
      return;
    }

    const trimmedName = profileDraft.name.trim();
    const trimmedBio = profileDraft.bio.trim();

    if (!trimmedName || !trimmedBio) {
      setNotice({
        tone: "success",
        message: "个人信息不能为空，请认真填写"
      });
      return;
    }

    setWorking("profile");

    try {
      const profile = await api<ProfileDto>("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...profileDraft,
          name: trimmedName,
          bio: trimmedBio
        })
      });

      setData((current) =>
        current
          ? {
              ...current,
              profile
            }
          : current
      );
      setOverlay("profile");
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "保存资料失败。"
      });
    } finally {
      setWorking(null);
    }
  }

  async function handleDeleteCard() {
    if (!selectedCardId) {
      return;
    }

    setWorking("delete");

    try {
      await api<{ ok: true }>(`/api/cards/${selectedCardId}`, {
        method: "DELETE"
      });
      setData((current) =>
        current
          ? {
              ...current,
              cards: current.cards.filter((card) => card.id !== selectedCardId)
            }
          : current
      );
      setOverlay(null);
      setSelectedCardId(null);
      setNotice({
        tone: "success",
        message: "故事卡片已删除。"
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "删除失败。"
      });
    } finally {
      setWorking(null);
    }
  }

  async function handleSaveCard(draft: CardDraft) {
    setWorking("card");

    try {
      const body = {
        levelId: draft.levelId,
        themeKey: draft.themeKey,
        title: draft.title,
        summary: draft.summary,
        reflection: draft.reflection,
        mediaType: draft.mediaType,
        mediaPathOrUrl: draft.mediaType === "image" ? draft.imagePaths : draft.videoPath
      };

      if (draft.mode === "create") {
        const created = await api<StoryCardDto>("/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        setData((current) =>
          current
            ? {
                ...current,
                cards: [created, ...current.cards].sort(
                  (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
                )
              }
            : current
        );
        setNotice({
          tone: "success",
          message: "新故事已保存并自动发布。"
        });
      } else if (draft.cardId) {
        const updated = await api<StoryCardDto>(`/api/cards/${draft.cardId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: body.title,
            summary: body.summary,
            reflection: body.reflection,
            mediaType: body.mediaType,
            mediaPathOrUrl: body.mediaPathOrUrl
          })
        });

        setData((current) =>
          current
            ? {
                ...current,
                cards: current.cards
                  .map((card) => (card.id === updated.id ? updated : card))
                  .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
              }
            : current
        );
        setSelectedCardId(updated.id);
        setNotice({
          tone: "success",
          message: "故事卡片已更新并自动发布。"
        });
      }

      setOverlay(null);
      setCardDraft(null);
      setCardEditorReturnTarget(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "保存卡片失败。"
      });
    } finally {
      setWorking(null);
    }
  }

  const selectedCard = useMemo(
    () => data?.cards.find((card) => card.id === selectedCardId) ?? null,
    [data?.cards, selectedCardId]
  );
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-6">
          <div className="absolute w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full border border-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-tertiary animate-pulse" />
          </div>
          <div className="text-[11px] uppercase tracking-[0.4em] text-white/50">Loading The Explorer</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black tracking-tight mb-4">页面加载失败</h1>
          <p className="text-on-surface-variant mb-8">我暂时没有拿到网站数据。请稍后重试，或者让我继续排查。</p>
          <button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-primary-container to-tertiary text-black font-bold"
            onClick={() => {
              void refreshBootstrap();
            }}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              ownerAuthenticated={data.owner.authenticated}
              onExitEditMode={() => {
                void handleExitEditMode();
              }}
              profile={data.profile}
              onLevelSelect={(levelId) => navigate(`/levels/${levelId}`)}
              onOpenPin={() => setOverlay("pin")}
              onOpenProfile={() => setOverlay("profile")}
            />
          }
        />
        <Route
          path="/levels/:levelId"
          element={
            <LevelRoute
              cards={data.cards}
              ownerAuthenticated={data.owner.authenticated}
              profileUpdatedAt={data.profile.updatedAt}
              viewedCardIds={viewedCardIds}
              onGoHome={() => navigate("/")}
              onOpenCard={openCardDetail}
              onOpenCreateCard={openCreateCard}
              onOpenDelete={(cardId) => {
                setSelectedCardId(cardId);
                setDeleteReturnsToDetail(false);
                setOverlay("delete");
              }}
              onOpenEdit={(card) => openEditCard(card, "level")}
              onExitEditMode={() => {
                void handleExitEditMode();
              }}
              onOpenPin={() => setOverlay("pin")}
              onOpenProfile={() => setOverlay("profile")}
            />
          }
        />
        <Route path="/qa/stitch" element={<QaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {notice ? (
        <div
          className={`fixed right-6 top-6 z-[120] px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${
            notice.tone === "success"
              ? "bg-[rgba(24,20,30,0.88)] border-primary/20 text-on-surface shadow-[0_0_32px_rgba(224,142,254,0.12)]"
              : "bg-[rgba(31,18,24,0.9)] border-error/20 text-on-surface shadow-[0_0_32px_rgba(253,111,133,0.1)]"
          }`}
        >
          <div className={`text-[10px] uppercase tracking-[0.3em] mb-1 ${notice.tone === "success" ? "text-primary/75" : "text-error/75"}`}>The Explorer</div>
          <div className="text-sm">{notice.message}</div>
        </div>
      ) : null}

      {overlay === "profile" ? (
        <ProfileOverlay
          cardCount={data.cards.length}
          onClose={closeOverlay}
          onEditProfile={openProfileEditor}
          onReturnHome={() => {
            setOverlay(null);
            navigate("/");
          }}
          ownerAuthenticated={data.owner.authenticated}
          profile={data.profile}
        />
      ) : null}

      {overlay === "pin" ? (
        <PinOverlay
          onClose={() => {
            setPin("");
            setOverlay(null);
          }}
          onSubmit={handlePinSubmit}
          pin={pin}
          setPin={setPin}
          submitting={working === "pin"}
        />
      ) : null}

      {overlay === "profile-edit" && profileDraft ? (
        <ProfileEditorOverlay
          draft={profileDraft}
          onChange={setProfileDraft}
          onClose={() => {
            const dirty =
              profileDraft.name !== data.profile.name ||
              profileDraft.bio !== data.profile.bio ||
              profileDraft.avatarImagePath !== data.profile.avatarImagePath;

            if (!dirty || window.confirm("资料尚未保存，确定要关闭吗？")) {
              setProfileDraft({
                name: data.profile.name,
                bio: data.profile.bio,
                avatarImagePath: data.profile.avatarImagePath,
                avatarPromptJson: data.profile.avatarPromptJson
              });
              setAvatarCandidates([]);
              setOverlay("profile");
            }
          }}
          onOpenAvatar={openAvatarGenerator}
          onSave={() => {
            void handleSaveProfile();
          }}
          saving={working === "profile"}
        />
      ) : null}

      {overlay === "avatar" && profileDraft ? (
        <AvatarGeneratorOverlay
          candidates={avatarCandidates}
          draft={profileDraft}
          onBack={() => setOverlay("profile-edit")}
          onCandidatesChange={setAvatarCandidates}
          onDraftChange={setProfileDraft}
          onSaveSelection={(avatarImagePath) => {
            setProfileDraft((current) => (current ? { ...current, avatarImagePath } : current));
            setOverlay("profile-edit");
          }}
        />
      ) : null}

      {overlay === "card-detail" && selectedCard ? (
        <CardDetailOverlay
          card={selectedCard}
          ownerAuthenticated={data.owner.authenticated}
          onClose={closeOverlay}
          onDelete={() => {
            setDeleteReturnsToDetail(true);
            setOverlay("delete");
          }}
          onEdit={() => openEditCard(selectedCard, "detail")}
        />
      ) : null}

      {overlay === "card-editor" && cardDraft ? (
        <CardEditorOverlay
          draft={cardDraft}
          saving={working === "card"}
          onClose={() => {
            if (cardDraft.mode === "edit" && cardEditorReturnTarget === "detail" && selectedCard) {
              setOverlay("card-detail");
            } else {
              setOverlay(null);
            }
            setCardDraft(null);
            setCardEditorReturnTarget(null);
          }}
          onSave={(draft) => {
            void handleSaveCard(draft);
          }}
        />
      ) : null}

      {overlay === "delete" && selectedCard ? (
        <DeleteOverlay
          deleting={working === "delete"}
          onCancel={() => setOverlay(deleteReturnsToDetail ? "card-detail" : null)}
          onConfirm={() => {
            void handleDeleteCard();
          }}
        />
      ) : null}
    </>
  );
}

function HomePage({
  profile,
  ownerAuthenticated,
  onExitEditMode,
  onOpenProfile,
  onOpenPin,
  onLevelSelect
}: {
  profile: ProfileDto;
  ownerAuthenticated: boolean;
  onExitEditMode: () => void;
  onOpenProfile: () => void;
  onOpenPin: () => void;
  onLevelSelect: (levelId: string) => void;
}) {
  return (
    <>
      <TopNav onExitEditMode={onExitEditMode} onOpenPin={onOpenPin} onOpenProfile={onOpenProfile} ownerAuthenticated={ownerAuthenticated} />
      <main className="relative h-screen w-full flex items-center justify-center bg-surface overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="stars" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-tertiary/10 rounded-full blur-[180px] animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-error/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface/80" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-40 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 50% 50%, transparent 20%, rgba(14,14,14,0.9) 100%)" }}
          />
        </div>

        <div className="absolute inset-0 translate-y-10 md:translate-y-12">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-100">
            <div className="orbital-ring orbital-ring-1 w-[400px] h-[400px] rounded-full" />
            <div className="orbital-ring orbital-ring-2 w-[650px] h-[650px] rounded-full" />
            <div className="orbital-ring orbital-ring-3 w-[950px] h-[950px] rounded-full opacity-80" />
            <div className="orbital-ring orbital-ring-4 w-[1300px] h-[1300px] rounded-full opacity-60" />
            <div className="orbital-ring orbital-ring-5 w-[1600px] h-[1600px] rounded-full opacity-40" />
          </div>

          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="text-center px-6 -translate-y-8 max-w-3xl float-animation">
              <div className="flex flex-col items-center pointer-events-auto mb-10">
                <button className="group relative mb-8 h-40 w-40 cursor-pointer transition-all duration-700 hover:scale-105" onClick={onOpenProfile}>
                  <div className="absolute inset-0 scale-110 rounded-full bg-primary/10 blur-3xl opacity-90 transition-all duration-700 group-hover:bg-primary/15 ethereal-glow-soft" />
                  <div className="relative h-full w-full rounded-full">
                    <div className="absolute inset-0 rounded-full border border-primary/30 shadow-[0_0_20px_rgba(224,142,254,0.18)]" />
                    <div className="absolute inset-[7px] rounded-full border border-white/10" />
                    <div className="absolute inset-[9px] overflow-hidden rounded-full">
                      <img alt="Owner" className="h-full w-full rounded-full object-cover" src={resolveProfileAvatar(profile.avatarImagePath)} />
                    </div>
                  </div>
                </button>

                <h1 className="font-headline text-4xl font-extrabold tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-on-surface to-on-surface-variant mb-3">
                  欢迎来到我的世界
                  <span className="italic font-light opacity-100 block mt-2 text-2xl">请选择关卡探索我的故事</span>
                </h1>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none z-20">
            {LEVELS.map((level, index) => (
              <PlanetButton key={level.id} index={index} level={level} onClick={() => onLevelSelect(level.id)} />
            ))}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
            <span className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant">Traverse the Stars</span>
            <div className="w-0.5 h-12 bg-gradient-to-b from-primary to-transparent" />
          </div>
        </div>
      </main>
    </>
  );
}

function PlanetButton({
  level,
  index,
  onClick
}: {
  level: LevelDefinition;
  index: number;
  onClick: () => void;
}) {
  const visuals = homepagePlanetVisuals(level.id);

  return (
    <button
      className={`planet-button absolute group pointer-events-auto transition-all duration-500 hover:scale-105 focus:outline-none float-animation ${
        level.id === "milestones" ? "active" : ""
      }`}
      onClick={onClick}
      style={{
        ...level.position,
        animationDelay: `${-((index % 5) + 1)}s`
      }}
    >
      <div className={`relative rounded-full overflow-hidden transition-all duration-500 ${visuals.shellClass}`} style={{ width: `${level.sizePx}px`, height: `${level.sizePx}px` }}>
        <div className={`absolute inset-0 ${visuals.fillClass}`} />
        {visuals.overlayClass ? <div className={`absolute inset-0 ${visuals.overlayClass}`} /> : null}
        <div className={`selection-ring ${visuals.ringClass}`} />
        <div className="orbit-particle" />
      </div>
      <div className="mt-4 flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
        <span className={`text-[10px] tracking-[0.4em] font-bold uppercase mb-1 ${visuals.codeClass}`}>{level.levelCode}</span>
        <span className={`text-xs tracking-[0.2em] font-medium uppercase whitespace-nowrap ${visuals.labelClass}`}>{level.title}</span>
      </div>
    </button>
  );
}

function TopNav({
  onOpenProfile,
  onOpenPin,
  ownerAuthenticated = false,
  onExitEditMode
}: {
  onOpenProfile: () => void;
  onOpenPin: () => void;
  ownerAuthenticated?: boolean;
  onExitEditMode?: () => void;
}) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-950/40 backdrop-blur-xl border-b border-white/5 shadow-[0_0_30px_rgba(224,142,254,0.1)]">
      <div className="flex justify-between items-center px-8 py-4 w-full max-w-[1920px] mx-auto">
        <button className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#e08efe] to-[#81ecff] hover:drop-shadow-[0_0_10px_rgba(129,236,255,0.6)] transition-all duration-300 cursor-pointer">
          The Explorer
        </button>
        <div className="flex items-center gap-6">
          {ownerAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-tertiary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-tertiary" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-tertiary" />
                </span>
                编辑模式
              </div>
              {onExitEditMode ? (
                <button
                  className="px-5 py-2 bg-surface-container-high border border-primary/30 rounded-full text-xs font-bold tracking-wider text-primary hover:bg-primary/10 transition-all"
                  onClick={onExitEditMode}
                >
                  退出编辑
                </button>
              ) : null}
            </>
          ) : null}
          <button
            className="material-symbols-outlined text-fuchsia-300 scale-110 transition-transform active:scale-95 hover:drop-shadow-[0_0_10px_rgba(129,236,255,0.6)]"
            onClick={onOpenProfile}
          >
            account_circle
          </button>
          <button
            className={`material-symbols-outlined scale-110 transition-transform ${
              ownerAuthenticated
                ? "text-neutral-500 cursor-default pointer-events-none"
                : "text-fuchsia-300 active:scale-95 hover:drop-shadow-[0_0_10px_rgba(129,236,255,0.6)]"
            }`}
            disabled={ownerAuthenticated}
            onClick={ownerAuthenticated ? undefined : onOpenPin}
          >
            settings
          </button>
        </div>
      </div>
    </nav>
  );
}

function LevelRoute(props: {
  cards: StoryCardDto[];
  ownerAuthenticated: boolean;
  profileUpdatedAt: string;
  viewedCardIds: string[];
  onGoHome: () => void;
  onOpenCard: (cardId: string) => void;
  onOpenCreateCard: (levelId: string) => void;
  onOpenDelete: (cardId: string) => void;
  onOpenEdit: (card: StoryCardDto) => void;
  onExitEditMode: () => void;
  onOpenPin: () => void;
  onOpenProfile: () => void;
}) {
  const params = useParams();
  const levelId = params.levelId ?? LEVELS[0].id;
  const level = levelById(levelId);

  if (!level) {
    return <Navigate to="/" replace />;
  }

  const cards = props.cards
    .filter((card) => card.levelId === levelId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return (
    <>
      <div className="nebula-bg" />
      <TopNav
        onOpenPin={props.onOpenPin}
        onOpenProfile={props.onOpenProfile}
        onExitEditMode={props.onExitEditMode}
        ownerAuthenticated={props.ownerAuthenticated}
      />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="stars opacity-[0.11]" />
        <div className="absolute inset-0 level-atmosphere" />
        <div className="absolute inset-0 level-vignette" />
        <div className="absolute -left-[18%] top-[15%] h-[620px] w-[620px] rounded-full bg-primary-container/10 blur-[180px]" />
        <div className="absolute -right-[16%] top-[30%] h-[560px] w-[560px] rounded-full bg-tertiary/9 blur-[175px]" />
        <div className="absolute top-10 left-1/2 h-[220px] w-[760px] -translate-x-1/2 rounded-full bg-white/4 blur-[140px]" />
        <div className="absolute bottom-[12%] left-1/2 h-[280px] w-[520px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[160px]" />
      </div>
      <main className="relative px-6 md:px-8 pb-6 min-h-screen max-w-[1440px] mx-auto pt-[96px] md:pt-[104px] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-14 md:mb-16 gap-8">
          <div className="max-w-2xl">
            <button
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-surface-container-high border border-outline-variant/20 text-sm font-medium hover:bg-surface-bright transition-all group mb-7 md:mb-8"
              onClick={props.onGoHome}
            >
              <span className="material-symbols-outlined text-primary group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Back to Orbit
            </button>
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-on-surface leading-tight mb-4">
              我的<span className="text-primary-container">{level.accentLabel}</span>
            </h1>
            <p className="text-on-surface-variant text-base max-w-lg">
              在我的星系世界里，沿着时间轴探索我的故事吧。这段致密的时光终将帮我拥有属于自己的引力和光。
            </p>
          </div>
          <div className="flex flex-col items-end md:pt-[7.2rem]">
            <div className="text-tertiary font-bold tracking-[0.2em] text-xs uppercase mb-2">当前纪元</div>
            <div className="text-[1.55rem] md:text-[1.75rem] font-light text-on-surface">{formatEpochDate(new Date())}</div>
          </div>
        </div>

        {cards.length === 0 && !props.ownerAuthenticated ? (
          <div className="flex-grow flex flex-col items-center justify-center py-20 text-center">
            <div className="max-w-2xl">
              <h2 className="text-[2.2rem] md:text-[2.9rem] font-extrabold tracking-tight text-on-surface leading-tight mb-6">
                这个星球很<span className="text-primary/40">安静。</span>
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg font-medium tracking-tight opacity-60">该关卡还没有故事内容</p>
              <div className="mt-12">
                <button className="px-8 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition-all" onClick={props.onGoHome}>
                  继续探索我的世界
                </button>
              </div>
              <div className="mt-12 w-24 h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent mx-auto" />
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center py-0 pb-6 md:pb-8 flex-grow">
          <div className="absolute left-1/2 top-0 bottom-0 z-0 timeline-axis-glow -translate-x-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 z-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute left-1/2 top-0 bottom-0 time-axis-line -translate-x-1/2 z-0" />
          <div className="absolute left-1/2 top-[14%] z-0 h-32 w-32 -translate-x-1/2 rounded-full bg-primary-container/10 blur-[70px]" />
          <div className="absolute left-1/2 bottom-[12%] z-0 h-40 w-40 -translate-x-1/2 rounded-full bg-tertiary/10 blur-[90px]" />
          <div className="w-full relative z-10 space-y-32">
            {props.ownerAuthenticated && cards.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center justify-center w-full">
                <div className="w-full md:w-1/2 md:pr-24 flex justify-end order-2 md:order-1">
                  <div className="relative max-w-sm w-full">
                    <button
                      className="border-2 border-dashed border-outline-variant/30 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group w-full"
                      onClick={() => props.onOpenCreateCard(levelId)}
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20 text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl">add</span>
                      </div>
                      <span className="text-base font-normal tracking-normal text-on-surface-variant group-hover:text-primary transition-colors">新增故事卡片</span>
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0">
                  <div className="w-2 h-2 rounded-full bg-outline-variant opacity-30" />
                </div>
                <div className="w-full md:w-1/2 md:pl-24 order-3" />
              </div>
            ) : null}

            {props.ownerAuthenticated && cards.length === 0 ? (
              <EmptyTimelineCreateNode marker={TIMELINE_MARKERS[0]} onCreate={() => props.onOpenCreateCard(levelId)} />
            ) : null}

            {cards.length ? (
              cards.map((card, index) => (
                <TimelineNode
                  key={card.id}
                  card={card}
                  index={index}
                  ownerAuthenticated={props.ownerAuthenticated}
                  viewed={props.viewedCardIds.includes(card.id)}
                  onDelete={() => props.onOpenDelete(card.id)}
                  onEdit={() => props.onOpenEdit(card)}
                  onOpen={() => props.onOpenCard(card.id)}
                />
              ))
            ) : (
              <div className="hidden" />
            )}

            {(cards.length > 0 || props.ownerAuthenticated) ? (
              <div className="flex flex-col md:flex-row items-center justify-center w-full group pt-10 md:pt-12 pb-2">
                <div className="w-full md:w-1/2 md:pr-24 text-right order-3 md:order-1">
                  <div className="text-tertiary font-mono text-sm tracking-widest animate-pulse uppercase">PRESENT DAY</div>
                </div>
                <div className="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-container to-tertiary shadow-[0_0_30px_rgba(129,236,255,0.8)]" />
                </div>
                <div className="w-full md:w-1/2 md:pl-24 order-2">
                  <button
                    className="text-on-surface font-bold tracking-tighter text-xl transition-colors hover:text-primary-container"
                    onClick={props.onGoHome}
                    type="button"
                  >
                    继续探索我的世界
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function TimelineNode({
  card,
  index,
  ownerAuthenticated,
  viewed,
  onDelete,
  onEdit,
  onOpen
}: {
  card: StoryCardDto;
  index: number;
  ownerAuthenticated: boolean;
  viewed: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  const left = index % 2 === 0;
  const cover = getCardCover(card);
  const dotColor = left ? "bg-primary" : "bg-tertiary";
  const shadow = left ? "shadow-[0_0_15px_rgba(224,142,254,0.6)]" : "shadow-[0_0_15px_rgba(129,236,255,0.6)]";
  const marker = TIMELINE_MARKERS[index] ?? `T-MINUS ${Math.max(600, 12000 - index * 1800).toLocaleString()}Y`;

  return (
    <div className={`flex flex-col md:flex-row items-center justify-center w-full group ${ownerAuthenticated ? "card-container" : ""}`}>
      {left ? (
        <>
          <div className="w-full md:w-1/2 md:pr-24 flex justify-end order-2 md:order-1">
            <TimelineCard
              align="left"
              card={card}
              cover={cover}
              ownerAuthenticated={ownerAuthenticated}
              viewed={viewed}
              onDelete={onDelete}
              onEdit={onEdit}
              onOpen={onOpen}
            />
          </div>
          <div className="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0">
            <div className={`w-4 h-4 rounded-full ${dotColor} border-4 border-surface ${shadow}`} />
          </div>
          <div className="w-full md:w-1/2 md:pl-24 order-3">
            <div className="text-on-surface-variant font-mono text-sm tracking-widest opacity-40">{marker}</div>
          </div>
        </>
      ) : (
        <>
          <div className="w-full md:w-1/2 md:pr-24 text-right order-3 md:order-1">
            <div className="text-on-surface-variant font-mono text-sm tracking-widest opacity-40">{marker}</div>
          </div>
          <div className="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0">
            <div className={`w-4 h-4 rounded-full ${dotColor} border-4 border-surface ${shadow}`} />
          </div>
          <div className="w-full md:w-1/2 md:pl-24 order-2">
            <TimelineCard
              align="right"
              card={card}
              cover={cover}
              ownerAuthenticated={ownerAuthenticated}
              viewed={viewed}
              onDelete={onDelete}
              onEdit={onEdit}
              onOpen={onOpen}
            />
          </div>
        </>
      )}
    </div>
  );
}

function EmptyTimelineCreateNode({
  marker,
  onCreate
}: {
  marker: string;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full group">
      <div className="w-full md:w-1/2 md:pr-24 flex justify-end order-2 md:order-1">
        <div className="relative max-w-sm w-full">
          <button
            className="border-2 border-dashed border-outline-variant/30 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group w-full"
            onClick={onCreate}
            type="button"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20 text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <span className="text-base font-normal tracking-normal text-on-surface-variant group-hover:text-primary transition-colors">新增故事卡片</span>
          </button>
        </div>
      </div>
      <div className="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0">
        <div className="w-4 h-4 rounded-full bg-primary border-4 border-surface shadow-[0_0_15px_rgba(224,142,254,0.6)]" />
      </div>
      <div className="w-full md:w-1/2 md:pl-24 order-3">
        <div className="text-on-surface-variant font-mono text-sm tracking-widest opacity-40">{marker}</div>
      </div>
    </div>
  );
}

function TimelineCard({
  align,
  card,
  cover,
  ownerAuthenticated,
  viewed,
  onDelete,
  onEdit,
  onOpen
}: {
  align: "left" | "right";
  card: StoryCardDto;
  cover: string;
  ownerAuthenticated: boolean;
  viewed: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="relative max-w-sm w-full">
      {ownerAuthenticated ? (
        <div className="edit-trigger absolute -top-4 -right-4 flex gap-2 z-20">
          <button
            className="w-10 h-10 rounded-full bg-surface-bright border border-outline-variant text-on-surface hover:text-primary transition-colors flex items-center justify-center shadow-lg"
            onClick={onEdit}
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            className="w-10 h-10 rounded-full bg-surface-bright border border-outline-variant text-on-surface hover:text-error transition-colors flex items-center justify-center shadow-lg"
            onClick={onDelete}
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      ) : null}
      <div
        className={`absolute -inset-4 ${align === "left" ? "bg-primary-container/10" : "bg-tertiary/10"} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <button
        className={`relative text-left bg-surface-container-high/60 backdrop-blur-xl rounded-lg p-6 border border-outline-variant/20 ${
          align === "left" ? "hover:border-primary/40" : "hover:border-tertiary/40"
        } transition-all duration-300 cursor-pointer overflow-hidden card-glow w-full`}
        onClick={onOpen}
      >
        <div className="relative">
          <img
            alt={card.title}
            className="w-full h-48 object-cover rounded-md mb-6 grayscale group-hover:grayscale-0 transition-all duration-700"
            src={cover}
          />
        </div>
        <div className="absolute inset-x-6 top-6 h-16 rounded-full bg-white/5 blur-2xl opacity-60" />
        <h3 className="text-[1.22rem] md:text-[1.3rem] font-bold tracking-tight text-white mb-2 relative">{card.title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3">{card.summary}</p>
      </button>
    </div>
  );
}

function ProfileOverlay({
  profile,
  cardCount,
  ownerAuthenticated,
  onClose,
  onEditProfile,
  onReturnHome
}: {
  profile: ProfileDto;
  cardCount: number;
  ownerAuthenticated: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onReturnHome: () => void;
}) {
  const nameParts = splitProfileDisplayName(profile.name);
  const nameNeedsGap = Boolean(nameParts.lead && nameParts.accent && /[A-Za-z0-9]$/.test(nameParts.lead) && /^[A-Za-z0-9]/.test(nameParts.accent));

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <div className="fixed inset-0 nebula-bg -z-10 bg-surface-container-lowest" />
      <div className="fixed top-20 right-[-100px] w-56 h-56 bg-tertiary/5 rounded-full blur-[80px] -z-10" />
      <div className="fixed bottom-10 left-[-100px] w-72 h-72 bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="relative flex justify-center min-h-screen w-full px-6 py-4 items-start pt-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="glass-panel relative w-full max-w-lg rounded-xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center px-6 py-8 text-center">
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant transition-all duration-300 active:scale-90 group aspect-square flex items-center justify-center w-10 h-10"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary-container/40 rounded-full blur-2xl scale-110 group-hover:bg-tertiary/60 transition-all duration-700 animate-neon-pulse" />
            <div className="relative w-32 h-32 rounded-full border-2 border-white/10 p-2 bg-surface-container-high/40 backdrop-blur-md">
              <img alt="Dora The Explorer Profile" className="w-full h-full rounded-full object-cover" src={resolveProfileAvatar(profile.avatarImagePath)} />
            </div>
            <div className="absolute bottom-3 right-3 w-3.5 h-3.5 bg-[#81ecff] rounded-full border-[2.5px] border-surface shadow-[0_0_10px_rgba(129,236,255,0.7)]" />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-tertiary font-label text-[10px] uppercase tracking-[0.3em] mb-1 block">THE STAR TRAVELLER</span>
              <h1 className="font-bold tracking-tighter text-on-surface mb-2 text-2xl md:text-3xl">
                {nameParts.lead}
                {nameNeedsGap ? " " : ""}
                {nameParts.accent ? (
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-container to-tertiary">{nameParts.accent}</span>
                ) : null}
              </h1>
            </div>

            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto font-light tracking-wide italic px-4">
              {profile.bio}
              {ownerAuthenticated ? (
                <button
                  className="inline-flex items-center gap-1 ml-2 text-tertiary font-label text-[10px] uppercase tracking-[0.3em] hover:opacity-80 transition-opacity"
                  onClick={onEditProfile}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                  编辑资料
                </button>
              ) : null}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-4 w-full max-w-sm mx-auto">
              <div className="bg-white/5 rounded-lg py-2 px-1 border border-white/5">
                <div className="text-primary text-lg font-bold">{LEVELS.length}</div>
                <div className="text-on-surface-variant text-[9px] uppercase tracking-widest mt-0.5">星图</div>
              </div>
              <div className="bg-white/5 rounded-lg py-2 px-1 border border-white/5">
                <div className="text-tertiary text-lg font-bold">{cardCount}</div>
                <div className="text-on-surface-variant text-[9px] uppercase tracking-widest mt-0.5">故事</div>
              </div>
              <div className="bg-white/5 rounded-lg py-2 px-1 border border-white/5">
                <div className="text-on-surface text-lg font-bold">1.2k</div>
                <div className="text-on-surface-variant text-[9px] uppercase tracking-widest mt-0.5">访问</div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center w-full">
              <button
                className="bg-gradient-to-br from-primary-container to-primary-dim text-on-primary-container px-10 py-3.5 rounded-full font-bold text-sm tracking-[0.18em] uppercase shadow-[0_0_15px_rgba(224,142,254,0.3)] hover:shadow-[0_0_25px_rgba(129,236,255,0.4)] transition-all duration-300 active:scale-95"
                onClick={onReturnHome}
                type="button"
              >
                追随航程
              </button>
              <button className="bg-surface-container-highest/60 border border-white/10 text-on-surface px-10 py-3.5 rounded-full font-bold text-sm tracking-[0.18em] uppercase hover:bg-white/10 transition-all duration-300 active:scale-95">
                星枢传讯
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PinOverlay({
  pin,
  setPin,
  submitting,
  onClose,
  onSubmit
}: {
  pin: string;
  setPin: (value: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[30px] p-4 overflow-hidden">
      <div className="nebula-orb w-[600px] h-[600px] bg-primary-container top-10 left-[-120px] rounded-full" />
      <div className="nebula-orb w-[400px] h-[400px] bg-tertiary bottom-[-80px] right-[-80px] rounded-full" />
      <form
        className="glass-pane w-full max-w-md mx-4 p-10 rounded-xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden"
        onSubmit={onSubmit}
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/10 blur-3xl rounded-full" />
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-8 border border-outline-variant/20">
            <span className="material-symbols-outlined text-[#e08efe] text-3xl">lock_open</span>
          </div>
          <h2 className="font-bold tracking-tighter text-on-surface mb-2 text-2xl md:text-3xl">进入编辑模式</h2>
          <p className="text-on-surface-variant text-sm mb-10 tracking-wide">请输入安全访问密码，以编辑我的世界。</p>
          <div className={`w-full mb-10 group transition-all ${focused ? "drop-shadow-[0_4px_10px_rgba(224,142,254,0.1)]" : ""}`}>
            <input
              className="w-full bg-transparent border-0 border-b-2 border-outline-variant/30 text-center text-xl tracking-[1.15em] font-light py-2 focus:ring-0 focus:border-transparent transition-all placeholder:text-surface-container-highest focus:placeholder-transparent outline-none"
              maxLength={4}
              onBlur={() => setFocused(false)}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              onFocus={() => setFocused(true)}
              placeholder="••••"
              style={{ borderImage: `linear-gradient(to right, transparent, ${focused ? "#e08efe" : "#484848"}, transparent) 1` }}
              type="password"
              value={pin}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-center gap-4 w-full">
          <button
            className="w-full sm:w-[42%] py-3.5 px-8 rounded-full border border-outline-variant/20 bg-white/5 hover:bg-white/10 text-on-surface font-bold text-sm tracking-[0.18em] transition-all active:scale-95"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="w-full sm:w-[42%] py-3.5 px-8 rounded-full soul-gradient text-black font-bold text-sm tracking-[0.18em] shadow-[0_0_20px_rgba(224,142,254,0.3)] hover:shadow-[0_0_30px_rgba(129,236,255,0.4)] hover:brightness-110 transition-all active:scale-95"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "确认中..." : "确认"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileEditorOverlay({
  draft,
  saving,
  onChange,
  onClose,
  onOpenAvatar,
  onSave
}: {
  draft: ProfileDraft;
  saving: boolean;
  onChange: (draft: ProfileDraft) => void;
  onClose: () => void;
  onOpenAvatar: () => void;
  onSave: () => void;
}) {
  const bioTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const target = bioTextareaRef.current;
    if (!target) {
      return;
    }

    target.style.height = "0px";
    target.style.height = `${target.scrollHeight}px`;
  }, [draft.bio]);

  return (
    <div className="fixed inset-0 z-[105] bg-surface flex flex-col h-screen overflow-hidden">
      <div className="nebula-glow bg-primary-container/20 absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[120px]" />
      <div className="nebula-glow bg-tertiary/20 absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full blur-[120px]" />
      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full translate-y-4 md:translate-y-6">
        <section className="w-full flex flex-col items-center mb-5 relative shrink-0">
          <div className="relative group flex flex-col items-center">
            <div className="absolute inset-0 rounded-full bg-[#e08efe]/12 blur-3xl group-hover:bg-[#e08efe]/20 transition-all duration-700 scale-110" />
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-outline-variant/20 to-transparent shadow-[0_0_20px_rgba(224,142,254,0.15)]">
              <img alt="Architect Profile" className="w-full h-full object-cover rounded-full" src={resolveProfileAvatar(draft.avatarImagePath)} />
              <button
                className="absolute bottom-1 right-1 bg-primary-container text-on-primary-container p-2 rounded-full shadow-[0_0_10px_rgba(224,142,254,0.3)] hover:scale-110 transition-transform duration-300 cursor-pointer"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onOpenAvatar();
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
              </button>
            </div>
            <div className="mt-4 text-center">
              <h1 className="font-bold tracking-tighter text-2xl md:text-3xl mb-2">
                编辑您的 <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e08efe] to-[#81ecff]">星际身份</span>
              </h1>
              <p className="text-on-surface-variant uppercase tracking-[0.3em] text-[8px] font-bold mt-2">THE STAR TRAVELLER</p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-2xl">
          <div className="glass-panel p-6 md:p-7 rounded-xl border border-outline-variant/10 shadow-2xl shadow-fuchsia-900/5">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="relative group">
                  <label className="block uppercase tracking-[0.2em] font-black text-primary mb-1 text-[12px]">星际身份名称</label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant/20 py-1.5 pl-4 text-base md:text-lg font-medium text-on-surface focus:ring-0 focus:border-primary focus:outline-none focus-visible:outline-none shadow-none transition-colors duration-300 placeholder-on-surface-variant/30 caret-white"
                    onChange={(event) =>
                      onChange({
                        ...draft,
                        name: event.target.value
                      })
                    }
                    placeholder="请输入您的身份名称..."
                    type="text"
                    value={draft.name}
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary-container to-tertiary group-focus-within:w-full transition-all duration-500" />
                </div>

                <div className="relative group">
                  <label className="block uppercase tracking-[0.2em] font-black text-primary mb-1 text-[12px]">个人简介与星际寄语</label>
                  <textarea
                    className="w-full bg-transparent border-0 border-b border-outline-variant/20 pt-1.5 pb-2.5 pl-4 text-sm md:text-base font-light leading-relaxed focus:ring-0 focus:border-primary focus:outline-none focus-visible:outline-none shadow-none transition-colors duration-300 resize-none placeholder-on-surface-variant/30 overflow-hidden"
                    ref={bioTextareaRef}
                    onChange={(event) =>
                      onChange({
                        ...draft,
                        bio: event.target.value
                      })
                    }
                    onInput={(event) => {
                      event.currentTarget.style.height = "0px";
                      event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    }}
                    placeholder="请输入您的个人简介和星际寄语..."
                    rows={3}
                    value={draft.bio.replace(/[“”]/g, "")}
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary-container to-tertiary group-focus-within:w-full transition-all duration-500" />
                </div>
              </div>

              <div className="flex flex-row items-center justify-end gap-3 pt-2">
                <button
                  className="px-5 py-3 rounded-full text-on-surface-variant font-bold hover:text-on-surface transition-all duration-300 text-sm tracking-[0.18em] uppercase"
                  onClick={onClose}
                >
                  取消更改
                </button>
                <button
                  className="px-8 py-3.5 rounded-full bg-gradient-to-tr from-primary-container to-primary-dim text-on-primary-container font-bold shadow-[0_0_15px_rgba(224,142,254,0.2)] hover:shadow-[0_0_25px_rgba(224,142,254,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm tracking-[0.18em] uppercase"
                  disabled={saving}
                  onClick={onSave}
                >
                  {saving ? "保存中..." : "保存身份"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-2 shrink-0" />
    </div>
  );
}

function AvatarGeneratorOverlay({
  draft,
  candidates,
  onDraftChange,
  onCandidatesChange,
  onBack,
  onSaveSelection
}: {
  draft: ProfileDraft;
  candidates: string[];
  onDraftChange: (draft: ProfileDraft) => void;
  onCandidatesChange: (candidates: string[]) => void;
  onBack: () => void;
  onSaveSelection: (avatarImagePath: string) => void;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prompt = draft.avatarPromptJson ?? {};
  const normalizedPrompt = normalizeAvatarPrompt(draft.avatarPromptJson);
  const displayPrompt = {
    hair: HAIRSTYLE_OPTIONS.includes(prompt.hair as (typeof HAIRSTYLE_OPTIONS)[number]) ? prompt.hair! : DEFAULT_AVATAR_PROMPT.hair,
    expression: EXPRESSION_OPTIONS.includes(prompt.expression as (typeof EXPRESSION_OPTIONS)[number]) ? prompt.expression! : DEFAULT_AVATAR_PROMPT.expression,
    style: STYLE_OPTIONS.includes(prompt.style as (typeof STYLE_OPTIONS)[number]) ? prompt.style! : DEFAULT_AVATAR_PROMPT.style,
    palette: typeof prompt.palette === "string" && prompt.palette.trim() ? prompt.palette : DEFAULT_AVATAR_PROMPT.palette,
    outfit: typeof prompt.outfit === "string" ? prompt.outfit : "",
    notes: typeof prompt.notes === "string" ? prompt.notes : ""
  };
  const paletteOptions = [
    { key: "lavender", colorClass: "bg-primary-container" },
    { key: "cyan", colorClass: "bg-tertiary" },
    { key: "sage", colorClass: "bg-secondary-dim" },
    { key: "rose", colorClass: "bg-error-dim" }
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const target = notesTextareaRef.current;
    if (!target) {
      return;
    }

    target.style.height = "0px";
    target.style.height = `${target.scrollHeight}px`;
  }, [displayPrompt.notes]);

  useEffect(() => {
    if (!candidates.length) {
      setSelectedCandidate(null);
      return;
    }

    setSelectedCandidate((current) => {
      if (current && candidates.includes(current)) {
        return current;
      }

      return candidates[1] ?? candidates[0] ?? null;
    });
  }, [candidates]);

  async function generateCandidates(regenerate = false) {
    setWorking(true);
    setError(null);

    try {
      const result = await api<AvatarCandidatesDto>("/api/profile/avatar/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...normalizedPrompt,
          ...(regenerate ? { previousCandidates: candidates } : {})
        })
      });
      const nextCandidates =
        regenerate && candidates.length && result.candidates.every((candidate, index) => candidate === candidates[index])
          ? [...result.candidates.slice(1), result.candidates[0]]
          : result.candidates;

      onCandidatesChange(nextCandidates);
      setSelectedCandidate(nextCandidates[1] ?? nextCandidates[0] ?? null);
      if (nextCandidates.length) {
        onDraftChange({
          ...draft,
          avatarPromptJson: draft.avatarPromptJson
        });
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "头像生成失败，请稍后重试。");
    } finally {
      setWorking(false);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generateCandidates();
  }

  function patchPrompt<K extends keyof AvatarPromptDto>(key: K, value: AvatarPromptDto[K]) {
    onDraftChange({
      ...draft,
      avatarPromptJson: {
        ...draft.avatarPromptJson,
        [key]: value
      }
    });
  }

  function handleSaveSelection() {
    if (!selectedCandidate) {
      onBack();
      return;
    }

    onSaveSelection(selectedCandidate);
  }

  return (
    <div className="fixed inset-0 z-[110] min-h-screen w-screen overflow-y-auto bg-[#0e0e0e] text-on-surface">
      <div className="nebula-orb w-[800px] h-[800px] bg-primary-container -top-48 -left-48" />
      <div className="nebula-orb w-[600px] h-[600px] bg-tertiary -bottom-48 -right-48" />
      <main className="w-full max-w-7xl min-h-screen mx-auto flex flex-col gap-6 lg:gap-7 relative z-10 px-8 lg:px-12 py-5 lg:py-6">
        <header className="flex justify-between items-center h-12 shrink-0 px-2">
          <button className="group flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors duration-300" onClick={onBack}>
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            <span className="text-[10px] font-bold tracking-widest uppercase">Go Back</span>
          </button>
          <div className="w-16" />
        </header>

        <header className="flex flex-col md:flex-row md:items-start justify-between gap-3 px-2">
          <h1 className="font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-container via-primary-dim to-tertiary text-2xl md:text-3xl">
            生成星际头像
          </h1>
          <div className="md:text-right md:pt-3">
            <p className="text-on-surface-variant font-medium text-base">编辑您的星际身份</p>
            <div className="flex items-center gap-2 md:justify-end mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              <span className="text-[9px] uppercase tracking-widest text-tertiary font-bold">Neural Link Active</span>
            </div>
          </div>
        </header>

        <div className="glass-panel rounded-lg overflow-hidden flex flex-col lg:flex-row min-h-[640px] shadow-2xl">
          <aside className="w-full p-8 border-b lg:border-b-0 lg:border-r border-outline-variant/10 flex flex-col justify-between lg:w-[460px]">
            <form className="space-y-6" onSubmit={handleGenerate}>
              <label className="block">
                <div className="block text-xs font-semibold text-on-surface-variant/90 mb-2.5 ml-1">发型</div>
                <div className="relative">
                  <select
                    aria-label="发型"
                    className="w-full appearance-none bg-transparent border-0 border-b-[1.25px] border-outline-variant/30 focus:border-primary-container focus:ring-0 text-on-surface text-sm font-medium transition-all py-3 pl-1 pr-10 outline-none cursor-pointer shadow-none bg-none"
                    onChange={(event) => patchPrompt("hair", event.target.value)}
                    style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none", backgroundImage: "none" }}
                    value={displayPrompt.hair}
                  >
                    {HAIRSTYLE_OPTIONS.map((option) => (
                      <option className="bg-surface-container" key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant/72">
                    <svg aria-hidden="true" className="h-[14px] w-[14px]" fill="none" viewBox="0 0 14 14">
                      <path d="M2.75 4.75L7 9L11.25 4.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                    </svg>
                  </div>
                </div>
              </label>

              <label className="block">
                <div className="block text-xs font-semibold text-on-surface-variant/90 mb-2.5 ml-1">表情</div>
                <div className="relative">
                  <select
                    aria-label="表情"
                    className="w-full appearance-none bg-transparent border-0 border-b-[1.25px] border-outline-variant/30 focus:border-primary-container focus:ring-0 text-on-surface text-sm font-medium transition-all py-3 pl-1 pr-10 outline-none cursor-pointer shadow-none bg-none"
                    onChange={(event) => patchPrompt("expression", event.target.value)}
                    style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none", backgroundImage: "none" }}
                    value={displayPrompt.expression}
                  >
                    {EXPRESSION_OPTIONS.map((option) => (
                      <option className="bg-surface-container" key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant/72">
                    <svg aria-hidden="true" className="h-[14px] w-[14px]" fill="none" viewBox="0 0 14 14">
                      <path d="M2.75 4.75L7 9L11.25 4.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                    </svg>
                  </div>
                </div>
              </label>

              <div className="group">
                <div className="block text-xs font-semibold text-on-surface-variant mb-4 ml-1">艺术风格</div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {STYLE_OPTIONS.map((option) => (
                    <button
                      className={`py-3 px-4 rounded-full border text-[13px] font-bold ${
                        displayPrompt.style === option
                          ? "border-primary-container text-primary-container bg-primary-container/10"
                          : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                      }`}
                      key={option}
                      onClick={() => patchPrompt("style", option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group">
                <div className="block text-xs font-semibold text-on-surface-variant mb-4 ml-1">配色方案</div>
                <div className="flex gap-4">
                  {paletteOptions.map((palette) => {
                    const selected = displayPrompt.palette === palette.key;
                    return (
                      <button
                        aria-label={`选择${palette.key}配色`}
                        className={`relative w-8 h-8 rounded-full cursor-pointer ${palette.colorClass} transition-transform ${
                          selected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-[0_0_0_1px_rgba(14,14,14,0.8),0_0_18px_rgba(224,142,254,0.2)]"
                            : "hover:scale-110"
                        }`}
                        key={palette.key}
                        onClick={() => patchPrompt("palette", palette.key)}
                        type="button"
                      />
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <div className="block text-xs font-semibold text-on-surface-variant/90 mb-2.5 ml-1">服装样式</div>
                <div className="relative">
                  <input
                    aria-label="服装样式"
                    className="w-full bg-transparent border-0 border-b-[1.25px] border-outline-variant/30 focus:border-primary-container focus:ring-0 text-on-surface text-sm font-medium transition-all py-3 px-1 placeholder:text-outline-variant/50 outline-none"
                    onChange={(event) => patchPrompt("outfit", event.target.value)}
                    placeholder="学院风"
                    type="text"
                    value={displayPrompt.outfit}
                  />
                </div>
              </label>

              <label className="block">
                <div className="block text-xs font-semibold text-on-surface-variant/90 mb-2.5 ml-1">补充说明</div>
                <div className="relative">
                  <textarea
                    aria-label="补充说明"
                    className="w-full bg-transparent border-0 border-b-[1.25px] border-outline-variant/30 focus:border-primary-container focus:ring-0 text-on-surface text-sm font-medium leading-normal transition-all py-3 px-1 placeholder:text-outline-variant/50 resize-none overflow-hidden outline-none"
                    onChange={(event) => patchPrompt("notes", event.target.value)}
                    onInput={(event) => {
                      event.currentTarget.style.height = "0px";
                      event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    }}
                    placeholder="像游戏主角一样，安静但有发光感。"
                    ref={notesTextareaRef}
                    rows={1}
                    value={displayPrompt.notes}
                  />
                </div>
              </label>

              <button
                className="w-full py-5 rounded-full bg-gradient-to-r from-primary-container to-primary-dim text-on-primary-container font-bold tracking-[0.18em] text-sm shadow-xl shadow-primary-container/20 hover:shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all mt-8 flex items-center justify-center gap-2.5"
                disabled={working}
                type="submit"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
                >
                  auto_awesome
                </span>
                {working ? "生成中..." : "生成星际头像"}
              </button>
              {error ? <p className="text-[11px] text-error mt-3 ml-1">{error}</p> : null}
            </form>
          </aside>

          <section className="flex-1 flex justify-center bg-surface-container-low/10 items-start px-8 pt-8 pb-0">
            <div className="floating-glass-card rounded-lg w-full flex flex-col h-[560px] max-h-[560px] shadow-[0_18px_42px_-12px_rgba(0,0,0,0.42),0_0_18px_rgba(224,142,254,0.05),0_0_28px_rgba(129,236,255,0.025),inset_0_0_12px_rgba(224,142,254,0.03)]">
              <div className="flex flex-col h-full justify-between py-11 px-8">
                <div className="flex items-center justify-center">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant/90 flex items-center gap-6">
                    <span className="w-16 h-[2px] bg-gradient-to-r from-transparent via-outline-variant/75 to-transparent" />
                    {candidates.length ? "神经已连接" : "神经已断开"}
                    <span className="w-16 h-[2px] bg-gradient-to-r from-transparent via-outline-variant/75 to-transparent" />
                  </h3>
                </div>

                {candidates.length ? (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                      <div className="absolute w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                        <div className="w-96 h-96 bg-primary-container/10 rounded-full blur-[60px] nebula-core" />
                        <div className="absolute w-80 h-80 bg-tertiary/10 rounded-full blur-[40px] nebula-layer-2" />
                      </div>
                      <div className="grid grid-cols-3 gap-9 lg:gap-11 w-full max-w-[700px] mx-auto items-center relative z-10">
                        {candidates.slice(0, 3).map((item, index) => {
                          const selected = selectedCandidate === item;

                          if (selected) {
                            return (
                              <div className="flex flex-col items-center" key={item}>
                              <button
                                className="relative w-full aspect-square rounded-full border-[1.5px] border-tertiary/95 z-20 cursor-pointer transition-all duration-300 shadow-[0_0_12px_rgba(168,241,255,0.14)]"
                                onClick={() => setSelectedCandidate(item)}
                                  type="button"
                                >
                                  <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <img alt="Selected generated avatar" className="w-full h-full object-cover" src={item} />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-tertiary/10 to-transparent rounded-full" />
                                  <div className="absolute -top-1 -right-1 bg-tertiary text-on-tertiary w-[23px] h-[23px] rounded-full shadow-[0_0_8px_rgba(168,241,255,0.08)] flex items-center justify-center border-2 border-surface z-30">
                                    <span className="material-symbols-outlined text-xs font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      check
                                    </span>
                                    </div>
                                </button>
                                <span className="text-[10px] font-black text-tertiary tracking-[0.28em] uppercase mt-7 text-center">已选中</span>
                              </div>
                            );
                          }

                          return (
                              <div className="flex flex-col items-center" key={item}>
                              <button
                                className="relative w-full aspect-square rounded-full overflow-hidden border border-white/12 transition-all duration-300 cursor-pointer group hover:border-tertiary/70 hover:shadow-[0_0_10px_rgba(168,241,255,0.08)]"
                                onClick={() => setSelectedCandidate(item)}
                                type="button"
                              >
                                <img
                                  alt={`Generated avatar ${index + 1}`}
                                  className="w-full h-full object-cover grayscale-[0.8] opacity-55 group-hover:grayscale-[0.12] group-hover:opacity-88 transition-all duration-300"
                                  src={item}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-5 mt-7">
                      <button
                        className="text-sm font-bold tracking-[0.18em] text-on-surface-variant/78 hover:text-on-surface transition-all min-w-[78px]"
                        disabled={working}
                        onClick={() => void generateCandidates(true)}
                        type="button"
                      >
                        {working ? "重新生成中..." : "重新生成"}
                      </button>
                      <button
                        className="text-sm font-bold tracking-[0.18em] text-tertiary border border-tertiary/20 px-5 py-3 rounded-full bg-tertiary/10 hover:bg-tertiary/16 shadow-[0_0_14px_rgba(168,241,255,0.08)] transition-all min-w-[132px]"
                        onClick={handleSaveSelection}
                        type="button"
                      >
                        保存选择
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary-container/15 rounded-full blur-[40px] nebula-core" />
                        <div className="absolute inset-4 bg-tertiary/10 rounded-full blur-[30px] nebula-layer-2" />
                        <div className="absolute inset-8 bg-primary/20 rounded-full blur-[20px] animate-pulse" />
                        <div className="relative w-32 h-32 rounded-full border border-primary-container/20 flex items-center justify-center bg-surface-container/20 backdrop-blur-md shadow-inner overflow-hidden">
                          <span className="material-symbols-outlined text-4xl text-primary-fixed-dim/60 animate-subtle-pulse">auto_mode</span>
                        </div>
                      </div>
                      <div className="mt-12 text-center space-y-2">
                        <p className="text-primary-fixed-dim font-bold tracking-widest text-base">准备合成</p>
                        <p className="text-xs text-on-surface-variant/50 uppercase tracking-[0.2em]">等待生成参数</p>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-center">
                      <div className="text-xs font-bold uppercase tracking-[0.4em] text-primary/60 border border-primary/10 px-12 py-4 rounded-full bg-primary/5 shadow-[0_0_15px_rgba(231,161,255,0.05)]">
                        系统就绪
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function CardDetailOverlay({
  card,
  ownerAuthenticated,
  onClose,
  onDelete,
  onEdit
}: {
  card: StoryCardDto;
  ownerAuthenticated: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const images = parseImagePaths(card);
  const videoUrl = card.mediaType === "video" ? toEmbeddableVideoUrl(card.mediaPathOrUrl) : null;
  const isNativeVideo = Boolean(videoUrl && (videoUrl.startsWith("/uploads/") || videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".mov")));
  const immersiveLayout = card.mediaType === "image";
  const [videoActivated, setVideoActivated] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const detailCloseButtonClass =
    "absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant transition-all duration-300 active:scale-90 group aspect-square flex items-center justify-center w-10 h-10";
  const detailTitleClass = "text-[1.68rem] md:text-[2rem] font-black tracking-tight text-white leading-[1.08]";
  const detailOwnerActionsClass = "ml-auto mr-6 md:mr-8 flex items-center gap-2 shrink-0";
  const detailEditButtonClass =
    "flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group active:scale-95";
  const detailDeleteButtonClass =
    "flex items-center gap-1 px-2 py-1 rounded-full bg-error/10 hover:bg-error/20 border border-error/20 transition-all duration-300 group active:scale-95";

  useEffect(() => {
    setVideoActivated(false);
  }, [card.id, card.mediaPathOrUrl]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [card.id, card.mediaPathOrUrl]);

  if (immersiveLayout) {
    return (
      <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-[20px] flex items-center justify-center p-4 md:p-8">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-lowest overflow-hidden blur-[100px] opacity-30 scale-105">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-container/20 rounded-full mix-blend-screen blur-[150px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-tertiary-container/20 rounded-full mix-blend-screen blur-[150px]" />
          </div>
          <div className="flex flex-col items-center justify-center h-full space-y-32 opacity-60">
            <div className="w-[90%] h-px bg-outline-variant/20 relative">
              <div className="absolute -top-4 left-[20%] w-12 h-12 rounded-full bg-primary/10 border border-primary/20" />
              <div className="absolute -top-6 left-[50%] w-16 h-16 rounded-full bg-tertiary/10 border border-tertiary/20" />
              <div className="absolute -top-4 left-[80%] w-12 h-12 rounded-full bg-primary/10 border border-primary/20" />
            </div>
          </div>
        </div>
        <main
          className="glass-panel immersive-ghost-border relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-lg shadow-[0px_40px_100px_rgba(0,0,0,0.6),0px_0px_60px_rgba(224,142,254,0.08)] flex flex-col"
          style={{ background: "rgba(14, 14, 14, 0.45)" }}
        >
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-container/5 blur-[120px] pointer-events-none" />
          <button
            className={`${detailCloseButtonClass} z-50`}
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <div className="p-8 md:p-10 lg:p-12 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 h-full overflow-hidden">
            <div className="flex-shrink-0 w-full lg:w-[45%] h-64 lg:h-auto">
              <div className="relative w-full h-full group">
                <div className="absolute -top-12 -left-12 w-48 h-48 nebula-glow opacity-50" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 nebula-glow opacity-30" />
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/5 shadow-2xl">
                  <img
                    alt={card.title}
                    className="w-full h-full object-cover scale-[1.3] group-hover:scale-125 transition-transform duration-1000"
                    src={images[activeImageIndex] ?? images[0]}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {images.length > 1 ? (
                    <>
                      <button
                        aria-label="查看下一张图片"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/12 backdrop-blur-md text-white/72 hover:text-white hover:bg-white/18 transition-all duration-300 flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.14)]"
                        onClick={() => setActiveImageIndex((current) => (current === images.length - 1 ? 0 : current + 1))}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar pr-2">
              <div className="flex items-center mb-4 gap-3 flex-wrap">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary-dim bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {card.themeKey}
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/60">{formatEpochDate(card.createdAt)}</span>
                {ownerAuthenticated ? (
                  <div className={detailOwnerActionsClass}>
                    <button className={detailEditButtonClass} onClick={onEdit}>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:text-white">edit</span>
                      <span className="text-[10px] font-bold tracking-wider text-on-surface-variant group-hover:text-white uppercase">编辑</span>
                    </button>
                    <button className={detailDeleteButtonClass} onClick={onDelete}>
                      <span className="material-symbols-outlined text-[14px] text-error group-hover:text-error-dim">delete</span>
                      <span className="text-[10px] font-bold tracking-wider text-error group-hover:text-error-dim uppercase">删除</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <h1 className={`${detailTitleClass} mb-6`}>{card.title}</h1>

              <div className="pl-4 border-l border-primary-dim/30 mb-8">
                <p className="text-lg font-light italic leading-relaxed text-on-surface-variant">“{card.summary}”</p>
              </div>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/80 flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-primary/60" />
                  背后的故事
                </h3>
                <div className="space-y-4 text-sm md:text-base font-normal leading-[1.7] text-on-surface-variant/90">
                  {splitReflectionParagraphs(card.reflection).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-[20px] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-surface-container-lowest overflow-hidden blur-[100px] opacity-30 scale-105">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-container/20 rounded-full mix-blend-screen blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-tertiary-container/20 rounded-full mix-blend-screen blur-[150px]" />
        </div>
        <div className="flex flex-col items-center justify-center h-full space-y-32 opacity-60">
          <div className="w-[90%] h-px bg-outline-variant/20 relative">
            <div className="absolute -top-4 left-[20%] w-12 h-12 rounded-full bg-primary/10 border border-primary/20" />
            <div className="absolute -top-6 left-[50%] w-16 h-16 rounded-full bg-tertiary/10 border border-tertiary/20" />
            <div className="absolute -top-4 left-[80%] w-12 h-12 rounded-full bg-primary/10 border border-primary/20" />
          </div>
        </div>
      </div>
      <article
        className="glass-panel immersive-ghost-border relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-lg shadow-[0px_40px_100px_rgba(0,0,0,0.6),0px_0px_60px_rgba(224,142,254,0.08)] flex flex-col"
        style={{ background: "rgba(14, 14, 14, 0.45)" }}
      >
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-container/5 blur-[120px] pointer-events-none" />
        <button
          className={`${detailCloseButtonClass} z-50`}
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="p-8 md:p-10 lg:p-12 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 h-full overflow-hidden">
          <div className="flex-shrink-0 w-full lg:w-[45%] h-64 lg:h-auto">
            <div className="relative w-full h-full group">
              <div className="absolute -top-12 -left-12 w-48 h-48 nebula-glow opacity-50" />
              <div className="absolute -bottom-12 -right-12 w-48 h-48 nebula-glow opacity-30" />
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/5 shadow-2xl bg-black">
                {videoActivated && isNativeVideo && videoUrl ? (
                  <video className="absolute inset-0 w-full h-full object-cover" controls autoPlay playsInline src={videoUrl} />
                ) : videoActivated && videoUrl ? (
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    src={withAutoplayVideoUrl(videoUrl)}
                    title={card.title}
                  />
                ) : (
                  <img
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover scale-[1.3] group-hover:scale-125 transition-transform duration-1000"
                    src={getVideoPosterUrl(card.mediaPathOrUrl, card.title)}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {!videoActivated ? (
                  <button
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={() => setVideoActivated(true)}
                    type="button"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary-container/20 backdrop-blur-md flex items-center justify-center border border-primary-container/30 hover:scale-105 transition-transform cursor-pointer">
                      <span className="material-symbols-outlined text-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar pr-2">
            <div className="flex items-center mb-4 gap-3 flex-wrap">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary-dim bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {card.themeKey}
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/60">{formatEpochDate(card.createdAt)}</span>
              {ownerAuthenticated ? (
                <div className={detailOwnerActionsClass}>
                  <button className={detailEditButtonClass} onClick={onEdit}>
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:text-white">edit</span>
                    <span className="text-[10px] font-bold tracking-wider text-on-surface-variant group-hover:text-white uppercase">编辑</span>
                  </button>
                  <button className={detailDeleteButtonClass} onClick={onDelete}>
                    <span className="material-symbols-outlined text-[14px] text-error group-hover:text-error-dim">delete</span>
                    <span className="text-[10px] font-bold tracking-wider text-error group-hover:text-error-dim uppercase">删除</span>
                  </button>
                </div>
              ) : null}
            </div>
            <h1 className={`${detailTitleClass} mb-6`}>{card.title}</h1>
            <div className="pl-4 border-l border-primary-dim/30 mb-8">
              <p className="text-lg font-light italic leading-relaxed text-on-surface-variant">“{card.summary}”</p>
            </div>
            <section className="space-y-4">
              <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/80 flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-primary/60" />
                背后的故事
              </h2>
              <div className="space-y-4 text-sm md:text-base font-normal leading-[1.7] text-on-surface-variant/90">
                {splitReflectionParagraphs(card.reflection).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            </div>
        </div>
      </article>
    </div>
  );
}

function DeleteOverlay({
  deleting,
  onCancel,
  onConfirm
}: {
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/55 backdrop-blur-[18px]">
      <div className="glass-panel relative w-full max-w-md rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-error to-transparent opacity-50" />
        <div className="px-8 pt-8 pb-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error-container/20 flex items-center justify-center mb-6 border border-error/20">
            <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-4 font-headline">删除故事卡片？</h2>
          <p className="text-on-surface-variant leading-relaxed mb-8 font-body text-base px-2">确定要删除这段记忆吗？此操作无法撤销。</p>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-4 w-full mt-4">
            <button
              className="w-full sm:w-[42%] py-3.5 px-8 rounded-full border border-outline-variant/20 bg-white/5 hover:bg-white/10 text-on-surface font-bold text-sm tracking-[0.18em] transition-all active:scale-95 order-2 sm:order-1"
              onClick={onCancel}
            >
              取消
            </button>
            <button
              className="w-full sm:w-[42%] py-3.5 px-8 rounded-full bg-error text-on-error font-bold text-sm tracking-[0.18em] hover:shadow-[0_0_20px_rgba(253,111,133,0.4)] transition-all duration-300 order-1 sm:order-2 active:scale-95"
              disabled={deleting}
              onClick={onConfirm}
            >
              {deleting ? "删除中..." : "删除"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardEditorOverlay({
  draft,
  saving,
  onClose,
  onSave
}: {
  draft: CardDraft;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: CardDraft) => void;
}) {
  const [localDraft, setLocalDraft] = useState(draft);
  const [uploading, setUploading] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState(draft.videoPath);

  useEffect(() => {
    setLocalDraft(draft);
    setVideoUrlInput(draft.videoPath);
  }, [draft]);

  function confirmClose() {
    if (
      localDraft.title !== draft.title ||
      localDraft.summary !== draft.summary ||
      localDraft.reflection !== draft.reflection ||
      JSON.stringify(localDraft.imagePaths) !== JSON.stringify(draft.imagePaths) ||
      localDraft.videoPath !== draft.videoPath
    ) {
      if (!window.confirm("内容尚未保存，确定要关闭吗？")) {
        return;
      }
    }

    onClose();
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setUploading(true);

    try {
      const uploaded: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await api<{ path: string }>("/api/upload", {
          method: "POST",
          body: formData
        });
        uploaded.push(result.path);
      }

      if (localDraft.mediaType === "image") {
        setLocalDraft((current) => ({
          ...current,
          imagePaths: [...current.imagePaths, ...uploaded].slice(0, 3)
        }));
      } else if (uploaded[0]) {
        setLocalDraft((current) => ({
          ...current,
          videoPath: uploaded[0]
        }));
        setVideoUrlInput(uploaded[0]);
      }
    } finally {
      setUploading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!localDraft.title || !localDraft.summary || !localDraft.reflection) {
      return;
    }

    if (localDraft.mediaType === "image" && !localDraft.imagePaths.length) {
      return;
    }

    if (localDraft.mediaType === "video" && !toEmbeddableVideoUrl(localDraft.videoPath)) {
      window.alert("请输入可嵌入的视频链接，或先上传短视频。");
      return;
    }

    onSave(localDraft);
  }

  const videoPreview = toEmbeddableVideoUrl(localDraft.videoPath);

  return (
    <div className="fixed inset-0 z-[115] bg-black/70 backdrop-blur-[24px] overflow-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <form className="glass-panel border border-white/5 rounded-[32px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.55)]" onSubmit={submit}>
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-0">
            <div className="p-8 md:p-10 space-y-8">
              <header>
                <div className="text-xs uppercase tracking-[0.3em] text-tertiary font-bold mb-2 block">故事架构师</div>
                <h2 className="text-3xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-container to-primary-dim">编辑故事卡片</h2>
              </header>

              <label className="block">
                <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">卡片主题</div>
                {localDraft.mode === "create" ? (
                  <select
                    className="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 rounded py-3.5 px-4 appearance-none text-on-surface focus:ring-0 focus:border-primary/50 transition-all cursor-pointer text-sm"
                    onChange={(event) => setLocalDraft((current) => ({ ...current, themeKey: event.target.value }))}
                    value={localDraft.themeKey}
                  >
                    {LEVEL_THEMES[localDraft.levelId].map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 rounded py-3.5 px-4 text-sm">
                    {localDraft.themeKey}
                  </div>
                )}
              </label>

              <label className="block">
                <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">故事标题</div>
                <input
                  className="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 focus:border-primary/50 text-xl font-bold tracking-tight text-on-surface placeholder:text-surface-container-highest px-5 py-4 focus:ring-0 transition-all outline-none focus:shadow-[0_0_20px_rgba(224,142,254,0.1)] rounded"
                  onChange={(event) => setLocalDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="输入节点名称..."
                  value={localDraft.title}
                />
              </label>

              <label className="block">
                <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">故事精华</div>
                <textarea
                  className="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 focus:border-tertiary/50 text-on-secondary-container italic py-4 px-5 focus:ring-0 transition-all outline-none focus:shadow-[0_0_20px_rgba(129,236,255,0.1)] resize-none rounded text-sm"
                  onChange={(event) => setLocalDraft((current) => ({ ...current, summary: event.target.value }))}
                  placeholder="一句话描述这个故事..."
                  rows={4}
                  value={localDraft.summary}
                />
              </label>
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-white/5 p-8 md:p-10 bg-white/[0.02] flex flex-col">
              <div className="space-y-10 flex-grow">
                <label className="block">
                  <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">故事细节与感悟</div>
                  <textarea
                    className="w-full bg-surface-container-low/40 backdrop-blur-md rounded border border-outline-variant/10 px-5 py-4 text-on-surface-variant leading-relaxed focus:ring-0 focus:border-tertiary/50 outline-none transition-all resize-none placeholder:text-on-surface-variant/30 focus:shadow-[0_0_20px_rgba(129,236,255,0.1)] text-sm min-h-40"
                    onChange={(event) => setLocalDraft((current) => ({ ...current, reflection: event.target.value }))}
                    placeholder="描述故事有趣的细节和个人反思..."
                    rows={7}
                    value={localDraft.reflection}
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">媒体上传</label>
                    <div className="flex bg-surface-container-high p-1 rounded-full ghost-border">
                      <button
                        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          localDraft.mediaType === "image"
                            ? "bg-gradient-to-br from-primary-container to-primary-dim text-on-primary shadow-lg"
                            : "text-on-surface-variant hover:text-on-surface transition-colors"
                        }`}
                        onClick={() => setLocalDraft((current) => ({ ...current, mediaType: "image", videoPath: "" }))}
                        type="button"
                      >
                        图片
                      </button>
                      <button
                        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          localDraft.mediaType === "video"
                            ? "bg-gradient-to-br from-primary-container to-primary-dim text-on-primary shadow-lg"
                            : "text-on-surface-variant hover:text-on-surface transition-colors"
                        }`}
                        onClick={() => setLocalDraft((current) => ({ ...current, mediaType: "video", imagePaths: [] }))}
                        type="button"
                      >
                        视频
                      </button>
                    </div>
                  </div>

                  {localDraft.mediaType === "image" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {Array.from({ length: 3 }).map((_, index) => {
                            const image = localDraft.imagePaths[index];
                            return image ? (
                              <div className="group relative rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant/20 hover:border-primary-container/50 transition-all shadow-xl aspect-[4/4.5]" key={image}>
                                <img alt="preview" className="w-full h-full object-cover" src={image} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-primary-container uppercase tracking-widest text-[10px]">{index === 0 ? "主图" : ""}</span>
                                    <button
                                      className="material-symbols-outlined text-error-dim hover:text-error"
                                      onClick={() =>
                                        setLocalDraft((current) => ({
                                          ...current,
                                          imagePaths: current.imagePaths.filter((item) => item !== image)
                                        }))
                                      }
                                      type="button"
                                    >
                                      delete
                                    </button>
                                  </div>
                                </div>
                                {index === 0 ? (
                                  <div className="absolute top-3 right-3 bg-primary-container/90 text-on-primary-container rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      check_circle
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <label
                                className="group rounded-xl border-2 border-dashed border-outline-variant/30 hover:border-tertiary/50 hover:bg-tertiary/5 transition-all flex flex-col items-center justify-center p-6 aspect-[4/4.5] gap-3"
                                key={index}
                              >
                                {uploading && index === localDraft.imagePaths.length ? (
                                  <div className="relative rounded-xl overflow-hidden bg-surface-container-high border border-primary-container/30 flex flex-col items-center justify-center p-6 text-center aspect-[4/4.5] w-full">
                                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-br from-primary-container/20 to-tertiary/10" />
                                    <div className="z-10 w-full flex flex-col items-center">
                                      <div className="w-12 h-12 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center mb-4 animate-pulse">
                                        <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                                          cloud_upload
                                        </span>
                                      </div>
                                      <p className="uppercase tracking-widest font-bold text-primary mb-1 text-xs">正在上传</p>
                                      <p className="text-on-surface-variant mb-6 text-[11px]">素材处理中</p>
                                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full w-[65%] bg-gradient-to-r from-primary-container to-tertiary shadow-[0_0_10px_rgba(224,142,254,0.6)]" />
                                      </div>
                                      <p className="font-bold text-on-surface-variant mt-2 text-[11px]">65%</p>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <span className="material-symbols-outlined text-outline group-hover:text-tertiary text-2xl">add</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <p className="text-neutral-500 uppercase font-medium text-[10px] tracking-[0.15em] opacity-80">最大限制 24MB</p>
                                    </div>
                                  </>
                                )}
                                <input accept="image/*" className="hidden" multiple onChange={(event) => void uploadFiles(event.target.files)} type="file" />
                              </label>
                            );
                          })}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-6">
                        <div className="relative aspect-video overflow-hidden group border bg-black border-white/10 rounded-lg">
                          {videoPreview ? (
                            videoPreview.startsWith("/uploads/") || videoPreview.endsWith(".mp4") || videoPreview.endsWith(".webm") || videoPreview.endsWith(".mov") ? (
                              <>
                                <video className="h-full w-full object-cover opacity-60" loop muted playsInline autoPlay src={videoPreview} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/40 backdrop-blur-sm">
                                  <div className="relative mb-4 w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-2 border-tertiary/20 border-t-tertiary animate-[spin_3s_linear_infinite]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        videocam
                                      </span>
                                    </div>
                                  </div>
                                  <h3 className="text-xl font-headline font-bold text-white tracking-tight">
                                    <span className="text-sm font-medium tracking-wider text-white/90">已完成 74% ...</span>
                                  </h3>
                                  <p className="text-[11px] text-on-surface-variant max-w-[280px] text-center mt-2 leading-relaxed">正在上传视频，素材处理中</p>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-20">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-primary-container/20 text-primary-container text-[9px] px-2 py-0.5 rounded-full border border-primary-container/30 font-bold tracking-widest uppercase">
                                        实时预览
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px] text-neutral-400">schedule</span>
                                        <span className="text-[10px] text-neutral-400 font-bold tracking-tighter uppercase align-baseline">0:24</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button className="w-7 h-7 rounded-full glass-panel border border-white/10 flex items-center justify-center text-white/70 hover:text-error cursor-pointer transition-all hover:scale-110" type="button">
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                    <button className="w-7 h-7 rounded-full glass-panel border border-white/10 flex items-center justify-center text-white/70 hover:text-tertiary cursor-pointer transition-all hover:scale-110" type="button">
                                      <span className="material-symbols-outlined text-sm">fullscreen</span>
                                    </button>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20 overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-primary-container to-tertiary w-3/4 shadow-[0_0_10px_#81ecff]" />
                                </div>
                              </>
                            ) : (
                              <iframe
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                                src={videoPreview}
                                title="Video preview"
                              />
                            )
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low/20 backdrop-blur-sm border-2 border-dashed border-outline-variant/30 rounded-lg group-hover:border-tertiary/40 transition-colors">
                              <div className="mb-4 flex flex-col items-center gap-4">
                                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40" style={{ fontVariationSettings: "'wght' 200" }}>
                                  upload_file
                                </span>
                                <div className="text-center">
                                  <h3 className="font-headline font-bold text-on-surface tracking-tight text-base">上传视频素材</h3>
                                  <p className="text-[11px] text-on-surface-variant mt-1 uppercase tracking-widest">支持 MP4, WEBM 或 MOV，最大 50MB</p>
                                </div>
                              </div>
                              <label className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-on-surface transition-all active:scale-95 cursor-pointer">
                                浏览文件
                                <input accept="video/*" className="hidden" onChange={(event) => void uploadFiles(event.target.files)} type="file" />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-6 space-y-4">
                        <div className="group mt-6 flex items-center relative">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-xl text-tertiary/70">link</span>
                          </div>
                          <input
                            className="w-full rounded-full border bg-surface-container-low/40 backdrop-blur-md py-4 pl-14 pr-12 text-sm italic text-on-surface placeholder:text-outline-variant/40 focus:border-tertiary/50 focus:ring-0 focus:shadow-[0_0_25px_rgba(129,236,255,0.1)] transition-all outline-none font-mono border-outline-variant/40 border-2"
                            onChange={(event) => {
                              setVideoUrlInput(event.target.value);
                              setLocalDraft((current) => ({ ...current, videoPath: event.target.value }));
                            }}
                            placeholder={videoPreview ? "资源链接..." : "或粘贴视频链接"}
                            value={videoUrlInput}
                          />
                          <button className="absolute right-4 text-neutral-500 hover:text-primary transition-colors flex items-center justify-center p-1" type="button">
                            {videoPreview ? (
                              <span className="material-symbols-outlined text-xl">check</span>
                            ) : (
                              <span className="text-[10px] font-black tracking-widest uppercase px-2 opacity-40">确认</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-white/5 flex items-center justify-end gap-6">
            <button className="font-black uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors text-sm" onClick={confirmClose} type="button">
              取消
            </button>
            <button
              className="bg-gradient-to-br from-primary-container to-primary-dim text-on-primary px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(224,142,254,0.3)] hover:shadow-[0_0_30px_rgba(129,236,255,0.4)] transition-all transform active:scale-95"
              disabled={saving}
              type="submit"
            >
              {saving ? "保存中..." : "保存故事"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QaPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.35em] uppercase text-tertiary mb-3">QA Reference</div>
          <h1 className="text-5xl font-black tracking-tight mb-4">Stitch 对稿页</h1>
          <p className="text-on-surface-variant max-w-2xl">这里保留了 15 个 Stitch 页面状态的原始截图和 HTML，可直接用于逐屏对稿。</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {manifestEntries.map((entry) => (
            <article key={entry.key} className="glass-panel rounded-[28px] border border-white/5 overflow-hidden">
              <img alt={entry.title} className="w-full h-64 object-cover border-b border-white/5" src={entry.screenshotUrl} />
              <div className="p-6">
                <div className="text-[10px] tracking-[0.25em] uppercase text-tertiary mb-2">{entry.key}</div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">{entry.title}</h2>
                <div className="flex gap-3">
                  <a
                    className="px-4 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs tracking-[0.25em] uppercase"
                    href={entry.htmlUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    打开 HTML
                  </a>
                  <a
                    className="px-4 py-3 rounded-full bg-white/5 border border-white/10 text-on-surface text-xs tracking-[0.25em] uppercase"
                    href={entry.screenshotUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    查看截图
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
