import React from 'react';
import Layout from '../../components/layout/MainLayout';
import TopBar from '../../components/layout/TopBar';
import ProductSearch from './components/ProductSearch';
import Cart from './components/Cart';
import PaymentSidebar from './components/PaymentSidebar';
import CashRegisterModal from './components/CashRegisterModal';

import CustomItemModal from './components/CustomItemModal';

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
    const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = React.useState(false);
    const [isCustomItemModalOpen, setIsCustomItemModalOpen] = React.useState(false); // Custom Item Modal

    // Force Open Modal if cashRegister is closed
    const showOpenModal = cashRegister && !cashRegister.isOpen;

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
                />}
                otherComponents={
                    <>
                        {exchangeModal}
                        <CashRegisterModal
                            isOpen={showOpenModal}
                            mode="OPEN"
                            onConfirm={onOpenRegister}
                            onClose={() => { }} // Cannot close open modal
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
                        // Add Close Register Button prop if supported by PaymentSidebar, or we inject it differently
                        onCloseRegister={() => setIsCloseRegisterModalOpen(true)}
                    />
                }
                bottomBar={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                                <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>Subtotal:</span>
                                <span style={{ fontWeight: '500', minWidth: '80px', textAlign: 'right' }}>${subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                                <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>Impuestos ({settings?.system?.taxRate || 0}%):</span>
                                <span style={{ fontWeight: '500', minWidth: '80px', textAlign: 'right' }}>${tax.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#1a73e8', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0px' }}>Total a Pagar</div>
                            <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1', color: '#202124', letterSpacing: '-1px' }}>
                                ${total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                }
            />
        </>
    );
};

export default PosPage;
