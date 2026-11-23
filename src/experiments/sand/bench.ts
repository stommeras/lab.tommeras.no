// A glass jar of layered sand, with a little spilled next to it
import { box, cylinder, mix, type BenchObject } from '../../lib/bench';

const sand = 'var(--peach)';
const layers = [sand, mix('var(--peach)', 'var(--pink)', 55), mix('var(--peach)', 'var(--surface)', 60), sand];

export default {
  at: [40, 32],
  parts: [
    ...cylinder([9, 9], 8, 0, 20, mix('var(--mint)', 'var(--surface)', 25), true),
    ...cylinder([9, 9], 6.8, 1, 19, 'none'),
    ...layers.flatMap((color, i) => cylinder([9, 9], 6.8, 1 + 3 * i, 3, color)),
    ...cylinder([9, 9], 4.5, 13, 1, sand),
    ...cylinder([9, 9], 8.4, 20, 3, 'var(--lavender)'),
    box([15, 17, 0], [4, 2, 1], sand),
    box([16, 16, 0], [2, 4, 1], sand),
    box([16, 17, 1], [2, 1, 1], sand),
  ],
} satisfies BenchObject;
