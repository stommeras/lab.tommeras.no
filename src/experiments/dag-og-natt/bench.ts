// A model of the cabin on a patch of grass, with a tree behind it
import { box, cylinder, mix, type BenchObject, type Cuboid } from '../../lib/bench';

const grass = mix('var(--mint)', 'var(--mat)', 35);
const wall = mix('var(--pink)', 'var(--peach)', 60);
const board = mix('var(--pink)', 'var(--peach)', 80);
const roof = mix('var(--muted)', 'var(--fg)', 60);
const light = 'var(--peach)';
const frame = 'var(--surface)';

const parts: Cuboid[] = [box([0, 0, 0], [30, 24, 2], grass), box([5, 5, 2], [16, 12, 9], wall)];
// Every other row of wall boards a shade darker
for (let z = 3; z < 11; z += 2) parts.push(box([5, 5, z], [16, 12, 1], board));
// A gable roof that overhangs the walls by one voxel, with the gable walls inside it
for (let step = 0; 14 - 2 * step > 0; step++) {
  const z = 11 + step;
  parts.push(box([4, 4 + step, z], [18, 14 - 2 * step, 1], roof));
  if (10 - 2 * step > 0) parts.push(box([5, 6 + step, z], [16, 10 - 2 * step, 1], step % 2 ? board : wall));
}
parts.push(
  box([14, 7, 14], [2, 2, 6], mix('var(--pink)', 'var(--muted)', 40)),
  // Lit windows on the long wall, and the door and a gable window on the short one
  ...[7, 14].flatMap((x) => [box([x, 16, 4], [5, 1, 5], frame), box([x + 1, 16, 5], [3, 1, 3], light)]),
  box([20, 8, 2], [1, 5, 8], frame),
  box([20, 9, 2], [1, 3, 7], mix('var(--fg)', wall, 70)),
  box([20, 10, 13], [1, 2, 2], light),
  box([21, 9, 2], [6, 3, 1], mix('var(--muted)', 'var(--surface)', 40)),
  // A spruce, as stacked disks
  box([25, 4, 2], [2, 2, 3], mix('var(--peach)', 'var(--muted)', 50)),
  ...[3.5, 3, 2.5, 1.8, 1].flatMap((radius, i) =>
    cylinder([26, 5], radius, 5 + 2 * i, 2, mix('var(--mint)', 'var(--fg)', 75)),
  ),
);

export default { at: [6, 44], parts } satisfies BenchObject;
