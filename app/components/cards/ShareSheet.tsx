"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, MessageCircle, Users, Link2, Music2, QrCode, Check } from "lucide-react";
import type { ShareSheetProps } from "./card-types";

const CHANNELS: { key: string; label: string; icon: typeof MessageCircle; color: string }[] = [
  { key: "微信好友", label: "微信好友", icon: MessageCircle, color: "#07c160" },
  { key: "朋友圈", label: "朋友圈", icon: Users, color: "#3a8ef0" },
  { key: "抖音", label: "抖音", icon: Music2, color: "#fe2c55" },
  { key: "复制链接", label: "复制链接", icon: Link2, color: "#9aa0aa" },
];

export function ShareSheet({
  accent,
  title,
  url,
  sourceLabel: customSourceLabel,
  helperText,
  onClose,
  onShare,
}: ShareSheetProps) {
  const [resolvedUrl, setResolvedUrl] = useState(() => (
    typeof window !== "undefined" ? window.location.origin : ""
  ));
  const [shareSource, setShareSource] = useState<"configured" | "lan" | "current" | "loading">("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const shareUrl = url || resolvedUrl;

  useEffect(() => {
    if (url) return;
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
    fetch("/api/demo-url")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configuredUrl?: string | null; lanUrl?: string | null; currentUrl?: string; shareUrl?: string } | null) => {
        const nextUrl = data?.shareUrl || data?.configuredUrl || data?.lanUrl || data?.currentUrl || currentUrl;
        if (nextUrl) setResolvedUrl(nextUrl);
        if (data?.configuredUrl) setShareSource("configured");
        else if (data?.lanUrl) setShareSource("lan");
        else setShareSource("current");
      })
      .catch(() => {
        if (currentUrl) setResolvedUrl(currentUrl);
        setShareSource("current");
      });
  }, [url]);

  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 192,
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

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      onShare("复制链接失败");
    }
  };

  const sourceLabel = customSourceLabel
    || (url
      ? "公网演示链接"
      : shareSource === "configured"
      ? "公网演示链接"
      : shareSource === "lan"
        ? "局域网扫码链接"
        : shareSource === "current"
          ? "当前浏览器链接"
          : "生成中");

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/55 backdrop-blur-sm"
    >
      <div
        className="w-full rounded-t-3xl border-t border-white/15 bg-[#0c0e14] p-5 pb-7"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-white">分享演示卡片</p>
            <p className="mt-0.5 max-w-[240px] truncate text-[12px] text-white/50">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/45">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="grid h-[108px] w-[108px] shrink-0 place-items-center rounded-2xl bg-white p-2">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- QRCode returns a local data URL; next/image cannot optimize it.
              <img src={qrDataUrl} alt="扫码打开演示" className="h-full w-full" />
            ) : (
              <QrCode size={44} className="text-[#071019]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">观众扫码直接看</p>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{ background: `${accent}18`, color: accent }}
              >
                {sourceLabel}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 break-all text-[11px] leading-relaxed text-white/48">
              {shareUrl || "正在生成演示链接"}
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              {helperText || (shareSource === "configured" ? "适合现场投屏/异网访问" : "手机和电脑需在同一 Wi-Fi / 热点")}
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/78 transition hover:bg-white/10"
              style={copied ? { color: accent, borderColor: `${accent}66`, background: `${accent}18` } : undefined}
            >
              {copied ? <Check size={13} /> : <Link2 size={13} />}
              {copied ? "已复制" : "复制链接"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => (c.key === "复制链接" ? copyLink() : onShare(c.key))}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-full"
                  style={{ background: `${c.color}22`, color: c.color }}
                >
                  <Icon size={22} />
                </span>
                <span className="text-[11px] text-white/70">{c.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-white/12 py-3 text-[14px] font-medium text-white/70"
          style={{ borderColor: `${accent}33` }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
