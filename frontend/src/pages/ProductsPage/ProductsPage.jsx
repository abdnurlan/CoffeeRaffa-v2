import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../features/cartSlice";
import { API_categories, API_data } from "../../data/data.jsx";
import {
  formatGrams,
  formatPrice,
  getCategoryName,
  getPriceOptions,
  getUnitPrice,
  isCoffee,
  withSelectedPrice,
} from "../../utils/catalog";
import styles from "./ProductsPage.module.css";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedGrams, setSelectedGrams] = useState({});
  const [addedProducts, setAddedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([API_data(), API_categories()])
      .then(([productData, categoryData]) => {
        setProducts(productData);
        setCategories(categoryData.filter((category) => category.is_active));
        setSelectedGrams(
          Object.fromEntries(
            productData
              .filter(isCoffee)
              .map((product) => [product.id, getPriceOptions(product)[0]?.grams]),
          ),
        );
      })
      .catch(() => setError("Kataloq hazırda yüklənmir. Bir az sonra yenidən yoxlayın."))
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = useMemo(
    () =>
      activeCategory === "all"
        ? products
        : products.filter(
            (product) => String(product.category_id) === String(activeCategory),
          ),
    [activeCategory, products],
  );

  const handleAddToCart = (product) => {
    dispatch(addToCart(withSelectedPrice(product, selectedGrams[product.id])));
    setAddedProducts((current) => ({ ...current, [product.id]: true }));
  };

  return (
    <main className={styles.pageWrapper}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Coffee Raffa · Kataloq</span>
          <h1>Qəhvə və dəmləmə dünyası</h1>
          <p>
            Təzə qovrulmuş qəhvənizi qramla, dəmləmə avadanlıqlarını isə ədədlə
            seçib səbətə əlavə edin.
          </p>
        </div>
      </section>

      <section className={styles.catalogSection}>
        <div className={styles.filterBar} aria-label="Məhsul kateqoriyaları">
          <button
            type="button"
            className={activeCategory === "all" ? styles.activeFilter : ""}
            onClick={() => setActiveCategory("all")}
          >
            Hamısı <span>{products.length}</span>
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={
                String(activeCategory) === String(category.id)
                  ? styles.activeFilter
                  : ""
              }
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name} <span>{category.product_count}</span>
            </button>
          ))}
        </div>

        {loading && <div className={styles.statusPanel}>Kataloq hazırlanır…</div>}
        {error && <div className={styles.errorPanel}>{error}</div>}
        {!loading && !error && visibleProducts.length === 0 && (
          <div className={styles.statusPanel}>
            <strong>Bu bölmədə hələ məhsul yoxdur.</strong>
            <span>Yeni qovurmalar tezliklə burada görünəcək.</span>
          </div>
        )}

        <div className={styles.productsGrid}>
          {visibleProducts.map((product) => {
            const coffee = isCoffee(product);
            const priceOptions = getPriceOptions(product);
            const currentGrams = selectedGrams[product.id] || priceOptions[0]?.grams;
            const currentPrice = coffee
              ? priceOptions.find((option) => option.grams === Number(currentGrams))
                  ?.price ?? 0
              : getUnitPrice(product) ?? 0;
            return (
              <article key={product.id} className={styles.productCard}>
                <div className={styles.imageContainer}>
                  {product.img ? (
                    <img src={product.img} alt={product.name} />
                  ) : (
                    <div className={styles.imageFallback}>CR</div>
                  )}
                  <span className={styles.categoryBadge}>{getCategoryName(product)}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.rating} aria-label={`${product.star} ulduz`}>
                    {"★".repeat(product.star)}
                    <span>{"☆".repeat(5 - product.star)}</span>
                  </div>
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>

                  <div className={styles.purchaseRow}>
                    {coffee ? (
                      <label>
                        <span>Çəki</span>
                        <select
                          value={currentGrams || ""}
                          onChange={(event) =>
                            setSelectedGrams((current) => ({
                              ...current,
                              [product.id]: Number(event.target.value),
                            }))
                          }
                        >
                          {priceOptions.map((option) => (
                            <option key={option.grams} value={option.grams}>
                              {formatGrams(option.grams)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div className={styles.unitLabel}>
                        <span>Satış forması</span>
                        <strong>Ədəd</strong>
                      </div>
                    )}
                    <div className={styles.price}>
                      <strong>{formatPrice(currentPrice)} ₼</strong>
                      <span>{coffee ? formatGrams(currentGrams) : "1 ədəd"}</span>
                    </div>
                  </div>

                  {addedProducts[product.id] ? (
                    <Link to="/basket" className={styles.cartButtonSecondary}>
                      Səbətə bax
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={styles.cartButton}
                      onClick={() => handleAddToCart(product)}
                      disabled={coffee ? !priceOptions.length : getUnitPrice(product) === undefined}
                    >
                      Səbətə əlavə et
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default ProductsPage;
