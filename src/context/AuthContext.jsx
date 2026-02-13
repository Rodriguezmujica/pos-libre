import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            if (storedUser && storedToken) {
                api.setToken(storedToken);
                try {
                    // Verify if token is still valid on server
                    await api.verifyToken();
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.warn("Token verification failed:", error);
                    // Only logout if it's explicitly an auth error (401/403)
                    // If it's a network error (server restarting), keep session to avoid annoyance
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        console.warn("Invalid token. Logging out.");
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        api.setToken(null);
                        setUser(null);
                    } else if (error.message === 'Invalid token') {
                        // api.verifyToken throws 'Invalid token' on 401/403 based on previous view
                        console.warn("Invalid token. Logging out.");
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        api.setToken(null);
                        setUser(null);
                    } else {
                        // Network error or server down? Keep user locally to allow retry
                        console.log("Network error or server down, keeping session.");
                        // We still set the user so the app loads, but API calls might fail until server is back
                        setUser(JSON.parse(storedUser));
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
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
            // error.message contiene el mensaje del servidor (ej. "Contraseña incorrecta", "Usuario no encontrado")
            return { success: false, error: error.message || "Error de conexión" };
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
