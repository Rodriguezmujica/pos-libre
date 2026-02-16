import React, { useState } from 'react';
import {
    Store, Users, Bell, AlertTriangle, ArrowLeft,
    Check, Save, Trash2, Plus, Shield, Settings,
    Database, Download, Upload
} from 'lucide-react';
import styles from '../../styles/SettingsView.module.css';
import SuccessModal from '../../components/common/SuccessModal';
import { api } from '../../services/api';

const SettingsPage = ({ onBack, settings, onUpdateSettings, users = [], onAddUser, onUpdateUser, onDeleteUser }) => {
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'users' | 'system'
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'CASHIER' }); // CASHIER | ADMIN

    // Edit Mode State
    const [editingUser, setEditingUser] = useState(null);

    // Modal state for success/error messages
    const [modalState, setModalState] = useState({ isOpen: false, message: '', title: '', type: 'success' });


    const [localSettings, setLocalSettings] = useState(settings);

    // Sync local state when settings prop changes (e.g. initial load)
    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (section, key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: value }
        }));
    };

    const handleSaveGeneral = async () => {
        try {
            await onUpdateSettings(localSettings);
            // setModalState is handled by onUpdateSettings in App.jsx usually, 
            // but here we might want to show local success if App doesn't throw
            // Actually App.jsx shows the modal. We just need to trigger it.
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveSystem = async () => {
        try {
            await onUpdateSettings(localSettings);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.password || !newUser.name) {
            setModalState({ isOpen: true, title: 'Error', message: 'Todos los campos son obligatorios', type: 'error' });
            return;
        }
        await onAddUser(newUser);
        setNewUser({ username: '', password: '', name: '', role: 'CASHIER' });
        // Success modal triggered in App.jsx
    };

    const handleInitEdit = (user) => {
        setEditingUser(user);
        setNewUser({
            username: user.username,
            password: '', // Password empty means no change
            name: user.name,
            role: user.role
        });
        // Scroll to form?
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setNewUser({ username: '', password: '', name: '', role: 'CASHIER' });
    };

    const handleUpdateUserExec = async () => {
        if (!newUser.username || !newUser.name) {
            setModalState({ isOpen: true, title: 'Error', message: 'Nombre y Usuario son obligatorios', type: 'error' });
            return;
        }

        await onUpdateUser(editingUser.id, newUser);
        handleCancelEdit();
        // Success modal trigger in App.jsx
    };

    const handleDeleteUser = async (id) => {
        if (users.length <= 1) {
            setModalState({ isOpen: true, title: 'Error', message: 'No puedes eliminar el último usuario.', type: 'error' });
            return;
        }
        if (editingUser && editingUser.id === id) {
            handleCancelEdit();
        }
        await onDeleteUser(id);
        // Modal in App.jsx
    };

    // Backup & Maintenance Handlers
    const handleDownloadBackup = async () => {
        try {
            const blob = await api.downloadBackup();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-tecniworld-${new Date().toISOString().split('T')[0]}.sqlite`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setModalState({ isOpen: true, title: 'Éxito', message: 'Copia de seguridad descargada correctamente.', type: 'success' });
        } catch (error) {
            console.error(error);
            setModalState({ isOpen: true, title: 'Error', message: 'Error al descargar la copia de seguridad.', type: 'error' });
        }
    };

    const handleRestoreBackup = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm("ATENCIÓN: Restaurar una copia de seguridad SOBREESCRIBIRÁ todos los datos actuales. ¿Estás seguro de que quieres continuar?")) {
            event.target.value = null;
            return;
        }

        try {
            await api.restoreBackup(file);
            setModalState({ isOpen: true, title: 'Éxito', message: 'Restauración completada. Por favor reinicia el sistema.', type: 'success' });
        } catch (error) {
            console.error(error);
            setModalState({ isOpen: true, title: 'Error', message: 'Error al restaurar: ' + error.message, type: 'error' });
        }
        event.target.value = null; // Reset input
    };

    // Clear DB State
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearDbAuth, setClearDbAuth] = useState({ password: '', phrase: '' });

    const handleClearDatabase = async () => {
        try {
            await api.clearDatabase(clearDbAuth.password, clearDbAuth.phrase);
            setShowClearConfirm(false);
            setClearDbAuth({ password: '', phrase: '' });
            setModalState({ isOpen: true, title: 'Sistema Limpio', message: 'La base de datos se ha limpiado correctamente (ventas y caja). Una copia de seguridad automática fue creada.', type: 'success' });
        } catch (error) {
            setModalState({ isOpen: true, title: 'Error', message: error.message, type: 'error' });
        }
    };

    if (!localSettings || !localSettings.company) return <div>Cargando configuración...</div>;

    return (
        <div className={styles.container}>
            <SuccessModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
            />

            {showClearConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 500, maxWidth: '90%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dc3545', marginBottom: 20 }}>
                            <AlertTriangle size={32} />
                            <h2 style={{ margin: 0 }}>ZONA DE PELIGRO</h2>
                        </div>
                        <p style={{ marginBottom: 20, lineHeight: 1.5 }}>
                            Estás a punto de <strong>ELIMINAR TODO EL HISTORIAL DE VENTAS Y CAJAS</strong>.
                            <br />
                            Los productos, usuarios y configuraciones se mantendrán.
                            <br /><br />
                            Esta acción es irreversible (aunque se hará una copia automática antes).
                        </p>

                        <div className={styles.formGroup}>
                            <label>Contraseña Administrador</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={clearDbAuth.password}
                                onChange={e => setClearDbAuth({ ...clearDbAuth, password: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Escribe la frase: <code>limpiarbasededatos</code></label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="limpiarbasededatos"
                                value={clearDbAuth.phrase}
                                onChange={e => setClearDbAuth({ ...clearDbAuth, phrase: e.target.value })}
                                style={{ border: clearDbAuth.phrase === 'limpiarbasededatos' ? '2px solid green' : '1px solid #ddd' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleClearDatabase}
                                disabled={!clearDbAuth.password || clearDbAuth.phrase !== 'limpiarbasededatos'}
                                style={{
                                    flex: 1, padding: 12, borderRadius: 8, border: 'none',
                                    background: (!clearDbAuth.password || clearDbAuth.phrase !== 'limpiarbasededatos') ? '#ccc' : '#dc3545',
                                    color: 'white', fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                CONFIRMAR BORRADO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <button className={styles.backBtn} onClick={onBack} title="Volver al inicio">
                        <ArrowLeft size={20} />
                        <span>Volver</span>
                    </button>
                    <h1>Configuración del Sistema</h1>
                </div>
            </div>

            <div className={styles.content}>
                {/* Sidebar Navigation */}
                <div className={styles.sidebar}>
                    <div
                        className={`${styles.tabItem} ${activeTab === 'general' ? styles.active : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Store size={20} />
                        <span>Empresa & Ticket</span>
                    </div>
                    <div
                        className={`${styles.tabItem} ${activeTab === 'users' ? styles.active : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} />
                        <span>Usuarios y Permisos</span>
                    </div>
                    <div
                        className={`${styles.tabItem} ${activeTab === 'system' ? styles.active : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        <Bell size={20} />
                        <span>Sistema y Alertas</span>
                    </div>
                    <div
                        className={`${styles.tabItem} ${activeTab === 'maintenance' ? styles.active : ''}`}
                        onClick={() => setActiveTab('maintenance')}
                    >
                        <Database size={20} />
                        <span>Mantenimiento</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={styles.mainPanel}>
                    {activeTab === 'general' && (
                        <div className={styles.row2} style={{ alignItems: 'start' }}>
                            <div className={styles.settingCard}>
                                <h2>Información de la Empresa</h2>
                                <p className={styles.subtitle}>Datos que aparecerán en los tickets y reportes.</p>

                                <div className={styles.formGroup}>
                                    <label>Nombre de la Tienda (Fantasía)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: TecniWorld"
                                        value={localSettings.company.fantasyName || ''}
                                        onChange={(e) => handleChange('company', 'fantasyName', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Razón Social (Legal)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Mi Empresa SpA"
                                        value={localSettings.company.name || ''}
                                        onChange={(e) => handleChange('company', 'name', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.row2}>
                                    <div className={styles.formGroup}>
                                        <label>RUT / Identificación</label>
                                        <input
                                            type="text"
                                            placeholder="76.XXX.XXX-X"
                                            value={localSettings.company.rut || ''}
                                            onChange={(e) => handleChange('company', 'rut', e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            placeholder="+56 9 ..."
                                            value={localSettings.company.phone || ''}
                                            onChange={(e) => handleChange('company', 'phone', e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        placeholder="Av. Siempre Viva 123"
                                        value={localSettings.company.address || ''}
                                        onChange={(e) => handleChange('company', 'address', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Texto Pie de Ticket</label>
                                    <input
                                        type="text"
                                        placeholder="Gracias por su compra!"
                                        value={localSettings.ticket?.footerText || ''}
                                        onChange={(e) => handleChange('ticket', 'footerText', e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.actions} style={{ marginTop: '24px' }}>
                                    <button className={styles.saveBtn} onClick={handleSaveGeneral}>
                                        <Save size={18} /> Guardar Cambios
                                    </button>
                                </div>
                            </div>

                            <div className={styles.previewColumn}>
                                <div className={styles.ticketPreviewContainer}>
                                    <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista Previa</h3>
                                    <div className={styles.ticket}>
                                        <div className={styles.ticketHeader}>
                                            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800' }}>{localSettings.company.fantasyName?.toUpperCase() || localSettings.company.name?.toUpperCase() || 'NOMBRE TIENDA'}</h3>
                                            <p style={{ margin: 0 }}>{localSettings.company.name || ''}</p>
                                            <p style={{ margin: 0 }}>RUT: {localSettings.company.rut || '76.XXX.XXX-X'}</p>
                                            <p style={{ margin: 0 }}>{localSettings.company.address || 'Dirección de ejemplo 123'}</p>
                                            <p style={{ margin: 0 }}>Tel: {localSettings.company.phone || '+56 9 XXXXXXXX'}</p>
                                        </div>
                                        <div className={styles.ticketDivider}></div>
                                        <div className={styles.ticketBody}>
                                            <div className={styles.ticketRow}><span>Producto A</span><span>$1.000</span></div>
                                            <div className={styles.ticketRow}><span>Producto B</span><span>$2.500</span></div>
                                            <div className={styles.ticketDivider}></div>
                                            <div className={styles.ticketRow} style={{ fontWeight: 'bold' }}><span>TOTAL</span><span>$3.500</span></div>
                                        </div>
                                        <div className={styles.ticketFooter}>
                                            {localSettings.ticket?.footerText || '¡Gracias por su preferencia!'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className={styles.panelContent}>
                            <h2>Gestión de Usuarios</h2>
                            <p className={styles.subtitle}>Administra quién tiene acceso al sistema.</p>

                            <div className={styles.userList}>
                                {users.map(u => (
                                    <div key={u.id} className={`${styles.userItem} ${editingUser?.id === u.id ? styles.activeUserItem : ''}`} style={editingUser?.id === u.id ? { border: '2px solid #007bff', background: '#f0f7ff' } : {}}>
                                        <div className={styles.userInfo}>
                                            <div className={styles.avatar}>
                                                <UserIcon role={u.role} />
                                            </div>
                                            <div>
                                                <div className={styles.userName}>{u.name} {u.id === editingUser?.id ? '(Editando)' : ''}</div>
                                                <div className={styles.userRole}>{u.role}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className={styles.editUserBtn}
                                                onClick={() => handleInitEdit(u)}
                                                title="Editar usuario"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007bff' }}
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button
                                                className={styles.deleteUserBtn}
                                                onClick={() => handleDeleteUser(u.id)}
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.divider}></div>

                            <h3>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>
                            <div className={styles.newUserForm}>
                                <div className={styles.formGroup}>
                                    <label>Nombre Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Juan Pérez"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className={styles.row2}>
                                    <div className={styles.formGroup}>
                                        <label>Usuario (Login)</label>
                                        <input
                                            type="text"
                                            placeholder="ej: juanp"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Contraseña {editingUser && <span style={{ fontSize: '0.8em', color: '#666' }}>(Dejar en blanco para mantener)</span>}</label>
                                        <input
                                            type="password"
                                            placeholder="******"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Rol y Permisos</label>
                                    <div className={styles.roleSelector}>
                                        <div
                                            className={`${styles.roleOption} ${newUser.role === 'CASHIER' ? styles.selected : ''}`}
                                            onClick={() => setNewUser({ ...newUser, role: 'CASHIER' })}
                                        >
                                            <Users size={24} />
                                            <span className={styles.roleLabel}>CAJERO</span>
                                            <span className={styles.roleDesc}>Ventas y cierre de caja.</span>
                                        </div>
                                        <div
                                            className={`${styles.roleOption} ${newUser.role === 'ADMIN' ? styles.selected : ''}`}
                                            onClick={() => setNewUser({ ...newUser, role: 'ADMIN' })}
                                        >
                                            <Shield size={24} />
                                            <span className={styles.roleLabel}>ADMIN</span>
                                            <span className={styles.roleDesc}>Control total del sistema.</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: 16 }}>
                                    {editingUser ? (
                                        <>
                                            <button
                                                className={styles.saveBtn}
                                                onClick={handleUpdateUserExec}
                                                style={{ flex: 1 }}
                                            >
                                                <Save size={18} /> Guardar Cambios
                                            </button>
                                            <button
                                                className={styles.cancelBtn}
                                                onClick={handleCancelEdit}
                                                style={{ flex: 1, background: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className={styles.saveBtn}
                                            onClick={handleAddUser}
                                            style={{ flex: 1 }}
                                        >
                                            <Plus size={18} /> Crear Usuario
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className={styles.panelContent}>
                            <h2>Configuración del Sistema</h2>
                            <div className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <div className={styles.settingIcon} style={{ background: '#fce8e6', color: '#c5221f' }}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3>Alertas de Stock Bajo</h3>
                                        <p>Notificar cuando un producto tenga pocas unidades.</p>
                                    </div>
                                    <label className={styles.toggleSw}>
                                        <input
                                            type="checkbox"
                                            checked={localSettings.system.lowStockAlert}
                                            onChange={(e) => handleChange('system', 'lowStockAlert', e.target.checked)}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                                {localSettings.system.lowStockAlert && (
                                    <div className={styles.settingBody}>
                                        <label>Inventario Crítico (unidades)</label>
                                        <input
                                            type="number"
                                            value={localSettings.system.minStock}
                                            onChange={(e) => handleChange('system', 'minStock', parseInt(e.target.value) || 0)}
                                            style={{ width: 80, padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <div className={styles.settingIcon} style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                                        <Check size={24} />
                                    </div>
                                    <div>
                                        <h3>Impuestos (IVA)</h3>
                                        <p>El IVA está incluido en los precios de los productos.</p>
                                    </div>
                                    <label className={styles.toggleSw}>
                                        <input
                                            type="checkbox"
                                            checked={localSettings.system.taxIncluded ?? true}
                                            onChange={(e) => handleChange('system', 'taxIncluded', e.target.checked)}
                                        />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                                <div className={styles.settingBody}>
                                    <label>Tasa de Impuesto (%)</label>
                                    <input
                                        type="number"
                                        value={localSettings.system.taxRate}
                                        onChange={(e) => handleChange('system', 'taxRate', parseFloat(e.target.value) || 0)}
                                        style={{ width: 80, padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>

                            <div className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <div className={styles.settingIcon} style={{ background: '#f3e5f5', color: '#7b1fa2' }}>
                                        <Settings size={24} />
                                    </div>
                                    <div>
                                        <h3>Impresora</h3>
                                        <p>Nombre exacto de la impresora en Windows.</p>
                                    </div>
                                </div>
                                <div className={styles.settingBody}>
                                    <label>Nombre del Dispositivo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: POS-58 (copy 1)"
                                        value={localSettings.system.printerName || ''}
                                        onChange={(e) => handleChange('system', 'printerName', e.target.value)}
                                        className={styles.input}
                                    />
                                    <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
                                        Debe coincidir exactamente con "Dispositivos e impresoras".
                                    </small>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button className={styles.saveBtn} onClick={handleSaveSystem}>
                                    <Save size={18} /> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className={styles.panelContent}>
                            <h2>Mantenimiento y Respaldo</h2>
                            <p className={styles.subtitle}>Gestiona la base de datos y copias de seguridad.</p>

                            {/* BACKUP SECTION */}
                            <div className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <div className={styles.settingIcon} style={{ background: '#e6f4ea', color: '#1e8e3e' }}>
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3>Copia de Seguridad</h3>
                                        <p>Descarga una copia completa de la base de datos.</p>
                                    </div>
                                    <button
                                        onClick={handleDownloadBackup}
                                        style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #1e8e3e', background: 'white', color: '#1e8e3e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                                    >
                                        <Download size={16} /> Descargar
                                    </button>
                                </div>
                            </div>

                            {/* RESTORE SECTION */}
                            <div className={styles.settingCard}>
                                <div className={styles.settingHeader}>
                                    <div className={styles.settingIcon} style={{ background: '#fef7e0', color: '#b06000' }}>
                                        <Upload size={24} />
                                    </div>
                                    <div>
                                        <h3>Restaurar Base de Datos</h3>
                                        <p>Sube un archivo .sqlite para restaurar el sistema.</p>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="file"
                                            accept=".sqlite"
                                            onChange={handleRestoreBackup}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                        />
                                        <button
                                            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #b06000', background: 'white', color: '#b06000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                                        >
                                            <Upload size={16} /> Restaurar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DANGER ZONE - CLEAR DB */}
                            <div className={styles.settingCard} style={{ border: '1px solid #f8d7da', background: '#fff' }}>
                                <div className={styles.settingHeader}>
                                    <div className={styles.settingIcon} style={{ background: '#f8d7da', color: '#721c24' }}>
                                        <Trash2 size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#dc3545' }}>Borrado de Fábrica</h3>
                                        <p>Elimina todo el historial de ventas y cajas. Mantiene productos y usuarios.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowClearConfirm(true)}
                                        style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                                    >
                                        <AlertTriangle size={16} /> LIMPIAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserIcon = ({ role }) => {
    return role === 'ADMIN' ? <Shield size={20} /> : <Users size={20} />;
}

export default SettingsPage;
