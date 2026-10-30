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

fn cellColor(age: u8) u32 {
    return switch (age) {
        ALIVE => alive_color,
        0 => dead_color,
        else => fadeColor(age),
    };
}

// Also exported, so JS can repaint after a theme change without stepping
export fn paint() void {
    for (&pixels, &cells[current]) |*pixel, cell| {
        pixel.* = cellColor(cell);
    }
}

// ----------------------------------------------------------------
// Editing. Every edit repaints the pixels it changes, like randomize and
// step do, so JS only has to draw
// ----------------------------------------------------------------

fn setCell(i: usize, age: u8) void {
    cells[current][i] = age;
    pixels[i] = cellColor(age);
}

// Erasing writes 0, so the cell is gone at once instead of fading
// Coordinates outside the grid are ignored
export fn set(x: u32, y: u32, alive: bool) void {
    if (x >= W or y >= H) return;
    setCell(y * W + x, if (alive) ALIVE else 0);
}

// Returns the new state. A fading cell counts as dead, so it comes alive
// Coordinates outside the grid change nothing and return false
export fn toggle(x: u32, y: u32) bool {
    if (x >= W or y >= H) return false;
    const i = y * W + x;
    const alive = cells[current][i] != ALIVE;
    setCell(i, if (alive) ALIVE else 0);
    return alive;
}

// Offsets of the live cells from the pattern's center, with y pointing down
const Offset = [2]i16;

const Pattern = struct {
    live: []const Offset,
    // The bounding box, as offsets from the center
    min: Offset,
    max: Offset,
};

// Builds a pattern from a picture where 'O' is a live cell. The picture must
// be the pattern's bounding box. Its center is the cell at (width / 2, height / 2)
fn parsePattern(comptime picture: []const []const u8) Pattern {
    comptime {
        const cx: i16 = picture[0].len / 2;
        const cy: i16 = picture.len / 2;
        var count = 0;
        for (picture) |row| {
            for (row) |c| {
                if (c == 'O') count += 1;
            }
        }
        var live: [count]Offset = undefined;
        var n = 0;
        for (picture, 0..) |row, y| {
            if (row.len != picture[0].len) @compileError("pattern rows must have the same length");
            for (row, 0..) |c, x| {
                if (c == 'O') {
                    live[n] = .{ @as(i16, x) - cx, @as(i16, y) - cy };
                    n += 1;
                }
            }
        }
        const final = live;
        return .{
            .live = &final,
            .min = .{ -cx, -cy },
            .max = .{ @as(i16, picture[0].len) - 1 - cx, @as(i16, picture.len) - 1 - cy },
        };
    }
}

// The index is the id stamp() takes, and JS uses the same ids
const patterns = [_]Pattern{
    // 0: glider, heading down and to the right
    parsePattern(&.{
        ".O.",
        "..O",
        "OOO",
    }),
    // 1: Gosper glider gun, 36 x 9. Shoots a glider down and to the right
    // every 30 generations
    parsePattern(&.{
        "........................O...........",
        "......................O.O...........",
        "............OO......OO............OO",
        "...........O...O....OO............OO",
        "OO........O.....O...OO..............",
        "OO........O...O.OO....O.O...........",
        "..........O.....O.......O...........",
        "...........O...O....................",
        "............OO......................",
    }),
    // 2: R-pentomino
    parsePattern(&.{
        ".OO",
        "OO.",
        ".O.",
    }),
};

// Wraps around the edges like step() does. i64 holds any u32 plus an offset
fn wrappedIndex(x: i64, y: i64) usize {
    const col: usize = @intCast(@mod(x, W));
    const row: usize = @intCast(@mod(y, H));
    return row * W + col;
}

// Clears the pattern's bounding box plus a 1-cell margin first, so no cell
// already on the board touches the pattern in its first step. Cells further
// out still reach it later, so on a busy board a pattern often breaks up
// A center outside the grid or an unknown pattern id does nothing, like set()
export fn stamp(pattern: u32, x: u32, y: u32) void {
    if (pattern >= patterns.len or x >= W or y >= H) return;
    const p = patterns[pattern];

    var dy: i64 = p.min[1] - 1;
    while (dy <= p.max[1] + 1) : (dy += 1) {
        var dx: i64 = p.min[0] - 1;
        while (dx <= p.max[0] + 1) : (dx += 1) {
            setCell(wrappedIndex(@as(i64, x) + dx, @as(i64, y) + dy), 0);
        }
    }

    for (p.live) |offset| {
        setCell(wrappedIndex(@as(i64, x) + offset[0], @as(i64, y) + offset[1]), ALIVE);
    }
}

