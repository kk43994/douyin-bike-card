"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Radar, ChevronRight, Sparkles } from "lucide-react";
import type { SceneProfile } from "../../lib/scene-profiles";

export function IdleBanner({
  profile,
  onScan,
}: {
  profile: SceneProfile;
  onScan: () => void;
}) {
  void profile;
  const rootRef = useRef<HTMLDivElement>(null);

  // 自然入场: 从下方滑入 + 淡入 + 轻微回弹
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 36, autoAlpha: 0, scale: 0.96 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" },
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-auto absolute inset-x-0 bottom-[78px] z-40 flex justify-start pl-3.5"
      style={{ willChange: "transform, opacity" }}
    >
      {/* 抖音原生感胶囊: 半透明黑底 + 白字, 无色块边框, 不抢镜 */}
      <button
        type="button"
        onClick={onScan}
        className="relative z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/35 py-2 pl-2.5 pr-3 backdrop-blur-md transition active:scale-[0.97]"
      >
        {/* 雷达图标 + 呼吸微光 (AI 正在感知周边) */}
        <span className="relative grid h-6 w-6 shrink-0 place-items-center">
          <span className="idle-radar-pulse absolute inset-0 rounded-full bg-white/70" />
          <Radar size={15} strokeWidth={2.4} className="relative text-white" />
        </span>
        {/* AI 徽标 */}
        <span className="flex items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white">
          <Sparkles size={10} className="idle-ai-spark" />
          AI
        </span>
        <span className="text-[13px] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          识别附近骑行赛道
        </span>
        <ChevronRight size={15} className="text-white/70" />
      </button>
    </div>
  );
}
