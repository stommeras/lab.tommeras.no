// Three pages on top of each other, a little apart, like the steps of a transition
import { box, mix, type BenchObject } from '../../lib/bench';

const text = mix('var(--muted)', 'var(--surface)', 50);
const pages = [
  mix('var(--lavender)', 'var(--surface)', 40),
  mix('var(--pink)', 'var(--surface)', 30),
  'var(--surface)',
];

export default {
  at: [104, 36],
  parts: [
    ...pages.map((color, i) => box([3 * i, 2 * i, i], [16, 11, 1], color)),
    // A heading and lines of text on the top page
    box([8, 6, 2], [7, 1, 1], 'var(--lavender)'),
    ...[8, 10].map((y) => box([8, y, 2], [11, 1, 1], text)),
    box([8, 12, 2], [6, 1, 1], text),
  ],
} satisfies BenchObject;
