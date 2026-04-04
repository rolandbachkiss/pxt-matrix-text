// test.ts — basic smoke test for pxt-matrix-text
// Requires a font extension (e.g. pxt-matrix-font-capital) to be added so that
// glyphs are available in the registry before scrolling begins.

matrixCore.initNeoPixel(DigitalPin.P0, MatrixLayout.Grid2x2)
matrixText.startScroll("HELLO", 4, matrixCore.rgb(255, 255, 0), 1)

basic.forever(function () {
    matrixCore.clear()
    matrixText.updateScroll()
    matrixCore.updateDisplay()
    basic.pause(70)
})
