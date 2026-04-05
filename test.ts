// test.ts — comprehensive tests for pxt-matrix-text
// Creates a minimal inline font so the test is self-contained

// ---------------------------------------------------------------------------
// Step 1: Initialize the matrix
// ---------------------------------------------------------------------------
matrixCore.initNeoPixel(DigitalPin.P0, MatrixLayout.Grid2x2)

// ---------------------------------------------------------------------------
// Step 2: Create a minimal 3×5 test font (letters: H, E, L, O)
// Format: column-major, 1 byte per column, LSB = top row
// Each glyph is 3 columns wide, 5 rows tall
// ---------------------------------------------------------------------------
// Glyph data (4 glyphs × 3 columns = 12 bytes):
// H: columns [0x49, 0x7F, 0x49] = binary [01001001, 01111111, 01001001]
// E: columns [0x7F, 0x49, 0x41] = binary [01111111, 01001001, 01000001]
// L: columns [0x7F, 0x40, 0x40] = binary [01111111, 01000000, 01000000]
// O: columns [0x3E, 0x41, 0x3E] = binary [00111110, 01000001, 00111110]
// Pass as hex STRING (not Buffer) - createFont will convert it
const testFont = matrixText.createFont(3, 5, "HELO", "497F497F49417F40403E413E")
matrixText.registerFont(testFont)

// ---------------------------------------------------------------------------
// Test 1: Draw single character
// ---------------------------------------------------------------------------
matrixCore.clear()
matrixText.drawChar("H", 0, 0, matrixCore.rgb(255, 0, 0))
matrixCore.updateDisplay()
basic.pause(1000)

// ---------------------------------------------------------------------------
// Test 2: Draw text string
// ---------------------------------------------------------------------------
matrixCore.clear()
matrixText.drawText("HELO", 0, 0, matrixCore.rgb(0, 255, 0))
matrixCore.updateDisplay()
basic.pause(1000)

// ---------------------------------------------------------------------------
// Test 3: Measure text width and height
// ---------------------------------------------------------------------------
matrixCore.clear()
const w = matrixText.textWidth("HELO")
const h = matrixText.textHeight("HELO")
// Display width as blink pattern (w=14 for 4 chars: 3+1+3+1+3+1+3=14)
for (let i = 0; i < w; i++) {
    matrixCore.setPixel(i, 0, matrixCore.rgb(255, 255, 0))
}
matrixCore.updateDisplay()
basic.pause(1000)

// ---------------------------------------------------------------------------
// Test 4: Scrolling text
// ---------------------------------------------------------------------------
matrixCore.clear()
matrixText.startScroll("HELO", 10, matrixCore.rgb(255, 0, 255), 1)

basic.forever(function () {
    matrixCore.clear()
    const stillScrolling = matrixText.updateScroll()
    matrixCore.updateDisplay()
    basic.pause(70)
})
