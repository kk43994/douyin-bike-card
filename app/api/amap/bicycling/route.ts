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
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  if (!origin || !destination) {
    return NextResponse.json({ error: "origin/destination 必填" }, { status: 400 });
  }
  const upstream = new URL("https://restapi.amap.com/v4/direction/bicycling");
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("origin", origin);
  upstream.searchParams.set("destination", destination);
  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
