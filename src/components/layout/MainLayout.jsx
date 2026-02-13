import React from 'react';
import styles from '../../styles/Layout.module.css';

const MainLayout = ({ topBar, leftContent, rightSidebar, bottomBar, mobileStickyFooter, otherComponents }) => {
    return (
        <div className={styles.container}>
            {topBar}
            <div className={styles.mainContent}>
                <div className={styles.leftSection}>
                    <div className={styles.leftColumn}>
                        {leftContent}
                    </div>
                    <div className={styles.bottomBar}>
                        {bottomBar}
                    </div>
                </div>
                <div className={styles.rightColumn}>
                    {rightSidebar}
                </div>
            </div>
            {mobileStickyFooter && (
                <div className={styles.mobileStickyFooter}>
                    {mobileStickyFooter}
                </div>
            )}
            {otherComponents}
        </div>
    );
};

export default MainLayout;
