// The voxel workbench on the front page, drawn as SVG at build time. Each experiment can have an object on the table
// in src/experiments/<slug>/bench.ts, and src/lib/workbench.ts places them. World units are voxels: x runs right and down the screen, y left and down, z up.
// The 2:1 isometric projection maps (x, y, z) to (x - y, (x + y) / 2 - z), so a voxel's top is a diamond two units
// wide and one tall, and a unit of height is one unit on screen.

export type Vec3 = [x: number, y: number, z: number];

export interface Cuboid {
  at: Vec3;
  size: Vec3;
  // Any CSS color, usually a token or a color-mix() of tokens. 'none' carves the voxels out again
  color: string;
  // Drawn see-through, and doesn't hide the faces behind it
  glass?: boolean;
}

// The workbench places each object on the table itself, so the parts only need to be right relative to each other
export interface BenchObject {
  // Later parts paint over earlier ones where they overlap
  parts: Cuboid[];
}

// The cutting mat, in voxels. Its top is at z = 0, where the objects stand
export const TABLE = { width: 132, depth: 84, thickness: 1 };

export const mix = (a: string, b: string, percent: number) => `color-mix(in oklch, ${a} ${percent}%, ${b})`;

export const box = (at: Vec3, size: Vec3, color: string, glass = false): Cuboid => ({ at, size, color, glass });

// Columns of voxels inside a circle around the grid point (cx, cy)
export function cylinder(
  [cx, cy]: [number, number],
  radius: number,
  z: number,
  height: number,
  color: string,
  glass = false,
) {
  const parts: Cuboid[] = [];
  for (let y = -Math.ceil(radius); y < Math.ceil(radius); y++) {
    const half = Math.round(Math.sqrt(radius ** 2 - (y + 0.5) ** 2));
    if (half > 0) parts.push(box([cx - half, cy + y, z], [2 * half, 1, height], color, glass));
  }
  return parts;
}

// Voxels whose centers lie inside an ellipsoid around a grid point. The color can depend on the voxel
export function ellipsoid(center: Vec3, radius: number | Vec3, color: string | ((voxel: Vec3) => string)) {
  const [rx, ry, rz] = typeof radius === 'number' ? [radius, radius, radius] : radius;
  const parts: Cuboid[] = [];
  for (let x = -Math.ceil(rx); x < rx; x++)
    for (let y = -Math.ceil(ry); y < ry; y++)
      for (let z = -Math.ceil(rz); z < rz; z++) {
        if (((x + 0.5) / rx) ** 2 + ((y + 0.5) / ry) ** 2 + ((z + 0.5) / rz) ** 2 > 1) continue;
        const at: Vec3 = [center[0] + x, center[1] + y, center[2] + z];
        parts.push(box(at, [1, 1, 1], typeof color === 'string' ? color : color(at)));
      }
  return parts;
}

// A plain wooden crate, for experiments without a bench.ts
export const CRATE = 12;
export const crate = (): BenchObject => {
  const wood = mix('var(--peach)', 'var(--surface)', 55);
  const slat = mix('var(--peach)', 'var(--muted)', 70);
  const inner = CRATE - 4;
  return {
    // Darker boards two voxels wide along every edge, with lighter panels between them
    parts: [
      box([0, 0, 0], [CRATE, CRATE, 10], slat),
      box([0, 2, 2], [CRATE, inner, 6], wood),
      box([2, 0, 2], [inner, CRATE, 6], wood),
      box([2, 2, 8], [inner, inner, 2], wood),
      // A gap between the planks of each panel
      box([0, 2, 5], [CRATE, inner, 1], slat),
      box([2, 0, 5], [inner, CRATE, 1], slat),
    ],
  };
};

const project = (x: number, y: number, z: number) => [x - y, (x + y) / 2 - z] as const;

// SVG path data through world points, closed into a shape unless it's a line
export const outline = (points: Vec3[]) =>
  'M' + points.map((point) => project(...point).join(' ')).join('L') + (points.length > 2 ? 'Z' : '');

// A rectangle on the table, or at another height
export const rectangle = (x0: number, y0: number, x1: number, y1: number, z = 0) =>
  outline([
    [x0, y0, z],
    [x1, y0, z],
    [x1, y1, z],
    [x0, y1, z],
  ]);

