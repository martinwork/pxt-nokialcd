enum Plots {
    //% block="line"
    Line = 0,
    //% block="box"
    Box = 1,
    //% block="rectangle"
    Rect = 2
}
enum Scrolls {
    //% block="Up"
    Up = 0,
    //% block="Right"
    Right = 1,
    //% block="Down"
    Down = 2,
    //% block="Left"
    Left = 3
}
enum LCDDisplayModes {
    //% block="Normal"
    Normal = 0,
    //% block="Blank"
    Blank = 1,
    //% block="All on"
    AllOn = 2,
    //% block="Inverse"
    Inverse = 3
}

//% weight=100 color=#0fbc11
namespace nokialcd {
    const FILL_X = hex`fffefcf8f0e0c08000`
    const FILL_B = hex`0103070f1f3f7fffff`
    const TWOS = hex`0102040810204080`
    const YMUL = [0, 84, 168, 252, 336, 420, 504]
    const CMD = 0
    const DAT = 1
    const SET_X = 0x80
    const SET_Y = 0x40
    const LCD_RST = DigitalPin.P0
    const LCD_CE = DigitalPin.P8
    const LCD_DC = DigitalPin.P16
    const _TEMP = 0x00
    const _BIAS = 0x03
    const _VOP = 0x3f
    let _DE: number = 0x00
    let _PD: number = 0
    let bytearray: Buffer = pins.createBuffer(84 * 6)

    //% shim=TD_ID
    //% blockId="dir_conv" block="%dir"
    //% blockHidden=true
    export function dirs(dir: Scrolls): number {
        return (dir || 0)
    }

    //% shim=TD_ID
    //% blockId="displaymode_conv" block="%displaymode"
    //% blockHidden=true
    export function lcddm(displaymode: LCDDisplayModes): number {
        return (displaymode || 0)
    }

    //% shim=TD_ID
    //% blockId="plot_conv" block="%plot"
    //% blockHidden=true
    export function pl(plot: Plots): number {
        return (plot || 0)
    }

    //% blockId=nokialcd_pixel
    //% block="pixel at x %x y %y %state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% inlineInputMode=inline
    export function pixel(x: number, y: number, state: boolean): void {
        if (x > 83) { return }
        if (y > 47) { return }
        if ((x | y) < 0) { return }
        let r = x + YMUL[(y >> 3)]
        y = 1 << (y & 0x07)
        if (state) {
            bytearray[r] = bytearray[r] | y
        } else {
            bytearray[r] = bytearray[r] & ~y
        }
    }

    //% blockId=nokialcd_scrollrow
    //% block="scroll display row %row %direction=dir_conv"
    export function scrollRow(row: number, direction: number): void {
        if ((row < 0) || (row > 5)) return
        let r = YMUL[row]
        let r1 = YMUL[row + 1] - 1
        if (direction & 1) {
            if (direction & 2) {
                // left
                for (; r < r1; r++) {
                    bytearray[r] = bytearray[r + 1]
                }
                bytearray[r] = 0
            } else {
                // right
                for (; r1 > r; r1--) {
                    bytearray[r1] = bytearray[r1 - 1]
                }
                bytearray[r] = 0
            }
        }
    }

