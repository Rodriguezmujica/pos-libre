import React, { useState } from 'react';
import { Search, ScanBarcode, Eye, PlusCircle } from 'lucide-react';
import styles from '../../../styles/ProductSearch.module.css';
import ImagePreviewModal from '../../../components/common/ImagePreviewModal';
import VariantSelector from './VariantSelector';

const ProductSearch = ({ onAddToCart, products = [], onOpenCustomItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);

    const filteredProducts = React.useMemo(() => {
        if (!searchTerm) {
            // Sort by total_sold desc, take top 5
            return [...products]
                .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
                .slice(0, 5);
        }
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.includes(searchTerm))
        );
    }, [products, searchTerm]);

    const handleProductClick = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProductForVariants(product);
            setVariantModalOpen(true);
        } else {
            onAddToCart && onAddToCart(product);
        }
    };

    const handleVariantSelect = (variant) => {
        if (!selectedProductForVariants) return;

        // Construct a cart-ready item
        const itemToAdd = {
            id: variant.id, // Use variant ID (must be unique)
            name: `${selectedProductForVariants.name} (${variant.name})`,
            price: variant.price || selectedProductForVariants.price,
            stock: variant.stock,
            image: variant.image || selectedProductForVariants.image
            // We lose the parent category/location if we don't copy it, but usually not critical for cart
        };

        onAddToCart && onAddToCart(itemToAdd);
        setVariantModalOpen(false);
        setSelectedProductForVariants(null);
    };

    const handleImageClick = (e, product) => {
        e.stopPropagation();
        if (product.image) {
            setSelectedImage({
                url: product.image,
                alt: product.name
            });
        }
    };

    return (
        <div className={styles.container}>
            {/* Entrada de Búsqueda */}
            <div className={styles.searchBar}>
                <div className={styles.inputWrapper}>
                    <ScanBarcode className={styles.scanIcon} />
                    <input
                        type="text"
                        placeholder="Buscar producto o escanear código de barras (Ctrl+S)"
                        className={styles.input}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <Search className={styles.searchIcon} />
                </div>
                {onOpenCustomItem && (
                    <button
                        onClick={onOpenCustomItem}
                        style={{
                            height: '100%',
                            padding: '0 16px',
                            background: '#e8f0fe',
                            border: '1px solid #d2e3fc',
                            borderRadius: '8px',
                            color: '#1a73e8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600',
                            fontSize: '13px',
                            whiteSpace: 'nowrap'
                        }}
                        title="Agregar item personalizado"
                    >
                        <PlusCircle size={18} />
                        Item Personalizado
                    </button>
                )}
            </div>

            {/* Encabezado de Resultados */}
            <div className={styles.resultsHeader}>
                <span className={styles.headerTitle}>
                    {searchTerm ? "RESULTADOS DE BÚSQUEDA" : "MÁS VENDIDOS"}
                </span>
                <span className={styles.matchCount}>
                    {filteredProducts.length} {searchTerm ? "coincidencias encontradas" : "productos destacados"}
                </span>
            </div>

            {/* Lista de Productos */}
            <div className={styles.productList}>
                <div className={styles.tableHeader}>
                    <div className={styles.colProduct}>PRODUCTO</div>
                    <div className={styles.colLocation}>UBICACIÓN</div>
                    <div className={styles.colCategory}>CATEGORÍA</div>
                    <div className={styles.colPrice}>PRECIO</div>
                    <div className={styles.colStock}>STOCK</div>
                    <div className={styles.colActions}></div>
                </div>

                <div className={styles.listItems}>
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className={styles.productRow}
                            onClick={() => handleProductClick(product)}
                        >
                            <div className={styles.colProduct}>
                                <span className={styles.productName}>{product.name}</span>
                                {product.variants && product.variants.length > 0 && (
                                    <span style={{ fontSize: '10px', background: '#e8f0fe', color: '#1a73e8', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                                        {product.variants.length} opciones
                                    </span>
                                )}
                            </div>
                            <div className={styles.colLocation}>
                                <span className={styles.locationText}>{product.location}</span>
                            </div>
                            <div className={styles.colCategory}>
                                <span className={styles.categoryBadge}>{product.category}</span>
                            </div>
                            <div className={styles.colPrice}>
                                ${product.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                            </div>
                            <div className={styles.colStock}>
                                <span className={styles.stockCount}>
                                    {product.variants
                                        ? product.variants.reduce((acc, v) => acc + v.stock, 0) // Sum variant stock for display
                                        : product.stock
                                    } en Stock
                                </span>
                            </div>
                            <div className={styles.colActions}>
                                {product.image && (
                                    <button
                                        className={styles.actionButton}
                                        onClick={(e) => handleImageClick(e, product)}
                                        title="Ver foto"
                                    >
                                        <Eye size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ImagePreviewModal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                imageUrl={selectedImage?.url}
                altText={selectedImage?.alt}
            />

            <VariantSelector
                isOpen={variantModalOpen}
                onClose={() => setVariantModalOpen(false)}
                product={selectedProductForVariants}
                onSelectVariant={handleVariantSelect}
            />
        </div>
    );
};

export default ProductSearch;
