// One frame is five passes: clear the grid, count birds per cell, prefix sum the counts into cell starts, scatter
// the birds into cell order, then update each bird from its neighbours in the 3x3 cells around it. The update reads
// the sorted copy and writes back to birds, so a bird's index changes every frame, which nothing depends on.

@group(0) @binding(1) var<storage, read_write> birds: array<Bird>;
@group(0) @binding(2) var<storage, read_write> sorted: array<Bird>;
@group(0) @binding(3) var<storage, read_write> cellCount: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> cellStart: array<u32>;
// The cell of each bird and its place within the cell
@group(0) @binding(5) var<storage, read_write> slots: array<vec2u>;

// A dense cell gets sampled with a stride instead of read in full, so a tight clump costs the same as a loose one.
// Each sample stands for stride birds, so separation still grows with the real density
const SAMPLES_PER_CELL = 16u;
const MAX_FORCE = 1.2;

fn cellCoord(pos: vec2f) -> vec2i {
  let c = vec2i(floor((pos - p.worldMin) / p.cellSize));
  return clamp(c, vec2i(0), vec2i(i32(p.gridW) - 1, i32(p.gridH) - 1));
}

fn cellIndex(c: vec2i) -> u32 {
  return u32(c.y) * p.gridW + u32(c.x);
}

@compute @workgroup_size(256)
fn clearCells(@builtin(global_invocation_id) id: vec3u) {
  if (id.x < p.gridW * p.gridH) {
    atomicStore(&cellCount[id.x], 0u);
  }
}

@compute @workgroup_size(256)
fn countBirds(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= p.count) {
    return;
  }
  let c = cellIndex(cellCoord(birds[i].pos));
  slots[i] = vec2u(c, atomicAdd(&cellCount[c], 1u));
}

var<workgroup> partial: array<u32, 256>;

// One workgroup for the whole grid: each thread sums a run of cells, the workgroup scans the 256 sums, and each
// thread writes the starts of its run. The grid has about 6 300 cells, so a run is about 25 cells
@compute @workgroup_size(256)
fn prefixSum(@builtin(local_invocation_index) t: u32) {
  let cells = p.gridW * p.gridH;
  let per = (cells + 255u) / 256u;
  let begin = t * per;
  let end = min(begin + per, cells);
  var sum = 0u;
  for (var c = begin; c < end; c++) {
    sum += atomicLoad(&cellCount[c]);
  }
  partial[t] = sum;
  workgroupBarrier();
  for (var offset = 1u; offset < 256u; offset <<= 1u) {
    var add = 0u;
    if (t >= offset) {
      add = partial[t - offset];
    }
    workgroupBarrier();
    partial[t] += add;
    workgroupBarrier();
  }
  var start = partial[t] - sum;
  for (var c = begin; c < end; c++) {
    cellStart[c] = start;
    start += atomicLoad(&cellCount[c]);
  }
}

@compute @workgroup_size(256)
fn scatter(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= p.count) {
    return;
  }
  let s = slots[i];
  sorted[cellStart[s.x] + s.y] = birds[i];
}

@compute @workgroup_size(256)
fn update(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= p.count) {
    return;
  }
  var me = sorted[i];
  let home = cellCoord(me.pos);
  let r2 = p.radius * p.radius;

  var sep = vec2f(0.0);
  var velSum = vec2f(0.0);
  var offsetSum = vec2f(0.0);
  var n = 0.0;
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let c = home + vec2i(dx, dy);
      if (c.x < 0 || c.y < 0 || c.x >= i32(p.gridW) || c.y >= i32(p.gridH)) {
        continue;
      }
      let ci = cellIndex(c);
      let start = cellStart[ci];
      let total = atomicLoad(&cellCount[ci]);
      let stride = max(1u, total / SAMPLES_PER_CELL);
      let weight = f32(stride);
      // Starting at i % stride lets neighbouring birds see different samples
      for (var k = i % stride; k < total; k += stride) {
        let j = start + k;
        if (j == i) {
          continue;
        }
        let other = sorted[j];
        let d = other.pos - me.pos;
        let dist2 = dot(d, d);
        if (dist2 > r2 || dist2 < 1e-12) {
          continue;
        }
        let dist = sqrt(dist2);
        if (dist < p.sepRadius) {
          sep -= d / dist * (1.0 - dist / p.sepRadius) * weight;
        }
        velSum += other.vel;
        offsetSum += d;
        n += 1.0;
      }
    }
  }

  var steer = sep * p.separation;
  if (n > 0.0) {
    steer += (velSum / n - me.vel) * p.alignment;
    steer += offsetSum / n / p.radius * p.cohesion;
  }

  // A pull toward a point that wanders slowly around the middle, so the flock keeps turning and stays in view. It is
  // zero near the point, so it steers the flock without squeezing it into a ball
  let goal = vec2f(sin(p.time * 0.11) * 0.45 * p.aspect, sin(p.time * 0.17 + 1.3) * 0.3);
  let toGoal = goal - me.pos;
  let away = length(toGoal);
  steer += toGoal / max(away, 1e-5) * smoothstep(0.25, 0.9, away) * 0.6;
  let bound = vec2f(p.aspect, 1.0) * 0.9;
  steer -= max(abs(me.pos) - bound, vec2f(0.0)) * sign(me.pos) * 12.0;

  // A cap on how hard a bird can steer keeps the noise from the sampled neighbours from shaking the dense middle.
  // The hawk comes after it, so fear can beat the cap
  let force = length(steer);
  if (force > MAX_FORCE) {
    steer *= MAX_FORCE / force;
  }

  // The hawk pushes birds away and sideways, in the direction they already fly, so the flock folds around it
  var maxSpeed = p.maxSpeed;
  if (p.hawkOn > 0.5) {
    let away = me.pos - p.hawk;
    let dist = length(away);
    if (dist < p.hawkRadius && dist > 1e-5) {
      let dir = away / dist;
      var side = vec2f(-dir.y, dir.x);
      if (dot(side, me.vel) < 0.0) {
        side = -side;
      }
      let fear = 1.0 - dist / p.hawkRadius;
      steer += (dir * 2.0 + side * 1.2) * fear * fear * 10.0;
      maxSpeed *= 1.0 + fear;
    }
  }

  let oldDir = normalize(me.vel);
  var vel = me.vel + steer * p.dt;
  let speed = max(length(vel), 1e-6);
  vel *= clamp(speed, p.minSpeed, maxSpeed) / speed;
  let newDir = normalize(vel);
  let turn = abs(oldDir.x * newDir.y - oldDir.y * newDir.x) / max(p.dt, 1e-4);
  me.bank = mix(me.bank, turn, 0.04);
  me.vel = vel;
  me.pos += vel * p.dt;
  me.phase = fract(me.phase + p.dt * 4.0);
  birds[i] = me;
}
