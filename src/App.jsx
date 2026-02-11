import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SuccessModal from './components/SuccessModal';
import ConfirmationModal from './components/ConfirmationModal';
import ExchangeModal from './components/ExchangeModal';
import DailyReport from './components/DailyReport';
import InventoryManagement from './components/InventoryManagement';
import SettingsView from './components/SettingsView';
import Login from './components/Login';
import PosView from './components/PosView';
import { api } from './services/api';

// Hooks
import { useCart } from './hooks/useCart';
import { useInventory } from './hooks/useInventory';
import { useSettings } from './hooks/useSettings';
import { useSales } from './hooks/useSales';

function AppContent() {
  const { user, logout } = useAuth();

  const {
    settings,
    updateSettings,
    createUser,
    deleteUser
  } = useSettings(user);

  const {
    inventory,
    updateProduct,
    addProduct,
    deleteProduct,
    refreshInventory
  } = useInventory();

  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    tax,
    total
  } = useCart(settings?.system?.taxRate !== undefined ? settings.system.taxRate : 19);

  const {
    sales,
    createSale,
    processExchange,
    voidSale
  } = useSales();

  // Local UI State
  const [currentView, setCurrentView] = useState('POS');
  const [modalState, setModalState] = useState({ isOpen: false, message: '', title: '', type: 'success' });
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState(null);
  const [notificationTargetId, setNotificationTargetId] = useState(null);

  // Cash Register State (persistido en backend; se carga al iniciar)
  const [cashRegister, setCashRegister] = useState({
    isOpen: false,
    session: null,
    lastClosing: null
  });

  // Cargar sesión de caja al tener usuario (y tras F5)
  useEffect(() => {
    if (!user) return;
    api.getCashSession()
      .then((data) => {
        if (data.isOpen && data.session) {
          setCashRegister({
            isOpen: true,
            session: {
              ...data.session,
              openedBy: user // usar usuario actual para mostrar nombre completo
            },
            lastClosing: null
          });
        }
      })
      .catch(() => {
        // Sin sesión abierta o error: dejar caja cerrada
      });
  }, [user]);

  const showModal = (message, title, type = 'success') => {
    setModalState({ isOpen: true, message, title, type });
  };
  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  // Cash Register Logic (persiste en backend)
  const openCashRegister = async (initialAmount) => {
    try {
      const data = await api.openCashSession(initialAmount);
      setCashRegister({
        isOpen: true,
        session: {
          ...data.session,
          openedBy: user
        },
        lastClosing: null
      });
    } catch (err) {
      showModal(err.message || 'Error al abrir caja', 'Error', 'error');
    }
  };

  const closeCashRegister = async (countedCash, observations) => {
    const { session } = cashRegister;
    if (!session) return;
    try {
      const data = await api.closeCashSession({
        countedCash,
        observations,
        expectedCash: session.expectedCash,
        expectedCard: session.expectedCard,
        initialAmount: session.initialAmount
      });
      setCashRegister({
        isOpen: false,
        session: null,
        lastClosing: {
          ...data.lastClosing,
          closedBy: user,
          opening: session,
          expectedCash: session.initialAmount + session.expectedCash,
          countedCash: parseFloat(countedCash),
          difference: parseFloat(countedCash) - (session.initialAmount + session.expectedCash),
          observations
        }
      });
    } catch (err) {
      showModal(err.message || 'Error al cerrar caja', 'Error', 'error');
    }
  };

  if (!user) {
    return <Login />;
  }

  // Handlers
  const handleUpdateProduct = async (product) => {
    // ... (existing code)
  };

  const handleUpdateSettings = async (newSettings) => {
    // ... (existing code)
  };

  const handleCreateUser = async (userData) => {
    // ... (existing code)
  };

  const handleDeleteUser = async (userId) => {
    // ... (existing code)
  };

  // Step 1: Request Confirmation
  const handleCompleteSale = (paymentMethod) => {
    // ... (existing code)
  };

  // Step 2: Execute Sale after Confirmation
  const executeSale = async () => {
    setIsConfirmationOpen(false); // Close confirmation
    const paymentMethod = pendingSale;

    try {
      const { result } = await createSale({
        cartItems,
        total,
        paymentMethod,
        user,
        note: ''
      });

      // Acumular totales en sesión de caja y persistir en backend
      setCashRegister(prev => {
        if (!prev.isOpen || !prev.session) return prev;
        const session = { ...prev.session };
        if (paymentMethod === 'cash') {
          session.expectedCash += total;
        } else if (paymentMethod === 'card' || paymentMethod === 'debit' || paymentMethod === 'credit') {
          session.expectedCard += total;
        }
        api.updateCashSession(session.expectedCash, session.expectedCard).catch(() => {});
        return { ...prev, session };
      });

      await refreshInventory();
      clearCart();
      setPendingSale(null);

      showModal(
        `Venta completada con éxito!\nID: ${result.saleId}\nTotal: $${total.toFixed(2)}\n\n--- TICKET ---\n${settings.company.fantasyName}\n${settings.ticket.footerText}`,
        "Venta Exitosa"
      );

    } catch (error) {
      showModal("Error al procesar la venta. Intente nuevamente.", "Error", "error");
    }
  };

  const handleConfirmExchange = async (returnedProduct) => {
    try {
      setIsExchangeModalOpen(false);

      const { result, difference } = await processExchange({
        returnedProduct,
        cartTotal: total,
        cartItems,
        user
      });

      await refreshInventory();
      clearCart();

      let message = `Cambio completado con éxito!\nID: ${result.saleId}`;
      message += `\n\nProducto Devuelto: ${returnedProduct.name}`;
      if (difference > 0) message += `\nCliente pagó diferencia: $${difference.toFixed(2)}`;
      else if (difference < 0) message += `\nSe devolvió al cliente: $${Math.abs(difference).toFixed(2)}`;
      else message += `\nCambio parejo (sin diferencia).`;

      showModal(message, "Cambio Exitoso");

    } catch (error) {
      showModal("Error al procesar el cambio.", "Error", "error");
    }
  };

  const handleNotificationClick = (item) => {
    setNotificationTargetId(item.id);
    setCurrentView('INVENTORY');
  };

  // Views
  if (currentView === 'INVENTORY') {
    return (
      <div style={{ height: '100vh', background: '#f8f9fa' }}>
        <InventoryManagement
          onBack={() => {
            setCurrentView('POS');
            setNotificationTargetId(null);
          }}
          inventory={inventory}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={async (product) => {
            await addProduct(product);
            await refreshInventory();
          }}
          onDeleteProduct={async (id) => {
            await deleteProduct(id);
            await refreshInventory();
          }}
          settings={settings}
          targetProductId={notificationTargetId}
        />
        <SuccessModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          message={modalState.message}
          title={modalState.title}
          type={modalState.type}
        />
      </div>
    );
  }

  if (currentView === 'REPORT') {
    return (
      <div style={{ height: '100vh', background: '#f8f9fa' }}>
        <DailyReport
          onBack={() => setCurrentView('POS')}
          sales={sales}
          user={user}
          onVoidSale={voidSale}
        />
        <SuccessModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          message={modalState.message}
          title={modalState.title}
          type={modalState.type}
        />
      </div>
    );
  }

  if (currentView === 'SETTINGS') {
    return (
      <div style={{ height: '100vh', background: '#f8f9fa' }}>
        <SettingsView
          onBack={() => setCurrentView('POS')}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onCreateUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
        />
        <SuccessModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          message={modalState.message}
          title={modalState.title}
          type={modalState.type}
        />
      </div>
    );
  }

  return (
    <>
      <PosView
        settings={settings}
        user={user}
        cashRegister={cashRegister}
        onOpenRegister={openCashRegister}
        onCloseRegister={closeCashRegister}
        inventory={inventory}
        cartItems={cartItems}
        subtotal={subtotal}
        tax={tax}
        total={total}
        addToCart={addToCart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onShowReport={() => setCurrentView('REPORT')}
        onShowInventory={(item) => {
          // If item is passed (from notification), handle it
          if (item && item.id) {
            handleNotificationClick(item);
          } else {
            setCurrentView('INVENTORY');
          }
        }}
        onShowSettings={() => setCurrentView('SETTINGS')}
        onCompleteSale={handleCompleteSale}
        logout={logout}
        exchangeModal={
          <ExchangeModal
            isOpen={isExchangeModalOpen}
            onClose={() => setIsExchangeModalOpen(false)}
            onConfirm={handleConfirmExchange}
            inventory={inventory}
            cartTotal={total}
          />
        }
      />
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={executeSale}
        total={total}
        method={pendingSale}
      />
      <SuccessModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        message={modalState.message}
        title={modalState.title}
        type={modalState.type}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
