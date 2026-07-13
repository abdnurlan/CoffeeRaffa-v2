import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaBagShopping } from "react-icons/fa6";
import styles from "./FloatingBasket.module.css";

const FloatingBasket = () => {
    const { cartTotalQuantity } = useSelector((state) => state.cart);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    if (!isVisible) return null;

    return (
        <Link to="/basket" className={styles.floating_basket}>
            <div className={styles.icon_container}>
                <FaBagShopping />
                <div className={styles.badge}>{cartTotalQuantity}</div>
            </div>
        </Link>
    );
};

export default FloatingBasket;
