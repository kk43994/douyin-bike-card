"use client";

import {
  Bookmark,
  ChevronLeft,
  Heart,
  Home,
  MapPinned,
  MessageCircle,
  Mountain,
  Music2,
  Plus,
  RadioTower,
  RefreshCw,
  Route,
  Search,
  Send,
  Share2,
  ShieldAlert,
  Timer,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ConfigProvider, Progress, theme } from "antd";
import gsap from "gsap";

type SceneKey = "mountain" | "city";
type Stage = "idle" | "scanning" | "result" | "share";

type SceneProfile = {
  key: SceneKey;
  label: string;
  short: string;
  author: string;
  authorTag: string;
  videoTitle: string;
  videoDesc: string;
  music: string;
  likes: string;
  comments: string;
  collects: string;
  shares: string;
  liveTag: string;
  headline: string;
  subtitle: string;
  recommendedBike: string;
  routeName: string;
  challenge: string;
  distance: string;
  duration: string;
  intensity: number;
  carbon: string;
  accent: string;
  accentSoft: string;
  terrain: string;
  mapLabel: string;
  strategy: string[];
  gear: string[];
  risks: string[];
  aiSummary: string;
  shareText: string;
};

const sceneProfiles: Record<SceneKey, SceneProfile> = {
  mountain: {
    key: "mountain",
    label: "山地环境",
    short: "MTB",
    author: "@林道老王",
    authorTag: "粉丝 38.2w",
    videoTitle: "森林越野骑行 · 松林爬坡线",
    videoDesc:
      "刚解锁松林爬坡线，氧气和肾上腺素一起冲顶 #山地车 #越野骑行 #林道",
    music: "Trail Burst - Hex Lab",
    likes: "18.6w",
    comments: "2.1w",
    collects: "9621",
    shares: "1.2w",
    liveTag: "附近识别到森林公园 / 爬坡路段",
    headline: "山地自行车攻略推荐",
    subtitle: "系统判断当前更适合越野、爬坡和下坡控车",
    recommendedBike: "硬尾山地车 / 全避震山地车",
    routeName: "松林碎石爬坡线",
    challenge: "爬升 320m",
    distance: "6.4 km",
    duration: "42 min",
    intensity: 78,
    carbon: "低碳值 +1.1kg",
    accent: "#ff8a2a",
    accentSoft: "rgba(255, 138, 42, 0.22)",
    terrain: "等高线 / 碎石 / 林道",
    mapLabel: "湿滑弯道 3 处",
    strategy: ["低档稳踏频爬坡", "下坡前提前刹车", "碎石路段重心后移"],
    gear: ["头盔", "全指手套", "护膝", "宽齿胎"],
    risks: ["急弯", "湿滑", "落石"],
    aiSummary:
      "定位像山地林道，优先用山地车。建议把胎压略放低，爬坡保持低档位，下坡进弯前完成制动。",
    shareText: "我附近被识别为山地骑行赛道，RideSnap 推荐山地车 + 护具 + 爬坡策略。",
  },
  city: {
    key: "city",
    label: "城市道路",
    short: "ROAD",
    author: "@城南夜骑社",
    authorTag: "粉丝 24.7w",
    videoTitle: "城市夜骑公路车攻略 · 滨江霓虹巡航线",
    videoDesc: "今晚滨江全线绿灯，11 公里巡航直接拉满 #公路车 #城市夜骑 #通勤",
    music: "Neon Cruise - Vapor.fm",
    likes: "12.3w",
    comments: "8643",
    collects: "1.5w",
    shares: "9821",
    liveTag: "附近识别到城市主路 / 滨江绿道",
    headline: "公路自行车攻略推荐",
    subtitle: "系统判断当前更适合巡航、通勤和城市安全骑行",
    recommendedBike: "公路车 / 平把公路车 / 通勤车",
    routeName: "滨江霓虹巡航线",
    challenge: "巡航 12km",
    distance: "12.0 km",
    duration: "45 min",
    intensity: 62,
    carbon: "低碳值 +2.4kg",
    accent: "#23f0ff",
    accentSoft: "rgba(35, 240, 255, 0.22)",
    terrain: "车道线 / 绿道 / 城市路口",
    mapLabel: "红绿灯较少",
    strategy: ["保持 85-95 踏频", "避开机动车盲区", "优先选择绿道和慢行道"],
    gear: ["前后车灯", "反光条", "水壶", "码表"],
    risks: ["车流", "路口", "行人"],
    aiSummary:
      "定位像城市道路和滨江绿道，优先用公路车或平把公路车。建议规划红绿灯少的路线，夜骑必须打开前后车灯。",
    shareText: "我解锁了城市公路骑行攻略，RideSnap 推荐巡航路线 + 车灯安全策略。",
  },
};

