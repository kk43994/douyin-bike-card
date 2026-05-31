import type { AmapBicyclingResult, AmapWeather } from "./amap";
import type { NavProgress } from "../components/cards/card-types";

export type RideAiContext = {
  scene: "city" | "mountain";
  destinationName?: string;
  routeSource: "none" | "amap" | "amap-fallback";
  optimized: boolean;
  navProgress: NavProgress | null;
  route: AmapBicyclingResult;
  weather: AmapWeather | null;
  activeStepIndex?: number | null;
  intel: {
    smoothScore: number;
    safetyScore: number;
    greenwayRatio: number;
    effortScore: number;
    trafficLabel: string;
    liveTip: string;
  };
};

export type RideAiReply = {
  ok: true;
  source: "ridesnap-brain";
  providerName: string;
  model: string;
  latencyMs: number;
  text: string;
  speech: string;
  shouldOptimize: boolean;
  riskLevel: "low" | "medium" | "high";
  routeBias: "keep" | "safer" | "faster" | "rest";
  quickActions: string[];
};

export async function askRideAi(
  question: string,
  context: RideAiContext,
  opts: { imageDataUrl?: string; signal?: AbortSignal } = {},
): Promise<RideAiReply> {
  const res = await fetch("/api/ai/ride-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      imageDataUrl: opts.imageDataUrl,
      context: {
        ...context,
        route: {
          distance_m: context.route.distance_m,
          duration_s: context.route.duration_s,
          polyline: samplePolyline(context.route.polyline),
          activeStepIndex: context.activeStepIndex ?? null,
          steps: context.route.steps.slice(0, 12).map((step) => ({
            instruction: step.instruction,
            road: step.road,
            distance_m: step.distance_m,
            duration_s: step.duration_s,
          })),
        },
      },
    }),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(String(data?.error ?? `Ride AI failed: ${res.status}`));
  }
  return data as RideAiReply;
}

function samplePolyline(polyline: AmapBicyclingResult["polyline"]) {
  if (polyline.length <= 10) return polyline;
  const out = [];
  for (let i = 0; i < 10; i += 1) {
    const idx = Math.round((i / 9) * (polyline.length - 1));
    const point = polyline[idx];
    if (point) out.push({ lng: Number(point.lng.toFixed(6)), lat: Number(point.lat.toFixed(6)) });
  }
  return out;
}
