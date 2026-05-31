import type { SceneKey } from "./amap-mock";
import { riderAvatarAt } from "./rider-avatars";

/**
 * 本周骑行挑战榜 mock 数据层。
 *
 * 按场景出榜: 山地榜以"爬升"为主战场, 城市榜以"里程"为主战场。
 * 当前为 mock; 未来替换为自建骑行 LBS / 抖音运动开放数据, 组件零改动。
 */

export type RankMetric = "distance" | "climb" | "speed";

export const RANK_METRICS: { key: RankMetric; label: string; unit: string }[] = [
  { key: "distance", label: "里程", unit: "km" },
  { key: "climb", label: "爬升", unit: "m" },
  { key: "speed", label: "均速", unit: "km/h" },
];

export type LeaderEntry = {
  id: string;
  name: string;
  avatar: string;
  distanceKm: number;
  climbM: number;
  avgKmh: number;
  /** 相比上周名次变化, 正数为上升 */
  delta: number;
  isMe?: boolean;
};

const MOUNTAIN_BOARD: LeaderEntry[] = [
  { id: "m1", name: "林道老王", avatar: riderAvatarAt(1), distanceKm: 142.6, climbM: 4820, avgKmh: 19.8, delta: 1 },
  { id: "m2", name: "碳纤维杰", avatar: riderAvatarAt(2), distanceKm: 168.2, climbM: 4310, avgKmh: 22.4, delta: -1 },
  { id: "m3", name: "GravelGoat", avatar: riderAvatarAt(3), distanceKm: 121.5, climbM: 3990, avgKmh: 18.2, delta: 2 },
  { id: "me", name: "你", avatar: riderAvatarAt(4), distanceKm: 96.3, climbM: 3120, avgKmh: 20.1, delta: 4, isMe: true },
  { id: "m5", name: "胖头陀", avatar: riderAvatarAt(0), distanceKm: 88.7, climbM: 2870, avgKmh: 17.5, delta: 0 },
  { id: "m6", name: "二八大杠", avatar: riderAvatarAt(5), distanceKm: 110.4, climbM: 2640, avgKmh: 16.9, delta: -2 },
  { id: "m7", name: "山猫Lina", avatar: riderAvatarAt(6), distanceKm: 73.2, climbM: 2410, avgKmh: 18.8, delta: 3 },
  { id: "m8", name: "越野阿强", avatar: riderAvatarAt(7), distanceKm: 81.9, climbM: 2180, avgKmh: 17.1, delta: -1 },
  { id: "m9", name: "松林追风", avatar: riderAvatarAt(8), distanceKm: 64.5, climbM: 1980, avgKmh: 19.3, delta: 1 },
  { id: "m10", name: "夜爬党", avatar: riderAvatarAt(9), distanceKm: 58.1, climbM: 1760, avgKmh: 16.2, delta: 0 },
];

const CITY_BOARD: LeaderEntry[] = [
  { id: "c1", name: "城南夜骑社", avatar: riderAvatarAt(10), distanceKm: 312.8, climbM: 860, avgKmh: 28.6, delta: 0 },
  { id: "c2", name: "通勤刺客", avatar: riderAvatarAt(11), distanceKm: 286.4, climbM: 720, avgKmh: 30.1, delta: 2 },
  { id: "c3", name: "碳纤维杰", avatar: riderAvatarAt(12), distanceKm: 268.9, climbM: 690, avgKmh: 29.2, delta: -1 },
  { id: "c4", name: "滨江巡航", avatar: riderAvatarAt(13), distanceKm: 241.2, climbM: 540, avgKmh: 27.8, delta: 1 },
  { id: "me", name: "你", avatar: riderAvatarAt(14), distanceKm: 198.5, climbM: 480, avgKmh: 26.4, delta: 5, isMe: true },
  { id: "c6", name: "Lululemon", avatar: riderAvatarAt(15), distanceKm: 176.3, climbM: 410, avgKmh: 24.9, delta: -2 },
  { id: "c7", name: "绿灯之王", avatar: riderAvatarAt(16), distanceKm: 210.7, climbM: 520, avgKmh: 25.6, delta: 0 },
  { id: "c8", name: "Cady", avatar: riderAvatarAt(5), distanceKm: 152.4, climbM: 360, avgKmh: 23.7, delta: 3 },
  { id: "c9", name: "霓虹骑士", avatar: riderAvatarAt(7), distanceKm: 134.8, climbM: 300, avgKmh: 26.0, delta: -1 },
  { id: "c10", name: "早高峰侠", avatar: riderAvatarAt(9), distanceKm: 121.6, climbM: 280, avgKmh: 22.3, delta: 1 },
];

export function getLeaderboard(scene: SceneKey): LeaderEntry[] {
  return scene === "mountain" ? MOUNTAIN_BOARD : CITY_BOARD;
}

export function metricValue(e: LeaderEntry, m: RankMetric): number {
  return m === "distance" ? e.distanceKm : m === "climb" ? e.climbM : e.avgKmh;
}

export function formatMetric(v: number, m: RankMetric): string {
  return m === "climb" ? String(Math.round(v)) : v.toFixed(1);
}
