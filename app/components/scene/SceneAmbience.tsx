import type { SceneProfile } from "../../lib/scene-profiles";

export function SceneAmbience({ profile }: { profile: SceneProfile }) {
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
