import React, { useState, useEffect, useRef } from 'react';
import styles from './Statistics.module.css';

const Statistics = () => {
  const targets = [18, 35, 24];
  const duration = 1500;

  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState(Array(targets.length).fill(0));
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      startCountAnimation();
    }
  }, [isVisible]);

  const startCountAnimation = () => {
    const start = Date.now();
    const timer = setInterval(() => {
      const delta = Math.min(1, (Date.now() - start) / duration);
      setCounts(
        targets.map((target) => Math.round(target * delta))
      );
      if (delta === 1) clearInterval(timer);
    }, 10);
  };

  const statisticNames = [
    'Seçilmiş Çeşidlər',
    "Hektarlarla plantasiyalar",
    "İstehsalçı ölkələr"
  ];

  return (
    <div ref={ref} className={styles.bg}>
      <div className={styles.green_bg}>
        <div className="container">
          <div className={styles.statistics}>
            {counts.map((count, index) => (
              <div key={index} className={styles.statistics_values}>
                <div className={styles.statistics_count}>
                  <h2>{count}</h2>
                </div>
                <div className={styles.statistics_name}>
                  <h3>{statisticNames[index]}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
