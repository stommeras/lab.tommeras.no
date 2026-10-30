// Game of Life grid with fading trails, painted into a pixel buffer

const W: u32 = 256;
const H: u32 = 192;
const N = W * H;

// Two grids for double buffering. step() reads one and writes the other
// One byte per cell holds an age. ALIVE is a live cell, and a dead cell
// loses FADE per step until it reaches 0
const ALIVE: u8 = 255;
// A trail fades out in ceil(255 / FADE) = 7 generations
const FADE: u8 = 40;
// The age of a cell in the step it dies, painted in the dying color
const JUST_DIED: u8 = ALIVE - FADE;

var cells: [2][N]u8 = .{ @splat(0), @splat(0) };
var current: u1 = 0;
var generation_count: u32 = 0;

// One RGBA pixel per cell, read by JS as a Uint8ClampedArray
// Wasm is little-endian, so pack as 0xAABBGGRR to get the bytes R, G, B, A
var pixels: [W * H]u32 = @splat(0);

// Used until JS calls setPalette with the theme colors
const DEFAULT_ALIVE_COLOR: u32 = 0xFF0080FF;
const DEFAULT_DYING_COLOR: u32 = 0xFF004080;
const DEFAULT_DEAD_COLOR: u32 = 0x00000000;

var alive_color: u32 = DEFAULT_ALIVE_COLOR;
var dying_color: u32 = DEFAULT_DYING_COLOR;
var dead_color: u32 = DEFAULT_DEAD_COLOR;

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
            if (grid[row * W + col] == ALIVE) count += 1;
        }
    }

    return count;
}

// density is the share of cells that start alive, from 0 to 1
export fn randomize(density: f32) void {
    // compare in 16 bits. A threshold near 2^32 doesn't fit exactly in f32
    const clamped = @min(@max(density, 0.0), 1.0);
    const threshold: u32 = @intFromFloat(clamped * 65536.0);
    for (&cells[current]) |*cell| {
        cell.* = if ((nextRandom() >> 16) < threshold) ALIVE else 0;
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
            const alive = src[i] == ALIVE;
            // birth on 3, survival on 2 or 3. A cell that dies or is already
            // dead fades toward 0
            dst[i] = if (n == 3 or (alive and n == 2)) ALIVE else src[i] -| FADE;
        }
    }

    current +%= 1;
    generation_count +%= 1;
    paint();
}

// Colors packed as 0xAABBGGRR, like the pixels
export fn setPalette(alive: u32, dying: u32, dead: u32) void {
    alive_color = alive;
    dying_color = dying;
    dead_color = dead;
}

// Blends each channel, alpha included, from the dying color at JUST_DIED
// to the dead color at 0
fn fadeColor(age: u8) u32 {
    const a: u32 = @min(age, JUST_DIED);
    var color: u32 = 0;
    inline for (0..4) |channel| {
        const shift: u5 = channel * 8;
        const dying = (dying_color >> shift) & 0xFF;
        const dead = (dead_color >> shift) & 0xFF;
        color |= ((dying * a + dead * (JUST_DIED - a)) / JUST_DIED) << shift;
    }
    return color;
}

// Also exported, so JS can repaint after a theme change without stepping
export fn paint() void {
    for (&pixels, &cells[current]) |*pixel, cell| {
        pixel.* = switch (cell) {
            ALIVE => alive_color,
            0 => dead_color,
            else => fadeColor(cell),
        };
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
const expectEqual = std.testing.expectEqual;

// Tests share the globals, so every test starts from an empty grid
fn reset() void {
    @memset(&cells[0], 0);
    @memset(&cells[1], 0);
    current = 0;
    generation_count = 0;
    setPalette(DEFAULT_ALIVE_COLOR, DEFAULT_DYING_COLOR, DEFAULT_DEAD_COLOR);
}

// places live cells in the current grid
fn place(live: []const [2]u32) void {
    for (live) |p| cells[current][p[1] * W + p[0]] = ALIVE;
}

fn liveCount() usize {
    var count: usize = 0;
    for (cells[current]) |cell| {
        if (cell == ALIVE) count += 1;
    }
    return count;
}

// fails unless exactly these cells are alive
fn expectOnly(live: []const [2]u32) !void {
    for (live) |p| {
        if (cells[current][p[1] * W + p[0]] != ALIVE) {
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

test "a dead cell fades to 0 in ceil(255 / FADE) steps" {
    reset();
    // A lone cell dies in the first step and then only fades
    place(&.{.{ 10, 10 }});
    const i = 10 * W + 10;
    const fade_steps = (@as(usize, ALIVE) + FADE - 1) / FADE;

    step();
    try expectEqual(JUST_DIED, cells[current][i]);
    for (1..fade_steps - 1) |_| step();
    try std.testing.expect(cells[current][i] > 0);
    step();
    try expectEqual(@as(u8, 0), cells[current][i]);
    step();
    try expectEqual(@as(u8, 0), cells[current][i]);
}

test "a fading cell never counts as a neighbor" {
    // (11, 10) has two live neighbors and one fading one. If the fading cell
    // counted, (11, 10) would be born
    for ([_]u8{ 1, JUST_DIED, ALIVE - 1 }) |age| {
        reset();
        place(&.{ .{ 10, 10 }, .{ 12, 10 } });
        cells[current][9 * W + 11] = age;
        try expectEqual(@as(u8, 2), neighbors(11, 10));
        step();
        try expectEqual(@as(usize, 0), liveCount());
    }
}

test "paint uses the alive, dying and dead colors at the ends of the fade" {
    reset();
    place(&.{.{ 3, 4 }});
    paint();
    try expectEqual(alive_color, pixels[4 * W + 3]);
    try expectEqual(dead_color, pixels[0]);

    // The lone cell dies, so its first faded age paints as the dying color
    step();
    try expectEqual(dying_color, pixels[4 * W + 3]);
}

test "setPalette changes the painted colors" {
    reset();
    setPalette(0xFF0000FF, 0x80FF0000, 0xFF00FF00);
    place(&.{ .{ 3, 4 }, .{ 20, 20 } });
    step();
    place(&.{.{ 3, 4 }});
    paint();
    try expectEqual(@as(u32, 0xFF0000FF), pixels[4 * W + 3]);
    try expectEqual(@as(u32, 0x80FF0000), pixels[20 * W + 20]);
    try expectEqual(@as(u32, 0xFF00FF00), pixels[0]);
}

test "paint blends a fading cell between the dying and dead colors" {
    reset();
    // With JUST_DIED (215) in every dying channel and 0 in dead, each channel
    // comes out exactly equal to the age
    setPalette(0, 0xD7D7D7D7, 0);
    cells[current][0] = 135;
    paint();
    try expectEqual(@as(u32, 0x87878787), pixels[0]);
}
