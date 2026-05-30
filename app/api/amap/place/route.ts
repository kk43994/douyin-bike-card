import { NextResponse } from "next/server";

const ENDPOINTS = {
  around: "https://restapi.amap.com/v3/place/around",
  text: "https://restapi.amap.com/v3/place/text",
} as const;

export async function GET(req: Request) {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) {
    return NextResponse.json({ error: "AMAP_WEB_KEY 未配置" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") ?? "around") as keyof typeof ENDPOINTS;
  if (!(mode in ENDPOINTS)) {
    return NextResponse.json({ error: "mode 必须是 around | text" }, { status: 400 });
  }
  const upstream = new URL(ENDPOINTS[mode]);
  upstream.searchParams.set("key", key);
  for (const [k, v] of searchParams.entries()) {
    if (k === "mode") continue;
    upstream.searchParams.set(k, v);
  }
  if (mode === "around" && !upstream.searchParams.get("radius")) {
    upstream.searchParams.set("radius", "2000");
  }
  if (!upstream.searchParams.get("extensions")) {
    upstream.searchParams.set("extensions", "base");
  }
  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
