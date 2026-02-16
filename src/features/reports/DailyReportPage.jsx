import React, { useState, useMemo, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { api } from '../../services/api'; // Import api
import { Printer, ArrowLeft, CreditCard, Banknote, User, X, Search, TrendingUp, TrendingDown, History } from 'lucide-react'; // Added History icon
import styles from '../../styles/DailyReport.module.css';

const DailyReportPage = ({ onBack, sales = [], user, onVoidSale, inventory = [] }) => {
    const { showModal } = useUI();
    const [filterType, setFilterType] = useState('today'); // 'today' | 'month' | 'custom' | 'shifts'
    const [selectedId, setSelectedId] = useState(null);
    const [shiftHistory, setShiftHistory] = useState([]); // State for history

    // ... (rest of the component) ...



    // Custom date range state
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Load history when filterType is 'shifts' - solo si el usuario es ADMIN (el endpoint requiere ADMIN)
    useEffect(() => {
        if (filterType === 'shifts') {
            if (user?.role !== 'ADMIN') {
                setShiftHistory([]); // No mostrar datos si no es admin
                return;
            }
            api.getCashSessionHistory()
                .then(res => setShiftHistory(res.data || []))
                .catch(err => {
                    console.error('Error fetching shift history:', err);
                    setShiftHistory([]); // Evitar estado inconsistente
                });
        }
    }, [filterType, user?.role]);

    // Filtrar ventas
    const getFilteredSales = () => {
        const now = new Date();
        const today = now.toLocaleDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return sales.filter(sale => {
            const saleDate = new Date(sale.date);

            // Text search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const idMatch = sale.id.toLowerCase().includes(searchLower);
                if (!idMatch) return false;
            }

            if (filterType === 'today') {
                return saleDate.toLocaleDateString() === today;
            } else if (filterType === 'month') {
                return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
            } else if (filterType === 'custom') {
                // Fix timezone issue by parsing parts manually
                const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

                const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
                const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

                return saleDate >= start && saleDate <= end;
            }
            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar por fecha descendente
    };

    const filteredSales = getFilteredSales();

    // Calculate Ranking Stats
    const rankingStats = useMemo(() => {
        // Map sales to product name
        const salesMap = {};
        // Use filteredSales to get meaningful stats for the period
        filteredSales.forEach(sale => {
            if (sale.status === 'VOIDED') return;
            (sale.items || []).forEach(item => {
                salesMap[item.name] = (salesMap[item.name] || 0) + item.quantity;
            });
        });

        // Combine with inventory to ensure we have all products (even 0 sales)
        const sourceProducts = (inventory && inventory.length > 0) ? inventory : Object.keys(salesMap).map(n => ({ name: n }));

        const allProducts = sourceProducts.map(p => ({
            name: p.name,
            sold: salesMap[p.name] || 0
        }));

        // Sort
        const sortedDesc = [...allProducts].sort((a, b) => b.sold - a.sold);
        const top5 = sortedDesc.slice(0, 5);

        const sortedAsc = [...allProducts].sort((a, b) => a.sold - b.sold);
        const bottom5 = sortedAsc.slice(0, 5);

        return { top5, bottom5 };
    }, [filteredSales, inventory]);

    // Seleccionar el primer ticket por defecto si no hay ninguno seleccionado
    useEffect(() => {
        if (!selectedId && filteredSales.length > 0) {
            setSelectedId(filteredSales[0].id);
        } else if (filteredSales.length === 0) {
            setSelectedId(null);
        }
    }, [filteredSales, selectedId]);

    const currentTicket = sales.find(s => s.id === selectedId) || null;

    // Calcular KPIs (Excluyendo anuladas)
    const validSales = filteredSales.filter(s => s.status !== 'VOIDED');
    const totalSales = validSales.reduce((sum, sale) => sum + sale.total, 0);
    const cashSales = validSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const cardSales = validSales.filter(s => ['debit', 'credit'].includes(s.paymentMethod)).reduce((sum, s) => sum + s.total, 0);

    const cashPercentage = totalSales > 0 ? (cashSales / totalSales) * 100 : 0;
    const cardPercentage = totalSales > 0 ? (cardSales / totalSales) * 100 : 0;

    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [voidReason, setVoidReason] = useState('');

    const handlePrint = async () => {
        if (!currentTicket) return;
        try {
            await api.printTicket(currentTicket.id);
            showModal("Ticket enviado a la impresora", "Éxito");
        } catch (error) {
            console.error("Print error:", error);
            showModal("Error al imprimir: " + error.message, "Error", "error");
        }
    };

    const handleVoidClick = () => {
        setVoidReason('');
        setIsVoidModalOpen(true);
    }

    const confirmVoid = async () => {
        if (!voidReason) {
            showModal("Debe ingresar un motivo para anular la venta.", "Campo Requerido", "error");
            return;
        }
        try {
            await onVoidSale(currentTicket.id, voidReason);
            setIsVoidModalOpen(false);
            showModal("La venta ha sido anulada correctamente.", "Éxito", "success");
        } catch (error) {
            console.error("Error anulando venta:", error);
            const errorMsg = error.response?.data?.error || error.message || "No se pudo anular la venta";
            showModal(errorMsg, "Error al Anular", "error");
            // If the error is date related or business logic, maybe we should close the modal or keep it open?
            // Keeping it open allows them to try again if it was a network error, 
            // but if it's "Already Voided", they should probably just close it.
            // For now, let's leave it open so they see the error in the modal, 
            // BUT if it's "already voided", the sales list might update and the modal might be irrelevant.
            // Actually, perform a fresh check or close it if needed.
            if (errorMsg.includes("already voided") || errorMsg.includes("ya anulada")) {
                setIsVoidModalOpen(false);
            }
        }
    };

    return (
        <div className={styles.container}>
            {/* Void Modal */}
            {isVoidModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
                        <h3 style={{ marginTop: 0 }}>Anular Venta {currentTicket?.id}</h3>
                        <p style={{ color: '#d93025' }}>Esta acción devolverá el stock al inventario. El monto no se sumará a los totales.</p>
                        <textarea
                            style={{ width: '100%', height: 80, marginTop: 10, padding: 8 }}
                            placeholder="Motivo de anulación (obligatorio)..."
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                        />
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setIsVoidModalOpen(false)}>Cancelar</button>
                            <button onClick={confirmVoid} style={{ background: '#d93025', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4 }}>Confirmar Anulación</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Ticket (modified for void) */}
            {currentTicket && (
                <div className={styles.printableTicket}>
                    {/* ... existing print structure ... */}
                    {currentTicket.status === 'VOIDED' && <h1 style={{ color: 'red', textAlign: 'center', border: '2px solid red' }}>ANULADA</h1>}
                    <div className={styles.printHeader}>
                        <h3>TECNIWORLD</h3>
                        <p>RUT: 76.123.456-K</p>
                        <p>Av. Providencia 1234, Santiago</p>
                        <p>Tel: +56 9 8765 4321</p>
                    </div>
                    <div className={styles.printDivider}></div>
                    <div className={styles.printInfo}>
                        <p>Ticket: {currentTicket.id}</p>
                        <p>Fecha: {new Date(currentTicket.date).toLocaleString()}</p>
                        <p>Atendido por: {currentTicket.cashier}</p>
                    </div>
                    <div className={styles.printDivider}></div>
                    <div className={styles.printItems}>
                        {(currentTicket.items || []).map((item, index) => (
                            <div key={index} className={styles.printItemRow}>
                                <div className={styles.printItemName}>{item.quantity} x {item.name}</div>
                                <div className={styles.printItemTotal}>${item.subtotal.toLocaleString('es-CL')}</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.printDivider}></div>
                    <div className={styles.printTotals}>
                        <div className={styles.printTotalRow}>
                            <span>SUBTOTAL:</span>
                            <span>${(currentTicket.subtotal || (currentTicket.total / 1.19)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className={styles.printTotalRow}>
                            <span>IVA:</span>
                            <span>${(currentTicket.tax || (currentTicket.total - (currentTicket.total / 1.19))).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className={styles.printTotalRow} style={{ fontWeight: 'bold', fontSize: '1.2em', marginTop: '5px' }}>
                            <span>TOTAL:</span>
                            <span>${(currentTicket.total || 0).toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                    <div className={styles.printDivider}></div>
                    <div className={styles.printFooter}>
                        <p>¡Gracias por su preferencia!</p>
                        <p>Síguenos en @tecniworld</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <button className={styles.backBtn} onClick={onBack} title="Volver al inicio">
                        <ArrowLeft size={20} />
                        <span>Volver</span>
                    </button>
                    <div>
                        <h1>Reportes de Ventas</h1>
                        <span className={styles.subtitle}>Monitorea el rendimiento financiero de tu tienda en tiempo real.</span>
                    </div>
                </div>
                <div className={styles.controls}>
                    {/* Date Range Logic */}
                    {filterType === 'custom' && (
                        <div className={styles.customDateRange}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={styles.dateInputNative}
                            />
                            <span style={{ color: '#5f6368' }}>a</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={styles.dateInputNative}
                            />
                        </div>
                    )}

                    <div className={styles.filterGroup}>
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
                        <button
                            className={`${styles.filterBtn} ${filterType === 'custom' ? styles.active : ''}`}
                            onClick={() => setFilterType('custom')}
                        >
                            Rango
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filterType === 'shifts' ? styles.active : ''}`}
                            onClick={() => setFilterType('shifts')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <History size={14} />
                            Turnos
                        </button>
                    </div>

                    <button className={styles.primaryBtn} onClick={handlePrint} disabled={!currentTicket}>
                        <Printer size={18} />
                        Imprimir Ticket
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.dashboardGrid}>
                {/* Total Sales */}
                <div className={styles.card}>
                    <div className={styles.cardLabel}>Venta Total (CLP)</div>
                    <div className={styles.cardValue}>${totalSales.toLocaleString('es-CL', { minimumFractionDigits: 0 })}</div>
                    {/* Mention excluding voided */}
                    <div className={`${styles.trend} ${styles.trendUp}`}>
                        ↗ {validSales.length} transacciones
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

                {/* Ranking Card */}
                <div className={styles.rankingCard}>
                    <div className={styles.rankingSection}>
                        <div className={styles.rankingTitle}>
                            <TrendingUp size={14} color="#137333" />
                            Más Vendidos
                        </div>
                        <div className={styles.rankingList}>
                            {rankingStats.top5.map((p, i) => (
                                <div key={i} className={styles.rankingItem}>
                                    <span className={styles.rankingName} title={p.name}>{p.name}</span>
                                    <span className={styles.rankingValue}>{p.sold}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.rankingSection}>
                        <div className={styles.rankingTitle}>
                            <TrendingDown size={14} color="#d93025" />
                            Menos Vendidos
                        </div>
                        <div className={styles.rankingList}>
                            {rankingStats.bottom5.map((p, i) => (
                                <div key={i} className={styles.rankingItem}>
                                    <span className={styles.rankingName} title={p.name}>{p.name}</span>
                                    <span className={styles.rankingValue}>{p.sold}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            {/* SHIFTS HISTORY TABLE */}
            {
                filterType === 'shifts' ? (
                    <div className={styles.contentArea} style={{ flexDirection: 'column', padding: '0 24px' }}>
                        <div className={styles.tableCard} style={{ flex: 1 }}>
                            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '16px' }}>
                                <div>APERTURA</div>
                                <div>CIERRE</div>
                                <div>USUARIO</div>
                                <div style={{ textAlign: 'right' }}>EFECTIVO REAL</div>
                                <div style={{ textAlign: 'right' }}>DIFERENCIA</div>
                            </div>
                            <div className={styles.tableBody}>
                                {user?.role !== 'ADMIN' ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#d93025', fontWeight: 500 }}>
                                        Se requiere rol de administrador para ver el historial de turnos.
                                    </div>
                                ) : shiftHistory.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No hay historial de turnos cerrados.</div>
                                ) : (
                                    shiftHistory.map(shift => (
                                        <div key={shift.id} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', cursor: 'default' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{new Date(shift.openedAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.85em', color: '#666' }}>{new Date(shift.openedAt).toLocaleTimeString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{new Date(shift.closedAt).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.85em', color: '#666' }}>{new Date(shift.closedAt).toLocaleTimeString()}</div>
                                            </div>
                                            <div>
                                                <div>{shift.openedBy}</div>
                                                {shift.closedBy !== shift.openedBy && <div style={{ fontSize: '0.8em', color: '#666' }}>Cierra: {shift.closedBy}</div>}
                                            </div>
                                            <div style={{ textAlign: 'right', fontWeight: 600 }}>
                                                ${(shift.countedCash || 0).toLocaleString('es-CL')}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    color: shift.difference === 0 ? '#1e8e3e' : (shift.difference > 0 ? '#1e8e3e' : '#d93025'),
                                                    fontWeight: 600,
                                                    background: shift.difference === 0 ? '#e6f4ea' : (shift.difference > 0 ? '#e6f4ea' : '#fce8e6'),
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9em'
                                                }}>
                                                    {shift.difference > 0 ? '+' : ''}{shift.difference.toLocaleString('es-CL')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (

                    /* Content Area */
                    <div className={styles.contentArea}>
                        {/* Left Side: Transaction List */}
                        <div className={styles.leftColumn}>
                            <div className={styles.sectionTitle}>Ventas del Período</div>

                            <div className={styles.tableCard}>
                                <div className={styles.searchBar}>
                                    <Search size={18} className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Buscar nº boleta..."
                                        className={styles.searchInput}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className={styles.tableHeader}>
                                    <div>HORA</div>
                                    <div>Nº TICKET</div>
                                    <div>MÉTODO</div>
                                    <div style={{ textAlign: 'right' }}>TOTAL</div>
                                </div>

                                <div className={styles.tableBody}>
                                    {filteredSales.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No hay ventas en este rango.</div>
                                    ) : (
                                        filteredSales.map((tx) => (
                                            <div
                                                key={tx.id}
                                                className={`${styles.tableRow} ${selectedId === tx.id ? styles.active : ''}`}
                                                onClick={() => setSelectedId(tx.id)}
                                                style={tx.status === 'VOIDED' ? { opacity: 0.6 } : {}}
                                            >
                                                <div style={tx.status === 'VOIDED' ? { textDecoration: 'line-through' } : {}}>
                                                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className={styles.boletaId} style={tx.status === 'VOIDED' ? { textDecoration: 'line-through' } : {}}>
                                                    {tx.id.includes('-') ? tx.id.split('-')[1] : tx.id}
                                                </div>
                                                <div>
                                                    {tx.status === 'VOIDED' ? (
                                                        <span className={`${styles.methodTag}`} style={{ background: '#fce8e6', color: '#c5221f' }}>
                                                            ANULADA
                                                        </span>
                                                    ) : (
                                                        <span className={`${styles.methodTag} ${tx.paymentMethod === 'cash' ? styles.methodCash : styles.methodCard}`}>
                                                            {tx.paymentMethod === 'cash' ? <Banknote size={12} /> : <CreditCard size={12} />}
                                                            {tx.paymentMethod === 'cash' ? 'Efectivo' : tx.paymentMethod === 'exchange' ? 'Cambio' : 'Tarjeta'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.amount} style={{
                                                    textDecoration: tx.status === 'VOIDED' ? 'line-through' : 'none',
                                                    color: tx.status === 'VOIDED' ? '#d93025' : 'inherit'
                                                }}>
                                                    ${tx.total.toLocaleString('es-CL', { minimumFractionDigits: 0 })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Ticket Detail */}
                        <div className={styles.rightColumn}>
                            {currentTicket ? (
                                <div className={styles.ticketCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <div className={styles.ticketHeader}>
                                            <div className={styles.ticketTitle}>
                                                <h2>Ticket {currentTicket.id}</h2>
                                                <div className={styles.ticketTime}>{new Date(currentTicket.date).toLocaleString()}</div>
                                            </div>
                                            <span className={styles.statusBadge} style={
                                                currentTicket.status === 'VOIDED' ? { background: '#fce8e6', color: '#c5221f' } : {}
                                            }>
                                                {currentTicket.status === 'VOIDED' ? 'ANULADA' : (currentTicket.status || 'COMPLETADO')}
                                            </span>
                                        </div>

                                        <div className={styles.customerInfo}>
                                            <div className={styles.customerAvatar}>
                                                <User size={18} />
                                            </div>
                                            <span className={styles.customerName}>{currentTicket.cashier}</span>
                                        </div>

                                        {/* Void Details */}
                                        {currentTicket.status === 'VOIDED' && currentTicket.voidMetadata && (
                                            <div style={{ background: '#fce8e6', padding: 12, borderRadius: 8, margin: '12px 0', border: '1px solid #fad2cf' }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#d93025', fontWeight: 'bold' }}>Anulada por: {currentTicket.voidMetadata.by}</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#5f6368', fontStyle: 'italic' }}>"{currentTicket.voidMetadata.reason}"</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#5f6368' }}>{new Date(currentTicket.voidMetadata.at).toLocaleString()}</p>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div className={styles.ticketItems} style={currentTicket.status === 'VOIDED' ? { opacity: 0.5 } : {}}>
                                            <div className={styles.tableHeader} style={{ padding: '0 0 8px 0', background: 'transparent', borderBottom: '1px solid #f1f3f4', marginBottom: '16px', gridTemplateColumns: '3fr 1fr 1fr' }}>
                                                <div>PRODUCTO</div>
                                                <div style={{ textAlign: 'center' }}>CANT</div>
                                                <div style={{ textAlign: 'right' }}>SUBTOTAL</div>
                                            </div>

                                            {currentTicket.items && (currentTicket.items || []).map((item, index) => (
                                                <div key={index} className={styles.itemRow}>
                                                    <div className={styles.itemInfo}>
                                                        <span className={styles.itemName}>{item.name}</span>
                                                        <span className={styles.itemMeta}>${item.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })} unit.</span>
                                                    </div>
                                                    <div className={styles.itemQty}>{item.quantity}</div>
                                                    <div className={styles.itemTotal}>${item.subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.ticketSummary} style={currentTicket.status === 'VOIDED' ? { opacity: 0.5 } : {}}>
                                            <div className={styles.summaryRow}>
                                                <span>Subtotal</span>
                                                <span>${(currentTicket.subtotal || (currentTicket.total * (1 - 0.19))).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className={styles.summaryRow}>
                                                <span>IVA (Calculado)</span>
                                                <span>${(currentTicket.tax || (currentTicket.total * 0.19)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className={styles.totalRow}>
                                                <span className={styles.totalLabel}>TOTAL</span>
                                                <span className={styles.totalValue} style={currentTicket.status === 'VOIDED' ? { textDecoration: 'line-through', color: '#d93025' } : {}}>
                                                    ${(currentTicket.total || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                            <button className={styles.reprintBtn} onClick={handlePrint} style={{ flex: 1 }}>
                                                <Printer size={18} />
                                                Imprimir Ticket
                                            </button>
                                            {/* VOID BUTTON - Only if Active and Admin (assuming user prop is passed) */}
                                            {currentTicket.status !== 'VOIDED' && user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={handleVoidClick}
                                                    style={{
                                                        background: '#fce8e6', color: '#d93025', border: '1px solid #d93025',
                                                        borderRadius: 8, padding: '0 16px', fontWeight: 600, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 8
                                                    }}
                                                >
                                                    <X size={18} />
                                                    ANULAR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.ticketCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                                    Selecciona una venta para ver el detalle
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
};

export default DailyReportPage;
