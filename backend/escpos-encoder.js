

class EscPosEncoder {
    constructor() {
        this.buffer = Buffer.alloc(0);
        // Init: ESC @
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1B, 0x40])]);
        // Code Page 1252 (WPC1252): ESC t 16 (usually)
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1B, 0x74, 16])]);
    }

    text(content) {
        const str = String(content);
        // Convert 'ñ' etc. to CP1252 (single byte) if possible.
        // Node 'latin1' maps 0-255 unicode to 0-255 bytes.
        // This works for Spanish mostly.
        const buf = Buffer.from(str, 'latin1');
        this.buffer = Buffer.concat([this.buffer, buf]);
        return this;
    }

    newline() {
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x0A])]);
        return this;
    }

    feed(n) {
        // ESC d n
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1B, 0x64, n || 1])]);
        return this;
    }

    align(align) {
        // ESC a n
        let n = 0;
        if (align === 'center' || align === 'ct') n = 1;
        if (align === 'right' || align === 'rt') n = 2;
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1B, 0x61, n])]);
        return this;
    }

    bold(active) {
        // ESC E n
        const n = active ? 1 : 0;
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1B, 0x45, n])]);
        return this;
    }

    size(width, height) {
        // GS ! n
        // n = ((width-1) << 4) | (height-1)
        // width, height: 1-8
        // Original: setTextSize(2,1) -> width 2.
        const w = (width || 1) - 1;
        const h = (height || 1) - 1;
        const n = (w << 4) | h;
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1D, 0x21, n])]);
        return this;
    }

    // Barcode: GS k m d1...dk 00 (Code39)
    barcode(data, width, height) {
        // Set Width: GS w n (2 default)
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1D, 0x77, width || 2])]);

        // Set Height: GS h n (80 default)
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1D, 0x68, height || 80])]);

        // Print: GS k 4 data 00
        const content = String(data);
        const dataBuf = Buffer.from(content, 'ascii');
        this.buffer = Buffer.concat([
            this.buffer,
            Buffer.from([0x1D, 0x6B, 0x04]),
            dataBuf,
            Buffer.from([0x00])
        ]);
        return this;
    }

    cut() {
        // GS V 66 0 (Feed & Cut)
        this.buffer = Buffer.concat([this.buffer, Buffer.from([0x1D, 0x56, 66, 0])]);
        return this;
    }

    getBuffer() {
        return this.buffer;
    }
}

module.exports = EscPosEncoder;
