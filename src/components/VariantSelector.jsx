import React from 'react';
import { X, Package, Check } from 'lucide-react';
import styles from '../styles/SettingsView.module.css'; // Reusing modal styles

const VariantSelector = ({ isOpen, onClose, product, onSelectVariant }) => {
    if (!isOpen || !product) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: 500 }}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={20} color="#1a73e8" />
                        {product.name}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p style={{ marginTop: 0, color: '#5f6368', fontSize: '14px' }}>
                        Selecciona una opción para agregar al carrito:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {product.variants.map((variant) => (
                            <button
                                key={variant.id}
                                onClick={() => onSelectVariant(variant)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    border: '1px solid #dadce0',
                                    borderRadius: '8px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#1a73e8';
                                    e.currentTarget.style.background = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#dadce0';
                                    e.currentTarget.style.background = 'white';
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, color: '#202124', fontSize: '15px' }}>
                                        {variant.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: variant.stock > 0 ? '#137333' : '#d93025', marginTop: '4px' }}>
                                        {variant.stock > 0 ? `${variant.stock} disponibles` : 'Sin Stock'}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#1a73e8', fontSize: '16px' }}>
                                    ${(variant.price || product.price).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariantSelector;
