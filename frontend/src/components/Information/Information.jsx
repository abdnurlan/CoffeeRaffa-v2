import React from "react";
import styles from "./Information.module.css";

const Information = () => {
  return (
    <>
      <div className="container" id="about">
        <div className={styles.information}>
          <div className={styles.texts}>
            <div className={`${styles.green_word} ${styles["h3"]}`}>
              <h3>Coffeeraffa:</h3>
            </div>
            <div className={styles["h3"]}>
              <h3>Mükəmməl Qovurma sənəti</h3>
            </div>
            <div className={styles.paragraph}>
              <p>
                Artıq 3 ildən çoxdur ki, biz sizə ən seçilmiş, təzə qovrulmuş qəhvə
                dənələrini təqdim edirik. 2026-cı ildə hədəfimiz sadəcə qəhvə satmaq deyil,
                hər fincanda əsl qəhvə mədəniyyətini yaşatmaqdır. İstifadə etdiyiniz qəhvənin
                qovrulduğu tarixdən 1 ay keçibsə, siz əsl aromadan məhrum olursunuz.
              </p>
            </div>
            <div className={styles.icons}>
            </div>
          </div>
          <div className={styles.images}>
            <div className={styles.image_frame}>
              <img
                src="/assets/coffeeraffa_girl_branded_2026.png"
                alt="coffee culture 2026"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Information;
