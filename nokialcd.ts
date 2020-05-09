enum LCDDisplayModes {
    //% block="normal"
    Normal = 0,
    //% block="blank"
    Blank = 1,
    //% block="all on"
    AllOn = 2,
    //% block="inverse"
    Inverse = 3
}
/**
* Custom blocks
*/
//% weight=100 color=#0fbc11 icon=""
namespace nokialcd {
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
    export function writeBuf(data: Buffer) {
        writebf(data)
    }
    
    //% shim=nokiaLCD::writeBuf
    function writebf(data: Buffer) {
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
    //% blockId=nokialcd_graph
    //% block="graph %graph"
    export function graph(graph: Buffer) {
        writeBuffer(graph)
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
