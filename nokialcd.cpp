#include "pxt.h"
#define mbit_p8                     P0_18       //PIN 18
#define mbit_p12                    P0_20       //PIN 20
#define mbit_p13                    P0_23       //SCK
#define mbit_p14                    P0_22       //MISO
#define mbit_p15                    P0_21       //MOSI
#define mbit_p16                    P0_16       //PIN 16
#define LCD_CMD                         0
#define LCD_DAT                         1
#define LCD_TEMP                        0
#define LCD_BIAS                        3
#define LCD_VOP                         63

using namespace pxt;
    
namespace pins
{
    extern SPI* allocSPI();
    extern int  spiWrite(int value);
    extern void spiFrequency(int frequency);
    extern void spiFormat(int bits, int mode);
}

using namespace pins;


namespace nokialcd {

    DigitalOut LCD_CE(mbit_p12);
    DigitalOut LCD_RST(mbit_p8);
    DigitalOut LCD_DC(mbit_p16);
    static Buffer bytearray = NULL;
    static bool state = true;
    static int lcdDE = 0;

    //%
    void setState(bool s) {
        state = s;
    }

    //%
    void writeSPIByte(int b) {
        auto spi = allocSPI();
        LCD_CE = 0;
        spi->write(b);
        LCD_CE = 1;
    }
    //%
    void writeSPIBuf() {
        auto spi = allocSPI();
        LCD_CE = 0;
        uint8_t *data = bytearray->data;
        for (int i = 0; i < 504; i++, data++) {
            spi->write( *data);
        }
        LCD_CE = 1;
    }
    //%
    void setYAddr(int y) {
        LCD_DC = LCD_CMD;
        writeSPIByte(0x40 + y);
        LCD_DC = LCD_DAT;
    }

    //%
    void setXAddr(int x) {
        LCD_DC = LCD_CMD;
        writeSPIByte(0x80 + x);
        LCD_DC = LCD_DAT;
    }


    void lcdDisplayMode(int mode) {
        lcdDE = ((mode & 2) << 1) + (mode & 1);
        LCD_DC = LCD_CMD;
        writeSPIByte(0x08 | lcdDE);
        LCD_DC = LCD_DAT;
    }
    void writeFunctionSet(int v, int h) {
        auto spi = allocSPI();
        LCD_DC = LCD_CMD;
        LCD_CE = 0;
        spi->write(0x20 | (v << 1) | (h & 1));
        LCD_CE = 1;
        LCD_DC = LCD_DAT;
    }    
    void lcdExtendedFunctions(int temp, int bias, int vop) {
        LCD_DC = LCD_CMD;
        writeSPIByte(0x21);
        writeSPIByte(0x04 | (0x03 & temp));
        writeSPIByte(0x10 | (0x07 & bias));
        writeSPIByte(0x80 | (0x7f & vop));
        writeSPIByte(0x20);
        LCD_DC = LCD_DAT;
    }
    //%
    void SPIinit() {
        LCD_CE = 1;
        lcdDE = 0;
        LCD_RST = 0;
        spiFormat(8,0);
        spiFrequency(1000000);
        wait(0.5);
        LCD_RST = 1;
        writeFunctionSet(0, 1);
        lcdExtendedFunctions(0, 3, 63);
        writeFunctionSet(0, 0);
        lcdDisplayMode(2);
        setXAddr(0);
        setYAddr(0);
        setState(true);
    }
    //%
    void writeBufToLCD() {
        setYAddr(0);
        writeSPIBuf();
    }
    //%
    Buffer initBuffer() {
        bytearray = mkBuffer(NULL,504);
        return bytearray;
    }

    //%
    void pixel(int x, int y, bool state) {
        if (x > 83) {
                return;
                }
        if (y > 47) {
            return;
            }
        if ((x | y) < 0) {
            return;
            }
        uint8_t qy = 1 << (y & 7);
        int r = x + 84 * (y >> 3);
        if (state) {
        bytearray->data[r] |=  qy;
        } else {
        bytearray->data[r] &=  ~qy;
        }
    }

    //%
    void scrollRow(int row, int direction, int step) {
        if ((row < 0) || (row > 5)) return;
        row *= 84;
        int r1 = row + 83;
        if (direction & 1) {
            if (direction & 2) {
                // left
                for (; row < r1; row++) {
                    bytearray->data[row] = bytearray->data[row + 1];
                }
                bytearray->data[row] = 0;
            } else {
                // right
                for (; r1 > row; r1--) {
                    bytearray->data[r1] = bytearray->data[r1 - 1];
                }
                bytearray->data[row] = 0;
            }
        }
    }
    
    //%
    void scrollRowStep(int row, int direction, int step) {
        if ((row < 0) || (row > 5)) return;
        row *= 84;
        int r1 = row + 83;
        if (direction & 1) {
            if (direction & 2) {
                // left
                for (; row < r1; row++) {
                    bytearray->data[row] = bytearray->data[row + 1];
                }
                bytearray->data[row] = 0;
            } else {
                // right
                for (; r1 > row; r1--) {
                    bytearray->data[r1] = bytearray->data[r1 - 1];
                }
                bytearray->data[row] = 0;
            }
        }
    }

