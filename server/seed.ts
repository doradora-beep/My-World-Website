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
    summary: "那堂课像把一团乱线慢慢理顺，我第一次发现学习原来可以像解谜一样，不是死记答案，而是一步步把线索和逻辑拼起来。",
    reflection:
      "那次之后，我开始发现自己真正喜欢的，其实不只是最后写出来的答案，而是慢慢把问题想明白的过程。原来学习也可以像拆解一个复杂机关，一点点找到隐藏在里面的规律。\n\n后来每次再遇到难一点的题目，我都不会像以前那样只想着赶快做完，而是会试着停下来，把线索重新排一遍。那种忽然开朗的瞬间，让我第一次觉得自己和知识之间真的建立了连接。",
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
    summary: "当我把脑海里的想法一点点做成看得见的小作品时，我感受到的不只是开心，还有一种“原来我真的可以把想象落下来”的满足。",
    reflection:
      "这个作品也许不算很大，但它让我第一次很清楚地感受到，原来脑海里的想法真的可以一步步落到现实里。每完成一个小部分，我都会更确定自己不是只会想象，而是真的能把事情做出来。\n\n它也让我开始相信，成长有时候并不是突然发生的，而是藏在这些具体完成的小事里。那些看起来不起眼的尝试，最后会一点点累积成我对自己的信心。",
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
    summary: "晚饭后大家坐在客厅里聊天、发呆、分享一天里的小事时，空气总是很轻松，也让我觉得自己被稳稳地接住了。",
    reflection:
      "这段记忆没有什么特别轰动的情节，只是很普通的一个晚上，大家坐在一起说话、笑、偶尔安静一下。可也正因为它足够普通，我才更能感觉到那种被家包围着的安稳。\n\n后来回头想，很多让我觉得有力量的时刻，并不是节日或者庆祝，而是这种不需要刻意安排的陪伴。它们让我知道，无论外面发生什么，总有一个地方会把我轻轻接住。",
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
    summary: "我一直想把脑海里的世界做成别人也能看见、听见、感受到的作品，让那些只属于想象的画面真的拥有被分享的形状。",
    reflection:
      "我还不知道未来会把这些故事做成网站、游戏、绘本，还是别的什么形式，但我很确定，自己想继续把想象变成作品。那种把内心世界往外翻译的过程，对我来说很重要。\n\n每次想到这一点，我都会觉得梦想并不是一个遥远的终点，而是一条正在慢慢形成的路。只要我还在创作、还在练习表达，我就已经在靠近那个想成为的自己。",
    mediaType: "video" as const,
    mediaPathOrUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    createdAt: new Date("2026-03-01T10:00:00.000Z")
  },
  {
    id: "card-memories-01",
    levelId: "memories",
    themeKey: "陪伴时光",
    title: "最初的共鸣",
    summary: "那是我第一次真正意识到，有些陪伴不需要很热闹，也会在不知不觉里改变我的轨道，让我慢慢变得更坚定、更柔软。",
    reflection:
      "那段陪伴并没有特别 dramatic 的情节，也没有谁大声说过什么鼓励的话，可它就是在很安静的时刻慢慢改变了我。原来真正重要的人，不一定会把存在感放得很大，却会让你在心里悄悄长出力量。\n\n后来我才明白，有些共鸣不是一瞬间爆发出来的，而是一次次被理解、被陪着走过之后，才慢慢形成的。也正因为这样，它留在我心里的时间会更久。",
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
    summary: "一群人一起朝着同一个目标努力、把零散的想法织成结果的时候，我总会被那种彼此接住、一起发光的感觉彻底点亮。",
    reflection:
      "我很喜欢这种大家为了同一个目标一起投入的状态，因为每个人带来的东西都不一样，但最后却真的能拼成一个完整的结果。那种从零散到成形的过程，会让我觉得很兴奋。\n\n更重要的是，它让我感受到合作不是谁压过谁，而是彼此把对方的想法接住、放大。每当这种时刻出现，我都会更相信自己也能成为那张网里重要的一部分。",
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
    summary: "有些时刻没有掌声，也没有特别大的情绪起伏，可它会在后来的很多天里一直发亮，提醒我那份安静其实很珍贵。",
    reflection:
      "有些记忆在发生的时候几乎没有声音，甚至不会立刻觉得它有多重要，可它会在之后的很多时刻反复浮出来。那种安静的亮度，往往比热闹更耐久，也更容易留在心里。\n\n我后来慢慢发现，自己最舍不得的，常常就是这些没有被大肆标记过的小片段。因为它们完整地属于我，也让我在回想的时候重新感受到当时那份柔软和平静。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa6SwQpxUrSMeAnvqKMqZD7jMYpug12Nr2oggTQWSultL2IZfv9yX3qj4kK2oXvddPNgONpnt1VOUIN5PLM3ZcI0ESAVr30PzwdBAazQs5NBLClxMpJW_czkDKMnFEkJBrJzR_jiDiD6U3wnD34dcuzMgD8KQTcOLhwZvZHF9QIg8VcrA6dALghmHD4bwKBtOUib4Qu5di-slVDIzflWFBzO64qljBct_ARAuIbiswA1zOQfm2MhbKOnCMCdETuOr5seIdfhp2AR8"
    ]),
    createdAt: new Date("2026-02-14T12:00:00.000Z")
  },
  {
    id: "card-milestones-01",
    levelId: "milestones",
    themeKey: "我闯过的难关",
    title: "我没有立刻做到，但我没有退后",
    summary: "那次真的很难，我也不是一下子就做到了，但我没有在最想退后的时候停下，而是咬着牙把自己一点点带了过去。",
    reflection:
      "那次经历最难的地方，不只是事情本身，而是我得一边怀疑自己，一边继续往前走。我没有很快变得厉害，也没有立刻赢得轻松，但我确实一步一步地撑到了最后。\n\n现在再回头看，我会觉得成长很多时候并不是闪闪发光的胜利，而是在最想退后的时候没有真的转身。那个没有轻易松手的自己，后来成了我最感谢的人。",
    mediaType: "image" as const,
    mediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8"
    ]),
    createdAt: new Date("2026-03-25T08:00:00.000Z")
  }
];

