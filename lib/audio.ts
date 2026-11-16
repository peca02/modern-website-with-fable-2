import { store } from "@/lib/store";

// Everything is synthesized. Nothing exists until the first call to
// `setSound(true)`, which must come from a click.
type Rig = {
  context: AudioContext;
  master: GainNode;
  drone: { low: OscillatorNode; high: OscillatorNode; filter: BiquadFilterNode; gain: GainNode };
  pad: { root: OscillatorNode; fifth: OscillatorNode; gain: GainNode };
  wash: { filter: BiquadFilterNode; gain: GainNode };
};

export type Tick = "liquid" | "metal";

const level = { master: 0.5, pad: 0.035, fade: 0.25 } as const;
const droneHz = 55;
const padHz = 220;
// One step per chapter, in semitones above the pad's root; the last returns home.
const chapterSteps = [0, 3, 7, 5, 10, 0];
const glide = 0.12;

let rig: Rig | null = null;
let enabled = false;

function semitones(steps: number) {
  return 2 ** (steps / 12);
}

function build(): Rig {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const droneGain = context.createGain();
  droneGain.gain.value = 0;
  const droneFilter = context.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 160;
  const low = context.createOscillator();
  low.type = "sawtooth";
  low.frequency.value = droneHz;
  const high = context.createOscillator();
  high.type = "triangle";
  high.frequency.value = droneHz * 2;
  high.detune.value = 7;
  low.connect(droneFilter);
  high.connect(droneFilter);
  droneFilter.connect(droneGain).connect(master);

  const padGain = context.createGain();
  padGain.gain.value = level.pad;
  const root = context.createOscillator();
  root.frequency.value = padHz;
  const fifth = context.createOscillator();
  fifth.frequency.value = padHz * semitones(7);
  root.connect(padGain);
  fifth.connect(padGain);
  padGain.connect(master);

  const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const washFilter = context.createBiquadFilter();
  washFilter.type = "bandpass";
  washFilter.Q.value = 0.8;
  const washGain = context.createGain();
  washGain.gain.value = 0;
  source.connect(washFilter).connect(washGain).connect(master);

  [low, high, root, fifth, source].forEach((node) => node.start());

  return {
    context,
    master,
    drone: { low, high, filter: droneFilter, gain: droneGain },
    pad: { root, fifth, gain: padGain },
    wash: { filter: washFilter, gain: washGain },
  };
}

function fadeMaster(target: number) {
  if (!rig) return;
  const now = rig.context.currentTime;
  rig.master.gain.cancelScheduledValues(now);
  rig.master.gain.setTargetAtTime(target, now, level.fade);
}

/** Call from a click handler: the first call creates the `AudioContext`. */
export function setSound(on: boolean) {
  enabled = on;
  if (on) {
    rig ??= build();
    void rig.context.resume();
    fadeMaster(level.master);
  } else if (rig) {
    const { context } = rig;
    fadeMaster(0);
    window.setTimeout(() => {
      if (!enabled) void context.suspend();
    }, level.fade * 5000);
  }
}

/** The tab went to the background or came back. */
export function setSoundVisible(visible: boolean) {
  if (!rig || !enabled) return;
  if (visible) void rig.context.resume();
  else void rig.context.suspend();
}

/** Every frame while sound is on: the scene's state becomes the ambient layer. */
export function followScene() {
  if (!rig || !enabled) return;
  const now = rig.context.currentTime;
  const field = store.fieldLevel;
  const speed = Math.min(Math.abs(store.scroll.velocity), 2) / 2;

  // The low tone rises a fifth and opens up as the field grows.
  const pitch = droneHz * semitones(7 * field);
  rig.drone.low.frequency.setTargetAtTime(pitch, now, glide);
  rig.drone.high.frequency.setTargetAtTime(pitch * 2, now, glide);
  rig.drone.filter.frequency.setTargetAtTime(160 + 900 * field, now, glide);
  rig.drone.gain.gain.setTargetAtTime(0.08 + 0.3 * field, now, glide);

  const chapter = Math.min(Math.floor(store.story), chapterSteps.length - 1);
  const root = padHz * semitones(chapterSteps[chapter] ?? 0);
  rig.pad.root.frequency.setTargetAtTime(root, now, glide * 4);
  rig.pad.fifth.frequency.setTargetAtTime(root * semitones(7), now, glide * 4);

  rig.wash.filter.frequency.setTargetAtTime(300 + 1400 * speed, now, glide);
  rig.wash.gain.gain.setTargetAtTime(0.12 * speed, now, glide);
}

/** Short UI sounds: a falling drop for hover, two inharmonic partials for a press. */
export function playTick(kind: Tick) {
  if (!rig || !enabled) return;
  const { context, master } = rig;
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(master);
  const partials = kind === "liquid" ? [[880, 320]] : [[2090, 2090], [3170, 3170]];
  const length = kind === "liquid" ? 0.09 : 0.16;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(kind === "liquid" ? 0.12 : 0.05, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
  partials.forEach(([from, to]) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.setValueAtTime(from ?? 0, now);
    oscillator.frequency.exponentialRampToValueAtTime(to ?? 1, now + length);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + length + 0.02);
    oscillator.onended = () => oscillator.disconnect();
  });
  window.setTimeout(() => gain.disconnect(), (length + 0.1) * 1000);
}
