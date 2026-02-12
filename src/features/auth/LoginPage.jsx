import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/Login.module.css';
import { User, Lock, ArrowRight, Loader } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor ingresa usuario y contraseña');
            return;
        }

        setIsLoading(true);

        // Simulate network delay for effect
        await new Promise(r => setTimeout(r, 800));

        const result = await login(username, password);

        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <h1>TW</h1>
                    </div>
                    <h2>Bienvenido</h2>
                    <p>Sistema POS TecniWorld</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            {error}
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <div className={styles.iconWrapper}>
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <div className={styles.iconWrapper}>
                            <Lock size={20} />
                        </div>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader size={20} className={styles.spinner} />
                                Ingresando...
                            </>
                        ) : (
                            <>
                                Iniciar Sesión <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>¿Olvidaste tu contraseña? Contacta al administrador.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
