import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Check, X, Banknote, Euro } from 'lucide-react';
import styles from '../../styles/ConfirmationModal.module.css';
import { formatMoney } from '../../utils/formatMoney';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, total = 0, method }) => {
    const [printTicket, setPrintTicket] = useState(true);
    const [receivedCash, setReceivedCash] = useState('');
    const inputRef = useRef(null);

    const isCash = method === 'cash';
    const numericTotal = Math.round((Number(total) || 0) * 100) / 100;

    // Resetear valores cuando el modal se abre
    useEffect(() => {
        if (isOpen) {
            setPrintTicket(true);
            setReceivedCash('');
            if (isCash) {
                // Foco al input tras render
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 50);
            }
        }
    }, [isOpen, isCash]);

    if (!isOpen) return null;

    const methodLabel = {
        'cash': 'Efectivo',
        'debit': 'Tarjeta / Bizum',
        'credit': 'Tarjeta de Crédito',
        'exchange': 'Cambio',
        'transfer': 'Transferencia'
    }[method] || method;

    // Normalización y cálculo reactivo de efectivo y cambio
    const trimmedCash = typeof receivedCash === 'string' ? receivedCash.trim().replace(',', '.') : String(receivedCash || '');
    const hasInput = trimmedCash !== '';
    const parsedCash = parseFloat(trimmedCash);

    let isInsufficient = false;
    let missingAmount = 0;
    let amountPaid = numericTotal;
    let changeAmount = 0;

    if (isCash) {
        if (hasInput) {
            if (isNaN(parsedCash) || parsedCash < numericTotal) {
                isInsufficient = true;
                const safeParsed = isNaN(parsedCash) ? 0 : parsedCash;
                missingAmount = Math.max(0, Math.round((numericTotal - safeParsed) * 100) / 100);
                amountPaid = safeParsed;
                changeAmount = 0;
            } else {
                isInsufficient = false;
                amountPaid = Math.round(parsedCash * 100) / 100;
                changeAmount = Math.round((amountPaid - numericTotal) * 100) / 100;
            }
        } else {
            // Si el campo está vacío, se asume pago exacto
            isInsufficient = false;
            amountPaid = numericTotal;
            changeAmount = 0;
        }
    }

    // Lista de billetes rápidos (5€, 10€, 20€, 50€, y 100€ si el total supera 50)
    const baseBills = [5, 10, 20, 50];
    if (numericTotal > 50) {
        baseBills.push(100);
    }

    const handleConfirm = () => {
        if (isInsufficient) return;
        onConfirm(printTicket, {
            amountPaid,
            changeAmount
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isInsufficient) {
            e.preventDefault();
            handleConfirm();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalBody}>
                    <div className={`${styles.iconCircle} ${isCash ? styles.iconCircleCash : styles.iconCircleDefault}`}>
                        {isCash ? <Banknote size={28} /> : <AlertCircle size={28} />}
                    </div>

                    <h3 className={styles.modalTitle}>Confirmar Venta</h3>

                    <div className={styles.summaryCard}>
                        <div className={styles.summaryRow}>
                            <span>Método de Pago:</span>
                            <span className={styles.summaryRowValue}>{methodLabel}</span>
                        </div>
                        <div className={styles.summaryTotalRow}>
                            <span>Total a Pagar:</span>
                            <span>{formatMoney(numericTotal)}</span>
                        </div>
                    </div>

                    {/* SECCIÓN DE EFECTIVO RECIBIDO Y CAMBIO */}
                    {isCash && (
                        <div className={styles.cashSection}>
                            <label htmlFor="receivedCashInput" className={styles.cashLabel}>
                                Efectivo recibido (€)
                            </label>

                            <div className={styles.cashInputWrapper}>
                                <div className={styles.cashInputIcon}>
                                    <Euro size={18} />
                                </div>
                                <input
                                    ref={inputRef}
                                    id="receivedCashInput"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    autoFocus
                                    className={`${styles.cashInput} ${isInsufficient ? styles.cashInputError : ''}`}
                                    placeholder={numericTotal > 0 ? numericTotal.toFixed(2) : '0.00'}
                                    value={receivedCash}
                                    onChange={(e) => setReceivedCash(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            {/* Botones Rápidos de Billetes e Importe Exacto */}
                            <div className={styles.quickBillsContainer}>
                                <div className={styles.quickBillsTitle}>Accesos rápidos</div>
                                <div className={styles.quickBillsGrid}>
                                    <button
                                        type="button"
                                        className={`${styles.quickBillBtn} ${styles.exactBtn} ${(!hasInput || parsedCash === numericTotal) ? styles.quickBillBtnActive : ''}`}
                                        onClick={() => setReceivedCash(numericTotal > 0 ? numericTotal.toFixed(2) : '0')}
                                    >
                                        Exacto ({formatMoney(numericTotal)})
                                    </button>
                                    {baseBills.map((bill) => (
                                        <button
                                            key={bill}
                                            type="button"
                                            className={`${styles.quickBillBtn} ${parsedCash === bill ? styles.quickBillBtnActive : ''}`}
                                            onClick={() => setReceivedCash(bill.toFixed(2))}
                                        >
                                            {bill} €
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Aviso de Monto Insuficiente o Visualización de Cambio */}
                            {isInsufficient ? (
                                <div className={styles.insufficientAlert}>
                                    <AlertTriangle size={18} />
                                    <span>Monto insuficiente (faltan {formatMoney(missingAmount)})</span>
                                </div>
                            ) : (
                                <div className={`${styles.changeCard} ${!hasInput ? styles.changeCardExact : ''}`}>
                                    <div className={styles.changeLabel}>
                                        <span className={styles.changeLabelTitle}>Cambio a entregar:</span>
                                        {!hasInput && <span className={styles.changeLabelSub}>Pago exacto asumido</span>}
                                    </div>
                                    <div className={`${styles.changeAmount} ${!hasInput ? styles.changeAmountExact : ''}`}>
                                        {formatMoney(changeAmount)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.ticketCheckboxRow}>
                        <input
                            type="checkbox"
                            id="printTicket"
                            className={styles.ticketCheckbox}
                            checked={printTicket}
                            onChange={(e) => setPrintTicket(e.target.checked)}
                        />
                        <label htmlFor="printTicket" style={{ cursor: 'pointer' }}>
                            Imprimir comprobante (Ticket)
                        </label>
                    </div>

                    <p className={styles.promptText}>
                        ¿Estás seguro de que deseas procesar esta venta?
                    </p>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onClose}
                    >
                        <X size={16} /> Cancelar
                    </button>
                    <button
                        type="button"
                        className={styles.confirmBtn}
                        onClick={handleConfirm}
                        disabled={isInsufficient}
                    >
                        <Check size={16} /> Confirmar Venta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
