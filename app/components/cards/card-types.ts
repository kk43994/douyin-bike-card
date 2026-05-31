import type { AmapBicyclingResult, AmapWeather } from "../../lib/amap";
import type { Rider, RidersResult, SceneDetectResult } from "../../lib/amap-mock";
import type { LatLng } from "../../lib/geo";
import type { LeaderEntry } from "../../lib/leaderboard-mock";
import type { HotBikeVideo } from "../../lib/hot-videos-mock";
import type { SceneProfile } from "../../lib/scene-profiles";
import type { ShopProduct } from "../../lib/shop-mock";
import type { PickedDestination } from "./DestinationPicker";

export type NavProgress = {
  progressM: number;
  totalM: number;
  speedKmh: number;
};

export type AiRecommendedDestination = {
  id: string;
  name: string;
  hint: string;
  loc: LatLng;
  score: number;
  tags: string[];
  reason: string;
  distance_m?: number;
  source: "amap" | "fallback";
};

export type RouteCardProps = {
  profile: SceneProfile;
  scanResult: SceneDetectResult | null;
  origin: LatLng | null;
  destination: PickedDestination | null;
  customRoute: AmapBicyclingResult | null;
  routeSource: "none" | "amap" | "amap-fallback";
  weather: AmapWeather | null;
  recommendedDestinations: AiRecommendedDestination[];
  voicePlaying: boolean;
  voiceStepIdx: number | null;
  myPosition: LatLng | null;
  myBearing: number;
  navProgress: NavProgress | null;
  /** AI 识别到的所在地, e.g. "温州 · 龙湾区" */
  placeName?: string | null;
  onPickDestination: () => void;
  onPickRecommendedDestination: (destination: AiRecommendedDestination) => void;
  onNav: () => void;
  onVoiceNav: () => void;
  onOpenAmapNav: () => void;
  onShare: () => void;
  onReset: () => void;
};

export type BuddyCardProps = {
  profile: SceneProfile;
  riders: RidersResult | null;
  onRefresh: () => void;
  onSelectRider: (r: Rider) => void;
};

export type GearShopCardProps = {
  profile: SceneProfile;
  products: ShopProduct[];
  onBuy: (p: ShopProduct) => void;
};

export type ChallengeCardProps = {
  profile: SceneProfile;
  entries: LeaderEntry[];
  onChallenge: () => void;
};

export type HotVideoCardProps = {
  profile: SceneProfile;
  videos: HotBikeVideo[];
  onOpenVideo: (video: HotBikeVideo) => void;
};

export type RiderInviteProps = {
  rider: Rider;
  accent: string;
  onClose: () => void;
  onInvite: () => void;
};

export type ShareSheetProps = {
  accent: string;
  /** 被分享的标题 (如路线名) */
  title: string;
  url?: string;
  sourceLabel?: string;
  helperText?: string;
  onClose: () => void;
  onShare: (channel: string) => void;
};
