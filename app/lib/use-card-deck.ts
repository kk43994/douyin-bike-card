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

const SWIPE_INTENT_PX = 14;
const HORIZONTAL_BIAS = 1.18;
const MAX_DRAG_PCT = 0.42;
const EDGE_RESISTANCE = 0.32;

type DragAxis = "x" | "y" | null;

export function useCardDeck({ total, enabled, threshold = 0.18 }: UseCardDeckOpts) {
  const [activeIdx, setActiveIdx] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    startX: 0,
    startY: 0,
    axis: null as DragAxis,
    tracking: false,
    ignored: false,
    offset: 0,
  });

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
        const hasAmap = Boolean(card.querySelector(".amap-card-host"));
        const cardTarget = hasAmap
          ? {
              xPercent: offset * 100,
              scale: 1,
              autoAlpha: Math.abs(offset) < 0.5 ? 1 - Math.abs(offset) * 0.4 : 0.55,
            }
          : {
              xPercent: offset * 100,
              scale: Math.abs(offset) < 0.5 ? 1 - Math.abs(offset) * 0.08 : 0.94,
              autoAlpha: Math.abs(offset) < 0.5 ? 1 - Math.abs(offset) * 0.4 : 0.55,
            };
        if (animate) {
          gsap.to(card, { ...cardTarget, duration: 0.55, ease: "power3.out", overwrite: true });
        } else {
          gsap.set(card, cardTarget);
        }
        const interactive = Math.abs(offset) < 0.5;
        card.style.pointerEvents = interactive ? "auto" : "none";
        card.setAttribute("aria-hidden", interactive ? "false" : "true");
        for (const { selector, ratio } of PARALLAX_LAYERS) {
          const node = card.querySelector(selector);
          if (!node) continue;
          if (node.querySelector(".amap-card-host")) continue;
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
      const touch = e.touches[0];
      dragState.current.startX = touch.clientX;
      dragState.current.startY = touch.clientY;
      dragState.current.axis = null;
      dragState.current.tracking = true;
      dragState.current.ignored = shouldIgnoreDeckSwipe(e.target);
      dragState.current.offset = 0;
    };
    const onMove = (e: TouchEvent) => {
      const state = dragState.current;
      if (!state.tracking || state.ignored) return;
      const touch = e.touches[0];
      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!state.axis) {
        if (Math.max(absX, absY) < SWIPE_INTENT_PX) return;
        if (absY >= absX * HORIZONTAL_BIAS) {
          state.axis = "y";
          return;
        }
        if (absX < absY * HORIZONTAL_BIAS) return;
        state.axis = "x";
      }

      if (state.axis !== "x") return;
      e.preventDefault();

      let dragPct = clampNumber(-dx / el.clientWidth, -MAX_DRAG_PCT, MAX_DRAG_PCT);
      if ((activeIdx === 0 && dragPct < 0) || (activeIdx === total - 1 && dragPct > 0)) {
        dragPct *= EDGE_RESISTANCE;
      }
      dragState.current.offset = dragPct;
      applyParallax(activeIdx, dragPct, false);
    };
    const onEnd = () => {
      const state = dragState.current;
      if (!state.tracking) return;
      const offset = state.offset;
      const wasHorizontalDrag = state.axis === "x";
      dragState.current.tracking = false;
      dragState.current.axis = null;
      dragState.current.ignored = false;
      dragState.current.offset = 0;
      if (!wasHorizontalDrag) return;
      if (offset > threshold) step(1);
      else if (offset < -threshold) step(-1);
      else applyParallax(activeIdx, 0, true);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, activeIdx, total, step, applyParallax, threshold]);

  return { activeIdx, jumpTo, step, deckRef };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function shouldIgnoreDeckSwipe(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      [
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "[contenteditable='true']",
        ".amap-card-host",
        "[data-deck-swipe-ignore]",
      ].join(","),
    ),
  );
}
