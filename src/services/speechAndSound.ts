let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => undefined);
  }
  return audioCtx;
}

export function playTone(freq = 523.25, durationSec = 0.14, type: OscillatorType = 'sine', enabled = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  } catch {
    // Ignore audio context errors
  }
}

export function playSuccessChime(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0.12, 'sine', true);
  setTimeout(() => playTone(659.25, 0.16, 'sine', true), 110);
}

export function playErrorChime(enabled = true) {
  if (!enabled) return;
  playTone(220, 0.18, 'triangle', true);
}

export function playReminderChime(enabled = true) {
  if (!enabled) return;
  playTone(587.33, 0.14, 'sine', true);
  setTimeout(() => playTone(880, 0.22, 'sine', true), 150);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakEnglish(text: string, rate = 0.88): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utter.voice = enVoice;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}
