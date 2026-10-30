// Game of Life grid. Phase 1: a random grid painted into a pixel buffer

const W: u32 = 256;
const H: u32 = 192;
const N = W * H;

// Two grids for double buffering. step() will read one and write the other
// One byte per cell, where 1 is alive and 0 is dead

var cells: [2][N]u8 = .{ @splat(0), @splat(0) };
var current: u1 = 0;
var generation_count: u32 = 0;

// One RGBA pixel per cell, read by JS as a Uint8ClampedArray
// Wasm is little-endian, so pack as 0xAABBGGRR to get thhe bytes R, G, B, A
var pixels: [W * H]u32 = @splat(0);

const ALIVE: u32 = 0xFF0080FF;
const DEAD: u32 = 0x00000000;

var rng: u32 = 1;

fn nextRandom() u32 {
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

fn neighbors(x: u32, y: u32) u8 {
    const grid = &cells[current];

    const left = (x + W - 1) % W;
    const right = (x + 1) % W;
    const up = (y + H - 1) % H;
    const down = (y + 1) % H;

    var count: u8 = 0;
    for ([_]u32{ up, y, down }) |row| {
        for ([_]u32{ left, x, right }) |col| {
            if (row == y and col == x) continue;
            if (grid[row * W + col] == 1) count += 1;
        }
    }

    return count;
}

// density is the share of cells that start alive, from 0 to 1
export fn randomize(density: f32) void {
    // compare in 16 bits. A threshhold near 2^32 doesn't fit exactly in f32
    const clamped = @min(@max(density, 0.0), 1.0);
    const threshold: u32 = @intFromFloat(clamped * 65536.0);
    for (&cells[current]) |*cell| {
        cell.* = if ((nextRandom() >> 16) < threshold) 1 else 0;
    }
    generation_count = 0;
    paint();
}

export fn step() void {
    const src = &cells[current];
    const dst = &cells[current +% 1];

    var y: u32 = 0;
    while (y < H) : (y += 1) {
        var x: u32 = 0;
        while (x < W) : (x += 1) {
            const i = y * W + x;
            const n = neighbors(x, y);
            const alive = src[i] == 1;
            // birth on 3, survival on 2 or 3
            dst[i] = if (n == 3 or (alive and n == 2)) 1 else 0;
        }
    }

    current +%= 1;
    generation_count +%= 1;
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

export fn generation() u32 {
    return generation_count;
}

// ----------------------------------------------------------------
// Tests. Run with `bun run test:life`
// ----------------------------------------------------------------

const std = @import("std");
const expect = std.testing.expect;
const expectEqual = std.testing.expectEqual;

// Tests share the globals, so every test starts from an empty grid
fn reset() void {
    @memset(&cells[0], 0);
    @memset(&cells[1], 0);
    current = 0;
    generation_count = 0;
}

// places live cells in the current grid
fn place(live: []const [2]u32) void {
    for (live) |p| cells[current][p[1] * W + p[0]] = 1;
}

fn liveCount() usize {
    var count: usize = 0;
    for (cells[current]) |cell| {
        if (cell == 1) count += 1;
    }
    return count;
}

// fails unless exactly theses cells are alive
fn expectOnly(live: []const [2]u32) !void {
    for (live) |p| {
        if (cells[current][p[1] * W + p[0]] != 1) {
            std.debug.print("Expected cell ({d}, {d}) to be alive\n", .{ p[0], p[1] });
            return error.TestUnexpectedResult;
        }
    }
    try expectEqual(live.len, liveCount());
}

test "blinker flips between horizontal and vertical" {
    reset();
    const horizontal = [_][2]u32{ .{ 9, 10 }, .{ 10, 10 }, .{ 11, 10 } };
    const vertical = [_][2]u32{ .{ 10, 9 }, .{ 10, 10 }, .{ 10, 11 } };

    place(&horizontal);
    step();
    try expectOnly(&vertical);
    step();
    try expectOnly(&horizontal);
    try expectEqual(@as(u32, 2), generation());
}

test "blinker wraps across the left and right edges" {
    reset();
    // Centered on x = 0, so its ends sit at x = W - 1 and x = 1
    place(&.{ .{ W - 1, 10 }, .{ 0, 10 }, .{ 1, 10 } });
    step();
    try expectOnly(&.{ .{ 0, 9 }, .{ 0, 10 }, .{ 0, 11 } });
}

test "blinker wraps across the top and bottom edges" {
    reset();
    place(&.{ .{ 10, H - 1 }, .{ 10, 0 }, .{ 10, 1 } });
    step();
    try expectOnly(&.{ .{ 9, 0 }, .{ 10, 0 }, .{ 11, 0 } });
}

test "glider moves one cell diagonally every 4 generations" {
    reset();
    //  .#.
    //  ..#
    //  ###
    place(&.{ .{ 11, 10 }, .{ 12, 11 }, .{ 10, 12 }, .{ 11, 12 }, .{ 12, 12 } });
    for (0..4) |_| step();
    try expectOnly(&.{ .{ 12, 11 }, .{ 13, 12 }, .{ 11, 13 }, .{ 12, 13 }, .{ 13, 13 } });
}

test "paint writes ALIVE for live cells and DEAD for the rest" {
    reset();
    place(&.{.{ 3, 4 }});
    paint();
    try expectEqual(ALIVE, pixels[4 * W + 3]);
    try expectEqual(DEAD, pixels[0]);
}
