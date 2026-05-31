"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBag, Star, Store, Flame, Sparkles, ChevronRight } from "lucide-react";
import { CardShell } from "../atoms/CardShell";
import { CardHeader } from "../atoms/CardHeader";
import { ControlChip } from "../atoms/ControlChip";
import {
  SHOP_CATEGORIES,
  type ShopCategory,
  discountText,
} from "../../lib/shop-mock";
import type { GearShopCardProps } from "./card-types";

/** 抖音小店标志色 (橙红) — 价格/按钮/优惠券统一用它, 做出抖店原生质感 */
const DY = "#FE2C55";

export function GearShopCard({
  profile,
  products,
  onBuy,
}: GearShopCardProps) {
  const accent = profile.accent;
  const [cat, setCat] = useState<ShopCategory | "all">("all");

  const list = useMemo(
    () => (cat === "all" ? products : products.filter((p) => p.category === cat)),
    [products, cat],
  );
  const [heroIdx, setHeroIdx] = useState(0);
  const heroRef = useRef<HTMLButtonElement>(null);
  const heroItems = list.length > 0 ? list : products;
  const hero = heroItems[heroIdx % Math.max(1, heroItems.length)];
  const heroKey = heroItems.map((item) => item.id).join("|");

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroIdx((idx) => (idx + 1) % heroItems.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [heroItems.length, heroKey]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0.72, y: 8, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: "power2.out" },
    );
  }, [hero?.id]);

  return (
    <CardShell accent={accent} poster="/posters/poster-c3.jpg">
      <div className="absolute inset-0 flex flex-col p-4">
        {/* header */}
        <CardHeader
          title="骑行装备优选"
          subtitle={
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="idle-ai-spark shrink-0" style={{ color: accent }} />
              AI 为「{profile.label}」赛道智能选品
            </span>
          }
          right={
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
              style={{ background: DY }}
            >
              <ShoppingBag size={12} /> 抖音小店
            </span>
          }
        />

        {/* 优选统计条 */}
        <div className="pl-mid mt-2 flex items-center gap-1.5 text-[11px] text-white/55">
          <span style={{ color: accent }} className="font-semibold">为你优选 {products.length} 件</span>
          <span className="inline-block h-2 w-px bg-white/15" />
          <span>正品保障 · 7天无理由 · 全场包邮</span>
        </div>

        {/* category chips */}
        <div className="pl-mid mt-3 flex flex-wrap gap-1.5">
          {SHOP_CATEGORIES.map((c) => (
            <ControlChip
              key={c.key}
              label={c.label}
              accent={accent}
              active={cat === c.key}
              onClick={() => {
                setCat(c.key);
                setHeroIdx(0);
              }}
            />
          ))}
        </div>

        {hero && (
          <button
            ref={heroRef}
            type="button"
            onClick={() => onBuy(hero)}
            className="pl-mid mt-3 relative h-[96px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <div
              className="absolute inset-y-0 right-0 w-[42%]"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(12,14,20,0), rgba(12,14,20,0.12)), url(${hero.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/82 to-transparent" />
            <div className="relative flex h-full max-w-[70%] flex-col justify-center px-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: DY }}>
                <Flame size={11} />
                抖店热卖轮播
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-white">
                {hero.title}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[18px] font-extrabold leading-none" style={{ color: DY }}>
                  ¥{hero.price}
                </span>
                {hero.coupon && (
                  <span className="rounded px-1.5 py-px text-[9px] font-bold" style={{ color: DY, boxShadow: `inset 0 0 0 1px ${DY}88` }}>
                    券¥{hero.coupon}
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white/58">
                  去看 <ChevronRight size={11} />
                </span>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
              {heroItems.slice(0, 5).map((item, idx) => (
                <span
                  key={item.id}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: idx === heroIdx % heroItems.length ? 14 : 4,
                    background: idx === heroIdx % heroItems.length ? DY : "rgba(255,255,255,0.32)",
                  }}
                />
              ))}
            </div>
          </button>
        )}

        {/* product list */}
        <div
          className="pl-mid mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-1 pr-1"
          style={{
            maskImage: "linear-gradient(180deg, transparent 0, #000 10px, #000 calc(100% - 10px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, transparent 0, #000 10px, #000 calc(100% - 10px), transparent 100%)",
          }}
        >
          {list.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-[12px] text-white/40">
              该分类暂无好物
            </div>
          ) : (
            list.map((p, idx) => {
              const disc = discountText(p.price, p.originalPrice);
              const topRank = cat === "all" && idx < 3;
              return (
                <div
                  key={p.id}
                  className="relative flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 transition active:scale-[0.995]"
                >
                  {/* 真实商品图 */}
                  <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${p.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    {/* 热销榜角标 (抖店爆款) */}
                    {topRank && (
                      <span
                        className="absolute left-0 top-0 flex items-center gap-0.5 rounded-br-lg px-1.5 py-0.5 text-[9px] font-bold text-white"
                        style={{ background: DY }}
                      >
                        <Flame size={9} /> 爆款 TOP{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* info */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    {/* 标题 (标签内联) */}
                    <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-white/92">
                      {p.tag && (
                        <span
                          className="mr-1 rounded px-1 py-px align-[1px] text-[9px] font-bold text-white"
                          style={{ background: DY }}
                        >
                          {p.tag}
                        </span>
                      )}
                      {p.title}
                    </p>

                    {/* 店铺 + 蓝标 + 评分 + 销量 */}
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                      <Store size={10} style={{ color: "#3b9eff" }} />
                      <span className="max-w-[92px] truncate">{p.shop}</span>
                      <span className="mx-0.5 inline-block h-2 w-px bg-white/15" />
                      <Star size={10} style={{ color: "#fbbf24" }} />
                      <span className="text-white/60">{p.rating.toFixed(1)}</span>
                      <span>· 已售{p.soldText}</span>
                    </div>

                    {/* 优惠券 + 服务标 */}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {p.coupon && (
                        <span
                          className="rounded px-1.5 py-px text-[9px] font-bold"
                          style={{ color: DY, boxShadow: `inset 0 0 0 1px ${DY}99` }}
                        >
                          券¥{p.coupon}
                        </span>
                      )}
                      <ServiceTag>包邮</ServiceTag>
                      <ServiceTag>极速退</ServiceTag>
                    </div>

                    {/* 价格 + 抢购 */}
                    <div className="mt-auto flex items-end justify-between pt-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[11px] font-bold" style={{ color: DY }}>¥</span>
                        <span className="text-[21px] font-extrabold leading-none" style={{ color: DY }}>
                          {p.price}
                        </span>
                        <span className="text-[10px] text-white/30 line-through">¥{p.originalPrice}</span>
                        {disc && (
                          <span className="rounded px-1 py-px text-[9px] font-bold text-white" style={{ background: DY }}>
                            {disc}折
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onBuy(p)}
                        className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white transition active:scale-[0.96]"
                        style={{ background: `linear-gradient(135deg, #ff5e3a, ${DY})`, boxShadow: `0 4px 12px ${DY}55` }}
                      >
                        抢购
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </CardShell>
  );
}

function ServiceTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/8 px-1.5 py-px text-[9px] font-medium text-white/55">
      {children}
    </span>
  );
}
