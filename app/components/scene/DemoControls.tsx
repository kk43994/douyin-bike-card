import { Mountain, RefreshCw, Route, X } from "lucide-react";
import { useState, type ReactNode } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeAccent = scene === "mountain" ? "#ff8a2a" : "#23f0ff";
  const ActiveIcon = scene === "mountain" ? Mountain : Route;

  return (
    <>
      <div
        className="pointer-events-auto fixed z-[70] hidden w-[58px] flex-col items-center gap-2 rounded-2xl border border-white/12 bg-black/45 p-2 text-white shadow-[0_16px_36px_rgba(0,0,0,0.42)] backdrop-blur-xl md:flex"
        style={{
          right: "calc(50% + 232px)",
          top: "max(96px, calc(env(safe-area-inset-top) + 96px))",
        }}
        aria-label="演示控制"
      >
        <span className="text-[9px] font-bold tracking-[0.18em] text-white/42 [writing-mode:vertical-rl]">
          演示
        </span>
        <DemoRailButton
          active={scene === "mountain"}
          accent="#ff8a2a"
          icon={<Mountain size={15} />}
          label="山地"
          onClick={() => onSwitch("mountain")}
        />
        <DemoRailButton
          active={scene === "city"}
          accent="#23f0ff"
          icon={<Route size={15} />}
          label="城市"
          onClick={() => onSwitch("city")}
        />
        <button
          type="button"
          onClick={onReset}
          title="重置演示"
          aria-label="重置演示"
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.045] text-white/62 transition hover:bg-white/10 hover:text-white active:scale-95"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="pointer-events-auto fixed z-[70] grid h-9 w-9 place-items-center rounded-full border border-white/14 bg-black/42 text-white shadow-[0_12px_28px_rgba(0,0,0,0.38)] backdrop-blur-xl transition active:scale-95 md:hidden"
        style={{
          top: "max(82px, calc(env(safe-area-inset-top) + 82px))",
          right: "max(12px, env(safe-area-inset-right))",
          color: activeAccent,
        }}
        aria-label={mobileOpen ? "收起演示控制" : "打开演示控制"}
      >
        {mobileOpen ? <X size={16} /> : <ActiveIcon size={16} />}
      </button>

      {mobileOpen && (
        <div
          className="pointer-events-auto fixed z-[70] flex items-center gap-1 rounded-full border border-white/14 bg-black/58 p-1 shadow-[0_14px_34px_rgba(0,0,0,0.42)] backdrop-blur-xl md:hidden"
          style={{
            top: "max(126px, calc(env(safe-area-inset-top) + 126px))",
            right: "max(12px, env(safe-area-inset-right))",
          }}
        >
          <ControlChip
            active={scene === "mountain"}
            accent="#ff8a2a"
            icon={<Mountain size={13} />}
            label="山地"
            shortLabel="山"
            onClick={() => {
              onSwitch("mountain");
              setMobileOpen(false);
            }}
          />
          <ControlChip
            active={scene === "city"}
            accent="#23f0ff"
            icon={<Route size={13} />}
            label="城市"
            shortLabel="城"
            onClick={() => {
              onSwitch("city");
              setMobileOpen(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              onReset();
              setMobileOpen(false);
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.045] text-white/68 transition active:scale-95"
            aria-label="重置演示"
            title="重置演示"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      )}
    </>
  );
}

function DemoRailButton({
  active,
  accent,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  accent: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-[46px] w-[42px] flex-col items-center justify-center gap-0.5 rounded-xl border text-[10px] font-semibold transition active:scale-95"
      style={
        active
          ? {
              background: `${accent}22`,
              borderColor: `${accent}66`,
              color: accent,
              boxShadow: `0 0 18px ${accent}26`,
            }
          : {
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.62)",
            }
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
