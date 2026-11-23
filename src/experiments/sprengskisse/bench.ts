// An exploded keyboard: the keycaps float above their switches, and the escape key furthest out
import { box, mix, type BenchObject, type Cuboid } from '../../lib/bench';

const cap = 'var(--surface)';
const stem = 'var(--mint)';
const parts: Cuboid[] = [
  box([0, 0, 0], [46, 21, 2], mix('var(--muted)', 'var(--surface)', 45)),
  box([1, 1, 2], [44, 19, 1], mix('var(--muted)', 'var(--surface)', 70)),
];

// A key on a 4-voxel pitch, `wide` keys across, with a switch under each end
const key = (col: number, row: number, color = cap, wide = 1, z = 5) => {
  const [x, y] = [2 + 4 * col, 1 + 4 * row];
  parts.push(box([x, y, z], [4 * wide - 1, 3, 2], color));
  for (const end of new Set([col, col + wide - 1])) parts.push(box([3 + 4 * end, y + 1, 3], [1, 1, 2], stem));
};

for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) if (row || col) key(col, row);
key(0, 0, 'var(--pink)', 1, 8);
key(0, 4, cap);
key(1, 4, cap);
key(2, 4, cap, 6);
for (const col of [8, 9, 10]) key(col, 4, 'var(--lavender)');

export default { parts } satisfies BenchObject;
