import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ArrowLeftRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from '../styles/SettingsView.module.css';

const ExchangeModal = ({ isOpen, onClose, onConfirm, inventory = [], cartTotal = 0 }) => {
    const [barcode, setBarcode] = useState('');
    const [returnedProduct, setReturnedProduct] = useState(null);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    const [difference, setDifference] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setBarcode('');
            setReturnedProduct(null);
            setError('');
            // Focus input after modal opens
            const timer = setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSearch = () => {
        setError('');
        if (!barcode.trim()) return;

        // Find product in inventory by barcode or SKU
        const product = inventory.find(p => p.barcode === barcode || p.sku === barcode);

        if (product) {
            setReturnedProduct(product);
            const diff = cartTotal - product.price;
            setDifference(diff);
        } else {
            setReturnedProduct(null);
            setError('Producto no encontrado. Verifique el código.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleConfirmExchange = () => {
        if (returnedProduct) {
            onConfirm(returnedProduct);
        }
    };

    if (!isOpen) return null;

    const isPayable = difference > 0;
    const isRefund = difference < 0;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '500px', width: '90%' }}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ArrowLeftRight size={24} color="#1a73e8" />
                        Procesar Cambio
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p style={{ marginBottom: '16px', color: '#5f6368' }}>
                        Escanee el código de barras del producto que el cliente está devolviendo.
                    </p>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.input}
                            placeholder="Escanear código de barras..."
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{ flex: 1 }}
                        />
                        <button
                            className={styles.saveBtn}
                            onClick={handleSearch}
                            style={{ width: 'auto', padding: '0 12px' }}
                        >
                            <Search size={18} />
                        </button>
                    </div>

                    {error && (
                        <div style={{ padding: '10px', background: '#fce8e6', color: '#d93025', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {returnedProduct && (
                        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #dadce0' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#202124', fontSize: '1rem' }}>Producto a Devolver:</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '500' }}>{returnedProduct.name}</span>
                                <span style={{ fontWeight: 'bold' }}>${returnedProduct.price.toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>SKU: {returnedProduct.sku || returnedProduct.barcode || 'N/A'}</div>

                            <hr style={{ margin: '16px 0', border: '0', borderTop: '1px dashed #dadce0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#5f6368' }}>
                                <span>Total Nueva Compra:</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid #dadce0'
                            }}>
                                <span>
                                    {isPayable ? 'Diferencia a Pagar:' : (isRefund ? 'A Devolver:' : 'Cambio Parejo:')}
                                </span>
                                <span style={{ color: isPayable ? '#d93025' : (isRefund ? '#188038' : '#202124') }}>
                                    ${Math.abs(difference).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                    <button
                        className={styles.saveBtn}
                        onClick={handleConfirmExchange}
                        disabled={!returnedProduct}
                        style={{ opacity: !returnedProduct ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <CheckCircle2 size={18} />
                        Confirmar Cambio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExchangeModal;
