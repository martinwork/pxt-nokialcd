#include "pxt.h"
#define LCD_CE = 1

using namespace pxt;

enum class LCDDisplayModes {
    //% block="normal"
    Normal = 0,
    //% block="blank"
    Blank = 1,
    //% block="all on"
    AllOn = 2,
    //% block="inverse"
    Inverse = 3
};


namespace nokialcd {

    //%
    void writeBuf(Buffer buf) {
//        MicroBitPin P0(MICROBIT_ID_IO_P1, MICROBIT_PIN_P1, PIN_CAPABILITY_BOTH);
//        pins.digitalWritePin(DigitalPin.P1, 0);
//        for (int i = 0; i < buf->length; i++) {
 //           pins.spiWrite(buf->data[i]);
//            pins.spiWrite(0);
//        }
//        uBit.io.P1.SetDigitalValue(1);
    }
  
}