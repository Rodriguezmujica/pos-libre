import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TopBar from './components/TopBar';
import ProductSearch from './components/ProductSearch';
import Cart from './components/Cart';
import { inventoryProducts } from './data/mockInventory';
import { companySettings, ticketSettings, users as mockUsers, systemSettings } from './data/mockSettings';
import PaymentSidebar from './components/PaymentSidebar';
import DailyReport from './components/DailyReport';
import InventoryManagement from './components/InventoryManagement';
import SettingsView from './components/SettingsView';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext'; // NEW
import SuccessModal from './components/SuccessModal';
import ExchangeModal from './components/ExchangeModal';

import { api } from './services/api';

function AppContent() { // Renamed original App to AppContent
  const { user, login, logout } = useAuth(); // Use context
  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState({
    company: {},
    ticket: {},
    system: {},
    users: []
  });
  const [cartItems, setCartItems] = useState([]);
  const [currentView, setCurrentView] = useState('POS');
  const [sales, setSales] = useState([]);
  const [modalState, setModalState] = useState({ isOpen: false, message: '', title: '', type: 'success' });
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  const showModal = (message, title, type = 'success') => {
    setModalState({ isOpen: true, message, title, type });
  };
  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  // Cargar datos al inicio
  useEffect(() => {
    if (!user) return; // Only load if logged in

    const loadData = async () => {
      try {
        const productsData = await api.getProducts();
        if (productsData.data) setInventory(productsData.data);

        const settingsData = await api.getSettings();
        const serverSettings = settingsData.data || {};

        // Load Users if Admin
        let usersData = [];
        if (user.role === 'ADMIN') {
          try {
            const usersResponse = await api.getUsers();
            usersData = usersResponse.data;
          } catch (err) {
            console.warn("Could not load users:", err);
          }
        }

        // Merge settings
        const mergedSettings = {
          company: { ...companySettings, ...serverSettings.company },
          ticket: { ...ticketSettings, ...serverSettings.ticket },
          system: { ...systemSettings, ...serverSettings.system },
          users: usersData.length > 0 ? usersData : (user.role === 'ADMIN' ? mockUsers : [])
        };
        setSettings(mergedSettings);

        const salesData = await api.getSales();
        if (salesData.data) setSales(salesData.data);

      } catch (error) {
        console.error("Error loading data:", error);
        // Fallback to mocks
        setInventory(inventoryProducts);
        setSettings({
          company: { ...companySettings, fantasyName: 'TecniWorld' },
          ticket: { ...ticketSettings },
          system: { ...systemSettings, minStock: 5 },
          users: [...mockUsers]
        });
      }
    };
    loadData();
  }, [user]); // Depend on user

  if (!user) {
    return <Login />;
  }

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, subtotal: product.price }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price
        };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.16; // 16% de impuestos
  const total = subtotal + tax;

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      await api.updateProduct(updatedProduct.id, updatedProduct);
      // Refresh inventory
      const productsData = await api.getProducts();
      if (productsData.data) setInventory(productsData.data);
    } catch (error) {
      console.error("Error updating product:", error);
      showModal("Error al actualizar producto", "Error", "error");
    }
  };

  if (currentView === 'INVENTORY') {
    return <div style={{ height: '100vh', background: '#f8f9fa' }}>
      <InventoryManagement
        onBack={() => setCurrentView('POS')}
        inventory={inventory}
        onUpdateProduct={handleUpdateProduct}
        settings={settings}
      />
    </div>;
  }

  if (currentView === 'REPORT') {
    return <div style={{ height: '100vh', background: '#f8f9fa' }}>
      <DailyReport
        onBack={() => setCurrentView('POS')}
        sales={sales}
      />
    </div>;
  }

  const handleUpdateSettings = async (newSettings) => {
    setSettings(newSettings); // Optimistic update
    // Persist each section
    try {
      await api.updateSetting('company', newSettings.company);
      await api.updateSetting('ticket', newSettings.ticket);
      await api.updateSetting('system', newSettings.system);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await api.createUser(userData);
      // Refresh users
      const usersResponse = await api.getUsers();
      setSettings(prev => ({ ...prev, users: usersResponse.data }));
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      // Refresh users
      const usersResponse = await api.getUsers();
      setSettings(prev => ({ ...prev, users: usersResponse.data }));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  const handleCompleteSale = async (paymentMethod) => {
    if (cartItems.length === 0) {
      showModal("El carrito está vacío", "Atención", "info");
      return;
    }

    if (paymentMethod === 'exchange') {
      setIsExchangeModalOpen(true);
      return;
    }

    const saleData = {
      id: `VENTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      items: cartItems,
      total: total,
      payment_method: paymentMethod,
      cashier: user?.name || "Unknown User"
    };

    try {
      const result = await api.createSale(saleData);

      // Refresh Inventory
      const productsData = await api.getProducts();
      if (productsData.data) setInventory(productsData.data);

      setSales(prev => [...prev, saleData]); // Keep local sales history for report for now
      setCartItems([]);
      showModal(`Venta completada con éxito!\nID: ${result.saleId}\nTotal: $${total.toFixed(2)}\n\n--- TICKET ---\n${settings.company.name}\n${settings.ticket.footerText}`, "Venta Exitosa");

    } catch (error) {
      console.error("Error completing sale:", error);
      showModal("Error al procesar la venta. Intente nuevamente.", "Error", "error");
    }
  };

  const handleConfirmExchange = async (returnedProduct) => {
    try {
      setIsExchangeModalOpen(false);

      // 1. Update stock of returned product (+1)
      const updatedReturnedProduct = { ...returnedProduct, stock: returnedProduct.stock + 1 };
      await api.updateProduct(returnedProduct.id, updatedReturnedProduct);

      // 2. Create Sale Record
      // Calculate difference
      const difference = total - returnedProduct.price;
      const note = `Cambio: Devolvió ${returnedProduct.name} ($${returnedProduct.price}). Diferencia: $${difference.toFixed(2)}`;

      const saleData = {
        id: `CAMBIO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString(),
        items: cartItems,
        total: total, // We record the full value of new items
        payment_method: 'EXCHANGE',
        cashier: user?.name || "Unknown User",
        note: note
      };

      const result = await api.createSale(saleData);

      // Refresh Inventory (to get updated stocks of sold items AND returned item)
      const productsData = await api.getProducts();
      if (productsData.data) setInventory(productsData.data);

      setSales(prev => [...prev, saleData]);
      setCartItems([]);

      let message = `Cambio completado con éxito!\nID: ${result.saleId}`;
      message += `\n\nProducto Devuelto: ${returnedProduct.name}`;
      if (difference > 0) message += `\nCliente pagó diferencia: $${difference.toFixed(2)}`;
      else if (difference < 0) message += `\nSe devolvió al cliente: $${Math.abs(difference).toFixed(2)}`;
      else message += `\nCambio parejo (sin diferencia).`;

      showModal(message, "Cambio Exitoso");

    } catch (error) {
      console.error("Error processing exchange:", error);
      showModal("Error al procesar el cambio.", "Error", "error");
    }
  };

  if (currentView === 'SETTINGS') {
    return <div style={{ height: '100vh', background: '#f8f9fa' }}>
      <SettingsView
        onBack={() => setCurrentView('POS')}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onCreateUser={handleCreateUser} // NEW
        onDeleteUser={handleDeleteUser} // NEW
      />
    </div>;
  }

  // Render Exchange Modal
  const exchangeModal = (
    <ExchangeModal
      isOpen={isExchangeModalOpen}
      onClose={() => setIsExchangeModalOpen(false)}
      onConfirm={handleConfirmExchange}
      inventory={inventory}
      cartTotal={total}
    />
  );

  return (
    <Layout
      topBar={<TopBar
        storeName={settings.company.fantasyName}
        user={user}
        onUserClick={() => {
          if (user?.role === 'ADMIN') {
            setCurrentView('SETTINGS');
          }
        }}
        inventory={inventory}
        settings={settings}
      />}
      otherComponents={exchangeModal}
      leftContent={
        <>
          <ProductSearch
            onAddToCart={addToCart}
            products={inventory}
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
          onShowReport={() => setCurrentView('REPORT')}
          onShowInventory={() => setCurrentView('INVENTORY')}
          onShowSettings={() => setCurrentView('SETTINGS')}
          onCompleteSale={handleCompleteSale}
          onLogout={logout}
          user={user}
        />
      }
      bottomBar={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
              <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>Subtotal:</span>
              <span style={{ fontWeight: '500', minWidth: '80px', textAlign: 'right' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px' }}>
              <span style={{ color: '#5f6368', fontSize: '0.9rem' }}>Impuestos (16%):</span>
              <span style={{ fontWeight: '500', minWidth: '80px', textAlign: 'right' }}>${tax.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#1a73e8', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0px' }}>Total a Pagar</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1', color: '#202124', letterSpacing: '-1px' }}>
              ${total.toFixed(2)}
            </div>
          </div>
        </div>
      }
    />
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
