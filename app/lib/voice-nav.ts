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
  provider?: "auto" | "minimax" | "browser";
  emotion?: "happy" | "calm" | "surprised" | "sad" | "angry" | "fearful" | "disgusted";
  style?: "nav" | "cute";
  onend?: () => void;
  onerror?: (error: unknown) => void;
};

export type VoiceHandle = {
  stop: () => void;
  onend: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
};

/** 浏览器是否支持 SpeechSynthesis */
export function isVoiceNavSupported(): boolean {
  return typeof window !== "undefined" && ("speechSynthesis" in window || "Audio" in window);
}

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceListenerBound = false;
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeMiniMaxAbort: AbortController | null = null;
let voiceRunId = 0;

function pickChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  // 语音表异步加载, ready 后浏览器派发 voiceschanged → 清缓存重新挑选,
  // 避免首帧 voices 为空时把英文/错误首选项永久缓存
  if (!voiceListenerBound) {
    window.speechSynthesis.addEventListener?.("voiceschanged", () => {
      cachedVoice = null;
    });
    voiceListenerBound = true;
  }
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // 语音表未就绪, 不缓存, 下次再取
  const zh =
    voices.find((v) => /zh-CN|zh_CN/i.test(v.lang)) ??
    voices.find((v) => /zh/i.test(v.lang)) ??
    voices[0] ??
    null;
  cachedVoice = zh;
  return zh;
}

export function speak(text: string, opts: VoiceNavOptions = {}): VoiceHandle | null {
  if (typeof window === "undefined" || !text.trim()) return null;
  const provider = opts.provider ?? "auto";
  if (provider !== "browser" && "Audio" in window) {
    return speakWithMiniMax(text, opts, provider === "minimax");
  }
  return speakWithBrowser(text, opts);
}

function speakWithBrowser(text: string, opts: VoiceNavOptions = {}): VoiceHandle | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const runId = beginVoiceRun();
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(stripMiniMaxSpeechTags(text));
  utter.rate = opts.rate ?? (opts.style === "cute" ? 1.12 : 1.08);
  utter.pitch = opts.pitch ?? (opts.style === "cute" ? 1.08 : 1.02);
  utter.volume = opts.volume ?? 1;
  const voice = pickChineseVoice();
  // lang 跟随实际选中的 voice; 多数浏览器以 voice 为准, lang 与 voice 不一致会读乱码
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = "zh-CN";
  }
  // Chrome 在标签页一段时间无用户交互后会把 speechSynthesis 挂起 (paused),
  // 此时 speak() 静默无声。先 resume 再 speak, 并在 speak 后再 resume 一次兜底。
  try {
    synth.resume();
  } catch { /* ignore */ }
  synth.speak(utter);
  try {
    synth.resume();
  } catch { /* ignore */ }
  const handle: VoiceHandle = {
    stop: () => {
      stopVoiceRun(runId);
    },
    onend: opts.onend ?? null,
    onerror: opts.onerror ?? null,
  };
  utter.onend = () => {
    if (runId !== voiceRunId) return;
    handle.onend?.();
  };
  utter.onerror = (event) => {
    if (runId !== voiceRunId) return;
    handle.onerror?.(event);
  };
  return handle;
}

function speakWithMiniMax(text: string, opts: VoiceNavOptions, strict: boolean): VoiceHandle {
  const runId = beginVoiceRun();
  const abortController = new AbortController();
  activeMiniMaxAbort = abortController;

  let cancelled = false;
  const handle: VoiceHandle = {
    stop: () => {
      cancelled = true;
      stopVoiceRun(runId);
    },
    onend: opts.onend ?? null,
    onerror: opts.onerror ?? null,
  };

  fetch("/api/voice/minimax", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: abortController.signal,
    body: JSON.stringify({
      text: withMiniMaxSpeechTags(text, opts.style ?? "cute"),
      speed: opts.rate ?? (opts.style === "nav" ? 1.13 : 1.08),
      pitch: opts.pitch ?? (opts.style === "nav" ? 1 : 2),
      volume: opts.volume ?? 1,
      emotion: opts.emotion ?? (opts.style === "nav" ? "calm" : "happy"),
      style: opts.style ?? "cute",
    }),
    })
    .then(async (res) => {
      if (activeMiniMaxAbort === abortController) activeMiniMaxAbort = null;
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(String(data?.error ?? `MiniMax TTS failed: ${res.status}`));
      }
      return res.blob();
    })
    .then((blob) => {
      if (cancelled || runId !== voiceRunId) return;
      if (process.env.NODE_ENV !== "production") {
        console.info("[RideSnapVoice] MiniMax audio ready", {
          type: blob.type,
          bytes: blob.size,
        });
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudio = audio;
      activeObjectUrl = url;
      audio.volume = opts.volume ?? 1;
      audio.onended = () => {
        cleanupAudio(url, audio);
        handle.onend?.();
      };
      audio.onerror = () => {
        cleanupAudio(url, audio);
        handle.onerror?.(new Error("MiniMax 音频播放失败"));
      };
      void audio.play().catch((error: unknown) => {
        cleanupAudio(url, audio);
        if (strict) {
          console.warn("[RideSnapVoice] MiniMax audio play failed", error);
          handle.onerror?.(error);
          return;
        }
        const fallback = speakWithBrowser(text, {
          ...opts,
          provider: "browser",
          onend: () => handle.onend?.(),
          onerror: (err) => handle.onerror?.(err),
        });
        if (!fallback) handle.onerror?.(error);
      });
    })
    .catch((error: unknown) => {
      if (activeMiniMaxAbort === abortController) activeMiniMaxAbort = null;
      if (cancelled || runId !== voiceRunId || abortController.signal.aborted) return;
      console.warn("[RideSnapVoice] MiniMax TTS fallback", error);
      if (strict) {
        handle.onerror?.(error);
        return;
      }
      const fallback = speakWithBrowser(text, {
        ...opts,
        provider: "browser",
        onend: () => handle.onend?.(),
        onerror: (err) => handle.onerror?.(err),
      });
      if (!fallback) handle.onerror?.(error);
    });

  return handle;
}

