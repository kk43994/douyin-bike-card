"use client";

import { ConfigProvider, theme } from "antd";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ToastBar } from "./components/atoms/ToastBar";
import { BuddyCard } from "./components/cards/BuddyCard";
import { CardDeckShell } from "./components/cards/CardDeckShell";
import { ChallengeCard } from "./components/cards/ChallengeCard";
import {
  DestinationPicker,
  type PickedDestination,
} from "./components/cards/DestinationPicker";
import { GearShopCard } from "./components/cards/GearShopCard";
import { HotVideoCard } from "./components/cards/HotVideoCard";
import { IdleBanner } from "./components/cards/IdleBanner";
import { RiderInvite } from "./components/cards/RiderInvite";
import { RouteCard } from "./components/cards/RouteCard";
import { ScanningCard } from "./components/cards/ScanningCard";
import { ShareSheet } from "./components/cards/ShareSheet";
import {
  DouyinBottomNav,
  DouyinCaption,
  DouyinSideActions,
  DouyinStatusBar,
  DouyinTopBar,
} from "./components/douyin";
import { DemoControls } from "./components/scene/DemoControls";
import { AudienceQrPanel } from "./components/scene/AudienceQrPanel";
import { SceneAmbience } from "./components/scene/SceneAmbience";
import { VideoScene } from "./components/scene/VideoScene";
import {
  type AmapBicyclingResult,
  type AmapPoi,
  type AmapWeather,
  BIKE_RELATED_TYPES,
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
import { getLeaderboard } from "./lib/leaderboard-mock";
import { type HotBikeVideo, getHotBikeVideos } from "./lib/hot-videos-mock";
import { sceneProfiles } from "./lib/scene-profiles";
import { type ShopProduct, getGearProducts } from "./lib/shop-mock";
import { useCardDeck } from "./lib/use-card-deck";
import { isVoiceNavSupported, primeVoice } from "./lib/voice-nav";
import type { AiRecommendedDestination, NavProgress } from "./components/cards/card-types";
import { buildAmapRideRoutePlanScheme } from "./lib/amap-uri";

type Phase = "idle" | "scanning" | "deck";
type CardKey = "route" | "buddy" | "gear" | "hotVideo" | "challenge";

const CARDS: CardKey[] = ["route", "buddy", "gear", "hotVideo", "challenge"];

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
  const [recommendedDestinations, setRecommendedDestinations] = useState<AiRecommendedDestination[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceStepIdx, setVoiceStepIdx] = useState<number | null>(null);
  const [myPosition, setMyPosition] = useState<LatLng | null>(null);
  const [myBearing, setMyBearing] = useState(0);
  const [navProgress, setNavProgress] = useState<NavProgress | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [amapQrUrl, setAmapQrUrl] = useState<string | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const progressTween = useRef<gsap.core.Tween | null>(null);
  const navCtl = useRef<NavCtl | null>(null);

  const profile = sceneProfiles[scene];
  const products = useMemo(() => getGearProducts(scene), [scene]);
  const leaderboard = useMemo(() => getLeaderboard(scene), [scene]);
  const hotVideos = useMemo(() => getHotBikeVideos(scene), [scene]);
  const deck = useCardDeck({ total: CARDS.length, enabled: phase === "deck" });

  /** 稳定 origin 引用 (按经纬度而非整对象做 dep, 避免每次 setOrigin 都触发下游 useEffect) */
  const originLatLng = useMemo(
    () => (origin ? { lng: origin.lng, lat: origin.lat } : null),
    [origin],
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
        { types: BIKE_RELATED_TYPES, radius: 5000 },
      );
      let detect: SceneDetectResult;
      let detectedScene = nextScene;
      if (pois.length > 0) {
        const score = scoreSceneFromPois(pois);
        setScene(score.scene);
        detectedScene = score.scene;
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
        detectedScene = nextScene;
        detect = {
          scene: nextScene,
          confidence: 70,
          reason: "周边 POI 拉取失败 (key/网络异常), 使用默认场景",
          topPois: [],
        };
      }
      setScanResult(detect);
      setRecommendedDestinations(buildRecommendedDestinations({
        pois,
        origin: { lng: loc.lng, lat: loc.lat },
        scene: detectedScene,
        placeName: loc.shortPlace ?? loc.cityName,
      }));

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
    setRecommendedDestinations([]);
  };

  const stopNavigation = (message?: string) => {
    navCtl.current?.stop();
    navCtl.current = null;
    setVoicePlaying(false);
    setVoiceStepIdx(null);
    setMyPosition(null);
    setMyBearing(0);
    setNavProgress(null);
    if (message) setToast(message);
  };

  const startRideSimulation = (withVoice: boolean) => {
    if (!customRoute || customRoute.steps.length === 0 || customRoute.polyline.length < 2) {
      setToast("还没有路线可导航");
      return;
    }
    navCtl.current?.stop();
    const voiceOk = withVoice && isVoiceNavSupported();
    if (voiceOk) primeVoice();
    setToast(
      withVoice
        ? (voiceOk ? "语音导航开始 · 地图自动转向" : "实时轨迹开始 · 浏览器无 TTS")
        : "骑行导航开始 · 地图自动转向",
    );
    const steps = customRoute.steps.map((s, idx) => ({
      index: idx,
      instruction: s.instruction,
      distance_m: s.distance_m,
    }));
    setVoicePlaying(withVoice);
    setVoiceStepIdx(0);
    setMyPosition(customRoute.polyline[0]);
    setMyBearing(0);
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
        navCtl.current = null;
        setVoicePlaying(false);
        setVoiceStepIdx(null);
        setMyPosition(customRoute.polyline[customRoute.polyline.length - 1] ?? null);
        setNavProgress({ progressM: customRoute.distance_m, totalM: customRoute.distance_m, speedKmh: 0 });
        setToast("已到达目的地");
      },
    });
  };

  const startNavigation = () => {
    if (navCtl.current) {
      stopNavigation("导航已结束");
      return;
    }
    startRideSimulation(false);
  };

  const refreshRadar = async () => {
    const fresh = await getNearbyRiders(scene);
    setRiders(fresh);
    setToast("雷达已刷新");
  };

  const handleBuy = (p: ShopProduct) => {
    setToast(`正在跳转抖音小店 · ${p.shop}`);
  };

  const handleShare = (channel: string) => {
    setShareOpen(false);
    setToast(`已分享到${channel}`);
  };

  const handleChallenge = () => {
    setToast("已加入本周挑战 · 出发刷榜");
  };

  const handleOpenVideo = (video: HotBikeVideo) => {
    setToast(`正在打开抖音热门视频 · @${video.creator}`);
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

  const handlePickRecommendedDestination = (rec: AiRecommendedDestination) => {
    handlePickDestination({
      name: rec.name,
      hint: `${rec.hint}${rec.source === "fallback" ? " · AI 兜底推荐" : ""}`,
      loc: rec.loc,
      source: rec.source === "amap" ? "amap" : "self",
    });
  };

  const handleVoiceNav = () => {
    if (voicePlaying) {
      stopNavigation("语音导航已停止");
      return;
    }
    startRideSimulation(true);
  };

  const openAmapNavigation = () => {
    if (!destination) {
      setToast("请先选择骑行目的地");
      return;
    }
    const options = {
      origin: originLatLng,
      destination: destination.loc,
      destinationName: destination.name,
      sourceName: "RideSnapDouyinCard",
    };
    const isMobile = /Android|iPhone|iPad|iPod|HarmonyOS|OpenHarmony/i.test(navigator.userAgent);
    const mobileScheme = buildAmapRideRoutePlanScheme(options);
    if (isMobile) {
      window.open(mobileScheme, "_blank", "noopener,noreferrer");
      setToast("正在打开高德 App 骑行导航");
      return;
    }
    setAmapQrUrl(mobileScheme);
    setToast("桌面端请用手机扫码打开高德骑行导航");
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
        <AudienceQrPanel profile={profile} />

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
                recommendedDestinations={recommendedDestinations}
                voicePlaying={voicePlaying}
                voiceStepIdx={voiceStepIdx}
                myPosition={myPosition}
                myBearing={myBearing}
                navProgress={navProgress}
                placeName={origin?.shortPlace}
                onPickDestination={() => setPickerOpen(true)}
                onPickRecommendedDestination={handlePickRecommendedDestination}
                onNav={startNavigation}
                onVoiceNav={handleVoiceNav}
                onOpenAmapNav={openAmapNavigation}
                onShare={() => setShareOpen(true)}
                onReset={resetDemo}
              />
              <BuddyCard
                profile={profile}
                riders={riders}
                onRefresh={refreshRadar}
                onSelectRider={setSelectedRider}
              />
              <GearShopCard
                profile={profile}
                products={products}
                onBuy={handleBuy}
              />
              <HotVideoCard
                profile={profile}
                videos={hotVideos}
                onOpenVideo={handleOpenVideo}
              />
              <ChallengeCard
                profile={profile}
                entries={leaderboard}
                onChallenge={handleChallenge}
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

          {shareOpen && (
            <ShareSheet
              accent={profile.accent}
              title={destination?.name ? `${profile.label} · 去${destination.name}` : `${profile.label} · 智能骑行路线`}
              onClose={() => setShareOpen(false)}
              onShare={handleShare}
            />
          )}

          {amapQrUrl && (
            <ShareSheet
              accent={profile.accent}
              title={destination?.name ? `高德骑行导航 · 去${destination.name}` : "高德骑行导航"}
              url={amapQrUrl}
              sourceLabel="高德 App 骑行"
              helperText="桌面高德 Web 不支持骑行模式，手机扫码可直接唤起 App 骑行导航"
              onClose={() => setAmapQrUrl(null)}
              onShare={() => {
                setAmapQrUrl(null);
                setToast("已生成高德骑行导航二维码");
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

function buildRecommendedDestinations({
  pois,
  origin,
  scene,
  placeName,
}: {
  pois: AmapPoi[];
  origin: LatLng;
  scene: SceneKey;
  placeName?: string;
}): AiRecommendedDestination[] {
  const candidates = pois
    .map((poi) => buildPoiRecommendation(poi, origin, scene))
    .filter((rec): rec is PoiRecommendation => rec !== null)
    .sort((a, b) => b.priority - a.priority);
  const fallback = buildFallbackRecommendations(origin, scene, placeName);
  const ranked: AiRecommendedDestination[] = [];

  for (const rec of candidates) {
    if (rec.confidence !== "strong") continue;
    ranked.push(stripRecommendationMeta(rec));
    if (ranked.length >= 2) break;
  }

  for (const rec of candidates) {
    if (ranked.length >= 3) break;
    if (ranked.some((r) => r.id === rec.id)) continue;
    if (rec.confidence === "support" && ranked.length < 2) continue;
    ranked.push(stripRecommendationMeta(rec));
  }

  const existingNames = new Set(ranked.map((r) => r.name));
  for (const rec of fallback) {
    if (!existingNames.has(rec.name)) ranked.push(rec);
    if (ranked.length >= 3) break;
  }
  return ranked;
}

type PoiRecommendation = AiRecommendedDestination & {
  confidence: "strong" | "scenic" | "support";
  priority: number;
};

function buildPoiRecommendation(
  poi: AmapPoi,
  origin: LatLng,
  scene: SceneKey,
): PoiRecommendation | null {
  if (!poi.name || !poi.location) return null;
  const primaryText = `${poi.name} ${poi.type}`;
  const text = `${primaryText} ${poi.address}`;
  const distance = poi.distance_m > 0 ? poi.distance_m : Math.round(estimateDistanceMeters(origin, poi.location));
  const greenwayHit = /绿道|慢行|滨江|沿江|滨水|骑行道|非机动车道|公园|湿地公园/i.test(primaryText);
  const outdoorHit = /公园|湿地|森林|景区|风景名胜|风景区|旅游景点|竹径|步道|溪|湖|山|岛|滨水|滨江|沿江/i.test(primaryText);
  const scenicHit = greenwayHit || outdoorHit;
  const cyclingHit = /自行车|骑行|单车|车店|维修|骑行驿站|绿道|慢行/i.test(primaryText);
  const sportHit = /营地|户外|越野|骑行基地|运动公园/i.test(primaryText);
  const supplyHit = /便利店|驿站|游客中心|咖啡|补给|维修|自行车销售|自行车维修/i.test(primaryText);
  const cityHit = /绿道|滨江|沿江|滨水|公园|慢行|广场|湖/i.test(primaryText);
  const mountainHit = /山|森林|景区|风景|湿地|茶|林|越野|营地|步道/i.test(primaryText);
  const hardReject = /棋牌|卡牌|桌游|麻将|门球|乒乓|台球|KTV|密室|剧本|网咖|电竞|瑜伽|健身|茶空间|农家乐|餐馆|饭店|寺庙|道观|纪念馆|祠堂|小镇/i.test(primaryText);
  const indoorPenalty = /棋牌|卡牌|桌游|麻将|门球|乒乓|台球|KTV|密室|剧本|网咖|电竞|瑜伽|健身|茶空间/i.test(text) ? 28 : 0;
  const commercialPenalty = /商场|写字楼|银行|酒店|住宅|医院|学校|地铁|公交|停车场|公司|园区/i.test(text) ? 14 : 0;

  if (hardReject && !cyclingHit && !greenwayHit) return null;
  if (!scenicHit && !cyclingHit && !supplyHit && !sportHit) return null;

  let score = 55;
  score += greenwayHit ? 20 : 0;
  score += outdoorHit ? 15 : 0;
  score += cyclingHit ? 16 : 0;
  score += sportHit ? 3 : 0;
  score += supplyHit ? 5 : 0;
  score += scene === "city" && cityHit ? 10 : 0;
  score += scene === "mountain" && mountainHit ? 12 : 0;
  score += distance <= 1200 ? 10 : distance <= 3000 ? 7 : distance <= 5000 ? 3 : -4;
  score -= indoorPenalty;
  score -= commercialPenalty;
  score = Math.max(58, Math.min(98, Math.round(score)));

  if (score < 70 && !greenwayHit && !cyclingHit) return null;

  const tags = buildRecommendationTags({ text, distance, scene, scenicHit, cyclingHit, sportHit, supplyHit });
  const typeLabel = poi.type.split(";").pop() || "骑行点";
  const sceneReason = scene === "city"
    ? "更适合城市道路、公园绿道和低坡巡航"
    : "更适合山地/风景路段和轻越野节奏";
  const confidence: PoiRecommendation["confidence"] =
    greenwayHit || cyclingHit || /公园|湿地|森林|景区|风景名胜|竹径|步道|溪/.test(primaryText)
      ? "strong"
      : supplyHit
        ? "support"
        : "scenic";
  const priority =
    score +
    (confidence === "strong" ? 30 : confidence === "scenic" ? 12 : 0) +
    (distance <= 1500 ? 4 : 0);
  return {
    id: `poi-${poi.id}`,
    name: poi.name,
    hint: `${formatRecommendationDistance(distance)} · ${typeLabel}`,
    loc: poi.location,
    score,
    tags,
    reason: `距离 ${formatRecommendationDistance(distance)}，${sceneReason}，AI 建议作为本次骑行目的地。`,
    distance_m: distance,
    source: "amap",
    confidence,
    priority,
  };
}

function stripRecommendationMeta(rec: PoiRecommendation): AiRecommendedDestination {
  return {
    id: rec.id,
    name: rec.name,
    hint: rec.hint,
    loc: rec.loc,
    score: rec.score,
    tags: rec.tags,
    reason: rec.reason,
    distance_m: rec.distance_m,
    source: rec.source,
  };
}

function buildRecommendationTags({
  text,
  distance,
  scene,
  scenicHit,
  cyclingHit,
  sportHit,
  supplyHit,
}: {
  text: string;
  distance: number;
  scene: SceneKey;
  scenicHit: boolean;
  cyclingHit: boolean;
  sportHit: boolean;
  supplyHit: boolean;
}) {
  const tags: string[] = [];
  if (distance <= 1500) tags.push("近距离热身");
  else if (distance <= 4200) tags.push("中程骑行");
  else tags.push("耐力路线");
  if (/绿道|慢行|滨江|沿江|公园/.test(text)) tags.push("绿道友好");
  else if (scene === "city") tags.push("城市巡航");
  if (/山|森林|越野|步道|景区|风景|湿地/.test(text)) tags.push("风景路段");
  else if (scene === "mountain") tags.push("轻越野");
  if (cyclingHit) tags.push("骑行相关");
  if (sportHit) tags.push("运动氛围");
  if (supplyHit) tags.push("补给方便");
  if (scenicHit && tags.length < 3) tags.push("适合拍卡");
  return Array.from(new Set(tags)).slice(0, 4);
}

function buildFallbackRecommendations(
  origin: LatLng,
  scene: SceneKey,
  placeName?: string,
): AiRecommendedDestination[] {
  const place = compactRecommendationPlace(placeName);
  if (scene === "city") {
    return [
      {
        id: "fallback-city-greenway",
        name: `${place}滨水绿道`,
        hint: "AI 兜底 · 城市绿道环线",
        loc: offsetLatLng(origin, 0.018, 0.006),
        score: 82,
        tags: ["绿道友好", "城市巡航", "低坡路线"],
        reason: "周边 POI 暂时不足，AI 按城市骑行偏好生成低坡、少转向、适合展示的绿道目的地。",
        source: "fallback",
      },
      {
        id: "fallback-city-park",
        name: `${place}城市公园入口`,
        hint: "AI 兜底 · 公园补给点",
        loc: offsetLatLng(origin, -0.011, 0.012),
        score: 79,
        tags: ["近距离热身", "补给方便", "适合拍卡"],
        reason: "优先选择公园入口作为补给和集合点，方便观众一键看到骑行导航效果。",
        source: "fallback",
      },
      {
        id: "fallback-city-night",
        name: `${place}夜骑巡航点`,
        hint: "AI 兜底 · 城市慢行道",
        loc: offsetLatLng(origin, 0.01, -0.014),
        score: 76,
        tags: ["夜骑友好", "城市巡航", "中程骑行"],
        reason: "基于当前位置生成慢行道方向的演示路线，突出城市道路安全与拥堵判断。",
        source: "fallback",
      },
    ];
  }
  return [
    {
      id: "fallback-mountain-trail",
      name: `${place}森林骑行线`,
      hint: "AI 兜底 · 轻越野路线",
      loc: offsetLatLng(origin, 0.014, 0.018),
      score: 84,
      tags: ["风景路段", "轻越野", "适合拍卡"],
      reason: "周边 POI 暂时不足，AI 按山地场景生成风景优先、坡度可控的轻越野目的地。",
      source: "fallback",
    },
    {
      id: "fallback-mountain-climb",
      name: `${place}缓坡训练点`,
      hint: "AI 兜底 · 爬坡节奏",
      loc: offsetLatLng(origin, -0.012, 0.016),
      score: 80,
      tags: ["爬坡训练", "体力可控", "中程骑行"],
      reason: "适合展示体力评分、坡度提示和安全路线调优，演示时不会只停留在目的地输入。",
      source: "fallback",
    },
    {
      id: "fallback-mountain-supply",
      name: `${place}骑行补给驿站`,
      hint: "AI 兜底 · 补给集合点",
      loc: offsetLatLng(origin, 0.017, -0.01),
      score: 77,
      tags: ["补给方便", "近距离热身", "风景路段"],
      reason: "作为山地路线的补水和集合点，便于后续接入真实 POI、天气和多模态推荐模型。",
      source: "fallback",
    },
  ];
}

function offsetLatLng(origin: LatLng, lngDelta: number, latDelta: number): LatLng {
  return {
    lng: Number((origin.lng + lngDelta).toFixed(6)),
    lat: Number((origin.lat + latDelta).toFixed(6)),
  };
}

function compactRecommendationPlace(placeName?: string) {
  if (!placeName) return "附近";
  return placeName
    .replace(/\(mock fallback\)/i, "")
    .split(/[·,，]/)[0]
    .replace(/市$/, "")
    .trim()
    .slice(0, 6) || "附近";
}

function formatRecommendationDistance(m: number): string {
  if (m < 1000) return `${Math.max(50, Math.round(m / 10) * 10)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function estimateDistanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}
