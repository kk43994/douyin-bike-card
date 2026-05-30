import type { LatLng } from "./geo";

export type AmapTip = {
  id: string;
  name: string;
  district: string;
  location: LatLng;
  address: string;
};

export type AmapBicyclingStep = {
  instruction: string;
  road?: string;
  distance_m: number;
  duration_s: number;
  polyline: LatLng[];
};

export type AmapBicyclingResult = {
  distance_m: number;
  duration_s: number;
  steps: AmapBicyclingStep[];
  polyline: LatLng[];
};

export type AmapPoi = {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  distance_m: number;
  location: LatLng;
};

export type AmapWeather = {
  city: string;
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
  reporttime: string;
};

export type AmapDistrict = {
  name: string;
  adcode: string;
  citycode: string | string[];
  center: LatLng | null;
  level: string;
};

function parseLatLng(s: string): LatLng | null {
  const [lng, lat] = s.split(",").map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

function parsePolyline(s: string): LatLng[] {
  return s
    .split(";")
    .map((p) => parseLatLng(p.trim()))
    .filter((p): p is LatLng => p !== null);
}

/** 简单 TTL 内存缓存 + in-flight 去重 */
type CacheEntry<T> = { value: T; expireAt: number };
const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function cached<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expireAt > now) return Promise.resolve(hit.value as T);
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = factory()
    .then((value) => {
      cache.set(key, { value, expireAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

/**
 * 自行车相关 POI 类型 (高德分类码):
 * 110000 风景名胜 / 110100 公园广场 / 110101 公园 / 110200 风景名胜相关
 * 080000 体育休闲服务 / 080100 运动场馆 / 080300 健身中心
 * 090101 自行车销售 / 090102 自行车维修
 */
export const BIKE_RELATED_TYPES = "110000|110100|110200|080000|080100|080300|090101|090102";

export async function fetchInputTips(
  keywords: string,
  loc?: LatLng,
  city?: string,
  type?: string,
  signal?: AbortSignal,
): Promise<AmapTip[]> {
  if (!keywords.trim()) return [];
  const params = new URLSearchParams({ keywords });
  if (loc) params.set("location", `${loc.lng},${loc.lat}`);
  if (city) params.set("city", city);
  if (type) params.set("type", type);
  try {
    const res = await fetch(`/api/amap/inputtips?${params}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.tips)) return [];
    type RawTip = {
      id?: string;
      name?: string;
      district?: string;
      location?: unknown;
      address?: unknown;
    };
    const out: AmapTip[] = [];
    for (const t of data.tips as RawTip[]) {
      if (typeof t.location !== "string") continue;
      const ll = parseLatLng(t.location);
      if (!ll) continue;
      out.push({
        id: String(t.id ?? Math.random()),
        name: String(t.name ?? ""),
        district: String(t.district ?? ""),
        location: ll,
        address: typeof t.address === "string" ? t.address : "",
      });
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

export async function fetchBicyclingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<AmapBicyclingResult | null> {
  const key = `bicycling:${origin.lng.toFixed(4)},${origin.lat.toFixed(4)}|${destination.lng.toFixed(4)},${destination.lat.toFixed(4)}`;
  return cached(key, 5 * 60_000, () => doBicyclingRoute(origin, destination));
}

async function doBicyclingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<AmapBicyclingResult | null> {
  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
  });
  try {
    const res = await fetch(`/api/amap/bicycling?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.errcode !== 0 || !data.data?.paths?.[0]) return null;
    type RawStep = {
      instruction?: string;
      road?: string;
      distance?: string | number;
      duration?: string | number;
      polyline?: string;
    };
    const path = data.data.paths[0] as {
      distance: string | number;
      duration: string | number;
      steps: RawStep[];
    };
    const steps: AmapBicyclingStep[] = (path.steps ?? []).map((s) => ({
      instruction: String(s.instruction ?? ""),
      road: s.road,
      distance_m: Number(s.distance ?? 0),
      duration_s: Number(s.duration ?? 0),
      polyline: typeof s.polyline === "string" ? parsePolyline(s.polyline) : [],
    }));
    return {
      distance_m: Number(path.distance ?? 0),
      duration_s: Number(path.duration ?? 0),
      steps,
      polyline: steps.flatMap((s) => s.polyline),
    };
  } catch {
    return null;
  }
}

export async function fetchPoiAround(
  loc: LatLng,
  opts: { keywords?: string; types?: string; radius?: number } = {},
): Promise<AmapPoi[]> {
  const key = `poi:${loc.lng.toFixed(4)},${loc.lat.toFixed(4)}|${opts.types ?? BIKE_RELATED_TYPES}|${opts.radius ?? 2000}|${opts.keywords ?? ""}`;
  return cached(key, 5 * 60_000, () => doPoiAround(loc, opts));
}

async function doPoiAround(
  loc: LatLng,
  opts: { keywords?: string; types?: string; radius?: number } = {},
): Promise<AmapPoi[]> {
  const params = new URLSearchParams({
    mode: "around",
    location: `${loc.lng},${loc.lat}`,
  });
  if (opts.keywords) params.set("keywords", opts.keywords);
  params.set("types", opts.types ?? BIKE_RELATED_TYPES);
  if (opts.radius) params.set("radius", String(opts.radius));
  try {
    const res = await fetch(`/api/amap/place?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.pois)) return [];
    type RawPoi = {
      id?: string;
      name?: string;
      type?: string;
      typecode?: string;
      address?: unknown;
      distance?: string | number;
      location?: unknown;
    };
    const out: AmapPoi[] = [];
    for (const p of data.pois as RawPoi[]) {
      if (typeof p.location !== "string") continue;
      const ll = parseLatLng(p.location);
      if (!ll) continue;
      out.push({
        id: String(p.id ?? Math.random()),
        name: String(p.name ?? ""),
        type: String(p.type ?? ""),
        typecode: String(p.typecode ?? ""),
        address: typeof p.address === "string" ? p.address : "",
        distance_m: Number(p.distance ?? 0),
        location: ll,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function fetchWeather(city: string): Promise<AmapWeather | null> {
  if (!city) return null;
  return cached(`weather:${city}`, 10 * 60_000, () => doFetchWeather(city));
}

async function doFetchWeather(city: string): Promise<AmapWeather | null> {
  const params = new URLSearchParams({ city });
  try {
    const res = await fetch(`/api/amap/weather?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.lives) || data.lives.length === 0) return null;
    const w = data.lives[0];
    return {
      city: String(w.city ?? ""),
      weather: String(w.weather ?? ""),
      temperature: String(w.temperature ?? ""),
      winddirection: String(w.winddirection ?? ""),
      windpower: String(w.windpower ?? ""),
      humidity: String(w.humidity ?? ""),
      reporttime: String(w.reporttime ?? ""),
    };
  } catch {
    return null;
  }
}

export async function fetchDistrict(keywords: string): Promise<AmapDistrict | null> {
  const params = new URLSearchParams({ keywords });
  try {
    const res = await fetch(`/api/amap/district?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.districts) || data.districts.length === 0) {
      return null;
    }
    const d = data.districts[0];
    return {
      name: String(d.name ?? ""),
      adcode: String(d.adcode ?? ""),
      citycode: d.citycode,
      center: typeof d.center === "string" ? parseLatLng(d.center) : null,
      level: String(d.level ?? ""),
    };
  } catch {
    return null;
  }
}

/** 基于真实 POI 类型给场景打分 */
export function scoreSceneFromPois(pois: AmapPoi[]): {
  scene: "mountain" | "city";
  confidence: number;
  reason: string;
  mountainScore: number;
  cityScore: number;
} {
  let mountain = 0;
  let city = 0;
  for (const p of pois) {
    const t = `${p.type} ${p.typecode}`;
    if (
      /风景|公园|山|林|景点|自然|生态|度假|越野|徒步|登山|户外/.test(t) ||
      /110|181|140000|110100|110200/.test(p.typecode)
    ) {
      mountain += 1;
    }
    if (
      /地铁|车站|商务|商圈|商场|写字楼|购物|银行|餐|咖啡|公交|医院|学校|住宅|道路/.test(t) ||
      /050|060|070|080|090|120|130|150/.test(p.typecode.slice(0, 3))
    ) {
      city += 1;
    }
  }
  const total = mountain + city || 1;
  const scene: "mountain" | "city" = mountain > city ? "mountain" : "city";
  const winnerScore = scene === "mountain" ? mountain : city;
  const confidence = Math.max(50, Math.round((winnerScore / total) * 100));
  const reason =
    scene === "mountain"
      ? `周边匹配 ${mountain} 个山地/公园/景区类 POI`
      : `周边匹配 ${city} 个城市道路/商圈/住宅类 POI`;
  return { scene, confidence, reason, mountainScore: mountain, cityScore: city };
}
