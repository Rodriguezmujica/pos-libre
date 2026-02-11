import React, { useState } from 'react';
import {
    Settings, Shield, RefreshCw, Upload, Plus,
    Edit2, Trash2, Save, X, ArrowLeft, Building2,
    FileText, Users, ScanBarcode, CheckCircle, AlertTriangle
} from 'lucide-react';
import styles from '../styles/SettingsView.module.css';
import { companySettings, ticketSettings, systemSettings } from '../data/mockSettings';
import SuccessModal from './SuccessModal';

const SettingsView = ({ onBack, settings, onUpdateSettings, onCreateUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [newUser, setNewUser] = useState({
        name: '',
        username: '',
        password: '',
        role: 'CASHIER'
    });

    const [userToDelete, setUserToDelete] = useState(null);
    const [notification, setNotification] = useState(null);
    const [successModal, setSuccessModal] = useState({ show: false, message: '' });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleTicketToggle = (key) => {
        onUpdateSettings({
            ...settings,
            ticket: { ...settings.ticket, [key]: !settings.ticket[key] }
        });
    };

    const handleChange = (section, key, value) => {
        onUpdateSettings({
            ...settings,
            [section]: { ...settings[section], [key]: value }
        });
    };

    const openUserModal = () => {
        setNewUser({ name: '', username: '', password: '', role: 'CASHIER' });
        setIsModalOpen(true);
    };

    const handleSaveUser = async () => {
        if (!newUser.name || !newUser.username || !newUser.password) {
            showNotification("Por favor complete todos los campos", 'error');
            return;
        }
        try {
            await onCreateUser(newUser);
            setIsModalOpen(false);
            setSuccessModal({ show: true, message: 'El usuario ha sido creado correctamente en el sistema.' });
        } catch (error) {
            showNotification("Error al crear usuario", 'error');
        }
    };

    const confirmDeleteUser = (user) => {
        setUserToDelete(user);
    };

    const executeDeleteUser = async () => {
        if (userToDelete) {
            try {
                await onDeleteUser(userToDelete.id);
                setUserToDelete(null);
                setSuccessModal({ show: true, message: 'El usuario ha sido eliminado correctamente.' });
            } catch (error) {
                showNotification("Error al eliminar usuario", 'error');
            }
        }
    };

    return (
        <div className={styles.container}>
            {/* Sidebar and Main Content ... */}
            <div className={styles.sidebar}>
                {/* ... Sidebar content ... */}
                <div className={styles.logoArea}>
                    <div className={styles.logoIcon}>
                        <Settings size={24} />
                    </div>
                    <div className={styles.appTitle}>
                        <h2>Configuración</h2>
                        <span>PANEL DE CONTROL</span>
                    </div>
                </div>

                <button className={styles.backBtn} onClick={onBack}>
                    <ArrowLeft size={16} /> Volver al POS
                </button>

                <div className={styles.menu}>
                    <div
                        className={`${styles.menuItem} ${activeTab === 'general' ? styles.active : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Settings size={18} /> General del Sistema
                    </div>
                    {/* ... other tabs ... */}
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <div className={styles.left}>
                        <div className={styles.pageTitle}>
                            <h1>Panel de Ajustes Globales</h1>
                        </div>
                        <div className={styles.pageSubtitle}>
                            Gestión centralizada de datos, usuarios y formatos de impresión.
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.cancelBtn} onClick={onBack}>Cancelar</button>
                        <button className={styles.saveBtn} onClick={() => setSuccessModal({ show: true, message: 'La configuración ha sido guardada en la memoria del sistema.' })}>
                            <Save size={18} /> Guardar Cambios
                        </button>
                    </div>
                </div>

                <div className={styles.scrollArea}>
                    <div className={styles.contentColumn}>
                        {/* ... Company Data ... */}
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <Building2 size={20} color="#1a73e8" />
                                <h3 className={styles.sectionTitle}>Datos de la Empresa</h3>
                            </div>
                            {/* ... inputs ... */}
                            <div className={styles.formGrid}>
                                <div>
                                    <label className={styles.label}>NOMBRE DE FANTASÍA (Tienda)</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.company.fantasyName || ''}
                                        onChange={(e) => handleChange('company', 'fantasyName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>RAZÓN SOCIAL</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.company.name}
                                        onChange={(e) => handleChange('company', 'name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>RUT</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.company.rut}
                                        onChange={(e) => handleChange('company', 'rut', e.target.value)}
                                    />
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>DIRECCIÓN MATRIZ</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.company.address}
                                        onChange={(e) => handleChange('company', 'address', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>TELÉFONO DE CONTACTO</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.company.phone}
                                        onChange={(e) => handleChange('company', 'phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>GIRO</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.company.giro}
                                        onChange={(e) => handleChange('company', 'giro', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* User Management */}
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader} style={{ justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Users size={20} color="#1a73e8" />
                                    <h3 className={styles.sectionTitle}>Usuarios y Accesos</h3>
                                </div>
                                <button className={styles.addUserBtn} onClick={openUserModal}>
                                    <Plus size={14} /> Agregar Usuario
                                </button>
                            </div>

                            <table className={styles.userList}>
                                <thead>
                                    <tr>
                                        <th className={styles.userHeader}>NOMBRE / USUARIO</th>
                                        <th className={styles.userHeader}>ROL</th>
                                        <th className={styles.userHeader} style={{ textAlign: 'right' }}>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.users.map(user => (
                                        <tr key={user.id} className={styles.userRow}>
                                            <td>
                                                <div className={styles.userProfile}>
                                                    <div className={styles.userAvatar} style={{ background: '#e0e0e0', color: '#000' }}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className={styles.userInfo}>
                                                        <h5>{user.name}</h5>
                                                        <span>@{user.username}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.roleAdmin : styles.roleCashier}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionIcons}>
                                                    <Trash2 size={16} style={{ cursor: 'pointer' }} onClick={() => confirmDeleteUser(user)} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* System Settings */}
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <Settings size={20} color="#1a73e8" />
                                <h3 className={styles.sectionTitle}>Configuración del Sistema</h3>
                            </div>
                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Alertas de Stock Bajo</span>
                                <div
                                    className={`${styles.toggleSwitch} ${settings.system.lowStockAlert ? styles.checked : ''}`}
                                    onClick={() => handleChange('system', 'lowStockAlert', !settings.system.lowStockAlert)}
                                >
                                    <div className={styles.toggleHandle}></div>
                                </div>
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', gap: '20px' }}>
                                <div>
                                    <label className={styles.label}>STOCK MÍNIMO GLOBAL</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={settings.system.minStock}
                                        onChange={(e) => handleChange('system', 'minStock', parseInt(e.target.value) || 0)}
                                        style={{ maxWidth: 100 }}
                                    />
                                </div>
                                <div>
                                    <label className={styles.label}>TASA DE IMPUESTO (%)</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={settings.system.taxRate !== undefined ? settings.system.taxRate : 19}
                                        onChange={(e) => handleChange('system', 'taxRate', parseFloat(e.target.value) || 0)}
                                        style={{ maxWidth: 100 }}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Ticket Design */}
                    <div className={styles.previewColumn}>
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <FileText size={20} color="#1a73e8" />
                                <h3 className={styles.sectionTitle}>Diseño de Ticket</h3>
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Desglose de IVA</span>
                                <div
                                    className={`${styles.toggleSwitch} ${settings.ticket.showTaxBreakdown ? styles.checked : ''}`}
                                    onClick={() => handleTicketToggle('showTaxBreakdown')}
                                >
                                    <div className={styles.toggleHandle}></div>
                                </div>
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Mostrar Cajero</span>
                                <div
                                    className={`${styles.toggleSwitch} ${settings.ticket.showCashier ? styles.checked : ''}`}
                                    onClick={() => handleTicketToggle('showCashier')}
                                >
                                    <div className={styles.toggleHandle}></div>
                                </div>
                            </div>

                            <div style={{ marginTop: 16 }}>
                                <label className={styles.label}>LEYENDA PIE DE PÁGINA</label>
                                <textarea
                                    className={styles.input}
                                    rows={3}
                                    value={settings.ticket.footerText}
                                    onChange={(e) => handleChange('ticket', 'footerText', e.target.value)}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            <div className={styles.previewCard} style={{ marginTop: 24 }}>
                                <div className={styles.ticket}>
                                    {/* Ticket Preview Content */}
                                    <div className={styles.ticketHeader}>
                                        <div style={{ fontWeight: 'bold', fontSize: 14 }}>{settings.company.name.toUpperCase()}</div>
                                        <div>RUT: {settings.company.rut}</div>
                                        <div>{settings.company.address}</div>
                                    </div>
                                    <div className={styles.ticketBody}>
                                        <div className={styles.ticketRow}>
                                            <span>BOLETA</span>
                                            <span>#45821</span>
                                        </div>
                                        <div className={styles.ticketRow}>
                                            <span>SUBTOTAL:</span>
                                            <span>$24.782</span>
                                        </div>
                                        {settings.ticket.showTaxBreakdown && (
                                            <div className={styles.ticketRow}>
                                                <span>IVA ({settings.system.taxRate || 0}%):</span>
                                                <span>$4.708</span>
                                            </div>
                                        )}
                                        <div className={styles.ticketRow} style={{ fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
                                            <span>TOTAL:</span>
                                            <span>$29.490</span>
                                        </div>
                                    </div>
                                    <div className={styles.ticketFooter}>
                                        {settings.ticket.footerText}
                                        <div style={{ marginTop: 12 }}>
                                            <ScanBarcode size={32} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Crear Usuario */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Nuevo Usuario</h3>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {/* ... Form Fields same as before ... */}
                            <div className={styles.formGroup}>
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ej. Juan Pérez"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Usuario (Login)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ej. jperez"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    placeholder="••••••"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Rol de Acceso</label>
                                <div className={styles.roleSelector}>
                                    <div
                                        className={`${styles.roleOption} ${newUser.role === 'CASHIER' ? styles.selected : ''}`}
                                        onClick={() => setNewUser({ ...newUser, role: 'CASHIER' })}
                                    >
                                        <Users size={24} />
                                        <span className={styles.roleLabel}>CAJERO</span>
                                    </div>
                                    <div
                                        className={`${styles.roleOption} ${newUser.role === 'ADMIN' ? styles.selected : ''}`}
                                        onClick={() => setNewUser({ ...newUser, role: 'ADMIN' })}
                                    >
                                        <Shield size={24} />
                                        <span className={styles.roleLabel}>ADMIN</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </button>
                            <button className={styles.saveBtn} onClick={handleSaveUser}>
                                Guardar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado */}
            {userToDelete && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: 360 }}>
                        <div className={styles.modalHeader} style={{ background: '#fce8e6', borderBottom: '1px solid #f29c9f' }}>
                            <h3 className={styles.modalTitle} style={{ color: '#c5221f', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={20} /> Eliminar Usuario
                            </h3>
                            <button className={styles.closeBtn} onClick={() => setUserToDelete(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{ margin: 0, color: '#3c4043', lineHeight: 1.5 }}>
                                ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.name}</strong>?
                                <br /><br />
                                <span style={{ fontSize: 13, color: '#5f6368' }}>Esta acción no se puede deshacer y el usuario perderá el acceso inmediatamente.</span>
                            </p>
                        </div>
                        <div className={styles.modalFooter} style={{ background: '#fff' }}>
                            <button className={styles.cancelBtn} onClick={() => setUserToDelete(null)}>
                                Cancelar
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={executeDeleteUser}
                                style={{ background: '#d93025', border: 'none' }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Notification Toast (Only for errors now) */}
            {notification && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Success Modal Component */}
            <SuccessModal
                isOpen={successModal.show}
                onClose={() => setSuccessModal({ ...successModal, show: false })}
                message={successModal.message}
            />
        </div>
    );
};


export default SettingsView;
