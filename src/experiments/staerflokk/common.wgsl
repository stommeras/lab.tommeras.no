// Shared by simulate.wgsl and draw.wgsl. The byte offsets must match writeParams in Demo.astro
struct Params {
  count: u32,
  gridW: u32,
  gridH: u32,
  _pad0: u32,
  worldMin: vec2f,
  cellSize: f32,
  dt: f32,
  hawk: vec2f,
  hawkOn: f32,
  time: f32,
  aspect: f32,
  separation: f32,
  alignment: f32,
  cohesion: f32,
  radius: f32,
  maxSpeed: f32,
  minSpeed: f32,
  hawkRadius: f32,
  pxWorld: f32,
  birdSize: f32,
  sepRadius: f32,
  _pad1: f32,
  top: vec4f,
  mid: vec4f,
  horizon: vec4f,
  bird: vec4f,
}

// bank is a smoothed turn rate in radians per second. phase is the wingbeat, from 0 to 1
struct Bird {
  pos: vec2f,
  vel: vec2f,
  bank: f32,
  phase: f32,
}

@group(0) @binding(0) var<uniform> p: Params;
