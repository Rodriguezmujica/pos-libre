const db = require('./database');

const products = [
    { id: 1, name: 'iPhone 15 Pro Max', price: 1200000 },
    { id: 2, name: 'Sony Alpha A7 IV', price: 2500000 },
    { id: 3, name: 'MacBook Air M3', price: 1100000 },
    { id: 4, name: 'Logitech MX Master 3S', price: 100000 },
    { id: 5, name: 'Samsung T9 SSD 2TB', price: 240000 }
];

const paymentMethods = ['cash', 'debit', 'credit'];
const cashiers = ['Admin User', 'Vendedor 1'];

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
                const quantity = Math.floor(Math.random() * 2) + 1;
                total += product.price * quantity;
                saleItems.push({ ...product, quantity });
            }

            db.run(insertSale, [id, date, total, paymentMethod, cashier], function (err) {
                if (err) console.error("Error inserting sale:", err);
            });

            saleItems.forEach(item => {
                db.run(insertItem, [id, item.id, item.quantity, item.price], (err) => {
                    if (err) console.error("Error inserting item:", err);
                });
            });
        }

        db.run('COMMIT', () => {
            console.log("Successfully seeded 50 past sales.");
            console.log("Press Ctrl+C to exit.");
        });
    });
}

// Wait for DB connection
setTimeout(seedSales, 1000);
