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

    verifyToken: async () => {
        const response = await fetch(`${API_URL}/auth/verify`, { headers: getHeaders() });
        if (!response.ok) {
            const error = new Error('Token verification failed');
            error.response = response;
            throw error;
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

    updateUser: async (id, userData) => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user');
        }
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

    voidSale: async (id, reason) => {
        const response = await fetch(`${API_URL}/sales/${id}/void`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify({ reason })
        });
        const text = await response.text();
        if (!response.ok) {
            let errorMsg = 'Failed to void sale';
            try {
                if (text) {
                    const error = JSON.parse(text);
                    errorMsg = error.error || errorMsg;
                }
            } catch (_) { }
            throw new Error(errorMsg);
        }
        return text ? JSON.parse(text) : {};
    },

    // Cash Session (Apertura/Cierre de Caja)
    getCashSession: async () => {
        const response = await fetch(`${API_URL}/cash-session/current`, { headers: getHeaders() });
        if (response.status === 404) {
            // Backend sin ruta de cash-session o caja no abierta: tratar como sin sesión
            return { isOpen: false, session: null };
        }
        if (!response.ok) throw new Error('Failed to fetch cash session');
        return response.json();
    },

    openCashSession: async (initialAmount) => {
        const response = await fetch(`${API_URL}/cash-session/open`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ initialAmount })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Error al abrir caja');
        }
        return response.json();
    },

    updateCashSession: async (expectedCash, expectedCard) => {
        const response = await fetch(`${API_URL}/cash-session/current`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ expectedCash, expectedCard })
        });
        if (!response.ok) throw new Error('Error al actualizar sesión');
        return response.json();
    },

    closeCashSession: async (payload) => {
        const response = await fetch(`${API_URL}/cash-session/close`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Error al cerrar caja');
        }
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
