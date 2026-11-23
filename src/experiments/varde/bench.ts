// A small cairn of stacked stones
import { ellipsoid, mix, type BenchObject } from '../../lib/bench';

const light = mix('var(--muted)', 'var(--surface)', 45);
const mid = mix('var(--muted)', 'var(--surface)', 70);
const dark = 'var(--muted)';

export default {
  at: [12, 12],
  parts: [
    ...ellipsoid([8, 7, 1], [7.5, 6.5, 3.5], mid),
    ...ellipsoid([8, 7, 5], [6, 5.5, 2.5], light),
    ...ellipsoid([8, 6, 9], [4.8, 4.2, 2.2], dark),
    ...ellipsoid([9, 7, 12], [3.6, 3.2, 1.8], mid),
    ...ellipsoid([8, 7, 15], [2.5, 2.2, 1.6], light),
    ...ellipsoid([8, 7, 17], [1.5, 1.5, 1.2], dark),
  ],
} satisfies BenchObject;
