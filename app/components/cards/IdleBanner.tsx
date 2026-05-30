import { RadioTower } from "lucide-react";
import type { SceneProfile } from "../../lib/scene-profiles";

export function IdleBanner({
  profile,
  onScan,
}: {
  profile: SceneProfile;
  onScan: () => void;
}) {
  return (
    <div className="absolute bottom-[78px] left-3 right-3 z-30 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0a0c12]/85 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${profile.accent}, ${profile.accentSoft})`,
          boxShadow: `0 4px 18px ${profile.accentSoft}`,
        }}
      >
        <RadioTower size={20} color="#0a0c12" strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] uppercase tracking-[0.22em] text-white/45">
          RideSnap · 智能骑行卡
        </p>
        <p className="truncate text-sm font-semibold">识别你附近最适合的骑行赛道</p>
      </div>
      <button
        type="button"
        onClick={onScan}
        className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-black"
        style={{
          background: profile.accent,
          boxShadow: `0 4px 14px ${profile.accentSoft}`,
        }}
      >
        开始识别
      </button>
    </div>
  );
}
