export const dailyStats = {
    totalSales: 362960,
    cashSales: 15500 + 22400, // Sum of cash transactions for demo
    cardSales: 42990 + 125000 + 8990, // Sum of card transactions for demo
    transactionCount: 24,
    averageTicket: 15123
};

export const transactions = [
    { id: '#28491', time: '14:25', method: 'Tarjeta', total: 42990, status: 'completed' },
    { id: '#28490', time: '13:10', method: 'Efectivo', total: 15500, status: 'completed' },
    { id: '#28489', time: '12:45', method: 'Tarjeta', total: 125000, status: 'completed' },
    { id: '#28488', time: '11:20', method: 'Tarjeta', total: 8990, status: 'completed' },
    { id: '#28487', time: '09:55', method: 'Efectivo', total: 22400, status: 'completed' },
    { id: '#28486', time: '09:45', method: 'Tarjeta', total: 35000, status: 'completed' },
    { id: '#28485', time: '09:30', method: 'Efectivo', total: 12000, status: 'completed' },
    { id: '#28484', time: '09:15', method: 'Tarjeta', total: 45000, status: 'completed' },
    { id: '#28483', time: '09:00', method: 'Efectivo', total: 8500, status: 'completed' },
];

export const currentTicket = {
    id: '#28491',
    date: '15 Oct 2023, 14:25 PM',
    status: 'PAGADO',
    customer: 'Cliente General',
    items: [
        { name: 'Audífonos Sony WH-1000XM5', quantity: 1, price: 329990, subtotal: 329990 },
        { name: 'Case Silicona iPhone 14', quantity: 1, price: 12990, subtotal: 12990 },
        { name: 'Cable USB-C a Lightning', quantity: 2, price: 9990, subtotal: 19980 }
    ],
    neto: 304992,
    tax: 57968,
    total: 362960
};
