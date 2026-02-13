import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';

// Common Components
import ConfirmationModal from './components/common/ConfirmationModal';

// Features / Pages
import LoginPage from './features/auth/LoginPage';
import InventoryPage from './features/inventory/InventoryPage';
import DailyReportPage from './features/reports/DailyReportPage';
import SettingsPage from './features/settings/SettingsPage';
import PosPage from './features/pos/PosPage';

// POS Specific Components (Dialogs logic hoisted to App or handled within POS, 
// here they are hoisted because of the hook usage in App.jsx)
import ExchangeModal from './features/pos/components/ExchangeModal';
import StockWarningModal from './features/pos/components/StockWarningModal';

import { api } from './services/api';

// Hooks
import { useCart } from './hooks/useCart';
import { useInventory } from './hooks/useInventory';
import { useSettings } from './hooks/useSettings';
import { useCashRegister } from './hooks/useCashRegister';
import { useStock } from './hooks/useStock';
import { useTransaction } from './hooks/useTransaction';
import { useSales } from './hooks/useSales';

function AppContent() {
  const { user, logout } = useAuth();
  const { showModal } = useUI(); // Use UI Context

  const {
    settings,
    updateSettings,
    createUser,
    updateUser,
    deleteUser
  } = useSettings(user);

  const {
    inventory,
    updateProduct,
    addProduct,
    deleteProduct,
    refreshInventory
  } = useInventory();

  // Extract tax rate safely
  const taxRate = settings?.system?.taxRate !== undefined ? settings.system.taxRate : 19;

  const cartHook = useCart(taxRate); // Get the whole hook object to pass to useTransaction
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    tax,
    total
  } = cartHook;

  // 1. Cash Register Logic extracted
  const cashRegisterHook = useCashRegister(user);
  const {
    cashRegister,
    openCashRegister,
    closeCashRegister
  } = cashRegisterHook;

  // 2. Stock Logic extracted
  const stockHook = useStock(inventory, cartItems, addToCart);
  const {
    stockWarning,
    checkStockAndAdd,
    confirmAddWithNoStock,
    closeStockWarning
  } = stockHook;

  // 3. Transaction Logic extracted
  // Fix: Pass fused object { ...state, updateSessionTotals } as expected by useTransaction
  const transactionHook = useTransaction(
    cartHook,
    { ...cashRegister, updateSessionTotals: cashRegisterHook.updateSessionTotals },
    user,
    refreshInventory
  );

  // 4. Sales Logic (for Reports)
  const { sales } = useSales();

  // Local UI State (Navigational state primarily)
  const [currentView, setCurrentView] = useState('POS');
  const [notificationTargetId, setNotificationTargetId] = useState(null);

  // Handlers Wrappers - catching errors and showing global modal
  const handleUpdateProduct = async (product) => {
    try {
      await updateProduct(product);
      await refreshInventory();
      showModal("Producto actualizado correctamente", "Éxito");
    } catch (error) {
      showModal("Error al actualizar producto", "Error", "error");
    }
  };

  const handleAddProduct = async (product) => {
    try {
      await addProduct(product);
      await refreshInventory();
      showModal("Producto agregado correctamente", "Éxito");
    } catch (error) {
      showModal("Error al agregar producto", "Error", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      await refreshInventory();
      showModal("Producto eliminado correctamente", "Éxito");
    } catch (error) {
      showModal("Error al eliminar producto", "Error", "error");
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      await updateSettings(newSettings);
      showModal("Configuración guardada", "Éxito");
    } catch (error) {
      showModal("Error al guardar configuración", "Error", "error");
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData);
      showModal("Usuario creado correctamente", "Éxito");
    } catch (error) {
      showModal(error.message || "Error al crear usuario", "Error", "error");
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await updateUser(userId, userData);
      showModal("Usuario actualizado correctamente", "Éxito");
    } catch (error) {
      showModal(error.message || "Error al actualizar usuario", "Error", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      showModal("Usuario eliminado correctamente", "Éxito");
    } catch (error) {
      showModal("Error al eliminar usuario", "Error", "error");
    }
  };

  const handleCompleteSaleWrapper = (paymentMethod) => {
    try {
      transactionHook.requestSale(paymentMethod);
    } catch (err) {
      showModal(err.message, "Error", "error");
    }
  };

  const handleExecuteSaleWrapper = async () => {
    try {
      await transactionHook.executeSale(settings);
      // Success message handled by effect below
    } catch (err) {
      if (!transactionHook.transactionState.error) {
        showModal(err.message || "Error al procesar la venta", "Error", "error");
      }
    }
  };

  // Sync transaction messages to Global UI Modal
  useEffect(() => {
    if (transactionHook.transactionState.successMessage) {
      showModal(transactionHook.transactionState.successMessage, "Éxito");
      transactionHook.clearMessages();
    }
    if (transactionHook.transactionState.error) {
      showModal(transactionHook.transactionState.error, "Error", "error");
      transactionHook.clearMessages();
    }
  }, [transactionHook.transactionState.successMessage, transactionHook.transactionState.error, showModal, transactionHook]);


  const handleNotificationClick = (item) => {
    setNotificationTargetId(item.id);
    setCurrentView('INVENTORY');
  };

  if (!user) {
    return <LoginPage />;
  }

  // Views
  if (currentView === 'INVENTORY') {
    return (
      <div style={{ height: '100vh', background: '#f8f9fa' }}>
        <InventoryPage
          onBack={() => {
            setCurrentView('POS');
            setNotificationTargetId(null);
          }}
          inventory={inventory}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          settings={settings}
          targetProductId={notificationTargetId}
        />
      </div>
    );
  }

  if (currentView === 'REPORT') {
    return (
      <div style={{ height: '100vh', background: '#f8f9fa' }}>
        <DailyReportPage
          onBack={() => setCurrentView('POS')}
          sales={sales}
          user={user}
          onVoidSale={transactionHook.voidSale}
          inventory={inventory}
        />
      </div>
    );
  }

  if (currentView === 'SETTINGS') {
    return (
      <div style={{ height: '100vh', background: '#f8f9fa' }}>
        <SettingsPage
          onBack={() => setCurrentView('POS')}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onAddUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          users={settings.users || []} // Pass users from settings
        />
      </div>
    );
  }

  return (
    <>
      <PosPage
        settings={settings}
        user={user}
        cashRegister={cashRegister}
        onOpenRegister={(amount) => {
          openCashRegister(amount).catch(err => showModal(err.message, "Error", "error"));
        }}
        onCloseRegister={(cash, obs) => {
          closeCashRegister(cash, obs).catch(err => showModal(err.message, "Error", "error"));
        }}
        inventory={inventory}
        cartItems={cartItems}
        subtotal={subtotal}
        tax={tax}
        total={total}
        addToCart={checkStockAndAdd} // Use stock hook wrapper
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onShowReport={() => setCurrentView('REPORT')}
        onShowInventory={(item) => {
          if (item && item.id) {
            handleNotificationClick(item);
          } else {
            setCurrentView('INVENTORY');
          }
        }}
        onShowSettings={() => setCurrentView('SETTINGS')}
        onCompleteSale={handleCompleteSaleWrapper}
        logout={logout}
        exchangeModal={
          <ExchangeModal
            isOpen={transactionHook.transactionState.isExchangeModalOpen}
            onClose={transactionHook.closeExchangeModal}
            onConfirm={(product) => {
              transactionHook.executeExchange(product).catch(err => showModal(err.message, "Error", "error"));
            }}
            inventory={inventory}
            cartTotal={total}
          />
        }
      />
      <ConfirmationModal
        isOpen={transactionHook.transactionState.isConfirmationOpen}
        onClose={transactionHook.cancelSale}
        onConfirm={handleExecuteSaleWrapper}
        total={total}
        method={transactionHook.transactionState.pendingPaymentMethod}
      />
      <StockWarningModal
        isOpen={stockWarning.isOpen}
        onClose={closeStockWarning}
        onConfirm={confirmAddWithNoStock}
        product={stockWarning.product}
        addedQty={stockWarning.addedQty}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <AppContent />
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
