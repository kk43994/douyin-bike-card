"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Radar, Sparkles } from "lucide-react";
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
  // mapRef 仍保留以兼容父组件调用 (本极简版不再用栅格地图动画)
  void mapRef;
  const rootRef = useRef<HTMLDivElement>(null);
  const activeStep = Math.min(
    scanSteps.length - 1,
    Math.floor((progress / 100) * scanSteps.length),
  );
  const accent = profile.accent;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 28, autoAlpha: 0, scale: 0.96 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="absolute inset-x-3 bottom-[88px] z-30 flex items-center gap-3 rounded-2xl border border-white/12 bg-[#0b0d12]/58 px-3.5 py-3 shadow-[0_10px_34px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      style={{ willChange: "transform, opacity" }}
    >
      {/* 雷达扫描盘 */}
      <div
        ref={scannerRef}
        className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }}
      >
        {/* 旋转扫描扇形 */}
        <span
          className="scan-sweep absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${accent}00 250deg, ${accent}66 340deg, ${accent}cc 360deg)`,
          }}
        />
        {/* 呼吸圈 */}
        <span className="scan-ring absolute h-10 w-10 rounded-full border" style={{ borderColor: `${accent}55` }} />
        <Radar size={18} className="relative z-10" style={{ color: accent }} />
      </div>

      {/* 状态文案 + 细进度条 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1 truncate text-[13px] font-bold text-white">
            <Sparkles size={12} className="idle-ai-spark shrink-0" style={{ color: accent }} />
            AI 正在锁定附近赛道
          </p>
          <span className="shrink-0 text-[13px] font-bold tabular-nums" style={{ color: accent }}>
            {progress}%
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-white/55">
          {scanResult?.reason ?? `AI ${scanSteps[activeStep]}中…`}
        </p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #fff)` }}
          />
        </div>
      </div>
    </div>
  );
}
