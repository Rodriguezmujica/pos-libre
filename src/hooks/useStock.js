import { useState } from 'react';

export function useStock(inventory, cartItems, addToCart) {
    const [stockWarning, setStockWarning] = useState({
        isOpen: false,
        product: null,
        addedQty: 0
    });

    const checkStockAndAdd = (productOrVariant) => {
        // Determine current stock from inventory if possible, or use product's stock property
        // Note: productOrVariant might be a constructed cart item or a raw product

        // Si viene del carrito, ya tiene stock. Si viene del inventario (raw), usar stock.
        // Lo ideal es buscar siempre en el inventario fresco si se tiene acceso, 
        // pero por ahora mantenemos la lógica original de confiar en la prop stock.
        const currentStock = productOrVariant.stock || 0;

        // Check if item is already in cart to add to its quantity
        const existingInCart = cartItems.find(item => item.id === productOrVariant.id);
        const cartQty = existingInCart ? existingInCart.quantity : 0;
        const requestedTotal = cartQty + 1;

        if (currentStock < requestedTotal) {
            setStockWarning({
                isOpen: true,
                product: productOrVariant,
                addedQty: 1
            });
        } else {
            addToCart(productOrVariant);
        }
    };

    const confirmAddWithNoStock = () => {
        if (stockWarning.product) {
            addToCart(stockWarning.product);
        }
        setStockWarning({ isOpen: false, product: null, addedQty: 0 });
    };

    const closeStockWarning = () => {
        setStockWarning({ isOpen: false, product: null, addedQty: 0 });
    };

    return {
        stockWarning,
        checkStockAndAdd,
        confirmAddWithNoStock,
        closeStockWarning
    };
}