const scanSteps = ["GPS 锁定", "地形分析", "道路类型识别", "车型策略生成"];

export default function RideSnapDemo() {
  const [scene, setScene] = useState<SceneKey>("mountain");
  const [stage, setStage] = useState<Stage>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [assistantNote, setAssistantNote] = useState(
    "点击开始识别，我会根据定位场景生成骑行攻略卡。",
  );

  const appRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement[]>([]);
  const progressTween = useRef<gsap.core.Tween | null>(null);

  const profile = sceneProfiles[scene];

  useEffect(() => {
    if (!appRef.current) return;
    gsap.fromTo(
      appRef.current.querySelectorAll(".intro-pop"),
      { y: 24, autoAlpha: 0, filter: "blur(10px)" },
      {
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.06,
      },
    );
  }, []);

  useEffect(() => {
    gsap.to(wheelRef.current, {
      rotate: "+=360",
      duration: stage === "scanning" ? 0.45 : 1.15,
      ease: "none",
      repeat: -1,
      overwrite: true,
    });
  }, [stage]);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 22, scale: 0.96, rotateX: 12, autoAlpha: 0.72 },
      { y: 0, scale: 1, rotateX: 0, autoAlpha: 1, duration: 0.58, ease: "back.out(1.7)" },
    );
  }, [scene, stage]);

  const runScan = useCallback(
    (nextScene = scene) => {
      progressTween.current?.kill();
      setScene(nextScene);
      setStage("scanning");
      setScanProgress(0);
      setAssistantNote("正在读取定位、道路类型和地形特征...");

      requestAnimationFrame(() => {
        if (scannerRef.current) {
          const rings = scannerRef.current.querySelectorAll(".scan-ring");
          gsap.fromTo(
            rings,
            { scale: 0.25, autoAlpha: 0.9 },
            {
              scale: 1.75,
              autoAlpha: 0,
              duration: 1.35,
              ease: "power2.out",
              stagger: 0.18,
              repeat: 2,
            },
          );
        }
        if (mapRef.current) {
          gsap.fromTo(
            mapRef.current.querySelectorAll(".route-node"),
            { scale: 0.2, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.35, stagger: 0.08, ease: "back.out(2)" },
          );
          gsap.fromTo(
            mapRef.current.querySelector(".route-line"),
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 1.1, ease: "power3.inOut" },
          );
        }
      });

      const progress = { value: 0 };
      progressTween.current = gsap.to(progress, {
        value: 100,
        duration: 2.35,
        ease: "power2.inOut",
        onUpdate: () => setScanProgress(Math.round(progress.value)),
        onComplete: () => {
          setStage("result");
          setAssistantNote(sceneProfiles[nextScene].aiSummary);
        },
      });
    },
    [scene],
  );

  const switchScene = useCallback(
    (nextScene: SceneKey) => {
      if (nextScene === scene && stage !== "idle") {
        runScan(nextScene);
        return;
      }
      if (cardRef.current && stage !== "idle") {
        gsap.to(cardRef.current, {
          rotateY: 12,
          scale: 0.92,
          autoAlpha: 0.78,
          duration: 0.18,
          ease: "power2.in",
          onComplete: () => runScan(nextScene),
        });
        return;
      }
      setScene(nextScene);
    },
    [runScan, scene, stage],
  );

  const showShare = () => {
    setStage("share");
    setAssistantNote(profile.shareText);
    requestAnimationFrame(() => {
      if (!shareRef.current) return;
      gsap.fromTo(
        shareRef.current,
        { scale: 0.82, rotate: -2.5, autoAlpha: 0 },
        { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.65, ease: "elastic.out(1, 0.72)" },
      );
      gsap.fromTo(
        ".flash-layer",
        { autoAlpha: 0.9 },
        { autoAlpha: 0, duration: 0.48, ease: "power2.out" },
      );
    });
  };

  const resetDemo = () => {
    progressTween.current?.kill();
    setStage("idle");
    setScanProgress(0);
    setAssistantNote("点击开始识别，我会根据定位场景生成骑行攻略卡。");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: profile.accent,
          borderRadius: 10,
          fontFamily:
            '"PingFang SC", "HarmonyOS Sans SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
        },
      }}
    >
      <main
        ref={appRef}
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white"
      >
        <SceneAmbience profile={profile} />
        <DemoControls scene={scene} onSwitch={switchScene} onReset={resetDemo} />

        <div
          className="relative h-screen w-full max-w-[440px] overflow-hidden bg-black"
          style={{
            boxShadow:
              "0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
        >
          <VideoScene profile={profile} stage={stage} />

          <DouyinStatusBar />
          <DouyinTopBar />
          <DouyinSideActions profile={profile} />
          <DouyinCaption profile={profile} />
          <DouyinBottomNav />

          <RideCard
            profile={profile}
            stage={stage}
            scanProgress={scanProgress}
            assistantNote={assistantNote}
            cardRef={cardRef}
            scannerRef={scannerRef}
            mapRef={mapRef}
            shareRef={shareRef}
            wheelRef={wheelRef}
            onScan={() => runScan(scene)}
            onSwitch={() => switchScene(scene === "mountain" ? "city" : "mountain")}
            onShare={showShare}
            onReset={resetDemo}
          />

          <div className="flash-layer pointer-events-none absolute inset-0 z-50 bg-white opacity-0" />
        </div>
      </main>
    </ConfigProvider>
  );
}

