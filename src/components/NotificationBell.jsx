import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import styles from '../styles/NotificationBell.module.css';

const NotificationBell = ({ inventory = [], settings, onNotificationClick }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const minStock = settings?.system?.minStock || 5;
    const lowStockItems = inventory.filter(item => item.stock <= minStock);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleItemClick = (item) => {
        setShowNotifications(false);
        if (onNotificationClick) {
            onNotificationClick(item);
        }
    };

    return (
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
                                <div
                                    key={item.id}
                                    className={styles.notificationItem}
                                    onClick={() => handleItemClick(item)}
                                >
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
    );
};

export default NotificationBell;
