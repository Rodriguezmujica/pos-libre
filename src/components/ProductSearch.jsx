import React, { useState } from 'react';
import { Search, ScanBarcode, Eye } from 'lucide-react';
import styles from '../styles/ProductSearch.module.css';
import ImagePreviewModal from './ImagePreviewModal';

const ProductSearch = ({ onAddToCart, products = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            </div>

            {/* Encabezado de Resultados */}
            <div className={styles.resultsHeader}>
                <span className={styles.headerTitle}>RESULTADOS DE BÚSQUEDA</span>
                <span className={styles.matchCount}>{filteredProducts.length} coincidencias encontradas</span>
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
                            onClick={() => onAddToCart && onAddToCart(product)}
                        >
                            <div className={styles.colProduct}>
                                <span className={styles.productName}>{product.name}</span>
                            </div>
                            <div className={styles.colLocation}>
                                <span className={styles.locationText}>{product.location}</span>
                            </div>
                            <div className={styles.colCategory}>
                                <span className={styles.categoryBadge}>{product.category}</span>
                            </div>
                            <div className={styles.colPrice}>
                                ${product.price.toFixed(2)}
                            </div>
                            <div className={styles.colStock}>
                                <span className={styles.stockCount}>{product.stock} en Stock</span>
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
        </div>
    );
};

export default ProductSearch;
