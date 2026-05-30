"use client";

import { ConfigProvider, theme } from "antd";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ToastBar } from "./components/atoms/ToastBar";
import { BuddyCard } from "./components/cards/BuddyCard";
import { CardDeckShell } from "./components/cards/CardDeckShell";
import {
  DestinationPicker,
  type PickedDestination,
} from "./components/cards/DestinationPicker";
import { IdleBanner } from "./components/cards/IdleBanner";
import { RiderInvite } from "./components/cards/RiderInvite";
import { RouteCard } from "./components/cards/RouteCard";
import { ScanningCard } from "./components/cards/ScanningCard";
import {
  DouyinBottomNav,
  DouyinCaption,
  DouyinSideActions,
  DouyinStatusBar,
  DouyinTopBar,
} from "./components/douyin";
import { DemoControls } from "./components/scene/DemoControls";
import { SceneAmbience } from "./components/scene/SceneAmbience";
import { VideoScene } from "./components/scene/VideoScene";
import {
  type AmapBicyclingResult,
  type AmapWeather,
  fetchBicyclingRoute,
  fetchPoiAround,
  fetchWeather,
  createFallbackRoute,
  scoreSceneFromPois,
} from "./lib/amap";
import {
  type Rider,
  type RidersResult,
  type SceneDetectResult,
  type SceneKey,
  getNearbyRiders,
} from "./lib/amap-mock";
import { type GeoLocation, type LatLng, getCurrentLocationSmart } from "./lib/geo";
import { type NavCtl, type NavTick, startSimulatedRide } from "./lib/nav-controller";
import { sceneProfiles } from "./lib/scene-profiles";
import { useCardDeck } from "./lib/use-card-deck";
import { isVoiceNavSupported } from "./lib/voice-nav";
import type { NavProgress } from "./components/cards/card-types";

type Phase = "idle" | "scanning" | "deck";
type CardKey = "route" | "buddy";

const CARDS: CardKey[] = ["route", "buddy"];

