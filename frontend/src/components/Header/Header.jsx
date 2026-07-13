import React from "react";
import styles from "./Header.module.css";

const Header = () => {
  return (
    <>
      <div className={styles.header_text} id="header">
        <div className={styles.header_logo}>
          <img src="/assets/kaffa_logo.png" alt="CoffeeRaffa Logo" />
        </div>
        <div className={styles.smoke_animation}>
          <div className={styles.image}>
            <img
              src="/assets/coffee-bean.png"
              alt="coffee"
              className={styles.coffeeImage}
            />
          </div>
          <div className={styles.smoke_wrap}>
            <img
              className={styles.smoke}
              src="/assets/coffee-smoke.png"
              alt="smoke"
            />
          </div>
          <div className={styles.smoke_wrap}>
            <img
              className={styles.smoke2}
              src="/assets/coffee-smoke.png"
              alt="smoke"
            />
          </div>
          <div className={styles.smoke_wrap}>
            <img
              className={styles.smoke3}
              src="/assets/coffee-smoke.png"
              alt="smoke"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
