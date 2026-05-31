"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Trophy, Crown, ChevronUp, ChevronDown, Flag } from "lucide-react";
import { CardShell } from "../atoms/CardShell";
import { CardHeader } from "../atoms/CardHeader";
import { ControlChip } from "../atoms/ControlChip";
import {
  RANK_METRICS,
  type RankMetric,
  formatMetric,
  metricValue,
} from "../../lib/leaderboard-mock";
import type { ChallengeCardProps } from "./card-types";

const PODIUM_COLORS = ["#ffd34d", "#cfd6e4", "#e8964f"]; // 金 银 铜

export function ChallengeCard({ profile, entries, onChallenge }: ChallengeCardProps) {
  const accent = profile.accent;
  const [metric, setMetric] = useState<RankMetric>(
    profile.key === "mountain" ? "climb" : "distance",
  );
  const unit = RANK_METRICS.find((m) => m.key === metric)?.unit ?? "";

  const ranked = useMemo(
    () => [...entries].sort((a, b) => metricValue(b, metric) - metricValue(a, metric)),
    [entries, metric],
  );

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const meRank = ranked.findIndex((e) => e.isMe);
  const me = meRank >= 0 ? ranked[meRank] : null;
  const podiumOrder = [top3[1], top3[0], top3[2]]; // 银-金-铜 居中

  return (
    <CardShell accent={accent} poster="/posters/poster-c4.jpg">
      <div className="absolute inset-0 flex flex-col p-4">
        {/* header */}
        <CardHeader
          title="骑行挑战榜"
          subtitle={`「${profile.label}」赛道 · 本周排名`}
          right={
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: `${accent}22`, color: accent }}
            >
              <Trophy size={12} /> 剩 3天14h
            </span>
          }
        />

        {/* metric tabs */}
        <div className="pl-mid mt-3 flex gap-1.5">
          {RANK_METRICS.map((m) => (
            <ControlChip
              key={m.key}
              label={m.label}
              accent={accent}
              active={metric === m.key}
              onClick={() => setMetric(m.key)}
            />
          ))}
        </div>

        {/* podium */}
        <div className="pl-mid mt-5 grid grid-cols-3 items-end gap-2">
          {podiumOrder.map((e, i) => {
            if (!e) return <div key={i} />;
            const place = e === top3[0] ? 0 : e === top3[1] ? 1 : 2;
            const isFirst = place === 0;
            return (
              <div
                key={e.id}
                className="flex flex-col items-center rounded-2xl border px-1.5 pb-2 pt-2.5"
                style={{
                  borderColor: e.isMe ? accent : "rgba(255,255,255,0.1)",
                  background: e.isMe ? `${accent}14` : "rgba(255,255,255,0.04)",
                  transform: isFirst ? "translateY(-6px)" : "none",
                }}
              >
                <div className="relative">
                  {isFirst && (
                    <Crown
                      size={16}
                      className="absolute -top-4 left-1/2 -translate-x-1/2"
                      style={{ color: PODIUM_COLORS[0] }}
                    />
                  )}
                  <div
                    className="relative overflow-hidden rounded-full bg-white/10"
                    style={{
                      height: isFirst ? 48 : 40,
                      width: isFirst ? 48 : 40,
                      boxShadow: `0 0 0 2px ${PODIUM_COLORS[place]}`,
                    }}
                  >
                    <Image
                      src={e.avatar}
                      alt={e.name}
                      fill
                      sizes={isFirst ? "48px" : "40px"}
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/25" />
                  </div>
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[9px] font-bold text-black"
                    style={{ background: PODIUM_COLORS[place] }}
                  >
                    {place + 1}
                  </span>
                </div>
                <p className="mt-2 max-w-full truncate text-[11px] font-medium text-white/85">
                  {e.name}
                </p>
                <p className="text-[12px] font-bold" style={{ color: accent }}>
                  {formatMetric(metricValue(e, metric), metric)}
                  <span className="ml-0.5 text-[9px] font-normal text-white/45">{unit}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* rest list */}
        <div className="pl-mid mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {rest.map((e, idx) => {
            const rank = idx + 4;
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border px-3 py-2"
                style={{
                  borderColor: e.isMe ? accent : "rgba(255,255,255,0.08)",
                  background: e.isMe ? `${accent}16` : "rgba(255,255,255,0.03)",
                }}
              >
                <span className="w-5 text-center text-[13px] font-bold text-white/55">{rank}</span>
                <span className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                  <Image src={e.avatar} alt={e.name} fill sizes="32px" className="object-cover" />
                </span>
                <span className="flex-1 truncate text-[13px] text-white/85">
                  {e.name}
                  {e.isMe && (
                    <span
                      className="ml-1.5 rounded px-1 py-px text-[9px] font-bold text-black"
                      style={{ background: accent }}
                    >
                      我
                    </span>
                  )}
                </span>
                <DeltaTag delta={e.delta} />
                <span className="w-[58px] text-right text-[13px] font-bold" style={{ color: accent }}>
                  {formatMetric(metricValue(e, metric), metric)}
                  <span className="ml-0.5 text-[9px] font-normal text-white/40">{unit}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* my rank + challenge CTA */}
        <div
          className="pl-mid mt-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5"
          style={{ borderColor: `${accent}55`, background: `${accent}10` }}
        >
          <div className="flex flex-1 items-center gap-2">
            <Trophy size={16} style={{ color: accent }} />
            <p className="text-[12px] text-white/80">
              {me ? (
                <>
                  我的排名 <span className="font-bold text-white">第 {meRank + 1} 名</span> ·{" "}
                  {formatMetric(metricValue(me, metric), metric)}
                  {unit}
                </>
              ) : (
                "本周还没上榜, 出发刷点数据"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onChallenge}
            className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-bold text-black transition active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 18px ${accent}55` }}
          >
            <Flag size={13} /> 发起挑战
          </button>
        </div>
      </div>
    </CardShell>
  );
}

function DeltaTag({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-[10px] text-white/35">—</span>;
  }
  const up = delta > 0;
  const color = up ? "#4ade80" : "#f87171";
  const Icon = up ? ChevronUp : ChevronDown;
  return (
    <span className="flex items-center text-[10px] font-medium" style={{ color }}>
      <Icon size={12} />
      {Math.abs(delta)}
    </span>
  );
}
