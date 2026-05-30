import type { SceneKey } from "./amap-mock";

export type SceneProfile = {
  key: SceneKey;
  label: string;
  short: string;
  author: string;
  authorTag: string;
  videoTitle: string;
  videoDesc: string;
  music: string;
  likes: string;
  comments: string;
  collects: string;
  shares: string;
  liveTag: string;
  accent: string;
  accentSoft: string;
  selfRoute: string;
};

export const sceneProfiles: Record<SceneKey, SceneProfile> = {
  mountain: {
    key: "mountain",
    label: "山地环境",
    short: "MTB",
    author: "@林道老王",
    authorTag: "粉丝 38.2w",
    videoTitle: "森林越野骑行 · 松林爬坡线",
    videoDesc:
      "刚解锁松林爬坡线，氧气和肾上腺素一起冲顶 #山地车 #越野骑行 #林道",
    music: "Trail Burst - Hex Lab",
    likes: "18.6w",
    comments: "2.1w",
    collects: "9621",
    shares: "1.2w",
    liveTag: "附近识别到森林公园 / 爬坡路段",
    accent: "#ff8a2a",
    accentSoft: "rgba(255, 138, 42, 0.22)",
    selfRoute: "九溪十八涧林道",
  },
  city: {
    key: "city",
    label: "城市道路",
    short: "ROAD",
    author: "@城南夜骑社",
    authorTag: "粉丝 24.7w",
    videoTitle: "城市夜骑公路车攻略 · 滨江霓虹巡航线",
    videoDesc:
      "今晚滨江全线绿灯，11 公里巡航直接拉满 #公路车 #城市夜骑 #通勤",
    music: "Neon Cruise - Vapor.fm",
    likes: "12.3w",
    comments: "8643",
    collects: "1.5w",
    shares: "9821",
    liveTag: "附近识别到城市主路 / 滨江绿道",
    accent: "#23f0ff",
    accentSoft: "rgba(35, 240, 255, 0.22)",
    selfRoute: "滨江夜骑霓虹巡航线",
  },
};
