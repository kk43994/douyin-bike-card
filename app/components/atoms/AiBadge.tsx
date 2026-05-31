import { Sparkles } from "lucide-react";

/** 统一的 AI 徽标: 半透明胶囊 + 闪烁火花。全站复用, 保证 AI 视觉语言一致。 */
export function AiBadge({
  label = "AI",
  accent,
  className = "",
}: {
  label?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${className}`}
      style={
        accent
          ? { background: `${accent}26`, color: accent }
          : { background: "rgba(255,255,255,0.15)", color: "#fff" }
      }
    >
      <Sparkles size={10} className="idle-ai-spark" />
      {label}
    </span>
  );
}