interface Voxel {
  color: string;
  glass: boolean;
}

interface Paint {
  depth: number;
  // 't' for top, 'x' and 'y' for the sides facing +x and +y
  face: string;
  color: string;
  // The face's coordinate along its normal, so two neighbors on screen with the same face and plane are one surface
  plane: number;
}

export interface Drawn {
  // The faces as SVG paths
  markup: string;
  // The area the object covers on the table, in world units
  footprint: [x0: number, y0: number, x1: number, y1: number];
  // The bounding box on screen, in projected units
  screen: [left: number, top: number, right: number, bottom: number];
  // In voxels above the table
  height: number;
}

// The screen is a lattice of triangles, and every visible face covers exactly two of them. A triangle is known by its
// column c (it spans x from c to c + 1) and k, twice the y of the top of its vertical edge. The vertical edge is on the
// left when k and c have the same parity, else on the right. So instead of painting faces back to front, each
// triangle keeps the face of the voxel nearest the viewer, the one with the largest x + y + z. Runs of triangles in a
// column with the same paint then merge into one quadrilateral, and the output grows with the number of color
// changes rather than with the number of voxels.
type Buffer = Map<number, Map<number, Paint>>;

function paint(buffer: Buffer, c: number, k: number, value: Paint) {
  let column = buffer.get(c);
  if (!column) buffer.set(c, (column = new Map()));
  const current = column.get(k);
  if (!current || current.depth < value.depth) column.set(k, value);
}

// One <path> per paint, made of the runs in each column
function trace(buffer: Buffer, keep: (c: number, k: number, value: Paint) => boolean = () => true) {
  const paths = new Map<string, string>();
  for (const [c, column] of buffer) {
    const ks = [...column.keys()].filter((k) => keep(c, k, column.get(k)!)).sort((a, b) => a - b);
    for (let i = 0; i < ks.length;) {
      const { face, color } = column.get(ks[i])!;
      let j = i;
      while (j + 1 < ks.length && ks[j + 1] === ks[j] + 1) {
        const next = column.get(ks[j + 1])!;
        if (next.face !== face || next.color !== color) break;
        j++;
      }
      const leftEdge = (k: number) => (k - c) % 2 === 0;
      const [k1, k2] = [ks[i], ks[j]];
      const [lt, rt] = leftEdge(k1) ? [k1 / 2, k1 / 2 + 0.5] : [k1 / 2 + 0.5, k1 / 2];
      const [lb, rb] = leftEdge(k2) ? [k2 / 2 + 1, k2 / 2 + 0.5] : [k2 / 2 + 0.5, k2 / 2 + 1];
      const key = `${face}|${color}`;
      paths.set(key, (paths.get(key) ?? '') + `M${c} ${lt}L${c + 1} ${rt}V${rb}L${c} ${lb}Z`);
      i = j + 1;
    }
  }
  return [...paths].map(([key, d]) => {
    const [face, color] = key.split('|');
    return `<path class="${face}" style="--c:${color}" d="${d}"/>`;
  });
}

// The lines where one surface meets another or the background, as one path. A triangle meets its neighbors in the
// same column across its slanted edges, and the one in the next column across its vertical edge
function edges(buffer: Buffer) {
  const at = (c: number, k: number) => buffer.get(c)?.get(k);
  const segments = new Set<string>();
  const slanted = (c: number, k: number) =>
    (k - c) % 2 === 0 ? `M${c} ${k / 2 + 1}L${c + 1} ${k / 2 + 0.5}` : `M${c} ${k / 2 + 0.5}L${c + 1} ${k / 2 + 1}`;
  for (const [c, column] of buffer)
    for (const [k, self] of column) {
      const left = (k - c) % 2 === 0;
      const neighbors: [Paint | undefined, string][] = [
        [at(c, k - 1), slanted(c, k - 1)],
        [at(c, k + 1), slanted(c, k)],
        [at(left ? c - 1 : c + 1, k), `M${left ? c : c + 1} ${k / 2}v1`],
      ];
      for (const [other, segment] of neighbors)
        if (!other || other.face !== self.face || other.plane !== self.plane) segments.add(segment);
    }
  return [...segments].join('');
}

