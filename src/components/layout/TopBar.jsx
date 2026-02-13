import React, { useState, useEffect } from 'react';
import { Store, User, Lock, Unlock } from 'lucide-react';
import styles from '../../styles/TopBar.module.css';
import NotificationBell from '../common/NotificationBell';

const TopBar = ({ storeName, user, onUserClick, inventory = [], settings, onNotificationClick, cashRegister }) => { // Added cashRegister prop
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

                {/* Cash Register Status Badge */}
                {cashRegister && (
                    <div style={{
                        marginLeft: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: cashRegister.isOpen ? '#e6f4ea' : '#fce8e6',
                        color: cashRegister.isOpen ? '#1e8e3e' : '#c5221f',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: `1px solid ${cashRegister.isOpen ? '#ceead6' : '#fad2cf'}`
                    }}>
                        {cashRegister.isOpen ? <Unlock size={14} /> : <Lock size={14} />}
                        {cashRegister.isOpen ? 'CAJA ABIERTA' : 'CAJA CERRADA'}
                    </div>
                )}
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
