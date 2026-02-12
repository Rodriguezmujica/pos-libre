import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calculator, Lock } from 'lucide-react';
import styles from '../../../styles/InventoryManagement.module.css';

const CashRegisterModal = ({ isOpen, mode, onClose, onConfirm, cashRegister }) => {
    const [amount, setAmount] = useState('');
    const [observations, setObservations] = useState('');
    const [difference, setDifference] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setObservations('');
            setDifference(null);
        }
    }, [isOpen, mode]);

    if (!isOpen) return null;

    const isOpenMode = mode === 'OPEN';

    const handleConfirm = () => {
        if (!amount) return;
        if (isOpenMode) {
            onConfirm(amount);
        } else {
            onConfirm(amount, observations);
        }
    };

    const calculateDifference = () => {
        if (!cashRegister?.session) return 0;
        const expected = cashRegister.session.initialAmount + cashRegister.session.expectedCash;
        const counted = parseFloat(amount) || 0;
        return counted - expected;
    };

    return (
        <div className={styles.modalOverlay} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 12, width: 450, maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#202124' }}>
                        {isOpenMode ? <DollarSign size={28} color="#1a73e8" /> : <Lock size={28} color="#d93025" />}
                        {isOpenMode ? 'Apertura de Caja' : 'Cierre de Caja'}
                    </h2>
                    {/* Only allow closing if it's NOT the forced opening modal */}
                    {!isOpenMode && (
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <X size={24} color="#5f6368" />
                        </button>
                    )}
                </div>

                {isOpenMode ? (
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ color: '#5f6368', marginBottom: 16 }}>
                            Ingrese el monto inicial de efectivo en caja para comenzar las operaciones del día.
                        </p>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>MONTO INICIAL</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 16, top: 12, fontSize: 18, fontWeight: 'bold', color: '#5f6368' }}>$</span>
                                <input
                                    type="number"
                                    className={styles.input}
                                    style={{ paddingLeft: 30, fontSize: 18, height: 48 }}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ background: '#f1f3f4', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#5f6368' }}>Fondo Inicial:</span>
                                <span>${cashRegister?.session?.initialAmount?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#5f6368' }}>Ventas Efectivo:</span>
                                <span>${cashRegister?.session?.expectedCash?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#5f6368' }}>Ventas Tarjeta:</span>
                                <span>${cashRegister?.session?.expectedCard?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontStyle: 'italic', fontSize: '0.9em' }}>
                                <span style={{ color: '#5f6368' }}>Total Vendido (Día):</span>
                                <span>${((cashRegister?.session?.expectedCash || 0) + (cashRegister?.session?.expectedCard || 0)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dadce0', paddingTop: 8, fontWeight: 'bold' }}>
                                <span>Total Efectivo Esperado:</span>
                                <span>${(cashRegister?.session?.initialAmount + cashRegister?.session?.expectedCash)?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>DINERO CONTADO (REAL)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 16, top: 12, fontSize: 18, fontWeight: 'bold', color: '#5f6368' }}>$</span>
                                <input
                                    type="number"
                                    className={styles.input}
                                    style={{ paddingLeft: 30, fontSize: 18, height: 48, borderColor: amount && calculateDifference() !== 0 ? '#fbbc04' : '#dadce0' }}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Total contado"
                                    autoFocus
                                />
                            </div>
                            {amount && (
                                <div style={{
                                    marginTop: 8,
                                    fontSize: 14,
                                    color: calculateDifference() === 0 ? '#188038' : (calculateDifference() < 0 ? '#d93025' : '#1a73e8'),
                                    fontWeight: '500'
                                }}>
                                    Diferencia: ${calculateDifference().toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                    {calculateDifference() !== 0 && (
                                        <span style={{ fontWeight: 'normal', marginLeft: 8, color: '#5f6368' }}>
                                            ({calculateDifference() < 0 ? 'Faltante' : 'Sobrante'})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup} style={{ marginTop: 16 }}>
                            <label className={styles.label}>OBSERVACIONES</label>
                            <textarea
                                className={styles.input}
                                rows={3}
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Notas sobre diferencias o detalles del turno..."
                            />
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    {!isOpenMode && (
                        <button
                            onClick={onClose}
                            style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #dadce0', background: 'white', color: '#5f6368', fontWeight: 500, cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        disabled={!amount}
                        style={{
                            padding: '12px 24px', borderRadius: 8, border: 'none',
                            background: !amount ? '#dadce0' : (isOpenMode ? '#1a73e8' : '#d93025'),
                            color: 'white', fontWeight: 600, cursor: !amount ? 'default' : 'pointer',
                            width: isOpenMode ? '100%' : 'auto'
                        }}
                    >
                        {isOpenMode ? 'ABRIR CAJA' : 'CERRAR CAJA'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashRegisterModal;
