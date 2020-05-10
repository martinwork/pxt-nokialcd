/**
* Custom blocks
*/


enum LCDDisplayModes {
    Normal = 0,
    Blank = 1,
    AllOn = 2,
    Inverse = 3
}

//% weight=100 color=#0fbc11 icon=""
namespace nokialcd {
    const FILL_X = hex`fffefcf8f0e0c08000`
    const FILL_B = hex`0103070f1f3f7fffff`
    const FILL_R = hex`00010204081020408000000000000000000000`
    const FILL_S = hex`00000000000000000001020408102040800000`
    const TWOS = hex`0102040810204080010204081020408000`
    const CMD = 0
    const DAT = 1
    const SET_X = 0x80
    const SET_Y = 0x40
    const LCD_RST = DigitalPin.P0
    const LCD_CE = DigitalPin.P1
    const LCD_DC = DigitalPin.P8
    const _TEMP = 0x00
    const _BIAS = 0x03
    const _VOP = 0x3f
    let _DE: number = 0x00
    let _V: number = 1
    let _PD: number = 0
    let bytearray = pins.createBuffer(84 * 6)

    //% blockId=nokialcd_pixel
    //% block="pixel at x %x y %y %state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% inlineInputMode=inline
    export function pixel(x: number, y: number, state: boolean) {
        if (x > 83) { return }
        if (y > 47) { return }
        if ((x | y) < 0) { return }
        if (_V) {
            x = (6 * x) + (y >> 3)
        } else {
            x = x + ((y >> 3) * 84)
        }
        y = 1 << (y & 0x07)
        if (state) {
            bytearray[x] = bytearray[x] | y
        } else {
            bytearray[x] = bytearray[x] & ~y
        }
    }

    //% blockId=nokialcd_plot
    //% block="draw %plot=plot_conv from x %x0 y %y0 to x %x1 y %y1 $state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% inlineInputMode=inline
    export function plot(plot: Plots, x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        switch (plot) {
            case 0: { plotLine(x0, y0, x1, y1, state); break }
            case 1: { plotBox(x0, y0, x1, y1, state); break }
            case 2: { plotRect(x0, y0, x1, y1, state); break }
            default: plotLine(x0, y0, x1, y1, state);
        }
    }
    //% blockId=nokialcd_show
    //% block="show"
    export function show() {
        writeBuffer(bytearray)
    }


    function andColumn(col: number, low: number, high: number): void {
        if (col < 0) { return }
        if (col > 83) { return }
        let r = col * 6
        if ((low >> 3) == (high >> 3)) {
            let bitmask = FILL_X[low & 7] ^ FILL_X[(high & 7) + 1]
            bytearray[r + low >> 3] &= ~bitmask
        } else {
            let bitmask = FILL_X[low & 7]
            bytearray[r + (low >> 3)] &= ~bitmask
            // do the ones in between
            bitmask = FILL_B[(high & 7) + 1]
            bytearray[r + (high >> 3)] &= ~bitmask
        }
    }

    function orColumn(col: number, low: number, high: number): void {
        if (col < 0) { return }
        if (col > 83) { return }
        let r = col * 6
        if ((low >> 3) == (high >> 3)) {
            let bitmask = FILL_X[low & 7] ^ FILL_X[(high & 7) + 1]
            bytearray[r + low >> 3] |= bitmask
        } else {
            let bitmask = FILL_X[low & 7]
            bytearray[r + (low >> 3)] |= bitmask
            // do the ones in between
            bitmask = FILL_B[(high & 7) + 1]
            bytearray[r + (high >> 3)] |= bitmask
        }
    }


    function plotLine(x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
        let x = x0, y = y0
        if (dx > dy) {
            if (x0 > x1) { x = x1; y = y1; x1 = x0; y1 = y0 }
            let yc = (y1 > y) ? 1 : -1
            let mid = (x + x1) >> 1
            let a = dy << 1, p = a - dx, b = p - dx
            pixel(x, y, state)
            while (x < x1) {
                if ((p < 0) || ((p == 0) && (x >= mid))) { p += a }
                else { p = p + b; y += yc }
                x++; pixel(x, y, state)
            }
        } else {
            if ((_V == 1) && (dx == 100000)) {
                if (y < 0) y = 0
                if (y1 > 47) y1 = 47
                if (state) {
                    orColumn(x, y, y1)
                } else {
                    andColumn(x, y, y1)
                }
            } else {
                if (y0 > y1) { x = x1; y = y1; x1 = x0; y1 = y0 }
                let xc = (x1 > x) ? 1 : -1
                let mid = (y + y1) >> 1
                let a = dx << 1, p = a - dy, b = p - dy
                pixel(x, y, state)
                while (y < y1) {
                    if ((p < 0) || ((p == 0) && (y >= mid))) { p += a }
                    else { p = p + b; x += xc }
                    y++; pixel(x, y, state)
                }
            }
        }
    }

