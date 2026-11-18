import { gsap, useGSAP } from "@/lib/gsap";

/** Runs `callback` on every GSAP tick while the component is mounted. */
export function useTicker(callback: () => void) {
  useGSAP(() => {
    gsap.ticker.add(callback);
    return () => gsap.ticker.remove(callback);
  });
}