function SceneAmbience({ profile }: { profile: SceneProfile }) {
  const isMountain = profile.key === "mountain";
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 transition-all duration-700"
      style={{
        background: isMountain
          ? "radial-gradient(circle at 18% 30%, rgba(255,138,42,0.18), transparent 36rem), radial-gradient(circle at 82% 70%, rgba(38,82,46,0.32), transparent 38rem), #050505"
          : "radial-gradient(circle at 15% 25%, rgba(35,240,255,0.18), transparent 36rem), radial-gradient(circle at 85% 75%, rgba(132,52,255,0.22), transparent 38rem), #04060c",
      }}
    />
  );
}

function DemoControls({
  scene,
  onSwitch,
  onReset,
}: {
  scene: SceneKey;
  onSwitch: (s: SceneKey) => void;
  onReset: () => void;
}) {
  return (
    <div
      className="pointer-events-auto flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 px-1.5 py-1 shadow-[0_6px_24px_rgba(0,0,0,0.5)]"
      style={{
        position: "fixed",
        left: "50%",
        top: 10,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <ControlChip
        active={scene === "mountain"}
        accent="#ff8a2a"
        icon={<Mountain size={13} />}
        label="山地"
        onClick={() => onSwitch("mountain")}
      />
      <ControlChip
        active={scene === "city"}
        accent="#23f0ff"
        icon={<Route size={13} />}
        label="城市"
        onClick={() => onSwitch("city")}
      />
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
      >
        <RefreshCw size={12} />
        重置
      </button>
    </div>
  );
}

function ControlChip({
  active,
  accent,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  accent: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition"
      style={
        active
          ? {
              background: `${accent}26`,
              color: accent,
              boxShadow: `0 0 0 1px ${accent}55, 0 0 18px ${accent}33`,
            }
          : { color: "rgba(255,255,255,0.72)" }
      }
    >
      {icon}
      {label}
    </button>
  );
}

function DouyinStatusBar() {
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

function DouyinTopBar() {
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

function DouyinSideActions({ profile }: { profile: SceneProfile }) {
  return (
    <div className="absolute right-2 bottom-[290px] z-20 flex flex-col items-center gap-3.5 text-white">
      <div className="relative">
        <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-zinc-700 to-zinc-900">
          <User size={20} />
        </div>
        <div className="absolute -bottom-1.5 left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-[#fe2c55] text-white">
          <Plus size={11} strokeWidth={3} />
        </div>
      </div>
      <SideStat icon={<Heart size={30} fill="white" strokeWidth={1.4} />} label={profile.likes} />
      <SideStat icon={<MessageCircle size={30} strokeWidth={1.8} />} label={profile.comments} />
      <SideStat
        icon={<Bookmark size={28} fill="#facc15" stroke="#facc15" strokeWidth={1.6} />}
        label={profile.collects}
      />
      <SideStat icon={<Share2 size={28} strokeWidth={1.8} />} label={profile.shares} />
      <MusicDisc profile={profile} />
    </div>
  );
}

function SideStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MusicDisc({ profile }: { profile: SceneProfile }) {
  return (
    <div
      className="mt-1 grid h-10 w-10 animate-[wheelSpin_5s_linear_infinite] place-items-center rounded-full"
      style={{
        background:
          "conic-gradient(from 0deg, #1a1a1a, #3a3a3a, #1a1a1a, #3a3a3a, #1a1a1a)",
        boxShadow: `0 0 18px ${profile.accentSoft}`,
      }}
    >
      <div
        className="grid h-4 w-4 place-items-center rounded-full"
        style={{ background: profile.accent }}
      >
        <Music2 size={10} color="#000" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function DouyinCaption({ profile }: { profile: SceneProfile }) {
  return (
    <div className="pointer-events-none absolute bottom-[148px] left-3.5 right-20 z-20 space-y-1.5">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: profile.accent }} />
        <span className="text-white/85">{profile.liveTag}</span>
      </div>
      <p className="text-[15px] font-bold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {profile.author}
        <span className="ml-2 text-[11px] font-normal text-white/55">{profile.authorTag}</span>
      </p>
      <p className="text-[13px] font-semibold leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {profile.videoTitle}
      </p>
      <p className="line-clamp-2 text-[12px] leading-snug text-white/82 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {profile.videoDesc}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-white/85">
        <Music2 size={12} />
        <span className="truncate">{profile.music}</span>
      </div>
    </div>
  );
}

function DouyinBottomNav() {
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
  icon: React.ReactNode;
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

function VideoScene({ profile, stage }: { profile: SceneProfile; stage: Stage }) {
  const isMountain = profile.key === "mountain";
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: isMountain
            ? "linear-gradient(180deg, rgba(15,40,22,.92), rgba(15,20,15,.7) 46%, rgba(6,5,4,.98)), radial-gradient(circle at 34% 14%, rgba(255,138,42,.28), transparent 36%)"
            : "linear-gradient(180deg, rgba(6,26,42,.96), rgba(10,15,42,.74) 48%, rgba(5,5,10,.98)), radial-gradient(circle at 63% 12%, rgba(35,240,255,.32), transparent 36%)",
        }}
      />
      <div className="absolute inset-0 opacity-55">
        <div className={isMountain ? "terrain-lines mountain-lines" : "terrain-lines city-lines"} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[58%]">
        <div className={isMountain ? "mountain-ridge ridge-back" : "skyline skyline-back"} />
        <div className={isMountain ? "mountain-ridge ridge-front" : "skyline skyline-front"} />
      </div>
      <div className="absolute bottom-0 left-1/2 h-[420px] w-[240px] -translate-x-1/2 overflow-hidden rounded-t-[46%] bg-black/20">
        <div
          className="absolute inset-x-0 bottom-0 mx-auto h-[480px] w-[120px] origin-bottom"
          style={{
            transform: "perspective(360px) rotateX(58deg)",
            backgroundImage: isMountain
              ? "linear-gradient(90deg, transparent 0 18%, rgba(255,138,42,.35) 18% 21%, transparent 21% 49%, rgba(255,255,255,.2) 49% 51%, transparent 51% 79%, rgba(255,138,42,.35) 79% 82%, transparent 82%), linear-gradient(0deg, rgba(255,255,255,.2) 0 2px, transparent 2px 48px)"
              : "linear-gradient(90deg, transparent 0 18%, rgba(35,240,255,.4) 18% 21%, transparent 21% 49%, rgba(255,255,255,.35) 49% 51%, transparent 51% 79%, rgba(35,240,255,.4) 79% 82%, transparent 82%), linear-gradient(0deg, rgba(255,255,255,.25) 0 2px, transparent 2px 42px)",
            animation:
              stage === "scanning" ? "roadFlow .45s linear infinite" : "roadFlow 1.1s linear infinite",
          }}
        />
      </div>
    </div>
  );
}

type RideCardProps = {
  profile: SceneProfile;
  stage: Stage;
  scanProgress: number;
  assistantNote: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
  scannerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<HTMLDivElement | null>;
  shareRef: React.RefObject<HTMLDivElement | null>;
  wheelRef: React.MutableRefObject<HTMLDivElement[]>;
  onScan: () => void;
  onSwitch: () => void;
  onShare: () => void;
  onReset: () => void;
};

function RideCard({
  profile,
  stage,
  scanProgress,
  assistantNote,
  cardRef,
  scannerRef,
  mapRef,
  shareRef,
  wheelRef,
  onScan,
  onSwitch,
  onShare,
  onReset,
}: RideCardProps) {
  if (stage === "idle") {
    return <IdleBanner cardRef={cardRef} profile={profile} onScan={onScan} />;
  }
  return (
    <div
      ref={cardRef}
      className="absolute bottom-[78px] left-3 right-3 z-30 max-h-[62vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0c12]/85 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
            Douyin Interactive Card
          </p>
          <h2 className="mt-1 text-lg font-semibold">RideSnap 智能骑行卡</h2>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-right">
          <p className="text-[10px] text-white/45">识别结果</p>
          <p className="text-sm font-bold" style={{ color: profile.accent }}>
            {profile.short}
          </p>
        </div>
      </div>

      {stage === "scanning" && (
        <ScanningPanel
          profile={profile}
          progress={scanProgress}
          scannerRef={scannerRef}
          mapRef={mapRef}
          wheelRef={wheelRef}
        />
      )}
      {stage === "result" && (
        <ResultPanel
          profile={profile}
          assistantNote={assistantNote}
          onShare={onShare}
          onSwitch={onSwitch}
          onReset={onReset}
          wheelRef={wheelRef}
        />
      )}
      {stage === "share" && (
        <SharePanel profile={profile} shareRef={shareRef} onSwitch={onSwitch} onReset={onReset} />
      )}
    </div>
  );
}

function IdleBanner({
  cardRef,
  profile,
  onScan,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  profile: SceneProfile;
  onScan: () => void;
}) {
  return (
    <div
      ref={cardRef}
      className="absolute bottom-[78px] left-3 right-3 z-30 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0a0c12]/85 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${profile.accent}, ${profile.accentSoft})`,
          boxShadow: `0 4px 18px ${profile.accentSoft}`,
        }}
      >
        <RadioTower size={20} color="#0a0c12" strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] uppercase tracking-[0.22em] text-white/45">
          RideSnap · 智能骑行卡
        </p>
        <p className="truncate text-sm font-semibold">识别你附近最适合的骑行赛道</p>
      </div>
      <button
        type="button"
        onClick={onScan}
        className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-black"
        style={{
          background: profile.accent,
          boxShadow: `0 4px 14px ${profile.accentSoft}`,
        }}
      >
        开始识别
      </button>
    </div>
  );
}

