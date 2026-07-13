import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../../features/cartSlice";
import { API_data } from "../../data/data.jsx";
import styles from "./ProductsPage.module.css";

const ProductsPage = () => {
    const [data, setData] = useState([]);
    const [cartButtons, setCartButtons] = useState([]);
    const dispatch = useDispatch();
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
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
        setCartButtons((prev) => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
        });
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
        <div className={styles.page_wrapper}>
            <div className={styles.hero_section}>
                <div className="container">
                    <div className={styles.hero_content}>
                        <h1>Bütün Məhsullarımız</h1>
                        <p>Təzə qovrulmuş, premium keyfiyyətli qəhvə dənələri</p>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className={styles.products_grid}>
                    {data.map((product, index) => (
                        <div key={product.id} className={styles.product_card}>
                            <div className={styles.image_container}>
                                <img src={product.img} alt={product.name} />
                                <div className={styles.overlay}>
                                    {cartButtons[index] ? (
                                        <Link to="/basket" className={styles.cart_btn}>
                                            Səbətə bax
                                        </Link>
                                    ) : (
                                        <button
                                            className={styles.cart_btn}
                                            onClick={() => handleAddToCart(product, index)}
                                        >
                                            Səbətə əlavə et
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className={styles.info}>
                                {renderStars(product.star)}
                                <h3>{product.name}</h3>
                                {cartButtons[index] ? (
                                    <Link to="/basket" className={styles.mobile_btn}>
                                        Səbətə bax
                                    </Link>
                                ) : (
                                    <button
                                        className={styles.mobile_btn}
                                        onClick={() => handleAddToCart(product, index)}
                                    >
                                        Səbətə əlavə et
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
