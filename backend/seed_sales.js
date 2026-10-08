const db = require('./database');

const products = [
    { id: 1, name: 'Refresco / Bebida', price: 1.50 },
    { id: 2, name: 'Plato de Comida / Menú', price: 5.00 },
    { id: 3, name: 'Café / Infusión', price: 1.20 },
    { id: 4, name: 'Corte de Pelo', price: 8.00 },
    { id: 5, name: 'Postre / Dulce', price: 2.00 },
    { id: 6, name: 'Artículo Varios', price: 3.00 }
];

const paymentMethods = ['cash', 'debit', 'credit'];
const cashiers = ['Administrador', 'Cajero General'];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function seedSales() {
    console.log("Seeding past sales...");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    const endDate = new Date();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const insertSale = 'INSERT INTO sales (id, date, total, payment_method, cashier) VALUES (?,?,?,?,?)';
        const insertItem = 'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?,?,?,?)';

        for (let i = 0; i < 50; i++) {
            const date = randomDate(startDate, endDate).toISOString();
            const id = `VENTA-SEED-${Date.now()}-${i}`;
            const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

            // Random items
            const numItems = Math.floor(Math.random() * 3) + 1;
            let total = 0;
            const saleItems = [];

            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                total += product.price * quantity;
                saleItems.push({ product_id: product.id, quantity, price: product.price });
            }

            db.run(insertSale, [id, date, total, paymentMethod, cashier], function (err) {
                if (err) {
                    console.error('Error inserting sale:', err);
                    return;
                }
                saleItems.forEach(item => {
                    db.run(insertItem, [id, item.product_id, item.quantity, item.price]);
                });
            });
        }

        db.run('COMMIT', (err) => {
            if (err) console.error('Commit error:', err);
            else console.log('Sales seeded successfully.');
            process.exit(0);
        });
    });
}

seedSales();