// With sketch, the object is drawn as a line drawing: every face in one color, with lines along its edges
export function draw({ parts }: BenchObject, sketch = false): Drawn {
  const voxels = new Map<string, Voxel>();
  for (const { at, size, color, glass = false } of parts)
    for (let x = at[0]; x < at[0] + size[0]; x++)
      for (let y = at[1]; y < at[1] + size[1]; y++)
        // The table cuts off anything below it
        for (let z = Math.max(0, at[2]); z < at[2] + size[2]; z++) {
          const key = `${x},${y},${z}`;
          if (color === 'none') voxels.delete(key);
          // A drawing has no glass or colors
          else voxels.set(key, sketch ? { color: 'var(--paper)', glass: false } : { color, glass });
        }
  if (!voxels.size) throw new Error('A bench object has no voxels');

  // A face is hidden behind an opaque neighbor, and between two glass voxels
  const hidden = (self: Voxel, x: number, y: number, z: number) => {
    const neighbor = voxels.get(`${x},${y},${z}`);
    return !!neighbor && (!neighbor.glass || self.glass);
  };

  const solid: Buffer = new Map();
  const glass: Buffer = new Map();
  let [x0, y0, x1, y1, top] = [Infinity, Infinity, -Infinity, -Infinity, 0];
  for (const [key, voxel] of voxels) {
    const [x, y, z] = key.split(',').map(Number);
    [x0, y0, x1, y1, top] = [
      Math.min(x0, x),
      Math.min(y0, y),
      Math.max(x1, x + 1),
      Math.max(y1, y + 1),
      Math.max(top, z + 1),
    ];
    const depth = x + y + z;
    const buffer = voxel.glass ? glass : solid;
    // The back corner of the voxel's top face
    const [sx, sy] = project(x, y, z + 1);
    const k = 2 * sy;
    const faces = [
      [
        't',
        z + 1,
        hidden(voxel, x, y, z + 1),
        [
          [sx - 1, k],
          [sx, k],
        ],
      ],
      [
        'y',
        y + 1,
        hidden(voxel, x, y + 1, z),
        [
          [sx - 1, k + 1],
          [sx - 1, k + 2],
        ],
      ],
      [
        'x',
        x + 1,
        hidden(voxel, x + 1, y, z),
        [
          [sx, k + 1],
          [sx, k + 2],
        ],
      ],
    ] as const;
    for (const [face, plane, isHidden, triangles] of faces)
      if (!isHidden) for (const [c, t] of triangles) paint(buffer, c, t, { depth, face, color: voxel.color, plane });
  }

  // Glass shows only where it's in front of the solid voxels
  const inFront = (c: number, k: number, { depth }: Paint) => (solid.get(c)?.get(k)?.depth ?? -Infinity) < depth;
  const glassPaths = trace(glass, inFront);
  const markup =
    trace(solid).join('') +
    (glassPaths.length ? `<g class="glass">${glassPaths.join('')}</g>` : '') +
    (sketch ? `<path class="edges" d="${edges(solid)}"/>` : '');

  // Every corner of every voxel is within the hull of the footprint's corners at the bottom and top
  const corners = [x0, x1].flatMap((cx) => [y0, y1].flatMap((cy) => [project(cx, cy, 0), project(cx, cy, top)]));
  const screen = [
    Math.min(...corners.map(([sx]) => sx)),
    Math.min(...corners.map(([, sy]) => sy)),
    Math.max(...corners.map(([sx]) => sx)),
    Math.max(...corners.map(([, sy]) => sy)),
  ] as Drawn['screen'];
  return { markup, footprint: [x0, y0, x1, y1], screen, height: top };
}

// The same drawing moved across the table
export function moved(
  { markup, footprint: [x0, y0, x1, y1], screen: [l, t, r, b], height }: Drawn,
  dx: number,
  dy: number,
) {
  const [sx, sy] = project(dx, dy, 0);
  return {
    markup: `<g transform="translate(${sx} ${sy})">${markup}</g>`,
    footprint: [x0 + dx, y0 + dy, x1 + dx, y1 + dy],
    screen: [l + sx, t + sy, r + sx, b + sy],
    height,
  } satisfies Drawn;
}
