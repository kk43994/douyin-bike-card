import { User } from "lucide-react";
import type { RiderInviteProps } from "./card-types";

export function RiderInvite({ rider, accent, onClose, onInvite }: RiderInviteProps) {
  const vehicleLabel =
    rider.vehicle === "mountain" ? "山地车" : rider.vehicle === "road" ? "公路车" : "通勤车";
  const statusLabel =
    rider.status === "riding" ? "正在骑行" : rider.status === "looking" ? "想约骑" : "休息中";
  return (
    <>
      <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-[150px] left-4 right-4 z-50 rounded-3xl border border-white/15 bg-[#10131a]/95 p-4 shadow-[0_24px_50px_rgba(0,0,0,0.65)]">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-full border-2"
            style={{ borderColor: accent, background: "linear-gradient(135deg,#1f1f29,#3a3a55)" }}
          >
            <User size={22} />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">{rider.name}</p>
            <p className="text-[11px] text-white/55">
              {statusLabel} · {vehicleLabel} · 距你 {rider.distance_m} m
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-white/45 hover:text-white/80"
          >
            关闭
          </button>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/70">
          <span className="text-white/45 text-[10px] uppercase tracking-[0.18em]">当前路线</span>
          <p className="mt-0.5 font-semibold text-white">{rider.currentRoute}</p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onInvite}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold text-black"
            style={{ background: accent, boxShadow: `0 6px 20px ${accent}55` }}
          >
            约骑同行
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white"
          >
            打招呼
          </button>
        </div>
      </div>
    </>
  );
}
