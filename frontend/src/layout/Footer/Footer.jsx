import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";
import Logo from "/assets/kaffa_logo.png";
import { FaFacebook, FaInstagram, FaLocationDot, FaPhoneVolume, FaYoutube } from "react-icons/fa6";

const Footer = () => {
  return (
    <div className={styles.footer_bg} id="contact">
      <div className="container">
        <div className={styles.footer_section}>
          <div className={styles.footer_social}>
            <Link to="/">
              <div className={styles.footer_img}>
                <img src="/assets/kaffa_logo.png" alt="logo" />
              </div>
            </Link>
            <div className={styles.footer_text}>
              <p>
                {" "}
                Siz də yeni qovrulmuş qəhvəni dadın! Öz Qovurmamız – Öz
                dadımız...!
              </p>
            </div>
            <div className={styles.social_icons}>
              <a
                href="https://www.youtube.com/@elnurtarverdiyev3941"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaYoutube />
              </a>
              <a
                href="https://www.instagram.com/coffee.raffa/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61561011951111&mibextid=ZbWKwL"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebook />
              </a>
            </div>
          </div>
          <div className={styles.contact_info}>
            <div className={styles.contact_info_header}>Əlaqə</div>
            <div className={styles.contact_info_location}>
              <div className={styles.location_icon}>
                <FaLocationDot />
              </div>
              <div className={styles.location_link}>
                <h3>Ünvan : </h3>
                <h3>Bakı şəhəri, Nərimanov rayonu., Daş karxanası küç. 154</h3>
              </div>
            </div>
            <div className={styles.contact_phones}>
              <div className={styles.contact_phones_icon}>
                <FaPhoneVolume />
              </div>
              <div className={styles.contact_phones_link}>
                <h3>Telefon : </h3>
                <h3 className={styles.contact_phones_number}>
                  +994 50 888 20 60
                </h3>
                <h3 className={styles.contact_phones_number}>
                  +994 55 888 20 60
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.footer_copyright}>
        <div className="container">
          <h6 className={styles.copyright_text}>
            Copyright © 2026 | Nurlan Abdullayev
          </h6>
        </div>
      </div>
    </div>
  );
};

export default Footer;
