import React, { useState } from 'react';
import { Printer, Calendar, ArrowLeft, CreditCard, Banknote, User, RotateCcw } from 'lucide-react';
import styles from '../styles/DailyReport.module.css';
import { dailyStats, transactions, currentTicket } from '../data/mockReportData';

const DailyReport = ({ onBack, sales = [] }) => {
    const [filterType, setFilterType] = useState('today'); // 'today' | 'month'
    const [selectedId, setSelectedId] = useState(null);

    // Filtrar ventas
    const getFilteredSales = () => {
        const now = new Date();
        const today = now.toLocaleDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            if (filterType === 'today') {
                return saleDate.toLocaleDateString() === today;
            } else {
                return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
            }
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar por fecha descendente
    };

    const filteredSales = getFilteredSales();

    // Seleccionar el primer ticket por defecto si no hay ninguno seleccionado
    React.useEffect(() => {
        if (!selectedId && filteredSales.length > 0) {
            setSelectedId(filteredSales[0].id);
        }
    }, [filteredSales, selectedId]);

    const currentTicket = filteredSales.find(s => s.id === selectedId) || null;

    // Calcular KPIs
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const cashSales = filteredSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const cardSales = filteredSales.filter(s => ['debit', 'credit'].includes(s.paymentMethod)).reduce((sum, s) => sum + s.total, 0);

    const cashPercentage = totalSales > 0 ? (cashSales / totalSales) * 100 : 0;
    const cardPercentage = totalSales > 0 ? (cardSales / totalSales) * 100 : 0;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Reportes de Ventas</h1>
                    <span className={styles.subtitle}>Monitorea el rendimiento financiero de tu tienda en tiempo real.</span>
                </div>
                <div className={styles.controls}>
                    <div className={styles.dateFilter}>
                        <div className={styles.dateInput}>{new Date().toLocaleDateString()}</div>
                        <div className={styles.filterBtn}><Calendar size={16} /></div>
                    </div>
                    <button
                        className={`${styles.filterBtn} ${filterType === 'today' ? styles.active : ''}`}
                        onClick={() => setFilterType('today')}
                    >
                        Hoy
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filterType === 'month' ? styles.active : ''}`}
                        onClick={() => setFilterType('month')}
                    >
                        Este Mes
                    </button>
                    <button className={styles.primaryBtn} onClick={() => window.print()}>
                        <Printer size={18} />
                        Imprimir Reporte
                    </button>
                    <button className={styles.backBtn} onClick={onBack}>
                        <ArrowLeft size={18} />
                        Volver
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.dashboardGrid}>
                {/* Total Sales */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Venta Total (CLP)</div>
                    <div className={styles.cardValue}>${totalSales.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</div>
                    <div className={`${styles.trend} ${styles.trendUp}`}>
                        ↗ {filteredSales.length} transacciones
                    </div>
                </div>

                {/* Cash Sales */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Ventas Efectivo</div>
                    <div className={styles.cardValue}>${cashSales.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${cashPercentage}%`, background: '#0f9d58' }}></div>
                    </div>
                    <div className={styles.cardFooter}>{cashPercentage.toFixed(1)}% DEL TOTAL</div>
                </div>

                {/* Card Sales */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Ventas Tarjetas</div>
                    <div className={styles.cardValue}>${cardSales.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${cardPercentage}%`, background: '#1a73e8' }}></div>
                    </div>
                    <div className={styles.cardFooter}>{cardPercentage.toFixed(1)}% DEL TOTAL</div>
                </div>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {/* Left Side: Transaction List */}
                <div className={styles.leftColumn}>
                    <div className={styles.sectionTitle}>Ventas del Período</div>

                    <div className={styles.tableCard}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Buscar boleta..."
                                className={styles.searchInput}
                            />
                        </div>

                        <div className={styles.tableHeader}>
                            <div>HORA</div>
                            <div>Nº BOLETA</div>
                            <div>MÉTODO DE PAGO</div>
                            <div style={{ textAlign: 'right' }}>TOTAL</div>
                        </div>

                        <div className={styles.tableBody}>
                            {filteredSales.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No hay ventas registradas en este período.</div>
                            ) : (
                                filteredSales.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className={`${styles.tableRow} ${selectedId === tx.id ? styles.active : ''}`}
                                        onClick={() => setSelectedId(tx.id)}
                                    >
                                        <div>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className={styles.boletaId}>{tx.id.split('-')[1]}...</div>
                                        <div>
                                            <span className={`${styles.methodTag} ${tx.paymentMethod !== 'cash' ? styles.methodCard : styles.methodCash}`}>
                                                {tx.paymentMethod !== 'cash' ? <CreditCard size={12} /> : <Banknote size={12} />}
                                                {tx.paymentMethod === 'cash' ? 'Efectivo' : tx.paymentMethod === 'debit' ? 'Débito' : 'Crédito'}
                                            </span>
                                        </div>
                                        <div className={styles.amount}>${tx.total.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Ticket Detail */}
                <div className={styles.rightColumn}>
                    {currentTicket ? (
                        <div className={styles.ticketCard}>
                            <div className={styles.ticketHeader}>
                                <div className={styles.ticketTitle}>
                                    <h2>Boleta {currentTicket.id}</h2>
                                    <div className={styles.ticketTime}>{new Date(currentTicket.date).toLocaleString()}</div>
                                </div>
                                <span className={styles.statusBadge}>{currentTicket.status}</span>
                            </div>

                            <div className={styles.customerInfo}>
                                <div className={styles.customerAvatar}>
                                    <User size={18} />
                                </div>
                                <span className={styles.customerName}>{currentTicket.cashier}</span>
                            </div>

                            {/* Items */}
                            <div className={styles.ticketItems}>
                                <div className={styles.tableHeader} style={{ padding: '0 0 8px 0', background: 'transparent', borderBottom: '1px solid #f1f3f4', marginBottom: '16px', gridTemplateColumns: '3fr 1fr 1fr' }}>
                                    <div>PRODUCTO</div>
                                    <div style={{ textAlign: 'center' }}>CANT</div>
                                    <div style={{ textAlign: 'right' }}>SUBTOTAL</div>
                                </div>

                                {currentTicket.items && (currentTicket.items || []).map((item, index) => (
                                    <div key={index} className={styles.itemRow}>
                                        <div className={styles.itemInfo}>
                                            <span className={styles.itemName}>{item.name}</span>
                                            <span className={styles.itemMeta}>${item.price.toLocaleString('es-CL')} unit.</span>
                                        </div>
                                        <div className={styles.itemQty}>{item.quantity}</div>
                                        <div className={styles.itemTotal}>${item.subtotal.toLocaleString('es-CL')}</div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.ticketSummary}>
                                <div className={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>${(currentTicket.subtotal || 0).toLocaleString('es-CL')}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>IVA (16%)</span>
                                    <span>${(currentTicket.tax || 0).toLocaleString('es-CL')}</span>
                                </div>
                                <div className={styles.totalRow}>
                                    <span className={styles.totalLabel}>TOTAL</span>
                                    <span className={styles.totalValue}>${(currentTicket.total || 0).toLocaleString('es-CL')}</span>
                                </div>
                            </div>

                            <button className={styles.reprintBtn} onClick={() => window.print()}>
                                <RotateCcw size={18} />
                                Reimprimir
                            </button>
                        </div>
                    ) : (
                        <div className={styles.ticketCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                            Selecciona una venta para ver el detalle
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyReport;
