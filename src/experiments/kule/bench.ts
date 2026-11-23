import { cylinder, ellipsoid, mix, box, type BenchObject, type Cuboid, type Vec3 } from '../../lib/bench';

const POINTS = 80;
const POINT_RADIUS = 7.5;
const GLASS_RADIUS = 9;
const [cx, cy, cz] = [10, 10, 11];
const golden = Math.PI * (3 - Math.sqrt(5));
const stand = mix('var(--muted)', 'var(--surface)', 60);
const glass =
  'light-dark(color-mix(in oklch, var(--surface) 40%, transparent), color-mix(in oklch, var(--fg) 30%, transparent))';

const parts: Cuboid[] = [
  ...ellipsoid([cx, cy, cz], GLASS_RADIUS, glass).map((part) => ({ ...part, glass: true })),
  ...ellipsoid([cx, cy, cz], GLASS_RADIUS - 1, 'none'),
  ...cylinder([cx, cy], 4, 0, 1, stand),
  ...cylinder([cx, cy], 3, 1, 2, stand),
];
for (let i = 0; i < POINTS; i++) {
  const z = 1 - (2 * (i + 0.5)) / POINTS;
  const r = Math.sqrt(1 - z * z);
  const point = [
    cx + POINT_RADIUS * r * Math.cos(golden * i),
    cy + POINT_RADIUS * r * Math.sin(golden * i),
    cz + POINT_RADIUS * z,
  ];
  const at = point.map((c) => Math.floor(c)) as Vec3;
  parts.push(box(at, [1, 1, 1], mix('var(--pink)', 'var(--lavender)', Math.round(((z + 1) / 2) * 100))));
}

export default { parts } satisfies BenchObject;
