import { useState } from 'react';

export const useCart = (taxRate = 19, taxIncluded = true) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                        : item
                );
            }
            return [...prev, { ...product, quantity: product.quantity || 1, subtotal: (product.quantity || 1) * product.price }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return {
                    ...item,
                    quantity: newQuantity,
                    subtotal: newQuantity * item.price
                };
            }
            return item;
        }));
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    // Calculate Totals based on Tax Setting
    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    let subtotal = 0;
    let tax = 0;
    let total = 0;

    if (taxIncluded) {
        // Tax IS included in the price (e.g. Price 1000 is Final)
        total = cartSubtotal;
        // Calculate tax backwards: Total = Base * (1 + Rate) => Base = Total / (1 + Rate)
        // Tax = Total - Base
        const baseAmount = total / (1 + (taxRate / 100));
        tax = total - baseAmount;
        subtotal = baseAmount;
    } else {
        // Tax is NOT included (Add on top)
        subtotal = cartSubtotal;
        tax = subtotal * (taxRate / 100);
        total = subtotal + tax;
    }

    return {
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        tax,
        total
    };
};
