import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase, useGSAP);

// Motion language. Same curves as --ease-settle / --ease-tension in globals.css.
CustomEase.create("settle", "0.16, 1, 0.3, 1");
CustomEase.create("tension", "0.34, 1.56, 0.64, 1");

export const ease = { settle: "settle", tension: "tension" } as const;
export const duration = { quick: 0.4, base: 0.8, slow: 1.4 } as const;

gsap.defaults({ ease: ease.settle, duration: duration.base });

export const motionQueries = {
  full: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
} as const;

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, useGSAP };
