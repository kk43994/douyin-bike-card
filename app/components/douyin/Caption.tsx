import { Music2 } from "lucide-react";
import type { SceneProfile } from "../../lib/scene-profiles";

export function DouyinCaption({ profile }: { profile: SceneProfile }) {
  return (
    <div className="pointer-events-none absolute bottom-[150px] left-3.5 right-20 z-20 space-y-1.5">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: profile.accent }} />
        <span className="text-white/85">{profile.liveTag}</span>
      </div>
      <p className="text-[15px] font-bold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {profile.author}
        <span className="ml-2 text-[11px] font-normal text-white/55">{profile.authorTag}</span>
      </p>
      <p className="text-[13px] font-semibold leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {profile.videoTitle}
      </p>
      <p className="line-clamp-2 text-[12px] leading-snug text-white/82 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {profile.videoDesc}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-white/85">
        <Music2 size={12} />
        <span className="truncate">{profile.music}</span>
      </div>
    </div>
  );
}
