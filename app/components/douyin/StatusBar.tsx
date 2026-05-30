export function DouyinStatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-2 text-[11px] font-semibold tracking-wider text-white">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span className="text-[10px]">●●●●</span>
        <span className="text-[10px]">WiFi</span>
        <span className="rounded-sm border border-white/70 px-0.5 text-[9px]">88</span>
      </div>
    </div>
  );
}
