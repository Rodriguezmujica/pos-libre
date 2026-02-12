import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const StockWarningModal = ({ isOpen, onClose, onConfirm, product, addedQty = 1 }) => {
    if (!isOpen || !product) return null;

    const currentStock = product.stock || 0;
    // Calculate what the new stock would be (visually)
    // Note: This modal assumes we are checking BEFORE adding.
    // user wants to add 'addedQty'. 
    // If we are here, it means currentStock < 1 (or requested qty).

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '450px',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ea8600' }}>
                    <div style={{ background: '#fef7e0', padding: '10px', borderRadius: '50%' }}>
                        <AlertTriangle size={28} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#202124' }}>
                        Stock Insuficiente
                    </h2>
                </div>

                <div style={{ color: '#5f6368', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    <p style={{ margin: '0 0 10px 0' }}>Itentas agregar <strong>{product.name}</strong>.</p>
                    <p style={{ margin: 0 }}>
                        Stock actual: <strong>{currentStock}</strong><br />
                        Stock tras operación: <strong style={{ color: '#d93025' }}>{currentStock - addedQty}</strong>
                    </p>
                    <p style={{ marginTop: '12px', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        ¿Estás seguro de continuar? El inventario quedará en negativo.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #dadce0',
                            background: 'white',
                            color: '#3c4043',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#ea8600',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <AlertTriangle size={18} />
                        Confirmar (Stock Negativo)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockWarningModal;
