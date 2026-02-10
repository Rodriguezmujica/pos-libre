import React, { useState, useEffect, useRef } from 'react';
import { Store, User, Bell, AlertTriangle } from 'lucide-react';
import styles from '../styles/TopBar.module.css';

const TopBar = ({ storeName, user, onUserClick, inventory = [], settings }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const minStock = settings?.system?.minStock || 5;
    const lowStockItems = inventory.filter(item => item.stock <= minStock);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(timer);
            document.removeEventListener('mousedown', handleClickOutside);
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
                <div className={styles.notificationArea} ref={notificationRef}>
                    <div
                        className={styles.notificationIcon}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {lowStockItems.length > 0 && (
                            <span className={styles.badge}>{lowStockItems.length}</span>
                        )}
                    </div>

                    {showNotifications && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownHeader}>
                                <h3>Alertas de Stock</h3>
                                <span className={styles.headerCount}>{lowStockItems.length} items</span>
                            </div>
                            <div className={styles.dropdownContent}>
                                {lowStockItems.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        Todo en orden. No hay stock bajo.
                                    </div>
                                ) : (
                                    lowStockItems.map(item => (
                                        <div key={item.id} className={styles.notificationItem}>
                                            <AlertTriangle size={14} color="#d93025" />
                                            <div className={styles.itemInfo}>
                                                <span className={styles.itemName}>{item.name}</span>
                                                <span className={styles.itemStock}>Stock: {item.stock}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

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
