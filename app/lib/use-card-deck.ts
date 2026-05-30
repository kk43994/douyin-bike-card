import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

type UseCardDeckOpts = {
  total: number;
  enabled: boolean;
  threshold?: number;
};

const PARALLAX_LAYERS: Array<{ selector: string; ratio: number }> = [
  { selector: ".pl-bg", ratio: -25 },
  { selector: ".pl-mid", ratio: -50 },
  { selector: ".pl-fg", ratio: -100 },
];

export function useCardDeck({ total, enabled, threshold = 0.18 }: UseCardDeckOpts) {
  const [activeIdx, setActiveIdx] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startX: 0, dragging: false, offset: 0 });

  const jumpTo = useCallback(
    (i: number) => {
      setActiveIdx((prev) => {
        const next = Math.max(0, Math.min(total - 1, i));
        return next === prev ? prev : next;
      });
    },
    [total],
  );

  const step = useCallback(
    (dir: -1 | 1) => {
      setActiveIdx((idx) => Math.max(0, Math.min(total - 1, idx + dir)));
    },
    [total],
  );

  const applyParallax = useCallback(
    (idxCenter: number, dragOffsetPct: number, animate: boolean) => {
      const el = deckRef.current;
      if (!el) return;
      const cards = el.querySelectorAll<HTMLDivElement>(".deck-card");
      cards.forEach((card, idx) => {
        const offset = idx - idxCenter + dragOffsetPct;
        const cardTarget = {
          xPercent: offset * 100,
          scale: Math.abs(offset) < 0.5 ? 1 - Math.abs(offset) * 0.08 : 0.94,
          autoAlpha: Math.abs(offset) < 0.5 ? 1 - Math.abs(offset) * 0.4 : 0.55,
        };
        if (animate) {
          gsap.to(card, { ...cardTarget, duration: 0.55, ease: "power3.out", overwrite: true });
        } else {
          gsap.set(card, cardTarget);
        }
        for (const { selector, ratio } of PARALLAX_LAYERS) {
          const node = card.querySelector(selector);
          if (!node) continue;
          const layerTarget = { xPercent: offset * ratio };
          if (animate) {
            gsap.to(node, { ...layerTarget, duration: 0.55, ease: "power3.out", overwrite: true });
          } else {
            gsap.set(node, layerTarget);
          }
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    applyParallax(activeIdx, 0, true);
  }, [enabled, activeIdx, applyParallax]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, step]);

  useEffect(() => {
    if (!enabled || !deckRef.current) return;
    const el = deckRef.current;
    let lock = false;
    const handler = (e: WheelEvent) => {
      if (lock) return;
      const dx = e.deltaX;
      if (Math.abs(dx) < 24) return;
      lock = true;
      step(dx > 0 ? 1 : -1);
      window.setTimeout(() => {
        lock = false;
      }, 380);
    };
    el.addEventListener("wheel", handler, { passive: true });
    return () => el.removeEventListener("wheel", handler);
  }, [enabled, step]);

  useEffect(() => {
    if (!enabled || !deckRef.current) return;
    const el = deckRef.current;
    const onStart = (e: TouchEvent) => {
      dragState.current.startX = e.touches[0].clientX;
      dragState.current.dragging = true;
      dragState.current.offset = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.touches[0].clientX - dragState.current.startX;
      const dragPct = -dx / el.clientWidth;
      dragState.current.offset = dragPct;
      applyParallax(activeIdx, dragPct, false);
    };
    const onEnd = () => {
      if (!dragState.current.dragging) return;
      dragState.current.dragging = false;
      const offset = dragState.current.offset;
      dragState.current.offset = 0;
      if (offset > threshold) step(1);
      else if (offset < -threshold) step(-1);
      else applyParallax(activeIdx, 0, true);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [enabled, activeIdx, step, applyParallax, threshold]);

  return { activeIdx, jumpTo, step, deckRef };
}
