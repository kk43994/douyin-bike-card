export type SceneKey = "mountain" | "city";

export type LocationResult = {
  longitude: number;
  latitude: number;
  source: "browser" | "ip-fallback" | "mock";
  cityName: string;
};

export type Poi = {
  id: string;
  name: string;
  type: string;
  distance_m: number;
  bias: SceneKey | null;
};

export type SceneDetectResult = {
  scene: SceneKey;
  confidence: number;
  reason: string;
  topPois: Poi[];
};

export type RouteSegment = {
  fromKm: number;
  toKm: number;
  name: string;
  status: "clear" | "mild" | "heavy";
};

export type RoutePlan = {
  routeId: string;
  name: string;
  distance_km: number;
  duration_min: number;
  ascent_m: number;
  congestionCount: number;
  segments: RouteSegment[];
  highlight: string;
};

export type RiderStatus = "riding" | "resting" | "looking";

export type Rider = {
  id: string;
  name: string;
  distance_m: number;
  bearing_deg: number;
  vehicle: "mountain" | "road" | "commute";
  status: RiderStatus;
  currentRoute: string;
};

export type RidersResult = {
  total: number;
  ridingNow: number;
  openToInvite: number;
  riders: Rider[];
};

const mockLocations: Record<SceneKey, LocationResult> = {
  mountain: {
    longitude: 120.0918,
    latitude: 30.1846,
    source: "mock",
    cityName: "杭州 · 西湖区 九溪",
  },
  city: {
    longitude: 121.4994,
    latitude: 31.2393,
    source: "mock",
    cityName: "上海 · 浦东新区 陆家嘴",
  },
};

const mockPois: Record<SceneKey, Poi[]> = {
  mountain: [
    { id: "p1", name: "九溪森林公园", type: "风景区", distance_m: 320, bias: "mountain" },
    { id: "p2", name: "龙井村越野基地", type: "运动场馆", distance_m: 680, bias: "mountain" },
    { id: "p3", name: "西湖国家湿地林道", type: "自然景观", distance_m: 1120, bias: "mountain" },
    { id: "p4", name: "九溪十八涧爬坡段", type: "山路", distance_m: 540, bias: "mountain" },
    { id: "p5", name: "理安山骑行驿站", type: "驿站", distance_m: 980, bias: "mountain" },
    { id: "p6", name: "村口便利店", type: "便利店", distance_m: 230, bias: null },
  ],
  city: [
    { id: "p1", name: "陆家嘴环路", type: "城市主干道", distance_m: 180, bias: "city" },
    { id: "p2", name: "滨江公园绿道入口", type: "城市公园", distance_m: 410, bias: "city" },
    { id: "p3", name: "国金中心", type: "商圈", distance_m: 320, bias: "city" },
    { id: "p4", name: "东方明珠塔", type: "地标", distance_m: 720, bias: "city" },
    { id: "p5", name: "陆家嘴地铁站", type: "地铁站", distance_m: 240, bias: "city" },
    { id: "p6", name: "杨高南路非机动车道", type: "慢行道", distance_m: 860, bias: "city" },
  ],
};

const mockRoutes: Record<SceneKey, RoutePlan[]> = {
  mountain: [
    {
      routeId: "mt-1",
      name: "九溪十八涧林道穿越",
      distance_km: 6.4,
      duration_min: 42,
      ascent_m: 320,
      congestionCount: 0,
      highlight: "森林林道 · 爬坡 · 碎石下坡",
      segments: [
        { fromKm: 0, toKm: 1.2, name: "九溪入口缓坡", status: "clear" },
        { fromKm: 1.2, toKm: 3.4, name: "理安山爬坡段", status: "clear" },
        { fromKm: 3.4, toKm: 5.0, name: "杨梅岭碎石下坡", status: "mild" },
        { fromKm: 5.0, toKm: 6.4, name: "龙井村出口", status: "clear" },
      ],
    },
    {
      routeId: "mt-2",
      name: "梅家坞茶山环线",
      distance_km: 8.8,
      duration_min: 58,
      ascent_m: 410,
      congestionCount: 1,
      highlight: "茶山弯道 · 上坡为主",
      segments: [
        { fromKm: 0, toKm: 2.1, name: "梅家坞入口", status: "clear" },
        { fromKm: 2.1, toKm: 5.4, name: "茶山爬坡段", status: "mild" },
        { fromKm: 5.4, toKm: 8.8, name: "环线返程", status: "clear" },
      ],
    },
  ],
  city: [
    {
      routeId: "ct-1",
      name: "滨江夜骑霓虹巡航线",
      distance_km: 12.0,
      duration_min: 47,
      ascent_m: 12,
      congestionCount: 1,
      highlight: "滨江绿道 · 全程慢行道 · 1 处缓行",
      segments: [
        { fromKm: 0, toKm: 2.3, name: "滨江南路 慢行道", status: "clear" },
        { fromKm: 2.3, toKm: 4.8, name: "体育中心路口", status: "mild" },
        { fromKm: 4.8, toKm: 8.6, name: "滨江北路 绿道", status: "clear" },
        { fromKm: 8.6, toKm: 12.0, name: "东昌路 沿江段", status: "clear" },
      ],
    },
    {
      routeId: "ct-2",
      name: "外滩世博通勤线",
      distance_km: 9.4,
      duration_min: 38,
      ascent_m: 8,
      congestionCount: 2,
      highlight: "城市主路 · 红绿灯较多 · 注意车流",
      segments: [
        { fromKm: 0, toKm: 3.2, name: "陆家嘴环路", status: "mild" },
        { fromKm: 3.2, toKm: 6.0, name: "南浦大桥引桥", status: "heavy" },
        { fromKm: 6.0, toKm: 9.4, name: "世博园外环", status: "clear" },
      ],
    },
  ],
};

