const API_URL = '/api';

let authToken = null;

const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
};

export const api = {
    setToken: (token) => {
        authToken = token;
    },

    // Auth & Users
    login: async (credentials) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }
        return response.json();
    },

    getUsers: async () => {
        const response = await fetch(`${API_URL}/users`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    createUser: async (user) => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(user)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create user');
        }
        return response.json();
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.json();
    },

    // Products
    getProducts: async () => {
        const response = await fetch(`${API_URL}/products`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },

    addProduct: async (product) => {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        return response.json();
    },

    updateProduct: async (id, updates) => {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        return response.json();
    },

    deleteProduct: async (id) => {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.json();
    },

    // Sales
    getSales: async () => {
        const response = await fetch(`${API_URL}/sales`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Failed to fetch sales');
        return response.json();
    },

    createSale: async (saleData) => {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(saleData)
        });
        if (!response.ok) throw new Error('Sale failed');
        return response.json();
    },

    // Settings
    getSettings: async () => {
        const response = await fetch(`${API_URL}/settings`, { headers: getHeaders() });
        return response.json();
    },

    updateSetting: async (key, value) => {
        const response = await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ key, value })
        });
        return response.json();
    }
};
