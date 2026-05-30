"use client";

export type AmapNS = unknown;

let promise: Promise<AmapNS> | null = null;

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode?: string };
  }
}

export async function loadAmap(plugins: string[] = []): Promise<AmapNS> {
  if (typeof window === "undefined") {
    throw new Error("AMap can only be loaded in browser");
  }
  const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_AMAP_JS_KEY 未配置");
  }
  const security = process.env.NEXT_PUBLIC_AMAP_JS_SECURITY;
  if (security) {
    window._AMapSecurityConfig = { securityJsCode: security };
  }
  if (promise) return promise;
  promise = (async () => {
    const mod = await import("@amap/amap-jsapi-loader");
    const loader = (mod as { default?: { load: (opts: unknown) => Promise<unknown> } }).default ?? mod;
    return (loader as { load: (opts: unknown) => Promise<unknown> }).load({
      key,
      version: "2.0",
      plugins,
    });
  })();
  return promise;
}
