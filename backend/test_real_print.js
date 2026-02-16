const printerService = require('./printerService');

async function test() {
    console.log("Testing printer connection...");
    try {
        const result = await printerService.printTicket({
            ticket_id: 'TEST-123',
            fecha_ingreso: new Date().toLocaleDateString(),
            hora_ingreso: new Date().toLocaleTimeString(),
            items: [
                { qty: 1, name: 'TEST ITEM', price: 1000 }
            ],
            total: 1000
        });
        console.log("Print result:", result);
    } catch (error) {
        console.error("Print failed:", error);
    }
}

test();
