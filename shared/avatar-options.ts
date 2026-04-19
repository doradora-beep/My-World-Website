import type { AvatarPromptDto } from "./types.js";

export const HAIRSTYLE_OPTIONS = ["利落短发", "层次中发", "自然微卷", "披散长发", "清爽束发"] as const;
export const EXPRESSION_OPTIONS = ["冷静注视", "温柔微笑", "坚定沉着", "若有所思", "自信挑眉"] as const;
export const STYLE_OPTIONS = ["电影级写实", "游戏角色写实"] as const;

export const DEFAULT_AVATAR_PROMPT: AvatarPromptDto = {
  hair: "利落短发",
  expression: "冷静注视",
  style: "电影级写实",
  palette: "lavender",
  outfit: "学院风",
  notes: "像游戏主角一样，安静但有发光感。"
};

export const FALLBACK_AVATAR_SETS = {
  cinematic: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCT4gUxdBvIz1zR9jndJZCzpijV81yWngdhjhcB9-FYExEbtJJ4i-0LdlLUA96GseUImN6gHVzC1RCGigl3KF4b1TytZLNJYzUgFi8JVa5cJBgzIOSUvWbzSPOl6pSRflqTmpEa5f17h_OQOtvQdDsJ0cTNomaJID5ieIlSpJbnFEvq4LaT8hM5uOpFbxOQMdHm4-qamfQSlPypBFBLnu8xk-Du9NkX-CHwZUmTHa_OmPIlix40TRN6ndt-hejiNNEqpvlKHOnpt50",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAubnJ8tWeZDEH87eHFab_FExZ_durwQZDf_5Dj1986zHow39pzdPQ1ExrXfel0TYcIK0m_jNC-hA2i_BH_xqZZxKGc3ZO5DFCxfi3xPpvhb5WnZQSHPjPS-L_vJP7eN76mo-I--Rz5vfPYBUvtqBj-LP2WwlgfQYYQzZEVsDB6n3S37oJOA_Jayp2keeQmEduiWtMK02Vmo0VPZswAAFntQj6XOWJJgvGEXU0VBQejiZ7KkO1F5HAWV1nGPIDQcNLh8oiE7zVnY_c",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD33wzY0rrwdoSFPJ4LeTRPO5OaBmVkreZdX0yuPKqk3d_OA4A5jSl4kNEOKsns9CJCZTi8lgm33W56nYcBosdTFh_i6a16gk3q0PiJjwfPO4Em6mBbBvHienYWq-_Svy_3Jtw5IZuzWfVepLXtiYBhdz2SJh45Ztr_rnL4Pv4wkIotuJ9P79ZaMvHwETjrTIQejxWt2aEy2ph8VU-Tez3yuX7_bfoPTcF7VSVAGtXx_DDhSDZDIbtRiNaVNeLDExc9vOc-KX_UHdo"
  ],
  character: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCQZLXe3XgTW1cp19U9-UPkzOofIdjBrAY_khKAX64xotbphcYmSvOVs4-gqm8clWHuL2zGSjPrb6-qD20Bnde0BGbIDXnGVGqzE1uzwg_ZjUioNnptWS4lsm7s8E4RdNlqA6tAJm4mxMoR_Mb1VFVeq3K8Z04JanVKM1p1BnN-A5Jb_qQdfbwcud03g-a-3INCFCDSbXoB--dK1V3gXW7mJhEfx8uOVisU1EXDmd4HaXeJ8fkCWtdBo0Dwp-_OQ4FtDl5r_iYHBao",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAmIOYajnms4qZUKkIjyOSsVmlyCPUZ9yShp5WlVuygu0GHzgZKaWoUFP3rAygJpHHa8YIRgvjlkN0zSh5cYcOupC-XpHSfBvAOgs3bHVm7U41CwBIOa8iiC8f_7Eu532lZx7vkhwahNOc4XGp2bhZDUw-3b6O_oyACs_ChhbQGTD6HKuUMHds1fCUIKEQyrtUUz1UbgDUXuk7hi02s_qftJNE4CQhAHKMJWQi2RPlf9alCfwRMY3DG_PW-b0UVgsuiwOLjDlSP1DQ"
  ]
} as const;

export function normalizeAvatarPrompt(prompt?: Partial<AvatarPromptDto> | null): AvatarPromptDto {
  const safe = prompt ?? {};

  return {
    hair: HAIRSTYLE_OPTIONS.includes(safe.hair as (typeof HAIRSTYLE_OPTIONS)[number]) ? safe.hair! : DEFAULT_AVATAR_PROMPT.hair,
    expression: EXPRESSION_OPTIONS.includes(safe.expression as (typeof EXPRESSION_OPTIONS)[number]) ? safe.expression! : DEFAULT_AVATAR_PROMPT.expression,
    style: STYLE_OPTIONS.includes(safe.style as (typeof STYLE_OPTIONS)[number]) ? safe.style! : DEFAULT_AVATAR_PROMPT.style,
    palette: typeof safe.palette === "string" && safe.palette.trim() ? safe.palette : DEFAULT_AVATAR_PROMPT.palette,
    outfit: typeof safe.outfit === "string" && safe.outfit.trim() ? safe.outfit : DEFAULT_AVATAR_PROMPT.outfit,
    notes: typeof safe.notes === "string" ? safe.notes : DEFAULT_AVATAR_PROMPT.notes
  };
}
