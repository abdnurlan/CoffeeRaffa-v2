import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./ProductShop.module.css";
import { useDispatch } from "react-redux";
import { addToCart } from "../../features/cartSlice";
import { API_data } from "../../data/data.jsx";

const ProductShop = () => {
  const [displayCount, setDisplayCount] = useState(8);
  const [data, setData] = useState([]);
  const [cartButtons, setCartButtons] = useState([]);
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const fetchedData = await API_data();
        setData(fetchedData);
        setCartButtons(Array(fetchedData.length).fill(false));
      } catch (error) {
        setError(error);
      }
    };
    getData();
  }, []);

  const handleAddToCart = (product, index) => {
    dispatch(addToCart(product));
    const newCartButtons = [...cartButtons];
    newCartButtons[index] = true;
    setCartButtons(newCartButtons);
    setCartOpen(true);
  };

  const renderStars = (rating) => {
    const totalStars = 5;
    const filledStars = Math.floor(rating);
    const starFilled = "★";
    const starEmpty = "☆";

    return (
      <div className={styles.stars}>
        {[...Array(totalStars)].map((_, index) => (
          <span
            key={index}
            role="img"
            aria-label={index < filledStars ? "filled-star" : "empty-star"}
          >
            {index < filledStars ? starFilled : starEmpty}
          </span>
        ))}
      </div>
    );
  };


  return (
    <div className="container" id="products">
      <div className={styles.shop_container}>
        <div className={styles.header}>
          <div className={styles.header_h6}>
            <h6>Onlayn Mağaza</h6>
          </div>
          <div className={styles.header_h3}>
            <h3 className="display-font">Məhsullarımız</h3>
          </div>
        </div>
        <div className={styles.products_list}>
          {data.slice(0, displayCount).map((product, index) => (
            <div key={product.id} className={styles.product}>
              <div className={styles.product_img_container}>
                <img src={product.img} alt={product.name} />
                <div className={styles.product_shadow}></div>
                {cartButtons[index] ? (
                  <Link to="/basket" className={styles.hover_btn}>
                    Səbətə bax
                  </Link>
                ) : (
                  <div
                    className={styles.hover_btn}
                    onClick={() => handleAddToCart(product, index)}
                  >
                    Səbətə əlavə et
                  </div>
                )}
              </div>
              <div className={styles.product_info}>
                {renderStars(product.star)}
                <h3>{product.name}</h3>
                {cartButtons[index] ? (
                  <Link to="/basket" className={styles.hover_btn_mobile}>
                    Səbətə bax
                  </Link>
                ) : (
                  <div
                    className={styles.hover_btn_mobile}
                    onClick={() => handleAddToCart(product, index)}
                  >
                    Səbətə əlavə et
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {data.length > displayCount && (
          <Link to="/products" className={styles.button}>
            Daha çox göstər
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductShop;
