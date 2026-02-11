import { useState } from 'react';

export const useCart = (taxRate = 19) => {
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
            return [...prev, { ...product, quantity: 1, subtotal: product.price }];
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

    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

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
