"use client";

import gsap from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Play,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { CardShell } from "../atoms/CardShell";
import { CardHeader } from "../atoms/CardHeader";
import type { HotVideoCardProps } from "./card-types";

export function HotVideoCard({ profile, videos, onOpenVideo }: HotVideoCardProps) {
  const accent = profile.accent;
  const [active, setActive] = useState(0);
  const cardRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const item = videos[active % Math.max(1, videos.length)];
  const videoKey = videos.map((video) => video.id).join("|");

  useEffect(() => {
    if (videos.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((idx) => (idx + 1) % videos.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [videos.length, videoKey]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    gsap.fromTo(
      el.querySelectorAll(".hot-video-anim"),
      { y: 14, autoAlpha: 0, filter: "blur(5px)" },
      { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.46, stagger: 0.045, ease: "power2.out" },
    );
  }, [item?.id]);

  useEffect(() => {
    const el = progressRef.current;
    if (!el || videos.length <= 1) return;
    gsap.fromTo(
      el,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 3.2, ease: "none" },
    );
  }, [item?.id, videos.length]);

  if (!item) return null;

  return (
    <CardShell accent={accent} poster={item.poster}>
      <div className="absolute inset-0 flex flex-col p-4">
        <CardHeader
          kicker="卡 4 · 抖音骑行热门视频"
          title="骑行热门视频"
          subtitle={
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="idle-ai-spark shrink-0" style={{ color: accent }} />
              AI 根据当前赛道推荐内容流
            </span>
          }
          right={
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ background: "#fe2c55" }}>
              <TrendingUp size={12} /> 热门
            </span>
          }
        />

        <button
          ref={cardRef}
          type="button"
          onClick={() => onOpenVideo(item)}
          className="pl-mid group mt-3 relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/30 text-left shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
        >
          <video
            key={item.id}
            className="absolute inset-0 h-full w-full object-cover opacity-78 transition duration-500 group-active:scale-[1.015]"
            poster={item.poster}
            src={item.video}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(254,44,85,0.24),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.1)_38%,rgba(0,0,0,0.82))]" />

          <div className="absolute left-3 right-3 top-3 z-10 flex items-center gap-1">
            {videos.map((video, idx) => {
              const selected = idx === active % videos.length;
              return (
                <span key={video.id} className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/22">
                  {selected && (
                    <span
                      ref={progressRef}
                      className="block h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #23f0ff, #fe2c55)" }}
                    />
                  )}
                </span>
              );
            })}
          </div>

          <div className="absolute left-3 top-6 hot-video-anim z-10 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white/84 backdrop-blur-md">
            <TrendingUp size={11} style={{ color: "#fe2c55" }} />
            {item.heat} · {item.views}播放
          </div>
          <div className="absolute right-3 top-6 hot-video-anim z-10 rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold text-white/78 backdrop-blur-md">
            {item.duration}
          </div>

          <div className="hot-video-anim absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-2.5">
            <span className="relative grid h-11 w-11 place-items-center rounded-full border border-white/18 bg-black/35 backdrop-blur-md">
              <Image src={item.avatar} alt={item.creator} fill sizes="44px" className="rounded-full object-cover p-0.5" />
              <span className="absolute -bottom-1 grid h-4 w-4 place-items-center rounded-full text-[12px] font-black text-white" style={{ background: "#fe2c55" }}>
                +
              </span>
            </span>
            <SocialPill icon={<Heart size={17} fill="currentColor" />} label={item.likes} />
            <SocialPill icon={<MessageCircle size={17} />} label={item.comments} />
            <SocialPill icon={<Bookmark size={16} />} label="收藏" />
            <SocialPill icon={<Send size={16} />} label="转发" />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="hot-video-anim inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-1 text-[10px] font-semibold text-white/78 backdrop-blur-md">
              <Play size={11} fill="currentColor" />
              {item.tag}
            </div>
            <h3 className="hot-video-anim mt-2 max-w-[78%] text-[22px] font-extrabold leading-tight text-white">
              {item.title}
            </h3>
            <div className="hot-video-anim mt-2 flex max-w-[78%] items-center gap-2">
              <span className="relative h-6 w-6 overflow-hidden rounded-full bg-white/10">
                <Image src={item.avatar} alt={item.creator} fill sizes="24px" className="object-cover" />
              </span>
              <span className="min-w-0 truncate text-[12px] font-semibold text-white/78">@{item.creator}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/56">
                <Eye size={10} />
                {item.routeHint}
              </span>
            </div>
            <p className="hot-video-anim mt-2 line-clamp-2 max-w-[82%] text-[12px] leading-relaxed text-white/66">
              {item.reason}
            </p>
          </div>
        </button>

        <div className="pl-mid mt-3 grid grid-cols-5 gap-1.5">
          {videos.map((video, idx) => {
            const selected = idx === active % videos.length;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setActive(idx)}
                className="group/minicard relative min-w-0 overflow-hidden rounded-xl border p-1 text-left transition active:scale-[0.98]"
                style={{
                  borderColor: selected ? `${accent}88` : "rgba(255,255,255,0.1)",
                  background: selected ? `${accent}18` : "rgba(255,255,255,0.045)",
                }}
              >
                <div className="relative h-[38px] overflow-hidden rounded-lg bg-white/5">
                  <Image src={video.poster} alt={video.title} fill sizes="72px" className="object-cover opacity-80 transition group-active/minicard:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/78 to-transparent" />
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[9px] font-bold text-white/86">
                    <Play size={9} fill="currentColor" />
                    {video.views}
                  </span>
                </div>
                <p className="mt-1 truncate text-[9.5px] font-semibold text-white/84">{video.title}</p>
              </button>
            );
          })}
        </div>

        <p className="pl-fg mt-3 text-center text-[10px] text-white/35">
          ← 滑动切换 · 卡 5 本周挑战榜
        </p>
      </div>
    </CardShell>
  );
}

function SocialPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/28 text-white backdrop-blur-md">
        {icon}
      </span>
      <span className="max-w-10 truncate text-[9px] font-bold leading-none text-white/82">{label}</span>
    </span>
  );
}
