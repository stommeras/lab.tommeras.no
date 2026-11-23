// A roll of tape, which is a circle with a hole in it, with the loose end stuck to the mat
import { box, cylinder, mix, type BenchObject } from '../../lib/bench';

export default {
  at: [40, 62],
  parts: [
    ...cylinder([9, 9], 8, 0, 6, 'var(--pink)'),
    ...cylinder([9, 9], 5, 0, 6, mix('var(--peach)', 'var(--surface)', 50)),
    ...cylinder([9, 9], 4, 0, 6, 'none'),
    box([17, 8, 0], [5, 3, 1], 'var(--pink)'),
  ],
} satisfies BenchObject;
