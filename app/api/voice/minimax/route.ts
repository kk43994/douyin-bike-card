import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MiniMaxTtsRequest = {
  text?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  emotion?: string;
  style?: "nav" | "cute";
};

const DEFAULT_MINIMAX_HOST = "https://api.minimax.io";
const DEFAULT_MODEL = "speech-2.8-turbo";
const DEFAULT_VOICE_ID = "male-qn-qingse";

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: "minimax",
    hasApiKey: Boolean(process.env.MINIMAX_API_KEY),
    hasVoiceId: Boolean(process.env.MINIMAX_VOICE_ID),
    model: process.env.MINIMAX_TTS_MODEL || DEFAULT_MODEL,
    voiceId: process.env.MINIMAX_VOICE_ID || DEFAULT_VOICE_ID,
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "MINIMAX_API_KEY 未配置" }, { status: 503 });
  }

  let payload: MiniMaxTtsRequest;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体必须是 JSON" }, { status: 400 });
  }

  const text = String(payload.text ?? "").trim().slice(0, 500);
  if (!text) {
    return NextResponse.json({ ok: false, error: "text 不能为空" }, { status: 400 });
  }
  const style = payload.style === "nav" ? "nav" : "cute";

  try {
    const upstream = await fetch(`${getMiniMaxHost()}/v1/t2a_v2`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_TTS_MODEL || DEFAULT_MODEL,
        text,
        stream: false,
        voice_setting: {
          voice_id: process.env.MINIMAX_VOICE_ID || DEFAULT_VOICE_ID,
          speed: clampNumber(payload.speed ?? process.env.MINIMAX_TTS_SPEED, style === "nav" ? 1.13 : 1.08, 0.5, 2),
          vol: clampNumber(payload.volume ?? process.env.MINIMAX_TTS_VOLUME, 1, 0.1, 10),
          pitch: clampInteger(payload.pitch ?? process.env.MINIMAX_TTS_PITCH, style === "nav" ? 1 : 2, -12, 12),
          emotion: payload.emotion || process.env.MINIMAX_TTS_EMOTION || (style === "nav" ? "calm" : "happy"),
          english_normalization: true,
          latex_read: false,
        },
        ...(isVoiceModifyEnabled()
          ? {
              voice_modify: {
                pitch: clampInteger(process.env.MINIMAX_TTS_MODIFY_PITCH, 0, -100, 100),
                intensity: clampInteger(process.env.MINIMAX_TTS_INTENSITY, 0, -100, 100),
                timbre: clampInteger(process.env.MINIMAX_TTS_TIMBRE, 0, -100, 100),
              },
            }
          : {}),
        language_boost: "Chinese",
        audio_setting: {
          sample_rate: Number(process.env.MINIMAX_TTS_SAMPLE_RATE || 32000),
          bitrate: Number(process.env.MINIMAX_TTS_BITRATE || 128000),
          format: process.env.MINIMAX_TTS_FORMAT || "mp3",
          channel: 1,
        },
      }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.base_resp?.status_msg ?? data?.error ?? `MiniMax TTS 请求失败: ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const audioHex = data?.data?.audio;
    if (typeof audioHex !== "string" || audioHex.length === 0) {
      return NextResponse.json(
        { ok: false, error: data?.base_resp?.status_msg ?? "MiniMax 未返回音频数据" },
        { status: 502 },
      );
    }

    const format = String(data?.extra_info?.audio_format ?? process.env.MINIMAX_TTS_FORMAT ?? "mp3");
    const audio = Buffer.from(audioHex, "hex");
    return new NextResponse(audio, {
      headers: {
        "Content-Type": `audio/${format === "mp3" ? "mpeg" : format}`,
        "Cache-Control": "no-store",
        "X-MiniMax-Trace-Id": String(data?.trace_id ?? ""),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

function getMiniMaxHost() {
  return (process.env.MINIMAX_API_HOST || DEFAULT_MINIMAX_HOST).replace(/\/+$/, "");
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  return Math.round(clampNumber(value, fallback, min, max));
}

function isVoiceModifyEnabled() {
  return process.env.MINIMAX_TTS_ENABLE_VOICE_MODIFY === "true";
}
