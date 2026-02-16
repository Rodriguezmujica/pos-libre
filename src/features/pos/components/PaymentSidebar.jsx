import React, { useState } from 'react';
import { Banknote, CreditCard, Smartphone, CheckCircle2, Box, FileText, Settings, LogOut, ArrowLeftRight, Lock } from 'lucide-react';
import styles from '../../../styles/PaymentSidebar.module.css';

const PaymentSidebar = ({ onShowReport, onShowInventory, onShowSettings, onCompleteSale, onLogout, user, onCloseRegister, onOpenRegister, cashRegister, selectedMethod: controlledMethod, onPaymentMethodChange }) => {
    const [internalMethod, setInternalMethod] = useState('debit');
    const selectedMethod = controlledMethod !== undefined ? controlledMethod : internalMethod;
    const setSelectedMethod = (val) => {
        if (onPaymentMethodChange) {
            onPaymentMethodChange(val);
        } else {
            setInternalMethod(val);
        }
    };

    const isRegisterOpen = cashRegister?.isOpen;

    const paymentMethods = [
        { id: 'cash', name: 'Efectivo', icon: Banknote, color: '#34a853', bgColor: '#e6f4ea' },
        { id: 'debit', name: 'Débito / NFC', icon: Smartphone, color: '#a142f4', bgColor: '#f3e8fd' },
        { id: 'credit', name: 'Tarjeta de Crédito', icon: CreditCard, color: '#4285f4', bgColor: '#e8f0fe' },
        { id: 'exchange', name: 'Cambio', icon: ArrowLeftRight, color: '#fbbc04', bgColor: '#fef7e0' },
    ];

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>SELECCIONAR MÉTODO DE PAGO</h3>

            <div className={styles.paymentMethods}>
                {paymentMethods.map((method) => (
                    <button
                        key={method.id}
                        className={`${styles.paymentCard} ${selectedMethod === method.id ? styles.selected : ''}`}
                        onClick={() => setSelectedMethod(method.id)}
                        disabled={!isRegisterOpen}
                        style={{ opacity: !isRegisterOpen ? 0.5 : 1 }}
                    >
                        <div className={styles.paymentIconWrapper} style={{ color: method.color, backgroundColor: method.bgColor }}>
                            <method.icon size={24} />
                        </div>
                        <span className={styles.paymentName}>{method.name}</span>
                        {selectedMethod === method.id ? (
                            <CheckCircle2 className={styles.checkIcon} size={20} />
                        ) : (
                            <div className={styles.chevronIcon}>›</div>
                        )}
                    </button>
                ))}
            </div>

            <div className={styles.spacer}></div>

            {isRegisterOpen ? (
                <button
                    className={styles.completeSaleBtn}
                    onClick={() => onCompleteSale(selectedMethod)}
                >
                    <span className={styles.completeSaleText}>COMPLETAR VENTA</span>
                    <span className={styles.completeSaleSubtext}>CONFIRMAR E IMPRIMIR RECIBO (F12)</span>
                </button>
            ) : (
                <button
                    className={styles.completeSaleBtn}
                    onClick={onOpenRegister}
                    style={{ background: '#5f6368' }}
                >
                    <span className={styles.completeSaleText}>CAJA CERRADA</span>
                    <span className={styles.completeSaleSubtext}>ABRIR CAJA PARA VENDER</span>
                </button>
            )}

            <div className={styles.actionsGrid}>
                {user?.role === 'ADMIN' && (
                    <button className={styles.actionBtn} onClick={onShowInventory}>
                        <Box size={20} />
                        <span>INVENTARIO</span>
                    </button>
                )}
                <button className={styles.actionBtn} onClick={onShowReport}>
                    <FileText size={20} />
                    <span>REPORTE DIARIO</span>
                </button>
                {user?.role === 'ADMIN' && (
                    <button className={styles.actionBtn} onClick={onShowSettings}>
                        <Settings size={20} />
                        <span>AJUSTES</span>
                    </button>
                )}

                {isRegisterOpen ? (
                    <button className={`${styles.actionBtn} ${styles.logoutBtn}`} onClick={onCloseRegister} style={{ backgroundColor: '#fce8e6', color: '#d93025' }}>
                        <Lock size={20} />
                        <span>CERRAR CAJA</span>
                    </button>
                ) : (
                    <button className={`${styles.actionBtn}`} onClick={onOpenRegister} style={{ backgroundColor: '#e6f4ea', color: '#1e8e3e' }}>
                        <Lock size={20} />
                        <span>ABRIR CAJA</span>
                    </button>
                )}

                <button className={`${styles.actionBtn} ${styles.logoutBtn}`} onClick={onLogout}>
                    <LogOut size={20} />
                    <span>CERRAR SESIÓN</span>
                </button>
            </div>
        </div>
    );
};

export default PaymentSidebar;
