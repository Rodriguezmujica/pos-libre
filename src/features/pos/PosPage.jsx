import React from 'react';
import Layout from '../../components/layout/MainLayout';
import TopBar from '../../components/layout/TopBar';
import ProductSearch from './components/ProductSearch';
import Cart from './components/Cart';
import PaymentSidebar from './components/PaymentSidebar';
import CashRegisterModal from './components/CashRegisterModal';

import CustomItemModal from './components/CustomItemModal';
import { formatMoney } from '../../utils/formatMoney';
import layoutStyles from '../../styles/Layout.module.css';

const PosPage = ({
    settings,
    user,
    inventory,
    cartItems,
    subtotal,
    tax,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    onShowReport,
    onShowInventory,
    onShowSettings,
    onCompleteSale,
    logout,
    exchangeModal,
    cashRegister,
    onOpenRegister,
    onCloseRegister
}) => {
    const [isOpenRegisterModalOpen, setIsOpenRegisterModalOpen] = React.useState(false); // Manual Open Modal
    const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = React.useState(false); // Manual Close Modal
    const [isCustomItemModalOpen, setIsCustomItemModalOpen] = React.useState(false); // Custom Item Modal
    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('debit');

    // Force Open Modal logic REMOVED to allow sidebar interaction
    // const showOpenModal = cashRegister && !cashRegister.isOpen;

    const handleAddCustomItem = (item) => {
        const customItem = {
            id: `custom-${Date.now()}`,
            name: item.description, // Description user entered
            price: item.price,
            stock: 9999,
            isCustom: true,
            quantity: item.quantity
        };

        addToCart(customItem); // useCart will handle initial quantity now
        setIsCustomItemModalOpen(false);
    };

    return (
        <>
            {/* Modal for Opening Register (Forced) */}
            <Layout
                topBar={<TopBar
                    storeName={settings?.company?.fantasyName || settings?.company?.name || 'POS'}
                    user={user}
                    onUserClick={() => {
                        if (user?.role === 'ADMIN') {
                            onShowSettings();
                        }
                    }}
                    inventory={inventory}
                    settings={settings}
                    onNotificationClick={onShowInventory}
                    cashRegister={cashRegister} // Pass prop
                />}
                otherComponents={
                    <>
                        {exchangeModal}
                        <CashRegisterModal
                            isOpen={isOpenRegisterModalOpen}
                            mode="OPEN"
                            onConfirm={async (amount) => {
                                await onOpenRegister(amount);
                                setIsOpenRegisterModalOpen(false);
                            }}
                            onClose={() => setIsOpenRegisterModalOpen(false)} // Allow cancelling
                            cashRegister={cashRegister}
                        />
                        <CashRegisterModal
                            isOpen={isCloseRegisterModalOpen}
                            mode="CLOSE"
                            onConfirm={async (amount, obs) => {
                                try {
                                    await onCloseRegister(amount, obs);
                                    setIsCloseRegisterModalOpen(false);
                                } catch (_) {
                                    // Error ya mostrado en App; mantener modal abierto
                                }
                            }}
                            onClose={() => setIsCloseRegisterModalOpen(false)}
                            cashRegister={cashRegister}
                        />
                        <CustomItemModal
                            isOpen={isCustomItemModalOpen}
                            onClose={() => setIsCustomItemModalOpen(false)}
                            onConfirm={handleAddCustomItem}
                        />
                    </>
                }
                leftContent={
                    <>
                        <ProductSearch
                            onAddToCart={addToCart}
                            products={inventory}
                            onOpenCustomItem={() => setIsCustomItemModalOpen(true)} // Pass trigger
                        />
                        <Cart
                            items={cartItems}
                            onUpdateQuantity={updateQuantity}
                            onRemove={removeFromCart}
                        />
                    </>
                }
                rightSidebar={
                    <PaymentSidebar
                        onShowReport={onShowReport}
                        onShowInventory={onShowInventory}
                        onShowSettings={onShowSettings}
                        onCompleteSale={onCompleteSale}
                        onLogout={logout}
                        user={user}
                        cashRegister={cashRegister}
                        onOpenRegister={() => setIsOpenRegisterModalOpen(true)}
                        onCloseRegister={() => setIsCloseRegisterModalOpen(true)}
                        selectedMethod={selectedPaymentMethod}
                        onPaymentMethodChange={setSelectedPaymentMethod}
                    />
                }
                mobileStickyFooter={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>Subtotal: {formatMoney(subtotal)}</span>
                            <span style={{ color: '#1a73e8', fontSize: '1.25rem', fontWeight: '800' }}>
                                Total: {formatMoney(total)}
                            </span>
                        </div>
                        <button
                            onClick={() => onCompleteSale(selectedPaymentMethod)}
                            style={{
                                width: '100%',
                                padding: '14px 20px',
                                minHeight: '44px',
                                background: '#1a73e8',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            COMPLETAR VENTA
                        </button>
                    </div>
                }
                bottomBar={
                    <div className={layoutStyles.bottomBarInner}>
                        <div className={layoutStyles.bottomBarTotals}>
                            <div className={layoutStyles.bottomBarRow}>
                                <span className={layoutStyles.bottomBarLabel}>Subtotal:</span>
                                <span className={layoutStyles.bottomBarValue}>{formatMoney(subtotal)}</span>
                            </div>
                            <div className={layoutStyles.bottomBarRow}>
                                <span className={layoutStyles.bottomBarLabel}>Impuestos ({settings?.system?.taxRate || 0}%):</span>
                                <span className={layoutStyles.bottomBarValue}>{formatMoney(tax)}</span>
                            </div>
                        </div>
                        <div className={layoutStyles.totalSection}>
                            <div className={layoutStyles.totalLabel}>Total a Pagar</div>
                            <div className={layoutStyles.totalAmount}>
                                {formatMoney(total)}
                            </div>
                        </div>
                    </div>
                }
            />
        </>
    );
};

export default PosPage;
