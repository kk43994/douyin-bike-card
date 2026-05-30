import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) {
    return NextResponse.json({ error: "AMAP_WEB_KEY 未配置" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get("keywords");
  if (!keywords) {
    return NextResponse.json({ error: "keywords 必填" }, { status: 400 });
  }
  const upstream = new URL("https://restapi.amap.com/v3/config/district");
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("keywords", keywords);
  upstream.searchParams.set("subdistrict", searchParams.get("subdistrict") ?? "0");
  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
