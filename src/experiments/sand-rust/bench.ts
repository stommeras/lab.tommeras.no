import { box, cylinder, type BenchObject, type Cuboid } from '../../lib/bench';

const CENTER = 9;
const ROOT_RADIUS = 7;
const TIP_RADIUS = 9;
const TEETH = 12;
const color = 'var(--peach)';

const parts: Cuboid[] = [];
for (let x = 0; x < 2 * CENTER; x++)
  for (let y = 0; y < 2 * CENTER; y++) {
    const [dx, dy] = [x + 0.5 - CENTER, y + 0.5 - CENTER];
    const r = Math.hypot(dx, dy);
    const tooth = Math.cos(TEETH * Math.atan2(dy, dx)) > 0;
    if (r < ROOT_RADIUS || (r < TIP_RADIUS && tooth)) parts.push(box([x, y, 0], [1, 1, 2], color));
  }
parts.push(...cylinder([CENTER, CENTER], 3, 2, 1, color), ...cylinder([CENTER, CENTER], 1.5, 3, 7, color));

export default { parts } satisfies BenchObject;
