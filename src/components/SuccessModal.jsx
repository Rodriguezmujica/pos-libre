import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import styles from '../styles/SettingsView.module.css';

// Reusable Modal for Success, Error, and Info messages
const SuccessModal = ({ isOpen, onClose, message, title, type = 'success' }) => {
    if (!isOpen) return null;

    let Icon = CheckCircle;
    let iconBg = '#e6f4ea';
    let iconColor = '#137333';
    let defaultTitle = "¡Operación Exitosa!";
    let buttonColor = '#1a73e8';

    if (type === 'error') {
        Icon = AlertTriangle;
        iconBg = '#fce8e6';
        iconColor = '#c5221f';
        defaultTitle = "Error";
        buttonColor = '#d93025';
    } else if (type === 'info') {
        Icon = Info;
        iconBg = '#e8f0fe';
        iconColor = '#1a73e8';
        defaultTitle = "Información";
        buttonColor = '#1a73e8';
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: 360, textAlign: 'center' }}>
                <div className={styles.modalBody} style={{ padding: '32px 24px 24px' }}>
                    <div style={{
                        width: 64, height: 64, background: iconBg, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', color: iconColor
                    }}>
                        <Icon size={32} />
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#202124' }}>{title || defaultTitle}</h3>
                    <p style={{ margin: 0, color: '#5f6368', fontSize: 14, whiteSpace: 'pre-line' }}>
                        {message}
                    </p>
                </div>
                <div className={styles.modalFooter} style={{ justifyContent: 'center', background: 'white', paddingBottom: 24, border: 'none' }}>
                    <button
                        className={styles.saveBtn}
                        onClick={onClose}
                        style={{ width: '100%', maxWidth: 200, justifyContent: 'center', background: buttonColor }}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
