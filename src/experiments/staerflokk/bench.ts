import { box, mix, type BenchObject, type Cuboid } from '../../lib/bench';

// A glass pane with a flock of starlings in it, standing on a dark base
const W = 22;
const H = 16;
const base = mix('var(--muted)', 'var(--surface)', 40);
const glass =
  'light-dark(color-mix(in oklch, var(--peach) 30%, transparent), color-mix(in oklch, var(--pink) 25%, transparent))';
const bird = 'light-dark(var(--fg), var(--bg))';

const parts: Cuboid[] = [box([0, 0, 0], [W + 2, 4, 2], base), box([1, 1, 2], [W, 2, H], glass, true)];
// A murmuration bends like a ribbon, so the birds follow a wave with its thickness changing along it
for (let x = 2; x < W; x++) {
  const center = 9 + 4 * Math.sin(x / 3.2);
  const half = 1 + Math.round(1.5 + 1.5 * Math.sin(x / 2.1 + 1));
  for (let z = Math.round(center - half); z <= Math.round(center + half); z++)
    if ((x * 7 + z * 13) % 5 !== 0) parts.push(box([x, 2, z], [1, 1, 1], bird));
}

export default { parts } satisfies BenchObject;
