// Story positions and thresholds that both layers need: the scene keys its
// shot list on them and the DOM switches its text at the same moments.
// Story units are chapter index + progress inside the chapter.
export const beats = {
  /** field level above which the crown stands */
  criticalField: 0.34,
  /** where the crown's field starts to let go as the chapter leaves */
  fieldFall: 2.62,
  /** Hold changes form at these positions: bridge, slab, urchin */
  formSwitch: [4.22, 4.46],
  /** viewport heights each pinned chapter stays pinned for */
  pins: { crown: 1.5, part: 1, hold: 2 },
} as const;
