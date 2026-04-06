# pxt-matrix-text

Font-agnostic text renderer and scrolling text for NeoPixel matrix panels, built on top of [pxt-matrix-core](https://github.com/rolandbachkiss/pxt-matrix-core).

## Overview

- **Font registry** — register one or more fonts; the renderer searches them in registration order
- **Text rendering** — `drawChar` and `drawText` paint glyphs onto the back buffer
- **Scrolling text** — `startScroll` / `updateScroll` / `stopScroll` drive a pixel-scrolling marquee

## Dependencies

| Extension | Purpose |
|---|---|
| [pxt-matrix-core](https://github.com/rolandbachkiss/pxt-matrix-core) | Pixel back buffer, display update |

## Font data extensions

This extension contains **no built-in font data**. You must add at least one font extension before any glyphs will render:

| Extension | Characters |
|---|---|
| [pxt-matrix-font-capital](../pxt-matrix-font-capital) | A–Z |
| [pxt-matrix-font-lowercase](../pxt-matrix-font-lowercase) | a–z |
| [pxt-matrix-font-digits](../pxt-matrix-font-digits) | 0–9 and common punctuation |

Each font extension calls `matrixText.registerFont(...)` at startup, so simply adding it as a dependency is enough.

---

## Quick Start

### Scrolling text

```typescript
matrixCore.initNeoPixel(DigitalPin.P0, MatrixLayout.Grid2x2)
// Font extensions must be installed so glyphs resolve
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

### Custom font

Glyph data is **column-major**: each column of a glyph is stored as one byte (fonts ≤ 8 px tall) or two bytes little-endian (fonts 9–16 px tall). Bit 0 of the first byte is the **top** row of the glyph.

```typescript
// Minimal 3×5 font containing only 'A' and 'B'
const myFont = matrixText.createFont(
    3, 5,
    "AB",
    "0E110E1F150A"
)
matrixText.registerFont(myFont)
```

---

## API Reference

### Drawing

| Block | Description |
|-------|-------------|
| `draw character ch at x x y y color c` | Draw one character |
| `draw text text at x x y y color c` | Draw a string |
| `text width of text` | Pixel width of a rendered string |
| `text height of text` | Pixel height of a rendered string |

### Scrolling

| Block | Description |
|-------|-------------|
| `scroll text text at y y color c speed speed` | Begin scrolling a string |
| `update scroll` | Advance scroll by one step (call once per frame) |
| `stop scrolling` | Clear the active scroll |

### Fonts

| Block | Description |
|-------|-------------|
| `register font font` | Add a MatrixFont to the search registry |
| `create font glyphW gw glyphH gh chars charMap data hexData` | Construct a MatrixFont from raw hex data |

---

## Font Data Format

Glyphs are stored column-major. For a 5×7 font, each character uses 7 bytes (one per column). The bits within each byte map to rows, with bit 0 = top row:

```
'A' (5×7):
  col0  col1  col2  col3  col4
  0x0E  0x11  0x11  0x1F  0x11  0x11  0x11
  =0001110 =0010001 =0010001 =0011111 =0010001 =0010001 =0010001

  .###.   .#...   .#...   .###.   .#...   .#...   .#...
  #...#   #...#   #...#   #...#   #...#   #...#   #...#
  #...#   #...#   #...#   #...#   #...#   #...#   #...#
  #####   #####   #####   #####   #####   #####   #####
  #...#   #...#   #...#   #...#   #...#   #...#   #...#
  #...#   #...#   #...#   #...#   #...#   #...#   #...#
  #...#   #...#   #...#   #...#   #...#   #...#   #...#
```

---

## License

MIT © Roland Bach Kiss
