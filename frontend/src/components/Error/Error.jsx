import styles from './Error.module.css';

import React from 'react';

const Error = () => {
    return (
        <div className={styles.errorContainer}>
            <h1 className={styles.errorCode}>404</h1>
            <h2 className={styles.errorMessage}>Səhifə tapılmadı!</h2>
            <button className={styles.homeButton} onClick={() => window.location.href = '/'}>
                Ana səhifəyə qayıt
            </button>
        </div>
    );
}

export default Error;
