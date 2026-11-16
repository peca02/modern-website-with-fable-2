import { liquidModel, setBlob, type LiquidState } from "@/scene/liquid/model";

export type PullTarget = { x: number; y: number };

// Chapter 1: one sessile drop. A second lobe hides inside it and travels
// toward the pointer, so the body leans without ever losing its single mass.
export class RestingDrop {
  private leanX = 0;
  private leanY = 0;

  update(state: LiquidState, delta: number, time: number, target: PullTarget | null, still: boolean) {
    const { rest, lean } = liquidModel;
    const centreY = rest.lift * rest.squash;

    let goalX = still ? 0 : Math.sin(time * 0.31) * 0.06;
    let goalY = still ? 0 : Math.cos(time * 0.23) * 0.04;
    if (target) {
      const dx = target.x;
      const dy = Math.max(target.y, 0.1) - centreY;
      const distance = Math.hypot(dx, dy);
      const pull = lean.reach / (1 + (distance / lean.range) ** 2);
      const scale = distance > pull ? pull / distance : 1;
      goalX = dx * scale;
      goalY = dy * scale;
    }

    const ease = still ? 1 : 1 - Math.exp(-delta * lean.follow);
    this.leanX += (goalX - this.leanX) * ease;
    this.leanY += (goalY - this.leanY) * ease;

    const extension = Math.hypot(this.leanX, this.leanY) / lean.reach;
    const breath = still ? 0 : Math.sin(time * 0.7) * 0.006;
    // The lobe thins as it travels, which turns the bulge into a shoulder.
    const lobeRadius = lean.radius * (1 - 0.18 * extension);
    const lobeY = Math.max(rest.lift + this.leanY / rest.squash, lobeRadius * 0.6);

    state.squash = rest.squash;
    state.blend = rest.blend;
    state.count = 2;
    // The main mass gives up what the lobe carries away, so the body leans instead of growing.
    const mainRadius = rest.radius * (1 + breath - 0.07 * extension);
    setBlob(state, 0, this.leanX * 0.22, rest.lift, 0, mainRadius);
    setBlob(state, 1, this.leanX, lobeY, 0, lobeRadius);
  }
}