    //% blockId=nokialcd_scroll
    //% block="scroll display %direction=dir_conv"
    export function scroll(direction: number): void {
        if (direction & 1) {
            if (direction & 2) {
                // left
                for (let i = 0; i < 503; i++) {
                    bytearray[i] = bytearray[i + 1]
                }
                bytearray[83] = 0
                bytearray[167] = 0
                bytearray[251] = 0
                bytearray[335] = 0
                bytearray[419] = 0
                bytearray[503] = 0
            } else {
                // right
                for (let i = 503; i > 0; i--) {
                    bytearray[i] = bytearray[i - 1]
                }
                bytearray[0] = 0
                bytearray[84] = 0
                bytearray[164] = 0
                bytearray[252] = 0
                bytearray[336] = 0
                bytearray[420] = 0
            }
        } else {
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
    export function show(): void {
        writeBuffer(bytearray)
    }

    function plotVLine(x: number, y0: number, y1: number, state: boolean) {
        let y = y0
        if (y0 > y1) { y = y1; y1 = y0 }
        if (((x | y1) < 0) || (x > 83)) return
        if (y < 0) y = 0
        if (y1 > 47) y1 = 47
        if ((y >> 3) == (y1 >> 3)) {
            let bitmask = FILL_X[y & 7] ^ FILL_X[(y1 & 7) + 1]
            let r = x + YMUL[(y >> 3)]
            if (state) bytearray[r] |= bitmask
            else bytearray[r] &= ~bitmask
        } else {
            let bitmask1 = FILL_X[y & 7]
            let bitmask2 = FILL_B[y1 & 7]
            let j = (y1 >> 3) - (y >> 3) - 1
            let r = x + YMUL[(y >> 3)]
            if (state) bytearray[r] |= bitmask1
            else bytearray[r] &= ~bitmask1
            r = r + 84
            while (j > 0) {
                if (state) bytearray[r] = 0xff
                else bytearray[r] = 0
                j -= 1; r = r + 84
            }
            if (state) bytearray[r] |= bitmask2
            else bytearray[r] &= ~bitmask2
        }
    }

    function plotHLine(x0: number, x1: number, y: number, state: boolean) {
        let x = x0
        if (x0 > x1) { x = x1; x1 = x0 }
        if (((x1 | y) < 0) || (y > 47)) return
        if (x < 0) x = 0
        if (x1 > 83) x1 = 83
        let bitmask = TWOS[y & 7]
        let r = x + YMUL[(y >> 3)]
        if (state) {
            for (; x <= x1; x++ , r++)  bytearray[r] |= bitmask
        } else {
            for (; x <= x1; x++ , r++) bytearray[r] &= ~bitmask
        }
    }

    function plotLine(x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        let dx = Math.abs(x1 - x0)
        if (dx == 0) {
            plotVLine(x0, y0, y1, state)
            return
        }
        let dy = Math.abs(y1 - y0)
        if (dy == 0) {
            plotHLine(x0, x1, y0, state)
            return
        }
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

    function plotBox(x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        let x = x0, y = y0
        if (x1 < x0) { x = x1; x1 = x0 }
        if (y1 < y0) { y = y1; y1 = y0 }
        if ((y1 | x1) < 0) { return }
        if (y < 0) y = 0
        if (y1 > 47) y1 = 47
        if (x1 > 83) x1 = 83
        if ((y >> 3) == (y1 >> 3)) {
            let bitmask = FILL_X[y & 7] ^ FILL_X[(y1 & 7) + 1]
            let r = x + YMUL[(y >> 3)]
            if (state) {
                for (; x <= x1; x++ , r++) bytearray[r] |= bitmask
            } else {
                for (; x <= x1; x++ , r++) bytearray[r] &= ~bitmask
            }
        } else {
            let j = (y1 >> 3) - (y >> 3) - 1
            let r = YMUL[(y >> 3)]
            if (state) {
                let bitmask = FILL_X[y & 7]
                for (let i = x; i <= x1; i++)  bytearray[i + r] |= bitmask
                r = r + 84
                while (j > 0) {
                    for (let i = x; i <= x1; i++)  bytearray[i + r] = 0xff
                    j--
                    r = r + 84
                }
                bitmask = FILL_B[y1 & 7]
                for (let i = x; i <= x1; i++)  bytearray[i + r] |= bitmask
            } else {
                let bitmask = ~FILL_X[y & 7]
                for (let i = x; i <= x1; i++)  bytearray[i + r] &= bitmask
                r = r + 84
                while (j > 0) {
                    for (let i = x; i <= x1; i++)  bytearray[i + r] = 0
                    j--
                    r = r + 84
                }
                bitmask = ~FILL_B[y1 & 7]
                for (let i = x; i <= x1; i++)  bytearray[i + r] &= bitmask
            }
        }
    }

    function plotRect(x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        plotHLine(x0, x1, y0, state)
        plotHLine(x0, x1, y1, state)
        plotVLine(x0, y0, y1, state)
        plotVLine(x1, y0, y1, state)
    }


    function writeFunctionSet(pd: number, v: number, h: number): void {
        pins.digitalWritePin(LCD_DC, CMD)
        let byte = 0x20 | (pd << 2) | (v << 1) | (h & 1)
        writeByte(byte)
        _PD = pd
        pins.digitalWritePin(LCD_DC, DAT)
    }

    //% blockId=nokialcd_display_mode
    //% block="set display mode %mode"
    export function lcdDisplayMode(mode: number): void {
        pins.digitalWritePin(LCD_DC, CMD)
        _DE = ((mode & 2) << 1) + (mode & 1)
        writeByte(0x08 | _DE)
        pins.digitalWritePin(LCD_DC, DAT)

    }

    export function lcdExtendedFunctions(temp: number, bias: number, vop: number): void {
        writeFunctionSet(_PD, 0, 1)
        pins.digitalWritePin(LCD_DC, CMD)
        writeByte(0x04 | (0x03 & temp))
        writeByte(0x10 | (0x07 & bias))
        writeByte(0x80 | (0x7f & vop))
        writeFunctionSet(_PD, 0, 0)
    }

    //% blockId=nokialcd_init
    //% block="init"
    export function init(): void {
        pins.digitalWritePin(LCD_RST, 0)
        pins.spiFormat(8, 3)
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.spiFrequency(1000000)
        pins.digitalWritePin(LCD_RST, 1)
        lcdExtendedFunctions(_TEMP, _BIAS, _VOP)
        writeFunctionSet(_PD, 0, 0)
        lcdDisplayMode(2)
        setX(0)
        setY(0)
    }

    //% blockId=nokialcd_clear
    //% block="clear screen"
    export function clear(): void {
        bytearray.fill(0)
        writeBuffer(bytearray)
    }

    //% blockId=nokialcd_write_byte
    //% block="LCD Wrt  %data"
    export function writeByte(data: number): void {
        pins.digitalWritePin(LCD_CE, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(LCD_CE, 1)
    }


    //% blockId=nokialcd_write_buffer
    //% block="LCD Wrt %data"
    export function writeBuffer(data: Buffer): void {
        pins.digitalWritePin(LCD_CE, 0)
        for (let i = 0; i < data.length(); i++) {
            pins.spiWrite(data[i])
        }
        pins.digitalWritePin(LCD_CE, 1)
    }

    //% blockId=nokialcd_sety
    //% block="set Y address %y"
    export function setY(y: number): void {
        pins.digitalWritePin(LCD_DC, CMD)
        writeByte(0x40 + y)
        pins.digitalWritePin(LCD_DC, DAT)

    }

    //% blockId=nokialcd_setx
    //% block="set X address %x"
    export function setX(x: number): void {
        pins.digitalWritePin(LCD_DC, CMD)
        writeByte(0x80 + x)
        pins.digitalWritePin(LCD_DC, DAT)
    }
}
nokialcd.init()
