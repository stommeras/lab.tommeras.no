// A globe on a stand, dotted with points spread evenly over the sphere
import { box, cylinder, ellipsoid, mix, type BenchObject, type Vec3 } from '../../lib/bench';

const CENTER: Vec3 = [10, 10, 13];
const RADIUS = 9;
// A Fibonacci lattice of unit vectors
const POINTS = 24;
const points = Array.from({ length: POINTS }, (_, i) => {
  const z = 1 - (2 * (i + 0.5)) / POINTS;
  const angle = Math.PI * (3 - Math.sqrt(5)) * i;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(angle), r * Math.sin(angle), z];
});

// A voxel is a dot when its direction from the center is close to one of the points
const dotted = ([x, y, z]: Vec3) => {
  const v = [x + 0.5 - CENTER[0], y + 0.5 - CENTER[1], z + 0.5 - CENTER[2]];
  const length = Math.hypot(...v);
  const near = points.some((p) => p.reduce((sum, c, i) => sum + c * v[i], 0) / length > 0.975);
  return near ? 'var(--pink)' : 'var(--lavender)';
};

const stand = mix('var(--muted)', 'var(--surface)', 60);

export default {
  at: [52, 4],
  parts: [
    ...cylinder([10, 10], 5, 0, 2, stand),
    box([9, 9, 2], [2, 2, 3], stand),
    ...ellipsoid(CENTER, RADIUS, dotted),
  ],
} satisfies BenchObject;
