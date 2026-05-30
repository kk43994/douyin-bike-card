import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) {
    return NextResponse.json({ error: "AMAP_WEB_KEY 未配置" }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  if (!city) {
    return NextResponse.json({ error: "city (adcode 或城市名) 必填" }, { status: 400 });
  }
  const upstream = new URL("https://restapi.amap.com/v3/weather/weatherInfo");
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("city", city);
  upstream.searchParams.set("extensions", searchParams.get("extensions") ?? "base");
  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
