export type LevelDefinition = {
  id: string;
  title: string;
  levelCode: string;
  accentLabel: string;
  glow: "primary" | "tertiary" | "secondary" | "error" | "white";
  position: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  sizePx: number;
};

export const LEVELS: LevelDefinition[] = [
  {
    id: "school",
    title: "我的学校生活",
    levelCode: "LEVEL 01",
    accentLabel: "学校生活",
    glow: "white",
    position: {
      bottom: "22%",
      left: "30%"
    },
    sizePx: 102.1
  },
  {
    id: "family",
    title: "我的家庭",
    levelCode: "LEVEL 02",
    accentLabel: "家庭",
    glow: "primary",
    position: {
      top: "15%",
      left: "20%"
    },
    sizePx: 116.7
  },
  {
    id: "favorites",
    title: "我的最爱",
    levelCode: "LEVEL 03",
    accentLabel: "最爱",
    glow: "tertiary",
    position: {
      top: "12%",
      right: "12%"
    },
    sizePx: 116.7
  },
  {
    id: "dreams",
    title: "我的梦想",
    levelCode: "LEVEL 04",
    accentLabel: "梦想",
    glow: "primary",
    position: {
      right: "15%",
      bottom: "36%"
    },
    sizePx: 131.3
  },
  {
    id: "memories",
    title: "我的快乐回忆",
    levelCode: "LEVEL 05",
    accentLabel: "快乐回忆",
    glow: "secondary",
    position: {
      top: "48%",
      left: "10%"
    },
    sizePx: 116.7
  },
  {
    id: "milestones",
    title: "我的成长里程碑",
    levelCode: "LEVEL 06",
    accentLabel: "成长里程碑",
    glow: "error",
    position: {
      bottom: "18%",
      right: "32%"
    },
    sizePx: 102.1
  }
];

export const LEVEL_THEMES: Record<string, string[]> = {
  school: ["课堂时光", "校园活动", "学校人物", "学习挑战", "我的作品", "校园角落"],
  family: ["我的家人", "家庭时光", "家庭习惯", "家里的角落", "难忘家事", "家人的力量"],
  favorites: ["我爱做的事", "我爱玩的", "我爱的味道", "我爱的地方", "我爱的宝贝", "我爱的动物"],
  dreams: ["我想成为的人", "我的梦想工作", "我想做到的事", "我想学的本领", "我想去的世界", "我正在准备"],
  memories: ["开心时刻", "爆笑瞬间", "庆祝时光", "出游记忆", "陪伴时光", "小小幸福"],
  milestones: ["我闯过的难关", "我学会的本领", "我完成的挑战", "我成长了", "我变勇敢了", "我能帮别人"]
};

export const STITCH_SCREEN_IDS = {
  homepage: "d6e07e0ab95c4f25a742a8747f58f72a",
  profileOverlay: "8287bfeeeab24914849ab8142ba7aa52",
  profileEditor: "1a50f79ffec544dcb96b77a0e652582c",
  pinEntry: "82590904b6194d42b89899ccd5d28a33",
  avatarEmpty: "e5cc14f24c8c4154b7ea6a14516278b7",
  avatarResults: "1ba700eba2c245868ccf4b0c27c7973e",
  levelEmpty: "5b7cacaf315b406f87a9a4afebd36165",
  levelTimeline: "f5038b775828478aa8cadfb67ccd07af",
  levelEditing: "631d3b7ff8b84df595f16945a8852300",
  cardDetailImmersive: "725d814f0b044470b064ca2217e073cf",
  cardDetailTimeline: "50dd81cff64047f4a65921eee4e204d2",
  deleteModal: "5e392e95a5f7467387ca08de29c9390d",
  cardEditorImage: "b40c1c214d5d49078faca95dc2e7d43b",
  cardEditorVideoEmpty: "82f5ee9207d74c02ada27bd0c75e4033",
  cardEditorVideoLink: "75508a3159ac4fe89cf18628f4a4a9c4"
} as const;
