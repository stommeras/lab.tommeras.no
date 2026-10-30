// Game of Life grid. Phase 1: a random grid painted into a pixel buffer

const W: u32 = 256;
const H: u32 = 192;
const N = W * H;

// Two grids for double buffering. step() will read one and write the other
// One byte per cell, where 1 is alive and 0 is dead

var cells: [2][N]u8 = .{ @splat(0), @splat(0) };
var current: u1 = 0;

// One RGBA pixel per cell, read by JS as a Uint8ClampedArray
// Wasm is little-endian, so pack as 0xAABBGGRR to get thhe bytes R, G, B, A
var pixels: [W * H]u32 = @splat(0);

const ALIVE: u32 = 0xFF0080FF;
const DEAD: u32 = 0x00000000;

var rng: u32 = 1;

fn next() u32 {
    var x = rng;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    rng = x;
    return x;
}

export fn seed(s: u32) void {
    rng = if (s == 0) 1 else s;
}

// density is the share of cells that start alive, from 0 to 1
export fn randomize(density: f32) void {
    // compare in 16 bits. A threshhold near 2^32 doesn't fit exactly in f32
    const clamped = @min(@max(density, 0.0), 1.0);
    const threshold: u32 = @intFromFloat(clamped * 65536.0);
    for (&cells[current]) |*cell| {
        cell.* = if ((next() >> 16) < threshold) 1 else 0;
    }
    paint();
}

fn paint() void {
    for (&pixels, &cells[current]) |*pixel, cell| {
        pixel.* = if (cell == 1) ALIVE else DEAD;
    }
}

export fn pixelsPtr() [*]u32 {
    return &pixels;
}

export fn width() u32 {
    return W;
}

export fn height() u32 {
    return H;
}
