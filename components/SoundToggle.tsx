"use client";

import { useEffect, useState } from "react";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { useTicker } from "@/hooks/useTicker";
import { followScene, playTick, setSound, setSoundVisible } from "@/lib/audio";
import { sound } from "@/lib/content";

const interactive = "a, button, input";

export function SoundToggle() {
  const [on, setOn] = useState(false);

  useTicker(followScene);

  useEffect(() => {
    let hovered: Element | null = null;
    const over = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest(interactive) : null;
      if (target && target !== hovered && event.pointerType === "mouse") playTick("liquid");
      hovered = target;
    };
    const press = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest(interactive)) playTick("metal");
    };
    const visibility = () => setSoundVisible(!document.hidden);
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("click", press);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("click", press);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  const toggle = () => {
    setSound(!on);
    setOn(!on);
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      data-goo=""
      onClick={toggle}
      className="pointer-events-auto grid size-11 place-items-center rounded-full bg-ink text-chalk transition-colors duration-200 ease-settle hover:text-mineral aria-pressed:bg-field aria-pressed:hover:text-chalk max-md:fixed max-md:right-4 max-md:bottom-4"
    >
      {on ? <LuVolume2 aria-hidden className="size-5" /> : <LuVolumeX aria-hidden className="size-5" />}
      <span className="sr-only">{sound.label}</span>
    </button>
  );
}
