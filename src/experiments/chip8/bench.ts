// Two game cartridges, one standing and one lying down
import { box, mix, type BenchObject } from '../../lib/bench';

const plastic = mix('var(--muted)', 'var(--surface)', 50);
const groove = mix('var(--muted)', 'var(--surface)', 75);
const print = mix('var(--lavender)', 'var(--fg)', 60);

export default {
  parts: [
    // Standing, with the label on the side facing +y and a notch for the contacts
    box([0, 0, 0], [14, 4, 17], plastic),
    box([3, 0, 0], [8, 4, 1], 'none'),
    ...[13, 15].map((z) => box([1, 3, z], [12, 1, 1], groove)),
    box([2, 3, 2], [10, 1, 9], 'var(--lavender)'),
    box([2, 3, 9], [10, 1, 2], 'var(--pink)'),
    box([3, 3, 6], [7, 1, 1], print),
    box([3, 3, 4], [4, 1, 1], print),
    // Lying down, label up
    box([0, 7, 0], [14, 17, 4], plastic),
    box([2, 9, 3], [10, 10, 1], 'var(--mint)'),
    box([2, 9, 3], [10, 2, 1], 'var(--peach)'),
    ...[21, 22].map((y) => box([1, y, 3], [12, 1, 1], y % 2 ? groove : plastic)),
  ],
} satisfies BenchObject;
