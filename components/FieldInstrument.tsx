"use client";

import { useRef } from "react";
import type { ChangeEvent } from "react";
import { useTicker } from "@/hooks/useTicker";
import { beats } from "@/lib/beats";
import { crown } from "@/lib/content";
import { store } from "@/lib/store";

const { instrument } = crown;

// A real range input for the field over the crown. Until it is touched the
// scroll drives the field and the thumb follows it; a touch takes over until
// the chapter is left.
export function FieldInstrument() {
  const input = useRef<HTMLInputElement>(null);
  const output = useRef<HTMLOutputElement>(null);
  const shown = useRef(-1);

  useTicker(() => {
    if (store.field >= 0 && (store.story < 1.9 || store.story > 3)) store.field = -1;

    const range = input.current;
    const level = store.fieldLevel;
    if (!range || Math.abs(level - shown.current) < 0.004) return;
    // Without the scene nothing writes the level; keep the heading at full mass.
    if (document.documentElement.dataset.scene !== "ready") return;
    shown.current = level;

    range.value = level.toFixed(2);
    if (!store.reducedMotion) range.closest("section")?.style.setProperty("--field", level.toFixed(3));
    const reading = level > beats.criticalField ? instrument.above : instrument.below;
    if (output.current && output.current.textContent !== reading) output.current.textContent = reading;
  });

  const setField = (event: ChangeEvent<HTMLInputElement>) => {
    store.field = Number(event.target.value);
  };

  return (
    <div className="flex max-w-sm flex-col gap-1">
      <div className="type-micro flex justify-between gap-4">
        <label htmlFor="field-strength">{instrument.label}</label>
        <output ref={output} htmlFor="field-strength" className="text-graphite">
          {instrument.below}
        </output>
      </div>
      <input
        ref={input}
        id="field-strength"
        type="range"
        min={0}
        max={1}
        step={0.01}
        defaultValue={0}
        aria-describedby="field-strength-hint"
        className="field-range"
        onChange={setField}
      />
      <p id="field-strength-hint" className="type-micro text-graphite">
        {instrument.hint}
      </p>
    </div>
  );
}