// Empties the grid and starts the generation count over
export fn clear() void {
    @memset(&cells[current], 0);
    generation_count = 0;
    paint();
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

test "set writes a live or dead cell and ignores coordinates outside the grid" {
    reset();
    set(3, 4, true);
    try expectOnly(&.{.{ 3, 4 }});
    try expectEqual(alive_color, pixels[4 * W + 3]);

    // Erasing a fading cell removes it at once
    cells[current][5 * W + 6] = 100;
    set(6, 5, false);
    set(3, 4, false);
    try expectEqual(@as(u8, 0), cells[current][5 * W + 6]);
    try expectEqual(@as(usize, 0), liveCount());
    try expectEqual(dead_color, pixels[4 * W + 3]);

    set(W, 0, true);
    set(0, H, true);
    set(std.math.maxInt(u32), std.math.maxInt(u32), true);
    try expectEqual(@as(usize, 0), liveCount());
}

test "toggle flips a cell and returns the new state" {
    reset();
    try expectEqual(true, toggle(3, 4));
    try expectOnly(&.{.{ 3, 4 }});
    try expectEqual(false, toggle(3, 4));
    try expectEqual(@as(usize, 0), liveCount());
    try expectEqual(@as(u8, 0), cells[current][4 * W + 3]);

    // A fading cell counts as dead
    cells[current][4 * W + 3] = 100;
    try expectEqual(true, toggle(3, 4));
    try expectEqual(ALIVE, cells[current][4 * W + 3]);
    try expectEqual(alive_color, pixels[4 * W + 3]);
}

test "toggle outside the grid returns false and changes nothing" {
    reset();
    place(&.{.{ 0, 0 }});
    try expectEqual(false, toggle(W, 0));
    try expectEqual(false, toggle(0, H));
    try expectEqual(false, toggle(std.math.maxInt(u32), 0));
    try expectOnly(&.{.{ 0, 0 }});
}

const glider_at_10_10 = [_][2]u32{ .{ 10, 9 }, .{ 11, 10 }, .{ 9, 11 }, .{ 10, 11 }, .{ 11, 11 } };

test "stamp places exactly the glider cells around the center" {
    reset();
    stamp(0, 10, 10);
    try expectOnly(&glider_at_10_10);
    try expectEqual(alive_color, pixels[9 * W + 10]);
}

test "a stamped glider moves one cell diagonally every 4 generations" {
    reset();
    stamp(0, 10, 10);
    for (0..4) |_| step();
    try expectOnly(&.{ .{ 11, 10 }, .{ 12, 11 }, .{ 10, 12 }, .{ 11, 12 }, .{ 12, 12 } });
}

test "stamp wraps around the top and left edges" {
    reset();
    stamp(0, 0, 0);
    try expectOnly(&.{ .{ 0, H - 1 }, .{ 1, 0 }, .{ W - 1, 1 }, .{ 0, 1 }, .{ 1, 1 } });
}

test "stamp wraps around the bottom and right edges" {
    reset();
    stamp(0, W - 1, H - 1);
    try expectOnly(&.{ .{ W - 1, H - 2 }, .{ 0, H - 1 }, .{ W - 2, 0 }, .{ W - 1, 0 }, .{ 0, 0 } });
}

test "stamp with a center outside the grid does nothing" {
    reset();
    place(&.{.{ 0, 0 }});
    stamp(0, W, 0);
    stamp(0, 0, H);
    stamp(1, std.math.maxInt(u32), std.math.maxInt(u32));
    try expectOnly(&.{.{ 0, 0 }});
}

test "stamp clears the bounding box and a 1-cell margin first" {
    reset();
    // A full 9 x 9 square around (20, 20), with one fading cell
    for (16..25) |y| {
        for (16..25) |x| cells[current][y * W + x] = ALIVE;
    }
    cells[current][19 * W + 19] = 100;

    stamp(0, 20, 20);

    // The glider's box is 3 x 3, so the margin makes it 5 x 5, from 18 to 22
    for (18..23) |y| {
        for (18..23) |x| {
            const is_glider = for ([_][2]u32{ .{ 20, 19 }, .{ 21, 20 }, .{ 19, 21 }, .{ 20, 21 }, .{ 21, 21 } }) |p| {
                if (p[0] == x and p[1] == y) break true;
            } else false;
            try expectEqual(if (is_glider) ALIVE else 0, cells[current][y * W + x]);
        }
    }
    // Outside the margin nothing changed
    try expectEqual(@as(usize, 81 - 25 + 5), liveCount());
}

test "stamp with an unknown pattern id does nothing" {
    reset();
    place(&.{ .{ 10, 10 }, .{ 11, 10 } });
    stamp(patterns.len, 10, 10);
    stamp(std.math.maxInt(u32), 10, 10);
    try expectOnly(&.{ .{ 10, 10 }, .{ 11, 10 } });
}

test "the patterns have the right sizes and cell counts" {
    const sizes = [_]struct { width: i16, height: i16, live: usize }{
        .{ .width = 3, .height = 3, .live = 5 },
        .{ .width = 36, .height = 9, .live = 36 },
        .{ .width = 3, .height = 3, .live = 5 },
    };
    for (patterns, sizes) |p, size| {
        try expectEqual(size.width, p.max[0] - p.min[0] + 1);
        try expectEqual(size.height, p.max[1] - p.min[1] + 1);
        try expectEqual(size.live, p.live.len);
    }
}

test "the Gosper gun comes back every 30 generations with one more glider" {
    reset();
    stamp(1, W / 2, H / 4);
    const gun = cells[current];
    try expectEqual(@as(usize, 36), liveCount());

    for (0..4) |shot| {
        for (0..30) |_| step();
        // The gun is back where it started, and each shot added a glider
        for (gun, cells[current]) |before, after| {
            if (before == ALIVE) try expectEqual(ALIVE, after);
        }
        try expectEqual(36 + 5 * (shot + 1), liveCount());
    }
}

test "a Gosper gun stamped on a corner wraps around and still fires" {
    reset();
    stamp(1, W / 2, H / 2);
    const centered = cells[current];

    reset();
    stamp(1, W - 1, H - 1);
    try expectEqual(@as(usize, 36), liveCount());
    // Every cell sits at the same offset from the center as in the centered
    // gun, wrapped across the bottom and right edges
    for (0..H) |y| {
        for (0..W) |x| {
            if (centered[y * W + x] != ALIVE) continue;
            const wrapped_x = (x + W / 2 - 1) % W;
            const wrapped_y = (y + H / 2 - 1) % H;
            try expectEqual(ALIVE, cells[current][wrapped_y * W + wrapped_x]);
        }
    }

    const gun = cells[current];
    for (0..2) |shot| {
        for (0..30) |_| step();
        for (gun, cells[current]) |before, after| {
            if (before == ALIVE) try expectEqual(ALIVE, after);
        }
        try expectEqual(36 + 5 * (shot + 1), liveCount());
    }
}

test "stamp places the R-pentomino, and it grows" {
    reset();
    stamp(2, W / 2, H / 2);
    try expectOnly(&.{ .{ W / 2, H / 2 - 1 }, .{ W / 2 + 1, H / 2 - 1 }, .{ W / 2 - 1, H / 2 }, .{ W / 2, H / 2 }, .{ W / 2, H / 2 + 1 } });
    for (0..100) |_| step();
    try std.testing.expect(liveCount() > 5);
}

test "clear empties the grid and resets the generation" {
    reset();
    stamp(1, 50, 50);
    step();
    cells[current][0] = 100;
    clear();
    try expectEqual(@as(u32, 0), generation());
    for (cells[current], pixels) |cell, pixel| {
        try expectEqual(@as(u8, 0), cell);
        try expectEqual(dead_color, pixel);
    }
}
