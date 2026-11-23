// An island like the ones the game generates: sand, grass, rock and snow up to the summit, a river down to the sea,
// and cairns marking the way up to the one on top
import { box, mix, type BenchObject, type Cuboid, type Vec3 } from '../../lib/bench';

const [W, D] = [28, 26];
const PEAK = [14, 12];
const SEA = 2;

// Light in both color schemes, unlike --surface
const snow = 'light-dark(var(--surface), var(--fg))';
const water = mix(mix('var(--lavender)', 'var(--mint)', 50), 'var(--surface)', 65);
const shallow = mix(water, snow, 70);
const sand = mix('var(--peach)', 'var(--surface)', 60);
const grass = mix('var(--mint)', 'var(--mat)', 35);
const rock = mix('var(--muted)', 'var(--surface)', 70);
const stones = [mix('var(--muted)', 'var(--surface)', 45), 'var(--muted)'];

// A cone with gentle bumps on it. The slow sines are a cheap noise that gives the same island on every build
const bumps = (x: number, y: number) => 1.2 * Math.sin(x * 0.5 + y * 0.3) + 0.9 * Math.sin(x * 0.35 - y * 0.55);
const heights = new Map<string, number>();
const height = (x: number, y: number) =>
  heights.get(`${x},${y}`) ?? Math.round(17 - 1.45 * Math.hypot((x - PEAK[0]) / 1.15, y - PEAK[1]) + bumps(x, y));

// The river runs from below the summit to the shore on the side facing the viewer, one voxel below the land around it
const river = new Set<string>();
const course = [
  [15, 14],
  [17, 17],
  [18, 20],
  [21, 22],
  [25, 24],
];
for (let i = 1; i < course.length; i++)
  for (let t = 0; t <= 1; t += 0.05) {
    const x = Math.round(course[i - 1][0] + t * (course[i][0] - course[i - 1][0]));
    const y = Math.round(course[i - 1][1] + t * (course[i][1] - course[i - 1][1]));
    for (const key of [`${x},${y}`, `${x + 1},${y}`]) river.add(key);
  }
for (const key of river) {
  const [x, y] = key.split(',').map(Number);
  heights.set(key, Math.max(SEA, height(x, y) - 1));
}

const surface = (h: number) => (h <= SEA + 1 ? sand : h <= 9 ? grass : h <= 11 ? rock : snow);
const parts: Cuboid[] = [box([0, 0, 0], [W, D, SEA], water)];
for (let x = 0; x < W; x++)
  for (let y = 0; y < D; y++) {
    const h = height(x, y);
    // The sea is lighter where the land is just under the surface. Not on the edge, where it would show on the side
    if (h <= SEA) {
      if (h >= SEA - 2 && x < W - 1 && y < D - 1) parts.push(box([x, y, SEA - 1], [1, 1, 1], shallow));
      continue;
    }
    parts.push(
      box([x, y, 0], [1, 1, h - 1], rock),
      box([x, y, h - 1], [1, 1, 1], river.has(`${x},${y}`) ? water : surface(h)),
    );
  }

// A cairn of stones in alternating shades, narrowing towards the top
const cairn = ([x, y]: [number, number], layers: number[]) => {
  let z = height(x, y);
  layers.forEach((size, i) => {
    const at: Vec3 = [x - Math.floor(size / 2), y - Math.floor(size / 2), z];
    parts.push(box(at, [size, size, 1], stones[i % 2]));
    z++;
  });
};
cairn([PEAK[0], PEAK[1]], [3, 3, 3, 2, 2, 2, 1, 1]);
cairn([9, 17], [2, 1, 1]);
cairn([7, 9], [2, 1, 1]);

export default { at: [4, 4], parts } satisfies BenchObject;
