import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            api.setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.login({ username, password });
            const { user, token } = response;
            setUser(user);
            api.setToken(token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: error.response?.data?.error || "Error de conexión" };
        }
    };

    const logout = () => {
        setUser(null);
        api.setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
