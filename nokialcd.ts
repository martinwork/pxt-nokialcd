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
    const LCD_CMD = 0
    const LCD_DAT = 1
    const LCD_RST = DigitalPin.P8
    const LCD_CE = DigitalPin.P12
    const LCD_DC = DigitalPin.P16
    const LCD_TEMP = 0x00
    const LCD_BIAS = 0x03
    const LCD_VOP = 0x3f
    let LCD_DE: number = 0x00
    let bytearray: Buffer = initBuffer()

    //% shim=nokialcd::initBuffer
    function initBuffer(): Buffer {
        return pins.createBuffer(504)
    }
    //% shim=nokialcd::SPIinit
    function SPIinit(): void {
        return
    }
    //% blockId=nokialcd_write_byte
    //% block="LCD Wrt  %data"
    export function writeByte(data: number): void {
        pins.digitalWritePin(LCD_CE, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(LCD_CE, 1)
    }
    //% shim=nokialcd::writeFunctionSet
    function writeFunctionSet(v: number, h: number): void {
        pins.digitalWritePin(LCD_DC, LCD_CMD)
        let byte = 0x20 | (v << 1) | (h & 1)
        writeByte(byte)
        pins.digitalWritePin(LCD_DC, LCD_DAT)
    }
    export function init(): void {
        basic.showNumber(1)
        SPIinit()
        basic.showNumber(2)
        writeFunctionSet(0, 1)
        basic.showNumber(3)
        lcdExtendedFunctions(0, 3, 63)
        writeFunctionSet(0, 0)
        lcdDisplayMode(2)
        setX(0)
        setY(0)
        setState(true)
        basic.showNumber(4)
    }

    //% shim=nokialcd::writeSPIBuf
    function writeSPIBuf(): void {
        return
    }

    //% blockId=nokialcd_show
    //% block="show"
    export function show(): void {
        setY(0)
        writeSPIBuf()
    }

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
    //% shim=nokialcd::pixel
    export function pixel(x: number, y: number, state: boolean): void {
        return
    }

    //% shim=nokialcd::scrollRow
    //% block="scroll row %row direction %direction=dir_conv step %step"
    export function scrollRow(row: number, direction: number, step: number): void {
        return
    }

    //% blockId=nokialcd_display_row
    //% block="show row %row"
    export function displayRow(row: number): void {
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

    //% shim=nokialcd::setState
    function setState(s: boolean) {
        return
    }

    //% shim=nokialcd::pLine
    function pLine(x0: number, y0: number, x1: number, y1: number): void {
        return
    }

    //% blockId=nokialcd_plot
    //% block="draw %plot=plot_conv from x %x0 y %y0 to x %x1 y %y1 $state"
    //% state.shadow="toggleOnOff" state.defl=true
    //% inlineInputMode=inline
    export function plot(plot: Plots, x0: number, y0: number, x1: number, y1: number, state: boolean): void {
        setState(state)
        switch (plot) {
            case 0: { pLine(x0, y0, x1, y1); break }
            case 1: { pBox(x0, y0, x1, y1); break }
            case 2: {
                hLine(x0, x1, y0)
                hLine(x0, x1, y1)
                vLine(x0, y0, y1)
                vLine(x1, y0, y1)
                break
            }
            default: pLine(x0, y0, x1, y1)
        }
    }




    //% shim=nokialcd::vLine
    function vLine(x: number, y0: number, y1: number): void {
        return
    }

    //% shim=nokialcd::hLine
    function hLine(x0: number, x1: number, y: number): void {
        return
    }

    //% shim=nokialcd::pBox
    function pBox(x0: number, y0: number, x1: number, y1: number): void {
        return
    }

    //% blockId=nokialcd_clear
    //% block="clear screen"
    export function clear(): void {
        bytearray.fill(0)
        writeBuffer(bytearray)
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
    //% block="set y address %y"
    //% shim=nokialcd::setYAddr
    export function setY(y: number): void {
        return
    }

    //% blockId=nokialcd_setx
    //% block="set X address %x"
    //% shim=nokialcd::setXAddr
    export function setX(x: number): void {
        return
    }
    //% shim=nokialcd::init2
    export function init2(): void {
        return
    }


    //% blockId=nokialcd_display_mode
    //% block="set display mode %mode"
    export function lcdDisplayMode(mode: number): void {
        pins.digitalWritePin(LCD_DC, LCD_CMD)
        LCD_DE = ((mode & 2) << 1) + (mode & 1)
        writeByte(0x08 | LCD_DE)
        pins.digitalWritePin(LCD_DC, LCD_DAT)

    }

    export function lcdExtendedFunctions(temp: number, bias: number, vop: number): void {
        pins.digitalWritePin(LCD_DC, LCD_CMD)
        writeByte(0x04 | (0x03 & temp))
        writeByte(0x10 | (0x07 & bias))
        writeByte(0x80 | (0x7f & vop))
    }


}
basic.showNumber(1)
nokialcd.init()

