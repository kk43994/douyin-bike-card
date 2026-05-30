export type LatLng = { lng: number; lat: number };

export type GeoLocation = LatLng & {
  accuracy?: number;
  source: "browser" | "mock";
  /** 用于显示的友好地址 (可能很长) */
  cityName?: string;
  /** 仅市名, 用于传给 city 参数 (e.g. "温州市") */
  city?: string;
  /** 行政区编码 */
  adcode?: string;
};

const MOCK_FALLBACK: GeoLocation = {
  lng: 120.0918,
  lat: 30.1846,
  source: "mock",
  cityName: "杭州 · 西湖区 九溪 (mock fallback)",
  city: "杭州市",
  adcode: "330106",
};

export async function getBrowserLocation(timeoutMs = 8000): Promise<LatLng | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve(null);
    }, timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude });
      },
      () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

type RegeoResult = {
  formatted: string | null;
  city: string | null;
  adcode: string | null;
};

const regeoCache = new Map<string, { value: RegeoResult; expireAt: number }>();
const regeoInflight = new Map<string, Promise<RegeoResult | null>>();

export async function reverseGeocode(loc: LatLng): Promise<RegeoResult | null> {
  const key = `${loc.lng.toFixed(3)},${loc.lat.toFixed(3)}`;
  const now = Date.now();
  const hit = regeoCache.get(key);
  if (hit && hit.expireAt > now) return hit.value;
  const existing = regeoInflight.get(key);
  if (existing) return existing;
  const p = (async () => {
    try {
      const params = new URLSearchParams({ location: `${loc.lng},${loc.lat}` });
      const res = await fetch(`/api/amap/regeo?${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== "1") return null;
      const r = data.regeocode;
      const comp = r?.addressComponent ?? {};
      const cityRaw = Array.isArray(comp.city) ? "" : String(comp.city ?? "");
      const province = Array.isArray(comp.province) ? "" : String(comp.province ?? "");
      const value: RegeoResult = {
        formatted: r?.formatted_address ?? null,
        city: cityRaw || province || null,
        adcode: Array.isArray(comp.adcode) ? null : String(comp.adcode ?? "") || null,
      };
      regeoCache.set(key, { value, expireAt: Date.now() + 10 * 60_000 });
      return value;
    } catch {
      return null;
    } finally {
      regeoInflight.delete(key);
    }
  })();
  regeoInflight.set(key, p);
  return p;
}

export async function getCurrentLocationSmart(): Promise<GeoLocation> {
  const browser = await getBrowserLocation();
  if (!browser) return MOCK_FALLBACK;
  const r = await reverseGeocode(browser);
  return {
    ...browser,
    source: "browser",
    cityName: r?.formatted ?? `${browser.lng.toFixed(4)}, ${browser.lat.toFixed(4)}`,
    city: r?.city ?? undefined,
    adcode: r?.adcode ?? undefined,
  };
}