    //%
   void vLine(int x, int y0, int y1) {
        int y = y0;
        if (y0 > y1) {
            y = y1;
            y1 = y0;
            }
        if (((x | y1) < 0) || (x > 83)) return;
        if (y < 0) y = 0;
        if (y1 > 47) y1 = 47;
        uint8_t bitmask = 0xff << (y & 7);
        int r = x + 84 *(y >> 3);
        if ((y >> 3) == (y1 >> 3)) {
            bitmask ^= 0xfe <<  (y1 & 7);
            if (state) bytearray->data[r] |= bitmask;
            else bytearray->data[r] &= ~bitmask;
        }
        else {
            int j = (y1 >> 3) - (y >> 3) - 1;
            if (state) bytearray->data[r] |= bitmask;
            else bytearray->data[r] &= ~bitmask;
            r = r + 84;
            if (state) {
                while (j > 0) {
                    bytearray->data[r] = 0xff;
                    j -= 1;
                    r = r + 84;
                }
            } else {
                while (j > 0) {
                    bytearray->data[r] = 0;
                    j -= 1;
                    r = r + 84;
                }
            }
            bitmask = (2 << (y1 & 7)) - 1;
            if (state) bytearray->data[r] |= bitmask;
            else bytearray->data[r] &= ~bitmask;
        }
    }
    
    //%
    void hLine(int x0, int x1, int y) {
        int x = x0;
        if (x0 > x1) { x = x1; x1 = x0; }
        if (((x1 | y) < 0) || (y > 47)) return;
        if (x < 0) x = 0;
        if (x1 > 83) x1 = 83;
        uint8_t bitmask = 1 << (y & 7);
        int r = x + 84 * (y >> 3);
        if (state) {
            for (; x <= x1; x++ , r++)  bytearray->data[r] |= bitmask;
        } else {
            bitmask = ~bitmask;
            for (; x <= x1; x++ , r++) bytearray->data[r] &= bitmask;
        }
    }

    //%
    void pLine(int x0, int y0, int x1, int y1) {
        int dx = abs(x1 - x0);
        if (dx == 0) {
            vLine(x0, y0, y1);
            return;
        }
        int dy = abs(y1 - y0);
        if (dy == 0) {
            hLine(x0, x1, y0);
            return;
        }
        int x = x0;
        int y = y0;
        if (dx > dy) {
            if (x0 > x1) { x = x1; y = y1; x1 = x0; y1 = y0; }
            int yc = (y1 > y) ? 1 : -1;
            int mid = (x + x1) >> 1;
            int a = dy << 1;
            int p = a - dx;
            int b = p - dx;
            pixel(x, y, state);
            while (x < x1) {
                if ((p < 0) || ((p == 0) && (x >= mid))) { p += a; }
                else { p = p + b; y += yc; }
                x++;
                pixel(x, y, state);
            }
        } else {
            if (y0 > y1) { x = x1; y = y1; x1 = x0; y1 = y0; }
            int xc = (x1 > x) ? 1 : -1;
            int mid = (y + y1) >> 1;
            int a = dx << 1;
            int p = a - dy;
            int b = p - dy;
            pixel(x, y, state);
            while (y < y1) {
                if ((p < 0) || ((p == 0) && (y >= mid))) { p += a; }
                else { p = p + b; x += xc; }
                y++; pixel(x, y, state);
            }
        }
    }

    //%
    void pBox(int x0, int y0, int x1, int y1) {
        int x = x0;
        int y = y0;
        if (x1 < x0) { x = x1; x1 = x0; }
        if (y1 < y0) { y = y1; y1 = y0; }
        if ((y1 | x1) < 0) {
            return;
        }
        if (y < 0) y = 0;
        if (y1 > 47) y1 = 47;
        if (x1 > 83) x1 = 83; 
        uint8_t bitmask = 0xff << (y & 7);
        y >>= 3;
        if (y == (y1 >> 3)) {
            bitmask ^= 0xfe << (y1 & 7);
            int r = 84 * y + x;
            if (state) {
                for (; x <= x1; x++ , r++) { bytearray->data[r] |= bitmask; }
            } else {
                bitmask = ~bitmask;
                for (; x <= x1; x++ , r++) { bytearray->data[r] &= bitmask; }
            }
        }
        else {
            int j = (y1 >> 3) - y - 1;
            int r = 84 * y;
            if (state) {
                for (int i = x; i <= x1; i++)  { bytearray->data[i + r] |= bitmask; }
                r += 84;
                while (j > 0) {
                    for (int i = x; i <= x1; i++)  { bytearray->data[i + r] = 0xff; }
                    j--;
                    r += 84;
                }
                bitmask = (2 << (y1 & 7)) - 1;
                for (int i = x; i <= x1; i++) { bytearray->data[i + r] |= bitmask; }
            } else {
                bitmask = ~bitmask;
                for (int i = x; i <= x1; i++) { bytearray->data[i + r] &= bitmask; }
                r += 84;
                while (j > 0) {
                    for (int i = x; i <= x1; i++) { bytearray->data[i + r] = 0; }
                    j--;
                    r += 84;
                }
                bitmask = 0xfe << (y1 & 7);
                for (int i = x; i <= x1; i++) { bytearray->data[i + r] &= bitmask; }
            }
        }
    }
}