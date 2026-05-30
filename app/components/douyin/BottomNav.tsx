import { Home, MessageCircle, Plus, User, Users } from "lucide-react";
import type { ReactNode } from "react";

export function DouyinBottomNav() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
      <div className="mx-3 mb-1 h-0.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-2/5 rounded-full bg-white/85" />
      </div>
      <div className="flex items-center justify-around bg-gradient-to-t from-black via-black/85 to-transparent px-2 pt-2 pb-3 text-[11px]">
        <NavItem icon={<Home size={20} fill="white" strokeWidth={1.5} />} label="首页" active />
        <NavItem icon={<Users size={20} strokeWidth={1.8} />} label="朋友" />
        <div className="relative -mt-1">
          <div className="grid h-7 w-11 place-items-center rounded-md bg-white">
            <Plus size={18} color="#000" strokeWidth={3} />
          </div>
          <div className="absolute inset-0 -z-10 rounded-md bg-[#fe2c55] translate-x-1 translate-y-0.5" />
          <div className="absolute inset-0 -z-10 rounded-md bg-[#25f4ee] -translate-x-1 -translate-y-0.5" />
        </div>
        <NavItem icon={<MessageCircle size={20} strokeWidth={1.8} />} label="消息" />
        <NavItem icon={<User size={20} strokeWidth={1.8} />} label="我" />
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${active ? "text-white" : "text-white/55"}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
