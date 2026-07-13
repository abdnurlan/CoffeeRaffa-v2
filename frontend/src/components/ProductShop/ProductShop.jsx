import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../features/cartSlice";
import { API_data } from "../../data/data.jsx";
import {
  formatGrams,
  formatPrice,
  getCategoryName,
  getPriceOptions,
  withSelectedPrice,
} from "../../utils/catalog";
import styles from "./ProductShop.module.css";

const ProductShop = () => {
  const [products, setProducts] = useState([]);
  const [selectedGrams, setSelectedGrams] = useState({});
  const [addedProducts, setAddedProducts] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    API_data()
      .then((data) => {
        setProducts(data);
        setSelectedGrams(
          Object.fromEntries(
            data.map((product) => [product.id, getPriceOptions(product)[0]?.grams]),
          ),
        );
      })
      .catch(() => setProducts([]));
  }, []);

  const handleAddToCart = (product) => {
    dispatch(addToCart(withSelectedPrice(product, selectedGrams[product.id])));
    setAddedProducts((current) => ({ ...current, [product.id]: true }));
  };

  return (
    <div className="container" id="products">
      <div className={styles.shop_container}>
        <div className={styles.header}>
          <div className={styles.header_h6}><h6>Onlayn Mağaza</h6></div>
          <div className={styles.header_h3}><h3 className="display-font">Məhsullarımız</h3></div>
          <p className={styles.header_copy}>Dəmləmə üsulunuzu seçin, qramı isə zövqünüzə uyğunlaşdırın.</p>
        </div>

        <div className={styles.products_list}>
          {products.slice(0, 8).map((product) => {
            const options = getPriceOptions(product);
            const grams = selectedGrams[product.id] || options[0]?.grams;
            const price = options.find((option) => option.grams === Number(grams))?.price;
            return (
              <article key={product.id} className={styles.product}>
                <div className={styles.product_img_container}>
                  {product.img ? (
                    <img src={product.img} alt={product.name} />
                  ) : (
                    <div className={styles.image_fallback}>CR</div>
                  )}
                  <span className={styles.category_badge}>{getCategoryName(product)}</span>
                </div>
                <div className={styles.product_info}>
                  <div className={styles.stars} aria-label={`${product.star} ulduz`}>
                    {"★".repeat(product.star)}<span>{"☆".repeat(5 - product.star)}</span>
                  </div>
                  <h3>{product.name}</h3>
                  <div className={styles.variant_row}>
                    <select
                      aria-label={`${product.name} çəkisi`}
                      value={grams || ""}
                      onChange={(event) =>
                        setSelectedGrams((current) => ({
                          ...current,
                          [product.id]: Number(event.target.value),
                        }))
                      }
                    >
                      {options.map((option) => (
                        <option value={option.grams} key={option.grams}>
                          {formatGrams(option.grams)}
                        </option>
                      ))}
                    </select>
                    <strong>{formatPrice(price || 0)} ₼</strong>
                  </div>
                  {addedProducts[product.id] ? (
                    <Link to="/basket" className={styles.hover_btn_mobile}>Səbətə bax</Link>
                  ) : (
                    <button
                      type="button"
                      className={styles.hover_btn_mobile}
                      onClick={() => handleAddToCart(product)}
                      disabled={!options.length}
                    >
                      Səbətə əlavə et
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {products.length > 0 && (
          <Link to="/products" className={styles.button}>Bütün kataloqa bax</Link>
        )}
      </div>
    </div>
  );
};

export default ProductShop;
