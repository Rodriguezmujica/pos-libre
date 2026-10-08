export const companySettings = {
    name: 'Punto de Venta General',
    fantasyName: 'Punto de Venta',
    rut: '',
    address: 'España',
    phone: '',
    giro: 'Ventas generales y servicios'
};

export const ticketSettings = {
    showTaxBreakdown: false,
    showCashier: true,
    footerText: '¡Muchas gracias por su colaboración!\nQue tenga un excelente día'
};

export const users = [
    {
        id: 1,
        name: 'Administrador',
        email: 'admin@pos.local',
        role: 'ADMIN',
        avatarColor: '#d2e3fc', // Light Blue
        avatarText: '#174ea6'
    },
    {
        id: 2,
        name: 'Cajero General',
        email: 'cajero@pos.local',
        role: 'CAJERO',
        avatarColor: '#fce8e6',
        avatarText: '#c5221f'
    }
];

export const systemSettings = {
    lowStockAlert: false,
    autoBackup: false,
    minStock: 0,
    taxRate: 21,
    printerName: ''
};
