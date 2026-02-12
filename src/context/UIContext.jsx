import React, { createContext, useContext, useState, useCallback } from 'react';
import SuccessModal from "../components/common/SuccessModal";

const UIContext = createContext();

export function UIProvider({ children }) {
    const [modalState, setModalState] = useState({
        isOpen: false,
        message: '',
        title: '',
        type: 'success'
    });

    const showModal = useCallback((message, title = 'Notificación', type = 'success') => {
        setModalState({ isOpen: true, message, title, type });
    }, []);

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <UIContext.Provider value={{ showModal, closeModal }}>
            {children}
            {/* Global Success/Error Modal */}
            <SuccessModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                message={modalState.message}
                title={modalState.title}
                type={modalState.type}
            />
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
