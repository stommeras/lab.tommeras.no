import { box, mix, type BenchObject, type Cuboid } from '../../lib/bench';

// A dark block of fjord and mountains, with a folded curtain of aurora standing over it
const night = mix('var(--lavender)', 'var(--surface)', 25);
const rock = mix('var(--muted)', 'var(--surface)', 55);
const water = mix('var(--lavender)', 'var(--surface)', 55);

const parts: Cuboid[] = [box([0, 0, 0], [20, 14, 1], night), box([0, 5, 0], [20, 4, 1], water)];
for (let x = 0; x < 20; x++) {
  const left = Math.round(3 + 2.5 * Math.sin(x * 0.7) + (x % 3));
  const right = Math.round(2 + 2 * Math.cos(x * 0.5) + ((x * 7) % 3));
  parts.push(box([x, 0, 1], [1, 5, left], rock), box([x, 9, 1], [1, 5, right], rock));
}
for (let x = 0; x < 20; x++) {
  const y = Math.round(6 + 2.5 * Math.sin(x * 0.45));
  const height = 8 + Math.round(4 * Math.abs(Math.sin(x * 1.3)));
  parts.push(
    box([x, y, 10], [1, 1, 1], 'var(--pink)'),
    box([x, y, 11], [1, 1, height - 4], 'var(--mint)'),
    box([x, y, 7 + height], [1, 1, 4], 'var(--lavender)'),
  );
}

export default { parts } satisfies BenchObject;
