import type { AmapBicyclingResult, AmapWeather } from "../../lib/amap";
import type { Rider, RidersResult, SceneDetectResult } from "../../lib/amap-mock";
import type { LatLng } from "../../lib/geo";
import type { SceneProfile } from "../../lib/scene-profiles";
import type { PickedDestination } from "./DestinationPicker";

export type RouteCardProps = {
  profile: SceneProfile;
  scanResult: SceneDetectResult | null;
  origin: LatLng | null;
  destination: PickedDestination | null;
  customRoute: AmapBicyclingResult | null;
  routeSource: "none" | "amap" | "amap-fallback";
  weather: AmapWeather | null;
  voicePlaying: boolean;
  voiceStepIdx: number | null;
  onPickDestination: () => void;
  onNav: () => void;
  onVoiceNav: () => void;
  onReset: () => void;
};

export type BuddyCardProps = {
  profile: SceneProfile;
  riders: RidersResult | null;
  onRefresh: () => void;
  onSelectRider: (r: Rider) => void;
};

export type RiderInviteProps = {
  rider: Rider;
  accent: string;
  onClose: () => void;
  onInvite: () => void;
};
