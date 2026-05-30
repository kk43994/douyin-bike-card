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
  const location = searchParams.get("location");
  if (!location) {
    return NextResponse.json({ error: "location 必填" }, { status: 400 });
  }
  const upstream = new URL("https://restapi.amap.com/v3/geocode/regeo");
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("location", location);
  try {
    const res = await fetch(upstream.toString(), { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
