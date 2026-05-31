import os from "node:os";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "") || "http";
  const port = host.split(":")[1] ?? "";
  const lanIp = pickLanIp();
  const lanUrl = lanIp ? `${protocol}://${lanIp}${port ? `:${port}` : ""}` : null;
  const configuredUrl = process.env.NEXT_PUBLIC_DEMO_URL || process.env.DEMO_PUBLIC_URL || null;

  return NextResponse.json({
    currentUrl: `${protocol}://${host}`,
    configuredUrl,
    lanUrl,
    shareUrl: configuredUrl || lanUrl || `${protocol}://${host}`,
  });
}

function pickLanIp() {
  const nets = os.networkInterfaces();
  const preferred = ["en0", "en1", "en2", "bridge0"];
  const candidates: string[] = [];

  for (const name of preferred) {
    const found = nets[name]?.find((item) => item.family === "IPv4" && !item.internal);
    if (found?.address) candidates.push(found.address);
  }

  for (const items of Object.values(nets)) {
    for (const item of items ?? []) {
      if (item.family === "IPv4" && !item.internal && !candidates.includes(item.address)) {
        candidates.push(item.address);
      }
    }
  }

  return candidates.find((ip) => !ip.startsWith("198.18.")) ?? candidates[0] ?? null;
}
