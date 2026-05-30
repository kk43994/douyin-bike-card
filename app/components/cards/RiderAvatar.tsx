import { Bike } from "lucide-react";
import type { Rider } from "../../lib/amap-mock";

export function RiderAvatar({ rider, accent }: { rider: Rider; accent: string }) {
  const color =
    rider.status === "riding"
      ? "#4ade80"
      : rider.status === "looking"
        ? accent
        : "#94a3b8";
  const pulsate = rider.status !== "resting";
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid h-9 w-9 place-items-center rounded-full border-2 bg-[#1a1a25]"
        style={{
          borderColor: color,
          boxShadow: pulsate ? `0 0 14px ${color}55` : "none",
          animation: pulsate ? "wheelSpin 6s linear infinite" : "none",
          animationDirection: "reverse",
        }}
      >
        <Bike size={16} color="white" />
      </div>
      <p className="mt-0.5 max-w-[60px] truncate rounded bg-black/60 px-1.5 text-[9px] text-white/80">
        {rider.name}
      </p>
    </div>
  );
}
