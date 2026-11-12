export function createAudio() {
  let ctx = null;

  function init() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {
      ctx = null;
    }
  }

  function noise(duration, freq, volume) {
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }

  function tone(freq, duration, type, volume, slideTo = null) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  return {
    init,
    shot(kind) {
      if (kind === 'escopeta') { noise(0.35, 1400, 0.9); tone(90, 0.25, 'sawtooth', 0.4, 40); }
      else { noise(0.18, 3000, 0.6); tone(180, 0.12, 'square', 0.25, 60); }
    },
    empty() { tone(220, 0.05, 'square', 0.2); },
    hit() { tone(140, 0.08, 'sawtooth', 0.3, 80); },
    kill() { tone(110, 0.35, 'sawtooth', 0.35, 35); },
    pickup() { tone(520, 0.1, 'triangle', 0.3); setTimeout(() => tone(780, 0.14, 'triangle', 0.3), 90); },
    alert() { tone(70, 0.5, 'sawtooth', 0.25, 50); },
    swap() { tone(300, 0.06, 'square', 0.15); },
    gameOver() { tone(200, 1.0, 'sawtooth', 0.4, 40); },
    win() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.3), i * 160)); },
  };
}
