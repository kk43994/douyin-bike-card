import { ChevronLeft, Search } from "lucide-react";

export function DouyinTopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-7 z-40 flex items-center justify-between px-4 py-3">
      <ChevronLeft size={20} className="opacity-90" />
      <div className="flex items-center gap-5 text-sm font-semibold">
        <span className="text-white/55">直播</span>
        <span className="text-white/55">关注</span>
        <span className="relative text-white">
          推荐
          <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-white" />
        </span>
      </div>
      <Search size={18} className="opacity-90" />
    </div>
  );
}
