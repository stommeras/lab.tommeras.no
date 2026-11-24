import { box, mix, type BenchObject, type Cuboid } from '../../lib/bench';

const CELL = 2;
const glider = [
  [2, 1],
  [3, 2],
  [1, 3],
  [2, 3],
  [3, 3],
];
const blinker = [
  [7, 5],
  [7, 6],
  [7, 7],
];
const block = [
  [6, 1],
  [7, 1],
  [6, 2],
  [7, 2],
];

const at = (col: number, row: number, z: number, height: number, color: string) =>
  box([1 + CELL * col, 1 + CELL * row, z], [CELL, CELL, height], color);

const parts: Cuboid[] = [box([0, 0, 0], [22, 22, 2], mix('var(--muted)', 'var(--surface)', 30))];
for (let col = 0; col < 10; col++)
  for (let row = 0; row < 10; row++)
    if ((col + row) % 2) parts.push(at(col, row, 1, 1, mix('var(--muted)', 'var(--surface)', 40)));
for (const [col, row] of [...glider, ...blinker, ...block]) parts.push(at(col, row, 2, 2, 'var(--mint)'));

export default { parts } satisfies BenchObject;
