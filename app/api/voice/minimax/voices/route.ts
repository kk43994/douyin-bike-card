import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MINIMAX_HOST = "https://api.minimax.io";

export async function GET(req: Request) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "MINIMAX_API_KEY 未配置" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const voiceType = searchParams.get("voice_type") || "voice_cloning";

  try {
    const res = await fetch(`${getMiniMaxHost()}/v1/get_voice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voice_type: voiceType }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.base_resp?.status_msg ?? data?.error ?? `MiniMax 音色列表请求失败: ${res.status}` },
        { status: res.status },
      );
    }

    return NextResponse.json({
      ok: true,
      systemVoice: data?.system_voice ?? [],
      voiceCloning: data?.voice_cloning ?? [],
      voiceGeneration: data?.voice_generation ?? [],
      traceId: data?.trace_id ?? null,
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
