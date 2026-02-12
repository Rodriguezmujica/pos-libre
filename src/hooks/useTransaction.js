import { useState } from 'react';
import { useSales } from './useSales';

export function useTransaction(cart, cashRegister, user, refreshInventory) {
    // cart = { cartItems, total, clearCart }
    // cashRegister = { isOpen, updateSessionTotals }

    const { createSale, processExchange, voidSale } = useSales();

    const [transactionState, setTransactionState] = useState({
        pendingPaymentMethod: null,
        isConfirmationOpen: false,
        isExchangeModalOpen: false,
        loading: false,
        error: null,
        successMessage: null
    });

    const requestSale = (paymentMethod) => {
        if (cart.cartItems.length === 0) {
            throw new Error("El carrito está vacío");
        }
        if (!cashRegister.isOpen) {
            throw new Error("Debe abrir la caja antes de realizar ventas.");
        }
        setTransactionState(prev => ({
            ...prev,
            pendingPaymentMethod: paymentMethod,
            isConfirmationOpen: true
        }));
    };

    const cancelSale = () => {
        setTransactionState(prev => ({
            ...prev,
            pendingPaymentMethod: null,
            isConfirmationOpen: false
        }));
    };

    const executeSale = async (settings) => {
        setTransactionState(prev => ({ ...prev, loading: true, isConfirmationOpen: false, error: null }));

        try {
            const { result } = await createSale({
                cartItems: cart.cartItems,
                total: cart.total,
                paymentMethod: transactionState.pendingPaymentMethod,
                user,
                note: ''
            });

            // Update cash register totals
            if (cashRegister.updateSessionTotals) {
                cashRegister.updateSessionTotals(transactionState.pendingPaymentMethod, cart.total);
            }

            await refreshInventory();
            cart.clearCart();

            const ticketFooter = settings?.ticket?.footerText || '';
            const fantasyName = settings?.company?.fantasyName || settings?.company?.name || '';

            const successMsg = `Venta completada con éxito!\nID: ${result.saleId}\nTotal: $${cart.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}\n\n--- TICKET ---\n${fantasyName}\n${ticketFooter}`;

            setTransactionState(prev => ({
                ...prev,
                loading: false,
                pendingPaymentMethod: null,
                successMessage: successMsg
            }));

            return result;

        } catch (error) {
            setTransactionState(prev => ({
                ...prev,
                loading: false,
                error: "Error al procesar la venta. Intente nuevamente."
            }));
            throw error;
        }
    };

    const openExchangeModal = () => {
        setTransactionState(prev => ({ ...prev, isExchangeModalOpen: true }));
    };

    const closeExchangeModal = () => {
        setTransactionState(prev => ({ ...prev, isExchangeModalOpen: false }));
    };

    const executeExchange = async (returnedProduct) => {
        try {
            setTransactionState(prev => ({ ...prev, isExchangeModalOpen: false, loading: true, error: null }));

            const { result, difference } = await processExchange({
                returnedProduct,
                cartTotal: cart.total,
                cartItems: cart.cartItems,
                user
            });

            await refreshInventory();
            cart.clearCart();

            let message = `Cambio completado con éxito!\nID: ${result.saleId}`;
            message += `\n\nProducto Devuelto: ${returnedProduct.name}`;
            if (difference > 0) message += `\nCliente pagó diferencia: $${difference.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
            else if (difference < 0) message += `\nSe devolvió al cliente: $${Math.abs(difference).toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
            else message += `\nCambio parejo (sin diferencia).`;

            setTransactionState(prev => ({
                ...prev,
                loading: false,
                successMessage: message
            }));

        } catch (error) {
            setTransactionState(prev => ({
                ...prev,
                loading: false,
                error: "Error al procesar el cambio."
            }));
            throw error;
        }
    };

    const clearMessages = () => {
        setTransactionState(prev => ({ ...prev, error: null, successMessage: null }));
    };

    return {
        transactionState,
        requestSale,
        cancelSale,
        executeSale,
        openExchangeModal,
        closeExchangeModal,
        executeExchange,
        clearMessages,
        voidSale
    };
}
