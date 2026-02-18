export const companySettings = {
    name: 'Accesorios Tech Chile SpA',
    fantasyName: 'TecniWorld',
    rut: '76.123.456-K',
    address: 'Av. Providencia 1234, Oficina 502, Santiago',
    phone: '+56 9 8765 4321',
    giro: 'Retail de accesorios electrónicos'
};

export const ticketSettings = {
    showTaxBreakdown: true,
    showCashier: true,
    footerText: '¡Gracias por preferir Tech Chile!\nSiguenos en @tech_chile'
};

export const users = [
    {
        id: 1,
        name: 'Andrés Contreras',
        email: 'andres@techchile.cl',
        role: 'ADMIN',
        avatarColor: '#d2e3fc', // Light Blue
        avatarText: '#174ea6'
    },
    {
        id: 2,
        name: 'María Valencia',
        email: 'maria.v@techchile.cl',
        role: 'CAJERO',
        avatarColor: '#fce8e6', // Light Red/Orange
        avatarText: '#c5221f' // Actually using yellow/orange based on image for 'MV'
    }
];

export const systemSettings = {
    lowStockAlert: true,
    autoBackup: false,
    minStock: 5,
    taxRate: 19,
    printerName: 'POS-58C'
};