function ScanningPanel({
  profile,
  progress,
  scannerRef,
  mapRef,
  wheelRef,
}: {
  profile: SceneProfile;
  progress: number;
  scannerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<HTMLDivElement | null>;
  wheelRef: React.MutableRefObject<HTMLDivElement[]>;
}) {
  const activeStep = Math.min(
    scanSteps.length - 1,
    Math.floor((progress / 100) * scanSteps.length),
  );
  return (
    <div>
      <div className="grid grid-cols-[118px_1fr] gap-3">
        <div
          ref={scannerRef}
          className="relative grid min-h-[118px] place-items-center overflow-hidden rounded-md border border-white/12 bg-white/[0.04]"
        >
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="scan-ring absolute h-16 w-16 rounded-full border"
              style={{ borderColor: profile.accent }}
            />
          ))}
          <MapPinned className="relative z-10 h-9 w-9" color={profile.accent} />
        </div>
        <div
          ref={mapRef}
          className="relative overflow-hidden rounded-md border border-white/12 bg-black/25 p-3"
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background: `linear-gradient(90deg, ${profile.accentSoft} 1px, transparent 1px), linear-gradient(0deg, ${profile.accentSoft} 1px, transparent 1px)`,
              backgroundSize: "18px 18px",
            }}
          />
          <div className="relative mt-6 h-1 rounded-full bg-white/10">
            <div className="route-line h-full rounded-full" style={{ background: profile.accent }} />
          </div>
          <div className="relative mt-[-10px] flex justify-between">
            {[0, 1, 2, 3].map((item) => (
              <span
                key={item}
                className="route-node h-5 w-5 rounded-full border-2 border-black"
                style={{ background: profile.accent }}
              />
            ))}
          </div>
          <p className="relative mt-5 text-xs text-white/55">{profile.terrain}</p>
          <p className="relative text-sm font-semibold">{profile.mapLabel}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-white/52">
          <span>{scanSteps[activeStep]}</span>
          <span>{progress}%</span>
        </div>
        <Progress percent={progress} showInfo={false} strokeColor={profile.accent} railColor="rgba(255,255,255,.12)" />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {scanSteps.map((step, index) => (
          <div
            key={step}
            className={`rounded-md border px-2 py-2 text-center text-[10px] ${
              index <= activeStep
                ? "border-white/20 bg-white/12 text-white"
                : "border-white/8 bg-white/[0.03] text-white/36"
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      <BikeVisual compact profile={profile} wheelRef={wheelRef} />
    </div>
  );
}

function ResultPanel({
  profile,
  assistantNote,
  onShare,
  onSwitch,
  onReset,
  wheelRef,
}: {
  profile: SceneProfile;
  assistantNote: string;
  onShare: () => void;
  onSwitch: () => void;
  onReset: () => void;
  wheelRef: React.MutableRefObject<HTMLDivElement[]>;
}) {
  return (
    <div>
      <div className="rounded-md border border-white/10 bg-white/[0.05] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] text-white/45">自动识别完成</p>
            <h3 className="mt-1 text-xl font-semibold leading-tight">{profile.headline}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/58">{profile.subtitle}</p>
          </div>
          <ShieldAlert className="h-6 w-6 shrink-0" color={profile.accent} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric icon={<Route size={14} />} label="路线" value={profile.distance} />
          <Metric icon={<Timer size={14} />} label="时间" value={profile.duration} />
          <Metric icon={<Zap size={14} />} label="挑战" value={profile.challenge} />
        </div>
        <div className="mt-3 rounded-md bg-black/22 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/48">强度指数</span>
            <span style={{ color: profile.accent }}>{profile.intensity}/100</span>
          </div>
          <Progress percent={profile.intensity} showInfo={false} strokeColor={profile.accent} railColor="rgba(255,255,255,.12)" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <InfoBlock title="推荐车型" items={[profile.recommendedBike, profile.routeName, profile.carbon]} />
        <InfoBlock title="装备提醒" items={profile.gear} />
        <InfoBlock title="骑行技巧" items={profile.strategy} wide />
        <InfoBlock title="风险提示" items={profile.risks} />
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-white/70">
        <span className="font-semibold" style={{ color: profile.accent }}>
          AI 攻略：
        </span>{" "}
        {assistantNote}
      </div>

      <BikeVisual compact profile={profile} wheelRef={wheelRef} />

      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <Button type="primary" icon={<Share2 size={16} />} onClick={onShare}>
          生成分享卡
        </Button>
        <Button icon={<RefreshCw size={16} />} onClick={onSwitch}>
          切换
        </Button>
        <Button onClick={onReset}>重置</Button>
      </div>
    </div>
  );
}

function SharePanel({
  profile,
  shareRef,
  onSwitch,
  onReset,
}: {
  profile: SceneProfile;
  shareRef: React.RefObject<HTMLDivElement | null>;
  onSwitch: () => void;
  onReset: () => void;
}) {
  return (
    <div>
      <div
        ref={shareRef}
        className="relative overflow-hidden rounded-lg border border-white/18 p-4"
        style={{
          background: `linear-gradient(135deg, ${profile.accentSoft}, rgba(255,255,255,.08)), #0c0f14`,
        }}
      >
        <div
          className="absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl"
          style={{ background: profile.accentSoft }}
        />
        <p className="relative text-[10px] uppercase tracking-[0.3em] text-white/48">
          RideSnap Share Card
        </p>
        <h3 className="relative mt-3 text-2xl font-bold leading-tight">{profile.headline}</h3>
        <p className="relative mt-2 text-sm leading-relaxed text-white/72">{profile.shareText}</p>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Metric label="距离" value={profile.distance} />
          <Metric label="时间" value={profile.duration} />
          <Metric label="挑战" value={profile.challenge} />
        </div>
        <div className="relative mt-4 flex items-center justify-between rounded-md bg-black/30 px-3 py-2">
          <span className="text-xs text-white/54">扫码体验同款骑行卡</span>
          <Send size={18} color={profile.accent} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="primary" icon={<Share2 size={16} />}>
          邀请好友
        </Button>
        <Button icon={<RefreshCw size={16} />} onClick={onSwitch}>
          切换赛道
        </Button>
      </div>
      <Button className="mt-2" block onClick={onReset}>
        重新识别
      </Button>
    </div>
  );
}

