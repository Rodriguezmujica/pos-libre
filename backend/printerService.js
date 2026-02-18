const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EscPosEncoder = require('./escpos-encoder');

class PrinterService {
    constructor() {
        this.printerName = 'POS-58C';
        this.tmpDir = os.tmpdir();
    }

    getPrinterName() {
        return this.printerName;
    }

    async listPrinters() {
        return new Promise((resolve, reject) => {
            const cmd = 'powershell -Command "Get-Printer | Select-Object Name | ConvertTo-Json"';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error listing printers:', error);
                    resolve([]);
                    return;
                }
                try {
                    const printers = JSON.parse(stdout);
                    const list = Array.isArray(printers) ? printers.map(p => p.Name) : [printers.Name];
                    resolve(list);
                } catch (e) {
                    // console.error('Error parsing printer list:', e);
                    resolve([]);
                }
            });
        });
    }

    async printTicket(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const encoder = new EscPosEncoder();

                // Setup Company Data
                const company = data.company || {};
                const name = company.name || 'INVERSIONES ROSNER';
                const subtitle = company.legalName || 'Estacionamiento y Lavado'; // Or 'Venta de Accesorios'
                const address = company.address || 'Perez Rosales #733-C';
                const location = 'Santiago, Chile'; // Could be part of address
                const phone = company.phone ? `Tel: ${company.phone}` : 'Tel: +56 9 3395 8739';
                const rut = company.rut ? `RUT: ${company.rut}` : '';

                // Header
                encoder.align('center');
                encoder.bold(true);
                encoder.size(1, 1);

                encoder.text(name).newline();
                encoder.bold(false);
                if (subtitle) encoder.text(subtitle).newline();
                encoder.text('================================').newline();
                if (rut) encoder.text(rut).newline();
                if (address) encoder.text(address).newline();
                // encoder.text(location).newline();
                if (phone) encoder.text(phone).newline();
                encoder.text('================================').newline().newline();

                // Title
                encoder.bold(true);
                encoder.text('TICKET DE VENTA').newline();
                encoder.bold(false);
                encoder.text(`Fecha: ${data.fecha_ingreso || new Date().toLocaleDateString()}`).newline();
                encoder.text(`Hora:  ${data.hora_ingreso || new Date().toLocaleTimeString()}`).newline();
                encoder.text('--------------------------------').newline().newline();

                // Details
                encoder.align('left'); // Justify Left
                // Loop items if passed (Sales Ticket)
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                        const line = `${item.qty} x ${item.name}`;
                        // Truncate if too long?
                        encoder.text(line.substring(0, 32)).newline();

                        // Price aligned right? simpler to just put it below or use spacing if we calculate width
                        // For now simple:
                        encoder.text(`   $${(item.price * item.qty).toLocaleString('es-CL')}`).newline();
                    });
                    encoder.text('--------------------------------').newline();
                    encoder.align('right');
                    encoder.bold(true);
                    encoder.text(`TOTAL: $${(data.total || 0).toLocaleString('es-CL')}`).newline();
                    encoder.bold(false);
                } else {
                    // Fallback
                    encoder.text(`Ticket: ${data.ticket_id}`).newline();
                    encoder.text('--------------------------------').newline();
                }

                // Barcode / Patent - REMOVED per user request
                // const barcodeData = (data.ticket_id || '00000').replace(/[^A-Z0-9-]/g, '');

                // encoder.align('center');
                // encoder.newline();
                // try {
                //    encoder.barcode(barcodeData, 3, 60);
                // } catch(e) {}
                // encoder.feed(1);

                // encoder.bold(true);
                // encoder.text(barcodeData).newline();
                // encoder.bold(false);

                // Instead of barcode, just print the Ticket ID cleanly
                encoder.align('center');
                encoder.newline();
                encoder.bold(true);
                encoder.text(`Ticket #${data.ticket_id}`).newline();
                encoder.bold(false);

                // Footer
                encoder.newline();
                const footerText = data.footer || 'Gracias por su preferencia.';
                encoder.text(footerText).newline();

                encoder.feed(3);
                encoder.cut();

                // Write to File
                const buffer = encoder.getBuffer();
                const timestamp = Date.now();
                const filename = `ticket_${timestamp}.bin`;
                const filePath = path.join(this.tmpDir, filename);

                fs.writeFileSync(filePath, buffer);

                // Print
                // DIRECTLY USE POWERSHELL (Robust for USB)
                const printerName = data.printerName || this.printerName;
                console.log(`Using printer: ${printerName}`);
                const psScript = path.join(__dirname, 'printRaw.ps1');

                // Escape quotes for PowerShell if needed, but usually exec handles it if we are careful.
                // Best to use spawn or carefully quote.
                // cmd string for exec:
                const psCmd = `powershell -ExecutionPolicy Bypass -File "${psScript}" -PrinterName "${printerName}" -FilePath "${filePath}"`;

                console.log(`Executing print command: ${psCmd}`);

                exec(psCmd, (psErr, psOut, psStderr) => {
                    if (psErr) {
                        console.error("Print failed:", psErr);
                        console.error("Stderr:", psStderr);
                        reject(psErr);
                    } else {
                        console.log("Print success output:", psOut);
                        resolve({ success: true, method: 'powershell' });
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new PrinterService();
