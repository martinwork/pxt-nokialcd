/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace nokiaLCD {

    const INIT = hex`21BF0414220C`
    const CMD = 0
    const DAT = 1
    const LCD_RST = DigitalPin.P0
    const LCD_CE = DigitalPin.P1
    const LCD_DC = DigitalPin.P8
    let bytearray = pins.createBuffer(84 * 6)

    //% blockId=nokialcd_init
    //% block="init"
    export function init() {
        pins.digitalWritePin(LCD_RST, 0)
        pins.spiFormat(8, 3)
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.spiFrequency(1000000)
        pins.digitalWritePin(LCD_RST, 1)
        command(INIT)

    }
    //% blockId=nokialcd_clear
    //% block="clear screen"
    export function clear() {
        bytearray.fill(0)
        writeBuffer(bytearray)
    }

    //% blockId=nokialcd_write_byte
    //% block="LCD Wrt %dc %data"
    export function writeByte(dc: number, data: number) {
        pins.digitalWritePin(LCD_DC, dc)
        pins.digitalWritePin(LCD_CE, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(LCD_CE, 1)
    }

    //% blockId=nokialcd_write_buffer
    //% block="LCD Wrt %dc %data"
    export function writeBuffer(data: Buffer) {
        pins.digitalWritePin(LCD_DC, DAT)
        pins.digitalWritePin(LCD_CE, 0)
        for (let i = 0; i < data.length(); i++) {
            pins.spiWrite(data[i])
        }
        pins.digitalWritePin(LCD_CE, 1)
    }
    //% blockId=nokialcd_write_cmd_buffer
    //% block="LCD Wrt %dc %data"
    export function writeCmdBuffer(data: Buffer) {
        pins.digitalWritePin(LCD_DC, CMD)
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

    //% blockId=nokialcd_command
    //% block="command %data"
    export function command(data: Buffer) {
        writeCmdBuffer(data)
    }

    //% blockId=nokialcd_sety
    //% block="set Y address %y"
    export function setY(y: number) {
        let val = pins.createBuffer(1)
        val[0] = 0x40 + y
        command(val)
    }

    //% blockId=nokialcd_setx
    //% block="set X address %x"
    export function setX(y: number) {
        let val = pins.createBuffer(1)
        val[0] = 0x80 + y
        command(val)
    }
}
