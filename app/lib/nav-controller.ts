import type { LatLng } from "./geo";
import { speak, stopSpeaking } from "./voice-nav";

export type NavStep = {
  index: number;
  instruction: string;
  distance_m: number;
};

export type NavTick = {
  position: LatLng;
  bearing_deg: number;
  stepIndex: number;
  progressM: number;
  totalM: number;
  speedKmh: number;
};

export type NavCtl = { stop: () => void };

type StartOpts = {
  polyline: LatLng[];
  steps: NavStep[];
  /** 模拟骑行速度, 默认 18 km/h */
  speedKmh?: number;
  /** 每秒 tick 次数, 默认 8 */
  tickHz?: number;
  /** 是否朗读 step instruction */
  voice?: boolean;
  onTick: (e: NavTick) => void;
  onStepEnter: (idx: number) => void;
  onDone: () => void;
};

export function startSimulatedRide(opts: StartOpts): NavCtl {
  const {
    polyline,
    steps,
    speedKmh = 18,
    tickHz = 8,
    voice = true,
    onTick,
    onStepEnter,
    onDone,
  } = opts;
  if (polyline.length < 2 || steps.length === 0) {
    onDone();
    return { stop: () => {} };
  }

  const cumDist: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    cumDist.push(cumDist[i - 1] + distanceMeters(polyline[i - 1], polyline[i]));
  }
  const totalM = cumDist[cumDist.length - 1];

  const stepBoundaries: number[] = [0];
  let acc = 0;
  for (const s of steps) {
    acc += s.distance_m;
    stepBoundaries.push(acc);
  }
  const totalStepLen = stepBoundaries[stepBoundaries.length - 1] || totalM;
  const scale = totalM / totalStepLen;

  let progressM = 0;
  let currentStep = -1;
  let stopped = false;
  const speedMps = (speedKmh * 1000) / 3600;
  const intervalMs = 1000 / tickHz;
  const advancePerTick = speedMps / tickHz;
  let timer: ReturnType<typeof setInterval> | null = null;

  const speakStep = (i: number) => {
    if (!voice) return;
    const txt = `小R提醒你，第 ${i + 1} 步，${steps[i].instruction}`;
    speak(txt, { provider: "minimax", style: "nav", rate: 1.13, pitch: 1, emotion: "calm" });
  };

  currentStep = 0;
  onStepEnter(0);
  speakStep(0);

  timer = setInterval(() => {
    if (stopped) return;
    progressM += advancePerTick;

    if (progressM >= totalM) {
      progressM = totalM;
      const last = polyline[polyline.length - 1];
      onTick({
        position: last,
        bearing_deg: bearingDeg(polyline[polyline.length - 2] ?? last, last),
        stepIndex: steps.length - 1,
        progressM,
        totalM,
        speedKmh,
      });
      stopped = true;
      if (timer) clearInterval(timer);
      if (voice) speak("小R报到，到达目的地啦，今天也骑得很稳喔。", { provider: "minimax", style: "cute", rate: 1.1, pitch: 1, emotion: "happy" });
      onDone();
      return;
    }

    let segIdx = 1;
    while (segIdx < cumDist.length && cumDist[segIdx] < progressM) segIdx++;
    const a = polyline[segIdx - 1];
    const b = polyline[Math.min(segIdx, polyline.length - 1)];
    const segStart = cumDist[segIdx - 1];
    const segEnd = cumDist[Math.min(segIdx, cumDist.length - 1)];
    const segLen = segEnd - segStart || 1;
    const t = Math.min(1, (progressM - segStart) / segLen);
    const pos = {
      lng: a.lng + (b.lng - a.lng) * t,
      lat: a.lat + (b.lat - a.lat) * t,
    };
    const bearing = bearingDeg(a, b);

    const scaledProgress = progressM / scale;
    let newStep = currentStep;
    for (let i = currentStep + 1; i < stepBoundaries.length - 1; i++) {
      if (scaledProgress >= stepBoundaries[i]) newStep = i;
    }
    if (newStep > currentStep && newStep < steps.length) {
      currentStep = newStep;
      onStepEnter(currentStep);
      speakStep(currentStep);
    }

    onTick({ position: pos, bearing_deg: bearing, stepIndex: currentStep, progressM, totalM, speedKmh });
  }, intervalMs);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stopSpeaking();
    },
  };
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bearingDeg(a: LatLng, b: LatLng): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const toDeg = (v: number) => (v * 180) / Math.PI;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
