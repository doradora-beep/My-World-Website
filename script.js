const STORAGE_KEY = "my-world-story-mvp-v5";
const OWNER_PIN = "2468";

const LEVELS = [
  { id: "school", title: "我的学校生活", homeCode: "LEVEL 01", homeLabel: "GENESIS", levelAccent: "学校生活", glow: "primary", color: "#e08efe", pos: "top-[15%] left-[20%]", size: "w-[116.7px] h-[116.7px]" },
  { id: "family", title: "我的家庭", homeCode: "SECTOR 02", homeLabel: "ECHOES", levelAccent: "家庭", glow: "tertiary", color: "#81ecff", pos: "top-[12%] right-[16%]", size: "w-[114px] h-[114px]" },
  { id: "favorites", title: "我的最爱", homeCode: "STORAGE 05", homeLabel: "ARCHIVE", levelAccent: "最爱", glow: "white", color: "#dfe9df", pos: "top-[51%] left-[7%]", size: "w-[108px] h-[108px]" },
  { id: "dreams", title: "我的梦想", homeCode: "CORE 04", homeLabel: "RADIANCE", levelAccent: "梦想", glow: "primary", color: "#d88cff", pos: "top-[50%] right-[18%]", size: "w-[112px] h-[112px]" },
  { id: "memories", title: "我的快乐回忆", homeCode: "ZONE 00", homeLabel: "THE VOID", levelAccent: "回忆", glow: "white", color: "#9b9b9b", pos: "bottom-[23%] left-[32%]", size: "w-[96px] h-[96px]" },
  { id: "milestones", title: "我的成长里程碑", homeCode: "PEAK 06", homeLabel: "ZENITH", levelAccent: "成长", glow: "error", color: "#fd6f85", pos: "bottom-[20%] right-[31%]", size: "w-[100px] h-[100px]" },
];

const LEVEL_THEMES = {
  school: ["课堂时光", "校园活动", "学校人物", "学习挑战", "我的作品", "校园角落"],
  family: ["我的家人", "家庭时光", "家庭习惯", "家里的角落", "难忘家事", "家人的力量"],
  favorites: ["我爱做的事", "我爱玩的", "我爱的味道", "我爱的地方", "我爱的宝贝", "我爱的动物"],
  dreams: ["我想成为的人", "我的梦想工作", "我想做到的事", "我想学的本领", "我想去的世界", "我正在准备"],
  memories: ["开心时刻", "爆笑瞬间", "庆祝时光", "出游记忆", "陪伴时光", "小小幸福"],
  milestones: ["我闯过的难关", "我学会的本领", "我完成的挑战", "我成长了", "我变勇敢了", "我能帮别人"],
};

const app = document.querySelector("#app");

const runtime = {
  view: "home",
  currentLevelId: "school",
  editMode: false,
  overlay: null,
  selectedCardId: null,
  editingCardId: null,
  deletingCardId: null,
  avatarCandidates: [],
  selectedAvatarId: null,
};

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatarSvg(seed, primary, secondary) {
  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520">
      <defs>
        <radialGradient id="g" cx="48%" cy="34%">
          <stop offset="0%" stop-color="${primary}" stop-opacity="0.95"/>
          <stop offset="62%" stop-color="${secondary}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#0e0e0e" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="520" height="520" rx="260" fill="#0f1114"/>
      <circle cx="260" cy="200" r="160" fill="url(#g)"/>
      <circle cx="260" cy="218" r="128" fill="#d8bfab"/>
      <path d="M162 182c20-88 156-124 226-32-44-18-108-6-150 16-18 10-42 18-76 16z" fill="#2b2f36"/>
      <circle cx="${230 + seed}" cy="226" r="10" fill="#101214"/>
      <circle cx="${295 + seed}" cy="223" r="10" fill="#101214"/>
      <path d="M238 288c24 12 56 12 82 0" stroke="#8e5e66" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M156 468c18-86 88-134 158-134 60 0 132 42 154 134" fill="${primary}" opacity="0.9"/>
      <circle cx="366" cy="120" r="10" fill="rgba(255,255,255,0.7)"/>
      <circle cx="392" cy="152" r="5" fill="rgba(255,255,255,0.45)"/>
    </svg>
  `);
}

function artSvg(label, a, b, c) {
  return svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${a}"/>
          <stop offset="100%" stop-color="${b}"/>
        </linearGradient>
      </defs>
      <rect width="900" height="620" fill="#0e0e0e"/>
      <circle cx="250" cy="180" r="220" fill="url(#bg)" opacity="0.35"/>
      <circle cx="610" cy="240" r="180" fill="rgba(255,255,255,0.09)"/>
      <path d="M70 460c120-70 280-72 390 16 90 72 190 96 368 8V620H70z" fill="${c}" opacity="0.2"/>
      <text x="74" y="88" fill="rgba(255,255,255,0.72)" font-size="42" font-family="Plus Jakarta Sans, sans-serif" font-weight="700">${label}</text>
    </svg>
  `);
}

