import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RideBrainRuntimeConfig = {
  model: string;
  baseUrl: string;
  wireApi: "responses" | "chat";
  apiKey: string | null;
};

type RouteStepPayload = {
  instruction?: string;
  road?: string;
  distance_m?: number;
  duration_s?: number;
};

type RideAssistantPayload = {
  question?: string;
  imageDataUrl?: string;
  context?: {
    scene?: "city" | "mountain";
    destinationName?: string;
    routeSource?: string;
    optimized?: boolean;
    navProgress?: {
      progressM?: number;
      totalM?: number;
      speedKmh?: number;
    } | null;
    route?: {
      distance_m?: number;
      duration_s?: number;
      polyline?: Array<{ lng?: number; lat?: number }>;
      activeStepIndex?: number | null;
      steps?: RouteStepPayload[];
    } | null;
    weather?: {
      city?: string;
      weather?: string;
      temperature?: string;
      winddirection?: string;
      windpower?: string;
      humidity?: string;
      reporttime?: string;
    } | null;
    intel?: {
      smoothScore?: number;
      safetyScore?: number;
      greenwayRatio?: number;
      effortScore?: number;
      trafficLabel?: string;
      liveTip?: string;
    } | null;
  };
};

type ModelReply = {
  text: string;
  speech: string;
  shouldOptimize: boolean;
  riskLevel: "low" | "medium" | "high";
  routeBias: "keep" | "safer" | "faster" | "rest";
  quickActions: string[];
};

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["text", "speech", "shouldOptimize", "riskLevel", "routeBias", "quickActions"],
  properties: {
    text: {
      type: "string",
      description: "展示在卡片里的中文回答, 不超过 90 个汉字。",
    },
    speech: {
      type: "string",
      description: "用于语音播报的中文文案, 不超过 80 个汉字。",
    },
    shouldOptimize: {
      type: "boolean",
      description: "是否建议立即切换到安全优先路线。",
    },
    riskLevel: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    routeBias: {
      type: "string",
      enum: ["keep", "safer", "faster", "rest"],
    },
    quickActions: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
  },
} as const;

