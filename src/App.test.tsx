/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { splitProfileDisplayName } from "./App";

const bootstrapPayload = {
  owner: {
    authenticated: true
  },
  profile: {
    name: "多拉探索者",
    bio: "这是我的星际寄语",
    avatarImagePath: "/uploads/avatar.png",
    avatarPromptJson: {
      hair: "利落短发",
      expression: "冷静注视",
      style: "电影级写实",
      palette: "lavender",
      outfit: "学院风",
      notes: "像游戏主角一样，安静但有发光感。"
    },
    updatedAt: "2026-04-18T00:00:00.000Z"
  },
  cards: []
};

function createJsonResponse(body: unknown) {
  return {
    ok: true,
    headers: {
      get: () => "application/json"
    },
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as Response;
}

describe("avatar generation entry flow", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method ?? "GET";

        if (url === "/api/owner/session" && method === "DELETE") {
          return createJsonResponse({ authenticated: false });
        }

        if (url === "/api/bootstrap") {
          return createJsonResponse(bootstrapPayload);
        }

        return createJsonResponse({});
      })
    );

    window.scrollTo = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens the avatar generation screen after clicking the camera icon in profile edit", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });

    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");

    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));

    expect(await screen.findByRole("heading", { name: "生成星际头像" })).toBeTruthy();
    expect(screen.getByText("Go Back")).toBeTruthy();
  }, 10000);

  it("keeps the original profile avatar if the user goes back without saving a generated selection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method ?? "GET";

        if (url === "/api/owner/session" && method === "DELETE") {
          return createJsonResponse({ authenticated: false });
        }

        if (url === "/api/bootstrap") {
          return createJsonResponse(bootstrapPayload);
        }

        if (url === "/api/profile/avatar/generate" && method === "POST") {
          return createJsonResponse({
            candidates: ["/generated-1.png", "/generated-2.png", "/generated-3.png"],
            prompt: bootstrapPayload.profile.avatarPromptJson
          });
        }

        return createJsonResponse({});
      })
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });

    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");

    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));
    await screen.findByRole("heading", { name: "生成星际头像" });

    fireEvent.click(screen.getByRole("button", { name: /生成星际头像/i }));

    const selectedAvatar = (await screen.findByAltText("Selected generated avatar")) as HTMLImageElement;
    expect(selectedAvatar.getAttribute("src")).toBe("/generated-2.png");
    expect(screen.getByText("已选中")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Go Back/i }));

    const profileImage = (await screen.findByAltText("Architect Profile")) as HTMLImageElement;
    expect(profileImage.getAttribute("src")).toBe("/uploads/avatar.png");
  }, 10000);

  it("keeps outfit empty after generating candidates instead of auto-filling the default outfit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method ?? "GET";

        if (url === "/api/owner/session" && method === "DELETE") {
          return createJsonResponse({ authenticated: false });
        }

        if (url === "/api/bootstrap") {
          return createJsonResponse(bootstrapPayload);
        }

        if (url === "/api/profile/avatar/generate" && method === "POST") {
          return createJsonResponse({
            candidates: ["/generated-a.png", "/generated-b.png", "/generated-c.png"],
            prompt: {
              ...bootstrapPayload.profile.avatarPromptJson,
              outfit: "学院风"
            }
          });
        }

        return createJsonResponse({});
      })
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });
    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");
    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));
    await screen.findByRole("heading", { name: "生成星际头像" });

    const outfitInput = screen.getByRole("textbox", { name: "服装样式" }) as HTMLInputElement;
    fireEvent.change(outfitInput, { target: { value: "" } });
    expect(outfitInput.value).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /生成星际头像/i }));

    expect(await screen.findByAltText("Selected generated avatar")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "服装样式" }) as HTMLInputElement).value).toBe("");
  }, 10000);

  it("disables native select arrows and regenerates candidates on demand", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/owner/session" && method === "DELETE") {
        return createJsonResponse({ authenticated: false });
      }

      if (url === "/api/bootstrap") {
        return createJsonResponse(bootstrapPayload);
      }

      if (url === "/api/profile/avatar/generate" && method === "POST") {
        const generateCallCount = fetchMock.mock.calls.filter(([target, requestInit]) => {
          const requestUrl = typeof target === "string" ? target : target.toString();
          return requestUrl === "/api/profile/avatar/generate" && (requestInit?.method ?? "GET") === "POST";
        }).length;

        return createJsonResponse({
          candidates:
            generateCallCount === 1
              ? ["/generated-1.png", "/generated-2.png", "/generated-3.png"]
              : ["/generated-4.png", "/generated-5.png", "/generated-6.png"],
          prompt: bootstrapPayload.profile.avatarPromptJson
        });
      }

      return createJsonResponse({});
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });
    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");
    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));
    await screen.findByRole("heading", { name: "生成星际头像" });

    const comboboxes = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(comboboxes).toHaveLength(2);
    comboboxes.forEach((combobox) => {
      expect(combobox.style.backgroundImage).toBe("none");
      expect(combobox.style.WebkitAppearance).toBe("none");
    });

    fireEvent.click(screen.getByRole("button", { name: /生成星际头像/i }));
    const firstSelected = (await screen.findByAltText("Selected generated avatar")) as HTMLImageElement;
    expect(firstSelected.getAttribute("src")).toBe("/generated-2.png");
    expect((screen.getByAltText("Generated avatar 1") as HTMLImageElement).getAttribute("src")).toBe("/generated-1.png");
    expect((screen.getByAltText("Generated avatar 3") as HTMLImageElement).getAttribute("src")).toBe("/generated-3.png");

    fireEvent.click(screen.getByRole("button", { name: /重新生成/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/profile/avatar/generate",
        expect.objectContaining({
          method: "POST"
        })
      );
      expect((screen.getByAltText("Selected generated avatar") as HTMLImageElement).getAttribute("src")).toBe("/generated-5.png");
      expect((screen.getByAltText("Generated avatar 1") as HTMLImageElement).getAttribute("src")).toBe("/generated-4.png");
      expect((screen.getByAltText("Generated avatar 3") as HTMLImageElement).getAttribute("src")).toBe("/generated-6.png");
    });
  }, 10000);

  it("keeps the generated avatar only in profile editor until the user saves identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method ?? "GET";

        if (url === "/api/owner/session" && method === "DELETE") {
          return createJsonResponse({ authenticated: false });
        }

        if (url === "/api/bootstrap") {
          return createJsonResponse(bootstrapPayload);
        }

        if (url === "/api/profile/avatar/generate" && method === "POST") {
          return createJsonResponse({
            candidates: ["/generated-1.png", "/generated-2.png", "/generated-3.png"],
            prompt: bootstrapPayload.profile.avatarPromptJson
          });
        }

        if (url === "/api/profile" && method === "PUT") {
          const body = JSON.parse(String(init?.body ?? "{}"));
          return createJsonResponse({
            ...bootstrapPayload.profile,
            ...body,
            updatedAt: "2026-04-19T00:00:00.000Z"
          });
        }

        return createJsonResponse({});
      })
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });
    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");
    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));
    await screen.findByRole("heading", { name: "生成星际头像" });

    fireEvent.click(screen.getByRole("button", { name: /生成星际头像/i }));
    await screen.findByAltText("Selected generated avatar");
    fireEvent.click(screen.getByRole("button", { name: /保存选择/i }));

    const profileImage = (await screen.findByAltText("Architect Profile")) as HTMLImageElement;
    expect(profileImage.getAttribute("src")).toBe("/generated-2.png");

    fireEvent.click(screen.getByRole("button", { name: /取消更改/i }));
    const profileOverlayAvatar = (await screen.findByAltText("Dora The Explorer Profile")) as HTMLImageElement;
    expect(profileOverlayAvatar.getAttribute("src")).toBe("/uploads/avatar.png");

    fireEvent.click(screen.getByRole("button", { name: /追随航程/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    const reopenedProfileAvatar = (await screen.findByAltText("Dora The Explorer Profile")) as HTMLImageElement;
    expect(reopenedProfileAvatar.getAttribute("src")).toBe("/uploads/avatar.png");
  }, 10000);

  it("updates profile and homepage avatars only after saving identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method ?? "GET";

        if (url === "/api/owner/session" && method === "DELETE") {
          return createJsonResponse({ authenticated: false });
        }

        if (url === "/api/bootstrap") {
          return createJsonResponse(bootstrapPayload);
        }

        if (url === "/api/profile/avatar/generate" && method === "POST") {
          return createJsonResponse({
            candidates: ["/generated-1.png", "/generated-2.png", "/generated-3.png"],
            prompt: bootstrapPayload.profile.avatarPromptJson
          });
        }

        if (url === "/api/profile" && method === "PUT") {
          const body = JSON.parse(String(init?.body ?? "{}"));
          return createJsonResponse({
            ...bootstrapPayload.profile,
            ...body,
            updatedAt: "2026-04-19T00:00:00.000Z"
          });
        }

        return createJsonResponse({});
      })
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });
    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");
    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));
    await screen.findByRole("heading", { name: "生成星际头像" });

    fireEvent.click(screen.getByRole("button", { name: /生成星际头像/i }));
    await screen.findByAltText("Selected generated avatar");
    fireEvent.click(screen.getByRole("button", { name: /保存选择/i }));

    const editorAvatar = (await screen.findByAltText("Architect Profile")) as HTMLImageElement;
    expect(editorAvatar.getAttribute("src")).toBe("/generated-2.png");

    fireEvent.click(screen.getByRole("button", { name: /保存身份/i }));
    const savedProfileAvatar = (await screen.findByAltText("Dora The Explorer Profile")) as HTMLImageElement;
    expect(savedProfileAvatar.getAttribute("src")).toBe("/generated-2.png");

    fireEvent.click(screen.getByRole("button", { name: /追随航程/i }));
    const homeHeroAvatars = (await screen.findAllByAltText("Owner")) as HTMLImageElement[];
    expect(homeHeroAvatars.some((avatar) => avatar.getAttribute("src") === "/generated-2.png")).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    const homepageAvatar = (await screen.findByAltText("Dora The Explorer Profile")) as HTMLImageElement;
    expect(homepageAvatar.getAttribute("src")).toBe("/generated-2.png");
  }, 10000);

  it("resets avatar generation fields to the default form state on entry", async () => {
    const customBootstrapPayload = {
      ...bootstrapPayload,
      profile: {
        ...bootstrapPayload.profile,
        avatarPromptJson: {
          hair: "披散长发",
          expression: "自信挑眉",
          style: "游戏角色写实",
          palette: "rose",
          outfit: "未来战甲",
          notes: "我之前填过一整段说明"
        }
      }
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method ?? "GET";

        if (url === "/api/owner/session" && method === "DELETE") {
          return createJsonResponse({ authenticated: false });
        }

        if (url === "/api/bootstrap") {
          return createJsonResponse(customBootstrapPayload);
        }

        return createJsonResponse({});
      })
    );

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await screen.findAllByText("欢迎来到我的世界");

    fireEvent.click(screen.getAllByRole("button", { name: /account_circle/i })[0]);
    await screen.findByRole("button", { name: /编辑资料/i });
    fireEvent.click(screen.getByRole("button", { name: /编辑资料/i }));
    await screen.findByText("编辑您的");
    fireEvent.click(screen.getByRole("button", { name: /photo_camera/i }));
    await screen.findByRole("heading", { name: "生成星际头像" });

    expect((screen.getByRole("combobox", { name: "发型" }) as HTMLSelectElement).value).toBe("利落短发");
    expect((screen.getByRole("combobox", { name: "表情" }) as HTMLSelectElement).value).toBe("冷静注视");
    expect(screen.getByRole("button", { name: "电影级写实" }).className).toContain("border-primary-container");
    expect(screen.getByRole("button", { name: "选择lavender配色" }).className).toContain("ring-2");
    expect((screen.getByRole("textbox", { name: "服装样式" }) as HTMLInputElement).value).toBe("");
    expect((screen.getByRole("textbox", { name: "补充说明" }) as HTMLTextAreaElement).value).toBe("");
  }, 10000);
});

describe("splitProfileDisplayName", () => {
  it("colors a single-word latin name as a whole", () => {
    expect(splitProfileDisplayName("Dora")).toEqual({
      lead: "",
      accent: "Dora"
    });
  });

  it("keeps a meaningful chinese tail phrase together", () => {
    expect(splitProfileDisplayName("我是一只驴")).toEqual({
      lead: "我是",
      accent: "一只驴"
    });
  });
});
