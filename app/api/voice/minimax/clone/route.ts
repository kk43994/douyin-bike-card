import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MINIMAX_HOST = "https://api.minimax.io";

export async function POST(req: Request) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "MINIMAX_API_KEY 未配置" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体必须是 multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const voiceId = String(form.get("voice_id") ?? "").trim();
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file 必填" }, { status: 400 });
  }
  if (!voiceId) {
    return NextResponse.json({ ok: false, error: "voice_id 必填" }, { status: 400 });
  }

  try {
    const uploaded = await uploadCloneAudio(apiKey, file);
    const cloneRes = await fetch(`${getMiniMaxHost()}/v1/voice_clone`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_id: uploaded.fileId,
        voice_id: voiceId,
        text: String(form.get("text") ?? "导航开始，前方路口请注意观察路况。"),
        model: String(form.get("model") ?? process.env.MINIMAX_TTS_MODEL ?? "speech-2.8-turbo"),
        accuracy: Number(form.get("accuracy") ?? 0.8),
        need_noise_reduction: parseBoolean(form.get("need_noise_reduction"), true),
        need_volume_normalization: parseBoolean(form.get("need_volume_normalization"), true),
      }),
      cache: "no-store",
    });

    const data = await cloneRes.json().catch(() => null);
    if (!cloneRes.ok) {
      return NextResponse.json(
        { ok: false, error: data?.base_resp?.status_msg ?? data?.error ?? `MiniMax 克隆请求失败: ${cloneRes.status}` },
        { status: cloneRes.status },
      );
    }

    return NextResponse.json({
      ok: true,
      voiceId,
      fileId: uploaded.fileId,
      traceId: data?.trace_id ?? uploaded.traceId ?? null,
      upstream: data,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

async function uploadCloneAudio(apiKey: string, file: File): Promise<{ fileId: string; traceId: string | null }> {
  const form = new FormData();
  form.set("purpose", "voice_clone");
  form.set("file", file, file.name);

  const res = await fetch(`${getMiniMaxHost()}/v1/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.base_resp?.status_msg ?? data?.error ?? `MiniMax 音频上传失败: ${res.status}`);
  }

  const fileId = data?.file?.file_id ?? data?.file_id ?? data?.id;
  if (typeof fileId !== "string" && typeof fileId !== "number") {
    throw new Error("MiniMax 上传成功但未返回 file_id");
  }
  return { fileId: String(fileId), traceId: data?.trace_id ?? null };
}

function getMiniMaxHost() {
  return (process.env.MINIMAX_API_HOST || DEFAULT_MINIMAX_HOST).replace(/\/+$/, "");
}

function parseBoolean(value: FormDataEntryValue | null, fallback: boolean) {
  if (value === null) return fallback;
  return /^(1|true|yes)$/i.test(String(value));
}
