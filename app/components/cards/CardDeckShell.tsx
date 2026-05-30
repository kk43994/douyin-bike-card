import type { ReactNode, RefObject } from "react";

export function CardDeckShell({
  deckRef,
  activeCardIdx,
  totalCards,
  onJumpCard,
  children,
}: {
  deckRef: RefObject<HTMLDivElement | null>;
  activeCardIdx: number;
  totalCards: number;
  onJumpCard: (i: number) => void;
  children: ReactNode;
}) {
  return (
    <>
      <div
        ref={deckRef}
        className="absolute bottom-[78px] left-0 right-0 z-30 select-none"
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative mx-3 h-[60vh] min-h-[440px]">{children}</div>
      </div>
      <div className="pointer-events-auto absolute bottom-[62px] left-0 right-0 z-30 flex justify-center gap-1.5">
        {Array.from({ length: totalCards }).map((_, i) => {
          const active = i === activeCardIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onJumpCard(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: active ? 22 : 6,
                background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.32)",
              }}
              aria-label={`Card ${i + 1}`}
            />
          );
        })}
      </div>
    </>
  );
}
