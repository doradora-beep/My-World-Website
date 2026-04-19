import { prisma } from "./prisma.js";
import { DEFAULT_AVATAR_PROMPT } from "../shared/avatar-options.js";

const defaultAvatar =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAmIOYajnms4qZUKkIjyOSsVmlyCPUZ9yShp5WlVuygu0GHzgZKaWoUFP3rAygJpHHa8YIRgvjlkN0zSh5cYcOupC-XpHSfBvAOgs3bHVm7U41CwBIOa8iiC8f_7Eu532lZx7vkhwahNOc4XGp2bhZDUw-3b6O_oyACs_ChhbQGTD6HKuUMHds1fCUIKEQyrtUUz1UbgDUXuk7hi02s_qftJNE4CQhAHKMJWQi2RPlf9alCfwRMY3DG_PW-b0UVgsuiwOLjDlSP1DQ";

const seedCards = [
  {
    id: "card-school-01",
    levelId: "school",
    themeKey: "课堂时光",
    title: "第一次觉得学习像解谜",
    summary: "那堂课让我第一次觉得学习真的很好玩。",
    reflection:
      "我开始发现，自己喜欢的不只是答案，而是慢慢把问题想明白的过程。后来每次碰到复杂的题目，我都会想起那种豁然开朗的感觉。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDY-DfPFtfONtWLO2uMewSeqke5CATe9GVEJF9BKfOdcJnrYxr3Zbi4D_mrVrnTwHk5IDsSxAX_Fv4bn7kHp1OtVWsEN44teE-Ita3dGxJ2tlZyJLzxcMbCkZz81KQcrGU88WPRRimEdsKv212BQtBeAlBcEmIk_qa-FC6TxD0R4OiWjcqqdhdokhwmVq_QFPi8oGrDlTfZlLiHsxTRfjrpiZno8ao7rrxGsycyHG3dmj3yhPG332quQnaSmNgoZabRX8s-bwXXUv0"
    ]),
    createdAt: new Date("2026-03-11T10:00:00.000Z")
  },
  {
    id: "card-school-02",
    levelId: "school",
    themeKey: "我的作品",
    title: "我完成的一次小作品",
    summary: "把一个想法做成看得见的东西时，我真的很开心。",
    reflection:
      "作品不一定很大，但每一次完成，都会让我更相信自己是真的在成长。那种从想象到落地的过程，像是在给自己的世界装上一盏灯。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPn9R1uC38XYmHMbqgTjN551KC9iA8VruniRc1FuyVcM8wkKzRtj-3a3asWr88s5Hnvqae1dsQyHDuOLSENOp0ZR-4cKVFkZZhNoz3pvdYqBUG2-PP4yxDYsyzh8bOcegS0D6PK19zwNwoh8VYyDg82sGvzNVs3UWDTmbAxJ1NJiwVgGgLstvBZlK0RwK_qUopVJR4myOF7Uh1Lwh8AeiRdiufM9IaUVrIXvWTuBZ7Yo3c4sRZ7nCJlU615nTVnAHW9Eyv7qE7oxg"
    ]),
    createdAt: new Date("2026-02-28T10:00:00.000Z")
  },
  {
    id: "card-family-01",
    levelId: "family",
    themeKey: "家庭时光",
    title: "晚饭后的客厅时间",
    summary: "全家坐在一起聊天的时候，总会让我很安心。",
    reflection:
      "最普通的日常，常常就是最珍贵的记忆来源。那些没有特别安排的晚上，反而构成了我心里最稳固的归属感。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8"
    ]),
    createdAt: new Date("2026-03-03T10:00:00.000Z")
  },
  {
    id: "card-dreams-01",
    levelId: "dreams",
    themeKey: "我想学的本领",
    title: "我想把故事做成作品",
    summary: "我想把脑海里的世界做成可以被别人看到的东西。",
    reflection:
      "网站、游戏、绘本、影像，我还不知道最后是哪一种，但我想继续走下去。只要保持创作，我就会慢慢靠近那个想成为的自己。",
    mediaType: "video" as const,
    mediaPathOrUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    createdAt: new Date("2026-03-01T10:00:00.000Z")
  },
  {
    id: "card-memories-01",
    levelId: "memories",
    themeKey: "陪伴时光",
    title: "最初的共鸣",
    summary: "第一次意识到，有些陪伴会悄悄改变我的轨道。",
    reflection:
      "并不是所有影响都要轰轰烈烈地发生。有些人只是静静地待在你身边，却在你迟疑的时候给了你继续向前的勇气。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa6SwQpxUrSMeAnvqKMqZD7jMYpug12Nr2oggTQWSultL2IZfv9yX3qj4kK2oXvddPNgONpnt1VOUIN5PLM3ZcI0ESAVr30PzwdBAazQs5NBLClxMpJW_czkDKMnFEkJBrJzR_jiDiD6U3wnD34dcuzMgD8KQTcOLhwZvZHF9QIg8VcrA6dALghmHD4bwKBtOUib4Qu5di-slVDIzflWFBzO64qljBct_ARAuIbiswA1zOQfm2MhbKOnCMCdETuOr5seIdfhp2AR8"
    ]),
    createdAt: new Date("2026-04-15T10:00:00.000Z")
  },
  {
    id: "card-memories-02",
    levelId: "memories",
    themeKey: "开心时刻",
    title: "伟大的网格",
    summary: "一群人一起完成一件事的时候，我会很容易被点亮。",
    reflection:
      "合作最迷人的地方，是原本各自发光的点突然连成了网。那一刻我会知道，原来我的能量也真的能被别人接住。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC12bfzwOlEA0yO_dd2kpAYnEenjPYF3D8GZbTy9HgL3xN8b8n5ApVqHJmnMU2x0tugqDzb9I30FpMCkMxJ49ZmDlBkk9lRvo1NMAbMMVuiOx2avaw4uO6cUNcgXopz6o-rFq3MPqAyi86wyEuFc_-utLmC9vj2KKQL0-JS5zmzkO3CBDwBi_D3Ich28GOYHZiifHdeCuWmGnmXhmwvsAlxXc5drE73raoZdxceupLDXOWyzQ7XWsn3n2XF719yxXx7jpQbI3hjbbo"
    ]),
    createdAt: new Date("2026-03-20T09:00:00.000Z")
  },
  {
    id: "card-memories-03",
    levelId: "memories",
    themeKey: "小小幸福",
    title: "静默的回响",
    summary: "有些瞬间很安静，但会在之后很久继续发光。",
    reflection:
      "我后来才发现，自己最舍不得的记忆，往往不是最热闹的时刻，而是那些安静却完整地属于我的片段。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE"
    ]),
    createdAt: new Date("2026-02-14T12:00:00.000Z")
  },
  {
    id: "card-milestones-01",
    levelId: "milestones",
    themeKey: "我闯过的难关",
    title: "我没有立刻做到，但我没有退后",
    summary: "那次真的很难，但我最后还是撑过去了。",
    reflection:
      "成长不一定总是高光时刻，有时候只是没有在最想放弃的时候退后。后来回头看，我会感谢那个没有轻易松手的自己。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q"
    ]),
    createdAt: new Date("2026-03-25T08:00:00.000Z")
  }
];

export async function ensureSeedData() {
  const profile = await prisma.profile.findUnique({
    where: {
      id: "main"
    }
  });

  if (!profile) {
    await prisma.profile.create({
      data: {
        id: "main",
        name: "Dora The Explorer",
        bio: "“在这个星系里，总会有更大的恒星试图用引力扭曲你的轨道。但别忘了，哪怕是一颗中子星，密度大得惊人，也只需默默旋转，就能让光为之弯曲。”",
        avatarImagePath: defaultAvatar,
        avatarPromptJson: JSON.stringify(DEFAULT_AVATAR_PROMPT)
      }
    });
  }

  const existingCount = await prisma.storyCard.count();

  if (!existingCount) {
    await prisma.storyCard.createMany({
      data: seedCards
    });
  }
}