const seedSummaryRevisions = [
  {
    id: "card-school-01",
    previousSummary: "那堂课让我第一次觉得学习真的很好玩。",
    nextSummary: "那堂课像把一团乱线慢慢理顺，我第一次发现学习原来可以像解谜一样，不是死记答案，而是一步步把线索和逻辑拼起来。"
  },
  {
    id: "card-school-02",
    previousSummary: "把一个想法做成看得见的东西时，我真的很开心。",
    nextSummary: "当我把脑海里的想法一点点做成看得见的小作品时，我感受到的不只是开心，还有一种“原来我真的可以把想象落下来”的满足。"
  },
  {
    id: "card-school-01",
    previousSummary: "那堂课像把一团乱线慢慢理顺，我第一次发现学习原来可以像解谜一样，一步步把答案找出来。",
    nextSummary: "那堂课像把一团乱线慢慢理顺，我第一次发现学习原来可以像解谜一样，不是死记答案，而是一步步把线索和逻辑拼起来。"
  },
  {
    id: "card-school-02",
    previousSummary: "当我把脑海里的想法一点点做成看得见的小作品时，我感受到的不只是开心，还有一种“我真的做到了”的满足。",
    nextSummary: "当我把脑海里的想法一点点做成看得见的小作品时，我感受到的不只是开心，还有一种“原来我真的可以把想象落下来”的满足。"
  },
  {
    id: "card-family-01",
    previousSummary: "全家坐在一起聊天的时候，总会让我很安心。",
    nextSummary: "晚饭后大家坐在客厅里聊天、发呆、分享一天里的小事时，空气总是很轻松，也让我觉得自己被稳稳地接住了。"
  },
  {
    id: "card-dreams-01",
    previousSummary: "我想把脑海里的世界做成可以被别人看到的东西。",
    nextSummary: "我一直想把脑海里的世界做成别人也能看见、听见、感受到的作品，让那些只属于想象的画面真的拥有被分享的形状。"
  },
  {
    id: "card-memories-01",
    previousSummary: "第一次意识到，有些陪伴会悄悄改变我的轨道。",
    nextSummary: "那是我第一次真正意识到，有些陪伴不需要很热闹，也会在不知不觉里改变我的轨道，让我慢慢变得更坚定、更柔软。"
  },
  {
    id: "card-memories-02",
    previousSummary: "一群人一起完成一件事的时候，我会很容易被点亮。",
    nextSummary: "一群人一起朝着同一个目标努力、把零散的想法织成结果的时候，我总会被那种彼此接住、一起发光的感觉彻底点亮。"
  },
  {
    id: "card-memories-03",
    previousSummary: "有些瞬间很安静，但会在之后很久继续发光。",
    nextSummary: "有些时刻没有掌声，也没有特别大的情绪起伏，可它会在后来的很多天里一直发亮，提醒我那份安静其实很珍贵。"
  },
  {
    id: "card-milestones-01",
    previousSummary: "那次真的很难，但我最后还是撑过去了。",
    nextSummary: "那次真的很难，我也不是一下子就做到了，但我没有在最想退后的时候停下，而是咬着牙把自己一点点带了过去。"
  }
];

