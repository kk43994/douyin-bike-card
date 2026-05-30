import { Mountain, RefreshCw, Route } from "lucide-react";
import type { SceneKey } from "../../lib/amap-mock";
import { ControlChip } from "../atoms/ControlChip";

export function DemoControls({
  scene,
  onSwitch,
  onReset,
}: {
  scene: SceneKey;
  onSwitch: (s: SceneKey) => void;
  onReset: () => void;
}) {
  return (
    <div
      className="pointer-events-auto flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 px-1.5 py-1 shadow-[0_6px_24px_rgba(0,0,0,0.5)]"
      style={{
        position: "fixed",
        left: "50%",
        top: "max(10px, env(safe-area-inset-top))",
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        maxWidth: "calc(100vw - 88px)",
      }}
    >
      <ControlChip
        active={scene === "mountain"}
        accent="#ff8a2a"
        icon={<Mountain size={13} />}
        label="山地"
        shortLabel="山"
        onClick={() => onSwitch("mountain")}
      />
      <ControlChip
        active={scene === "city"}
        accent="#23f0ff"
        icon={<Route size={13} />}
        label="城市"
        shortLabel="城"
        onClick={() => onSwitch("city")}
      />
      <button
        type="button"
        onClick={onReset}
        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
      >
        <RefreshCw size={12} />
        重置
      </button>
    </div>
  );
}
