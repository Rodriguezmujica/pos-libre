import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useCashRegister(user) {
    const [cashRegister, setCashRegister] = useState({
        isOpen: false,
        session: null,
        lastClosing: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar sesión de caja al tener usuario (y tras F5)
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        api.getCashSession()
            .then((data) => {
                if (data.isOpen && data.session) {
                    setCashRegister({
                        isOpen: true,
                        session: {
                            ...data.session,
                            openedBy: user // usar usuario actual para mostrar nombre completo
                        },
                        lastClosing: null
                    });
                }
            })
            .catch((err) => {
                // Sin sesión abierta o error: dejar caja cerrada
                console.log('No active session found or error:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [user]);

    const openCashRegister = async (initialAmount) => {
        try {
            setError(null);
            const data = await api.openCashSession(initialAmount);
            setCashRegister({
                isOpen: true,
                session: {
                    ...data.session,
                    openedBy: user
                },
                lastClosing: null
            });
            return data;
        } catch (err) {
            setError(err.message || 'Error al abrir caja');
            throw err;
        }
    };

    const closeCashRegister = async (countedCash, observations) => {
        const { session } = cashRegister;
        if (!session) return;

        try {
            setError(null);
            const data = await api.closeCashSession({
                countedCash,
                observations,
                expectedCash: session.expectedCash,
                expectedCard: session.expectedCard,
                initialAmount: session.initialAmount
            });

            const closedSessionData = {
                isOpen: false,
                session: null,
                lastClosing: {
                    ...data.lastClosing,
                    closedBy: user,
                    opening: session,
                    expectedCash: session.initialAmount + session.expectedCash,
                    countedCash: parseFloat(countedCash),
                    difference: parseFloat(countedCash) - (session.initialAmount + session.expectedCash),
                    observations
                }
            };

            setCashRegister(closedSessionData);
            return closedSessionData;
        } catch (err) {
            setError(err.message || 'Error al cerrar caja');
            throw err;
        }
    };

    // Helper to update session totals locally (without closing)
    const updateSessionTotals = (paymentMethod, amount) => {
        setCashRegister(prev => {
            if (!prev.isOpen || !prev.session) return prev;

            const session = { ...prev.session };

            if (paymentMethod === 'cash') {
                session.expectedCash += amount;
            } else if (['card', 'debit', 'credit'].includes(paymentMethod)) {
                session.expectedCard += amount;
            }

            // Persist update in backend (fire and forget for UI speed, or could await)
            api.updateCashSession(session.expectedCash, session.expectedCard).catch(err => {
                console.error('Failed to sync cash session totals:', err);
            });

            return { ...prev, session };
        });
    };

    return {
        cashRegister,
        openCashRegister,
        closeCashRegister,
        updateSessionTotals,
        loading,
        error
    };
}
