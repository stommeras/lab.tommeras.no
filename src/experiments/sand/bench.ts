import { box, cylinder, mix, type BenchObject, type Cuboid } from '../../lib/bench';

const [cx, cy] = [9, 9];
const BOTTOM_CAP_TOP = 2;
const NECK = 13;
const TOP_CAP_BOTTOM = 24;
const BULB_RADIUS = 5.5;

const sand = 'var(--peach)';
const wood = `light-dark(${mix('var(--peach)', 'black', 65)}, ${mix('var(--wood)', 'var(--fg)', 70)})`;
const glass = mix('var(--mint)', 'var(--surface)', 20);

const inner = (z: number) => {
  const [from, to] = z < NECK ? [BOTTOM_CAP_TOP, NECK] : [NECK, TOP_CAP_BOTTOM];
  return 1 + (BULB_RADIUS - 1) * Math.sin((Math.PI * (z + 0.5 - from)) / (to - from));
};

const parts: Cuboid[] = [];
for (let z = BOTTOM_CAP_TOP; z < TOP_CAP_BOTTOM; z++) {
  const r = inner(z);
  parts.push(...cylinder([cx, cy], r + 1, z, 1, glass, true), ...cylinder([cx, cy], r, z, 1, 'none'));
  if (z >= NECK && z < NECK + 5) parts.push(...cylinder([cx, cy], r, z, 1, sand));
  const pile = 5 - 0.9 * (z - BOTTOM_CAP_TOP);
  if (z < NECK && pile > 0.5) parts.push(...cylinder([cx, cy], Math.min(r, pile), z, 1, sand));
}
const stream = box([cx, cy, BOTTOM_CAP_TOP + 5], [1, 1, NECK - BOTTOM_CAP_TOP - 5], sand);
const caps = [...cylinder([cx, cy], 7.5, 0, BOTTOM_CAP_TOP, wood), ...cylinder([cx, cy], 7.5, TOP_CAP_BOTTOM, 2, wood)];
const postsClearOfTheNeck = [
  [cx - 5, cy - 5],
  [cx - 6, cy + 4],
  [cx + 4, cy - 6],
].map(([x, y]) => box([x, y, BOTTOM_CAP_TOP], [1, 1, TOP_CAP_BOTTOM - BOTTOM_CAP_TOP], wood));
parts.push(stream, ...caps, ...postsClearOfTheNeck);

export default { parts } satisfies BenchObject;