const riderNames = [
  "林道老王",
  "夜骑刘",
  "碳纤维杰",
  "小雨",
  "阿K",
  "胖头陀",
  "Cady",
  "GravelGoat",
  "二八大杠",
  "齿轮老张",
  "Lululemon",
  "破风手",
];

function deterministicRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickVehicle(scene: SceneKey, rand: () => number): Rider["vehicle"] {
  if (scene === "mountain") return rand() < 0.7 ? "mountain" : "road";
  if (rand() < 0.5) return "road";
  return rand() < 0.6 ? "commute" : "mountain";
}

function pickStatus(rand: () => number): RiderStatus {
  const r = rand();
  if (r < 0.55) return "riding";
  if (r < 0.85) return "looking";
  return "resting";
}

export function pickLocationByScene(scene: SceneKey): LocationResult {
  return mockLocations[scene];
}

export async function getCurrentLocation(
  prefer: SceneKey = "mountain",
): Promise<LocationResult> {
  return Promise.resolve(mockLocations[prefer]);
}

export async function searchPoiAround(
  _lng: number,
  _lat: number,
  scene: SceneKey,
): Promise<Poi[]> {
  return Promise.resolve(mockPois[scene]);
}

export function detectScene(pois: Poi[], hint: SceneKey): SceneDetectResult {
  let mountainScore = 0;
  let cityScore = 0;
  for (const p of pois) {
    if (p.bias === "mountain") mountainScore += 1;
    if (p.bias === "city") cityScore += 1;
  }
  const total = mountainScore + cityScore || 1;
  const scene: SceneKey = mountainScore >= cityScore ? "mountain" : "city";
  const confidence = Math.round((Math.max(mountainScore, cityScore) / total) * 100);
  const reason =
    scene === "mountain"
      ? `周边 ${mountainScore} 个山地/林道/越野相关 POI`
      : `周边 ${cityScore} 个城市主路/绿道/商圈相关 POI`;
  return {
    scene: hint ?? scene,
    confidence: Math.max(72, confidence),
    reason,
    topPois: pois.slice(0, 4),
  };
}

export async function planBicyclingRoute(
  scene: SceneKey,
  routeId?: string,
): Promise<RoutePlan> {
  const list = mockRoutes[scene];
  const found = routeId ? list.find((r) => r.routeId === routeId) : undefined;
  return Promise.resolve(found ?? list[0]);
}

export async function listBicyclingRoutes(scene: SceneKey): Promise<RoutePlan[]> {
  return Promise.resolve(mockRoutes[scene]);
}

export async function getNearbyRiders(scene: SceneKey): Promise<RidersResult> {
  const rand = deterministicRand(scene === "mountain" ? 4242 : 8888);
  const count = 9 + Math.floor(rand() * 4);
  const riders: Rider[] = Array.from({ length: count }).map((_, idx) => {
    const distance_m = Math.round(150 + rand() * 1450);
    const bearing_deg = Math.round(rand() * 360);
    return {
      id: `r-${idx}`,
      name: riderNames[(idx + Math.floor(rand() * riderNames.length)) % riderNames.length],
      distance_m,
      bearing_deg,
      vehicle: pickVehicle(scene, rand),
      status: pickStatus(rand),
      currentRoute:
        scene === "mountain"
          ? ["九溪林道", "龙井环线", "梅家坞茶山线", "理安山爬坡"][Math.floor(rand() * 4)]
          : ["滨江夜骑线", "外滩通勤线", "陆家嘴环路", "世博绿道"][Math.floor(rand() * 4)],
    };
  });
  const ridingNow = riders.filter((r) => r.status === "riding").length;
  const openToInvite = riders.filter((r) => r.status === "looking").length;
  return Promise.resolve({ total: riders.length, ridingNow, openToInvite, riders });
}
