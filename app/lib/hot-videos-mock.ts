import type { SceneKey } from "./amap-mock";

export type HotBikeVideo = {
  id: string;
  title: string;
  creator: string;
  avatar: string;
  tag: string;
  heat: string;
  views: string;
  likes: string;
  comments: string;
  duration: string;
  routeHint: string;
  poster: string;
  video: string;
  reason: string;
};

const MOUNTAIN: HotBikeVideo[] = [
  {
    id: "m-trail-1",
    title: "松林爬坡 3 分钟压弯线",
    creator: "林道老王",
    avatar: "/riders/cn-bike-03.jpg",
    tag: "#山地车 #林道",
    heat: "热度 98",
    views: "286w",
    likes: "18.6w",
    comments: "9621",
    duration: "00:34",
    routeHint: "林道爬坡 · 技术线",
    poster: "/posters/hot/hot-mountain-stromlo.jpg",
    video: "/videos/hot-mountain-stromlo.mp4",
    reason: "同城山地用户正在看，适合接在路线推荐后做攻略种草。",
  },
  {
    id: "m-trail-2",
    title: "轻越野新手避坑装备清单",
    creator: "胖头陀",
    avatar: "/riders/cn-bike-01.jpg",
    tag: "#越野骑行 #装备",
    heat: "热度 94",
    views: "142w",
    likes: "9.8w",
    comments: "4310",
    duration: "00:28",
    routeHint: "轻越野 · 装备避坑",
    poster: "/posters/hot/hot-mountain-downhill.jpg",
    video: "/videos/hot-mountain-downhill.mp4",
    reason: "和当前山地装备卡联动，适合引导观众继续看商品卡。",
  },
  {
    id: "m-trail-3",
    title: "九溪绿道清晨无车路线",
    creator: "山猫Lina",
    avatar: "/riders/cn-bike-08.jpg",
    tag: "#风景骑 #杭州",
    heat: "热度 91",
    views: "96w",
    likes: "7.4w",
    comments: "2108",
    duration: "00:31",
    routeHint: "清晨绿道 · 风景线",
    poster: "/posters/hot/hot-mountain-skills.jpg",
    video: "/videos/hot-mountain-skills.mp4",
    reason: "路线风景感强，适合演示 AI 推荐骑行点后的内容续播。",
  },
  {
    id: "m-trail-4",
    title: "泵道飞包怎么稳住落地",
    creator: "跳台阿峰",
    avatar: "/riders/cn-bike-11.jpg",
    tag: "#泵道 #跳台",
    heat: "热度 89",
    views: "83w",
    likes: "6.9w",
    comments: "1870",
    duration: "00:28",
    routeHint: "泵道练习 · 动作线",
    poster: "/posters/hot/hot-mountain-dirt-jump.jpg",
    video: "/videos/hot-mountain-dirt-jump.mp4",
    reason: "补充更强动作感的视频内容，适合黑客松现场突出交互卡片的视觉冲击。",
  },
  {
    id: "m-trail-5",
    title: "高海拔公路转山骑行",
    creator: "川西小张",
    avatar: "/riders/cn-bike-15.jpg",
    tag: "#长坡 #耐力骑",
    heat: "热度 87",
    views: "76w",
    likes: "5.8w",
    comments: "1432",
    duration: "00:06",
    routeHint: "高海拔 · 长坡线",
    poster: "/posters/hot/hot-mountain-manali.jpg",
    video: "/videos/hot-mountain-manali.mp4",
    reason: "短视频节奏更快，可作为山地攻略卡的耐力路线补充。",
  },
];

const CITY: HotBikeVideo[] = [
  {
    id: "c-road-1",
    title: "滨江夜骑 11 公里绿灯巡航",
    creator: "城南夜骑社",
    avatar: "/riders/cn-bike-10.jpg",
    tag: "#公路车 #城市夜骑",
    heat: "热度 99",
    views: "318w",
    likes: "12.3w",
    comments: "8643",
    duration: "00:26",
    routeHint: "夜骑绿波 · 城市线",
    poster: "/posters/hot/hot-city-amsterdam.jpg",
    video: "/videos/hot-city-amsterdam.mp4",
    reason: "同城夜骑热度最高，和当前城市绿道路线路径匹配。",
  },
  {
    id: "c-road-2",
    title: "通勤党如何避开早高峰右转车",
    creator: "通勤刺客",
    avatar: "/riders/cn-bike-13.jpg",
    tag: "#通勤 #安全",
    heat: "热度 96",
    views: "221w",
    likes: "10.1w",
    comments: "5220",
    duration: "00:39",
    routeHint: "早高峰 · 安全绕行",
    poster: "/posters/hot/hot-road-racer.jpg",
    video: "/videos/hot-road-racer.mp4",
    reason: "和 AI 安全路线调优强相关，适合讲清项目价值。",
  },
  {
    id: "c-road-3",
    title: "城市公路车尾灯和码表怎么选",
    creator: "绿灯之王",
    avatar: "/riders/cn-bike-06.jpg",
    tag: "#装备 #抖音小店",
    heat: "热度 92",
    views: "118w",
    likes: "8.7w",
    comments: "3096",
    duration: "00:33",
    routeHint: "城市公路 · 装备联动",
    poster: "/posters/hot/hot-road-ireland.jpg",
    video: "/videos/hot-road-ireland.mp4",
    reason: "内容和商品卡联动，适合讲商业化闭环。",
  },
  {
    id: "c-road-4",
    title: "周末慢骑补给点怎么选",
    creator: "阿宁骑记",
    avatar: "/riders/cn-bike-04.jpg",
    tag: "#周末骑行 #补给",
    heat: "热度 90",
    views: "104w",
    likes: "7.1w",
    comments: "2654",
    duration: "00:28",
    routeHint: "补给友好 · 郊野线",
    poster: "/posters/hot/hot-road-alabama.jpg",
    video: "/videos/hot-road-alabama.mp4",
    reason: "和智能推荐骑行点呼应，强调路况、补给和风景一起做路线调优。",
  },
  {
    id: "c-road-5",
    title: "新手长线不要硬冲坡",
    creator: "骑行教练K",
    avatar: "/riders/cn-bike-12.jpg",
    tag: "#路线规划 #新手",
    heat: "热度 88",
    views: "91w",
    likes: "6.4w",
    comments: "1946",
    duration: "00:28",
    routeHint: "新手友好 · 缓坡线",
    poster: "/posters/hot/hot-mountain-kullu.jpg",
    video: "/videos/hot-mountain-kullu.mp4",
    reason: "把坡度、体力和安全建议串到 AI 导航讲解里，方便现场演示完整闭环。",
  },
];

export function getHotBikeVideos(scene: SceneKey): HotBikeVideo[] {
  return scene === "mountain" ? MOUNTAIN : CITY;
}
