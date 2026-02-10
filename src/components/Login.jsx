import React, { useState } from 'react';
import styles from '../styles/Login.module.css';
import { useAuth } from '../context/AuthContext'; // NEW

const Login = () => { // Removed onLogin prop
    const { login } = useAuth(); // Use context
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Por favor, ingresa usuario y contraseña');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await login(username, password);

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
        // If success, App.jsx will automatically re-render and show POS
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logoContainer}>
                    <h1 className={styles.logoText}>TECNI WORLD</h1>
                    <div className={styles.logoSubtext}>PUNTO DE VENTA</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            className={styles.input}
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError('');
                            }}
                            placeholder="admin"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>

                    <button type="submit" className={styles.loginButton} disabled={isLoading}>
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>

                    {error && <div className={styles.errorMessage}>{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default Login;
