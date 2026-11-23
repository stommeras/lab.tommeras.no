// An hourglass with the sand running through the neck onto a pile below
import { box, cylinder, mix, type BenchObject, type Cuboid } from '../../lib/bench';

const [cx, cy] = [9, 9];
const FLOOR = 2; // the top of the bottom cap
const NECK = 13;
const CEILING = 24; // the bottom of the top cap
const BULB = 5.5; // the widest inner radius of each bulb

const sand = 'var(--peach)';
// Darker than the table in light mode and lighter in dark mode, so it stands out from it. Light mode darkens peach
// with black, which keeps its hue. A mix with the purple text color turns it wine red
const wood = `light-dark(${mix('var(--peach)', 'black', 65)}, ${mix('var(--wood)', 'var(--fg)', 70)})`;
const glass = mix('var(--mint)', 'var(--surface)', 20);

// The inner radius at height z: two round bulbs that pinch together at the neck
const inner = (z: number) => {
  const [from, to] = z < NECK ? [FLOOR, NECK] : [NECK, CEILING];
  return 1 + (BULB - 1) * Math.sin((Math.PI * (z + 0.5 - from)) / (to - from));
};

const parts: Cuboid[] = [];
for (let z = FLOOR; z < CEILING; z++) {
  const r = inner(z);
  parts.push(...cylinder([cx, cy], r + 1, z, 1, glass, true), ...cylinder([cx, cy], r, z, 1, 'none'));
  // The top bulb is half full, and the pile below is a cone that's narrower than the bulb
  if (z >= NECK && z < NECK + 5) parts.push(...cylinder([cx, cy], r, z, 1, sand));
  const pile = 5 - 0.9 * (z - FLOOR);
  if (z < NECK && pile > 0.5) parts.push(...cylinder([cx, cy], Math.min(r, pile), z, 1, sand));
}
parts.push(
  // The stream from the neck down to the pile
  box([cx, cy, FLOOR + 5], [1, 1, NECK - FLOOR - 5], sand),
  ...cylinder([cx, cy], 7.5, 0, FLOOR, wood),
  ...cylinder([cx, cy], 7.5, CEILING, 2, wood),
  // Three posts holding the caps apart: at the back and on each side, so none of them hides the neck
  ...[
    [cx - 5, cy - 5],
    [cx - 6, cy + 4],
    [cx + 4, cy - 6],
  ].map(([x, y]) => box([x, y, FLOOR], [1, 1, CEILING - FLOOR], wood)),
);

export default { at: [78, 3], parts } satisfies BenchObject;
