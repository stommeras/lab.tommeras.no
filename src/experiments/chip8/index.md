---
title: CHIP-8 i Zig og Rust
date: 2026-11-12
status: ferdig
language: Zig
tags: [Emulator, WebAssembly]
summary: En CHIP-8-emulator skrevet to ganger, i Zig og i Rust, begge kompilert til WebAssembly og kjørt på samme side.
---

CHIP-8 er en liten virtuell maskin fra 1970-årene, laget for å skrive spill på hjemmedatamaskiner. Trykk Start, velg et spill og bruk tastene 1 2 3 4 / Q W E R / A S D F / Z X C V. Under skjermen kan du bytte mellom Zig og Rust mens spillet går.

Jeg skrev emulatoren to ganger som en øvelse før jeg skal lage en fantasy console, for å sammenligne de to språkene. Koden, testene og målingene ligger i [stommeras/chip8](https://github.com/stommeras/chip8).

|                          | Zig                   | Rust              |
| ------------------------ | --------------------- | ----------------- |
| `.wasm`-fil              | 9 540 byte            | 23 605 byte       |
| Linjer kode              | 336                   | 502               |
| Ren bygging              | ca. 2,9 s             | ca. 0,2 s         |
| Instruksjoner per sekund | 160 til 170 millioner | ca. 115 millioner |

Begge er bygd for størrelse, med Zig 0.17.1 og Rust 1.99.1 på én Linux-maskin. Farten er målt i Bun med ett lite testprogram, så bare forholdet mellom kjernene betyr noe.

Zig ga en mindre fil og en raskere kjerne med mindre kode. Rust bygger mye fortere, siden Zig også kompilerer standardbiblioteket sitt til WebAssembly. Adresser er 12 bit, og i Zig er de en `u12` som ikke kan peke utenfor minnet. I Rust er de en `u16` som må maskes for å få samme oppførsel.

De ti spillene kommer fra [chip8Archive](https://github.com/JohnEarnest/chip8Archive) og har lisensen CC0-1.0. Forfatterne er SharpenedSpoon (Br8kout), mattmik (Chipquarium), TodPunk (Flight Runner), WilliamDonnelly (Mastermind og Spacejam!), JohnEarnest (Outlaw, Snek og WDL), offstatic (Super Pong) og Rectus (Tank!).

Emulatoren styres bare med tastaturet og har ingen knapper på skjermen, så den fungerer best på desktop.
