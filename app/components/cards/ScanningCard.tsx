import { MapPinned } from "lucide-react";
import { Progress } from "antd";
import type { RefObject } from "react";
import type { SceneDetectResult } from "../../lib/amap-mock";
import type { SceneProfile } from "../../lib/scene-profiles";

export const scanSteps = ["GPS 锁定", "周边 POI 抓取", "场景智能识别", "路线策略生成"];

export function ScanningCard({
  profile,
  progress,
  scanResult,
  scannerRef,
  mapRef,
}: {
  profile: SceneProfile;
  progress: number;
  scanResult: SceneDetectResult | null;
  scannerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<HTMLDivElement | null>;
}) {
  const activeStep = Math.min(
    scanSteps.length - 1,
    Math.floor((progress / 100) * scanSteps.length),
  );
  return (
    <div className="absolute bottom-[78px] left-3 right-3 z-30 rounded-3xl border border-white/15 bg-[#0a0c12]/88 p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">场景识别中</p>
          <h2 className="mt-1 text-lg font-semibold">RideSnap · 正在锁定你附近</h2>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-right">
          <p className="text-[10px] text-white/45">识别中</p>
          <p className="text-sm font-bold" style={{ color: profile.accent }}>
            {progress}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-3">
        <div
          ref={scannerRef}
          className="relative grid min-h-[120px] place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="scan-ring absolute h-16 w-16 rounded-full border"
              style={{ borderColor: profile.accent }}
            />
          ))}
          <MapPinned className="relative z-10 h-9 w-9" color={profile.accent} />
        </div>
        <div
          ref={mapRef}
          className="relative overflow-hidden rounded-2xl border border-white/12 bg-black/30 p-3"
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background: `linear-gradient(90deg, ${profile.accentSoft} 1px, transparent 1px), linear-gradient(0deg, ${profile.accentSoft} 1px, transparent 1px)`,
              backgroundSize: "18px 18px",
            }}
          />
          <div className="relative mt-6 h-1 rounded-full bg-white/10">
            <div className="route-line h-full rounded-full" style={{ background: profile.accent }} />
          </div>
          <div className="relative mt-[-10px] flex justify-between">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="route-node h-5 w-5 rounded-full border-2 border-black"
                style={{ background: profile.accent }}
              />
            ))}
          </div>
          <p className="relative mt-5 text-[10px] uppercase tracking-[0.22em] text-white/55">
            scan target
          </p>
          <p className="relative text-sm font-semibold">
            {scanResult?.reason ?? "正在分析周边 POI"}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-white/55">
          <span>{scanSteps[activeStep]}</span>
          <span>{progress}%</span>
        </div>
        <Progress
          percent={progress}
          showInfo={false}
          strokeColor={profile.accent}
          railColor="rgba(255,255,255,.12)"
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {scanSteps.map((step, i) => (
          <div
            key={step}
            className={`rounded-xl border px-2 py-2 text-center text-[10px] ${
              i <= activeStep
                ? "border-white/20 bg-white/12 text-white"
                : "border-white/8 bg-white/[0.03] text-white/36"
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