export default function RideSnapDemo() {
  const [scene, setScene] = useState<SceneKey>("mountain");
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<SceneDetectResult | null>(null);
  const [riders, setRiders] = useState<RidersResult | null>(null);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [origin, setOrigin] = useState<GeoLocation | null>(null);
  const [destination, setDestination] = useState<PickedDestination | null>(null);
  const [customRoute, setCustomRoute] = useState<AmapBicyclingResult | null>(null);
  const [routeSource, setRouteSource] = useState<"none" | "amap" | "amap-fallback">("none");
  const [weather, setWeather] = useState<AmapWeather | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceStepIdx, setVoiceStepIdx] = useState<number | null>(null);
  const [myPosition, setMyPosition] = useState<LatLng | null>(null);
  const [myBearing, setMyBearing] = useState(0);
  const [navProgress, setNavProgress] = useState<NavProgress | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const progressTween = useRef<gsap.core.Tween | null>(null);
  const navCtl = useRef<NavCtl | null>(null);

  const profile = sceneProfiles[scene];
  const deck = useCardDeck({ total: CARDS.length, enabled: phase === "deck" });

  /** 稳定 origin 引用 (按经纬度而非整对象做 dep, 避免每次 setOrigin 都触发下游 useEffect) */
  const originLatLng = useMemo(
    () => (origin ? { lng: origin.lng, lat: origin.lat } : null),
    [origin?.lng, origin?.lat],
  );

  useEffect(() => {
    getNearbyRiders(scene).then(setRiders);
  }, [scene]);

  useEffect(() => {
    getCurrentLocationSmart().then(setOrigin);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    return () => {
      navCtl.current?.stop();
    };
  }, []);

  const runScan = useCallback(
    async (nextScene: SceneKey = scene) => {
      progressTween.current?.kill();
      setScene(nextScene);
      setPhase("scanning");
      setScanProgress(0);
      deck.jumpTo(0);

      const loc = origin ?? (await getCurrentLocationSmart());
      if (!origin) setOrigin(loc);

      const pois = await fetchPoiAround(
        { lng: loc.lng, lat: loc.lat },
        { radius: 2000 },
      );
      let detect: SceneDetectResult;
      if (pois.length > 0) {
        const score = scoreSceneFromPois(pois);
        setScene(score.scene);
        detect = {
          scene: score.scene,
          confidence: score.confidence,
          reason: score.reason,
          topPois: pois.slice(0, 4).map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            distance_m: p.distance_m,
            bias: null,
          })),
        };
        if (score.scene !== nextScene) {
          setToast(`高德识别为${score.scene === "mountain" ? "山地" : "城市"}赛道, 已自动切换攻略`);
        }
      } else {
        setScene(nextScene);
        detect = {
          scene: nextScene,
          confidence: 70,
          reason: "周边 POI 拉取失败 (key/网络异常), 使用默认场景",
          topPois: [],
        };
      }
      setScanResult(detect);

      requestAnimationFrame(() => {
        if (scannerRef.current) {
          gsap.fromTo(
            scannerRef.current.querySelectorAll(".scan-ring"),
            { scale: 0.2, autoAlpha: 0.9 },
            {
              scale: 1.8,
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
        onComplete: () => setPhase("deck"),
      });
    },
    [scene, origin, deck],
  );

  const switchScene = useCallback(
    (next: SceneKey) => {
      setSelectedRider(null);
      if (phase === "deck" || phase === "scanning") {
        runScan(next);
      } else {
        setScene(next);
      }
    },
    [phase, runScan],
  );

  const resetDemo = () => {
    navCtl.current?.stop();
    navCtl.current = null;
    setVoicePlaying(false);
    setVoiceStepIdx(null);
    setMyPosition(null);
    setMyBearing(0);
    setNavProgress(null);
    progressTween.current?.kill();
    setPhase("idle");
    setScanProgress(0);
    setSelectedRider(null);
    setDestination(null);
    setCustomRoute(null);
    setRouteSource("none");
    setWeather(null);
  };

  const startNavigation = () => {
    if (!customRoute || !destination) return;
    setToast(`已唤起导航: ${destination.name}`);
  };

  const refreshRadar = async () => {
    const fresh = await getNearbyRiders(scene);
    setRiders(fresh);
    setToast("雷达已刷新");
  };

  const handlePickDestination = async (dest: PickedDestination) => {
    setPickerOpen(false);
    setDestination(dest);
    setCustomRoute(null);
    setWeather(null);
    setRouteSource("none");
    if (!origin) {
      setToast("还在定位中, 请稍候");
      return;
    }
    setToast(`正在规划: ${dest.name} ...`);
    const weatherKey = origin.adcode || origin.city || "";
    const [route, w] = await Promise.all([
      fetchBicyclingRoute({ lng: origin.lng, lat: origin.lat }, dest.loc),
      weatherKey ? fetchWeather(weatherKey) : Promise.resolve(null),
    ]);
    setWeather(w);
    if (route) {
      setCustomRoute(route);
      setRouteSource("amap");
      setToast(
        `已规划: ${(route.distance_m / 1000).toFixed(1)} km · ${Math.max(1, Math.round(route.duration_s / 60))} 分钟`,
      );
    } else {
      setCustomRoute(createFallbackRoute({ lng: origin.lng, lat: origin.lat }, dest.loc));
      setRouteSource("amap-fallback");
      setToast("高德未返回路线 (key 错误或网络), 仅显示起终点");
    }
  };

  const handleVoiceNav = () => {
    if (voicePlaying) {
      navCtl.current?.stop();
      navCtl.current = null;
      setVoicePlaying(false);
      setVoiceStepIdx(null);
      setMyPosition(null);
      setMyBearing(0);
      setNavProgress(null);
      return;
    }
    if (!customRoute || customRoute.steps.length === 0 || customRoute.polyline.length < 2) {
      setToast("还没有路线可导航");
      return;
    }
    const voiceOk = isVoiceNavSupported();
    setToast(voiceOk ? "实时导航开始 · 模拟骑行 18 km/h" : "实时轨迹开始 (浏览器无 TTS)");
    const steps = customRoute.steps.map((s, idx) => ({
      index: idx,
      instruction: s.instruction,
      distance_m: s.distance_m,
    }));
    setVoicePlaying(true);
    setVoiceStepIdx(0);
    setMyPosition(customRoute.polyline[0]);
    setNavProgress({ progressM: 0, totalM: customRoute.distance_m, speedKmh: 18 });
    navCtl.current = startSimulatedRide({
      polyline: customRoute.polyline,
      steps,
      speedKmh: 18,
      tickHz: 8,
      voice: voiceOk,
      onTick: (e: NavTick) => {
        setMyPosition(e.position);
        setMyBearing(e.bearing_deg);
        setNavProgress({ progressM: e.progressM, totalM: e.totalM, speedKmh: e.speedKmh });
      },
      onStepEnter: (idx) => setVoiceStepIdx(idx),
      onDone: () => {
        setVoicePlaying(false);
        setVoiceStepIdx(null);
        setToast("已到达目的地");
      },
    });
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: profile.accent,
          borderRadius: 14,
          fontFamily:
            '"PingFang SC", "HarmonyOS Sans SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
        },
      }}
    >
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white">
        <SceneAmbience profile={profile} />
        <DemoControls scene={scene} onSwitch={switchScene} onReset={resetDemo} />

        <div
          className="relative h-screen w-full max-w-[440px] overflow-hidden bg-black"
          style={{
            boxShadow:
              "0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
        >
          <VideoScene profile={profile} phase={phase} />
          <DouyinStatusBar />
          <DouyinTopBar />
          <DouyinSideActions profile={profile} />
          <DouyinCaption profile={profile} />
          <DouyinBottomNav />

          {phase === "idle" && (
            <IdleBanner profile={profile} onScan={() => runScan(scene)} />
          )}

          {phase === "scanning" && (
            <ScanningCard
              profile={profile}
              progress={scanProgress}
              scanResult={scanResult}
              scannerRef={scannerRef}
              mapRef={mapRef}
            />
          )}

          {phase === "deck" && (
            <CardDeckShell
              deckRef={deck.deckRef}
              activeCardIdx={deck.activeIdx}
              totalCards={CARDS.length}
              onJumpCard={deck.jumpTo}
            >
              <RouteCard
                profile={profile}
                scanResult={scanResult}
                origin={originLatLng}
                destination={destination}
                customRoute={customRoute}
                routeSource={routeSource}
                weather={weather}
                voicePlaying={voicePlaying}
                voiceStepIdx={voiceStepIdx}
                myPosition={myPosition}
                myBearing={myBearing}
                navProgress={navProgress}
                onPickDestination={() => setPickerOpen(true)}
                onNav={startNavigation}
                onVoiceNav={handleVoiceNav}
                onReset={resetDemo}
              />
              <BuddyCard
                profile={profile}
                riders={riders}
                onRefresh={refreshRadar}
                onSelectRider={setSelectedRider}
              />
            </CardDeckShell>
          )}

          {pickerOpen && (
            <DestinationPicker
              origin={origin}
              city={origin?.city ?? origin?.adcode}
              accent={profile.accent}
              onPick={handlePickDestination}
              onClose={() => setPickerOpen(false)}
            />
          )}

          {selectedRider && (
            <RiderInvite
              rider={selectedRider}
              accent={profile.accent}
              onClose={() => setSelectedRider(null)}
              onInvite={() => {
                setToast(`已向 ${selectedRider.name} 发送约骑邀请`);
                setSelectedRider(null);
              }}
            />
          )}

          {toast && <ToastBar text={toast} accent={profile.accent} />}
          <div className="flash-layer pointer-events-none absolute inset-0 z-50 bg-white opacity-0" />
        </div>
      </main>
    </ConfigProvider>
  );
}
