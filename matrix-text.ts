/**
 * matrix-text — font-agnostic text renderer and scrolling text
 * for NeoPixel matrix panels driven by matrixCore.
 *
 * Glyph data layout: column-major, one byte per column for fonts up to 8 px
 * tall, two bytes per column (little-endian) for fonts 9–16 px tall.
 * LSB of each column byte = top row of the glyph.
 */

/**
 * A bitmap font descriptor that can be registered with the text renderer.
 */
//% blockNamespace=matrixText
class MatrixFont {
    public glyphW: number
    public glyphH: number
    public charMap: string   // each char position = glyph index
    public data: Buffer

    constructor(glyphW: number, glyphH: number, charMap: string, data: Buffer) {
        this.glyphW = glyphW
        this.glyphH = glyphH
        this.charMap = charMap
        this.data = data
    }

    /**
     * Read a single pixel from a glyph.
     * @param glyphIndex index into the font
     * @param col column within the glyph (0..glyphW-1)
     * @param row row within the glyph (0..glyphH-1)
     */
    public getPixel(glyphIndex: number, col: number, row: number): boolean {
        if (this.glyphH <= 8) {
            const byteVal = this.data[glyphIndex * this.glyphW + col]
            return (byteVal & (1 << row)) !== 0
        } else {
            const offset = (glyphIndex * this.glyphW + col) * 2
            const word = this.data[offset] | (this.data[offset + 1] << 8)
            return (word & (1 << row)) !== 0
        }
    }
}

/**
 * Font-agnostic text rendering and scrolling for NeoPixel matrix panels.
 */
//% color="#FFAA00"
//% icon="\uf031"
//% block="Matrix Text"
//% weight=85
//% groups=["Drawing","Scrolling","Fonts"]
namespace matrixText {

    // -------------------------------------------------------------------------
    // Internal state
    // -------------------------------------------------------------------------

    let _fonts: MatrixFont[] = []

    let _scrollText: string = ""
    let _scrollX: number = 0
    let _scrollY: number = 0
    let _scrollR: number = 255
    let _scrollG: number = 255
    let _scrollB: number = 255
    let _scrollSpeed: number = 1

    // Glyph lookup scratch variables (avoids union return type)
    let _foundFont: MatrixFont = null
    let _foundIdx: number = 0

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Search all registered fonts for the character ch.
     * Sets _foundFont and _foundIdx on success.
     * Returns true if the glyph was found, false otherwise.
     */
    function findGlyph(ch: string): boolean {
        for (let i = 0; i < _fonts.length; i++) {
            const idx = _fonts[i].charMap.indexOf(ch)
            if (idx >= 0) {
                _foundFont = _fonts[i]
                _foundIdx = idx
                return true
            }
        }
        return false
    }

    // -------------------------------------------------------------------------
    // Font registry
    // -------------------------------------------------------------------------

    /**
     * Register a font so the text renderer can use it.
     * @param font the MatrixFont to register
     */
    //% blockId=matrix_text_register_font
    //% block="register font $font"
    //% font.shadow=variables_get
    //% group="Fonts" weight=100
    export function registerFont(font: MatrixFont): void {
        _fonts.push(font)
    }

    /**
     * Create a custom font from raw hex data.
     * @param gw glyph width in pixels
     * @param gh glyph height in pixels
     * @param charMap string of characters whose order matches the glyph data
     * @param hexData hex-encoded glyph bitmap (column-major, LSB = top row)
     */
    //% blockId=matrix_text_create_font
    //% block="create font glyphW $gw glyphH $gh chars $charMap data $hexData"
    //% gw.defl=5 gh.defl=7
    //% group="Fonts" weight=90
    //% advanced=true
    export function createFont(gw: number, gh: number, charMap: string, hexData: string): MatrixFont {
        return new MatrixFont(gw, gh, charMap, Buffer.fromHex(hexData))
    }

    // -------------------------------------------------------------------------
    // Text metrics
    // -------------------------------------------------------------------------

    /**
     * Return the rendered pixel width of a text string using registered fonts.
     * A 1-pixel gap is inserted between characters; unknown characters advance
     * by 4 pixels.
     * @param text the string to measure
     */
    //% blockId=matrix_text_width
    //% block="text width of $text"
    //% group="Drawing" weight=79
    export function textWidth(text: string): number {
        let total = 0
        for (let i = 0; i < text.length; i++) {
            if (findGlyph(text.charAt(i))) {
                if (total > 0) total += 1   // inter-character gap
                total += _foundFont.glyphW
            } else {
                if (total > 0) total += 1
                total += 4  // space advance for unknown chars
            }
        }
        return total
    }

    /**
     * Return the rendered pixel height of a text string (tallest glyph).
     * @param text the string to measure
     */
    //% blockId=matrix_text_height
    //% block="text height of $text"
    //% group="Drawing" weight=78
    export function textHeight(text: string): number {
        let maxH = 0
        for (let i = 0; i < text.length; i++) {
            if (findGlyph(text.charAt(i))) {
                if (_foundFont.glyphH > maxH) maxH = _foundFont.glyphH
            }
        }
        return maxH
    }

