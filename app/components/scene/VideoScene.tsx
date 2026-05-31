"use client";

import { useState } from "react";
import type { SceneProfile } from "../../lib/scene-profiles";

export type VideoScenePhase = "idle" | "scanning" | "deck";

export function VideoScene({
  profile,
  phase,
}: {
  profile: SceneProfile;
  phase: VideoScenePhase;
}) {
  const isMountain = profile.key === "mountain";
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);

  const showVideo = !!profile.videoUrl && failedVideoUrl !== profile.videoUrl;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* 抖音视频背景 */}
      {showVideo && (
        <video
          key={profile.videoUrl}
          src={profile.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setFailedVideoUrl(profile.videoUrl ?? null)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* scrim: 有视频时压暗以保证状态栏/文案/卡片可读; 无视频时作为渐变背景兜底 */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: showVideo
            ? "linear-gradient(180deg, rgba(0,0,0,.42), rgba(0,0,0,.12) 38%, rgba(0,0,0,.72))"
            : isMountain
              ? "linear-gradient(180deg, rgba(15,40,22,.92), rgba(15,20,15,.7) 46%, rgba(6,5,4,.98)), radial-gradient(circle at 34% 14%, rgba(255,138,42,.28), transparent 36%)"
              : "linear-gradient(180deg, rgba(6,26,42,.96), rgba(10,15,42,.74) 48%, rgba(5,5,10,.98)), radial-gradient(circle at 63% 12%, rgba(35,240,255,.32), transparent 36%)",
        }}
      />

      {/* 无视频时的程序化场景 (地形线 / 天际线 / 流动道路) 作为兜底氛围 */}
      {!showVideo && (
        <>
          <div className="absolute inset-0 opacity-55">
            <div className={isMountain ? "terrain-lines mountain-lines" : "terrain-lines city-lines"} />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[58%]">
            <div className={isMountain ? "mountain-ridge ridge-back" : "skyline skyline-back"} />
            <div className={isMountain ? "mountain-ridge ridge-front" : "skyline skyline-front"} />
          </div>
          <div className="absolute bottom-0 left-1/2 h-[420px] w-[240px] -translate-x-1/2 overflow-hidden rounded-t-[46%] bg-black/20">
            <div
              className="absolute inset-x-0 bottom-0 mx-auto h-[480px] w-[120px] origin-bottom"
              style={{
                transform: "perspective(360px) rotateX(58deg)",
                backgroundImage: isMountain
                  ? "linear-gradient(90deg, transparent 0 18%, rgba(255,138,42,.35) 18% 21%, transparent 21% 49%, rgba(255,255,255,.2) 49% 51%, transparent 51% 79%, rgba(255,138,42,.35) 79% 82%, transparent 82%), linear-gradient(0deg, rgba(255,255,255,.2) 0 2px, transparent 2px 48px)"
                  : "linear-gradient(90deg, transparent 0 18%, rgba(35,240,255,.4) 18% 21%, transparent 21% 49%, rgba(255,255,255,.35) 49% 51%, transparent 51% 79%, rgba(35,240,255,.4) 79% 82%, transparent 82%), linear-gradient(0deg, rgba(255,255,255,.25) 0 2px, transparent 2px 42px)",
                animation:
                  phase === "scanning"
                    ? "roadFlow .45s linear infinite"
                    : "roadFlow 1.1s linear infinite",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
