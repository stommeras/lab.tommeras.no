// A gear on an axle, for Rust. It's only a sketch so far, so the workbench draws it as lines on blueprint paper
import { box, cylinder, type BenchObject, type Cuboid } from '../../lib/bench';

const C = 9; // the center of the gear
const ROOT = 7; // the radius where the teeth start
const TIP = 9;
const TEETH = 12;
const color = 'var(--peach)';

const parts: Cuboid[] = [];
for (let x = 0; x < 2 * C; x++)
  for (let y = 0; y < 2 * C; y++) {
    const [dx, dy] = [x + 0.5 - C, y + 0.5 - C];
    const r = Math.hypot(dx, dy);
    const tooth = Math.cos(TEETH * Math.atan2(dy, dx)) > 0;
    if (r < ROOT || (r < TIP && tooth)) parts.push(box([x, y, 0], [1, 1, 2], color));
  }
parts.push(...cylinder([C, C], 3, 2, 1, color), ...cylinder([C, C], 1.5, 3, 7, color));

export default { parts } satisfies BenchObject;