    // -------------------------------------------------------------------------
    // Drawing
    // -------------------------------------------------------------------------

    /**
     * Draw a single character onto the back buffer.
     * @param ch character to draw
     * @param x left edge in pixels
     * @param y top edge in pixels
     * @param c 24-bit RGB colour (0xRRGGBB)
     */
    //% blockId=matrix_text_draw_char
    //% block="draw character $ch at x $x y $y color $c"
    //% c.shadow="colorNumberPicker"
    //% group="Drawing" weight=90
    export function drawChar(ch: string, x: number, y: number, c: number): void {
        if (!findGlyph(ch)) return
        const r = (c >> 16) & 0xFF
        const g = (c >> 8) & 0xFF
        const b = c & 0xFF
        const font = _foundFont
        const idx = _foundIdx
        const buf = matrixCore.getBackBuffer()
        for (let col = 0; col < font.glyphW; col++) {
            for (let row = 0; row < font.glyphH; row++) {
                if (font.getPixel(idx, col, row)) {
                    matrixCore.setPixelBuf(buf, x + col, y + row, r, g, b)
                }
            }
        }
    }

    /**
     * Draw a text string onto the back buffer.
     * @param text string to draw
     * @param x left edge in pixels
     * @param y top edge in pixels
     * @param c 24-bit RGB colour (0xRRGGBB)
     */
    //% blockId=matrix_text_draw_text
    //% block="draw text $text at x $x y $y color $c"
    //% c.shadow="colorNumberPicker"
    //% group="Drawing" weight=100
    export function drawText(text: string, x: number, y: number, c: number): void {
        let cx = x
        for (let i = 0; i < text.length; i++) {
            const ch = text.charAt(i)
            if (findGlyph(ch)) {
                drawChar(ch, cx, y, c)
                cx += _foundFont.glyphW + 1
            } else {
                cx += 4  // space advance for unknown chars
            }
        }
    }

    // -------------------------------------------------------------------------
    // Scrolling text
    // -------------------------------------------------------------------------

    /**
     * Start scrolling text across the matrix.
     * Call updateScroll() in your game loop to advance the animation.
     * @param text string to scroll
     * @param y top edge of the text row in pixels
     * @param c 24-bit RGB colour (0xRRGGBB)
     * @param speed pixels to advance per updateScroll() call (1–8)
     */
    //% blockId=matrix_text_start_scroll
    //% block="scroll text $text at y $y color $c speed $speed"
    //% c.shadow="colorNumberPicker"
    //% speed.defl=1 speed.min=1 speed.max=8
    //% group="Scrolling" weight=100
    export function startScroll(text: string, y: number, c: number, speed: number): void {
        _scrollText = text
        _scrollX = matrixCore.width()
        _scrollY = y
        _scrollR = (c >> 16) & 0xFF
        _scrollG = (c >> 8) & 0xFF
        _scrollB = c & 0xFF
        _scrollSpeed = speed
    }

    /**
     * Advance the scroll by one step and paint the current frame onto the
     * back buffer. Call once per display refresh in your game loop.
     * Returns true while text is actively scrolling, false if no text is set.
     */
    //% blockId=matrix_text_update_scroll
    //% block="update scroll"
    //% group="Scrolling" weight=90
    export function updateScroll(): boolean {
        if (_scrollText.length === 0) return false

        const buf = matrixCore.getBackBuffer()
        const matW = matrixCore.width()

        // Draw each glyph at the current scroll offset
        let cx = _scrollX
        for (let i = 0; i < _scrollText.length; i++) {
            const ch = _scrollText.charAt(i)
            if (findGlyph(ch)) {
                const font = _foundFont
                const idx = _foundIdx
                for (let col = 0; col < font.glyphW; col++) {
                    const px = cx + col
                    if (px >= 0 && px < matW) {
                        for (let row = 0; row < font.glyphH; row++) {
                            if (font.getPixel(idx, col, row)) {
                                matrixCore.setPixelBuf(buf, px, _scrollY + row, _scrollR, _scrollG, _scrollB)
                            }
                        }
                    }
                }
                cx += font.glyphW + 1
            } else {
                cx += 4  // space advance for unknown chars
            }
        }

        // Advance scroll position
        _scrollX -= _scrollSpeed

        // Reset when the text has fully scrolled off the left edge
        if (_scrollX < -textWidth(_scrollText)) {
            _scrollX = matW
        }

        return true
    }

    /**
     * Stop the scrolling text animation and clear the scroll state.
     */
    //% blockId=matrix_text_stop_scroll
    //% block="stop scrolling"
    //% group="Scrolling" weight=80
    export function stopScroll(): void {
        _scrollText = ""
        _scrollX = 0
    }
}
