import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { inventoryProducts } from '../data/mockInventory';

export const useInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const productsData = await api.getProducts();
            if (productsData.data) {
                setInventory(productsData.data);
                setError(null);
            }
        } catch (err) {
            console.error("Error loading inventory:", err);
            setError(err);
            // Fallback - REMOVED to avoid ghost data
            setInventory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const updateProduct = async (product) => {
        try {
            await api.updateProduct(product.id, product);
            await loadInventory(); // Refresh
            return true;
        } catch (err) {
            console.error("Error updating product:", err);
            throw err;
        }
    };

    const addProduct = async (product) => {
        try {
            await api.addProduct(product);
            await loadInventory();
            return true;
        } catch (err) {
            console.error("Error adding product:", err);
            throw err;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await api.deleteProduct(id);
            await loadInventory();
            return true;
        } catch (err) {
            console.error("Error deleting product:", err);
            throw err;
        }
    };

    return {
        inventory,
        updateProduct,
        addProduct,
        deleteProduct,
        loading,
        error,
        refreshInventory: loadInventory
    };
};
