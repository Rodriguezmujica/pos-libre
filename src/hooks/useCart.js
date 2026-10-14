import { useState } from 'react';

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

export const useCart = (taxRate = 21, taxIncluded = true) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (product) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: round2((item.quantity + 1) * item.price) }
                        : item
                );
            }
            const initialQty = product.quantity || 1;
            return [...prev, { ...product, quantity: initialQty, subtotal: round2(initialQty * product.price) }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return {
                    ...item,
                    quantity: newQuantity,
                    subtotal: round2(newQuantity * item.price)
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
    const cartSubtotal = round2(cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0));

    let subtotal = 0;
    let tax = 0;
    let total = 0;

    if (taxIncluded) {
        // Tax IS included in the price (e.g. Price 1.50 is Final)
        total = cartSubtotal;
        // Calculate tax backwards: Total = Base * (1 + Rate) => Base = Total / (1 + Rate)
        // Tax = Total - Base
        const rate = Number(taxRate) || 0;
        const baseAmount = rate > 0 ? (total / (1 + (rate / 100))) : total;
        tax = round2(total - baseAmount);
        subtotal = round2(baseAmount);
    } else {
        // Tax is NOT included (Add on top)
        const rate = Number(taxRate) || 0;
        subtotal = cartSubtotal;
        tax = round2(subtotal * (rate / 100));
        total = round2(subtotal + tax);
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