const seedReflectionRevisions = [
  {
    id: "card-school-01",
    previousReflection: "我开始发现，自己喜欢的不只是答案，而是慢慢把问题想明白的过程。后来每次碰到复杂的题目，我都会想起那种豁然开朗的感觉。",
    nextReflection:
      "那次之后，我开始发现自己真正喜欢的，其实不只是最后写出来的答案，而是慢慢把问题想明白的过程。原来学习也可以像拆解一个复杂机关，一点点找到隐藏在里面的规律。\n\n后来每次再遇到难一点的题目，我都不会像以前那样只想着赶快做完，而是会试着停下来，把线索重新排一遍。那种忽然开朗的瞬间，让我第一次觉得自己和知识之间真的建立了连接。"
  },
  {
    id: "card-school-02",
    previousReflection: "作品不一定很大，但每一次完成，都会让我更相信自己是真的在成长。那种从想象到落地的过程，像是在给自己的世界装上一盏灯。",
    nextReflection:
      "这个作品也许不算很大，但它让我第一次很清楚地感受到，原来脑海里的想法真的可以一步步落到现实里。每完成一个小部分，我都会更确定自己不是只会想象，而是真的能把事情做出来。\n\n它也让我开始相信，成长有时候并不是突然发生的，而是藏在这些具体完成的小事里。那些看起来不起眼的尝试，最后会一点点累积成我对自己的信心。"
  },
  {
    id: "card-family-01",
    previousReflection: "最普通的日常，常常就是最珍贵的记忆来源。那些没有特别安排的晚上，反而构成了我心里最稳固的归属感。",
    nextReflection:
      "这段记忆没有什么特别轰动的情节，只是很普通的一个晚上，大家坐在一起说话、笑、偶尔安静一下。可也正因为它足够普通，我才更能感觉到那种被家包围着的安稳。\n\n后来回头想，很多让我觉得有力量的时刻，并不是节日或者庆祝，而是这种不需要刻意安排的陪伴。它们让我知道，无论外面发生什么，总有一个地方会把我轻轻接住。"
  },
  {
    id: "card-dreams-01",
    previousReflection: "网站、游戏、绘本、影像，我还不知道最后是哪一种，但我想继续走下去。只要保持创作，我就会慢慢靠近那个想成为的自己。",
    nextReflection:
      "我还不知道未来会把这些故事做成网站、游戏、绘本，还是别的什么形式，但我很确定，自己想继续把想象变成作品。那种把内心世界往外翻译的过程，对我来说很重要。\n\n每次想到这一点，我都会觉得梦想并不是一个遥远的终点，而是一条正在慢慢形成的路。只要我还在创作、还在练习表达，我就已经在靠近那个想成为的自己。"
  },
  {
    id: "card-memories-01",
    previousReflection: "并不是所有影响都要轰轰烈烈地发生。有些人只是静静地待在你身边，却在你迟疑的时候给了你继续向前的勇气。",
    nextReflection:
      "那段陪伴并没有特别 dramatic 的情节，也没有谁大声说过什么鼓励的话，可它就是在很安静的时刻慢慢改变了我。原来真正重要的人，不一定会把存在感放得很大，却会让你在心里悄悄长出力量。\n\n后来我才明白，有些共鸣不是一瞬间爆发出来的，而是一次次被理解、被陪着走过之后，才慢慢形成的。也正因为这样，它留在我心里的时间会更久。"
  },
  {
    id: "card-memories-02",
    previousReflection: "合作最迷人的地方，是原本各自发光的点突然连成了网。那一刻我会知道，原来我的能量也真的能被别人接住。",
    nextReflection:
      "我很喜欢这种大家为了同一个目标一起投入的状态，因为每个人带来的东西都不一样，但最后却真的能拼成一个完整的结果。那种从零散到成形的过程，会让我觉得很兴奋。\n\n更重要的是，它让我感受到合作不是谁压过谁，而是彼此把对方的想法接住、放大。每当这种时刻出现，我都会更相信自己也能成为那张网里重要的一部分。"
  },
  {
    id: "card-memories-03",
    previousReflection: "我后来才发现，自己最舍不得的记忆，往往不是最热闹的时刻，而是那些安静却完整地属于我的片段。",
    nextReflection:
      "有些记忆在发生的时候几乎没有声音，甚至不会立刻觉得它有多重要，可它会在之后的很多时刻反复浮出来。那种安静的亮度，往往比热闹更耐久，也更容易留在心里。\n\n我后来慢慢发现，自己最舍不得的，常常就是这些没有被大肆标记过的小片段。因为它们完整地属于我，也让我在回想的时候重新感受到当时那份柔软和平静。"
  },
  {
    id: "card-milestones-01",
    previousReflection: "成长不一定总是高光时刻，有时候只是没有在最想放弃的时候退后。后来回头看，我会感谢那个没有轻易松手的自己。",
    nextReflection:
      "那次经历最难的地方，不只是事情本身，而是我得一边怀疑自己，一边继续往前走。我没有很快变得厉害，也没有立刻赢得轻松，但我确实一步一步地撑到了最后。\n\n现在再回头看，我会觉得成长很多时候并不是闪闪发光的胜利，而是在最想退后的时候没有真的转身。那个没有轻易松手的自己，后来成了我最感谢的人。"
  }
];

