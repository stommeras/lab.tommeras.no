---
title: CHIP-8 i Zig og Rust
date: 2026-11-12
status: ferdig
language: Zig
tags: [Emulator, WebAssembly]
summary: En CHIP-8-emulator skrevet to ganger, i Zig og i Rust, begge kompilert til WebAssembly og kjørt på samme side.
---

CHIP-8 er en liten virtuell maskin fra 1970-årene, laget for å skrive spill på hjemmedatamaskiner. Den har 4 KB minne, 16 registre, en skjerm på 64 × 32 piksler og et tastatur med 16 taster. Trykk Start, velg et spill i menyen og bruk tastene 1 2 3 4 / Q W E R / A S D F / Z X C V. Under skjermen står det hvordan du spiller.

Jeg skrev emulatoren to ganger. Begge kjernene eksporterer de samme funksjonene til JavaScript og kjører på den samme siden, så du kan bytte mellom Zig og Rust mens et spill går. Det var en øvelse før jeg skal lage en fantasy console, og poenget var å sammenligne de to språkene. Koden, testene og målingene ligger i [stommeras/chip8](https://github.com/stommeras/chip8). Her ligger bare det ferdig bygde resultatet.

## Zig mot Rust

|                          | Zig                   | Rust              |
| ------------------------ | --------------------- | ----------------- |
| `.wasm`-fil              | 9 540 byte            | 23 605 byte       |
| Linjer kode, uten tester | 336                   | 502               |
| Ren release-bygging      | ca. 2,9 s             | ca. 0,2 s         |
| Instruksjoner per sekund | 160 til 170 millioner | ca. 115 millioner |

Begge er bygd for størrelse (`ReleaseSmall` i Zig, `opt-level = "z"` med LTO i Rust). Tallene kommer fra Zig 0.17.1 og Rust 1.99.1 på én Linux-maskin. Farten er målt i Bun, ikke i en nettleser, med ett lite testprogram, så bare forholdet mellom kjernene betyr noe.

Det jeg la mest merke til:

- Zig ga en mindre fil og en raskere kjerne med mindre kode. Rust bygger mye fortere, siden Zig også må kompilere standardbiblioteket sitt til WebAssembly.
- Adresser er 12 bit. I Zig er de en `u12` som ikke kan peke utenfor minnet, og `+%` wrapper dem ved 0xFFF. I Rust er de en `u16` som jeg må maske med `ADDRESS_MASK` for å få samme oppførsel.
- Quirks, altså små forskjeller mellom CHIP-8-maskinene, er en `packed struct(u8)` i Zig som tallet fra JavaScript gjøres om til med `@bitCast`. I Rust skriver jeg ut `Quirks::from_bits` selv.
- Begge kjernene har de samme 65 testene, og et eget script kjører alle spillene gjennom begge og feiler ved første bilde der skjermene er forskjellige.

Ingen av kjernene kan kjøre SUPER-CHIP-instruksjonene, for eksempel skjermen på 128 × 64.

## Spillene

De ti spillene kommer fra [chip8Archive](https://github.com/JohnEarnest/chip8Archive), der alt ligger under CC0. Forfatterne er SharpenedSpoon (Br8kout), mattmik (Chipquarium), TodPunk (Flight Runner), WilliamDonnelly (Mastermind og Spacejam!), JohnEarnest (Outlaw, Snek og WDL), offstatic (Super Pong) og Rectus (Tank!). Alle ti har lisensen CC0-1.0, og `games.json` i emulatoren har lenken til hvert enkelt spill.

Siden er laget for tastatur, og tastene sitter tett. Det fungerer best på desktop.
