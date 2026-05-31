"use client";

import QRCode from "qrcode";
import { ExternalLink, QrCode, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SceneProfile } from "../../lib/scene-profiles";

const FALLBACK_DEMO_URL = "https://hks.kk666.best";

export function AudienceQrPanel({ profile }: { profile: SceneProfile }) {
  const shareUrl = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_DEMO_URL?.trim();
    return configured || FALLBACK_DEMO_URL;
  }, []);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#071019", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  return (
    <aside
      className="pointer-events-auto fixed right-[max(28px,calc((100vw-440px)/2-276px))] top-1/2 z-[55] hidden w-[236px] -translate-y-1/2 rounded-[22px] border border-white/12 bg-black/42 p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.48)] backdrop-blur-xl lg:block"
      aria-label="观众扫码体验"
    >
      <div className="flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-xl"
          style={{ background: `${profile.accent}20`, color: profile.accent }}
        >
          <Smartphone size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold">手机扫码体验</p>
          <p className="text-[10px] font-medium text-white/42">微信扫一扫直接进入</p>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-white p-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="grid aspect-square place-items-center rounded-xl bg-white">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- QRCode returns a local data URL; next/image cannot optimize it.
            <img src={qrDataUrl} alt="扫码打开 RideSnap 演示" className="h-full w-full" />
          ) : (
            <QrCode size={58} className="text-[#071019]" />
          )}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/42">
          <ExternalLink size={11} style={{ color: profile.accent }} />
          Live URL
        </p>
        <p className="mt-1 break-all text-[12px] font-semibold leading-relaxed text-white/76">
          {shareUrl}
        </p>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-white/42">
        大屏保留抖音视频面板，观众用手机进入同一个交互 Demo。
      </p>
    </aside>
  );
}
