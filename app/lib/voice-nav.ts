export type VoiceNavStep = {
  index: number;
  instruction: string;
  distance_m: number;
  duration_s: number;
};

export type VoiceNavState = "idle" | "playing" | "paused" | "done";

export type VoiceNavOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
};

/** 浏览器是否支持 SpeechSynthesis */
export function isVoiceNavSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoice: SpeechSynthesisVoice | null = null;
function pickChineseVoice(): SpeechSynthesisVoice | null {
  if (!isVoiceNavSupported()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  const zh =
    voices.find((v) => /zh-CN|zh_CN/i.test(v.lang)) ??
    voices.find((v) => /zh/i.test(v.lang)) ??
    voices[0] ??
    null;
  cachedVoice = zh;
  return zh;
}

export function speak(text: string, opts: VoiceNavOptions = {}): SpeechSynthesisUtterance | null {
  if (!isVoiceNavSupported() || !text.trim()) return null;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = opts.rate ?? 1.05;
  utter.pitch = opts.pitch ?? 1;
  utter.volume = opts.volume ?? 1;
  const voice = pickChineseVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
  return utter;
}

export function stopSpeaking() {
  if (!isVoiceNavSupported()) return;
  window.speechSynthesis.cancel();
}

/**
 * 顺序朗读多个步骤, 模拟"实时导航"
 * 返回控制句柄, 调用 stop() 取消
 */
export function startStepwiseNav(
  steps: VoiceNavStep[],
  onStep: (idx: number) => void,
  onDone: () => void,
  stepDelayMs = 2200,
): { stop: () => void } {
  if (!isVoiceNavSupported() || steps.length === 0) {
    onDone();
    return { stop: () => {} };
  }
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const playFromIndex = (i: number) => {
    if (cancelled) return;
    if (i >= steps.length) {
      onDone();
      return;
    }
    const step = steps[i];
    onStep(i);
    const text = `第 ${i + 1} 步, ${step.instruction}`;
    const utter = speak(text);
    if (!utter) {
      timer = setTimeout(() => playFromIndex(i + 1), stepDelayMs);
      return;
    }
    utter.onend = () => {
      if (cancelled) return;
      timer = setTimeout(() => playFromIndex(i + 1), stepDelayMs);
    };
    utter.onerror = utter.onend;
  };

  playFromIndex(0);

  return {
    stop: () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      stopSpeaking();
    },
  };
}
