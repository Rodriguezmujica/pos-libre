const { Printer } = require('@thiagoelg/node-printer');
const escpos = require('escpos');
// We need to implement a custom adapter for escpos to write to a buffer 
// or use the 'Console' adapter and capture the output, or simply use the underlying encoding functions.
// escpos-printer/adapter/console
const ConsoleAdapter = require('escpos/adapter/console');

class PrinterService {
    constructor() {
        this.printerName = 'Star BSC10 (Copiar 1)';
    }

    getPrinterName() {
        return this.printerName;
    }

    listPrinters() {
        try {
            const printers = new Printer().getPrinters();
            return printers;
        } catch (e) {
            console.error('Error listing printers:', e);
            return [];
        }
    }

    async printTicket(data) {
        // Logic to generate ESC/POS commands
        // 1. Create a dummy adapter to capture the buffer
        // OR simply use the commands directly if we can get the buffer

        // Let's use a specialized approach:
        // Use escpos to generate the buffer

        const device = new ConsoleAdapter();
        const printer = new escpos.Printer(device);

        // We need to "open" the device, but Console doesn't really open.
        // The issue with ConsoleAdapter is that it writes to stdout.
        // We need a BufferAdapter. 
        // If escpos doesn't have one exposed easily, we can mock it.

        // ... Implementation details ...
    }
}

module.exports = new PrinterService();
