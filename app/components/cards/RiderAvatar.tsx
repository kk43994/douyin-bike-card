import Image from "next/image";
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
  const isPhoto = Boolean(rider.avatarUrl);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 bg-[#1a1a25]"
        style={{
          borderColor: color,
          boxShadow: pulsate ? `0 0 16px ${color}66, 0 0 34px ${color}22` : "none",
        }}
      >
        {isPhoto ? (
          <>
            <Image
              src={rider.avatarUrl as string}
              alt={rider.name}
              fill
              sizes="44px"
              className="object-cover"
              style={{ objectPosition: rider.avatarPosition ?? "center" }}
              priority
            />
            <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/35" />
          </>
        ) : (
          <Bike size={16} color="white" />
        )}
      </div>
      <p className="mt-1 max-w-[68px] truncate rounded bg-black/70 px-1.5 text-[9px] text-white/85 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
        {rider.name}
      </p>
    </div>
  );
}
