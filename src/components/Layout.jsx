import React from 'react';
import styles from '../styles/Layout.module.css';

const Layout = ({ topBar, leftContent, rightSidebar, bottomBar, otherComponents }) => {
    return (
        <div className={styles.container}>
            {otherComponents}
            <header className={styles.topBar}>
                {topBar}
            </header>

            <main className={styles.mainContent}>
                <div className={styles.leftPanel}>
                    {leftContent}
                    <div className={styles.bottomBar}>
                        {bottomBar}
                    </div>
                </div>

                <aside className={styles.rightSidebar}>
                    {rightSidebar}
                </aside>
            </main>

            <footer className={styles.statusBar}>
                <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ backgroundColor: '#2ebd59' }}></span>
                    SISTEMA EN LÍNEA
                </div>
                <div className={styles.statusItem}>
                    <span className={styles.statusDot} style={{ backgroundColor: '#2ebd59' }}></span>
                    SINCRONIZACIÓN: HACE 1S
                </div>
                <div className={styles.systemInfo}>
                    TERMINAL POS V2.4.1 | HARDWARE: HP ELITEPOS G2
                </div>
            </footer>
        </div>
    );
};

export default Layout;
