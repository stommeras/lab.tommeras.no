const msg = "Hei fra Zig!";

export fn helloPtr() [*]const u8 {
    return msg.ptr;
}

export fn helloLen() usize {
    return msg.len;
}
