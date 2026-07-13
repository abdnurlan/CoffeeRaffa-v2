import React, { useEffect } from "react";
import styles from "./Basket.module.css";
import { Link } from "react-router-dom";
import { FaBagShopping, FaPhoneVolume } from "react-icons/fa6";
import Logo from "/assets/kaffa_logo.png";
import BasketHeader from "./BasketHeader";
import { useSelector, useDispatch } from "react-redux";
import { getTotals } from "../../features/cartSlice";

const BasketNavbar = () => {
  const { cartTotalQuantity } = useSelector((state) => state.cart);
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTotals());
  }, [cart]);

  return (
    <div className={styles.basket_navbar_bg}>
      <div className={styles.black_bg}>
        <div className="container">
          <div className={styles.basket_navbar}>
            <Link to="/">
              <div className={styles.navbar_logo}>
                <img src="/assets/kaffa_logo.png" alt="logo" />
              </div>
            </Link>
            <div className={styles.phone}>
              <FaPhoneVolume />
              <h4>+994 50(55) 888 20 60</h4>
            </div>
            <div className={styles.navbar_basket}>
              <div className={styles.product_counter}>
                <span>{cartTotalQuantity}</span>
              </div>
              <Link to="/basket">
                <div className={styles.navbar_basket_icon}>
                  <FaBagShopping />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <BasketHeader />
    </div>
  );
};

export default BasketNavbar;
