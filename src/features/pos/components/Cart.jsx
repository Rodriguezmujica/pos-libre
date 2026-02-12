import React from 'react';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';
import styles from '../../../styles/Cart.module.css';

const Cart = ({ items, onUpdateQuantity, onRemove }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <ShoppingCart className={styles.headerIcon} />
                <h2 className={styles.title}>CARRITO ACTIVO ({items.reduce((acc, item) => acc + item.quantity, 0)} ARTÍCULOS)</h2>
            </div>

            <div className={styles.cartList}>
                <div className={styles.tableHeader}>
                    <div className={styles.colProduct}>PRODUCTO</div>
                    <div className={styles.colQty}>CANT.</div>
                    <div className={styles.colPrice}>PRECIO UNIT.</div>
                    <div className={styles.colSubtotal}>SUBTOTAL</div>
                    <div className={styles.colAction}>ELIMINAR</div>
                </div>

                <div className={styles.itemsContainer}>
                    {items.map((item) => (
                        <div key={item.id} className={styles.cartItem}>
                            <div className={styles.colProduct}>
                                <span className={styles.productName}>{item.name}</span>
                            </div>
                            <div className={styles.colQty}>
                                <div className={styles.qtyControl}>
                                    <button
                                        className={styles.qtyBtn}
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className={styles.qtyValue}>{item.quantity}</span>
                                    <button
                                        className={styles.qtyBtn}
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.colPrice}>
                                ${item.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </div>
                            <div className={styles.colSubtotal}>
                                <strong>${(item.price * item.quantity).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</strong>
                            </div>
                            <div className={styles.colAction}>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => onRemove(item.id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className={styles.emptyCart}>
                            El carrito está vacío
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Cart;
