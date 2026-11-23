// Three pages on top of each other, a little apart, like the steps of a transition
import { box, mix, type BenchObject } from '../../lib/bench';

// Paper stays light in dark mode too, so the ink is mixed towards the background to stay darker than the paper
const paper = 'light-dark(var(--surface), var(--fg))';
const text = mix('var(--muted)', 'var(--bg)', 50);
const heading = mix('var(--lavender)', 'var(--bg)', 70);
const pages = [mix('var(--lavender)', paper, 40), mix('var(--pink)', paper, 30), paper];

export default {
  at: [104, 36],
  parts: [
    ...pages.map((color, i) => box([3 * i, 2 * i, i], [16, 11, 1], color)),
    // A heading and lines of text on the top page
    box([8, 6, 2], [7, 1, 1], heading),
    ...[8, 10].map((y) => box([8, y, 2], [11, 1, 1], text)),
    box([8, 12, 2], [6, 1, 1], text),
  ],
} satisfies BenchObject;
