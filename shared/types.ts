export type MediaType = "image" | "video";

export type AvatarPromptDto = {
  hair: string;
  expression: string;
  style: string;
  palette: string;
  outfit: string;
  notes: string;
};

export type ProfileDto = {
  name: string;
  bio: string;
  avatarImagePath: string;
  avatarPromptJson: AvatarPromptDto;
  updatedAt: string;
};

export type StoryCardDto = {
  id: string;
  levelId: string;
  themeKey: string;
  title: string;
  summary: string;
  reflection: string;
  mediaType: MediaType;
  mediaPathOrUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type BootstrapDto = {
  owner: {
    authenticated: boolean;
  };
  profile: ProfileDto;
  cards: StoryCardDto[];
  levels: Array<{
    id: string;
    title: string;
    levelCode: string;
    accentLabel: string;
    glow: string;
    position: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    sizePx: number;
    themes: string[];
  }>;
};

export type AvatarCandidatesDto = {
  candidates: string[];
  prompt: AvatarPromptDto;
};
