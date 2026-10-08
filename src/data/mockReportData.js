export const dailyStats = {
    totalSales: 86.70,
    cashSales: 28.50,
    cardSales: 58.20,
    transactionCount: 12,
    averageTicket: 7.23
};

export const transactions = [
    { id: '#10012', time: '14:25', method: 'Tarjeta', total: 12.50, status: 'completed' },
    { id: '#10011', time: '13:10', method: 'Efectivo', total: 5.00, status: 'completed' },
    { id: '#10010', time: '12:45', method: 'Tarjeta', total: 16.00, status: 'completed' },
    { id: '#10009', time: '11:20', method: 'Tarjeta', total: 3.00, status: 'completed' },
    { id: '#10008', time: '09:55', method: 'Efectivo', total: 9.20, status: 'completed' },
    { id: '#10007', time: '09:45', method: 'Tarjeta', total: 8.00, status: 'completed' },
    { id: '#10006', time: '09:30', method: 'Efectivo', total: 4.50, status: 'completed' },
    { id: '#10005', time: '09:15', method: 'Tarjeta', total: 15.00, status: 'completed' },
    { id: '#10004', time: '09:00', method: 'Efectivo', total: 2.70, status: 'completed' },
];

export const currentTicket = {
    id: '#10012',
    date: '8 Oct 2026, 14:25',
    status: 'PAGADO',
    customer: 'Cliente General',
    items: [
        { name: 'Plato de Comida / Menú', quantity: 1, price: 5.00, subtotal: 5.00 },
        { name: 'Refresco / Bebida', quantity: 2, price: 1.50, subtotal: 3.00 },
        { name: 'Postre / Dulce', quantity: 1, price: 2.00, subtotal: 2.00 },
        { name: 'Café / Infusión', quantity: 2, price: 1.20, subtotal: 2.40 }
    ],
    neto: 10.33,
    tax: 2.17,
    total: 12.50
};
