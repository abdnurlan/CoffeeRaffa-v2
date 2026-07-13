import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AdminPage.module.css";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <p>{message}</p>
      <button className={styles.closeNotification} onClick={onClose}>
        ×
      </button>
    </div>
  );
};

const AdminPage = () => {
  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCoffee, setSelectedCoffee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create or edit

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quality, setQuality] = useState(["Medium"]);
  const [prices, setPrices] = useState({
    "0.250kg": 0,
    "0.500kg": 0,
    "1kg": 0,
  });
  const [star, setStar] = useState(5);
  const [image, setImage] = useState(null);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success", // success, error, warning
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchCoffees();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const storedToken = localStorage.getItem("coffeeToken");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification({
      ...notification,
      show: false,
    });
  };

  const fetchCoffees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://api.coffeeraffa.az/api/coffee/",
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setCoffees(response.data);
    } catch (error) {
      console.error("Error fetching coffees:", error);
      showNotification("Qəhvə məlumatları yüklənərkən xəta baş verdi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://api.coffeeraffa.az/api/login/",
        loginData
      );
      const receivedToken = response.data.token;
      setToken(receivedToken);
      localStorage.setItem("coffeeToken", receivedToken);
      setIsLoggedIn(true);
      showNotification("Uğurla giriş edildi", "success");
    } catch (error) {
      console.error("Login failed:", error);
      showNotification(
        "Giriş uğursuz oldu! Zəhmət olmasa məlumatlarınızı yoxlayın.",
        "error"
      );
    }
  };

  const handleLogout = () => {
    setToken("");
    setIsLoggedIn(false);
    localStorage.removeItem("coffeeToken");
    showNotification("Hesabdan çıxış edildi", "success");
  };

  const handlePriceChange = (size, value) => {
    setPrices({
      ...prices,
      [size]: parseFloat(value),
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setQuality(["Medium"]);
    setPrices({
      "0.250kg": 0,
      "0.500kg": 0,
      "1kg": 0,
    });
    setStar(5);
    setImage(null);
    setSelectedCoffee(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setFormMode("create");
    setShowForm(true);
  };

  const handleEditClick = (coffee) => {
    setSelectedCoffee(coffee);
    setName(coffee.name);
    setDescription(coffee.description);
    setQuality(coffee.quality);
    setPrices(coffee.prices);
    setStar(coffee.star);
    setFormMode("edit");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("quality", JSON.stringify(quality));
    formData.append("prices", JSON.stringify(prices));
    formData.append("star", star);

    if (image) {
      formData.append("img", image);
    }

    try {
      if (formMode === "create") {
        await axios.post(
          "https://api.coffeeraffa.az/api/coffee/create/",
          formData,
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showNotification("Qəhvə uğurla əlavə edildi!", "success");
      } else {
        await axios.patch(
          `https://api.Coffeeraffa.az/api/${selectedCoffee.id}/update/`,
          formData,
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showNotification("Qəhvə uğurla yeniləndi!", "success");
      }

      fetchCoffees();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      showNotification(
        "Xəta baş verdi! Zəhmət olmasa yenidən cəhd edin.",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bu qəhvəni silmək istədiyinizdən əminsiniz?")) {
      try {
        await axios.delete(`https://api.Coffeeraffa.az/api/${id}/delete/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        showNotification("Qəhvə uğurla silindi!", "success");
        fetchCoffees();
      } catch (error) {
        console.error("Error deleting coffee:", error);
        showNotification("Silmə zamanı xəta baş verdi!", "error");
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.adminLoginContainer}>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={hideNotification}
          />
        )}
        <div className={styles.adminLoginForm}>
          <h2>Admin Giriş</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>E-poçt</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Şifrə</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" className={styles.loginButton}>
              Giriş
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <div className={styles.adminHeader}>
        <h1>Coffee Raffa Admin Panel</h1>
        <div className={styles.adminActions}>
          <button onClick={handleCreateClick} className={styles.createButton}>
            Yeni Qəhvə Əlavə Et
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Çıxış
          </button>
        </div>
      </div>

      {!showForm ? (
        <div className={styles.coffeeManagement}>
          {loading ? (
            <p>Yüklənir...</p>
          ) : (
            <div className={styles.coffeeList}>
              <h2>Qəhvə Siyahısı</h2>
              <table className={styles.coffeeTable}>
                <thead>
                  <tr>
                    <th>Şəkil</th>
                    <th>Ad</th>
                    <th>Keyfiyyət</th>
                    <th>Qiymətlər</th>
                    <th>Ulduz</th>
                    <th>Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {coffees.map((coffee) => (
                    <tr key={coffee.id}>
                      <td>
                        <img
                          src={coffee.img}
                          alt={coffee.name}
                          className={styles.coffeeThumbnail}
                        />
                      </td>
                      <td>{coffee.name}</td>
                      <td>{coffee.quality.join(", ")}</td>
                      <td>
                        {Object.entries(coffee.prices).map(([size, price]) => (
                          <div key={size}>
                            {size}: {price} AZN
                          </div>
                        ))}
                      </td>
                      <td>{coffee.star}</td>
                      <td>
                        <button
                          onClick={() => handleEditClick(coffee)}
                          className={styles.editButton}
                        >
                          Düzəliş Et
                        </button>
                        <button
                          onClick={() => handleDelete(coffee.id)}
                          className={styles.deleteButton}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.coffeeFormContainer}>
          <h2>
            {formMode === "create"
              ? "Yeni Qəhvə Əlavə Et"
              : "Qəhvə Məlumatlarını Yenilə"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Ad</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Açıqlama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Keyfiyyət</label>
              <select
                value={quality[0]}
                onChange={(e) => setQuality([e.target.value])}
              >
                <option value="Light">Light</option>
                <option value="Medium">Medium</option>
                <option value="Dark">Dark</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Qiymətlər</label>
              <div className={styles.pricesInputs}>
                <div>
                  <label>0.250kg:</label>
                  <input
                    type="number"
                    value={prices["0.250kg"]}
                    onChange={(e) =>
                      handlePriceChange("0.250kg", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label>0.500kg:</label>
                  <input
                    type="number"
                    value={prices["0.500kg"]}
                    onChange={(e) =>
                      handlePriceChange("0.500kg", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label>1kg:</label>
                  <input
                    type="number"
                    value={prices["1kg"]}
                    onChange={(e) => handlePriceChange("1kg", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Ulduz (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={star}
                onChange={(e) => setStar(parseInt(e.target.value))}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Şəkil</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
                {...(formMode === "create" ? { required: true } : {})}
              />
              {formMode === "edit" && selectedCoffee && (
                <div className={styles.currentImage}>
                  <p>Mövcud şəkil:</p>
                  <img
                    src={selectedCoffee.img}
                    alt={selectedCoffee.name}
                    className={styles.coffeePreview}
                  />
                </div>
              )}
            </div>

            <div className={styles.formButtons}>
              <button type="submit" className={styles.submitButton}>
                {formMode === "create" ? "Əlavə Et" : "Yenilə"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={styles.cancelButton}
              >
                İmtina
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
