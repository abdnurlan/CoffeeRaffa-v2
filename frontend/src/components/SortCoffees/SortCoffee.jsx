import React from "react";
import styles from "./SortCoffee.module.css";

const SortCoffee = () => {
  return (
    <>
      <div className={styles.background}>
        <div className="container">
          <div className={styles.information}>
            <div className={styles.information_text}>
              <p>
                Dünya qəhvə ekspertlərinin rəyinə əsasən, ən yaxşı qəhvə
                qovrulduğu andan{" "}
                <span style={{ color: "#4d8b55" }}>7-21 gün</span> aralığında
                içilən qəhvədir.
              </p>
            </div>
            <div className={styles.coffee_sorts}>
              <div className={styles.coffee_sort}>
                <div
                  className={styles.coffee_image}
                  style={{
                    backgroundImage: `url("/assets/colombia_2026.png")`,
                    backgroundPosition: "50%",
                  }}
                ></div>
                <div className={styles.coffee_number}>01</div>
                <div className={styles.coffee_sort_name}>
                  <h4>Kolumbiya Huila</h4>
                </div>
                <div className={styles.coffee_sort_info}>
                  <p>
                    2026-cı il məhsulu olan Huila qəhvəsi, şokolad və karamel
                    notları ilə zənginləşdirilmiş ultra-hamar bir profil təqdim edir.
                  </p>
                </div>
              </div>
              <div className={styles.coffee_sort}>
                <div
                  className={styles.coffee_image}
                  style={{
                    backgroundImage: `url("/assets/kenia_2026.png")`,
                    backgroundPosition: "50%",
                  }}
                ></div>
                <div className={styles.coffee_number}>02</div>
                <div className={styles.coffee_sort_name}>
                  <h4>Keniya SL28/34</h4>
                </div>
                <div className={styles.coffee_sort_info}>
                  <p>
                    Vulkanik torpaqlarda yetişən bu Premium AA dərəcəli qəhvə,
                    canlı sitrus turşuluğu və böyürtkən dadı ilə seçilir.
                  </p>
                </div>
              </div>
              <div className={styles.coffee_sort}>
                <div
                  className={styles.coffee_image}
                  style={{
                    backgroundImage: `url("/assets/ethiopia_2026.png")`,
                    backgroundPosition: "50%",
                  }}
                ></div>
                <div className={styles.coffee_number}>03</div>
                <div className={styles.coffee_sort_name}>
                  <h4>Efiopiya Yirgacheffe</h4>
                </div>
                <div className={styles.coffee_sort_info}>
                  <p>
                    Qəhvəni vətəni olan Efiopiyadan gələn bu çeşid, çiçəkli
                    yasəmən və parlaq limon aroması ilə unikal bir təcrübədir.
                  </p>
                </div>
              </div>
              <div className={styles.coffee_sort}>
                <div
                  className={styles.coffee_image}
                  style={{
                    backgroundImage: `url("/assets/guatemala_2026.png")`,
                    backgroundPosition: "50%",
                  }}
                ></div>
                <div className={styles.coffee_number}>04</div>
                <div className={styles.coffee_sort_name}>
                  <h4>Qvatemala Antigua</h4>
                </div>
                <div className={styles.coffee_sort_info}>
                  <p>
                    Antiqua vulkanlarının yamaclarından toplanan 100% Arabica,
                    fındıqlı və tünd meyvə notları ilə mükəmməl balansdadır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SortCoffee;
