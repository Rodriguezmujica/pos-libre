import React, { useState, useRef, useEffect } from 'react';
import {
    Search, Settings, User, Filter, Download,
    Box, Trash2, Plus, Save, ScanBarcode, Image as ImageIcon,
    ChevronLeft, ChevronRight, ArrowLeft, X
} from 'lucide-react';
import styles from '../../styles/InventoryManagement.module.css';
import { categories } from '../../data/mockInventory';
import SuccessModal from '../../components/common/SuccessModal';
import NotificationBell from '../../components/common/NotificationBell';

const InventoryPage = ({ onBack, inventory = [], onUpdateProduct, onAddProduct, onDeleteProduct, settings, targetProductId }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const minStock = settings?.system?.minStock || 5;
    const showLowStock = settings?.system?.lowStockAlert;

    // Estados locales para el formulario
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState(categories[0]);
    const [editPrice, setEditPrice] = useState('');
    const [editCost, setEditCost] = useState('');
    const [editStock, setEditStock] = useState('');
    const [editBarcode, setEditBarcode] = useState('');
    const [editKeywords, setEditKeywords] = useState([]);
    const [editLocation, setEditLocation] = useState('');
    const [editImage, setEditImage] = useState(null); // URL or Base64

    const [modalState, setModalState] = useState({ isOpen: false, message: '', title: '', type: 'success' });
    const [deleteId, setDeleteId] = useState(null); // ID of product to delete

    // Custom Categories State
    const [localCategories, setLocalCategories] = useState(categories);
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const [editVariants, setEditVariants] = useState([]);
    const [newVariant, setNewVariant] = useState({ name: '', stock: '', price: '' });
    const fileInputRef = useRef(null);

    const parseKeywords = (kw) => {
        if (Array.isArray(kw)) return kw;
        if (typeof kw === 'string') {
            try { return JSON.parse(kw); } catch { return []; }
        }
        return [];
    };

    const parseVariants = (v) => {
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') {
            try { return JSON.parse(v); } catch { return []; }
        }
        return [];
    }

    // Actualizar formulario cuando cambia el producto seleccionado o modo creación
    useEffect(() => {
        setIsAddingCategory(false); // Reset custom category mode
        if (isCreating) {
            setEditName('');
            setEditCategory(localCategories[0]);
            setEditPrice('');
            setEditCost('');
            setEditStock('');
            setEditBarcode('');
            setEditKeywords([]);
            setEditVariants([]);
            setEditLocation('');
            setEditImage(null);
            setNewVariant({ name: '', stock: '', price: '' });
        } else if (selectedProduct) {
            setEditName(selectedProduct.name);
            setEditCategory(selectedProduct.category);
            setEditPrice(selectedProduct.price.toString());
            setEditCost(selectedProduct.cost.toString());
            setEditStock(selectedProduct.stock.toString());
            setEditBarcode(selectedProduct.barcode || '');
            setEditKeywords(parseKeywords(selectedProduct.keywords));
            setEditVariants(parseVariants(selectedProduct.variants));
            setEditLocation(selectedProduct.location || '');
            setEditImage(selectedProduct.image || null);
            setNewVariant({ name: '', stock: '', price: '' });
        }
    }, [selectedProduct, isCreating]);

    // Handle targetProductId from props (notification click)
    useEffect(() => {
        if (targetProductId && inventory.length > 0) {
            const product = inventory.find(p => p.id === targetProductId);
            if (product) {
                setSelectedProduct(product);
                setIsCreating(false);
            }
        }
    }, [targetProductId, inventory]);


    const handleAddVariant = () => {
        if (!newVariant.name) return;
        const variant = {
            id: `v${Date.now()}`, // Temporary ID for frontend, backend/db logic might need to be consistent but this works for JSON storage
            name: newVariant.name,
            stock: parseInt(newVariant.stock) || 0,
            price: newVariant.price ? parseFloat(newVariant.price) : (parseFloat(editPrice) || 0)
        };
        setEditVariants([...editVariants, variant]);
        setNewVariant({ name: '', stock: '', price: '' });
    };

    const removeVariant = (index) => {
        const updated = [...editVariants];
        updated.splice(index, 1);
        setEditVariants(updated);
    };

    const handleSave = async () => {
        // Add to local categories if novel
        if (editCategory && !localCategories.includes(editCategory)) {
            setLocalCategories(prev => [...prev, editCategory]);
        }

        const productData = {
            name: editName,
            category: editCategory,
            price: parseFloat(editPrice) || 0,
            cost: parseFloat(editCost) || 0,
            stock: parseInt(editStock) || 0,
            barcode: editBarcode,
            keywords: editKeywords,
            variants: editVariants,
            location: editLocation,
            image: editImage
        };


        try {
            if (isCreating) {
                if (!editName) {
                    setModalState({ isOpen: true, title: 'Error', message: 'El nombre es obligatorio', type: 'error' });
                    return;
                }
                await onAddProduct(productData);
                setModalState({
                    isOpen: true,
                    title: 'Producto Creado',
                    message: `El producto "${editName}" se ha creado correctamente.`,
                    type: 'success'
                });
                setIsCreating(false);
            } else {
                if (!selectedProduct) return;
                await onUpdateProduct({ ...selectedProduct, ...productData });
                setModalState({
                    isOpen: true,
                    title: 'Producto Actualizado',
                    message: `Los datos del producto "${editName}" se han guardado correctamente.`,
                    type: 'success'
                });
            }
        } catch (error) {
            setModalState({ isOpen: true, title: 'Error', message: 'Hubo un error al guardar.', type: 'error' });
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await onDeleteProduct(deleteId);
            setModalState({ isOpen: true, title: 'Eliminado', message: 'Producto eliminado correctamente', type: 'success' });
            setDeleteId(null);
            setSelectedProduct(null); // Clear selection
        } catch (error) {
            setModalState({ isOpen: true, title: 'Error', message: 'No se pudo eliminar el producto.', type: 'error' });
        }
    };

    const handleAddKeyword = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const inputVal = e.target.value;
            const newKeywords = inputVal.split(',').map(k => k.trim()).filter(k => k !== '');
            const uniqueKeywords = newKeywords.filter(k => !editKeywords.includes(k));

            if (uniqueKeywords.length > 0) {
                setEditKeywords([...editKeywords, ...uniqueKeywords]);
            }
            e.target.value = '';
        }
    };

    const removeKeyword = (kw) => {
        setEditKeywords(editKeywords.filter(k => k !== kw));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const getCategoryStyle = (cat) => {
        switch (cat) {
            case 'CELULAR': return styles.catCelular;
            case 'CÁMARA': return styles.catCamara;
            case 'COMPUTACIÓN': return styles.catComputacion;
            case 'ACCESORIOS': return styles.catAccesorios;
            default: return styles.catAccesorios;
        }
    };

    const filteredInventory = inventory.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <SuccessModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
            />

            {/* Delete Confirmation Modal (Custom simple implementation) */}
            {deleteId && (
                <div className={styles.modalOverlay} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: 24, borderRadius: 8, maxWidth: 400, textAlign: 'center' }}>
                        <h3 style={{ marginTop: 0 }}>¿Eliminar Producto?</h3>
                        <p>Esta acción no se puede deshacer.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                            <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={executeDelete} style={{ padding: '8px 16px', border: 'none', background: '#d93025', color: 'white', borderRadius: 4, cursor: 'pointer' }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.topHeader}>
                <div className={styles.logoArea}>
                    <button className={styles.backBtn} onClick={onBack} title="Volver al inicio">
                        <ArrowLeft size={20} />
                        <span>Volver</span>
                    </button>
                    <h1 className={styles.title}>Gestión de Inventario</h1>
                </div>

                <div className={styles.searchArea}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar productos, SKUs o categorías..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.headerActions}>
                    <button
                        className={styles.primaryBtn}
                        onClick={() => { setIsCreating(true); setSelectedProduct(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4 }}
                    >
                        <Plus size={18} /> Nuevo Producto
                    </button>
                    <div style={{ width: 1, height: 24, background: '#dadce0', margin: '0 8px' }}></div>
                    <NotificationBell
                        inventory={inventory}
                        settings={settings}
                        onNotificationClick={(item) => setSelectedProduct(item)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Left Panel: Product List */}
                <div className={styles.leftPanel}>
                    <div className={styles.listHeader}>
                        <div className={styles.listTitle}>
                            Listado de Productos
                            <span className={styles.badge}>{filteredInventory.length} Items</span>
                        </div>
                        <div className={styles.listActions}>
                            <button className={styles.actionBtn}>
                                <Filter size={16} /> Filtrar
                            </button>
                            {/* Removed unused export button for now */}
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <div className={styles.tableScrollWrapper}>
                        <div className={styles.tableHeader}>
                            <div>NOMBRE</div>
                            <div>CATEGORÍA</div>
                            <div>PALABRAS CLAVE</div>
                            <div style={{ textAlign: 'center' }}>STOCK</div>
                            <div style={{ textAlign: 'right' }}>PRECIO VENTA</div>
                        </div>

                        {filteredInventory.map(product => (
                            <div
                                key={product.id}
                                className={`${styles.tableRow} ${selectedProduct?.id === product.id ? styles.active : ''}`}
                                onClick={() => { setSelectedProduct(product); setIsCreating(false); }}
                            >
                                <div>
                                    <div className={styles.rowName}>{product.name}</div>
                                    <span className={styles.rowSku}>SKU: {product.sku || product.barcode || '-'}</span>
                                </div>
                                <div>
                                    <span className={`${styles.categoryBadge} ${getCategoryStyle(product.category)}`}>
                                        {product.category}
                                    </span>
                                </div>
                                <div>
                                    {parseKeywords(product.keywords).slice(0, 2).map((kw, i) => (
                                        <span key={i} className={styles.keywordTag}>{kw}</span>
                                    ))}
                                    {parseKeywords(product.keywords).length > 2 && <span className={styles.keywordTag}>+{parseKeywords(product.keywords).length - 2}</span>}
                                </div>
                                <div className={`${styles.stock} ${showLowStock && product.stock <= minStock ? styles.stockLow : ''}`} style={{ textAlign: 'center' }}>
                                    {product.stock}
                                </div>
                                <div className={styles.price}>
                                    ${product.price ? product.price.toLocaleString('es-CL', { maximumFractionDigits: 0 }) : '0'}
                                </div>
                            </div>
                        ))}

                        <div className={styles.pagination}>
                            <span>Mostrando {filteredInventory.length} productos</span>
                        </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className={styles.rightPanel}>
                    <div className={styles.editorHeader}>
                        <h2 className={styles.listTitle}>
                            {isCreating ? 'Nuevo Producto' : 'Editor de Producto'}
                        </h2>
                        {!isCreating && selectedProduct && (
                            <button
                                className={styles.actionBtn}
                                style={{ border: 'none', color: '#d93025' }}
                                onClick={() => confirmDelete(selectedProduct.id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    {selectedProduct || isCreating ? (
                        <div className={styles.editorForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>NOMBRE DEL PRODUCTO</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Ej: Cable USB-C a USB-C"
                                />
                            </div>

                            <div className={styles.row2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>CATEGORÍA</label>
                                    {isAddingCategory ? (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                value={editCategory}
                                                onChange={(e) => setEditCategory(e.target.value.toUpperCase())}
                                                placeholder="NUEVA CATEGORÍA"
                                                autoFocus
                                            />
                                            <button
                                                className={styles.secondaryBtn}
                                                onClick={() => {
                                                    setIsAddingCategory(false);
                                                    setEditCategory(categories[0]);
                                                }}
                                                style={{ padding: '0 12px' }}
                                                title="Cancelar"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            className={styles.input}
                                            value={editCategory}
                                            onChange={(e) => {
                                                if (e.target.value === 'NEW_CATEGORY_OPTION') {
                                                    setIsAddingCategory(true);
                                                    setEditCategory('');
                                                } else {
                                                    setEditCategory(e.target.value);
                                                }
                                            }}
                                        >
                                            {localCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            <option value="NEW_CATEGORY_OPTION" style={{ fontWeight: 'bold', color: '#1a73e8' }}>+ CREAR NUEVA CATEGORÍA...</option>
                                        </select>
                                    )}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>CÓDIGO DE BARRAS</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={editBarcode}
                                            onChange={(e) => setEditBarcode(e.target.value)}
                                            placeholder="Escanear o escribir..."
                                        />
                                        <ScanBarcode size={18} style={{ position: 'absolute', right: 10, top: 10, color: '#9aa0a6' }} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>PALABRAS CLAVE (ETIQUETAS)</label>
                                <div className={styles.keywordInputContainer}>
                                    {editKeywords.map((kw, i) => (
                                        <span key={i} className={styles.removableTag}>
                                            {kw} <span className={styles.removeTag} onClick={() => removeKeyword(kw)}>×</span>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Añadir y presionar Enter..."
                                        className={styles.inputGhost}
                                        onKeyDown={handleAddKeyword}
                                    />
                                </div>
                            </div>

                            {/* Variants Section */}
                            <div className={styles.formGroup} style={{ marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
                                <label className={styles.label} style={{ marginBottom: 12, display: 'block' }}>VARIANTES DEL PRODUCTO</label>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {editVariants.map((v, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: 8, borderRadius: 4, border: '1px solid #dadce0' }}>
                                            <div style={{ flex: 2, fontWeight: 500 }}>{v.name}</div>
                                            <div style={{ width: 80, fontSize: 13 }}>Stock: {v.stock}</div>
                                            <div style={{ width: 100, fontSize: 13, fontWeight: 'bold' }}>${v.price ? v.price.toLocaleString() : editPrice}</div>
                                            <button
                                                onClick={() => removeVariant(i)}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d93025' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {editVariants.length === 0 && (
                                        <div style={{ color: '#5f6368', fontSize: 13, fontStyle: 'italic' }}>No hay variantes (se usa stock general).</div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: 11, color: '#5f6368', display: 'block', marginBottom: 4 }}>Nombre Variante</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            style={{ fontSize: 13 }}
                                            placeholder="Ej: Azul, XL..."
                                            value={newVariant.name}
                                            onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ width: 80 }}>
                                        <label style={{ fontSize: 11, color: '#5f6368', display: 'block', marginBottom: 4 }}>Stock</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            style={{ fontSize: 13 }}
                                            placeholder="0"
                                            value={newVariant.stock}
                                            onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ width: 100 }}>
                                        <label style={{ fontSize: 11, color: '#5f6368', display: 'block', marginBottom: 4 }}>Precio</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            style={{ fontSize: 13 }}
                                            placeholder={editPrice || "0"}
                                            value={newVariant.price}
                                            onChange={e => setNewVariant({ ...newVariant, price: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddVariant}
                                        disabled={!newVariant.name}
                                        style={{
                                            height: 36, padding: '0 12px', background: newVariant.name ? '#1a73e8' : '#dadce0',
                                            color: 'white', border: 'none', borderRadius: 4, cursor: newVariant.name ? 'pointer' : 'default',
                                            display: 'flex', alignItems: 'center'
                                        }}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.row2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>CANTIDAD EN STOCK</label>
                                    <div className={styles.qtyControl}>
                                        <button className={styles.qtyBtn} onClick={() => setEditStock((prev) => Math.max(0, parseInt(prev || 0) - 1).toString())}>-</button>
                                        <input
                                            type="text"
                                            className={styles.qtyInput}
                                            value={editStock}
                                            onChange={(e) => setEditStock(e.target.value)}
                                        />
                                        <button className={styles.qtyBtn} onClick={() => setEditStock((prev) => (parseInt(prev || 0) + 1).toString())}>+</button>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>UBICACIÓN ALMACÉN</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={editLocation}
                                        onChange={(e) => setEditLocation(e.target.value)}
                                        placeholder="Ej: Pasillo A"
                                    />
                                </div>
                            </div>

                            <div className={styles.row2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>PRECIO DE COMPRA</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 12, top: 10, color: '#9aa0a6' }}>$</span>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={editCost}
                                            onChange={(e) => setEditCost(e.target.value)}
                                            style={{ paddingLeft: 24 }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>PRECIO DE VENTA</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 12, top: 10, color: '#202124', fontWeight: 'bold' }}>$</span>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(e.target.value)}
                                            style={{ paddingLeft: 24, fontWeight: 'bold' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>IMAGEN DEL PRODUCTO</label>
                                <div
                                    className={styles.imageDropzone}
                                    onClick={triggerFileInput}
                                    style={editImage ? { border: 'none', padding: 0, height: 'auto', background: 'transparent' } : {}}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />

                                    {editImage ? (
                                        <div className={styles.imagePreviewContainer}>
                                            <img src={editImage} alt="Preview" className={styles.imagePreview} />
                                            <button
                                                className={styles.removeImageBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditImage(null);
                                                }}
                                            >
                                                <X size={14} color="white" />
                                            </button>
                                            <div className={styles.changeImageOverlay}>
                                                <span>Clic para cambiar</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} style={{ marginBottom: 8 }} />
                                            <span>Clic para subir imagen</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles.footerActions}>
                                <button className={styles.updateBtn} onClick={handleSave}>
                                    <Save size={18} />
                                    {isCreating ? 'Guardar Nuevo Producto' : 'Actualizar Producto'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#9aa0a6' }}>
                            <div style={{ marginBottom: 16 }}>
                                <Box size={48} opacity={0.2} />
                            </div>
                            <h3>Administra tu Catálogo</h3>
                            <p>Selecciona un producto para editar o crea uno nuevo desde el menú superior.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryPage;