function createState() {
  return {
    profile: {
      name: "我的世界主人",
      bio: "“欢迎来到我的世界。你可以从不同关卡开始，一边探索我的故事，一边认识我是怎样长大的。”",
      avatar: avatarSvg(0, "#e08efe", "#81ecff"),
      avatarPrompt: {
        hair: "柔光长发",
        expression: "自信坚定",
        style: "Celestial Ink",
        palette: "lavender",
        outfit: "学院风",
        notes: "像游戏主角一样，安静但有发光感。",
      },
    },
    cards: [
      { id: crypto.randomUUID(), levelId: "school", theme: "课堂时光", title: "第一次觉得学习像解谜", summary: "那堂课让我第一次觉得学习真的很好玩。", reflection: "我开始发现，自己喜欢的不只是答案，而是慢慢把问题想明白的过程。", createdAt: "2026-03-11T10:00:00.000Z", media: { type: "image", src: artSvg("First Resonance", "#f4f4f4", "#1a1a1a", "#ffffff") } },
      { id: crypto.randomUUID(), levelId: "school", theme: "我的作品", title: "我完成的一次小作品", summary: "把一个想法做成看得见的东西时，我真的很开心。", reflection: "作品不一定很大，但每一次完成，都会让我更相信自己是真的在成长。", createdAt: "2026-02-28T10:00:00.000Z", media: { type: "image", src: artSvg("Static Echo", "#6f6f6f", "#111111", "#f9d8ff") } },
      { id: crypto.randomUUID(), levelId: "school", theme: "学习挑战", title: "一道我不想放弃的题", summary: "我没有立刻做出来，但最后还是坚持到了答案。", reflection: "那次让我记住，难题不一定要立刻解决，但可以一步一步靠近。", createdAt: "2026-01-20T10:00:00.000Z", media: { type: "image", src: artSvg("The Great Mesh", "#dddddd", "#111111", "#81ecff") } },
      { id: crypto.randomUUID(), levelId: "family", theme: "家庭时光", title: "晚饭后的客厅时间", summary: "全家坐在一起聊天的时候，总会让我很安心。", reflection: "最普通的日常，常常就是最珍贵的记忆来源。", createdAt: "2026-03-03T10:00:00.000Z", media: { type: "image", src: artSvg("Home Orbit", "#b9fff7", "#131313", "#81ecff") } },
      { id: crypto.randomUUID(), levelId: "dreams", theme: "我想学的本领", title: "我想学会把故事做成作品", summary: "我想把脑海里的世界做成可以被别人看到的东西。", reflection: "网站、游戏、绘本、影像，我还不知道最后是哪一种，但我想继续走下去。", createdAt: "2026-03-01T10:00:00.000Z", media: { type: "video", src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
    ],
  };
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createState();
  } catch {
    return createState();
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}

function levelById(id) {
  return LEVELS.find((level) => level.id === id);
}

function cardsForLevel(levelId) {
  return state.cards
    .filter((card) => card.levelId === levelId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildHomePlanet(level, index) {
  const glowClass = {
    primary: "planet-glow-primary text-primary",
    tertiary: "planet-glow-tertiary text-tertiary",
    error: "planet-glow-error text-error",
    white: "planet-glow-white text-white/80",
  }[level.glow];
  const mix = {
    primary: "to-[#e08efe]",
    tertiary: "to-[#81ecff]",
    error: "to-[#fd6f85]",
    white: "to-[#dfe9df]",
  }[level.glow];
  return `
    <button data-level-nav="${level.id}" class="planet-button absolute ${level.pos} group pointer-events-auto transition-all duration-500 hover:scale-105 focus:outline-none float-animation float-animation-delay-${(index % 5) + 1}">
      <div class="relative rounded-full overflow-hidden shadow-[0_0_60px_rgba(224,142,254,0.2)] border border-white/20 ${glowClass} transition-all duration-500 ${level.size}">
        <div class="absolute inset-0 bg-gradient-to-br from-black via-black/40 ${mix} opacity-90"></div>
        <div class="selection-ring"></div>
        <div class="orbit-particle"></div>
      </div>
      <div class="mt-4 text-center">
        <div class="text-[11px] tracking-[0.35em] uppercase text-white/25">${level.homeCode}</div>
        <div class="text-[24px] md:text-[28px] tracking-[0.18em] uppercase ${level.glow === "error" ? "text-[#c05572]" : level.glow === "tertiary" ? "text-[#87ddec]" : level.glow === "primary" ? "text-[#8a6797]" : "text-white/55"}">${level.homeLabel}</div>
      </div>
    </button>
  `;
}

function renderHomeView() {
  return `
    <nav class="fixed top-0 w-full z-50 bg-neutral-950/40 backdrop-blur-xl border-b border-white/5">
      <div class="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-[1920px] mx-auto">
        <button data-go-home class="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#e08efe] to-[#81ecff] hover:drop-shadow-[0_0_10px_rgba(129,236,255,0.6)] transition-all duration-300 cursor-pointer">Aetheris</button>
        <div class="flex items-center gap-4 md:gap-6">
          <button data-open-profile class="material-symbols-outlined text-fuchsia-300 scale-110 transition-transform active:scale-95 hover:drop-shadow-[0_0_10px_rgba(129,236,255,0.6)]">account_circle</button>
          <button data-open-pin class="material-symbols-outlined text-fuchsia-300 scale-110 transition-transform active:scale-95 hover:drop-shadow-[0_0_10px_rgba(129,236,255,0.6)]">settings</button>
        </div>
      </div>
    </nav>
    <main class="relative h-screen w-full flex items-center justify-center bg-surface overflow-hidden">
      <div class="absolute inset-0 z-0 overflow-hidden">
        <div class="stars"></div>
        <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-tertiary/10 rounded-full blur-[180px] animate-pulse" style="animation-delay:2s;"></div>
        <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-error/5 rounded-full blur-[120px]"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface/80"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-40 pointer-events-none" style="background-image: radial-gradient(circle at 50% 50%, transparent 20%, rgba(14,14,14,0.9) 100%);"></div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-100">
        <div class="orbital-ring orbital-ring-1 w-[400px] h-[400px] rounded-full"></div>
        <div class="orbital-ring orbital-ring-2 w-[650px] h-[650px] rounded-full"></div>
        <div class="orbital-ring orbital-ring-3 w-[950px] h-[950px] rounded-full opacity-80"></div>
        <div class="orbital-ring orbital-ring-4 w-[1300px] h-[1300px] rounded-full opacity-60 hidden md:block"></div>
        <div class="orbital-ring orbital-ring-5 w-[1600px] h-[1600px] rounded-full opacity-40 hidden lg:block"></div>
      </div>
      <div class="relative z-10 text-center px-6 pointer-events-none -translate-y-12 max-w-3xl float-animation">
        <div class="flex flex-col items-center pointer-events-auto mb-10">
          <button data-open-profile class="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-primary/40 p-1.5 mb-8 relative group cursor-pointer transition-all duration-700 hover:scale-105">
            <div class="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-tertiary/30 transition-colors ethereal-glow-soft"></div>
            <img class="w-full h-full rounded-full object-cover relative z-10 border-2 border-white/20" src="${state.profile.avatar}" alt="Owner" />
          </button>
          <h1 class="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-on-surface to-on-surface-variant mb-3">
            欢迎来到我的世界，
            <span class="italic font-light opacity-100 block mt-2 text-2xl md:text-4xl">请选择关卡探索我的世界。</span>
          </h1>
        </div>
      </div>
      <div class="absolute inset-0 pointer-events-none z-20">
        ${LEVELS.map(buildHomePlanet).join("")}
      </div>
      <div class="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-white/20">TRAVERSE THE STARS<div class="w-[2px] h-12 bg-gradient-to-b from-[#e08efe] to-transparent mx-auto mt-3"></div></div>
      ${runtime.editMode ? `<div class="fixed top-[72px] left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-surface-container-high border border-primary/30 text-[10px] font-bold tracking-[0.3em] uppercase text-tertiary">EDITING MODE ACTIVE <button data-exit-edit class="ml-4 px-3 py-1 rounded-full bg-primary/10 text-primary">EXIT</button></div>` : ""}
    </main>
  `;
}

function timelineNode(card, index) {
  const left = index % 2 === 0;
  const levelCards = cardsForLevel(runtime.currentLevelId);
  const dotColor = left ? "bg-primary" : "bg-tertiary";
  const shadow = left ? "shadow-[0_0_15px_rgba(224,142,254,0.6)]" : "shadow-[0_0_15px_rgba(129,236,255,0.6)]";
  return `
    <div class="flex flex-col md:flex-row items-center justify-center w-full group ${runtime.editMode ? "card-container" : ""}">
      ${left ? `
      <div class="w-full md:w-1/2 md:pr-24 flex justify-end order-2 md:order-1">
        <div class="relative max-w-sm w-full">
          ${runtime.editMode ? `<div class="edit-trigger absolute -top-4 -right-4 flex gap-2 z-20"><button data-edit-card="${card.id}" class="w-10 h-10 rounded-full bg-surface-bright border border-outline-variant text-on-surface hover:text-primary transition-colors flex items-center justify-center shadow-lg"><span class="material-symbols-outlined text-lg">edit</span></button><button data-delete-card="${card.id}" class="w-10 h-10 rounded-full bg-surface-bright border border-outline-variant text-on-surface hover:text-error transition-colors flex items-center justify-center shadow-lg"><span class="material-symbols-outlined text-lg">delete</span></button></div>` : ""}
          <div class="absolute -inset-4 bg-primary-container/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <button data-open-card="${card.id}" class="relative text-left bg-surface-container-high/60 backdrop-blur-xl rounded-lg p-6 border border-outline-variant/20 hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden card-glow w-full">
            <img class="w-full h-48 object-cover rounded-md mb-6 grayscale group-hover:grayscale-0 transition-all duration-700" src="${card.media.type === "image" ? card.media.src : artSvg("Video Memory", "#6a4c80", "#14343d", "#81ecff")}" alt="${card.title}" />
            <h3 class="text-2xl font-bold tracking-tight text-white mb-2">${card.title}</h3>
            <p class="text-on-surface-variant text-sm line-clamp-2">${card.summary}</p>
          </button>
        </div>
      </div>
      <div class="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0"><div class="w-4 h-4 rounded-full ${dotColor} border-4 border-surface ${shadow}"></div></div>
      <div class="w-full md:w-1/2 md:pl-24 order-3"><div class="text-on-surface-variant font-mono text-sm tracking-widest opacity-40">${index === 0 ? "T-MINUS 12.000Y" : index === 1 ? "T-MINUS 6.400Y" : "T-MINUS 2.100Y"}</div></div>
      ` : `
      <div class="w-full md:w-1/2 md:pr-24 text-right order-3 md:order-1"><div class="text-on-surface-variant font-mono text-sm tracking-widest opacity-40">${index === 1 ? "T-MINUS 6.400Y" : "T-MINUS 2.100Y"}</div></div>
      <div class="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0"><div class="w-4 h-4 rounded-full ${dotColor} border-4 border-surface ${shadow}"></div></div>
      <div class="w-full md:w-1/2 md:pl-24 order-2">
        <div class="relative max-w-sm w-full">
          ${runtime.editMode ? `<div class="edit-trigger absolute -top-4 -right-4 flex gap-2 z-20"><button data-edit-card="${card.id}" class="w-10 h-10 rounded-full bg-surface-bright border border-outline-variant text-on-surface hover:text-primary transition-colors flex items-center justify-center shadow-lg"><span class="material-symbols-outlined text-lg">edit</span></button><button data-delete-card="${card.id}" class="w-10 h-10 rounded-full bg-surface-bright border border-outline-variant text-on-surface hover:text-error transition-colors flex items-center justify-center shadow-lg"><span class="material-symbols-outlined text-lg">delete</span></button></div>` : ""}
          <div class="absolute -inset-4 bg-tertiary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <button data-open-card="${card.id}" class="relative text-left bg-surface-container-high/60 backdrop-blur-xl rounded-lg p-6 border border-outline-variant/20 hover:border-tertiary/40 transition-all duration-300 cursor-pointer overflow-hidden card-glow w-full">
            <img class="w-full h-48 object-cover rounded-md mb-6 grayscale group-hover:grayscale-0 transition-all duration-700" src="${card.media.type === "image" ? card.media.src : artSvg("Video Memory", "#6a4c80", "#14343d", "#81ecff")}" alt="${card.title}" />
            <h3 class="text-2xl font-bold tracking-tight text-white mb-2">${card.title}</h3>
            <p class="text-on-surface-variant text-sm line-clamp-2">${card.summary}</p>
          </button>
        </div>
      </div>`}
    </div>
  `;
}

function renderLevelView() {
  const level = levelById(runtime.currentLevelId);
  const cards = cardsForLevel(runtime.currentLevelId);
  return `
    <div class="nebula-bg"></div>
    <header class="fixed top-0 w-full z-50 bg-neutral-950/40 backdrop-blur-xl border-b border-white/5 shadow-[0_0_30px_rgba(224,142,254,0.1)]">
      <div class="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-[1920px] mx-auto">
        <button data-go-home class="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#e08efe] to-[#81ecff]">Aetheris</button>
        <div class="flex items-center gap-4 md:gap-6 flex-row">
          ${runtime.editMode ? `<div class="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase mr-4 text-tertiary"><span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-tertiary"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span></span>Editing Mode</div><button data-exit-edit class="px-5 py-2 bg-surface-container-high border border-primary/30 rounded-full text-xs font-bold tracking-wider text-primary hover:bg-primary/10 transition-all">EXIT EDIT MODE</button>` : ""}
          <button data-open-profile class="material-symbols-outlined cursor-pointer hover:text-white transition-colors">account_circle</button>
          <button data-open-pin class="material-symbols-outlined cursor-pointer hover:text-white transition-colors">settings</button>
        </div>
      </div>
    </header>
    <main class="px-4 md:px-8 pb-24 min-h-screen max-w-[1440px] mx-auto pt-[100px]">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
        <div class="max-w-2xl">
          <button data-go-home class="flex items-center gap-2 px-6 py-2 rounded-full bg-surface-container-high border border-outline-variant/20 text-sm font-medium hover:bg-surface-bright transition-all group mb-16">
            <span class="material-symbols-outlined text-primary group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to Orbit
          </button>
          <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-none mb-4">我的<span class="text-primary-container">${level.levelAccent}</span>故事</h1>
          <p class="text-on-surface-variant text-lg max-w-md">沿着这条记忆时间轴继续探索我在这个关卡里的故事内容。</p>
        </div>
        <div class="flex flex-col items-end">
          <div class="text-tertiary font-bold tracking-[0.2em] text-xs uppercase mb-2">Current Epoch</div>
          <div class="text-4xl font-light text-on-surface">2.449.12</div>
        </div>
      </div>
      <div class="relative flex flex-col items-center py-0">
        <div class="absolute top-0 bottom-0 time-axis-line left-1/2 -translate-x-1/2 z-0"></div>
        <div class="w-full relative z-10 space-y-32">
          ${runtime.editMode ? `
            <div class="flex flex-col md:flex-row items-center justify-center w-full">
              <div class="w-full md:w-1/2 md:pr-24 flex justify-end order-2 md:order-1">
                <div class="relative max-w-sm w-full">
                  <button data-add-card class="border-2 border-dashed border-outline-variant/30 rounded-lg p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group w-full">
                    <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20 text-primary group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-3xl">add</span>
                    </div>
                    <span class="text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant group-hover:text-primary transition-colors">${cards.length ? "新增卡片" : "新增第一张卡片"}</span>
                  </button>
                </div>
              </div>
              <div class="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0"><div class="w-2 h-2 rounded-full bg-outline-variant opacity-30"></div></div>
              <div class="w-full md:w-1/2 md:pl-24 order-3"></div>
            </div>` : ""}
          ${cards.length ? cards.map(timelineNode).join("") : `
            <div class="flex flex-col md:flex-row items-center justify-center w-full group pt-8">
              <div class="w-full md:w-1/2 md:pr-24 text-right order-3 md:order-1"><div class="text-tertiary font-mono text-sm tracking-widest animate-pulse">PRESENT DAY</div></div>
              <div class="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0"><div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-container to-tertiary shadow-[0_0_30px_rgba(129,236,255,0.8)]"></div></div>
              <div class="w-full md:w-1/2 md:pl-24 order-2"><div class="text-on-surface font-bold tracking-tighter text-xl">${runtime.editMode ? "这个关卡暂时还没有故事内容" : "暂时还没有故事内容"}</div></div>
            </div>`}
          <div class="flex flex-col md:flex-row items-center justify-center w-full group pt-8">
            <div class="w-full md:w-1/2 md:pr-24 text-right order-3 md:order-1"><div class="text-tertiary font-mono text-sm tracking-widest animate-pulse">PRESENT DAY</div></div>
            <div class="relative flex items-center justify-center w-12 h-12 shrink-0 order-1 md:order-2 my-8 md:my-0"><div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-container to-tertiary shadow-[0_0_30px_rgba(129,236,255,0.8)]"></div></div>
            <div class="w-full md:w-1/2 md:pl-24 order-2"><div class="text-on-surface font-bold tracking-tighter text-xl">Explore My Story</div></div>
          </div>
        </div>
      </div>
    </main>
    <footer class="w-full py-8 flex flex-col items-center justify-center border-t border-white/5 bg-black mt-auto"><div class="text-neutral-500 text-[10px] tracking-widest uppercase opacity-60">© 2024 The Celestial Architect.</div></footer>
  `;
}

function profileOverlay(editing = false) {
  const editLink = runtime.editMode && !editing ? `<span data-open-profile-editor class="text-tertiary font-label text-xs uppercase tracking-[0.3em] ml-2 cursor-pointer hover:opacity-80 transition-opacity"><span class="material-symbols-outlined !text-xs align-middle mr-1">edit</span>EDIT</span>` : "";
  if (!editing) {
    return `
      <div class="fixed inset-0 z-[100] flex items-center justify-center px-6 py-12">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-xl" data-close-overlay></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="glass-panel relative w-full max-w-2xl rounded-xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center px-8 py-16 text-center z-10">
          <button data-close-overlay class="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant transition-all duration-300 active:scale-90 group"><span class="material-symbols-outlined text-2xl">close</span></button>
          <div class="relative mb-10 group">
            <div class="absolute inset-0 bg-primary-container/40 rounded-full blur-2xl scale-110 group-hover:bg-tertiary/60 transition-all duration-700 animate-neon-pulse"></div>
            <div class="relative w-48 h-48 rounded-full border-2 border-white/10 p-2 bg-surface-container-high/40 backdrop-blur-md"><img class="w-full h-full rounded-full object-cover" src="${state.profile.avatar}" alt="profile" /></div>
            <div class="absolute bottom-4 right-4 w-6 h-6 bg-[#81ecff] rounded-full border-4 border-surface shadow-[0_0_15px_rgba(129,236,255,0.8)]"></div>
          </div>
          <div class="space-y-6">
            <div>
              <span class="text-tertiary font-label text-xs uppercase tracking-[0.3em] mb-2 block">THE STAR TRAVELLER</span>
              <h1 class="font-bold tracking-tighter text-on-surface mb-4 text-4xl md:text-5xl">${state.profile.name}</h1>
            </div>
            <p class="text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-lg font-light tracking-wide italic">${state.profile.bio}${editLink}</p>
            <div class="grid grid-cols-3 gap-4 pt-8 w-full">
              <div class="bg-white/5 rounded-lg py-4 px-2 border border-white/5"><div class="text-primary text-2xl font-bold">6</div><div class="text-on-surface-variant text-[10px] uppercase tracking-widest mt-1">STAR-MAPS</div></div>
              <div class="bg-white/5 rounded-lg py-4 px-2 border border-white/5"><div class="text-tertiary text-2xl font-bold">${state.cards.length}</div><div class="text-on-surface-variant text-[10px] uppercase tracking-widest mt-1">CHRONICLES</div></div>
              <div class="bg-white/5 rounded-lg py-4 px-2 border border-white/5"><div class="text-on-surface text-2xl font-bold">LIVE</div><div class="text-on-surface-variant text-[10px] uppercase tracking-widest mt-1">STATUS</div></div>
            </div>
            <div class="pt-10 flex flex-col sm:flex-row gap-4 justify-center w-full">
              <button class="bg-gradient-to-br from-primary-container to-primary-dim text-on-primary-container px-10 py-4 rounded-full font-bold text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(224,142,254,0.3)] hover:shadow-[0_0_30px_rgba(129,236,255,0.4)] transition-all duration-300 active:scale-95">Continue Voyage</button>
              <button data-close-overlay class="bg-surface-container-highest/60 border border-white/10 text-on-surface px-10 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-white/10 transition-all duration-300 active:scale-95">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="fixed inset-0 z-[100] overflow-auto bg-surface text-on-surface">
      <div class="nebula-glow absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"></div>
      <div class="nebula-glow absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"></div>
      <header class="flex justify-between items-center px-8 h-20 shrink-0">
        <button data-open-profile class="group flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors duration-300">
          <span class="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span class="text-sm font-bold tracking-widest uppercase">Go Back</span>
        </button>
        <div class="w-24"></div>
      </header>
      <main class="flex-1 flex flex-col items-center justify-center px-6 pb-10 max-w-4xl mx-auto w-full">
        <section class="w-full flex flex-col items-center mb-10 relative shrink-0">
          <div class="relative group flex flex-col items-center">
            <div class="absolute inset-0 rounded-full bg-[#e08efe]/5 blur-3xl group-hover:bg-[#e08efe]/15 transition-all duration-700 scale-110"></div>
            <div class="relative w-36 h-36 md:w-44 md:h-44 rounded-full p-1 bg-gradient-to-tr from-outline-variant/20 to-transparent shadow-[0_0_30px_rgba(224,142,254,0.15)]">
              <img class="w-full h-full object-cover rounded-full" src="${state.profile.avatar}" alt="avatar" />
              <button data-open-avatar-generator class="absolute bottom-2 right-2 bg-primary-container text-on-primary-container p-3 rounded-full shadow-[0_0_10px_rgba(224,142,254,0.3)] hover:scale-110 transition-transform duration-300"><span class="material-symbols-outlined text-xl">photo_camera</span></button>
            </div>
            <div class="mt-6 text-center">
              <h1 class="font-extrabold tracking-tighter mb-1 text-4xl md:text-5xl">Refine Your <span class="bg-clip-text text-transparent bg-gradient-to-r from-[#e08efe] to-[#81ecff]">Celestial Identity</span></h1>
              <p class="mt-1 text-on-surface-variant uppercase tracking-[0.3em] text-[10px] font-bold">THE STAR TRAVELLER</p>
            </div>
          </div>
        </section>
        <section class="w-full shrink">
          <div class="glass-panel p-6 md:p-8 rounded-xl border border-outline-variant/10 shadow-2xl shadow-fuchsia-900/5">
            <form id="profile-form" class="space-y-8">
              <div class="grid grid-cols-1 gap-8">
                <div class="relative group">
                  <label class="block text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-2">Full Identity Name</label>
                  <input name="name" class="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 py-2 text-lg md:text-xl font-medium focus:ring-0 focus:border-primary transition-all duration-300 placeholder-on-surface-variant/30" value="${state.profile.name}" />
                  <div class="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-container to-tertiary group-focus-within:w-full transition-all duration-500"></div>
                </div>
                <div class="relative group">
                  <label class="block text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-2">Motto & Chronicle Bio</label>
                  <textarea name="bio" class="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 py-2 text-base md:text-lg font-light leading-relaxed focus:ring-0 focus:border-primary transition-all duration-300 resize-none placeholder-on-surface-variant/30" rows="3">${state.profile.bio}</textarea>
                  <div class="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-container to-tertiary group-focus-within:w-full transition-all duration-500"></div>
                </div>
              </div>
              <div class="flex flex-col md:flex-row items-center justify-end gap-4 pt-2">
                <button data-open-profile type="button" class="w-full md:w-auto px-8 py-3 rounded-full text-on-surface-variant font-bold hover:text-on-surface transition-all duration-300 text-sm">Cancel Changes</button>
                <button type="submit" class="w-full md:w-auto px-10 py-3 rounded-full bg-gradient-to-tr from-primary-container to-primary-dim text-on-primary-container font-extrabold shadow-[0_0_20px_rgba(224,142,254,0.2)] hover:shadow-[0_0_35px_rgba(224,142,254,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm">Save Identity</button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  `;
}

function pinOverlay() {
  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[30px]">
      <div class="nebula-orb w-[600px] h-[600px] bg-primary-container top-1/2 left-1/2 -translate-x-full -translate-y-full rounded-full"></div>
      <div class="nebula-orb w-[400px] h-[400px] bg-tertiary bottom-0 right-0 rounded-full"></div>
      <div class="glass-pane w-full max-w-md mx-4 p-10 rounded-xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary-container/10 blur-3xl rounded-full"></div>
        <div class="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-8 border border-outline-variant/20"><span class="material-symbols-outlined text-[#e08efe] text-3xl">lock_open</span></div>
        <h2 class="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Enter Editing Mode</h2>
        <p class="text-on-surface-variant text-sm mb-12 tracking-wide">Enter your secure access PIN to modify the Chronicles of your world.</p>
        <form id="pin-form" class="w-full">
          <div class="w-full mb-12 group"><input name="pin" class="w-full bg-transparent border-0 border-b-2 border-outline-variant/30 text-center text-3xl tracking-[1.5em] font-light py-2 focus:ring-0 focus:border-transparent transition-all placeholder:text-surface-container-highest focus:placeholder-transparent outline-none" maxlength="6" placeholder="••••" style="border-image: linear-gradient(to right, transparent, #484848, transparent) 1;" type="password" /></div>
          <div class="text-error text-sm mb-4 hidden" id="pin-error">PIN 不正确，请重试。</div>
          <div class="flex flex-col sm:flex-row gap-4 w-full">
            <button data-close-overlay type="button" class="flex-1 py-4 px-8 rounded-full border border-outline-variant/20 bg-white/5 hover:bg-white/10 text-on-surface font-medium transition-all active:scale-95">Cancel</button>
            <button type="submit" class="flex-1 py-4 px-8 rounded-full soul-gradient text-black font-bold shadow-[0_0_20px_rgba(224,142,254,0.3)] hover:shadow-[0_0_30px_rgba(129,236,255,0.4)] hover:brightness-110 transition-all active:scale-95">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function cardDetailOverlay(card) {
  const editActions = runtime.editMode ? `<div class="flex gap-3 mt-8"><button data-start-edit="${card.id}" class="px-6 py-3 rounded-full bg-gradient-to-br from-primary-container to-primary-dim text-black font-bold text-sm shadow-[0_0_15px_rgba(224,142,254,0.4)]">编辑</button><button data-delete-card="${card.id}" class="px-6 py-3 rounded-full bg-[#fd6f85] text-black font-bold text-sm">删除</button></div>` : "";
  const media = card.media.type === "image"
    ? `<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${card.media.src}" alt="${card.title}" />`
    : `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${new URL(card.media.src).searchParams.get("v") || "dQw4w9WgXcQ"}" title="${card.title}" allowfullscreen></iframe>`;
  return `
    <main class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-[20px]">
      <article class="glass-panel ghost-border w-full max-w-6xl max-h-[921px] rounded-xl overflow-hidden flex flex-col md:flex-row relative shadow-[0_20px_100px_rgba(0,0,0,0.8)]">
        <button data-close-overlay class="absolute top-6 right-6 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"><span class="material-symbols-outlined text-on-surface-variant">close</span></button>
        <div class="w-full md:w-3/5 h-64 md:h-auto relative overflow-hidden group">${media}${card.media.type === "image" ? `<div class="absolute inset-0 flex items-center justify-center"><div class="w-20 h-20 rounded-full bg-primary-container/20 backdrop-blur-md flex items-center justify-center border border-primary-container/30"><span class="material-symbols-outlined text-primary-container text-4xl" style="font-variation-settings:'FILL' 1;">play_arrow</span></div></div>` : ""}</div>
        <div class="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center bg-surface-container/30">
          <div class="space-y-8">
            <div>
              <div class="flex items-center gap-3 mb-4"><span class="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase border border-tertiary/30 text-tertiary">Memory Node</span><span class="text-on-surface-variant text-xs tracking-widest uppercase">${formatDate(card.createdAt)}</span></div>
              <h1 class="text-4xl md:text-5xl font-extrabold tracking-tighter text-white leading-none mb-4">${card.title}</h1>
              <p class="text-lg text-on-surface font-medium leading-relaxed italic">${card.summary}</p>
            </div>
            <div class="space-y-4">
              <h2 class="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">背后的故事</h2>
              <div class="space-y-4 text-on-surface-variant text-sm leading-relaxed font-light"><p>${card.reflection}</p></div>
            </div>
            ${editActions}
          </div>
        </div>
      </article>
    </main>
  `;
}

function cardEditorOverlay(card) {
  const editing = Boolean(card);
  const themes = LEVEL_THEMES[runtime.currentLevelId];
  const imageMedia = card?.media.type !== "video";
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm">
      <div class="relative w-full max-w-5xl glass-panel rounded-xl ghost-border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh]">
        <button data-close-overlay class="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant"><span class="material-symbols-outlined">close</span></button>
        <form id="card-form" class="w-full flex flex-col md:flex-row">
          <div class="w-full md:w-5/12 p-8 md:p-12 border-r border-outline-variant/10 overflow-y-auto">
            <div class="space-y-10">
              <header><span class="text-[10px] uppercase tracking-[0.3em] text-tertiary font-bold mb-2 block">STORY ARCHITECT</span><h2 class="text-4xl font-extrabold tracking-tight text-on-surface leading-tight">${editing ? "Edit Story Details" : "Create Story Details"}</h2></header>
              <div class="space-y-8">
                <div class="group">
                  <label class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">STORY TOPIC</label>
                  <div class="relative">
                    <select name="theme" ${editing ? "disabled" : ""} class="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 rounded py-3.5 px-4 appearance-none text-on-surface focus:ring-0 focus:border-primary/50 transition-all cursor-pointer relative z-10" style="background-image:url(&quot;data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23acabaa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e&quot;); background-position:right 1rem center; background-repeat:no-repeat; background-size:1.25em 1.25em;">${themes.map((theme) => `<option value="${theme}" ${card?.theme === theme ? "selected" : ""}>${theme}</option>`).join("")}</select>
                  </div>
                </div>
                <div class="group"><label class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">STORY TITLE</label><input name="title" class="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 focus:border-primary/50 text-2xl font-bold tracking-tight text-on-surface px-5 py-4 focus:ring-0 transition-all outline-none rounded" value="${card?.title || ""}" /></div>
                <div class="group"><label class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">CORE ESSENCE (ONE SENTENCE)</label><textarea name="summary" class="w-full bg-surface-container-low/40 backdrop-blur-md border border-outline-variant/10 focus:border-tertiary/50 text-on-secondary-container italic py-4 px-5 focus:ring-0 transition-all outline-none resize-none rounded" rows="3">${card?.summary || ""}</textarea></div>
              </div>
            </div>
          </div>
          <div class="w-full md:w-7/12 p-8 md:p-12 bg-white/[0.02] flex flex-col overflow-y-auto">
            <div class="space-y-10 flex-grow">
              <div class="group"><label class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 block">Backstory & Reflection</label><textarea name="reflection" class="w-full bg-surface-container-low/40 backdrop-blur-md rounded border border-outline-variant/10 px-5 py-4 text-on-surface-variant leading-relaxed focus:ring-0 focus:border-tertiary/50 outline-none transition-all resize-none" rows="4">${card?.reflection || ""}</textarea></div>
              <div>
                <div class="flex items-center justify-between mb-6">
                  <label class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">UPLOAD MEDIA</label>
                  <div class="flex bg-surface-container-high p-1 rounded-full ghost-border">
                    <label class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${imageMedia ? "bg-gradient-to-br from-primary-container to-primary-dim text-on-primary" : "text-on-surface-variant"}"><input class="hidden" type="radio" name="mediaType" value="image" ${imageMedia ? "checked" : ""}/>Image</label>
                    <label class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${!imageMedia ? "bg-gradient-to-br from-primary-container to-primary-dim text-on-primary" : "text-on-surface-variant"}"><input class="hidden" type="radio" name="mediaType" value="video" ${!imageMedia ? "checked" : ""}/>Video</label>
                  </div>
                </div>
                <div class="space-y-6">
                  <div class="relative aspect-video overflow-hidden group border bg-black border-white/10">
                    <img class="h-full w-full object-cover opacity-60" src="${card?.media.type === "image" ? card.media.src : artSvg("Uploading Video", "#6d4788", "#17353d", "#81ecff")}" />
                    <div class="absolute inset-0 flex flex-col items-center justify-center bg-surface/40 backdrop-blur-sm"><div class="relative mb-4 w-16 h-16"><div class="absolute inset-0 rounded-full border-2 border-tertiary/20 border-t-tertiary animate-[spin_3s_linear_infinite]"></div><div class="absolute inset-0 flex items-center justify-center"><span class="material-symbols-outlined text-xl text-tertiary" style="font-variation-settings:'FILL' 1;">${imageMedia ? "image" : "videocam"}</span></div></div><h3 class="text-xl font-headline font-bold text-white tracking-tight"><span class="text-sm font-medium tracking-wider text-white/90">${imageMedia ? "Media Preview" : "74% complete..."}</span></h3><p class="text-[11px] text-on-surface-variant max-w-[280px] text-center mt-2 leading-relaxed">${imageMedia ? "上传图片或粘贴图片链接" : "Uploading Video, Processing Assets"}</p></div>
                    <div class="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20 overflow-hidden"><div class="h-full bg-gradient-to-r from-primary-container to-tertiary w-3/4 shadow-[0_0_10px_#81ecff]"></div></div>
                  </div>
                  <div class="group mt-6 flex items-center relative">
                    <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><span class="material-symbols-outlined text-xl text-tertiary/70">link</span></div>
                    <input name="media" class="w-full rounded-full border border-outline-variant/20 bg-surface-container-low/40 backdrop-blur-md py-4 pl-14 pr-12 text-[13px] italic text-on-surface placeholder:text-outline-variant/40 focus:border-tertiary/50 focus:ring-0 transition-all outline-none font-mono" placeholder="${imageMedia ? "Image URL..." : "Source URL..."}" value="${card?.media.type === "video" ? card.media.src : ""}" />
                    <button type="button" class="absolute right-4 text-neutral-500 hover:text-primary transition-colors flex items-center justify-center p-1"><span class="material-symbols-outlined text-xl">check</span></button>
                  </div>
                </div>
              </div>
            </div>
            <div class="pt-8 mt-auto flex items-center justify-end gap-6 border-t border-outline-variant/10">
              <button data-close-overlay type="button" class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors">Cancel</button>
              <button type="submit" class="bg-gradient-to-br from-primary-container to-primary-dim text-on-primary px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(224,142,254,0.3)] hover:shadow-[0_0_30px_rgba(129,236,255,0.4)] transition-all transform active:scale-95">Save Story</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

function deleteOverlay() {
  return `
    <div class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl">
      <div class="glass-panel relative w-full max-w-md rounded-xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center px-8 py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-[#fd6f85]/20 flex items-center justify-center mb-8 border border-[#fd6f85]/20"><span class="material-symbols-outlined text-[#fd6f85] text-3xl">delete</span></div>
        <h2 class="text-3xl font-extrabold tracking-tight text-on-surface mb-4">Dissolve Chronicle?</h2>
        <p class="text-on-surface-variant text-sm mb-12 tracking-wide">Are you sure you want to remove this memory from your world? This action cannot be undone.</p>
        <div class="flex flex-col sm:flex-row gap-4 w-full">
          <button data-close-overlay class="flex-1 py-4 px-8 rounded-full border border-outline-variant/20 bg-white/5 hover:bg-white/10 text-on-surface font-medium transition-all active:scale-95">Cancel</button>
          <button data-confirm-delete class="flex-1 py-4 px-8 rounded-full bg-[#fd6f85] text-black font-bold shadow-[0_0_20px_rgba(253,111,133,0.3)] transition-all active:scale-95">Dissolve</button>
        </div>
      </div>
    </div>
  `;
}

function avatarOverlay() {
  const generated = runtime.avatarCandidates.length > 0;
  return `
    <div class="fixed inset-0 z-[120] overflow-auto bg-surface">
      <div class="absolute inset-0 bg-gradient-to-br from-[#211327] via-[#0e0e0e] to-[#162124]"></div>
      <div class="relative min-h-screen p-8">
        <button data-open-profile-editor class="group flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors duration-300 mb-8"><span class="material-symbols-outlined text-2xl group-hover:-translate-x-1 transition-transform">arrow_back</span><span class="text-sm font-bold tracking-widest uppercase">Go Back</span></button>
        <div class="max-w-6xl mx-auto">
          <div class="flex items-start justify-between gap-8 mb-4">
            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#e08efe] to-[#d180ef]">Generate Avatar</h1>
            <div class="text-right pt-4"><div class="text-xl text-on-surface-variant">Refine Your Celestial Identity</div><div class="text-[10px] tracking-[0.3em] uppercase text-tertiary font-bold mt-2">Neural Link Active</div></div>
          </div>
          <div class="grid md:grid-cols-[340px_1fr] rounded-[28px] overflow-hidden border border-white/5 bg-white/[0.02]">
            <form id="avatar-form" class="p-8 bg-white/[0.02]">
              <div class="space-y-6">
                <label class="block"><div class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2">Hairstyle</div><select name="hair" class="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3"><option>柔光长发</option><option>星轨短发</option><option>蓬松卷发</option><option>高马尾</option></select></label>
                <label class="block"><div class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2">Expression</div><select name="expression" class="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3"><option>自信坚定</option><option>温柔平静</option><option>开心微笑</option><option>灵动俏皮</option></select></label>
                <div><div class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-3">Art Style</div><div class="flex gap-3"><label class="flex-1"><input class="hidden peer" type="radio" name="style" value="Celestial Ink" checked><span class="block text-center px-4 py-3 rounded-full bg-[#3a2345] text-[#efc5ff] peer-checked:shadow-[0_0_18px_rgba(224,142,254,0.2)]">Celestial Ink</span></label><label class="flex-1"><input class="hidden peer" type="radio" name="style" value="Vaporwave Synth"><span class="block text-center px-4 py-3 rounded-full bg-transparent text-on-surface-variant peer-checked:bg-[#3a2345] peer-checked:text-[#efc5ff]">Vaporwave Synth</span></label></div></div>
                <div><div class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-3">Color Palette</div><div class="flex gap-3"><label><input class="hidden peer" type="radio" name="palette" value="lavender" checked><span class="block w-8 h-8 rounded-full bg-[#dd88fd] ring-2 ring-transparent peer-checked:ring-white"></span></label><label><input class="hidden peer" type="radio" name="palette" value="cyan"><span class="block w-8 h-8 rounded-full bg-[#8ef1ff] ring-2 ring-transparent peer-checked:ring-white"></span></label><label><input class="hidden peer" type="radio" name="palette" value="sage"><span class="block w-8 h-8 rounded-full bg-[#c7d7c4] ring-2 ring-transparent peer-checked:ring-white"></span></label><label><input class="hidden peer" type="radio" name="palette" value="rose"><span class="block w-8 h-8 rounded-full bg-[#d85b72] ring-2 ring-transparent peer-checked:ring-white"></span></label></div></div>
                <label class="block"><div class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2">Clothing Style</div><input name="outfit" class="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3" placeholder="e.g. Chrome Plated Robes" value="学院风与探险披风"></label>
                <label class="block"><div class="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-2">Additional Notes</div><textarea name="notes" class="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 resize-none" rows="3" placeholder="Whispers of stardust...">像游戏主角一样，安静但有发光感。</textarea></label>
                <button type="submit" class="w-full py-5 rounded-full bg-gradient-to-r from-[#d87cfc] to-[#d180ef] text-black font-bold tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(224,142,254,0.3)]">Generate Avatar</button>
              </div>
            </form>
            <div class="p-6 md:p-8">
              <div class="rounded-[28px] border border-white/5 bg-black/25 h-full min-h-[480px] flex items-center justify-center">
                ${generated ? `
                  <div class="w-full max-w-[560px] rounded-[28px] bg-black/25 border border-white/5 p-8 text-center">
                    <div class="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold mb-10">Generated Entities</div>
                    <div class="flex items-center justify-center gap-6 mb-12">
                      ${runtime.avatarCandidates.map((item) => `
                        <button data-pick-avatar="${item.id}" class="relative ${runtime.selectedAvatarId === item.id ? "scale-110" : ""}">
                          <img src="${item.src}" class="w-24 h-24 md:w-28 md:h-28 rounded-full ${runtime.selectedAvatarId === item.id ? "ring-2 ring-[#81ecff] shadow-[0_0_30px_rgba(129,236,255,0.4)]" : "opacity-80"}" alt="candidate" />
                          ${runtime.selectedAvatarId === item.id ? `<span class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#81ecff] text-black flex items-center justify-center text-xs">✓</span>` : ""}
                        </button>
                      `).join("")}
                    </div>
                    <div class="flex items-center justify-center gap-6">
                      <button data-regenerate-avatar class="text-white/60 text-sm tracking-[0.3em] uppercase">Regenerate</button>
                      <button data-save-avatar class="px-8 py-4 rounded-full bg-[#8ee7ff] text-black font-bold tracking-[0.2em] uppercase">Save Selection</button>
                    </div>
                  </div>` : `
                  <div class="w-full max-w-[560px] rounded-[28px] bg-black/25 border border-white/5 p-8 text-center">
                    <div class="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold mb-10">Neural Void</div>
                    <div class="w-28 h-28 rounded-full bg-[#9d6bb0]/30 mx-auto mb-10 shadow-[0_0_40px_rgba(224,142,254,0.25)]"></div>
                    <div class="text-[#d887ff] font-bold tracking-[0.12em] uppercase mb-2">Ready To Synthesize</div>
                    <div class="text-white/30 tracking-[0.25em] uppercase text-xs mb-10">Awaiting Generation Parameters</div>
                    <button class="px-10 py-3 rounded-full border border-[#3a2345] text-[#7b6982] tracking-[0.28em] uppercase text-xs">System Standby</button>
                  </div>`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOverlay() {
  if (runtime.overlay === "pin") return pinOverlay();
  if (runtime.overlay === "profile") return profileOverlay(false);
  if (runtime.overlay === "profile-editor") return profileOverlay(true);
  if (runtime.overlay === "avatar") return avatarOverlay();
  if (runtime.overlay === "delete") return deleteOverlay();
  if (runtime.overlay === "card-editor") return cardEditorOverlay(state.cards.find((card) => card.id === runtime.editingCardId));
  if (runtime.overlay === "detail") {
    const card = state.cards.find((item) => item.id === runtime.selectedCardId);
    return card ? cardDetailOverlay(card) : "";
  }
  return "";
}

function render() {
  app.innerHTML = `
    ${runtime.view === "home" ? renderHomeView() : renderLevelView()}
    ${renderOverlay()}
  `;
  bindEvents();
}

function openOverlay(name) {
  runtime.overlay = name;
  render();
}

function closeOverlay() {
  runtime.overlay = null;
  runtime.editingCardId = null;
  runtime.deletingCardId = null;
  render();
}

function generateAvatars(formDataObj) {
  const paletteMap = {
    lavender: ["#e08efe", "#81ecff"],
    cyan: ["#81ecff", "#dffcff"],
    sage: ["#c7d7c4", "#effef0"],
    rose: ["#d85b72", "#ffb7c5"],
  };
  const [a, b] = paletteMap[formDataObj.palette] || paletteMap.lavender;
  runtime.avatarCandidates = [0, 1, 2].map((index) => ({ id: `avatar-${Date.now()}-${index}`, src: avatarSvg(index * 3, a, b), prompt: formDataObj }));
  runtime.selectedAvatarId = runtime.avatarCandidates[1].id;
}

function bindEvents() {
  document.querySelectorAll("[data-go-home]").forEach((button) => button.addEventListener("click", () => {
    runtime.view = "home";
    runtime.currentLevelId = "school";
    render();
  }));

  document.querySelectorAll("[data-level-nav]").forEach((button) => button.addEventListener("click", () => {
    runtime.currentLevelId = button.dataset.levelNav;
    runtime.view = "level";
    render();
  }));

  document.querySelectorAll("[data-open-profile]").forEach((button) => button.addEventListener("click", () => openOverlay("profile")));
  document.querySelectorAll("[data-open-pin]").forEach((button) => button.addEventListener("click", () => {
    if (!runtime.editMode) openOverlay("pin");
  }));
  document.querySelectorAll("[data-close-overlay]").forEach((button) => button.addEventListener("click", closeOverlay));
  document.querySelectorAll("[data-open-profile-editor]").forEach((button) => button.addEventListener("click", () => openOverlay("profile-editor")));
  document.querySelectorAll("[data-open-avatar-generator]").forEach((button) => button.addEventListener("click", () => openOverlay("avatar")));
  document.querySelectorAll("[data-open-card]").forEach((button) => button.addEventListener("click", () => {
    runtime.selectedCardId = button.dataset.openCard;
    openOverlay("detail");
  }));
  document.querySelectorAll("[data-start-edit], [data-edit-card]").forEach((button) => button.addEventListener("click", () => {
    runtime.editingCardId = button.dataset.startEdit || button.dataset.editCard;
    openOverlay("card-editor");
  }));
  document.querySelectorAll("[data-delete-card]").forEach((button) => button.addEventListener("click", () => {
    runtime.deletingCardId = button.dataset.deleteCard;
    openOverlay("delete");
  }));
  document.querySelectorAll("[data-add-card]").forEach((button) => button.addEventListener("click", () => {
    runtime.editingCardId = null;
    openOverlay("card-editor");
  }));
  document.querySelectorAll("[data-exit-edit]").forEach((button) => button.addEventListener("click", () => {
    runtime.editMode = false;
    runtime.overlay = null;
    render();
  }));

  const pinForm = document.querySelector("#pin-form");
  if (pinForm) {
    pinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const pin = new FormData(pinForm).get("pin");
      const error = document.querySelector("#pin-error");
      if (pin !== OWNER_PIN) {
        error.classList.remove("hidden");
        return;
      }
      runtime.editMode = true;
      runtime.overlay = null;
      render();
    });
  }

  const profileForm = document.querySelector("#profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(profileForm);
      state.profile.name = String(data.get("name") || "").trim() || state.profile.name;
      state.profile.bio = String(data.get("bio") || "").trim() || state.profile.bio;
      saveState();
      runtime.overlay = "profile";
      render();
    });
  }

  const avatarForm = document.querySelector("#avatar-form");
  if (avatarForm) {
    avatarForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(avatarForm).entries());
      generateAvatars(data);
      render();
      runtime.overlay = "avatar";
      render();
    });
  }

  document.querySelectorAll("[data-pick-avatar]").forEach((button) => button.addEventListener("click", () => {
    runtime.selectedAvatarId = button.dataset.pickAvatar;
    render();
  }));
  document.querySelectorAll("[data-regenerate-avatar]").forEach((button) => button.addEventListener("click", () => {
    const candidate = runtime.avatarCandidates[0];
    generateAvatars(candidate?.prompt || state.profile.avatarPrompt);
    render();
    runtime.overlay = "avatar";
    render();
  }));
  document.querySelectorAll("[data-save-avatar]").forEach((button) => button.addEventListener("click", () => {
    const selected = runtime.avatarCandidates.find((item) => item.id === runtime.selectedAvatarId);
    if (!selected) return;
    state.profile.avatar = selected.src;
    state.profile.avatarPrompt = selected.prompt;
    saveState();
    runtime.overlay = "profile-editor";
    render();
  }));

  const cardForm = document.querySelector("#card-form");
  if (cardForm) {
    cardForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(cardForm);
      const existing = state.cards.find((card) => card.id === runtime.editingCardId);
      const mediaType = data.get("mediaType") || "image";
      const mediaValue = String(data.get("media") || "").trim();
      const media = mediaType === "video"
        ? { type: "video", src: mediaValue || "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        : { type: "image", src: mediaValue || artSvg(String(data.get("title") || "Story"), "#d2d2d2", "#111111", "#81ecff") };
      const next = {
        id: existing?.id || crypto.randomUUID(),
        levelId: runtime.currentLevelId,
        theme: existing?.theme || String(data.get("theme")),
        title: String(data.get("title") || "").trim(),
        summary: String(data.get("summary") || "").trim(),
        reflection: String(data.get("reflection") || "").trim(),
        media,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      if (existing) {
        state.cards = state.cards.map((card) => (card.id === existing.id ? next : card));
      } else {
        state.cards.unshift(next);
      }
      saveState();
      closeOverlay();
    });
  }

  const confirmDelete = document.querySelector("[data-confirm-delete]");
  if (confirmDelete) {
    confirmDelete.addEventListener("click", () => {
      state.cards = state.cards.filter((card) => card.id !== runtime.deletingCardId);
      saveState();
      closeOverlay();
    });
  }
}

render();
