import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AMAP_WEB_KEY 未配置, 请在 .env.local 设置" },
      { status: 503 },
    );
  }
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get("keywords");
  const location = searchParams.get("location");
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  if (!keywords) {
    return NextResponse.json({ error: "keywords 必填" }, { status: 400 });
  }
  const upstream = new URL("https://restapi.amap.com/v3/assistant/inputtips");
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("keywords", keywords);
  if (location) upstream.searchParams.set("location", location);
  if (city) upstream.searchParams.set("city", city);
  if (type) upstream.searchParams.set("type", type);
  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
