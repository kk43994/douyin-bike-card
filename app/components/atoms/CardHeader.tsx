import type { ReactNode } from "react";

/**
 * 统一卡片头部: kicker 小标签 + 标题(可带 AI 徽标) + 副标题 + 右侧操作区。
 * 4 张卡共用, 统一字号/间距/颜色, 便于设计走查对齐。
 */
export function CardHeader({
  kicker,
  title,
  titleBadge,
  subtitle,
  right,
}: {
  /** 开发用卡片编号, 不传则不展示 (交付页面无需对用户暴露) */
  kicker?: string;
  title: ReactNode;
  titleBadge?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="pl-mid flex items-start justify-between gap-2" style={{ willChange: "transform" }}>
      <div className="min-w-0">
        {kicker && <p className="ui-kicker uppercase">{kicker}</p>}
        <div className="flex items-center gap-2">
          <h3 className="ui-title truncate text-white">{title}</h3>
          {titleBadge}
        </div>
        {subtitle && <div className="ui-subtle mt-0.5">{subtitle}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
    </div>
  );
}
