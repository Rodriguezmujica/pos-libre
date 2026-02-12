import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import styles from '../../styles/SettingsView.module.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, total, method }) => {
    if (!isOpen) return null;

    const methodLabel = {
        'cash': 'Efectivo',
        'debit': 'Tarjeta Débito',
        'credit': 'Tarjeta Crédito',
        'transfer': 'Transferencia'
    }[method] || method;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: 400, textAlign: 'center' }}>
                <div className={styles.modalBody} style={{ padding: '32px 24px 24px' }}>
                    <div style={{
                        width: 64, height: 64, background: '#e8f0fe', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', color: '#1a73e8'
                    }}>
                        <AlertCircle size={32} />
                    </div>

                    <h3 style={{ margin: '0 0 16px', fontSize: 20, color: '#202124' }}>Confirmar Venta</h3>

                    <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#5f6368' }}>
                            <span>Método de Pago:</span>
                            <span style={{ fontWeight: 600, color: '#202124' }}>{methodLabel}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#1a73e8', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
                            <span>Total a Pagar:</span>
                            <span>${(total || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    <p style={{ margin: 0, color: '#5f6368', fontSize: 14 }}>
                        ¿Estás seguro de que deseas procesar esta venta?
                    </p>
                </div>

                <div className={styles.modalFooter} style={{ justifyContent: 'center', gap: '12px', paddingBottom: 24, border: 'none', background: 'white' }}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onClose}
                        style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        <X size={16} /> Cancelar
                    </button>
                    <button
                        className={styles.saveBtn}
                        onClick={onConfirm}
                        style={{ minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1a73e8' }}
                    >
                        <Check size={16} /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
