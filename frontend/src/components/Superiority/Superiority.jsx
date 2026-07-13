import React, { useEffect, useState } from "react";
import styles from "./Superiority.module.css";
import CoffeeScene3D from "./CoffeeScene3D";

const Superiority = () => {
  const [showCup, setShowCup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.querySelector(`.${styles.superior_container}`);
      const windowHeight = window.innerHeight;
      const rect = element.getBoundingClientRect();
      const offset = windowHeight - rect.top;
      if (offset > 0 && !showCup) {
        setShowCup(true);
        element.classList.add(styles.animate);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showCup]);

  return (
    <div className="container">
      <div className={styles.superior_container}>
        <div className={`${styles.first_part} ${styles.animate}`}>
          <div className={styles.item}>
            <div className={styles.image}>
              <img src="/assets/superiority_1.png" alt="superiority" />
            </div>
            <div className={styles.item_info}>
              <h6 className={styles.item_h6}>Eksklüziv Növlər</h6>
              <p className={styles.item_text}>
                Yalnız ən yüksək hündürlüklərdə, xüsusi mikro-iqlimlərdə
                yetişdirilən tək mənşəli (single-origin) qəhvə dənələri.
              </p>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.image}>
              <img src="/assets/superiority_2.png" alt="superiority" />
            </div>
            <div className={styles.item_info}>
              <h6 className={styles.item_h6}>Qlobal Kolleksiya</h6>
              <p className={styles.item_text}>
                Dünyanın ən nüfuzlu plantasiyalarından birbaşa
                tədarük edilən Specialty dərəcəli qəhvə çeşidləri.
              </p>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.image}>
              <img src="/assets/superiority_3.png" alt="superiority" />
            </div>
            <div className={styles.item_info}>
              <h6 className={styles.item_h6}>Artizan Qovurma</h6>
              <p className={styles.item_text}>
                Hər dənənin xarakterini ortaya çıxaran,
                elmi əsaslı və usta əli ilə idarə olunan qovurma prosesi.
              </p>
            </div>
          </div>
        </div>
        <div
          className={styles.cup}
          style={{
            transform: showCup ? "scale(1)" : "scale(0)",
            transition: "transform 1s",
          }}
        >
          <CoffeeScene3D />
        </div>
        <div className={`${styles.second_part} ${styles.animate}`}>
          <div className={styles.item}>
            <div className={styles.image}>
              <img src="/assets/superiority_4.png" alt="superiority" />
            </div>
            <div className={styles.item_info}>
              <h6 className={styles.item_h6}>SGS Sertifikatlı</h6>
              <p className={styles.item_text}>
                İstehsalın hər mərhələsində beynəlxalq keyfiyyət və
                təhlükəsizlik standartlarına tam uyğunluq.
              </p>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.image}>
              <img src="/assets/superiority_5.png" alt="superiority" />
            </div>
            <div className={styles.item_info}>
              <h6 className={styles.item_h6}>Həssas Üyüdülmə</h6>
              <p className={styles.item_text}>
                Dərinlik və dad balansını qorumaq üçün ultra-modern
                dəyirmanlarda mikron səviyyəsində həssas üyüdülmə.
              </p>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.image}>
              <img src="/assets/superiority_6.png" alt="superiority" />
            </div>
            <div className={styles.item_info}>
              <h6 className={styles.item_h6}>Dinamik Aroma</h6>
              <p className={styles.item_text}>
                Qəhvənin təbii yağlarını qoruyan xüsusi paketləmə
                ilə gələn möhtəşəm və qalıcı ətir profili.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Superiority;
