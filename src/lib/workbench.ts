import type { CollectionEntry } from 'astro:content';
import { TABLE, crate, draw, moved, type BenchObject, type Drawn } from './bench';

type Footprint = Drawn['footprint'];

const benches = import.meta.glob<{ default: BenchObject }>('../experiments/*/bench.ts', { eager: true });
const object = (id: string) => benches[`../experiments/${id}/bench.ts`]?.default ?? crate();

const GAP = 2;
const SHEET_MARGIN = 4;
const SHEET_WIDTH = 60;

const size = ({ footprint: [x0, y0, x1, y1] }: Drawn) => [x1 - x0, y1 - y0] as const;

function pack(items: Drawn[]) {
  const [width, depth] = [TABLE.width - 2 * GAP, TABLE.depth - 2 * GAP];
  const tallestFirst = [...items.keys()].sort((a, b) => items[b].height - items[a].height || a - b);
  const rows: number[][] = [];
  let used = Infinity;
  for (const i of tallestFirst) {
    const [w] = size(items[i]);
    if (w > width) return undefined;
    if (used + GAP + w > width) [rows[rows.length], used] = [[], -GAP];
    rows.at(-1)!.push(i);
    used += GAP + w;
  }
  const depths = rows.map((row) => Math.max(...row.map((i) => size(items[i])[1])));
  const spread = (room: number, sizes: number[]) =>
    (room - sizes.reduce((sum, s) => sum + s, 0) - GAP * (sizes.length - 1)) / (sizes.length + 1);
  const across = spread(depth, depths);
  if (across < 0) return undefined;

  const placed: Drawn[] = [];
  let y = GAP + across;
  for (const [r, row] of rows.entries()) {
    const along = spread(
      width,
      row.map((i) => size(items[i])[0]),
    );
    let x = GAP + along;
    for (const i of row) {
      const [w, d] = size(items[i]);
      const [x0, y0] = items[i].footprint;
      placed[i] = moved(items[i], Math.floor(x) - x0, Math.floor(y) + Math.floor((depths[r] - d) / 2) - y0);
      x += w + GAP + along;
    }
    y += depths[r] + GAP + across;
  }
  return placed;
}

function sheet(sketches: Drawn[]) {
  let [x, y, row, width] = [SHEET_MARGIN, SHEET_MARGIN, 0, 0];
  const placed = sketches.map((sketch) => {
    const [x0, y0, x1, y1] = sketch.footprint;
    if (x > SHEET_MARGIN && x + x1 - x0 > SHEET_WIDTH) [x, y, row] = [SHEET_MARGIN, y + row + SHEET_MARGIN, 0];
    const result = moved(sketch, x - x0, y - y0);
    [x, row, width] = [x + x1 - x0 + SHEET_MARGIN, Math.max(row, y1 - y0), Math.max(width, x + x1 - x0 + SHEET_MARGIN)];
    return result;
  });
  const paper: Drawn = {
    markup: '',
    footprint: [0, 0, width, y + row + SHEET_MARGIN],
    screen: [0, 0, 0, 0],
    height: Math.max(...sketches.map(({ height }) => height)),
  };
  return { paper, placed };
}

// The experiments come newest first. Returns the drawn objects on the table, the blueprint sheet if any, every object
// drawn on its own at the origin, and the ids of the experiments that didn't fit
export function arrange(experiments: CollectionEntry<'experiments'>[]) {
  const alone = new Map(experiments.map(({ id, data }) => [id, draw(object(id), data.status === 'skisse')]));
  const sketches = experiments
    .filter(({ data }) => data.status === 'skisse')
    .sort((a, b) => alone.get(b.id)!.height - alone.get(a.id)!.height);
  const others = experiments.filter(({ data }) => data.status !== 'skisse');
  const blueprint = sketches.length ? sheet(sketches.map(({ id }) => alone.get(id)!)) : undefined;
  const drawn = others.map(({ id }) => alone.get(id)!);

  for (let count = others.length; count >= 0; count--) {
    const items = drawn.slice(0, count);
    const placed = pack(blueprint ? [...items, blueprint.paper] : items);
    if (!placed) continue;
    const table = new Map(others.slice(0, count).map(({ id }, i) => [id, placed[i]]));
    let paper: Footprint | undefined;
    if (blueprint) {
      paper = placed[count].footprint;
      for (const [i, { id }] of sketches.entries()) table.set(id, moved(blueprint.placed[i], paper[0], paper[1]));
    }
    return { table, paper, alone, rest: experiments.filter(({ id }) => !table.has(id)).map(({ id }) => id) };
  }
  throw new Error('The blueprint sheet is too big for the workbench');
}
