import React, { useState, useEffect } from 'react';
import { Store, User } from 'lucide-react';
import styles from '../styles/TopBar.module.css';
import NotificationBell from './NotificationBell';

const TopBar = ({ storeName, user, onUserClick, inventory = [], settings, onNotificationClick }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const formattedDate = currentTime.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const formattedTime = currentTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return (
        <div className={styles.container}>
            <div className={styles.storeInfo}>
                <div className={styles.iconWrapper}>
                    <Store className={styles.storeIcon} />
                </div>
                <div className={styles.storeDetails}>
                    <h1 className={styles.storeName}>{storeName || 'TIENDA PRINCIPAL'}</h1>
                    <span className={styles.storeBranch}>SUCURSAL CENTRAL</span>
                </div>
            </div>

            <div className={styles.rightSection}>
                {/* Notifications Area */}
                <NotificationBell
                    inventory={inventory}
                    settings={settings}
                    onNotificationClick={(item) => {
                        if (user?.role === 'ADMIN') {
                            onNotificationClick && onNotificationClick(item);
                        }
                    }}
                />

                <div className={styles.divider}></div>

                <div className={styles.dateTime}>
                    <div className={styles.date}>{formattedDate}</div>
                    <div className={styles.time}>{formattedTime}</div>
                </div>
                <div className={styles.divider}></div>
                <div
                    className={styles.userInfo}
                    onClick={onUserClick}
                    style={{ cursor: user?.role === 'ADMIN' ? 'pointer' : 'default' }}
                    title={user?.role === 'ADMIN' ? "Ir a Configuración de Usuarios" : ""}
                >
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>Cajero: {user?.name || 'Invitado'}</span>
                        <span className={styles.userRole}>{user?.role || 'N/A'}</span>
                    </div>
                    <div className={styles.avatar}>
                        <User size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