/**
 * 预热语音引擎: 必须在用户手势 (点击) 的同步调用栈内执行一次,
 * 否则后续 speak 在部分浏览器无声。朗读一个空格/极短静音即可解锁。
 */
export function primeVoice() {
  if (!isVoiceNavSupported()) return;
  try {
    const synth = window.speechSynthesis;
    synth.resume();
    // 触发一次极短发声以解锁音频, 不影响后续真实播报
    const warm = new SpeechSynthesisUtterance(" ");
    warm.volume = 0;
    synth.speak(warm);
  } catch { /* ignore */ }
}

export function stopSpeaking() {
  stopVoiceRun(voiceRunId);
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
    const handle = speak(text, { provider: "minimax", style: "nav", rate: 1.13, pitch: 1, emotion: "calm" });
    if (!handle) {
      timer = setTimeout(() => playFromIndex(i + 1), stepDelayMs);
      return;
    }
    handle.onend = () => {
      if (cancelled) return;
      timer = setTimeout(() => playFromIndex(i + 1), stepDelayMs);
    };
    handle.onerror = handle.onend;
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

function stopAudioPlayback() {
  if (!activeAudio) return;
  const audio = activeAudio;
  const objectUrl = activeObjectUrl;
  activeAudio = null;
  activeObjectUrl = null;
  try {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.src = "";
    audio.load();
  } catch { /* ignore */ }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}

function cleanupAudio(url: string, audio: HTMLAudioElement) {
  if (activeAudio === audio) activeAudio = null;
  if (activeObjectUrl === url) activeObjectUrl = null;
  URL.revokeObjectURL(url);
}

function beginVoiceRun() {
  voiceRunId += 1;
  abortActiveMiniMaxRequest();
  stopAudioPlayback();
  cancelBrowserSpeech();
  return voiceRunId;
}

function stopVoiceRun(runId: number) {
  if (runId !== voiceRunId) return;
  voiceRunId += 1;
  abortActiveMiniMaxRequest();
  stopAudioPlayback();
  cancelBrowserSpeech();
}

function abortActiveMiniMaxRequest() {
  if (!activeMiniMaxAbort) return;
  try {
    activeMiniMaxAbort.abort();
  } catch { /* ignore */ }
  activeMiniMaxAbort = null;
}

function cancelBrowserSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch { /* ignore */ }
}

function withMiniMaxSpeechTags(text: string, style: "nav" | "cute") {
  const cleaned = text.trim();
  if (!cleaned || /\((laughs|chuckle|breath|sighs|emm|humming|inhale|exhale)\)/i.test(cleaned)) {
    return cleaned;
  }
  if (style === "nav") {
    return cleaned.startsWith("小R") ? `(breath) ${cleaned}` : cleaned;
  }
  if (/提醒|注意|危险|减速|刹车|路口|右转|左转/.test(cleaned)) {
    return `(breath) ${cleaned}`;
  }
  return `(chuckle) ${cleaned}`;
}

function stripMiniMaxSpeechTags(text: string) {
  return text.replace(/\((?:laughs|chuckle|coughs|clear-throat|groans|breath|pant|inhale|exhale|gasps|sniffs|sighs|snorts|burps|lip-smacking|humming|hissing|emm|sneezes)\)\s*/gi, "");
}