    function plotBox(x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        let x = x0, y = y0
        if (x1 < x0) { x = x1; x1 = x0 }
        if (y1 < y0) { y = y1; y1 = y0 }
        if ((y1 | x1) < 0) { return }
        if (y < 0) y = 0
        if (y1 > 47) y1 = 47
        if ((y >> 3) == (y1 >> 3)) {
            let bitmask = FILL_X[y & 7] ^ FILL_X[(y1 & 7) + 1]
            let r = x * 6 + (y >> 3)
            for (; x <= x1; x++ , r = r + 6) {
                if (state) {
                    bytearray[r] |= bitmask
                } else {
                    bytearray[r] &= ~bitmask
                }
            }
        } else {
            let bitmasky = FILL_X[y & 7]
            let bitmasky1 = FILL_B[y1 & 7]
            let ycount = (y1 >> 3) - (y >> 3) - 1
            let r = x * 6 + (y >> 3)
            for (; x <= x1; x++ , r = r + 6) {
                let j = ycount
                if (state) {
                    bytearray[r] |= bitmasky
                    while (j > 0) {
                        bytearray[r + j] = 0xff
                        j -= 1
                    }
                    bytearray[r + ycount + 1] |= bitmasky1
                } else {
                    bytearray[r] &= ~bitmasky
                    while (j > 0) {
                        bytearray[r + j] = 0
                        j -= 1
                    }
                    bytearray[r + ycount + 1] &= ~bitmasky1
                }
            }
        }
    }

    function plotRect(x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        let x = x0, y = y0
        if (x1 < x0) { x = x1; x1 = x0 }
        if (y1 < y0) { y = y1; y1 = y0 }
        if ((y1 | x1) < 0) { return }
        if (y < 0) y = -1
        if (y1 > 47) y1 = 47
        y++
        let bitmaskF0 = FILL_X[y] ^ FILL_X[y1 + 2]
        let bitmaskF1 = FILL_B[y] ^ FILL_B[y1 + 2]
        let bitmaskE0 = FILL_R[y] | FILL_R[y1 + 1]
        let bitmaskE1 = FILL_S[y] | FILL_S[y1 + 1]
        //        if (state) {
        //            orColumnBytes(x, bitmaskF0, bitmaskF1)
        //            orColumnBytes(x1, bitmaskF0, bitmaskF1)
        //            x++
        //            for (; x < x1; x++) { orColumnBytes(x, bitmaskE0, bitmaskE1) }
        //        } else {
        //            andColumnBytes(x, ~bitmaskF0, ~bitmaskF1)
        //            andColumnBytes(x1, ~bitmaskF0, ~bitmaskF1)
        //            x++
        //            for (; x < x1; x++) { andColumnBytes(x, ~bitmaskE0, ~bitmaskE1) }
        //        }
    }

    //% shim=TD_ID
    //% blockId="displaymode_conv" block="%displaymode"
    //% blockHidden=true
    export function lcddm(displaymode: LCDDisplayModes): number {
        return (displaymode || 0)
    }

    function writeFunctionSet(pd: number, v: number, h: number) {
        pins.digitalWritePin(LCD_DC, CMD)
        let byte = 0x20 | (pd << 2) | (v << 1) | (h & 1)
        writeByte(byte)
        _PD = pd
        _V = v
        pins.digitalWritePin(LCD_DC, DAT)
    }

    //% blockId=nokialcd_display_mode
    //% block="set display mode %mode"
    export function lcdDisplayMode(mode: number) {
        pins.digitalWritePin(LCD_DC, CMD)
        _DE = ((mode & 2) << 1) + (mode & 1)
        writeByte(0x08 | _DE)
        pins.digitalWritePin(LCD_DC, DAT)

    }

    export function lcdExtendedFunctions(temp: number, bias: number, vop: number) {
        writeFunctionSet(_PD, _V, 1)
        pins.digitalWritePin(LCD_DC, CMD)
        writeByte(0x04 | (0x03 & temp))
        writeByte(0x10 | (0x07 & bias))
        writeByte(0x80 | (0x7f & vop))
        writeFunctionSet(_PD, _V, 0)
    }

    //% blockId=nokialcd_init
    //% block="init"
    export function init() {
        _V = 1
        pins.digitalWritePin(LCD_RST, 0)
        pins.spiFormat(8, 3)
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.spiFrequency(1000000)
        pins.digitalWritePin(LCD_RST, 1)
        lcdExtendedFunctions(_TEMP, _BIAS, _VOP)
        writeFunctionSet(_PD, _V, 0)
        lcdDisplayMode(2)

    }
    //% blockId=nokialcd_clear
    //% block="clear screen"
    export function clear() {
        bytearray.fill(0)
        writeBuffer(bytearray)
    }

    //% blockId=nokialcd_write_byte
    //% block="LCD Wrt  %data"
    export function writeByte(data: number) {
        pins.digitalWritePin(LCD_CE, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(LCD_CE, 1)
    }

    //% blockId=nokialcd_write_buf
    //% block="LCD write %data"
    //% shim=nokialcd::writeBuf
    export function writeBuf(data: Buffer) {
    }


    //% blockId=nokialcd_write_buffer
    //% block="LCD Wrt %data"
    export function writeBuffer(data: Buffer) {
        pins.digitalWritePin(LCD_CE, 0)
        for (let i = 0; i < data.length(); i++) {
            pins.spiWrite(data[i])
        }
        pins.digitalWritePin(LCD_CE, 1)
    }

    //% blockId=nokialcd_sety
    //% block="set Y address %y"
    export function setY(y: number) {
        pins.digitalWritePin(LCD_DC, CMD)
        writeByte(0x40 + y)
        pins.digitalWritePin(LCD_DC, DAT)

    }
    //% blockId=nokialcd_setx
    //% block="set X address %x"
    export function setX(x: number) {
        pins.digitalWritePin(LCD_DC, CMD)
        writeByte(0x80 + x)
        pins.digitalWritePin(LCD_DC, DAT)
    }
}
