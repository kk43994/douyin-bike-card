export function ToastBar({ text, accent }: { text: string; accent: string }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[120px] z-[60] -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-[12px] font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <span
        className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
      />
      {text}
    </div>
  );
}
