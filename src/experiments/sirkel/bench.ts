// Twelve beads spread evenly around a ring on a round tray, colored around the hue wheel like the dots in the demo
import { cylinder, mix, type BenchObject } from '../../lib/bench';

const BEADS = 12;
const CENTER = 9;
const RING = 6;

// The same lightness and chroma as the tag pills, so the beads read in both color schemes
const hue = (degrees: number) => `light-dark(oklch(60% 0.15 ${degrees}), oklch(80% 0.11 ${degrees}))`;

export default {
  parts: [
    ...cylinder([CENTER, CENTER], 9, 0, 1, mix('var(--muted)', 'var(--surface)', 30)),
    ...Array.from({ length: BEADS }, (_, i) => {
      const angle = (2 * Math.PI * i) / BEADS;
      const x = Math.round(CENTER + RING * Math.cos(angle));
      const y = Math.round(CENTER + RING * Math.sin(angle));
      return cylinder([x, y], 1.5, 1, 2, hue(25 + (360 / BEADS) * i));
    }).flat(),
  ],
} satisfies BenchObject;