const seedMediaRollbacks = [
  {
    id: "card-school-01",
    previousMediaType: "video" as const,
    previousMediaPathOrUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDY-DfPFtfONtWLO2uMewSeqke5CATe9GVEJF9BKfOdcJnrYxr3Zbi4D_mrVrnTwHk5IDsSxAX_Fv4bn7kHp1OtVWsEN44teE-Ita3dGxJ2tlZyJLzxcMbCkZz81KQcrGU88WPRRimEdsKv212BQtBeAlBcEmIk_qa-FC6TxD0R4OiWjcqqdhdokhwmVq_QFPi8oGrDlTfZlLiHsxTRfjrpiZno8ao7rrxGsycyHG3dmj3yhPG332quQnaSmNgoZabRX8s-bwXXUv0"
    ])
  },
  {
    id: "card-school-02",
    previousMediaType: "image" as const,
    previousMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPn9R1uC38XYmHMbqgTjN551KC9iA8VruniRc1FuyVcM8wkKzRtj-3a3asWr88s5Hnvqae1dsQyHDuOLSENOp0ZR-4cKVFkZZhNoz3pvdYqBUG2-PP4yxDYsyzh8bOcegS0D6PK19zwNwoh8VYyDg82sGvzNVs3UWDTmbAxJ1NJiwVgGgLstvBZlK0RwK_qUopVJR4myOF7Uh1Lwh8AeiRdiufM9IaUVrIXvWTuBZ7Yo3c4sRZ7nCJlU615nTVnAHW9Eyv7qE7oxg",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDY-DfPFtfONtWLO2uMewSeqke5CATe9GVEJF9BKfOdcJnrYxr3Zbi4D_mrVrnTwHk5IDsSxAX_Fv4bn7kHp1OtVWsEN44teE-Ita3dGxJ2tlZyJLzxcMbCkZz81KQcrGU88WPRRimEdsKv212BQtBeAlBcEmIk_qa-FC6TxD0R4OiWjcqqdhdokhwmVq_QFPi8oGrDlTfZlLiHsxTRfjrpiZno8ao7rrxGsycyHG3dmj3yhPG332quQnaSmNgoZabRX8s-bwXXUv0",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC12bfzwOlEA0yO_dd2kpAYnEenjPYF3D8GZbTy9HgL3xN8b8n5ApVqHJmnMU2x0tugqDzb9I30FpMCkMxJ49ZmDlBkk9lRvo1NMAbMMVuiOx2avaw4uO6cUNcgXopz6o-rFq3MPqAyi86wyEuFc_-utLmC9vj2KKQL0-JS5zmzkO3CBDwBi_D3Ich28GOYHZiifHdeCuWmGnmXhmwvsAlxXc5drE73raoZdxceupLDXOWyzQ7XWsn3n2XF719yxXx7jpQbI3hjbbo"
    ]),
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPn9R1uC38XYmHMbqgTjN551KC9iA8VruniRc1FuyVcM8wkKzRtj-3a3asWr88s5Hnvqae1dsQyHDuOLSENOp0ZR-4cKVFkZZhNoz3pvdYqBUG2-PP4yxDYsyzh8bOcegS0D6PK19zwNwoh8VYyDg82sGvzNVs3UWDTmbAxJ1NJiwVgGgLstvBZlK0RwK_qUopVJR4myOF7Uh1Lwh8AeiRdiufM9IaUVrIXvWTuBZ7Yo3c4sRZ7nCJlU615nTVnAHW9Eyv7qE7oxg"
    ])
  },
  {
    id: "card-family-01",
    previousMediaType: "image" as const,
    previousMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa6SwQpxUrSMeAnvqKMqZD7jMYpug12Nr2oggTQWSultL2IZfv9yX3qj4kK2oXvddPNgONpnt1VOUIN5PLM3ZcI0ESAVr30PzwdBAazQs5NBLClxMpJW_czkDKMnFEkJBrJzR_jiDiD6U3wnD34dcuzMgD8KQTcOLhwZvZHF9QIg8VcrA6dALghmHD4bwKBtOUib4Qu5di-slVDIzflWFBzO64qljBct_ARAuIbiswA1zOQfm2MhbKOnCMCdETuOr5seIdfhp2AR8"
    ]),
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8"
    ])
  },
  {
    id: "card-memories-01",
    previousMediaType: "image" as const,
    previousMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa6SwQpxUrSMeAnvqKMqZD7jMYpug12Nr2oggTQWSultL2IZfv9yX3qj4kK2oXvddPNgONpnt1VOUIN5PLM3ZcI0ESAVr30PzwdBAazQs5NBLClxMpJW_czkDKMnFEkJBrJzR_jiDiD6U3wnD34dcuzMgD8KQTcOLhwZvZHF9QIg8VcrA6dALghmHD4bwKBtOUib4Qu5di-slVDIzflWFBzO64qljBct_ARAuIbiswA1zOQfm2MhbKOnCMCdETuOr5seIdfhp2AR8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8"
    ]),
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa6SwQpxUrSMeAnvqKMqZD7jMYpug12Nr2oggTQWSultL2IZfv9yX3qj4kK2oXvddPNgONpnt1VOUIN5PLM3ZcI0ESAVr30PzwdBAazQs5NBLClxMpJW_czkDKMnFEkJBrJzR_jiDiD6U3wnD34dcuzMgD8KQTcOLhwZvZHF9QIg8VcrA6dALghmHD4bwKBtOUib4Qu5di-slVDIzflWFBzO64qljBct_ARAuIbiswA1zOQfm2MhbKOnCMCdETuOr5seIdfhp2AR8"
    ])
  },
  {
    id: "card-memories-03",
    previousMediaType: "image" as const,
    previousMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE"
    ]),
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDa6SwQpxUrSMeAnvqKMqZD7jMYpug12Nr2oggTQWSultL2IZfv9yX3qj4kK2oXvddPNgONpnt1VOUIN5PLM3ZcI0ESAVr30PzwdBAazQs5NBLClxMpJW_czkDKMnFEkJBrJzR_jiDiD6U3wnD34dcuzMgD8KQTcOLhwZvZHF9QIg8VcrA6dALghmHD4bwKBtOUib4Qu5di-slVDIzflWFBzO64qljBct_ARAuIbiswA1zOQfm2MhbKOnCMCdETuOr5seIdfhp2AR8"
    ])
  },
  {
    id: "card-memories-03",
    previousMediaType: "image" as const,
    previousMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC12bfzwOlEA0yO_dd2kpAYnEenjPYF3D8GZbTy9HgL3xN8b8n5ApVqHJmnMU2x0tugqDzb9I30FpMCkMxJ49ZmDlBkk9lRvo1NMAbMMVuiOx2avaw4uO6cUNcgXopz6o-rFq3MPqAyi86wyEuFc_-utLmC9vj2KKQL0-JS5zmzkO3CBDwBi_D3Ich28GOYHZiifHdeCuWmGnmXhmwvsAlxXc5drE73raoZdxceupLDXOWyzQ7XWsn3n2XF719yxXx7jpQbI3hjbbo",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8"
    ]),
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE"
    ])
  },
  {
    id: "card-milestones-01",
    previousMediaType: "video" as const,
    previousMediaPathOrUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q"
    ])
  },
  {
    id: "card-milestones-01",
    previousMediaType: "image" as const,
    previousMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q"
    ]),
    nextMediaType: "image" as const,
    nextMediaPathOrUrl: JSON.stringify([
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Bl6UgspQ7QRiPSy2yEKFjexr-cMrPBBWEcc6_XGZk4_LjYKq8iFlYpSH_b9ZrTn-Y6ausG4zSXjkF6mUX8N73IwGjCr47vdPxjaaVftfq32gyJ_n8I9ZNN4ZYCnUPalYe4_edvj5bmszuOZKqYhkbn9CQN-1JfWF-GxuCQrKiZHjYUQucSx1C29dCaVSLzdAr31WERhrZcHKVj9wVp-6xSGP0XANIC55i7eWts4aeTIm_RMbZc_r55W5yYhNldRTitJo488Ou9Q",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM57MteWygbyWIdhICAVHXO7hWOxWhWDiwp2DPxgZyN4XttVkLOEn-bN2tjZTepXNPM9XXiCMWI5TqTI3fYM32nlFehNcSdX7NEV10wf60MZUVj-Phr5ArRqIFoGaeQSIHGNbNeTTZCWqCZSnNnLKcCuGQoBIsDgZiNFpiaCR9CZoZQ_K22D-6gPfeDbgQdwAJ2TIdCsBJqFNg2cuk14ODqNfDE6YGKdUe9i-aazYdLIJ1OUZoNFss_hHzSTT35Iw3Wicr2WK2exE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNViPpXpHBfpmwwoNaJEW75u0ISLV097R5DWLQo_dHkqn_i6lPg_Q61f15v7xeBaZhFhFYZ0JVECgsS3vRXy5j_jwYOKlwnoJYzvhD87Uq-r2M83xSzJTByOyok5JUJEypbDquH8zhQldQ-kSuvDtWeFCHMe0HDpvdhTvIXZZ1xVgVVvtXR1SL4InPSzCnJA1zzqzG-5d1o1duHpDUFtHOEmPaF3-5LEbjIdC6DkDTJ7Wz8DPV5wvhHFzoWXODwiHA1TvBuDG4Ls8"
    ])
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

  await Promise.all(
    seedSummaryRevisions.map((revision) =>
      prisma.storyCard.updateMany({
        where: {
          id: revision.id,
          summary: revision.previousSummary
        },
        data: {
          summary: revision.nextSummary
        }
      })
    )
  );

  await Promise.all(
    seedReflectionRevisions.map((revision) =>
      prisma.storyCard.updateMany({
        where: {
          id: revision.id,
          reflection: revision.previousReflection
        },
        data: {
          reflection: revision.nextReflection
        }
      })
    )
  );

  await Promise.all(
    seedMediaRollbacks.map((revision) =>
      prisma.storyCard.updateMany({
        where: {
          id: revision.id,
          mediaType: revision.previousMediaType,
          mediaPathOrUrl: revision.previousMediaPathOrUrl
        },
        data: {
          mediaType: revision.nextMediaType,
          mediaPathOrUrl: revision.nextMediaPathOrUrl
        }
      })
    )
  );
}
