import React, { useState, useRef } from 'react';
import {
    Search, Bell, Settings, User, Filter, Download,
    Box, Trash2, Plus, Save, ScanBarcode, Image as ImageIcon,
    ChevronLeft, ChevronRight, ArrowLeft, X
} from 'lucide-react';
import styles from '../styles/InventoryManagement.module.css';
import { categories } from '../data/mockInventory';
import SuccessModal from './SuccessModal';

const InventoryManagement = ({ onBack, inventory = [], onUpdateProduct, settings }) => {
    const [selectedProduct, setSelectedProduct] = useState(inventory[0]);
    const [searchTerm, setSearchTerm] = useState('');

    const minStock = settings?.system?.minStock || 5;
    const showLowStock = settings?.system?.lowStockAlert;

    // Estados locales para el formulario
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editCost, setEditCost] = useState('');
    const [editStock, setEditStock] = useState('');
    const [editBarcode, setEditBarcode] = useState('');
    const [editKeywords, setEditKeywords] = useState([]);
    const [editLocation, setEditLocation] = useState('');
    const [editImage, setEditImage] = useState(null); // URL or Base64

    const [modalState, setModalState] = useState({ isOpen: false, message: '', title: '', type: 'success' });
    const fileInputRef = useRef(null);

    const parseKeywords = (kw) => {
        if (Array.isArray(kw)) return kw;
        if (typeof kw === 'string') {
            try { return JSON.parse(kw); } catch { return []; }
        }
        return [];
    };

    // Actualizar formulario cuando cambia el producto seleccionado
    React.useEffect(() => {
        if (selectedProduct) {
            setEditName(selectedProduct.name);
            setEditCategory(selectedProduct.category);
            setEditPrice(selectedProduct.price.toString());
            setEditCost(selectedProduct.cost.toString());
            setEditStock(selectedProduct.stock.toString());
            setEditBarcode(selectedProduct.barcode || '');
            setEditKeywords(parseKeywords(selectedProduct.keywords));
            setEditLocation(selectedProduct.location || '');
            setEditImage(selectedProduct.image || null);
        }
    }, [selectedProduct]);

    // Mantener seleccionado actualizado si el inventario cambia
    React.useEffect(() => {
        if (selectedProduct) {
            const updated = inventory.find(p => p.id === selectedProduct.id);
            if (updated) setSelectedProduct(updated);
        } else if (inventory.length > 0) {
            setSelectedProduct(inventory[0]);
        }
    }, [inventory]);

    const handleSave = () => {
        if (!selectedProduct) return;

        const updatedProduct = {
            ...selectedProduct,
            name: editName,
            category: editCategory,
            price: parseFloat(editPrice) || 0,
            cost: parseFloat(editCost) || 0,
            stock: parseInt(editStock) || 0,
            barcode: editBarcode,
            keywords: editKeywords,
            location: editLocation,
            image: editImage
        };

        onUpdateProduct(updatedProduct);
        setModalState({
            isOpen: true,
            title: 'Producto Actualizado',
            message: `Los datos del producto "${editName}" se han guardado correctamente.`,
            type: 'success'
        });
    };

    const handleAddKeyword = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            const inputVal = e.target.value;
            // Split by comma if present, otherwise just trim
            const newKeywords = inputVal.split(',').map(k => k.trim()).filter(k => k !== '');

            // Add unique keywords
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
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

            {/* Top Header */}
            <div className={styles.topHeader}>
                <div className={styles.logoArea}>
                    <div className={styles.logoIcon} onClick={onBack} style={{ cursor: 'pointer' }}>
                        <Box size={20} />
                    </div>
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
                    <button className={styles.backBtn} onClick={onBack}>
                        <ArrowLeft size={18} />
                        Volver
                    </button>
                    <div style={{ width: 1, height: 24, background: '#dadce0', margin: '0 8px' }}></div>
                    <Bell size={20} style={{ cursor: 'pointer' }} />
                    <Settings size={20} style={{ cursor: 'pointer' }} />
                    <User size={20} style={{ cursor: 'pointer' }} />
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
                            <button className={styles.actionBtn}>
                                <Download size={16} /> Exportar
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
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
                                onClick={() => setSelectedProduct(product)}
                            >
                                <div>
                                    <div className={styles.rowName}>{product.name}</div>
                                    <span className={styles.rowSku}>SKU: {product.sku}</span>
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
                                    ${product.price ? product.price.toLocaleString() : '0.00'}
                                </div>
                            </div>
                        ))}

                        <div className={styles.pagination}>
                            <span>Mostrando {filteredInventory.length} productos</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className={styles.rightPanel}>
                    <div className={styles.editorHeader}>
                        <h2 className={styles.listTitle}>Editor de Producto</h2>
                        <button className={styles.actionBtn} style={{ border: 'none' }}>
                            <Trash2 size={18} color="#9aa0a6" />
                        </button>
                    </div>

                    {selectedProduct ? (
                        <div className={styles.editorForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>NOMBRE DEL PRODUCTO</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>

                            <div className={styles.row2}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>CATEGORÍA</label>
                                    <select
                                        className={styles.input}
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                    >
                                        {categories.map(cat => <option key={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>CÓDIGO DE BARRAS</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={editBarcode}
                                            onChange={(e) => setEditBarcode(e.target.value)}
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
                                    Actualizar Producto
                                </button>
                                <div className={styles.secondaryActions}>
                                    <button className={styles.secondaryBtn}>
                                        <Plus size={18} /> Nuevo
                                    </button>
                                    <button className={`${styles.secondaryBtn} ${styles.dangerBtn}`}>
                                        <Trash2 size={18} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: '#9aa0a6' }}>
                            Selecciona un producto para editar
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryManagement;