function BikeVisual({
  profile,
  wheelRef,
  compact = false,
}: {
  profile: SceneProfile;
  wheelRef: React.MutableRefObject<HTMLDivElement[]>;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative mx-auto ${
        compact ? "mt-3 h-14" : "h-20"
      } overflow-hidden rounded-md border border-white/10 bg-black/20`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: `linear-gradient(90deg, transparent, ${profile.accentSoft}, transparent)` }}
      />
      <div className="absolute bottom-3 left-1/2 h-[2px] w-52 -translate-x-1/2" style={{ background: profile.accent }} />
      <div className="absolute bottom-4 left-1/2 h-10 w-36 -translate-x-1/2">
        {[0, 1].map((item) => (
          <div
            key={item}
            ref={(node) => {
              if (node) wheelRef.current[item] = node;
            }}
            className="absolute bottom-0 h-10 w-10 rounded-full border-2"
            style={{
              left: item === 0 ? 6 : 90,
              borderColor: profile.accent,
              background:
                "radial-gradient(circle, transparent 0 28%, rgba(255,255,255,.18) 29% 32%, transparent 33%), conic-gradient(from 0deg, rgba(255,255,255,.05), rgba(255,255,255,.65), rgba(255,255,255,.05), rgba(255,255,255,.65), rgba(255,255,255,.05))",
            }}
          />
        ))}
        <div className="absolute bottom-5 left-[25px] h-[2px] w-[84px] rotate-[-18deg]" style={{ background: profile.accent }} />
        <div className="absolute bottom-5 left-[39px] h-[2px] w-[64px] rotate-[20deg]" style={{ background: profile.accent }} />
        <div className="absolute bottom-[33px] left-[65px] h-[2px] w-10" style={{ background: profile.accent }} />
        <div className="absolute bottom-[36px] left-[96px] h-[2px] w-8 rotate-[18deg]" style={{ background: profile.accent }} />
        <div className="absolute bottom-[39px] left-[28px] h-[2px] w-7 rotate-[-8deg]" style={{ background: profile.accent }} />
      </div>
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"
        style={{ animation: "shimmer 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

function Metric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/22 px-2 py-2">
      <div className="flex items-center gap-1 text-[10px] text-white/44">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoBlock({ title, items, wide = false }: { title: string; items: string[]; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-white/10 bg-white/[0.045] p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[11px] font-semibold text-white/50">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded border border-white/10 bg-black/25 px-2 py-1 text-[11px] text-white/76">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
