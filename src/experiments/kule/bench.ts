// Points spread over a sphere with the golden angle, as loose cubes around a stand, pink at the top and lavender at
// the bottom like in the demo
import { box, cylinder, mix, type BenchObject, type Cuboid, type Vec3 } from '../../lib/bench';

const POINTS = 90;
const RADIUS = 9;
const [cx, cy, cz] = [10, 10, 13];
const golden = Math.PI * (3 - Math.sqrt(5));
const stand = mix('var(--muted)', 'var(--surface)', 60);

const parts: Cuboid[] = [...cylinder([cx, cy], 4, 0, 1, stand), box([cx, cy, 1], [1, 1, cz - 1], stand)];
for (let i = 0; i < POINTS; i++) {
  const z = 1 - (2 * (i + 0.5)) / POINTS;
  const r = Math.sqrt(1 - z * z);
  const point = [cx + RADIUS * r * Math.cos(golden * i), cy + RADIUS * r * Math.sin(golden * i), cz + RADIUS * z];
  // One voxel per point
  const at = point.map((c) => Math.floor(c)) as Vec3;
  parts.push(box(at, [1, 1, 1], mix('var(--pink)', 'var(--lavender)', Math.round(((z + 1) / 2) * 100))));
}

export default { at: [52, 4], parts } satisfies BenchObject;
