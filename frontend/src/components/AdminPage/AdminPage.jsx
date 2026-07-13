import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  formatGrams,
  formatPrice,
  getCategoryName,
  getPriceOptions,
} from "../../utils/catalog";
import styles from "./AdminPage.module.css";

const API = "https://api.coffeeraffa.az/api";

const emptyProduct = () => ({
  name: "",
  description: "",
  categoryId: "",
  quality: "Medium",
  star: 5,
  priceOptions: [{ grams: 250, price: "" }],
  image: null,
});

const emptyCategory = () => ({
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
});

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;
  return (
    <div className={`${styles.notification} ${styles[notification.type]}`}>
      <span>{notification.message}</span>
      <button type="button" onClick={onClose} aria-label="Bildirişi bağla">×</button>
    </div>
  );
};

const AdminPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem("coffeeToken") || "");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [section, setSection] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const notify = (message, type = "success") => setNotification({ message, type });
  const auth = { Authorization: `Token ${token}` };

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        axios.get(`${API}/coffee/`),
        axios.get(`${API}/categories/`),
      ]);
      setProducts(productResponse.data);
      setCategories(categoryResponse.data);
    } catch {
      setNotification({ message: "Kataloq məlumatları yüklənmədi.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchCatalog();
  }, [token, fetchCatalog]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${API}/login/`, loginData);
      localStorage.setItem("coffeeToken", response.data.token);
      setToken(response.data.token);
      notify("Roastery panelinə xoş gəlmisiniz.");
    } catch {
      notify("E-poçt və ya şifrə yanlışdır.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("coffeeToken");
    setToken("");
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...emptyProduct(),
      categoryId: categories.find((category) => category.is_active)?.id || "",
    });
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      categoryId: product.category_id || "",
      quality: product.quality?.[0] || "Medium",
      star: product.star,
      priceOptions: getPriceOptions(product),
      image: null,
    });
    setShowProductForm(true);
  };

  const updatePriceOption = (index, field, value) => {
    setProductForm((current) => ({
      ...current,
      priceOptions: current.priceOptions.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    }));
  };

  const addPriceOption = () => {
    setProductForm((current) => ({
      ...current,
      priceOptions: [...current.priceOptions, { grams: "", price: "" }],
    }));
  };

  const removePriceOption = (index) => {
    setProductForm((current) => ({
      ...current,
      priceOptions: current.priceOptions.filter((_, optionIndex) => optionIndex !== index),
    }));
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const priceOptions = productForm.priceOptions.map((option) => ({
      grams: Number(option.grams),
      price: Number(option.price),
    }));
    if (!priceOptions.length || new Set(priceOptions.map((option) => option.grams)).size !== priceOptions.length) {
      notify("Hər qram seçimi unikal olmalıdır.", "error");
      return;
    }

    const payload = new FormData();
    payload.append("name", productForm.name);
    payload.append("description", productForm.description);
    payload.append("category_id", productForm.categoryId);
    payload.append("quality", JSON.stringify([productForm.quality]));
    payload.append("star", productForm.star);
    payload.append("price_options", JSON.stringify(priceOptions));
    if (productForm.image) payload.append("img", productForm.image);

    try {
      if (editingProduct) {
        await axios.patch(`${API}/${editingProduct.id}/update/`, payload, { headers: auth });
        notify("Məhsul yeniləndi.");
      } else {
        await axios.post(`${API}/coffee/create/`, payload, { headers: auth });
        notify("Yeni məhsul kataloqa əlavə edildi.");
      }
      setShowProductForm(false);
      setProductForm(emptyProduct());
      await fetchCatalog();
    } catch (error) {
      notify(error.response?.data?.error || "Məhsul yadda saxlanmadı.", "error");
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`“${product.name}” məhsulunu silmək istəyirsiniz?`)) return;
    try {
      await axios.delete(`${API}/${product.id}/delete/`, { headers: auth });
      notify("Məhsul silindi.");
      await fetchCatalog();
    } catch {
      notify("Məhsul silinmədi.", "error");
    }
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategory());
    setShowCategoryForm(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      sortOrder: category.sort_order,
      isActive: category.is_active,
    });
    setShowCategoryForm(true);
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    const payload = {
      name: categoryForm.name,
      description: categoryForm.description,
      sort_order: Number(categoryForm.sortOrder),
      is_active: categoryForm.isActive,
    };
    try {
      if (editingCategory) {
        await axios.patch(`${API}/categories/${editingCategory.id}/update/`, payload, { headers: auth });
        notify("Kateqoriya yeniləndi.");
      } else {
        await axios.post(`${API}/categories/create/`, payload, { headers: auth });
        notify("Yeni kateqoriya yaradıldı.");
      }
      setShowCategoryForm(false);
      await fetchCatalog();
    } catch (error) {
      notify(error.response?.data?.error || "Kateqoriya yadda saxlanmadı.", "error");
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`“${category.name}” kateqoriyasını silmək istəyirsiniz?`)) return;
    try {
      await axios.delete(`${API}/categories/${category.id}/delete/`, { headers: auth });
      notify("Kateqoriya silindi.");
      await fetchCatalog();
    } catch (error) {
      notify(error.response?.data?.error || "Kateqoriya silinmədi.", "error");
    }
  };

  if (!token) {
    return (
      <main className={styles.loginPage}>
        <Notification notification={notification} onClose={() => setNotification(null)} />
        <section className={styles.loginCard}>
          <span className={styles.kicker}>Coffee Raffa · Roastery Desk</span>
          <h1>Kataloqu idarə et</h1>
          <p>Məhsullar, kateqoriyalar və qram qiymətləri bir paneldə.</p>
          <form onSubmit={handleLogin}>
            <label>E-poçt<input type="email" value={loginData.email} onChange={(event) => setLoginData({ ...loginData, email: event.target.value })} required /></label>
            <label>Şifrə<input type="password" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} required /></label>
            <button type="submit">Panelə daxil ol</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.adminPage}>
      <Notification notification={notification} onClose={() => setNotification(null)} />
      <aside className={styles.sidebar}>
        <div>
          <span className={styles.kicker}>Coffee Raffa</span>
          <h1>Roastery<br />Desk</h1>
        </div>
        <nav>
          <button type="button" className={section === "products" ? styles.activeNav : ""} onClick={() => setSection("products")}>
            <span>01</span>Məhsullar <b>{products.length}</b>
          </button>
          <button type="button" className={section === "categories" ? styles.activeNav : ""} onClick={() => setSection("categories")}>
            <span>02</span>Kateqoriyalar <b>{categories.length}</b>
          </button>
        </nav>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>Çıxış</button>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.workspaceHeader}>
          <div>
            <span className={styles.kicker}>Dinamik kataloq</span>
            <h2>{section === "products" ? "Məhsullar" : "Kateqoriyalar"}</h2>
          </div>
          <button type="button" className={styles.primaryButton} onClick={section === "products" ? openNewProduct : openNewCategory}>
            + {section === "products" ? "Yeni məhsul" : "Yeni kateqoriya"}
          </button>
        </header>

        {loading ? (
          <div className={styles.emptyState}>Kataloq yüklənir…</div>
        ) : section === "products" ? (
          <div className={styles.productGrid}>
            {products.length === 0 && <div className={styles.emptyState}>İlk məhsulunuzu əlavə etməklə başlayın.</div>}
            {products.map((product) => (
              <article className={styles.productCard} key={product.id}>
                <div className={styles.productImage}>
                  {product.img ? <img src={product.img} alt={product.name} /> : <span>CR</span>}
                  <i>{getCategoryName(product)}</i>
                </div>
                <div className={styles.productContent}>
                  <div><h3>{product.name}</h3><span>{product.quality?.join(", ")}</span></div>
                  <p>{product.description}</p>
                  <div className={styles.priceChips}>
                    {getPriceOptions(product).map((option) => (
                      <span key={option.grams}>{formatGrams(option.grams)} · {formatPrice(option.price)} ₼</span>
                    ))}
                  </div>
                  <div className={styles.cardActions}>
                    <button type="button" onClick={() => openEditProduct(product)}>Düzəliş</button>
                    <button type="button" className={styles.dangerButton} onClick={() => deleteProduct(product)}>Sil</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.categoryList}>
            {categories.length === 0 && <div className={styles.emptyState}>Məhsul yaratmazdan əvvəl ilk kateqoriyanı əlavə edin.</div>}
            {categories.map((category, index) => (
              <article key={category.id} className={styles.categoryRow}>
                <span className={styles.categoryIndex}>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{category.name}</h3><p>{category.description || "Açıqlama əlavə edilməyib."}</p></div>
                <div className={styles.categoryMeta}><b>{category.product_count}</b><span>məhsul</span></div>
                <span className={category.is_active ? styles.activePill : styles.inactivePill}>{category.is_active ? "Aktiv" : "Gizli"}</span>
                <div className={styles.cardActions}>
                  <button type="button" onClick={() => openEditCategory(category)}>Düzəliş</button>
                  <button type="button" className={styles.dangerButton} onClick={() => deleteCategory(category)}>Sil</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showProductForm && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setShowProductForm(false)}>
          <section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className={styles.kicker}>Məhsul kartı</span><h2>{editingProduct ? "Məhsulu yenilə" : "Yeni məhsul"}</h2></div><button type="button" onClick={() => setShowProductForm(false)}>×</button></header>
            <form onSubmit={submitProduct}>
              <div className={styles.formGrid}>
                <label>Məhsul adı<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
                <label>Kateqoriya<select value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })} required><option value="">Kateqoriya seçin</option>{categories.map((category) => <option key={category.id} value={category.id} disabled={!category.is_active}>{category.name}{!category.is_active ? " (gizli)" : ""}</option>)}</select></label>
                <label>Qovurma<select value={productForm.quality} onChange={(event) => setProductForm({ ...productForm, quality: event.target.value })}><option value="Light">Light</option><option value="Medium">Medium</option><option value="Dark">Dark</option></select></label>
                <label>Ulduz<input type="number" min="1" max="5" value={productForm.star} onChange={(event) => setProductForm({ ...productForm, star: Number(event.target.value) })} required /></label>
              </div>
              <label>Açıqlama<textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} required /></label>
              <div className={styles.priceEditor}>
                <div><div><span className={styles.kicker}>Qiymət pillələri</span><h3>Qram üzrə qiymətlər</h3></div><button type="button" onClick={addPriceOption}>+ Qiymət əlavə et</button></div>
                {productForm.priceOptions.map((option, index) => (
                  <div className={styles.priceRow} key={`${index}-${option.grams}`}>
                    <label>Qram<input type="number" min="1" step="1" value={option.grams} onChange={(event) => updatePriceOption(index, "grams", event.target.value)} required /></label>
                    <label>Qiymət (₼)<input type="number" min="0" step="0.01" value={option.price} onChange={(event) => updatePriceOption(index, "price", event.target.value)} required /></label>
                    <button type="button" onClick={() => removePriceOption(index)} disabled={productForm.priceOptions.length === 1}>Sil</button>
                  </div>
                ))}
              </div>
              <label>Məhsul şəkli<input type="file" accept="image/*" onChange={(event) => setProductForm({ ...productForm, image: event.target.files?.[0] || null })} /><small>{editingProduct ? "Boş saxlasanız mövcud şəkil qalacaq." : "Şəkli sonra da əlavə edə bilərsiniz."}</small></label>
              <footer><button type="button" onClick={() => setShowProductForm(false)}>İmtina</button><button type="submit" className={styles.primaryButton}>Yadda saxla</button></footer>
            </form>
          </section>
        </div>
      )}

      {showCategoryForm && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setShowCategoryForm(false)}>
          <section className={`${styles.modal} ${styles.categoryModal}`} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className={styles.kicker}>Kataloq strukturu</span><h2>{editingCategory ? "Kateqoriyanı yenilə" : "Yeni kateqoriya"}</h2></div><button type="button" onClick={() => setShowCategoryForm(false)}>×</button></header>
            <form onSubmit={submitCategory}>
              <label>Kateqoriya adı<input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="Moka Pot Coffee" required /></label>
              <label>Açıqlama<textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="Bu kateqoriyada hansı məhsullar görünəcək?" /></label>
              <div className={styles.formGrid}>
                <label>Sıralama<input type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })} /></label>
                <label className={styles.checkLabel}><input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })} />Saytda aktiv göstər</label>
              </div>
              <footer><button type="button" onClick={() => setShowCategoryForm(false)}>İmtina</button><button type="submit" className={styles.primaryButton}>Yadda saxla</button></footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};

export default AdminPage;
