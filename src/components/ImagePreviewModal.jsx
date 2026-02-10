import React from 'react';
import { X } from 'lucide-react';
import styles from '../styles/SettingsView.module.css'; // Reusing modal styles for consistency

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, altText }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className={styles.modalContent}
                style={{
                    maxWidth: '800px',
                    width: 'auto',
                    maxHeight: '90vh',
                    padding: 0,
                    overflow: 'hidden',
                    background: 'transparent',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: -40,
                            right: 0,
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={imageUrl}
                        alt={altText || 'Product Preview'}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '80vh',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
