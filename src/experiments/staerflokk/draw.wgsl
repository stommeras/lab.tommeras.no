@group(0) @binding(1) var<storage, read> birds: array<Bird>;

struct SkyOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

// One triangle that covers the screen. uv.y is 0 at the bottom
@vertex
fn skyVertex(@builtin(vertex_index) vi: u32) -> SkyOut {
  let uv = vec2f(f32((vi << 1u) & 2u), f32(vi & 2u));
  var out: SkyOut;
  out.pos = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn skyFragment(in: SkyOut) -> @location(0) vec4f {
  let y = in.uv.y;
  var color = mix(p.horizon.rgb, p.mid.rgb, smoothstep(0.02, 0.5, y));
  color = mix(color, p.top.rgb, smoothstep(0.4, 1.0, y));
  // A treeline along the bottom, in the bird color, with a one pixel soft edge
  let x = in.uv.x * p.aspect;
  let ridge = 0.045 + 0.015 * sin(x * 3.0 + 1.0) + 0.012 * abs(sin(x * 19.0)) + 0.008 * abs(sin(x * 47.0 + 2.0)) + 0.004 * abs(sin(x * 131.0));
  let ground = clamp((ridge - y) / fwidth(y), 0.0, 1.0);
  return vec4f(mix(color, p.bird.rgb, ground), 1.0);
}

struct BirdOut {
  @builtin(position) pos: vec4f,
  @location(0) shade: f32,
}

// Three vertices per bird, a chevron pointing where it flies. A bird that turns banks and shows more of its wings,
// so it draws wider and darker. That is where the dark waves come from
@vertex
fn birdVertex(@builtin(vertex_index) vi: u32) -> BirdOut {
  let b = birds[vi / 3u];
  let corner = vi % 3u;
  let fwd = normalize(b.vel);
  let side = vec2f(-fwd.y, fwd.x);
  let bank = smoothstep(0.8, 3.5, b.bank);
  let flap = 0.7 + 0.3 * sin(b.phase * 6.2831853);
  let len = p.birdSize * p.pxWorld;
  let width = len * (0.45 + 0.8 * bank) * flap;
  var offset = fwd * len * 0.6;
  if (corner == 1u) {
    offset = -fwd * len * 0.4 + side * width;
  } else if (corner == 2u) {
    offset = -fwd * len * 0.4 - side * width;
  }
  let world = b.pos + offset;
  var out: BirdOut;
  out.pos = vec4f(world.x / p.aspect, world.y, 0.0, 1.0);
  out.shade = 0.12 + 0.8 * bank;
  return out;
}

@fragment
fn birdFragment(in: BirdOut) -> @location(0) vec4f {
  let a = p.bird.a * in.shade;
  return vec4f(p.bird.rgb * a, a);
}
