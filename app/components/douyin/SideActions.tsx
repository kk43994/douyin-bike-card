import { Bookmark, Heart, MessageCircle, Music2, Plus, Share2, User } from "lucide-react";
import type { ReactNode } from "react";
import type { SceneProfile } from "../../lib/scene-profiles";

export function DouyinSideActions({ profile }: { profile: SceneProfile }) {
  return (
    <div className="absolute right-2 bottom-[280px] z-20 flex flex-col items-center gap-3.5 text-white">
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-zinc-700 to-zinc-900">
          <User size={20} />
        </div>
        <div className="absolute -bottom-1.5 left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-[#fe2c55] text-white">
          <Plus size={11} strokeWidth={3} />
        </div>
      </div>
      <SideStat icon={<Heart size={30} fill="white" strokeWidth={1.4} />} label={profile.likes} />
      <SideStat icon={<MessageCircle size={30} strokeWidth={1.8} />} label={profile.comments} />
      <SideStat
        icon={<Bookmark size={28} fill="#facc15" stroke="#facc15" strokeWidth={1.6} />}
        label={profile.collects}
      />
      <SideStat icon={<Share2 size={28} strokeWidth={1.8} />} label={profile.shares} />
      <MusicDisc accent={profile.accent} accentSoft={profile.accentSoft} />
    </div>
  );
}

function SideStat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MusicDisc({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  return (
    <div
      className="mt-1 grid h-10 w-10 animate-[wheelSpin_5s_linear_infinite] place-items-center rounded-full"
      style={{
        background:
          "conic-gradient(from 0deg, #1a1a1a, #3a3a3a, #1a1a1a, #3a3a3a, #1a1a1a)",
        boxShadow: `0 0 18px ${accentSoft}`,
      }}
    >
      <div className="grid h-4 w-4 place-items-center rounded-full" style={{ background: accent }}>
        <Music2 size={10} color="#000" strokeWidth={2.5} />
      </div>
    </div>
  );
}
