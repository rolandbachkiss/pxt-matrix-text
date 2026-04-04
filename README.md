# pxt-matrix-text

Font-agnostic text renderer and scrolling text for NeoPixel matrix panels, built on top of [pxt-matrix-core](https://github.com/rolandbachkiss/pxt-matrix-core).

## Overview

`pxt-matrix-text` provides:

- **`MatrixFont`** — a bitmap font descriptor class you can instantiate directly or receive from a companion font extension.
- **Font registry** — register one or more `MatrixFont` objects; the renderer searches them in registration order.
- **Text rendering** — `drawChar` and `drawText` paint glyphs onto the `matrixCore` back buffer.
- **Scrolling text** — `startScroll` / `updateScroll` / `stopScroll` drive a pixel-scrolling marquee.

## Dependencies

| Extension | Purpose |
|---|---|
| `core` | MakeCode micro:bit core runtime |
| `neopixel` (`pxt-neopixel v0.7.6`) | NeoPixel strip driver |
| `matrix-core` (`pxt-matrix-core`) | Pixel back buffer, display update, bounds |

## Font data extensions

This extension contains **no built-in font data**. You must add at least one font extension (or define your own font) before any glyphs will render:

| Extension | Characters |
|---|---|
| `pxt-matrix-font-capital` | A–Z |
| `pxt-matrix-font-lowercase` | a–z |
| `pxt-matrix-font-digits` | 0–9 and common punctuation |

Each font extension calls `matrixText.registerFont(...)` at startup, so simply adding it as a dependency is enough.

## Usage

### Scrolling text (blocks / TypeScript)

```typescript
matrixCore.initNeoPixel(DigitalPin.P0, MatrixLayout.Grid2x2)
// A font extension must be present so glyphs resolve
matrixText.startScroll("HELLO", 4, matrixCore.rgb(255, 255, 0), 1)

basic.forever(function () {
    matrixCore.clear()
    matrixText.updateScroll()
    matrixCore.updateDisplay()
    basic.pause(70)
})
```

### Static text

```typescript
matrixCore.initNeoPixel(DigitalPin.P0, MatrixLayout.Grid2x2)

basic.forever(function () {
    matrixCore.clear()
    matrixText.drawText("Hi", 0, 1, matrixCore.rgb(0, 200, 255))
    matrixCore.updateDisplay()
    basic.pause(100)
})
```

### Defining and registering a custom font

Glyph data is **column-major**: each column of a glyph is stored as one byte
(fonts ≤ 8 px tall) or two bytes little-endian (fonts 9–16 px tall). Bit 0 of
the first byte is the **top** row of the glyph.

```typescript
// Minimal 3×5 font containing only 'A' and 'B'
//   A (cols 0-2):          B (cols 0-2):
//   col0=0b01110=0x0E      col0=0b11111=0x1F
//   col1=0b10001=0x11      col1=0b10101=0x15
//   col2=0b01110=0x0E      col2=0b01010=0x0A
const myFont = matrixText.createFont(
    3, 5,
    "AB",
    "0E110E1F150A"
)
matrixText.registerFont(myFont)
```

After registration the renderer will use `myFont` whenever it encounters `'A'`
or `'B'` in a string passed to `drawText`, `drawChar`, or `startScroll`.

## API reference

| Function | Description |
|---|---|
| `registerFont(font)` | Add a `MatrixFont` to the search registry |
| `createFont(gw, gh, charMap, hexData)` | Construct a `MatrixFont` from raw hex data |
| `drawChar(ch, x, y, c)` | Draw one character onto the back buffer |
| `drawText(text, x, y, c)` | Draw a string onto the back buffer |
| `textWidth(text)` | Pixel width of a rendered string |
| `textHeight(text)` | Pixel height of a rendered string |
| `startScroll(text, y, c, speed)` | Begin scrolling a string |
| `updateScroll()` | Advance scroll by one step; call once per frame |
| `stopScroll()` | Clear the active scroll |

## License

MIT
