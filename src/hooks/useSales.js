import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useSales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSales = async () => {
        setLoading(true);
        try {
            const salesData = await api.getSales();
            if (salesData.data) setSales(salesData.data);
        } catch (error) {
            console.error("Error loading sales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSales();
    }, []);

    const createSale = async (saleDetails) => {
        const { cartItems, total, paymentMethod, user, note } = saleDetails;

        const saleData = {
            id: saleDetails.id || `VENTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString(),
            items: cartItems,
            total: total,
            payment_method: paymentMethod,
            cashier: user?.name || "Unknown User",
            note: note
        };

        try {
            const result = await api.createSale(saleData);
            setSales(prev => [...prev, saleData]);
            return { success: true, result, saleData };
        } catch (error) {
            console.error("Error completing sale:", error);
            throw error;
        }
    };

    const processExchange = async (exchangeDetails) => {
        const { returnedProduct, cartTotal, cartItems, user } = exchangeDetails;

        // 1. Update stock of returned product (+1)
        try {
            const updatedReturnedProduct = { ...returnedProduct, stock: returnedProduct.stock + 1 };
            await api.updateProduct(returnedProduct.id, updatedReturnedProduct);
        } catch (error) {
            console.error("Error updating returned product stock:", error);
            // We continue? Or fail? Best to fail if we can't update stock.
            throw new Error("Failed to return product to stock");
        }

        // 2. Create Sale Record
        const difference = cartTotal - returnedProduct.price;
        const note = `Cambio: Devolvió ${returnedProduct.name} ($${returnedProduct.price}). Diferencia: $${difference.toFixed(2)}`;

        const saleId = `CAMBIO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        try {
            const result = await createSale({
                id: saleId,
                cartItems,
                total: cartTotal, // Record full value of new items? Or difference? App.jsx said "full value of new items"
                paymentMethod: 'EXCHANGE',
                user,
                note
            });
            return {
                ...result,
                difference,
                returnedProduct
            };
        } catch (error) {
            throw error;
        }
    }; // End processExchange

    const voidSale = async (saleId, reason) => {
        try {
            await api.voidSale(saleId, reason);
            // We could update local state manually, but refreshing from server is safer to get updated status and metadata
            await loadSales();
            return { success: true };
        } catch (error) {
            console.error("Error voiding sale:", error);
            throw error;
        }
    };

    return {
        sales,
        createSale,
        processExchange,
        voidSale,
        refreshSales: loadSales,
        loading
    };
};