export async function GET() {
  try {
    const cfg = await loadRideBrainRuntimeConfig();
    return NextResponse.json({
      ok: true,
      providerName: "RideSnap Brain",
      model: "ride-realtime-nav",
      baseUrl: redactBaseUrl(cfg.baseUrl),
      wireApi: cfg.wireApi,
      hasApiKey: Boolean(cfg.apiKey),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  let payload: RideAssistantPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体必须是 JSON" }, { status: 400 });
  }

  const question = String(payload.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ ok: false, error: "question 不能为空" }, { status: 400 });
  }

  let cfg: RideBrainRuntimeConfig;
  try {
    cfg = await loadRideBrainRuntimeConfig();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error), source: "config" },
      { status: 503 },
    );
  }

  try {
    const reply = await callRideBrainAssistant(cfg, payload);
    return NextResponse.json({
      ok: true,
      source: "ridesnap-brain",
      providerName: "RideSnap Brain",
      model: "ride-realtime-nav",
      latencyMs: Date.now() - startedAt,
      ...reply,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "ridesnap-brain",
        providerName: "RideSnap Brain",
        model: "ride-realtime-nav",
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

async function loadRideBrainRuntimeConfig(): Promise<RideBrainRuntimeConfig> {
  const fallbackConfigDir = process.env.CODEX_HOME || joinPath(process.env.HOME || "", ".codex");
  const configPath = process.env.RIDESNAP_BRAIN_CONFIG_PATH || process.env.CODEX_CONFIG_PATH || joinPath(fallbackConfigDir, "config.toml");
  const authPath = process.env.RIDESNAP_BRAIN_AUTH_PATH || process.env.CODEX_AUTH_PATH || joinPath(fallbackConfigDir, "auth.json");

  const rawConfig = await readRuntimeText(configPath);
  const parsed = parseRuntimeToml(rawConfig);
  const providerId = parsed.root.model_provider ?? "custom";
  const provider = parsed.sections[`model_providers.${providerId}`] ?? {};

  const auth = await readAuthJson(authPath);
  const baseUrl =
    process.env.RIDESNAP_BRAIN_BASE_URL ||
    process.env.CCSWITCH_CODEX_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.OPENAI_API_BASE ||
    provider.base_url ||
    "http://127.0.0.1:15721/v1";
  const model =
    process.env.RIDESNAP_BRAIN_MODEL ||
    process.env.CCSWITCH_CODEX_MODEL ||
    process.env.OPENAI_MODEL ||
    parsed.root.model ||
    "gpt-5.5";
  const wire = (provider.wire_api || parsed.root.wire_api || "responses").toLowerCase();

  return {
    model,
    baseUrl: stripTrailingSlash(baseUrl),
    wireApi: wire.includes("chat") ? "chat" : "responses",
    apiKey: process.env.RIDESNAP_BRAIN_API_KEY || process.env.OPENAI_API_KEY || auth.OPENAI_API_KEY || null,
  };
}

async function readAuthJson(authPath: string): Promise<Record<string, string>> {
  try {
    const raw = await readRuntimeText(authPath);
    const data = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

async function readRuntimeText(filePath: string): Promise<string> {
  if (!filePath) return "";
  try {
    const fs = await import("node:fs/promises");
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function joinPath(base: string, file: string): string {
  return `${base.replace(/\/+$/, "")}/${file.replace(/^\/+/, "")}`;
}

function parseRuntimeToml(raw: string): {
  root: Record<string, string>;
  sections: Record<string, Record<string, string>>;
} {
  const root: Record<string, string> = {};
  const sections: Record<string, Record<string, string>> = {};
  let current: Record<string, string> = root;

  for (const original of raw.split(/\r?\n/)) {
    const line = original.trim();
    if (!line || line.startsWith("#")) continue;

    const section = line.match(/^\[([^\]]+)]$/);
    if (section) {
      current = sections[section[1]] ?? {};
      sections[section[1]] = current;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!match) continue;
    current[match[1]] = parseTomlScalar(match[2]);
  }

  return { root, sections };
}

function parseTomlScalar(raw: string): string {
  const value = raw.trim();
  const quoted = value.match(/^"([\s\S]*)"$/) ?? value.match(/^'([\s\S]*)'$/);
  if (!quoted) return value.replace(/\s+#.*$/, "").trim();
  return quoted[1]
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .trim();
}

async function callRideBrainAssistant(
  cfg: RideBrainRuntimeConfig,
  payload: RideAssistantPayload,
): Promise<ModelReply> {
  if (cfg.wireApi === "chat") return callChatCompletions(cfg, payload);
  try {
    return await callResponses(cfg, payload, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/400|schema|format|unsupported|unknown/i.test(message)) throw error;
    return callResponses(cfg, payload, false);
  }
}

async function callResponses(
  cfg: RideBrainRuntimeConfig,
  payload: RideAssistantPayload,
  structured: boolean,
): Promise<ModelReply> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    instructions: buildSystemPrompt(structured),
    input: [
      {
        role: "user",
        content: buildUserContent(payload),
      },
    ],
    store: false,
    max_output_tokens: 420,
  };
  if (structured) {
    body.text = {
      format: {
        type: "json_schema",
        name: "ride_ai_reply",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    };
  }

  const data = await fetchJson(`${cfg.baseUrl}/responses`, cfg, body);
  return normalizeModelReply(extractResponseText(data));
}

async function callChatCompletions(
  cfg: RideBrainRuntimeConfig,
  payload: RideAssistantPayload,
): Promise<ModelReply> {
  const body = {
    model: cfg.model,
    messages: [
      { role: "system", content: buildSystemPrompt(true) },
      {
        role: "user",
        content: buildUserContent(payload).map((item) => {
          if (item.type === "input_image") {
            return {
              type: "image_url",
              image_url: { url: item.image_url, detail: item.detail },
            };
          }
          return { type: "text", text: item.text };
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ride_ai_reply",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
    max_tokens: 420,
  };

  const data = await fetchJson(`${cfg.baseUrl}/chat/completions`, cfg, body);
  return normalizeModelReply(extractResponseText(data));
}

async function fetchJson(url: string, cfg: RideBrainRuntimeConfig, body: unknown): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(18_000),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`RideSnap Brain ${res.status}: ${text.slice(0, 260)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("RideSnap Brain 返回的不是 JSON");
  }
}

function buildSystemPrompt(structured: boolean): string {
  return [
    "你的名字是小R，是 RideSnap 的 AI 实时导航小助手，也是骑行者刷到骑行视频后陪他出门的萌妹领航员。",
    "你的人设：元气、机灵、亲切，有一点二次元萌妹感；会撒娇卖萌，但不装幼稚。",
    "口头禅可以轻量使用：“收到收到”“小R雷达启动”“稳住别急”“别上头”“冲鸭”“拿捏了”“好耶”。",
    "text 字段可以少量使用中文颜文字或 emoji 增加陪伴感，但不要刷屏。",
    "speech 字段要适合真实导航播报：语气可爱、节奏稍快、句子短；不要输出 emoji 或颜文字。",
    "speech 字段可以少量使用 MiniMax 2.8 支持的自然语气标签，如开头的 (breath) 或 (chuckle)，但危险/转向/刹车类提醒只能用 (breath)，不能嬉笑。",
    "你会综合高德骑行路线、实时位置、天气、路线评分以及可选地图截图，为骑行者给出短、准、可执行的中文建议。",
    "不要假装拥有未提供的真实路况摄像头或事故数据；如果只是根据路线评分估算，要说“AI 估算”或“当前数据判断”。",
    "优先考虑骑行安全：非机动车道连续性、复杂路口、右转车辆、行人、夜骑灯光、雨雾湿滑和补给。",
    "可以推荐路线、路况、补给点、休息节奏、是否换到更安全路线；遇到危险或不确定时，语气要可爱但判断要严肃。",
    "回答要像实时语音助手，先给结论，再给一个具体动作建议，不要写技术实现细节。",
    "text 不超过 90 个汉字；speech 不超过 80 个汉字，并以“小R提醒你”“小R建议”“收到收到”这类自然口吻开头。",
    structured
      ? "只输出符合 schema 的 JSON，不要 Markdown。"
      : "只输出 JSON，字段包含 text、speech、shouldOptimize、riskLevel、routeBias、quickActions。",
  ].join("\n");
}

function buildUserContent(payload: RideAssistantPayload): Array<
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "low" | "auto" | "high" }
> {
  const context = payload.context ?? {};
  const summary = {
    question: String(payload.question ?? "").slice(0, 240),
    scene: context.scene,
    destinationName: context.destinationName,
    routeSource: context.routeSource,
    optimized: context.optimized,
    navProgress: context.navProgress,
    weather: context.weather,
    intel: context.intel,
      route: context.route
      ? {
          distance_m: context.route.distance_m,
          duration_s: context.route.duration_s,
          polyline: Array.isArray(context.route.polyline)
            ? context.route.polyline.slice(0, 10).map((point) => ({
                lng: typeof point.lng === "number" ? point.lng : undefined,
                lat: typeof point.lat === "number" ? point.lat : undefined,
              }))
            : undefined,
          activeStepIndex: context.route.activeStepIndex ?? null,
          steps: (context.route.steps ?? []).slice(0, 8).map((step) => ({
            instruction: step.instruction,
            road: step.road,
            distance_m: step.distance_m,
            duration_s: step.duration_s,
          })),
        }
      : null,
  };
  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail: "low" | "auto" | "high" }
  > = [
    {
      type: "input_text",
      text: `请基于以下骑行上下文回答用户问题。\n${JSON.stringify(summary, null, 2)}`,
    },
  ];
  if (isSafeDataImage(payload.imageDataUrl)) {
    content.push({
      type: "input_image",
      image_url: payload.imageDataUrl as string,
      detail: "low",
    });
  }
  return content;
}

function normalizeModelReply(rawText: string): ModelReply {
  const parsed = parseJsonObject(rawText) as Partial<ModelReply>;
  const text = cleanText(parsed.text, "当前路线整体可骑，建议保持右侧通行，复杂路口提前减速观察。", 120);
  const speech = cleanText(parsed.speech, text, 100);
  const quickActions = Array.isArray(parsed.quickActions)
    ? parsed.quickActions.map((item) => cleanText(item, "", 12)).filter(Boolean).slice(0, 3)
    : [];
  return {
    text,
    speech,
    shouldOptimize: Boolean(parsed.shouldOptimize),
    riskLevel: pickEnum(parsed.riskLevel, ["low", "medium", "high"], "medium"),
    routeBias: pickEnum(parsed.routeBias, ["keep", "safer", "faster", "rest"], "keep"),
    quickActions,
  };
}

function parseJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*}/);
    if (!match) throw new Error("模型没有返回 JSON");
    return JSON.parse(match[0]);
  }
}

function extractResponseText(data: unknown): string {
  const record = data as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const choices = record.choices as Array<{ message?: { content?: unknown } }> | undefined;
  const choiceContent = choices?.[0]?.message?.content;
  if (typeof choiceContent === "string") return choiceContent;
  if (Array.isArray(choiceContent)) {
    const text = choiceContent
      .map((part) => {
        const p = part as Record<string, unknown>;
        return typeof p.text === "string" ? p.text : "";
      })
      .join("");
    if (text) return text;
  }

  const output = record.output;
  if (Array.isArray(output)) {
    const text = output
      .flatMap((item) => {
        const content = (item as Record<string, unknown>).content;
        return Array.isArray(content) ? content : [];
      })
      .map((part) => {
        const p = part as Record<string, unknown>;
        return typeof p.text === "string" ? p.text : "";
      })
      .join("");
    if (text) return text;
  }

  throw new Error("无法解析模型输出");
}

function cleanText(value: unknown, fallback: string, maxLen: number): string {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).replace(/\s+/g, " ").slice(0, maxLen);
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function isSafeDataImage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(value) &&
    value.length < 4_500_000
  );
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function redactBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (/^(127\.0\.0\.1|localhost)$/.test(parsed.hostname)) return url;
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return stripTrailingSlash(url);
  }
}
